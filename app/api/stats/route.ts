import { NextRequest, NextResponse } from 'next/server';
import {
  getBasicStats,
  getTodayVisitors,
  getTotalVisitors,
  getDailyStats,
} from '@/lib/db/stats';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schema for query parameters
const getStatsSchema = z.object({
  type: z.enum(['basic', 'daily']).optional().default('basic'),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const validatedData = getStatsSchema.parse({
      type: searchParams.get('type') || undefined,
      days: searchParams.get('days') || '30',
    });

    // Type-based routing
    switch (validatedData.type) {
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
        const daily = await getDailyStats(validatedData.days);

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors[0]?.message || '입력값이 올바르지 않습니다.',
        },
        { status: 400 }
      );
    }

    logger.error('Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '통계 정보를 가져오는데 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
