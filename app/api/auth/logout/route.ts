import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');

    return NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.',
    });
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
