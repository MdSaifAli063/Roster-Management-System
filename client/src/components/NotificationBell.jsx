import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Wifi, WifiOff, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';
import { cn } from '../lib/utils';

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    connected,
    markRead,
    markAllRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleClick = async (n) => {
    if (!n.is_read) await markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleClearOne = async (e, id) => {
    e.stopPropagation();
    try {
      await clearNotification(id);
    } catch {
      /* ignore */
    }
  };

  const handleClearAll = async () => {
    if (!notifications.length || clearing) return;
    setClearing(true);
    try {
      await clearAllNotifications();
    } catch {
      /* ignore */
    } finally {
      setClearing(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,24rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-96">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate font-display font-semibold text-navy dark:text-white">Notifications</h3>
                {connected ? (
                  <Wifi className="h-3.5 w-3.5 shrink-0 text-green-500" title="Live" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 shrink-0 text-slate-400" title="Reconnecting…" />
                )}
              </div>
            </div>
            {notifications.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-teal hover:underline"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 hover:underline disabled:opacity-50 dark:text-slate-400 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {clearing ? 'Clearing…' : 'Clear all'}
                </button>
              </div>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</li>
            ) : (
              notifications.map((n) => (
                <li key={n.id} className="group flex border-b border-slate-50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      'min-w-0 flex-1 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/80',
                      !n.is_read && 'bg-teal/5 dark:bg-teal/10'
                    )}
                  >
                    <p className="pr-6 text-sm font-medium text-navy dark:text-slate-100">{n.title}</p>
                    {n.message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {n.message}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleClearOne(e, n.id)}
                    className="shrink-0 px-3 text-slate-400 opacity-70 transition hover:bg-slate-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-red-400"
                    aria-label="Clear notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
