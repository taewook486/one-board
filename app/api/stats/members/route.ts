import { NextRequest, NextResponse } from 'next/server';
import {
  getMemberRegistrations,
} from '@/lib/db/stats';
import logger from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const registrations = await getMemberRegistrations(days);
    
    return NextResponse.json({
      success: true,
      registrations,
    });
  } catch (error) {
    logger.error('Members Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '회원 통계를 가져오는데 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
