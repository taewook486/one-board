import { NextRequest, NextResponse } from 'next/server';
import {
  findSkinById,
  updateSkin,
  deleteSkin,
} from '@/lib/db/skins';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skin = await findSkinById(parseInt(params.id));

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
    console.error('Error fetching skin:', error);
    return NextResponse.json(
      { success: false, error: '스킨 정보를 불러오는데 실패했습니다.' },
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
    const skinId = parseInt(params.id);

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
    console.error('Error updating skin:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '스킨 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skinId = parseInt(params.id);
    await deleteSkin(skinId);

    return NextResponse.json({
      success: true,
      message: '스킨이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Error deleting skin:', error);
    return NextResponse.json(
      { success: false, error: '스킨 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
