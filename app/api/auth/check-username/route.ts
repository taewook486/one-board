import { NextRequest, NextResponse } from 'next/server';
import { findMemberByUsername } from '@/lib/db/members';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schema for query parameters
const checkUsernameSchema = z.object({
  username: z.string().min(3, '아이디는 최소 3자 이상이어야 합니다.').max(50, '아이디는 최대 50자까지 입력 가능합니다.'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    // Validate input
    const validatedData = checkUsernameSchema.parse({ username });

    // Check if username already exists
    const existingMember = await findMemberByUsername(validatedData.username);

    return NextResponse.json({
      available: !existingMember,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Check username error:', error);

    return NextResponse.json(
      { error: '아이디 중복 체크 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
