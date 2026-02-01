'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/common';

interface Notification {
  id: number;
  type: 'post' | 'comment' | 'like' | 'mention' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  memberId: number | null;
}

export default function NotificationBell({ memberId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!memberId) return;

    try {
      const res = await fetch(`/api/notifications?memberId=${memberId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      // Silently ignore errors - notifications table may not exist yet
      // console.error('Error fetching notifications:', error);
    }
  }, [memberId]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    if (memberId) {
      fetchNotifications();
    }
  }, [memberId, fetchNotifications]);

  useEffect(() => {
    // Update document title with unread count
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) One Board`;
    } else {
      document.title = 'One Board';
    }
  }, [unreadCount]);

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'post':
        return '📝';
      case 'comment':
        return '💬';
      case 'like':
        return '👍';
      case 'mention':
        return '@️';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'system':
        return 'bg-gray-50 border-gray-200';
      case 'like':
        return 'bg-red-50 border-red-200';
      case 'comment':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (!memberId) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
        title="알림"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[500px] overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900">알림</h3>
                <p className="text-xs text-gray-500">
                  {notifications.length}개의 알림, {unreadCount}개 읽지 않음
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  알림이 없습니다.
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(new Date(notification.createdAt))}
                      </p>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          보러 가기 →
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t bg-gray-50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  모든 알림 보기
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export type { Notification };
