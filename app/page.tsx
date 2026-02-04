'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import type { Post as PostCardPost } from '@/components/PostCard';

interface Post extends PostCardPost {
  board_id?: number;
  boardKey?: string;
}

interface Board {
  id: number;
  name: string;
  board_key: string;
  category?: string;
  icon?: string;
  description?: string;
  post_count?: number;
  boardKey?: string;
}

interface User {
  id: number;
  nickname?: string;
  username: string;
  role: number;
}

export default function HomePage() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get session
        const sessionRes = await fetch('/api/auth/me');
        if (sessionRes.ok) {
          const data = await sessionRes.json();
          if (data.authenticated && data.user) {
            setSessionUser(data.user);
          }
        } else {
          console.warn('Session API returned non-success status:', sessionRes.status);
          setSessionUser(null);
        }

        // Fetch boards first to create mapping
        const boardsRes = await fetch('/api/boards');
        const boardsData = await boardsRes.json();
        const boardsList = boardsData.boards || [];
        setBoards(boardsList);

        // Create board ID to boardKey mapping
        const boardMap = new Map<number, Board>(boardsList.map((b: Board) => [b.id, b]));

        // Fetch posts in parallel
        const [popularRes, latestRes] = await Promise.all([
          fetch('/api/posts/popular?sortBy=likeCount&limit=5'),
          fetch('/api/posts?recent=true&limit=10'),
        ]);

        if (popularRes.ok) {
          const popularData = await popularRes.json();
          const posts = (popularData.posts || []).map((post: any) => {
            const board: Board | undefined = boardMap.get(post.board_id);
            return { ...post, boardKey: board?.board_key };
          });
          setPopularPosts(posts);
        } else {
          console.error('Error fetching popular posts:', popularRes.status);
          setPopularPosts([]);
        }

        if (latestRes.ok) {
          const latestData = await latestRes.json();
          const posts = (latestData.posts || []).map((post: any) => {
            const board: Board | undefined = boardMap.get(post.board_id);
            return { ...post, boardKey: board?.board_key };
          });
          setLatestPosts(posts);
        } else {
          console.error('Error fetching latest posts:', latestRes.status);
          setLatestPosts([]);
        }

        // Find notice board and fetch announcements
        const noticeBoard = boardsList.find((b: Board) => b.boardKey === 'notice');
        if (noticeBoard) {
          const noticeRes = await fetch(`/api/posts?boardId=${noticeBoard.id}&limit=5`);
          if (noticeRes.ok) {
            const noticeData = await noticeRes.json();
            const posts = (noticeData.posts || []).map((post: Post) => ({
              ...post,
              boardKey: 'notice'
            }));
            setAnnouncements(posts);
          } else {
            console.warn('Notice API returned non-success status:', noticeRes.status);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        // Set default/empty states on error to prevent UI crashes
        setSessionUser(null);
        setBoards([]);
        setPopularPosts([]);
        setLatestPosts([]);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Community Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-yellow-200 via-yellow-100 to-white bg-clip-text text-transparent">
                  One Board
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-blue-100 max-w-2xl">
                Connect, share, and engage with the community. Your ideas matter here.
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                {sessionUser ? (
                  <>
                    <Link
                      href="/search"
                      className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Explore Posts
                    </Link>
                    <Link
                      href="/write?board=free"
                      className="group inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold shadow-lg hover:bg-primary-400 hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/30"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Write Post
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="group inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold shadow-lg hover:bg-primary-400 hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/30"
                    >
                      Join Now
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mt-12 lg:mt-0 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl font-bold mb-1">{boards.length}</div>
                <div className="text-blue-100 text-sm">Active Boards</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl font-bold mb-1">{latestPosts.length + popularPosts.length}</div>
                <div className="text-blue-100 text-sm">Recent Posts</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl font-bold mb-1">
                  {sessionUser ? sessionUser.nickname?.split(' ')[0] || sessionUser.username : 'Guest'}
                </div>
                <div className="text-blue-100 text-sm">
                  {sessionUser ? 'Welcome back!' : 'Join our community'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl font-bold mb-1">🚀</div>
                <div className="text-blue-100 text-sm">Growing Fast</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 lg:h-24" viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L48 45.7C96 41.3 192 32.7 288 35.8C384 39 480 54 576 58.3C672 62.7 768 56.3 864 47.5C960 38.7 1056 27.3 1152 30.3C1248 33.3 1344 50.7 1392 59.3L1440 68V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="url(#gradient0)" />
            <defs>
              <linearGradient id="gradient0" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#F8FAFC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
              </div>
              <Link
                href="/board/notice"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 group"
              >
                View All
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {announcements.map((post) => (
                <Link
                  key={post.id}
                  href={`/board/${post.boardKey || 'notice'}/${post.id}`}
                  className="group bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 hover:border-amber-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      NOTICE
                    </span>
                    <svg className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {post.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {post.viewCount}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Two Column Layout: Popular & Latest */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Popular Posts */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Popular Posts</h2>
              </div>
              <Link
                href="/search?sortBy=likeCount"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 group"
              >
                More
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {popularPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">💭</div>
                <p className="text-gray-500">No popular posts yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {popularPosts.map((post, index) => (
                  <div key={post.id} className="relative">
                    {/* Rank Badge */}
                    <div className={`absolute -left-2 -top-2 w-10 h-10 flex items-center justify-center rounded-full font-bold text-white shadow-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                      'bg-gradient-to-br from-blue-400 to-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <Link
                      href={`/board/${post.boardKey || 'free'}/${post.id}`}
                      className="block bg-white rounded-2xl border-2 border-gray-200 p-5 pl-14 hover:border-primary-400 hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-2">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {post.authorName || post.nickname || '익명'}
                            </span>
                            <span className="flex items-center gap-1 text-rose-500">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {post.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {post.viewCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Latest Posts */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Latest Posts</h2>
              </div>
              <Link
                href="/search"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 group"
              >
                More
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {latestPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500">No posts yet. Be the first to write!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/board/${post.boardKey || 'free'}/${post.id}`}
                    className="group block bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-primary-400 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Badge */}
                      {post.category && (
                        <span className="flex-shrink-0 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                          {post.category}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="truncate max-w-[150px]">{post.authorName || post.nickname || '익명'}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          {post.commentCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-primary-600 font-medium">{post.commentCount} comments</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Boards Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">All Boards</h2>
            </div>
          </div>

          {boards.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-gray-500">No boards available yet</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/board/${board.boardKey}`}
                  className="group bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-primary-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                      {board.icon || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {board.name}
                      </h3>
                      {board.category && (
                        <p className="text-xs text-gray-500">{board.category}</p>
                      )}
                    </div>
                  </div>
                  {board.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {board.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {board.post_count || 0} posts
                    </span>
                    <span className="flex items-center gap-1 text-primary-500">
                      Explore →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">O</span>
                </div>
                <span className="text-xl font-bold text-gray-900">One Board</span>
              </div>
              <p className="text-gray-600 text-sm">
                A modern community platform for sharing ideas, connecting with others, and building meaningful discussions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/search" className="hover:text-primary-600 transition-colors">
                    Browse Posts
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="hover:text-primary-600 transition-colors">
                    Search
                  </Link>
                </li>
                <li>
                  <Link href="/board/notice" className="hover:text-primary-600 transition-colors">
                    Announcements
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Get Started</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {sessionUser ? (
                  <>
                    <li>
                      <Link href="/write?board=free" className="hover:text-primary-600 transition-colors">
                        Write a Post
                      </Link>
                    </li>
                    <li>
                      <Link href="/profile" className="hover:text-primary-600 transition-colors">
                        My Profile
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className="hover:text-primary-600 transition-colors">
                        Sign In
                      </Link>
                    </li>
                    <li>
                      <Link href="/register" className="hover:text-primary-600 transition-colors">
                        Create Account
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} One Board. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
