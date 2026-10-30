import React, { useState, useEffect, useRef } from 'react';
import {
  fetchNotificationsApi,
  fetchUnreadNotificationCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
} from '../../services/api';
import { NotificationData, NotificationType } from '../../types';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Briefcase,
  Calendar,
  Sparkles,
  Megaphone,
  UserCheck,
  Info,
  Clock,
  X,
} from 'lucide-react';

interface NotificationDropdownProps {
  token: string | null;
  onNavigateToEntity?: (entityType?: string, entityId?: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  token,
  onNavigateToEntity,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      loadUnreadCount();
      // Setup periodic polling interval as reliable fallback for real-time sync
      const interval = setInterval(loadUnreadCount, 15000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen && token) {
      loadNotifications();
    }
  }, [isOpen, filter, token]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadUnreadCount = async () => {
    try {
      const res = await fetchUnreadNotificationCountApi(token);
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Ignore polling errors
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchNotificationsApi(token, {
        isRead: filter === 'UNREAD' ? false : undefined,
        limit: 30,
      });
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await markNotificationAsReadApi(notificationId, token);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      //
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllNotificationsAsReadApi(token);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch {
      //
    }
  };

  const handleDelete = async (notificationId: string, wasUnread: boolean) => {
    try {
      const res = await deleteNotificationApi(notificationId, token);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (wasUnread) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      }
    } catch {
      //
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW_RESCHEDULED':
      case 'INTERVIEW_CANCELLED':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'APPLICATION_SUBMITTED':
      case 'APPLICATION_STATUS_CHANGED':
      case 'DRIVE_PUBLISHED':
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'EVENT_ANNOUNCEMENT':
      case 'EVENT_REGISTRATION_CONFIRMED':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
      case 'CONNECTION_REJECTED':
        return <UserCheck className="w-4 h-4 text-sky-400" />;
      default:
        return <Megaphone className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full border-2 border-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-slate-800 text-xs px-3 pt-2 gap-2">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
                filter === 'ALL'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
                filter === 'UNREAD'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs px-4">
                <Bell className="w-8 h-8 mx-auto text-slate-700 mb-2 opacity-50" />
                <p>No {filter === 'UNREAD' ? 'unread ' : ''}notifications at the moment.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 hover:bg-slate-800/40 transition-colors flex items-start gap-3 group ${
                    !item.isRead ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h5
                        className={`text-xs font-semibold truncate ${
                          item.isRead ? 'text-slate-300' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </h5>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Actions on hover */}
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      {!item.isRead ? (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(item.id)}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                        >
                          <Check className="w-3 h-3" /> Mark as read
                        </button>
                      ) : (
                        <span className="text-slate-600">Read</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, !item.isRead)}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
