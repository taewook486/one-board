import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { notifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 알림 ID입니다.' },
        { status: 400 }
      );
    }

    // Mark notification as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: '알림 읽음 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
