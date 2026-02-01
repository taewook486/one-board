'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/common';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalBoards: 0,
    totalPosts: 0,
    totalComments: 0,
    todayVisitors: 0,
    totalVisitors: 0,
  });
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [postStats, setPostStats] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [activeMembers, setActiveMembers] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch basic stats
        const statsRes = await fetch('/api/stats?type=basic');
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }

        // Fetch daily stats
        const dailyRes = await fetch('/api/stats?type=daily&days=7');
        const dailyData = await dailyRes.json();
        if (dailyData.success) {
          setDailyStats(dailyData.stats.slice(0, 7)); // Last 7 days
        }

        // Fetch post stats
        const postsRes = await fetch('/api/stats/posts?type=stats&days=7');
        const postsData = await postsRes.json();
        if (postsData.success) {
          setPostStats(postsData.posts);
        }

        // Fetch trending posts
        const trendingRes = await fetch('/api/stats/posts?type=trending');
        const trendingData = await trendingRes.json();
        if (trendingData.success) {
          setTrendingPosts(trendingData.posts);
        }

        // Fetch active members
        const membersRes = await fetch('/api/stats/members/active?limit=5');
        const membersData = await membersRes.json();
        if (membersData.success) {
          setActiveMembers(membersData.members || []);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <header className="h-16 flex items-center justify-between px-8 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">대시보드</h2>
          <span className="h-6 w-px bg-gray-200 mx-2"></span>
          <div className="flex items-center text-sm text-gray-500">
            <span>홈</span>
            <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
            <span className="font-medium text-blue-600">개요</span>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">총 회원</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalMembers}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">총 게시판</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalBoards}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">총 게시글</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPosts}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">총 댓글</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalComments}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">오늘 방문자</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.todayVisitors}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">총 방문자</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalVisitors}</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Visitors Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">일일 방문자 추이</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#2563EB" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="posts" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="comments" 
                  stroke="#F59E0B" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#EF4444" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Post Statistics Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">게시글 통계 (7일)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={postStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #9CA3AF', borderRadius: '4px' }}
                  formatter={(value, name) => [name === 'count' ? '게시글' : name, value].join(': ')}
                  itemStyle={{ backgroundColor: '#2563EB', padding: '8px', borderRadius: '4px' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#2563EB" 
                  name="게시글"
                />
                <Bar 
                  dataKey="views" 
                  fill="#9CA3AF" 
                  name="조회수"
                />
                <Bar 
                  dataKey="likes" 
                  fill="#F59E0B" 
                  name="좋아요"
                />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trending Posts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">인기 게시글</h2>
            </div>
            <div className="p-6">
              {(!trendingPosts || trendingPosts.length === 0) ? (
                <p className="text-center text-gray-500 py-8">게시글이 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {trendingPosts.map((post, index) => (
                    <li key={post.id}>
                      <Link
                        href={`/board/${post.boardKey || 'free'}/${post.id}`}
                        className="block group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-900 group-hover:text-blue-600">
                              {post.title}
                            </span>
                            <div className="text-sm text-gray-500 truncate">
                              {post.boardName}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>👁 {post.viewCount}</span>
                            <span>👍 {post.likeCount}</span>
                            <span>💬 {post.commentCount}</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Active Members */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">활동 회원 (7일)</h2>
            </div>
            <div className="p-6">
              {(!activeMembers || activeMembers.length === 0) ? (
                <p className="text-center text-gray-500 py-8">활동 회원이 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {activeMembers.map((member) => (
                    <li key={member.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {member.nickname.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{member.nickname}</div>
                        <div className="text-sm text-gray-500">{member.postCount}개 게시글</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">최근 활동</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">새 회원 가입: +{stats.totalMembers}명</div>
                  <div className="text-sm text-gray-500">이번 주</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">새 게시글: +{stats.totalPosts}개</div>
                  <div className="text-sm text-gray-500">이번 주</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">새 댓글: +{stats.totalComments}개</div>
                  <div className="text-sm text-gray-500">이번 주</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">오늘 방문자: {stats.todayVisitors}명</div>
                  <div className="text-sm text-gray-500">실시간</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
