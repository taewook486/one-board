import { NextRequest, NextResponse } from 'next/server';
import { findMemberByNickname } from '@/lib/db/members';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nickname = searchParams.get('nickname');

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임이 필요합니다.' },
        { status: 400 }
      );
    }

    // Check if nickname already exists
    const existingMember = await findMemberByNickname(nickname);

    return NextResponse.json({
      available: !existingMember,
    });
  } catch (error) {
    console.error('Check nickname error:', error);

    return NextResponse.json(
      { error: '닉네임 중복 체크 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
