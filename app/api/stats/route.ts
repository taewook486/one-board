import { NextRequest, NextResponse } from 'next/server';
import {
  getBasicStats,
  getTodayVisitors,
  getTotalVisitors,
  getDailyStats,
} from '@/lib/db/stats';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Type-based routing
    switch (type) {
      case 'basic':
        const basic = await getBasicStats();
        const todayVisitors = await getTodayVisitors();
        const totalVisitors = await getTotalVisitors();
        
        return NextResponse.json({
          success: true,
          stats: {
            ...basic,
            todayVisitors,
            totalVisitors,
          },
        });

      case 'daily':
        const days = parseInt(searchParams.get('days') || '30');
        const daily = await getDailyStats(days);
        
        return NextResponse.json({
          success: true,
          stats: daily,
        });

      default:
        return NextResponse.json({
          success: true,
          stats: await getBasicStats(),
        });
    }
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '통계 정보를 가져오는데 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
