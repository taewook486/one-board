'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSkin } from '@/components/SkinProvider';
import NotificationBell from '@/components/NotificationBell';

interface Board {
  id: number;
  name: string;
  boardKey: string;
  category?: string;
  icon?: string;
  description?: string;
}

interface User {
  id: number;
  username: string;
  nickname: string;
  role: number;
  profileImage?: string | null;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { darkMode, setDarkMode } = useSkin();
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [isBoardsDropdownOpen, setIsBoardsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileBoardsOpen, setIsMobileBoardsOpen] = useState(false);

  const boardsDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch session user
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setSessionUser(data.user);
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
    };

    loadSession();
  }, []);

  // Fetch boards
  useEffect(() => {
    const loadBoards = async () => {
      setLoadingBoards(true);
      try {
        const res = await fetch('/api/boards');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.boards) {
            setBoards(data.boards);
          }
        }
      } catch (error) {
        console.error('Error loading boards:', error);
      } finally {
        setLoadingBoards(false);
      }
    };

    loadBoards();
  }, []);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boardsDropdownRef.current && !boardsDropdownRef.current.contains(event.target as Node)) {
        setIsBoardsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileBoardsOpen(false);
  }, [pathname]);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBoardsDropdownOpen(false);
        setIsUserDropdownOpen(false);
        setIsMobileMenuOpen(false);
        setIsMobileBoardsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSessionUser(null);
      setIsUserDropdownOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Group boards by category
  const groupedBoards = boards.reduce((acc, board) => {
    const category = board.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(board);
    return acc;
  }, {} as Record<string, Board[]>);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary-500/25 transition-all duration-300 group-hover:scale-105">
                <span className="text-white text-xl font-bold">O</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                One Board
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Boards Dropdown */}
            <div className="relative" ref={boardsDropdownRef}>
              <button
                onClick={() => {
                  setIsBoardsDropdownOpen(!isBoardsDropdownOpen);
                  setIsUserDropdownOpen(false);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isBoardsDropdownOpen
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>Boards</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isBoardsDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Boards Dropdown Menu */}
              {isBoardsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">All Boards</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {loadingBoards ? 'Loading...' : `${boards.length} board${boards.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {loadingBoards ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                      </div>
                    ) : boards.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No boards available
                      </div>
                    ) : (
                      Object.entries(groupedBoards).map(([category, categoryBoards], idx) => (
                        <div key={category} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in slide-in-from-top-2 duration-200">
                          {category !== 'General' && (
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {category}
                            </div>
                          )}
                          {categoryBoards.map((board) => (
                            <Link
                              key={board.id}
                              href={`/board/${board.boardKey}`}
                              onClick={() => setIsBoardsDropdownOpen(false)}
                              className={`flex items-center space-x-3 px-4 py-3 hover:bg-primary-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ${
                                pathname === `/board/${board.boardKey}`
                                  ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500'
                                  : 'border-l-2 border-transparent'
                              }`}
                            >
                              {board.icon && (
                                <span className="text-xl">{board.icon}</span>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {board.name}
                                </p>
                                {board.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {board.description}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ))
                    )}
                  </div>

                  {sessionUser?.role === 2 && (
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <Link
                    href="/admin/boards"
                    onClick={() => setIsBoardsDropdownOpen(false)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Manage Boards</span>
                  </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Search Link */}
            <Link
              href="/search"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === '/search'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Search
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            {sessionUser && (
              <div className="ml-1">
                <NotificationBell memberId={sessionUser.id} />
              </div>
            )}

            {/* User Menu */}
            {sessionUser ? (
              <div className="relative ml-2" ref={userDropdownRef}>
                <button
                  onClick={() => {
                    setIsUserDropdownOpen(!isUserDropdownOpen);
                    setIsBoardsDropdownOpen(false);
                  }}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                    <span className="text-white font-semibold text-sm">
                      {sessionUser.nickname?.[0] || sessionUser.username[0]}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {sessionUser.nickname || sessionUser.username}
                    </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {sessionUser.role === 2 ? 'Admin' : 'Member'}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 hidden lg:block ${
                    isUserDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {sessionUser.nickname || sessionUser.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {sessionUser.username}
                      </p>
                    </div>

                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                      </Link>

                      {sessionUser.role === 2 && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden ml-2 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-4 duration-200">
          <nav className="px-4 py-4 space-y-2">
            {/* Mobile Boards */}
            <div>
              <button
                onClick={() => setIsMobileBoardsOpen(!isMobileBoardsOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span className="font-medium">Boards</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isMobileBoardsOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isMobileBoardsOpen && (
                <div className="mt-2 ml-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {loadingBoards ? (
                    <div className="py-8 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                  ) : boards.length === 0 ? (
                    <div className="py-4 text-sm text-gray-500 dark:text-gray-400">
                      No boards available
                    </div>
                  ) : (
                    boards.map((board) => (
                      <Link
                        key={board.id}
                        href={`/board/${board.boardKey}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          pathname === `/board/${board.boardKey}`
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {board.icon && <span className="text-lg">{board.icon}</span>}
                        <span>{board.name}</span>
                      </Link>
                    ))
                  )}
                  {sessionUser?.role === 2 && (
                    <Link
                      href="/admin/boards"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Manage Boards</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Search */}
            <Link
              href="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/search'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </Link>

            {/* Mobile User Links */}
            {sessionUser && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile</span>
                  </Link>

                  {sessionUser.role === 2 && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
