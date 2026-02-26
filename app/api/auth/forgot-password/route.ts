import { NextRequest, NextResponse } from 'next/server';
import { findMemberByEmail, setEmailVerificationToken } from '@/lib/db/members';
import { z } from 'zod';
import crypto from 'crypto';
import logger from '@/lib/utils/logger';

// Validation schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;

    // Find member by email
    const member = await findMemberByEmail(email);

    // Always return success for security (don't reveal if email exists)
    if (!member) {
      return NextResponse.json({
        success: true,
        message: '이메일로 비밀번호 재설정 링크가 발송되었습니다.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + (60 * 60 * 1000); // 1 hour

    // Store token
    await setEmailVerificationToken(member.id, resetToken);

    // In production, send email here
    // For now, log the token (in production, this would be sent via email)
    logger.info('Password reset token generated', { token: resetToken });
    logger.info('Reset link generated', { url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}` });

    return NextResponse.json({
      success: true,
      message: '이메일로 비밀번호 재설정 링크가 발송되었습니다.',
      // For development only - remove in production
      devResetToken: resetToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Error requesting password reset', error);
    return NextResponse.json(
      { success: false, error: '비밀번호 재설정 요청에 실패했습니다.' },
      { status: 500 }
    );
  }
}
