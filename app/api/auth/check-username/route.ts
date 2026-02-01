import { NextRequest, NextResponse } from 'next/server';
import { findMemberByUsername } from '@/lib/db/members';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: '아이디가 필요합니다.' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingMember = await findMemberByUsername(username);

    return NextResponse.json({
      available: !existingMember,
    });
  } catch (error) {
    console.error('Check username error:', error);

    return NextResponse.json(
      { error: '아이디 중복 체크 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
