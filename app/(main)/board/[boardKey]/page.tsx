import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/common';
import { cookies } from 'next/headers';
import { getBoardSkinWithStyles } from '@/lib/skin/skinLoader';
import BoardSkinStyles from '@/components/BoardSkinStyles';
import BoardStats from '@/components/board/BoardStats';
import BoardPagination from '@/components/BoardPagination';

interface BoardListPageProps {
  params: Promise<{
    boardKey: string;
   }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    category?: string;
   }>;
}

export default async function BoardListPage({
  params,
  searchParams,
}: BoardListPageProps) {
  const { boardKey } = await params;
  const { page = '1', sort = 'createdAt', category } = await searchParams;

  const pageNum = parseInt(page);
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  // Load skin configuration for this board
  const skinResult = await getBoardSkinWithStyles(boardKey);

  // Check if user is logged in
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const sessionUser = sessionCookie ? JSON.parse(sessionCookie.value) : null;

  // Fetch all boards
  const boardsResponse = await fetch(
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/boards`,
    {
      cache: 'no-store',
    }
  );
  const boardsData = await boardsResponse.json();

  // Find the specific board by key
  const board = boardsData.boards?.find((b: any) => b.boardKey === boardKey);

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            게시판을 찾을 수 없습니다.
          </h1>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // Fetch posts
  const postsResponse = await fetch(
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/posts?boardId=${board.id}&limit=${limit}&offset=${offset}&sortBy=${sort}${category ? `&category=${category}` : ''}`,
    {
      cache: 'no-store',
    }
  );
  const postsData = await postsResponse.json();

  const posts = postsData.posts || [];

  // Fetch stats for visitor count
  let todayVisitors = 0;
  try {
    const statsResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stats?type=basic`,
      {
        cache: 'no-store',
      }
    );
    const statsData = await statsResponse.json();
    if (statsData.success && statsData.stats) {
      todayVisitors = statsData.stats.todayVisitors || 0;
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }

  return (
    <BoardSkinStyles skinConfig={skinResult.skinConfig} scopePrefix={skinResult.scopePrefix}>
      <div data-board-skin-scope className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Board Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {board.name}
            </h1>
            {board.description && (
              <p className="mt-2 text-gray-600">{board.description}</p>
            )}
          </div>

          {/* Board Stats */}
          <BoardStats
            totalMembers={postsData.total || posts.length}
            totalBoards={boardsData.boards?.length || 0}
            totalPosts={postsData.total || posts.length}
            todayVisitors={todayVisitors}
          />

          {/* Board Actions */}
          <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Sort */}
            <div className="flex gap-2">
              <Link
                href={`/board/${boardKey}?sort=createdAt`}
                className={`px-3 py-1 rounded text-sm ${sort === 'createdAt' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                최신순
              </Link>
              <Link
                href={`/board/${boardKey}?sort=viewCount`}
                className={`px-3 py-1 rounded text-sm ${sort === 'viewCount' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                조회순
              </Link>
              <Link
                href={`/board/${boardKey}?sort=likeCount`}
                className={`px-3 py-1 rounded text-sm ${sort === 'likeCount' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                추천순
              </Link>
            </div>

            {/* Write Button */}
            <div className="flex gap-2">
              {sessionUser && (
                <Link
                  href={`/write?board=${boardKey}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                  글쓰기
                </Link>
              )}
              {!sessionUser && (
                <span
                  className="bg-gray-300 text-gray-600 px-4 py-2 rounded-md font-medium"
                  title="로그인이 필요합니다."
                >
                  글쓰기
                </span>
              )}
            </div>
          </div>

          {/* Posts Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    작성자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    작성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    조회
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    추천
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      게시글이 없습니다.
                    </td>
                  </tr>
                ) : (
                  posts.map((post: any, index: number) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {postsData.total - offset - index}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/board/${boardKey}/${post.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900"
                        >
                          {post.title}
                          {post.commentCount > 0 && (
                            <span className="ml-2 text-gray-500">[{post.commentCount}]</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.authorName || post.nickname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeTime(post.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.viewCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.likeCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Advanced Pagination */}
          <div className="mt-6">
            <BoardPagination
              currentPage={pageNum}
              totalPages={Math.ceil((postsData.total || posts.length) / 20)}
            />
          </div>
        </div>
      </div>
    </BoardSkinStyles>
  );
}
