'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { 
  Bell, 
  Check, 
  Trash2, 
  Clock, 
  CreditCard, 
  User, 
  ShoppingBag,
  CheckCheck,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function NotificationCenter() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, loading } = useNotificationStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_success': return <CreditCard className="text-green-500" size={18} />;
      case 'assigned': return <User className="text-blue-500" size={18} />;
      case 'progress': return <Clock className="text-yellow-500" size={18} />;
      case 'completed': return <Check className="text-green-600" size={18} />;
      default: return <ShoppingBag className="text-ink/40" size={18} />;
    }
  };

  const categories = [
    { id: 'all', label: 'All Updates', icon: Bell },
    { id: 'unread', label: 'Unread', icon: CheckCheck },
    { id: 'payment_success', label: 'Payments', icon: CreditCard },
    { id: 'progress', label: 'Work Progress', icon: Clock },
    { id: 'completed', label: 'Completed', icon: Check },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-playfair text-ink">Notifications</h1>
          <p className="text-sm text-ink/40 mt-1 uppercase tracking-widest font-medium">Keep track of your artwork journey</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-6 py-3 bg-ink text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-ink/20"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-xl border transition-all ${
              filter === cat.id 
                ? 'bg-ink text-white border-ink shadow-lg shadow-ink/10' 
                : 'bg-white text-ink/60 border-ink/5 hover:border-ink/20 hover:bg-gray-50'
            }`}
          >
            <cat.icon size={12} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-ink/5 shadow-sm overflow-hidden min-h-[400px]">
        {loading && notifications.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 border-4 border-ink/5 border-t-ink rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/30">Syncing updates...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <Bell className="text-ink/10" size={32} />
              </div>
              <h3 className="text-lg font-bold text-ink">Inbox is empty</h3>
              <p className="text-sm text-ink/40 max-w-xs">There are no notifications in your queue matching this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink/5">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notif, index) => (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group p-6 flex gap-6 items-start hover:bg-gray-50/50 transition-colors relative ${!notif.read ? 'bg-blue-50/20' : ''}`}
                >
                    {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                    <div className="w-12 h-12 rounded-2xl bg-white border border-ink/5 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-4">
                            <p className={`text-sm leading-relaxed ${!notif.read ? 'font-bold text-ink' : 'text-ink/70'}`}>
                                {notif.message}
                            </p>
                            <span className="text-[10px] font-mono text-ink/20 shrink-0 uppercase tracking-tighter">
                                {formatDistanceToNow(new Date(notif.createdAt))} ago
                            </span>
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                             {notif.orderId && (
                                 <Link 
                                    href={`/dashboard/orders`}
                                    className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-700 transition-colors"
                                 >
                                    View Order #{notif.orderId.slice(-6)}
                                 </Link>
                             )}
                             {!notif.read && (
                                 <button 
                                    onClick={() => markAsRead(notif._id)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-ink/30 hover:text-ink transition-colors"
                                 >
                                    Mark read
                                 </button>
                             )}
                        </div>
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
