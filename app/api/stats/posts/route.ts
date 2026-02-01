import { NextRequest, NextResponse } from 'next/server';
import {
  getPostStats,
  getTrendingPosts,
  getCommentStats,
} from '@/lib/db/stats';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const type = searchParams.get('type');

    // Type-based routing
    switch (type) {
      case 'trending':
        const trending = await getTrendingPosts(5);
        
        return NextResponse.json({
          success: true,
          posts: trending,
        });

      case 'stats':
        const postsStatsData = await getPostStats(days);
        const commentStatsData = await getCommentStats(days);
        
        return NextResponse.json({
          success: true,
          posts: postsStatsData,
          comments: commentStatsData,
        });

      default:
        const postsStatsDefault = await getPostStats(30);
        
        return NextResponse.json({
          success: true,
          posts: postsStatsDefault,
        });
    }
  } catch (error) {
    console.error('Posts Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '게시글 통계를 가져오는데 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
