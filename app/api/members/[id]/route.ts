import { NextRequest, NextResponse } from 'next/server';
import {
  findMemberById,
  updateMember,
  deleteMember,
  lockAccount,
  unlockAccount,
} from '@/lib/db/members';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schemas
const memberIdSchema = z.object({
  id: z.coerce.number().int().positive('유효하지 않은 회원 ID입니다.'),
});

const updateMemberSchema = z.object({
  nickname: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다.').max(50, '닉네임은 최대 50자까지 입력 가능합니다.').optional(),
  email: z.string().email('유효한 이메일을 입력해주세요.').optional().nullable(),
});

const lockAccountSchema = z.object({
  action: z.literal('lock'),
  reason: z.string().max(500, '사유는 최대 500자까지 입력 가능합니다.').optional(),
});

const unlockAccountSchema = z.object({
  action: z.literal('unlock'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate path parameter
    const { id: memberId } = memberIdSchema.parse({ id });
    const member = await findMemberById(memberId);

    if (!member) {
      return NextResponse.json(
        { success: false, error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      member,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Error fetching member:', error);
    return NextResponse.json(
      { success: false, error: '회원 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate path parameter
    const { id: memberId } = memberIdSchema.parse({ id });
    const data = await request.json();

    // Handle special actions first
    if (data.action === 'lock') {
      const validatedData = lockAccountSchema.parse(data);
      await lockAccount(memberId, validatedData.reason || '관리자에 의한 계정 정지');
      return NextResponse.json({
        success: true,
        message: '계정이 정지되었습니다.',
      });
    }

    if (data.action === 'unlock') {
      const validatedData = unlockAccountSchema.parse(data);
      await unlockAccount(memberId);
      return NextResponse.json({
        success: true,
        message: '계정이 해제되었습니다.',
      });
    }

    // Regular update - validate and process
    const validatedData = updateMemberSchema.parse(data);

    const updatedMember = await updateMember(memberId, {
      nickname: validatedData.nickname,
      email: validatedData.email,
    });

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: '회원 정보가 수정되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, error: '회원 정보를 수정하는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate path parameter
    const { id: memberId } = memberIdSchema.parse({ id });
    await deleteMember(memberId);

    return NextResponse.json({
      success: true,
      message: '회원이 삭제되었습니다.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Error deleting member:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '회원 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
