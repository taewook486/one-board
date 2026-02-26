import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { boardPosts } from '@/lib/db/schema';
import { sql, eq, or, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/helper';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schema for bulk delete
const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive('유효하지 않은 게시글 ID입니다.'))
    .min(1, '삭제할 게시글 ID가 필요합니다.')
    .max(100, '한 번에 최대 100개까지 삭제할 수 있습니다.'),
});

/**
 * DELETE /api/posts/bulk - Bulk delete multiple posts (Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated admin user
    const sessionUser = await requireAdmin();

    const body = await request.json();

    // Validate input
    const validatedData = bulkDeleteSchema.parse(body);
    const { ids } = validatedData;

    // Delete all posts using Drizzle ORM's or() operator
    const conditions = ids.map(id => eq(boardPosts.id, id));
    await db.delete(boardPosts).where(or(...conditions));

    return NextResponse.json({
      success: true,
      message: `${ids.length}개의 게시글이 삭제되었습니다.`,
      deletedCount: ids.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Bulk delete posts error:', error);
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
