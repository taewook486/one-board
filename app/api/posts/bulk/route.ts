import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { boardPosts } from '@/lib/db/schema';
import { sql, eq, or, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/helper';

/**
 * DELETE /api/posts/bulk - Bulk delete multiple posts (Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated admin user
    const sessionUser = await requireAdmin();

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '삭제할 게시글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Delete all posts using Drizzle ORM's or() operator
    const conditions = ids.map(id => eq(boardPosts.id, id));
    await db.delete(boardPosts).where(or(...conditions));

    return NextResponse.json({
      success: true,
      message: `${ids.length}개의 게시글이 삭제되었습니다.`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error('Bulk delete posts error:', error);
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
