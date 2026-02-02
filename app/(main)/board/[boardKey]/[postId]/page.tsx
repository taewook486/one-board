import PostDetailClient from '@/components/board/PostDetailClient';

interface PostDetailPageProps {
  params: Promise<{
    boardKey: string;
    postId: string;
  }>;
}

export default async function PostDetailPage({
  params,
}: PostDetailPageProps) {
  const { boardKey, postId } = await params;

  return <PostDetailClient boardKey={boardKey} postId={postId} />;
}
