import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export interface SessionUser {
  id: number;
  username: string;
  nickname: string;
  email: string | null;
  role: number;
  profileImage: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    // Parse session data
    let sessionUser: SessionUser;
    try {
      sessionUser = JSON.parse(sessionCookie.value);
    } catch {
      // Invalid session
      cookieStore.delete('session');
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: sessionUser,
    });
  } catch (error) {
    console.error('Get me error:', error);

    return NextResponse.json(
      { error: '사용자 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
