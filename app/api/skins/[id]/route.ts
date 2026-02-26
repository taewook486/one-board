import { NextRequest, NextResponse } from 'next/server';
import {
  findSkinById,
  updateSkin,
  deleteSkin,
} from '@/lib/db/skins';
import logger from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const skin = await findSkinById(parseInt(id));

    if (!skin) {
      return NextResponse.json(
        { success: false, error: '스킨을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      skin,
    });
  } catch (error) {
    logger.error('Error fetching skin:', error);
    return NextResponse.json(
      { success: false, error: '스킨 정보를 불러오는데 실패했습니다.' },
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
    const data = await request.json();
    const skinId = parseInt(id);

    const updatedSkin = await updateSkin(skinId, {
      name: data.name,
      version: data.version,
      description: data.description,
      config: data.config,
      isActive: data.isActive,
    });

    return NextResponse.json({
      success: true,
      skin: updatedSkin,
      message: '스킨이 수정되었습니다.',
    });
  } catch (error) {
    logger.error('Error updating skin:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '스킨 수정에 실패했습니다.' },
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
    const skinId = parseInt(id);
    await deleteSkin(skinId);

    return NextResponse.json({
      success: true,
      message: '스킨이 삭제되었습니다.',
    });
  } catch (error) {
    logger.error('Error deleting skin:', error);
    return NextResponse.json(
      { success: false, error: '스킨 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
