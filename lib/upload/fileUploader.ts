import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { createFile } from '@/lib/db/files';
import { validateFileType, validateFileSize, sanitizeFilename } from '@/lib/utils/security';
import { config } from '@/lib/config';
import type { NewPostFile } from '@/lib/db/schema';

export interface UploadResult {
  success: boolean;
  file?: NewPostFile;
  error?: string;
  url?: string;
}

/**
 * Upload a file
 */
export async function uploadFile(
  file: File,
  options?: {
    postId?: number;
    commentId?: number;
    memberId?: number;
    isTemp?: boolean;
  }
): Promise<UploadResult> {
  try {
    // Validate file size
    if (!validateFileSize(file.size, config.upload.maxSize)) {
      return {
        success: false,
        error: `파일 크기가 제한을 초과했습니다 (최대 ${config.upload.maxSize} bytes)`,
      };
    }

    // Get MIME type
    const mimeType = file.type || getMimeTypeFromFilename(file.name);

    // Validate file type
    const isImage = mimeType.startsWith('image/');
    const allowedExtensions = isImage
      ? ['jpg', 'jpeg', 'png', 'gif', 'webp']
      : config.upload.allowedFileTypes;

    if (!validateFileType(mimeType, allowedExtensions)) {
      return {
        success: false,
        error: '허용되지 않는 파일 형식입니다.',
      };
    }

    // Sanitize filename
    const originalName = sanitizeFilename(file.name);

    // Generate stored filename
    const extension = path.extname(originalName).toLowerCase();
    const randomString = Math.random().toString(36).substring(2, 15);
    const storedName = `${Date.now()}_${randomString}${extension}`;

    // Create upload directory
    const now = new Date();
    const uploadDir = path.join(
      process.cwd(),
      config.upload.uploadPath,
      isImage ? 'images' : 'files',
      now.getFullYear().toString(),
      (now.getMonth() + 1).toString(),
      now.getDate().toString()
    );

    await fs.mkdir(uploadDir, { recursive: true });

    // File path
    const filePath = path.join(uploadDir, storedName);
    const relativePath = path.relative(process.cwd(), filePath);

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    // Process image (resize if needed)
    let width: number | undefined;
    let height: number | undefined;
    let thumbnailPath: string | undefined;

    if (isImage) {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      width = metadata.width;
      height = metadata.height;

      // Resize large images
      if (width && width > config.upload.imageMaxWidth) {
        const resizedPath = path.join(uploadDir, `resized_${storedName}`);
        await sharp(buffer)
          .resize(config.upload.imageMaxWidth, null, {
            withoutEnlargement: true,
            fit: 'inside',
          })
          .toFile(resizedPath);

        // Replace original with resized
        await fs.unlink(filePath);
        await fs.rename(resizedPath, filePath);

        // Update metadata
        const resizedMetadata = await sharp(filePath).metadata();
        width = resizedMetadata.width;
        height = resizedMetadata.height;
      }

      // Create thumbnail
      if (width && height) {
        const thumbnailName = `thumb_${storedName}`;
        const thumbnailFullPath = path.join(uploadDir, thumbnailName);
        const thumbnailRelativePath = path.relative(process.cwd(), thumbnailFullPath);

        await sharp(filePath)
          .resize(config.upload.thumbnailSize, config.upload.thumbnailSize, {
            fit: 'cover',
          })
          .toFile(thumbnailFullPath);

        thumbnailPath = thumbnailRelativePath;
      }
    }

    // Create file record
    const fileData: NewPostFile = {
      postId: options?.postId || null,
      commentId: options?.commentId || null,
      memberId: options?.memberId || null,
      fileType: isImage ? 'image' : 'file',
      originalName,
      storedName,
      filePath: relativePath,
      fileSize: file.size,
      mimeType,
      width,
      height,
      thumbnailPath,
      isTemp: options?.isTemp ?? true,
    };

    const newFile = await createFile(fileData);

    // Generate URL
    const url = `/${relativePath.replace(/\\/g, '/')}`;

    return {
      success: true,
      file: fileData,
      url,
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: '파일 업로드 중 오류가 발생했습니다.',
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  options?: {
    postId?: number;
    commentId?: number;
    memberId?: number;
    isTemp?: boolean;
    maxFiles?: number;
  }
): Promise<{ results: UploadResult[]; successCount: number; failCount: number }> {
  const { maxFiles = 10 } = options || {};

  if (files.length > maxFiles) {
    return {
      results: [],
      successCount: 0,
      failCount: files.length,
    };
  }

  const results = await Promise.all(
    files.map((file) => uploadFile(file, options))
  );

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return {
    results,
    successCount,
    failCount,
  };
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: number): Promise<boolean> {
  try {
    const { deleteFile: deleteDbFile, findFileById } = await import('@/lib/db/files');
    const file = await findFileById(fileId);

    if (!file) {
      return false;
    }

    await deleteDbFile(fileId);
    return true;
  } catch (error) {
    console.error('File delete error:', error);
    return false;
  }
}

/**
 * Validate uploaded file
 */
export function validateUploadedFile(
  file: File,
  allowedTypes: string[] = []
): { valid: boolean; error?: string } {
  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: '파일이 비어있습니다.' };
  }

  // Get MIME type
  const mimeType = file.type || getMimeTypeFromFilename(file.name);

  // Validate file type
  if (allowedTypes.length > 0) {
    const isAllowed = allowedTypes.includes(mimeType);
    if (!isAllowed) {
      return {
        valid: false,
        error: `허용되지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get MIME type from filename
 */
function getMimeTypeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return '🖼️';
  }

  if (mimeType === 'application/pdf') {
    return '📄';
  }

  if (mimeType.includes('word')) {
    return '📝';
  }

  if (mimeType.includes('excel')) {
    return '📊';
  }

  if (mimeType.includes('zip') || mimeType.includes('rar')) {
    return '📦';
  }

  return '📁';
}
