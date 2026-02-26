import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveMembers,
} from '@/lib/db/stats';
import logger from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const members = await getActiveMembers(limit);

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    logger.error('Active Members API error', error);
    return NextResponse.json(
      {
        success: false,
        error: '활동 회원을 가져오는데 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
