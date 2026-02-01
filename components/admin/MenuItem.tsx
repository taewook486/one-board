'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface MenuItemProps {
  label: string;
  icon: string;
  path: string;
  badge?: string;
}

export default function MenuItem({ label, icon, path, badge }: MenuItemProps) {
  const pathname = usePathname();
  const isActive = pathname?.startsWith(path);

  return (
    <Link
      href={path}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium group ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-text-sub-light dark:text-text-sub-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-text-main-light dark:hover:text-white'
      }`}
    >
      <span className={`material-symbols-outlined transition-colors ${
        isActive ? 'text-primary' : 'group-hover:text-text-main-light dark:group-hover:text-white'
      }`}>
        {icon}
      </span>
      <span>{label}</span>
      {badge && (
        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}
