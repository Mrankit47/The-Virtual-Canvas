'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, ShoppingBag, CreditCard, User, Clock, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_success': return <CreditCard className="text-green-500" size={14} />;
      case 'assigned': return <User className="text-blue-500" size={14} />;
      case 'progress': return <Clock className="text-yellow-500" size={14} />;
      case 'completed': return <Check className="text-green-600" size={14} />;
      default: return <ShoppingBag className="text-ink/40" size={14} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-ink/60 hover:bg-ink/5 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center font-bold rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-white border border-ink/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-ink/5 flex justify-between items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-ink">Notifications</p>
              {unreadCount > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
            </div>

            <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto text-ink/10 mb-3" size={32} />
                  <p className="text-[11px] text-ink/30 uppercase tracking-widest">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif._id}
                    onClick={() => {
                        if (!notif.read) markAsRead(notif._id);
                    }}
                    className={`px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-ink/5 last:border-0 relative ${!notif.read ? 'bg-blue-50/30' : ''}`}
                  >
                    {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center shrink-0">
                            {getIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                            <p className={`text-xs leading-relaxed ${!notif.read ? 'font-semibold text-ink' : 'text-ink/60'}`}>
                                {notif.message}
                            </p>
                            <p className="text-[9px] text-ink/30 mt-1 uppercase tracking-wider">
                                {formatDistanceToNow(new Date(notif.createdAt))} ago
                            </p>
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-ink/5 text-center">
                <Link 
                  href="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/40 hover:text-ink transition-colors block w-full"
                >
                    View All Activity
                </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
