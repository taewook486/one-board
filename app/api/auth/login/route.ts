import { NextRequest, NextResponse } from 'next/server';
import { verifyMemberPassword, updateLastLoginTime } from '@/lib/db/members';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createSessionToken } from '@/lib/auth/jwt';
import logger from '@/lib/utils/logger';

// Validation schema for login
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Verify credentials
    const member = await verifyMemberPassword(
      validatedData.username,
      validatedData.password
    );

    // Update last login time
    await updateLastLoginTime(member.id);

    // Create session data
    const sessionData = {
      id: member.id,
      username: member.username,
      nickname: member.nickname,
      email: member.email,
      role: member.role,
      profileImage: member.profileImage,
    };

    // Create JWT token
    const sessionToken = await createSessionToken(sessionData);

    // Set session cookie with JWT token
    const cookieStore = await cookies();
    const maxAge = validatedData.rememberMe
      ? 60 * 60 * 24 * 30 // 30 days
      : 60 * 60 * 24; // 1 day

    cookieStore.set({
      name: 'session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    // Return member data
    const { passwordHash, loginFailCount, lockedUntil, ...memberData } = member;

    return NextResponse.json({
      success: true,
      member: memberData,
      message: '로그인되었습니다.',
    });
  } catch (error) {
    logger.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
