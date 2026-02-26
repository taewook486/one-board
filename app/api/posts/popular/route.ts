import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { boardPosts, PostStatus } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import logger from '@/lib/utils/logger';

/**
 * GET /api/posts/popular - Get popular posts across all boards
 * Query params:
 * - sortBy: 'likeCount' | 'viewCount' | 'commentCount' (default: likeCount)
 * - limit: number (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'likeCount';

    // Determine order by column
    let orderBy;
    if (sortBy === 'likeCount') {
      orderBy = desc(boardPosts.likeCount);
    } else if (sortBy === 'viewCount') {
      orderBy = desc(boardPosts.viewCount);
    } else if (sortBy === 'commentCount') {
      orderBy = desc(boardPosts.commentCount);
    } else {
      orderBy = desc(boardPosts.likeCount);
    }

    const posts = await db
      .select()
      .from(boardPosts)
      .where(eq(boardPosts.status, PostStatus.ACTIVE))
      .orderBy(orderBy)
      .limit(limit);

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error) {
    logger.error('Get popular posts error:', error);
    return NextResponse.json(
      { error: '인기 게시글을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
