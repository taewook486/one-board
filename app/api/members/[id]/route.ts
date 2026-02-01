import { NextRequest, NextResponse } from 'next/server';
import {
  findMemberById,
  updateMember,
  deleteMember,
  lockAccount,
  unlockAccount,
} from '@/lib/db/members';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = await findMemberById(parseInt(params.id));

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
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { success: false, error: '회원 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const memberId = parseInt(params.id);

    // Handle special actions
    if (data.action === 'lock') {
      await lockAccount(memberId, data.reason || '관리자에 의한 계정 정지');
      return NextResponse.json({
        success: true,
        message: '계정이 정지되었습니다.',
      });
    }

    if (data.action === 'unlock') {
      await unlockAccount(memberId);
      return NextResponse.json({
        success: true,
        message: '계정이 해제되었습니다.',
      });
    }

    // Regular update - note: role updates need special handling
    const updatedMember = await updateMember(memberId, {
      nickname: data.nickname,
      email: data.email,
    });

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: '회원 정보가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, error: '회원 정보를 수정하는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = parseInt(params.id);
    await deleteMember(memberId);

    return NextResponse.json({
      success: true,
      message: '회원이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '회원 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
