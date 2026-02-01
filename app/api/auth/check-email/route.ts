import { NextRequest, NextResponse } from 'next/server';
import { findMemberByEmail } from '@/lib/db/members';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingMember = await findMemberByEmail(email);

    return NextResponse.json({
      available: !existingMember,
    });
  } catch (error) {
    console.error('Check email error:', error);

    return NextResponse.json(
      { error: '이메일 중복 체크 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
