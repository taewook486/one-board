import { NextRequest, NextResponse } from 'next/server';
import { createMember } from '@/lib/db/members';
import { validateUsername, validateNickname } from '@/lib/utils/security';
import { z } from 'zod';

// Validation schema for registration
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  password: z.string().min(8),
  passwordConfirm: z.string(),
  nickname: z.string().min(2).max(50),
  name: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if passwords match
    if (validatedData.password !== validatedData.passwordConfirm) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // Validate username
    const usernameValidation = validateUsername(validatedData.username);
    if (!usernameValidation.isValid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      );
    }

    // Validate nickname
    const nicknameValidation = validateNickname(validatedData.nickname);
    if (!nicknameValidation.isValid) {
      return NextResponse.json(
        { error: nicknameValidation.error },
        { status: 400 }
      );
    }

    // Create member
    const newMember = await createMember({
      username: validatedData.username,
      email: validatedData.email || null,
      password: validatedData.password,
      nickname: validatedData.nickname,
      name: validatedData.name || null,
      phone: null,
    });

    // Return member data without password
    const { passwordHash, ...memberData } = newMember;

    return NextResponse.json({
      success: true,
      member: memberData,
      message: '회원가입이 완료되었습니다.',
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('이미 존재')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
