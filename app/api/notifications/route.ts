import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { notifications } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: '회원 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Fetch notifications for member
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.memberId, parseInt(memberId)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      notifications: userNotifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: '알림을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, type, title, message, link } = body;

    if (!memberId || !type || !title || !message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Create notification
    const result = await db
      .insert(notifications)
      .values({
        memberId: parseInt(memberId),
        type,
        title,
        message,
        link,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      notification: result,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: '알림 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
