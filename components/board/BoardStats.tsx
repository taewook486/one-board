'use client';

import StatCard from './StatCard';

interface BoardStatsProps {
  totalMembers?: number;
  totalBoards?: number;
  totalPosts?: number;
  totalComments?: number;
  todayVisitors?: number;
}

export default function BoardStats({ totalMembers, totalBoards, totalPosts, totalComments, todayVisitors }: BoardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {totalMembers !== undefined && (
        <StatCard
          title="총 회원"
          value={totalMembers}
          trend={{ value: 12.3, isPositive: true }}
          color="blue"
        />
      )}
      {totalBoards !== undefined && (
        <StatCard
          title="총 게시판"
          value={totalBoards}
          trend={{ value: 2.5, isPositive: true }}
          color="green"
        />
      )}
      {totalPosts !== undefined && (
        <StatCard
          title="총 게시글"
          value={totalPosts}
          trend={{ value: 5.1, isPositive: true }}
          color="purple"
        />
      )}
      {totalComments !== undefined && (
        <StatCard
          title="총 댓글"
          value={totalComments}
          trend={{ value: 12, isPositive: true }}
          color="orange"
        />
      )}
      {todayVisitors !== undefined && (
        <StatCard
          title="오늘 방문자"
          value={todayVisitors}
          color="blue"
        />
      )}
    </div>
  );
}
