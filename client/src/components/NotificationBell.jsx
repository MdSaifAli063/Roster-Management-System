import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, RefreshCw, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';
import { cn } from '../lib/utils';

const PANEL_MAX_W = 384;
const VIEWPORT_MARGIN = 12;

function computePanelLayout(buttonRect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isNarrow = vw < 640;

  const width = isNarrow
    ? vw - VIEWPORT_MARGIN * 2
    : Math.min(PANEL_MAX_W, vw - VIEWPORT_MARGIN * 2);

  let left = isNarrow
    ? VIEWPORT_MARGIN
    : buttonRect.right - width;

  left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - VIEWPORT_MARGIN - width));

  const top = Math.min(buttonRect.bottom + 8, vh - VIEWPORT_MARGIN - 120);
  const listMaxH = Math.max(160, vh - top - VIEWPORT_MARGIN - 88);

  return { top, left, width, listMaxH, isNarrow };
}

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
  const [layout, setLayout] = useState({
    top: 0,
    left: 0,
    width: PANEL_MAX_W,
    listMaxH: 320,
    isNarrow: false,
  });
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setLayout(computePanelLayout(rect));
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
    if (!open) return;
    const prev = document.body.style.overflow;
    if (layout.isNarrow) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, layout.isNarrow]);

  useEffect(() => {
    const onDoc = (e) => {
      const inBtn = btnRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inBtn && !inPanel) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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
    <>
      {layout.isNarrow && (
        <button
          type="button"
          className="fixed inset-0 z-[199] bg-black/25 backdrop-blur-[1px]"
          aria-label="Close notifications"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        className="fixed z-[200] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in"
        style={{
          top: layout.top,
          left: layout.left,
          width: layout.width,
          maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
        }}
      >
        <div className="border-b border-[var(--border)] px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h3 className="truncate font-display text-sm font-semibold text-[var(--text-primary)] sm:text-base">
                Notifications
              </h3>
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  connected ? 'text-emerald-500' : 'text-[var(--text-secondary)]'
                )}
                title={connected ? 'Auto-refresh on' : 'Checking…'}
              />
              {unreadCount > 0 && (
                <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--glass-hover)] hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
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

        <ul className="overflow-y-auto overscroll-contain" style={{ maxHeight: layout.listMaxH }}>
          {notifications.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
              No notifications yet
            </li>
          ) : (
            notifications.map((n) => (
              <li key={n.id} className="group flex border-b border-[var(--border)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className={cn(
                    'min-w-0 flex-1 px-3 py-3 text-left transition hover:bg-[var(--glass-hover)] sm:px-4',
                    !n.is_read && 'bg-blue-500/5'
                  )}
                >
                  <p className="pr-2 text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
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
                  className="shrink-0 px-2.5 text-[var(--text-secondary)] opacity-70 transition hover:bg-[var(--glass-hover)] hover:text-red-500 group-hover:opacity-100 sm:px-3"
                  aria-label="Clear notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
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
