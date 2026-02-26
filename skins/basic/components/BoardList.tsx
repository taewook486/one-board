import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/common';
import type { Board } from '@/lib/db';

interface BoardListProps {
  boards: Board[];
  currentBoardKey?: string;
}

export default function BoardList({ boards, currentBoardKey }: BoardListProps) {
  return (
    <div className="space-y-4">
      {boards.map((board) => (
        <div
          key={board.id}
          className={`p-4 rounded-lg border-2 transition-colors ${
            currentBoardKey === board.boardKey
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {board.icon && (
                <span className="text-2xl mr-2">{board.icon}</span>
              )}
              <Link
                href={`/board/${board.boardKey}`}
                className={`text-lg font-bold hover:text-blue-600 ${
                  currentBoardKey === board.boardKey ? 'text-blue-600' : 'text-gray-900'
                }`}
              >
                {board.name}
              </Link>
              {board.description && (
                <p className="mt-1 text-sm text-gray-600">{board.description}</p>
              )}
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>게시글 {board.postCount}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
