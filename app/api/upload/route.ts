import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, uploadMultipleFiles } from '@/lib/upload/fileUploader';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schema for file upload metadata
const uploadMetadataSchema = z.object({
  postId: z.coerce.number().int().positive().optional(),
  commentId: z.coerce.number().int().positive().optional(),
  memberId: z.coerce.number().int().positive().optional(),
  isTemp: z.coerce.boolean().default(false),
});

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    // Validate files exist
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '업로드할 파일이 없습니다.' },
        { status: 400 }
      );
    }

    // Validate file count
    if (files.length > 10) {
      return NextResponse.json(
        { error: '최대 10개까지 파일을 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} 파일이 너무 큽니다. 최대 10MB까지 업로드 가능합니다.` },
          { status: 400 }
        );
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `${file.name} 파일은 지원하지 않는 형식입니다.` },
          { status: 400 }
        );
      }
    }

    // Validate metadata
    const metadata = uploadMetadataSchema.parse({
      postId: formData.get('postId') || undefined,
      commentId: formData.get('commentId') || undefined,
      memberId: formData.get('memberId') || undefined,
      isTemp: formData.get('isTemp') || 'false',
    });

    // Upload files
    const uploadResult = await uploadMultipleFiles(files, {
      postId: metadata.postId,
      commentId: metadata.commentId,
      memberId: metadata.memberId,
      isTemp: metadata.isTemp,
      maxFiles: 10,
    });

    if (uploadResult.failCount > 0) {
      return NextResponse.json({
        success: false,
        message: `${uploadResult.successCount}개 파일 업로드 성공, ${uploadResult.failCount}개 실패`,
        results: uploadResult.results,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${uploadResult.successCount}개 파일 업로드 성공`,
      results: uploadResult.results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('File upload error:', error);

    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
