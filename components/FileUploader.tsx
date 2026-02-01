'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  memberId?: number;
  postId?: number;
  commentId?: number;
  isTemp?: boolean;
  onFilesUploaded?: (files: UploadedFile[]) => void;
  className?: string;
}

export default function FileUploader({
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt',
  multiple = false,
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  memberId,
  postId,
  commentId,
  isTemp = false,
  onFilesUploaded,
  className = '',
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndUploadFiles(files);
  };

  const validateAndUploadFiles = async (files: File[]) => {
    // Check max files
    if (files.length > maxFiles) {
      toast.error(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
      return;
    }

    // Check total files (including already uploaded)
    const totalFiles = uploadedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      toast.error(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다. 현재 ${uploadedFiles.length}개 업로드됨.`);
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast.error(`${file.name} 파일 크기가 ${formatFileSize(maxFileSize)}를 초과했습니다.`);
        return;
      }
    }

    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      if (memberId) formData.append('memberId', memberId.toString());
      if (postId) formData.append('postId', postId.toString());
      if (commentId) formData.append('commentId', commentId.toString());
      formData.append('isTemp', isTemp.toString());

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '파일 업로드에 실패했습니다.');
      }

      if (!data.success) {
        throw new Error(data.error || '파일 업로드에 실패했습니다.');
      }

      // Add uploaded files to state
      const newFiles: UploadedFile[] = data.results.map((result: any, index: number) => ({
        id: Date.now() + index,
        name: result.name || files[index]?.name || '',
        url: result.url,
        size: files[index]?.size || 0,
        type: files[index]?.type || '',
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      if (onFilesUploaded) {
        onFilesUploaded([...uploadedFiles, ...newFiles]);
      }

      toast.success(`${newFiles.length}개 파일이 업로드되었습니다.`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== id);
      if (onFilesUploaded) {
        onFilesUploaded(newFiles);
      }
      return newFiles;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    validateAndUploadFiles(files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">
              업로드 중... {progress}%
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📤</div>
            <p className="text-sm font-medium text-gray-700">
              클릭하거나 파일을 드래그하여 업로드
            </p>
            <p className="text-xs text-gray-500">
              최대 {maxFiles}개, 각 파일 최대 {formatFileSize(maxFileSize)}
            </p>
            <p className="text-xs text-gray-400">
              {accept.replace(/,/g, ' / ')}
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            업로드된 파일 ({uploadedFiles.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  disabled={uploading}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="파일 삭제"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export types for use in other components
export type { UploadedFile };
