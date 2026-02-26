import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { notifications } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schemas
const getNotificationsSchema = z.object({
  memberId: z.coerce.number().int().positive('유효하지 않은 회원 ID입니다.'),
});

const createNotificationSchema = z.object({
  memberId: z.number().int().positive('유효하지 않은 회원 ID입니다.'),
  type: z.string().min(1, '알림 타입이 필요합니다.'),
  title: z.string().min(1, '알림 제목이 필요합니다.').max(255, '제목은 최대 255자까지 입력 가능합니다.'),
  message: z.string().min(1, '알림 내용이 필요합니다.'),
  link: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    // Validate input
    const validatedData = getNotificationsSchema.parse({ memberId });

    // Fetch notifications for member
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.memberId, validatedData.memberId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      notifications: userNotifications,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: '알림을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createNotificationSchema.parse(body);

    // Create notification
    const result = await db
      .insert(notifications)
      .values({
        memberId: validatedData.memberId,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        link: validatedData.link,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      notification: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Error creating notification:', error);
    return NextResponse.json(
      { error: '알림 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
