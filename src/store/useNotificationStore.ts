import { create } from 'zustand';

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  orderId?: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter((n: Notification) => !n.read).length;
        set({ notifications: data, unreadCount: unread, loading: false });
      }
    } catch (err) {
      console.error('Fetch notifications failed:', err);
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    const { notifications, unreadCount } = get();
    // Optimistic Update
    const updatedNotifications = notifications.map(n => 
      n._id === id ? { ...n, read: true } : n
    );
    set({ 
        notifications: updatedNotifications, 
        unreadCount: Math.max(0, unreadCount - 1) 
    });

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    // Optimistic Update
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    set({ 
        notifications: updatedNotifications, 
        unreadCount: 0 
    });

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.error('Mark all as read failed:', err);
    }
  },
}));
