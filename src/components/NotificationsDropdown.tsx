import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';
import { subscribeNotifications, markNotificationAsRead } from '../firebase/firestore';
import { Bell, Heart, MessageCircle, UserPlus, BookOpen, Check, X } from 'lucide-react';

interface Props {
  onNotificationClick?: (notif: NotificationItem) => void;
}

export const NotificationsDropdown: React.FC<Props> = ({ onNotificationClick }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsub = subscribeNotifications(
      user.uid,
      (items) => {
        setNotifications(items);
      },
      (err) => console.warn('Notifications error:', err)
    );

    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClickItem = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    setIsOpen(false);
    onNotificationClick?.(notif);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return <Heart size={13} className="text-rose-500 fill-rose-500" />;
      case 'comment':
        return <MessageCircle size={13} className="text-amber-500" />;
      case 'follow':
        return <UserPlus size={13} className="text-indigo-500" />;
      default:
        return <BookOpen size={13} className="text-emerald-500" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-black text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 z-50 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleClickItem(n)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      !n.read
                        ? 'bg-amber-500/10 border-amber-500/20 text-zinc-900 dark:text-zinc-100'
                        : 'bg-zinc-50/50 dark:bg-zinc-850/50 border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 shadow-xs shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] leading-snug">
                        <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {n.senderName}
                        </strong>{' '}
                        {n.message}
                      </p>
                      <span className="text-[10px] text-zinc-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
