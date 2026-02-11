import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { createFile } from '@/lib/db/files';
import { validateFileType, validateFileSize, sanitizeFilename } from '@/lib/utils/security';
import { config } from '@/lib/config';
import type { NewPostFile } from '@/lib/db/schema';

// Vercel Blob Storage (production)
let put: any;
let blobAvailable = false;

if (process.env.BLOB_READ_WRITE_TOKEN) {
  try {
    const blob = require('@vercel/blob');
    put = blob.put;
    blobAvailable = true;
  } catch (e) {
    console.warn('Vercel Blob not available, using local filesystem');
  }
}

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

    // Process image and get buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Process image (resize if needed)
    let width: number | undefined;
    let height: number | undefined;
    let thumbnailBuffer: Uint8Array | undefined;

    if (isImage) {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      width = metadata.width;
      height = metadata.height;

      // Resize large images
      if (width && width > config.upload.imageMaxWidth) {
        const resizedBuffer = await sharp(buffer)
          .resize(config.upload.imageMaxWidth, null, {
            withoutEnlargement: true,
            fit: 'inside',
          })
          .toBuffer();

        buffer = Buffer.from(resizedBuffer);

        // Update metadata
        const resizedMetadata = await sharp(buffer).metadata();
        width = resizedMetadata.width;
        height = resizedMetadata.height;
      }

      // Create thumbnail
      if (width && height) {
        const thumbBuffer = await sharp(buffer)
          .resize(config.upload.thumbnailSize, config.upload.thumbnailSize, {
            fit: 'cover',
          })
          .toBuffer();
        thumbnailBuffer = new Uint8Array(thumbBuffer);
      }
    }

    let filePath: string;
    let thumbnailPath: string | undefined;

    if (blobAvailable && process.env.NODE_ENV === 'production') {
      // Production: Use Vercel Blob Storage
      const now = new Date();
      const blobPath = `uploads/${isImage ? 'images' : 'files'}/${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}/${storedName}`;

      // Upload main file
      await put(blobPath, buffer, {
        access: 'public',
        contentType: mimeType,
      });

      filePath = blobPath;

      // Upload thumbnail if exists
      if (thumbnailBuffer) {
        const thumbnailBlobPath = `uploads/${isImage ? 'images' : 'files'}/${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}/thumb_${storedName}`;
        await put(thumbnailBlobPath, thumbnailBuffer, {
          access: 'public',
          contentType: mimeType,
        });
        thumbnailPath = thumbnailBlobPath;
      }
    } else {
      // Development: Use local filesystem
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

      const localFilePath = path.join(uploadDir, storedName);
      const relativePath = path.relative(process.cwd(), localFilePath);

      // Save file
      await fs.writeFile(localFilePath, buffer);
      filePath = relativePath.replace(/\\/g, '/');

      // Save thumbnail if exists
      if (thumbnailBuffer) {
        const thumbnailName = `thumb_${storedName}`;
        const thumbnailFullPath = path.join(uploadDir, thumbnailName);
        const thumbnailRelativePath = path.relative(process.cwd(), thumbnailFullPath);
        await fs.writeFile(thumbnailFullPath, thumbnailBuffer);
        thumbnailPath = thumbnailRelativePath.replace(/\\/g, '/');
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
      filePath,
      fileSize: file.size,
      mimeType,
      width,
      height,
      thumbnailPath,
      isTemp: options?.isTemp ?? true,
    };

    const newFile = await createFile(fileData);

    // Generate URL
    const url = blobAvailable && process.env.NODE_ENV === 'production'
      ? filePath // Blob Storage returns the URL directly
      : `/${filePath}`;

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

    // Delete from Blob Storage or filesystem
    if (blobAvailable && process.env.NODE_ENV === 'production' && file.filePath.startsWith('uploads/')) {
      const { del } = require('@vercel/blob');
      await del(file.filePath);
      if (file.thumbnailPath) {
        await del(file.thumbnailPath);
      }
    } else {
      // Local filesystem
      const fullPath = path.join(process.cwd(), file.filePath);
      try {
        await fs.unlink(fullPath);
      } catch (e) {
        console.warn('Failed to delete file from filesystem:', e);
      }
      if (file.thumbnailPath) {
        const thumbnailFullPath = path.join(process.cwd(), file.thumbnailPath);
        try {
          await fs.unlink(thumbnailFullPath);
        } catch (e) {
          console.warn('Failed to delete thumbnail from filesystem:', e);
        }
      }
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
