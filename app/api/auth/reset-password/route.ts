import { NextRequest, NextResponse } from 'next/server';
import { findMemberByEmail, updateMemberPassword } from '@/lib/db/members';
import { z } from 'zod';
import crypto from 'crypto';
import logger from '@/lib/utils/logger';

// Validation schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, '토큰이 필요합니다.'),
  newPassword: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(await request.json());

    // Find member by token (using emailVerificationToken field)
    // Note: In production, you'd need a separate resetToken field
    // For now, we'll use the emailVerificationToken field
    const members = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/members?search=${token}`);
    const membersData = await members.json();
    const member = membersData.members?.find((m: any) => 
      m.emailVerificationToken === token
    );

    if (!member) {
      return NextResponse.json(
        { success: false, error: '유효하지 않거나 만료된 토큰입니다.' },
        { status: 400 }
      );
    }

    // Check if token has expired (simple implementation)
    // In production, store expiry date and validate
    const tokenCreated = new Date(member.emailVerificationTokenAt || Date.now());
    const tokenAge = Date.now() - tokenCreated.getTime();
    const oneHour = 60 * 60 * 1000;

    if (tokenAge > oneHour) {
      return NextResponse.json(
        { success: false, error: '토큰이 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 }
      );
    }

    // Reset password
    await updateMemberPassword(member.id, {
      currentPassword: '', // Not needed for reset
      newPassword,
    });

    // Clear token
    // In production, clear the emailVerificationToken
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset_password',
      }),
    });

    return NextResponse.json({
      success: true,
      message: '비밀번호가 재설정되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: '비밀번호 재설정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
