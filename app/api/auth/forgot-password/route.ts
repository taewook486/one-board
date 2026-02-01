import { NextRequest, NextResponse } from 'next/server';
import { findMemberByEmail, setEmailVerificationToken } from '@/lib/db/members';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

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
    console.log('Password reset token:', resetToken);
    console.log('Reset link:', `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);

    return NextResponse.json({
      success: true,
      message: '이메일로 비밀번호 재설정 링크가 발송되었습니다.',
      // For development only - remove in production
      devResetToken: resetToken,
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { success: false, error: '비밀번호 재설정 요청에 실패했습니다.' },
      { status: 500 }
    );
  }
}
