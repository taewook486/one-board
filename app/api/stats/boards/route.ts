import { NextRequest, NextResponse } from 'next/server';
import {
  getBoardStats,
} from '@/lib/db/stats';

export async function GET(request: NextRequest) {
  try {
    const boards = await getBoardStats();
    
    return NextResponse.json({
      success: true,
      boards,
    });
  } catch (error) {
    console.error('Boards Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '게시판 통계를 가져오는데 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
