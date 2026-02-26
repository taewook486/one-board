import { NextRequest, NextResponse } from 'next/server';
import { findMemberByEmail } from '@/lib/db/members';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schema for query parameters
const checkEmailSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    // Validate input
    const validatedData = checkEmailSchema.parse({ email });

    // Check if email already exists
    const existingMember = await findMemberByEmail(validatedData.email);

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

    logger.error('Check email error:', error);

    return NextResponse.json(
      { error: '이메일 중복 체크 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
