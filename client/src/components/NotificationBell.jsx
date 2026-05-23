import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import NotificationPanel from './notifications/NotificationPanel';

const PANEL_MAX_W = 420;
const VIEWPORT_MARGIN = 12;

function computePanelLayout(buttonRect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isNarrow = vw < 640;

  const width = isNarrow
    ? vw - VIEWPORT_MARGIN * 2
    : Math.min(PANEL_MAX_W, vw - VIEWPORT_MARGIN * 2);

  let left = isNarrow ? VIEWPORT_MARGIN : buttonRect.right - width;
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - VIEWPORT_MARGIN - width));

  const top = Math.min(buttonRect.bottom + 8, vh - VIEWPORT_MARGIN - 120);
  const listMaxH = Math.max(200, vh - top - VIEWPORT_MARGIN - 140);

  return { top, left, width, listMaxH, isNarrow };
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState({
    top: 0,
    left: 0,
    width: PANEL_MAX_W,
    listMaxH: 360,
    isNarrow: false,
  });
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const updatePosition = () => {
    if (!btnRef.current) return;
    setLayout(computePanelLayout(btnRef.current.getBoundingClientRect()));
  };

  const toggleOpen = () => {
    if (!open) {
      updatePosition();
      refresh();
    }
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
      if (!btnRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) {
        setOpen(false);
      }
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
        className="fixed z-[200] animate-scale-in"
        style={{
          top: layout.top,
          left: layout.left,
          width: layout.width,
          maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
        }}
        role="dialog"
        aria-label="Notifications"
      >
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          onClose={() => setOpen(false)}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onRefresh={refresh}
          listMaxH={layout.listMaxH}
        />
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
