import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, RefreshCw, Trash2, X } from 'lucide-react';
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
  const [panelPos, setPanelPos] = useState({ top: 0, right: 16 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  };

  const toggleOpen = () => {
    if (!open) updatePosition();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  useEffect(() => {
    const onDoc = (e) => {
      const inBtn = btnRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inBtn && !inPanel) setOpen(false);
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

  const panel = open ? (
    <div
      ref={panelRef}
      className="fixed z-[200] w-[min(100vw-1.5rem,24rem)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl sm:w-96 animate-scale-in"
      style={{ top: panelPos.top, right: panelPos.right }}
    >
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate font-display font-semibold text-[var(--text-primary)]">Notifications</h3>
            <RefreshCw
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                connected ? 'text-emerald-500' : 'text-[var(--text-secondary)]'
              )}
              title={connected ? 'Auto-refresh on' : 'Checking…'}
            />
          </div>
        </div>
        {notifications.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
              >
                <Check className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-red-500 hover:underline disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {clearing ? 'Clearing…' : 'Clear all'}
            </button>
          </div>
        )}
      </div>

      <ul className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">No notifications yet</li>
        ) : (
          notifications.map((n) => (
            <li key={n.id} className="group flex border-b border-[var(--border)]">
              <button
                type="button"
                onClick={() => handleClick(n)}
                className={cn(
                  'min-w-0 flex-1 px-4 py-3 text-left transition hover:bg-[var(--glass-hover)]',
                  !n.is_read && 'bg-blue-500/5'
                )}
              >
                <p className="pr-6 text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                {n.message && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
                    {n.message}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </button>
              <button
                type="button"
                onClick={(e) => handleClearOne(e, n.id)}
                className="shrink-0 px-3 text-[var(--text-secondary)] opacity-70 transition hover:bg-[var(--glass-hover)] hover:text-red-500 group-hover:opacity-100"
                aria-label="Clear notification"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-hover)] hover:text-[var(--text-primary)] focus-ring"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {panel && createPortal(panel, document.body)}
    </>
  );
}
