import { eq, and, or, desc, asc, sql, count } from 'drizzle-orm';
import { db } from './index';
import { boardPosts, type BoardPost, type NewBoardPost, PostStatus, boards } from './schema';
import { z } from 'zod';

// Type for posts with board information
export type PostWithBoard = BoardPost & {
  boardName: string;
  boardKey: string;
};

// Import updatePostCount dynamically to avoid circular dependency
async function getUpdatePostCount() {
  const { updatePostCount } = await import('./boards');
  return updatePostCount;
}

// Validation schemas
export const createPostSchema = z.object({
  boardId: z.number(),
  memberId: z.number().nullable(),
  authorName: z.string().max(50).nullable(),
  authorPassword: z.string().nullable(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.string().max(50).optional().nullable(),
  tags: z.string().optional().nullable(),
  isNotice: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  isSecret: z.boolean().default(false),
});

export const updatePostSchema = createPostSchema.partial().extend({
  id: z.number(),
});

/**
 * Create a new post
 */
export async function createPost(data: NewBoardPost): Promise<BoardPost> {
  // Validate input
  const validatedData = createPostSchema.parse(data);

  // Insert post
  const result = await db.insert(boardPosts).values(validatedData).returning();

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('게시글 생성에 실패했습니다.');
  }

  const newPost = result[0] as BoardPost;

  // Increment board post count
  const updatePostCount = await getUpdatePostCount();
  await updatePostCount(validatedData.boardId, 1);

  return newPost;
}

/**
 * Find post by ID
 */
export async function findPostById(id: number): Promise<BoardPost | undefined> {
  const result = await db.select().from(boardPosts).where(eq(boardPosts.id, id));

  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }

  return result[0] as BoardPost;
}

/**
 * Find posts by board ID
 */
export async function findPostsByBoard(
  boardId: number,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'viewCount' | 'likeCount' | 'commentCount';
    order?: 'asc' | 'desc';
    category?: string;
    status?: number;
    memberId?: number;
  }
): Promise<BoardPost[]> {
  const {
    limit = 20,
    offset = 0,
    sortBy = 'createdAt',
    order = 'desc',
    category,
    status = PostStatus.ACTIVE,
    memberId,
  } = options || {};

  // Build conditions
  const conditions = [eq(boardPosts.boardId, boardId)];

  if (status !== undefined) {
    conditions.push(eq(boardPosts.status, status));
  }

  if (category) {
    conditions.push(eq(boardPosts.category, category));
  }

  if (memberId !== undefined) {
    conditions.push(eq(boardPosts.memberId, memberId));
  }

  // Determine order by
  let orderBy;
  if (sortBy === 'createdAt') {
    orderBy = order === 'asc' ? asc(boardPosts.createdAt) : desc(boardPosts.createdAt);
  } else if (sortBy === 'viewCount') {
    orderBy = order === 'asc' ? asc(boardPosts.viewCount) : desc(boardPosts.viewCount);
  } else if (sortBy === 'likeCount') {
    orderBy = order === 'asc' ? asc(boardPosts.likeCount) : desc(boardPosts.likeCount);
  } else if (sortBy === 'commentCount') {
    orderBy = order === 'asc' ? asc(boardPosts.commentCount) : desc(boardPosts.commentCount);
  } else {
    orderBy = desc(boardPosts.createdAt);
  }

  // Build query with all clauses in one chain
  const result = await db
    .select()
    .from(boardPosts)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return result as BoardPost[];
}

/**
 * Update post
 */
export async function updatePost(
  id: number,
  data: Partial<NewBoardPost>
): Promise<BoardPost> {
  // Validate data
  const validatedData = createPostSchema.partial().parse(data);

  // Update post
  const result = await db
    .update(boardPosts)
    .set({
      ...validatedData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(boardPosts.id, id))
    .returning();

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('게시글을 찾을 수 없습니다.');
  }

  return result[0] as BoardPost;
}

/**
 * Delete post (soft delete)
 */
export async function deletePost(id: number): Promise<void> {
  const post = await findPostById(id);
  if (!post) {
    throw new Error('게시글을 찾을 수 없습니다.');
  }

  await db
    .update(boardPosts)
    .set({
      status: PostStatus.DELETED,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(boardPosts.id, id));

  // Decrement board post count
  const updatePostCount = await getUpdatePostCount();
  await updatePostCount(post.boardId, -1);
}

/**
 * Increment view count
 */
export async function incrementViewCount(id: number): Promise<void> {
  await db
    .update(boardPosts)
    .set({
      viewCount: sql`${boardPosts.viewCount} + 1`,
    })
    .where(eq(boardPosts.id, id));
}

/**
 * Increment like count
 */
export async function incrementLikeCount(
  id: number,
  increment: number = 1
): Promise<void> {
  await db
    .update(boardPosts)
    .set({
      likeCount: sql`${boardPosts.likeCount} + ${increment}`,
    })
    .where(eq(boardPosts.id, id));
}

/**
 * Update comment count
 */
export async function updateCommentCount(
  id: number,
  increment: number = 1
): Promise<void> {
  await db
    .update(boardPosts)
    .set({
      commentCount: sql`${boardPosts.commentCount} + ${increment}`,
    })
    .where(eq(boardPosts.id, id));
}

/**
 * Search posts (full-text search)
 */
export async function searchPosts(
  query: string,
  options?: {
    boardId?: number;
    limit?: number;
    offset?: number;
    memberId?: number;
  }
): Promise<BoardPost[]> {
  const { boardId, limit = 20, offset = 0, memberId } = options || {};

  // Build conditions
  const conditions = [
    eq(boardPosts.status, PostStatus.ACTIVE),
    or(
      sql`${boardPosts.title} LIKE ${`%${query}%`}`,
      sql`${boardPosts.content} LIKE ${`%${query}%`}`
    )
  ];

  if (boardId) {
    conditions.push(eq(boardPosts.boardId, boardId));
  }

  if (memberId !== undefined) {
    conditions.push(eq(boardPosts.memberId, memberId));
  }

  const result = await db
    .select()
    .from(boardPosts)
    .where(and(...conditions))
    .orderBy(desc(boardPosts.createdAt))
    .limit(limit)
    .offset(offset);

  return result as BoardPost[];
}

/**
 * Get recent posts across all boards
 */
export async function getRecentPosts(limit: number = 20): Promise<BoardPost[]> {
  const result = await db
    .select()
    .from(boardPosts)
    .where(eq(boardPosts.status, PostStatus.ACTIVE))
    .orderBy(desc(boardPosts.createdAt))
    .limit(limit);

  return result as BoardPost[];
}

/**
 * Get popular posts (by view count)
 */
export async function getPopularPosts(
  boardId?: number,
  limit: number = 20
): Promise<BoardPost[]> {
  const conditions = [eq(boardPosts.status, PostStatus.ACTIVE)];

  if (boardId) {
    conditions.push(eq(boardPosts.boardId, boardId));
  }

  const result = await db
    .select()
    .from(boardPosts)
    .where(and(...conditions))
    .orderBy(desc(boardPosts.viewCount))
    .limit(limit);

  return result as BoardPost[];
}

/**
 * Get notice posts
 */
export async function getNoticePosts(
  boardId: number,
  limit: number = 10
): Promise<BoardPost[]> {
  const result = await db
    .select()
    .from(boardPosts)
    .where(
      and(
        eq(boardPosts.boardId, boardId),
        eq(boardPosts.isNotice, true),
        eq(boardPosts.status, PostStatus.ACTIVE)
      )
    )
    .orderBy(desc(boardPosts.createdAt))
    .limit(limit);

  return result as BoardPost[];
}

/**
 * Get pinned posts
 */
export async function getPinnedPosts(
  boardId: number
): Promise<BoardPost[]> {
  const result = await db
    .select()
    .from(boardPosts)
    .where(
      and(
        eq(boardPosts.boardId, boardId),
        eq(boardPosts.isPinned, true),
        eq(boardPosts.status, PostStatus.ACTIVE)
      )
    )
    .orderBy(desc(boardPosts.createdAt));

  return result as BoardPost[];
}

/**
 * Get posts by tags
 */
export async function getPostsByTag(
  tag: string,
  limit: number = 20
): Promise<BoardPost[]> {
  const result = await db
    .select()
    .from(boardPosts)
    .where(
      and(
        eq(boardPosts.status, PostStatus.ACTIVE),
        sql`${boardPosts.tags} LIKE ${`%${tag}%`}`
      )
    )
    .orderBy(desc(boardPosts.createdAt))
    .limit(limit);

  return result as BoardPost[];
}

/**
 * Count posts
 */
export async function countPosts(options?: {
  boardId?: number;
  category?: string;
  status?: number;
  memberId?: number;
}): Promise<number> {
  const { boardId, category, status, memberId } = options || {};

  const conditions = [];

  if (boardId !== undefined) {
    conditions.push(eq(boardPosts.boardId, boardId));
  }

  if (category) {
    conditions.push(eq(boardPosts.category, category));
  }

  if (status !== undefined) {
    conditions.push(eq(boardPosts.status, status));
  }

  if (memberId !== undefined) {
    conditions.push(eq(boardPosts.memberId, memberId));
  }

  const query = db
    .select({ count: count() })
    .from(boardPosts)
    .where(and(...conditions));

  const [result] = await query;
  return result ? Number(result.count) : 0;
}

/**
 * Get posts by member
 */
export async function getPostsByMember(
  memberId: number,
  options?: {
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }
): Promise<BoardPost[]> {
  const { limit = 20, offset = 0, includeDeleted = false } = options || {};

  const conditions = [eq(boardPosts.memberId, memberId)];

  if (!includeDeleted) {
    conditions.push(eq(boardPosts.status, PostStatus.ACTIVE));
  }

  const result = await db
    .select()
    .from(boardPosts)
    .where(and(...conditions))
    .orderBy(desc(boardPosts.createdAt))
    .limit(limit)
    .offset(offset);

  return result as BoardPost[];
}

/**
 * Update board post count (internal function)
 */
async function updateBoardPostCount(
  boardId: number,
  increment: number
): Promise<void> {
  // Import here to avoid circular dependency
  const { updatePostCount } = await import('./boards');
  await updatePostCount(boardId, increment);
}

/**
 * Get previous and next post in the same board
 */
export async function getAdjacentPosts(
  postId: number,
  boardId: number
): Promise<{ previous?: BoardPost; next?: BoardPost }> {
  const post = await findPostById(postId);
  if (!post) {
    return { previous: undefined, next: undefined };
  }

  // Get previous post (newer posts with smaller ID or created later)
  const [previous] = await db
    .select()
    .from(boardPosts)
    .where(
      and(
        eq(boardPosts.boardId, boardId),
        eq(boardPosts.status, PostStatus.ACTIVE),
        sql`${boardPosts.id} < ${postId}`
      )
    )
    .orderBy(desc(boardPosts.id))
    .limit(1);

  // Get next post (older posts with larger ID or created earlier)
  const [next] = await db
    .select()
    .from(boardPosts)
    .where(
      and(
        eq(boardPosts.boardId, boardId),
        eq(boardPosts.status, PostStatus.ACTIVE),
        sql`${boardPosts.id} > ${postId}`
      )
    )
    .orderBy(asc(boardPosts.id))
    .limit(1);

  return { previous, next };
}

/**
 * Check if user can access post (for secret posts)
 */
export async function canAccessPost(
  postId: number,
  memberId?: number | null
): Promise<boolean> {
  const post = await findPostById(postId);

  if (!post) {
    return false;
  }

  // If post is not secret, everyone can access
  if (!post.isSecret) {
    return true;
  }

  // If post is secret, only author or admin can access
  if (post.memberId === memberId) {
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
 * Get post statistics
 */
export async function getPostStatistics(): Promise<{
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}> {
  const [result] = await db
    .select({
      totalPosts: count(),
      totalViews: sql<number>`SUM(${boardPosts.viewCount})`,
      totalLikes: sql<number>`SUM(${boardPosts.likeCount})`,
      totalComments: sql<number>`SUM(${boardPosts.commentCount})`,
    })
    .from(boardPosts)
    .where(eq(boardPosts.status, PostStatus.ACTIVE));

  return {
    totalPosts: result ? Number(result.totalPosts) : 0,
    totalViews: result ? Number(result.totalViews) || 0 : 0,
    totalLikes: result ? Number(result.totalLikes) || 0 : 0,
    totalComments: result ? Number(result.totalComments) || 0 : 0,
  };
}

/**
 * Get all posts (for admin)
 */
export async function getAllPosts(options?: {
  limit?: number;
  offset?: number;
  status?: number;
  search?: string;
  category?: string;
}): Promise<{
  posts: (BoardPost & { boardName: string; boardKey: string })[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}> {
  const {
    limit = 20,
    offset = 0,
    status,
    search,
    category,
  } = options || {};

  // Import boards table
  const { boards } = await import('./schema');

  // Build conditions
  const conditions = [];

  if (status !== undefined) {
    conditions.push(eq(boardPosts.status, status));
  }

  if (category) {
    conditions.push(eq(boardPosts.category, category));
  }

  if (search) {
    // Escape SQL wildcard characters to prevent unintended matches
    const escapedSearch = search
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    conditions.push(
      or(
        sql`${boardPosts.title} LIKE ${`%${escapedSearch}%`}`,
        sql`${boardPosts.content} LIKE ${`%${escapedSearch}%`}`
      )
    );
  }

  // Count total posts
  const [countResult] = await db
    .select({ count: count() })
    .from(boardPosts)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const total = countResult ? Number(countResult.count) : 0;
  const totalPages = Math.ceil(total / limit);
  const page = Math.floor(offset / limit) + 1;

  // Get posts with board info
  const posts = await db
    .select({
      ...boardPosts,
      boardName: boards.name,
      boardKey: boards.boardKey,
    })
    .from(boardPosts)
    .innerJoin(boards, eq(boardPosts.boardId, boards.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(boardPosts.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    posts: posts as PostWithBoard[],
    pagination: {
      total,
      totalPages,
      page,
      limit,
    },
  };
}
