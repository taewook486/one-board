import { eq, and, desc, count, asc, sql } from 'drizzle-orm';
import { db } from './index';
import { postFiles, type PostFile, type NewPostFile } from './schema';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

// Validation schemas
export const createFileSchema = z.object({
  postId: z.number().nullable(),
  commentId: z.number().nullable(),
  memberId: z.number().nullable(),
  fileType: z.enum(['image', 'file']),
  originalName: z.string().min(1).max(255),
  storedName: z.string().min(1).max(255),
  filePath: z.string().min(1).max(500),
  fileSize: z.number().int().nonnegative(),
  mimeType: z.string().min(1).max(100),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  thumbnailPath: z.string().max(500).nullable(),
  isTemp: z.boolean().default(false),
});

/**
 * Create a new file record
 */
export async function createFile(data: NewPostFile): Promise<PostFile> {
  // Validate input
  const validatedData = createFileSchema.parse(data);

  // Insert file record
  const result = await db.insert(postFiles).values(validatedData).returning();

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('파일 생성에 실패했습니다.');
  }

  return result[0] as PostFile;
}

/**
 * Find file by ID
 */
export async function findFileById(
  id: number
): Promise<PostFile | undefined> {
  const result = await db.select().from(postFiles).where(eq(postFiles.id, id));
  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }
  return result[0] as PostFile;
}

/**
 * Find files by post ID
 */
export async function findFilesByPostId(
  postId: number,
  options?: {
    fileType?: 'image' | 'file';
    includeTemp?: boolean;
  }
): Promise<PostFile[]> {
  const { fileType, includeTemp = false } = options || {};

  // Build where conditions
  const conditions = [eq(postFiles.postId, postId)];

  if (fileType) {
    conditions.push(eq(postFiles.fileType, fileType));
  }

  if (!includeTemp) {
    conditions.push(eq(postFiles.isTemp, false));
  }

  const result = await db
    .select()
    .from(postFiles)
    .where(and(...conditions))
    .orderBy(desc(postFiles.createdAt));

  return result as PostFile[];
}

/**
 * Find files by comment ID
 */
export async function findFilesByCommentId(
  commentId: number
): Promise<PostFile[]> {
  const result = await db
    .select()
    .from(postFiles)
    .where(
      and(eq(postFiles.commentId, commentId), eq(postFiles.isTemp, false))
    )
    .orderBy(desc(postFiles.createdAt));

  return result as PostFile[];
}

/**
 * Find files by member ID
 */
export async function findFilesByMemberId(
  memberId: number,
  options?: {
    limit?: number;
    offset?: number;
    includeTemp?: boolean;
  }
): Promise<PostFile[]> {
  const { limit = 50, offset = 0, includeTemp = false } = options || {};

  // Build where conditions
  const conditions = [eq(postFiles.memberId, memberId)];

  if (!includeTemp) {
    conditions.push(eq(postFiles.isTemp, false));
  }

  const result = await db
    .select()
    .from(postFiles)
    .where(and(...conditions))
    .orderBy(desc(postFiles.createdAt))
    .limit(limit)
    .offset(offset);

  return result as PostFile[];
}

/**
 * Find temporary files (cleanup purposes)
 */
export async function findTempFiles(
  olderThanMinutes: number = 60
): Promise<PostFile[]> {
  const cutoffDate = new Date();
  cutoffDate.setMinutes(cutoffDate.getMinutes() - olderThanMinutes);

  const result = await db
    .select()
    .from(postFiles)
    .where(
      and(
        eq(postFiles.isTemp, true),
        sql`${postFiles.createdAt} < ${cutoffDate.toISOString()}`
      )
    )
    .orderBy(asc(postFiles.createdAt));

  return result as PostFile[];
}

/**
 * Delete file (both record and physical file)
 */
export async function deleteFile(id: number): Promise<void> {
  const file = await findFileById(id);
  if (!file) {
    throw new Error('파일을 찾을 수 없습니다.');
  }

  // Delete physical file
  const fullPath = path.join(process.cwd(), file.filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  // Delete thumbnail if exists
  if (file.thumbnailPath) {
    const thumbnailFullPath = path.join(process.cwd(), file.thumbnailPath);
    if (fs.existsSync(thumbnailFullPath)) {
      fs.unlinkSync(thumbnailFullPath);
    }
  }

  // Soft delete file record
  await db
    .update(postFiles)
    .set({
      deletedAt: new Date().toISOString(),
    })
    .where(eq(postFiles.id, id));
}

/**
 * Delete multiple files by post ID
 */
export async function deleteFilesByPostId(postId: number): Promise<void> {
  const files = await findFilesByPostId(postId);

  for (const file of files) {
    await deleteFile(file.id);
  }
}

/**
 * Increment download count
 */
export async function incrementDownloadCount(id: number): Promise<void> {
  await db
    .update(postFiles)
    .set({
      downloadCount: sql`${postFiles.downloadCount} + 1`,
    })
    .where(eq(postFiles.id, id));
}

/**
 * Mark temp files as permanent
 */
export async function markFilesAsPermanent(
  fileIds: number[]
): Promise<void> {
  if (fileIds.length === 0) {
    return;
  }

  await db
    .update(postFiles)
    .set({
      isTemp: false,
    })
    .where(sql`${postFiles.id} IN (${sql.raw(fileIds.join(','))})`);
}

/**
 * Update file post association (temp file -> post)
 */
export async function updateFilePost(
  fileId: number,
  postId: number
): Promise<void> {
  await db
    .update(postFiles)
    .set({
      postId,
      isTemp: false,
    })
    .where(eq(postFiles.id, fileId));
}

/**
 * Get file statistics
 */
export async function getFileStatistics(): Promise<{
  totalFiles: number;
  totalSize: number;
  imageCount: number;
  fileCount: number;
  totalDownloads: number;
}> {
  const [result] = await db
    .select({
      totalFiles: count(),
      totalSize: sql<number>`SUM(${postFiles.fileSize})`,
      imageCount: sql<number>`SUM(CASE WHEN ${postFiles.fileType} = 'image' THEN 1 ELSE 0 END)`,
      fileCount: sql<number>`SUM(CASE WHEN ${postFiles.fileType} = 'file' THEN 1 ELSE 0 END)`,
      totalDownloads: sql<number>`SUM(${postFiles.downloadCount})`,
    })
    .from(postFiles)
    .where(eq(postFiles.isTemp, false));

  return {
    totalFiles: result ? Number(result.totalFiles) : 0,
    totalSize: result ? Number(result.totalSize) || 0 : 0,
    imageCount: result ? Number(result.imageCount) || 0 : 0,
    fileCount: result ? Number(result.fileCount) || 0 : 0,
    totalDownloads: result ? Number(result.totalDownloads) || 0 : 0,
  };
}

/**
 * Get recent files
 */
export async function getRecentFiles(
  memberId?: number,
  limit: number = 20
): Promise<PostFile[]> {
  const conditions = [eq(postFiles.isTemp, false)];

  if (memberId) {
    conditions.push(eq(postFiles.memberId, memberId));
  }

  const result = await db
    .select()
    .from(postFiles)
    .where(and(...conditions))
    .orderBy(desc(postFiles.createdAt))
    .limit(limit);

  return result as PostFile[];
}

/**
 * Clean up old temporary files
 */
export async function cleanupTempFiles(
  olderThanMinutes: number = 60
): Promise<number> {
  const oldTempFiles = await findTempFiles(olderThanMinutes);

  let deletedCount = 0;
  for (const file of oldTempFiles) {
    try {
      await deleteFile(file.id);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete temp file ${file.id}:`, error);
    }
  }

  return deletedCount;
}

/**
 * Count files
 */
export async function countFiles(options?: {
  postId?: number;
  memberId?: number;
  fileType?: 'image' | 'file';
}): Promise<number> {
  const { postId, memberId, fileType } = options || {};

  const conditions = [];

  if (postId !== undefined) {
    conditions.push(eq(postFiles.postId, postId));
  }

  if (memberId !== undefined) {
    conditions.push(eq(postFiles.memberId, memberId));
  }

  if (fileType) {
    conditions.push(eq(postFiles.fileType, fileType));
  }

  conditions.push(eq(postFiles.isTemp, false));

  const query = db
    .select({ count: count() })
    .from(postFiles)
    .where(and(...conditions));

  const [result] = await query;
  return result ? Number(result.count) : 0;
}

/**
 * Search files by name
 */
export async function searchFilesByName(
  query: string,
  limit: number = 20
): Promise<PostFile[]> {
  const lowerQuery = query.toLowerCase();

  const allFiles = await getRecentFiles(undefined, limit * 2);

  return allFiles
    .filter((file) =>
      file.originalName.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}
