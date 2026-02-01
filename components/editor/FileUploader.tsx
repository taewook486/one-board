'use client';

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  progress?: number;
}

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  memberId?: number;
  postId?: number;
  commentId?: number;
  isTemp?: boolean;
  onFilesUploaded?: (files: UploadedFile[]) => void;
  className?: string;
}

// File type categories for icon selection
const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  SPREADSHEET: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  ARCHIVE: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  VIDEO: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
};

const getFileCategory = (type: string): string => {
  for (const [category, types] of Object.entries(FILE_TYPES)) {
    if (types.some(t => type.includes(t))) return category;
  }
  return 'OTHER';
};

export default function FileUploader({
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.7z',
  multiple = true,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  memberId,
  postId,
  commentId,
  isTemp = false,
  onFilesUploaded,
  className = '',
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [id: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    validateAndUploadFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndUploadFiles(files);
  };

  const validateAndUploadFiles = async (files: File[]) => {
    // Check max files
    const totalFiles = uploadedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed. You have ${uploadedFiles.length} uploaded.`);
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast.error(`${file.name} exceeds ${formatFileSize(maxFileSize)} limit.`);
        return;
      }
    }

    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileId = `upload-${Date.now()}-${index}`;

        // Initialize progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        const formData = new FormData();
        formData.append('file', file);

        if (memberId) formData.append('memberId', memberId.toString());
        if (postId) formData.append('postId', postId.toString());
        if (commentId) formData.append('commentId', commentId.toString());
        formData.append('isTemp', isTemp.toString());

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileId] || 0;
            if (currentProgress >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [fileId]: currentProgress + 10 };
          });
        }, 150);

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Upload failed');
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || 'Upload failed');
          }

          return {
            id: fileId,
            name: data.fileName || file.name,
            url: data.fileUrl,
            size: file.size,
            type: file.type,
            progress: 100,
          };
        } catch (error) {
          throw error;
        }
      });

      const uploaded = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploaded]);

      if (onFilesUploaded) {
        onFilesUploaded([...uploadedFiles, ...uploaded]);
      }

      toast.success(`${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      if (onFilesUploaded) {
        onFilesUploaded(newFiles);
      }
      return newFiles;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // SVG Icons for different file types
  const FileIcons = {
    IMAGE: (
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="image-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="8" fill="url(#image-grad)" />
        <path d="M14 32l6-8 4 5 6-8 8 11H14z" fill="white" />
        <circle cx="20" cy="18" r="3" fill="white" />
      </svg>
    ),
    DOCUMENT: (
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="doc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="8" fill="url(#doc-grad)" />
        <path d="M14 13h20v4H14zM14 21h20v3H14zM14 28h14v3H14zM14 35h18v3H14z" fill="white" />
      </svg>
    ),
    SPREADSHEET: (
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="sheet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="8" fill="url(#sheet-grad)" />
        <path d="M14 12h8v6h-8zM24 12h10v6H24zM14 20h8v6h-8zM24 20h10v6H24zM14 28h8v6h-8zM24 28h10v6H24zM14 36h8v6h-8zM24 36h10v6H24z" fill="white" />
      </svg>
    ),
    ARCHIVE: (
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="archive-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="8" fill="url(#archive-grad)" />
        <rect x="16" y="12" width="16" height="8" rx="2" fill="white" fillOpacity="0.4" />
        <rect x="16" y="14" width="16" height="4" rx="1" fill="white" />
        <rect x="12" y="22" width="24" height="14" rx="3" fill="white" />
      </svg>
    ),
    AUDIO: (
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="audio-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="8" fill="url(#audio-grad)" />
        <circle cx="24" cy="24" r="8" fill="white" />
        <circle cx="24" cy="24" r="4" fill="url(#audio-grad)" />
      </svg>
    ),
    VIDEO: (
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="video-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="8" fill="url(#video-grad)" />
        <polygon points="20,16 32,24 20,32" fill="white" />
      </svg>
    ),
    OTHER: (
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="other-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="8" fill="url(#other-grad)" />
        <path d="M14 16h20v16H14z" fill="white" fillOpacity="0.3" />
        <path d="M18 20l8 6-8 6V20z" fill="white" />
      </svg>
    ),
  };

  const getFileIcon = (type: string) => {
    const category = getFileCategory(type);
    return FileIcons[category as keyof typeof FileIcons] || FileIcons.OTHER;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative group cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'transform scale-[1.02]'
            : 'hover:transform hover:scale-[1.01]'
        }`}
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

        {/* Upload Zone */}
        <div
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
            dragActive
              ? 'bg-gradient-to-br from-violet-100 via-pink-100 to-rose-100 border-violet-400'
              : uploading
              ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
              : 'bg-white border-gray-300 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-100/50'
          }`}
        >
          {/* Animated Background Pattern (visible on drag/hover) */}
          {(dragActive || (!uploading)) && (
            <div
              className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${
                dragActive || true ? 'opacity-100' : ''
              }`}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <pattern
                  id="dot-pattern"
                  patternUnits="userSpaceOnUse"
                  width="10"
                  height="10"
                >
                  <circle
                    cx="1"
                    cy="1"
                    r="0.5"
                    fill={dragActive ? '#8B5CF6' : '#E5E7EB'}
                  />
                </pattern>
                <rect width="100%" height="100%" fill="url(#dot-pattern)" />
              </svg>
            </div>
          )}

          {/* Content */}
          <div className="relative p-8 md:p-12 text-center">
            {uploading ? (
              <div className="space-y-4">
                {/* Animated Loader */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-violet-200 rounded-full"></div>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-700">
                  Uploading files...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Animated Icon */}
                <div className={`transition-transform duration-500 ${
                  dragActive ? 'scale-110 rotate-6' : 'hover:scale-105'
                }`}>
                  <svg
                    className="w-20 h-20 mx-auto"
                    viewBox="0 0 80 80"
                    fill="none"
                  >
                    <defs>
                      <linearGradient
                        id="upload-grad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="50%" stopColor="#EC4899" />
                        <stop offset="100%" stopColor="#F97316" />
                      </linearGradient>
                    </defs>
                    <rect
                      x="24"
                      y="16"
                      width="32"
                      height="40"
                      rx="4"
                      fill="url(#upload-grad)"
                    />
                    <path
                      d="M32 36l8-8 8 8"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M40 28v24"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="56" cy="24" r="8" fill="#10B981" />
                    <path
                      d="M56 20v8M52 24h8"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-xl font-bold bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                    Drop your files here
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to browse
                  </p>
                </div>

                {/* File type hints */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {['Images', 'Documents', 'Archives', 'PDFs'].map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {/* Limits */}
                <p className="text-xs text-gray-400 mt-4">
                  Max {maxFiles} files • Up to {formatFileSize(maxFileSize)} each
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-violet-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Attached Files ({uploadedFiles.length}/{maxFiles})
            </h3>
          </div>

          <div className="grid gap-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.id}
                className="group relative overflow-hidden rounded-xl bg-white border-2 border-gray-100 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/30 transition-all duration-300"
                style={{
                  animation: `slideIn 0.4s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Progress Bar Overlay */}
                {uploadProgress[file.id] !== undefined && uploadProgress[file.id] < 100 && (
                  <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                    <div className="w-full px-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">Uploading...</span>
                        <span className="text-xs font-bold text-violet-600">
                          {uploadProgress[file.id]}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress[file.id]}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* File Card */}
                <div className="flex items-center gap-4 p-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-md group-hover:scale-110 transition-transform duration-300">
                    {getFileIcon(file.type)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 font-medium">
                        {formatFileSize(file.size)}
                      </span>
                      {file.progress === 100 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    disabled={uploading}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
                    title="Remove file"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Export types for use in other components
export type { UploadedFile };
