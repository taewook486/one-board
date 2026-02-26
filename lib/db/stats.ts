import { eq, and, gte, lte, sql, count, desc } from 'drizzle-orm';
import { db } from './index';
import { members, boardPosts, postComments, memberSessions, boards, type BoardPost } from './index';

/**
 * Statistics Types
 */

export interface BasicStats {
  totalMembers: number;
  totalBoards: number;
  totalPosts: number;
  totalComments: number;
}

export interface DailyStats {
  date: string;
  visitors: number;
  posts: number;
  comments: number;
  registrations: number;
}

export interface PostStats {
  date: string;
  count: number;
  views: number;
  likes: number;
}

export interface BoardStats {
  boardId: number;
  boardName: string;
  postCount: number;
}

/**
 * Internal types for database query results
 */
interface DateCountStat {
  date: string;
  count: number;
}

interface PostStatResult {
  date: string;
  count: number;
  views: number;
  likes: number;
}

interface BoardStatResult {
  id: number;
  name: string;
  post_count: number;
}

interface ActiveMemberResult {
  id: number;
  nickname: string;
  post_count: number;
}

/**
 * Get basic statistics for dashboard
 */
export async function getBasicStats(): Promise<BasicStats> {
  const [memberCount] = await db.select({ count: count() }).from(members);
  const [boardCount] = await db.select({ count: count() }).from(boards);
  const [postCount] = await db.select({ count: count() }).from(boardPosts);
  const [commentCount] = await db.select({ count: count() }).from(postComments);

  return {
    totalMembers: memberCount.count || 0,
    totalBoards: boardCount.count || 0,
    totalPosts: postCount.count || 0,
    totalComments: commentCount.count || 0,
  };
}

/**
 * Get daily statistics for the last 30 days
 */
export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Get visitors per day (from member sessions)
  const visitorStats = await db
    .select({
      date: sql`DATE(last_activity) as date`,
      count: count(),
    })
    .from(memberSessions)
    .where(sql`DATE(last_activity) >= ${startDateStr}`)
    .groupBy(sql`DATE(last_activity)`)
    .orderBy(sql`DATE(last_activity)`);

  // Get posts per day
  const postStats = await db
    .select({
      date: sql`DATE(created_at) as date`,
      count: count(),
    })
    .from(boardPosts)
    .where(sql`DATE(created_at) >= ${startDateStr}`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  // Get comments per day
  const commentStats = await db
    .select({
      date: sql`DATE(created_at) as date`,
      count: count(),
    })
    .from(postComments)
    .where(sql`DATE(created_at) >= ${startDateStr}`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  // Get registrations per day
  const registrationStats = await db
    .select({
      date: sql`DATE(created_at) as date`,
      count: count(),
    })
    .from(members)
    .where(sql`DATE(created_at) >= ${startDateStr}`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  // Merge all stats
  const statsMap = new Map<string, DailyStats>();

  visitorStats.forEach((stat: DateCountStat) => {
    const existing = statsMap.get(stat.date) || {
      date: stat.date,
      visitors: 0,
      posts: 0,
      comments: 0,
      registrations: 0,
    };
    existing.visitors = stat.count;
    statsMap.set(stat.date, existing);
  });

  postStats.forEach((stat: DateCountStat) => {
    const existing = statsMap.get(stat.date) || {
      date: stat.date,
      visitors: 0,
      posts: 0,
      comments: 0,
      registrations: 0,
    };
    existing.posts = stat.count;
    statsMap.set(stat.date, existing);
  });

  commentStats.forEach((stat: DateCountStat) => {
    const existing = statsMap.get(stat.date) || {
      date: stat.date,
      visitors: 0,
      posts: 0,
      comments: 0,
      registrations: 0,
    };
    existing.comments = stat.count;
    statsMap.set(stat.date, existing);
  });

  registrationStats.forEach((stat: DateCountStat) => {
    const existing = statsMap.get(stat.date) || {
      date: stat.date,
      visitors: 0,
      posts: 0,
      comments: 0,
      registrations: 0,
    };
    existing.registrations = stat.count;
    statsMap.set(stat.date, existing);
  });

  return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get post statistics by date
 */
export async function getPostStats(days: number = 30): Promise<PostStats[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const stats = await db
    .select({
      date: sql`DATE(created_at) as date`,
      count: count(),
      views: sql<number>`SUM(view_count) as views`,
      likes: sql<number>`SUM(like_count) as likes`,
    })
    .from(boardPosts)
    .where(sql`DATE(created_at) >= ${startDateStr}`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  return stats.map((stat: PostStatResult) => ({
    date: stat.date,
    count: stat.count || 0,
    views: stat.views || 0,
    likes: stat.likes || 0,
  }));
}

/**
 * Get comment statistics by date
 */
export async function getCommentStats(days: number = 30): Promise<{ date: string; count: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const stats = await db
    .select({
      date: sql`DATE(created_at) as date`,
      count: count(),
    })
    .from(postComments)
    .where(sql`DATE(created_at) >= ${startDateStr}`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  return stats.map((stat: DateCountStat) => ({
    date: stat.date,
    count: stat.count || 0,
  }));
}

/**
 * Get member registration statistics
 */
export async function getMemberRegistrations(days: number = 30): Promise<{ date: string; count: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const stats = await db
    .select({
      date: sql`DATE(created_at) as date`,
      count: count(),
    })
    .from(members)
    .where(sql`DATE(created_at) >= ${startDateStr}`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  return stats.map((stat: DateCountStat) => ({
    date: stat.date,
    count: stat.count || 0,
  }));
}

/**
 * Get board statistics (posts per board)
 */
export async function getBoardStats(): Promise<BoardStats[]> {
  const boardsResult = await db
    .select({
      id: boards.id,
      name: boards.name,
      postCount: sql<number>`COUNT(board_posts.id) as post_count`,
    })
    .from(boards)
    .leftJoin(boardPosts, eq(boards.id, boardPosts.boardId))
    .groupBy(boards.id)
    .orderBy(desc(sql`post_count`));

  return boardsResult.map((board: BoardStatResult) => ({
    boardId: board.id,
    boardName: board.name,
    postCount: board.post_count || 0,
  }));
}

/**
 * Get today's visitor count
 */
export async function getTodayVisitors(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const result = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ip_address) as count`,
    })
    .from(memberSessions)
    .where(sql`DATE(last_activity) = ${today}`);

  return result[0]?.count || 0;
}

/**
 * Get total unique visitors
 */
export async function getTotalVisitors(): Promise<number> {
  const result = await db.select({
    count: sql<number>`COUNT(DISTINCT ip_address) as count`,
  }).from(memberSessions);

  return result[0]?.count || 0;
}

/**
 * Get trending content (most viewed posts)
 */
export async function getTrendingPosts(limit: number = 5): Promise<BoardPost[]> {
  const posts = await db
    .select()
    .from(boardPosts)
    .orderBy(desc(sql`view_count`))
    .limit(limit);

  return posts;
}

/**
 * Get most active members
 */
export async function getActiveMembers(limit: number = 5): Promise<ActiveMemberResult[]> {
  const activeMembers = await db
    .select({
      id: members.id,
      nickname: members.nickname,
      postCount: sql<number>`COUNT(board_posts.id) as post_count`,
    })
    .from(members)
    .leftJoin(boardPosts, eq(members.id, boardPosts.memberId))
    .groupBy(members.id)
    .orderBy(desc(sql`post_count`))
    .limit(limit);

  return activeMembers;
}
