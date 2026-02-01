'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MenuItem from './MenuItem';

interface Section {
  title: string;
  items: {
    label: string;
    icon: string;
    path: string;
    badge?: string;
  }[];
}

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  const sections: Section[] = [
    {
      title: '메인 메뉴',
      items: [
        {
          label: '대시보드',
          icon: 'dashboard',
          path: '/admin/dashboard',
        },
        {
          label: '회원 관리',
          icon: 'group',
          path: '/admin/members',
        },
        {
          label: '게시글 관리',
          icon: 'article',
          path: '/admin/posts',
        },
        {
          label: '신고 관리',
          icon: 'bug_report',
          path: '/admin/reports',
        },
      ],
    },
    {
      title: '설정',
      items: [
        {
          label: '설정',
          icon: 'settings',
          path: '/admin/config',
        },
        {
          label: '시스템 설정',
          icon: 'tune',
          path: '/admin/system',
        },
      ],
    },
    {
      title: '고객 지원',
      items: [
        {
          label: '고객 지원',
          icon: 'support_agent',
          path: '/admin/support',
        },
      ],
    },
  ];

  return (
    <aside className={`w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-shrink-0 flex flex-col transition-colors duration-200 ${className || ''}`}>
      {/* Sidebar Header */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="size-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
          <span className="material-symbols-outlined">dashboard</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-tight text-text-main-light dark:text-white">One Board</h1>
          <p className="text-xs text-text-sub-light dark:text-text-sub-dark font-medium">Admin System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto py-4">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <p className="px-4 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark mb-2 uppercase tracking-wider">
              {section.title}
            </p>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <MenuItem
                  key={item.path}
                  label={item.label}
                  icon={item.icon}
                  path={item.path}
                  badge={item.badge}
                />
              ))}
            </div>
            {sectionIndex < sections.length - 1 && (
              <div className="my-4 border-t border-border-light dark:border-border-dark"></div>
            )}
          </div>
        ))}
      </nav>

      {/* User Info / Logout */}
      <div className="p-4 border-t border-border-light dark:border-border-dark">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="size-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-text-main-light dark:text-white truncate">Admin</span>
            <span className="text-xs text-text-sub-light dark:text-text-sub-dark truncate">System Admin</span>
          </div>
        </div>
        <button
          className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-background-light dark:bg-background-dark hover:bg-red-50 dark:hover:bg-red-900/20 text-text-sub-light dark:text-text-sub-dark hover:text-red-600 dark:hover:text-red-400 text-sm font-bold transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
