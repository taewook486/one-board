import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { db } from './index';
import { postComments, type PostComment, type NewPostComment, CommentStatus } from './index';
import { z } from 'zod';

// Validation schemas
export const createCommentSchema = z.object({
  postId: z.number(),
  memberId: z.number().nullable(),
  authorName: z.string().max(50).nullable(),
  authorPassword: z.string().nullable(),
  parentId: z.number().nullable(),
  content: z.string().min(1).max(5000),
});

export const updateCommentSchema = createCommentSchema.partial().extend({
  id: z.number(),
});

/**
 * Create a new comment
 */
export async function createComment(data: NewPostComment): Promise<PostComment> {
  // Validate input
  const validatedData = createCommentSchema.parse(data);

  // Check if parent comment exists (if this is a reply)
  if (validatedData.parentId) {
    const parentComment = await findCommentById(validatedData.parentId);
    if (!parentComment) {
      throw new Error('부모 댓글을 찾을 수 없습니다.');
    }

    // Check if parent comment belongs to same post
    if (parentComment.postId !== validatedData.postId) {
      throw new Error('부모 댓글이 같은 게시글에 속하지 않습니다.');
    }
  }

  // Insert comment
  const result = await db.insert(postComments).values(validatedData).returning();

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('댓글 생성에 실패했습니다.');
  }

  const newComment = result[0] as PostComment;

  // Increment post comment count
  await updatePostCommentCount(validatedData.postId, 1);

  return newComment;
}

/**
 * Find comment by ID
 */
export async function findCommentById(
  id: number
): Promise<PostComment | undefined> {
  const result = await db
    .select()
    .from(postComments)
    .where(eq(postComments.id, id));

  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }

  return result[0] as PostComment;
}

/**
 * Find comments by post ID with hierarchical structure
 */
export async function findCommentsByPostId(
  postId: number,
  options?: {
    limit?: number;
    offset?: number;
    memberId?: number;
    status?: number;
  }
): Promise<PostComment[]> {
  const { limit = 100, offset = 0, memberId, status = CommentStatus.ACTIVE } = options || {};

  // Build where conditions
  const conditions = [eq(postComments.postId, postId)];
  if (status !== undefined) {
    conditions.push(eq(postComments.status, status));
  }
  if (memberId !== undefined) {
    conditions.push(eq(postComments.memberId, memberId));
  }

  const result = await db
    .select()
    .from(postComments)
    .where(and(...conditions))
    .orderBy(asc(postComments.createdAt))
    .limit(limit)
    .offset(offset);

  return result as PostComment[];
}

/**
 * Find comments by post ID with hierarchical structure (tree)
 */
export async function findCommentsTreeByPostId(
  postId: number
): Promise<Array<PostComment & { replies?: PostComment[] }>> {
  const allComments = await findCommentsByPostId(postId);

  // Build tree structure
  const commentMap = new Map<number, PostComment & { replies?: PostComment[] }>();
  const rootComments: (PostComment & { replies?: PostComment[] })[] = [];

  // Initialize map
  allComments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Build tree
  allComments.forEach((comment) => {
    const mappedComment = commentMap.get(comment.id)!;

    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        if (!parent.replies) {
          parent.replies = [];
        }
        parent.replies.push(mappedComment);
      }
    } else {
      rootComments.push(mappedComment);
    }
  });

  return rootComments;
}

/**
 * Find replies by parent comment ID
 */
export async function findRepliesByParentId(
  parentId: number
): Promise<PostComment[]> {
  const result = await db
    .select()
    .from(postComments)
    .where(
      and(
        eq(postComments.parentId, parentId),
        eq(postComments.status, CommentStatus.ACTIVE)
      )
    )
    .orderBy(asc(postComments.createdAt));

  return result as PostComment[];
}

/**
 * Update comment
 */
export async function updateComment(
  id: number,
  data: Partial<NewPostComment>
): Promise<PostComment> {
  // Validate data
  const validatedData = createCommentSchema.partial().parse(data);

  // Update comment
  const result = await db
    .update(postComments)
    .set({
      ...validatedData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(postComments.id, id))
    .returning();

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('댓글을 찾을 수 없습니다.');
  }

  return result[0] as PostComment;
}

/**
 * Delete comment (soft delete)
 */
export async function deleteComment(id: number): Promise<void> {
  const comment = await findCommentById(id);
  if (!comment) {
    throw new Error('댓글을 찾을 수 없습니다.');
  }

  await db
    .update(postComments)
    .set({
      status: CommentStatus.DELETED,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(postComments.id, id));

  // Decrement post comment count
  await updatePostCommentCount(comment.postId, -1);
}

/**
 * Increment like count
 */
export async function incrementCommentLikeCount(
  id: number,
  increment: number = 1
): Promise<void> {
  await db
    .update(postComments)
    .set({
      likeCount: sql`${postComments.likeCount} + ${increment}`,
    })
    .where(eq(postComments.id, id));
}

/**
 * Get comments by member
 */
export async function getCommentsByMember(
  memberId: number,
  options?: {
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }
): Promise<PostComment[]> {
  const { limit = 20, offset = 0, includeDeleted = false } = options || {};

  // Build where conditions
  const conditions = [eq(postComments.memberId, memberId)];
  if (!includeDeleted) {
    conditions.push(eq(postComments.status, CommentStatus.ACTIVE));
  }

  const result = await db
    .select()
    .from(postComments)
    .where(and(...conditions))
    .orderBy(desc(postComments.createdAt))
    .limit(limit)
    .offset(offset);

  return result as PostComment[];
}

/**
 * Count comments
 */
export async function countComments(options?: {
  postId?: number;
  memberId?: number;
  status?: number;
}): Promise<number> {
  const { postId, memberId, status } = options || {};

  const conditions = [];

  if (postId !== undefined) {
    conditions.push(eq(postComments.postId, postId));
  }

  if (memberId !== undefined) {
    conditions.push(eq(postComments.memberId, memberId));
  }

  if (status !== undefined) {
    conditions.push(eq(postComments.status, status));
  }

  const query = db
    .select({ count: count() })
    .from(postComments)
    .where(and(...conditions));

  const [result] = await query;
  return result ? Number(result.count) : 0;
}

/**
 * Get recent comments
 */
export async function getRecentComments(limit: number = 20): Promise<PostComment[]> {
  const result = await db
    .select()
    .from(postComments)
    .where(eq(postComments.status, CommentStatus.ACTIVE))
    .orderBy(desc(postComments.createdAt))
    .limit(limit);

  return result as PostComment[];
}

/**
 * Update post comment count (internal function)
 */
async function updatePostCommentCount(
  postId: number,
  increment: number
): Promise<void> {
  // Import here to avoid circular dependency
  const { updateCommentCount } = await import('./posts');
  await updateCommentCount(postId, increment);
}

/**
 * Search comments
 */
export async function searchComments(
  query: string,
  limit: number = 20
): Promise<PostComment[]> {
  const result = await db
    .select()
    .from(postComments)
    .where(
      and(
        eq(postComments.status, CommentStatus.ACTIVE),
        sql`${postComments.content} LIKE ${`%${query}%`}`
      )
    )
    .orderBy(desc(postComments.createdAt))
    .limit(limit);

  return result as PostComment[];
}

/**
 * Get comment statistics
 */
export async function getCommentStatistics(): Promise<{
  totalComments: number;
  totalLikes: number;
}> {
  const [result] = await db
    .select({
      totalComments: count(),
      totalLikes: sql<number>`SUM(${postComments.likeCount})`,
    })
    .from(postComments)
    .where(eq(postComments.status, CommentStatus.ACTIVE));

  return {
    totalComments: result ? Number(result.totalComments) : 0,
    totalLikes: result ? Number(result.totalLikes) || 0 : 0,
  };
}

/**
 * Check if user can delete comment
 */
export async function canDeleteComment(
  commentId: number,
  memberId?: number | null
): Promise<boolean> {
  const comment = await findCommentById(commentId);

  if (!comment) {
    return false;
  }

  // If member is comment author, can delete
  if (comment.memberId === memberId) {
    return true;
  }

  // Check if member is admin
  if (memberId) {
    const { findMemberById } = await import('./members');
    const member = await findMemberById(memberId);
    if (member && member.role === 2) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can edit comment
 */
export async function canEditComment(
  commentId: number,
  memberId?: number | null
): Promise<boolean> {
  const comment = await findCommentById(commentId);

  if (!comment) {
    return false;
  }

  // Only author can edit their comment
  return comment.memberId === memberId;
}
