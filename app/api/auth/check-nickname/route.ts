import { NextRequest, NextResponse } from 'next/server';
import { findMemberByNickname } from '@/lib/db/members';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schema for query parameters
const checkNicknameSchema = z.object({
  nickname: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다.').max(50, '닉네임은 최대 50자까지 입력 가능합니다.'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nickname = searchParams.get('nickname');

    // Validate input
    const validatedData = checkNicknameSchema.parse({ nickname });

    // Check if nickname already exists
    const existingMember = await findMemberByNickname(validatedData.nickname);

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

    logger.error('Check nickname error:', error);

    return NextResponse.json(
      { error: '닉네임 중복 체크 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
