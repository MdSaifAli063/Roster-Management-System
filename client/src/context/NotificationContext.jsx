import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/client';

const POLL_MS = Number(import.meta.env.VITE_NOTIFICATION_POLL_MS) || 20000;

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !localStorage.getItem('token')) return;
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 30 } }),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.data.count || 0);
      setConnected(true);
    } catch (err) {
      setConnected(false);
      if (err.response?.status === 401) return;
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) {
      setNotifications([]);
      setUnreadCount(0);
      setConnected(false);
      return;
    }

    refresh();

    const interval = setInterval(refresh, POLL_MS);

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user, authLoading, refresh]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const clearNotification = async (id) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id);
      if (removed && !removed.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  };

  const clearAllNotifications = async () => {
    await api.delete('/notifications/clear-all');
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connected,
        refresh,
        markRead,
        markAllRead,
        clearNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
