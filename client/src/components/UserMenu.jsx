import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, UserCircle, Settings, ChevronDown, CreditCard, Tag } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel, isEmployer } from '../lib/auth';
import { cn } from '../lib/utils';

export default function UserMenu({ onLogout }) {
  const { user } = useAuth();
  const employer = isEmployer(user?.role);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 16 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  };

  const toggle = () => {
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

  const handleSignOut = () => {
    setOpen(false);
    onLogout?.();
    navigate('/login');
  };

  const panel = open ? (
    <div
      ref={panelRef}
      className="fixed z-[200] w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in"
      style={{ top: panelPos.top, right: panelPos.right }}
    >
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user?.name}</p>
            <p className="truncate text-xs text-[var(--text-secondary)]">{user?.email}</p>
            <span
              className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: 'var(--sidebar-active-bg)',
                color: 'var(--sidebar-active-text)',
              }}
            >
              {getRoleLabel(user?.role)}
            </span>
          </div>
        </div>
      </div>

      <div className="py-1">
        <Link
          to="/profile"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--glass-hover)]"
        >
          <UserCircle className="h-4 w-4 text-[var(--text-secondary)]" />
          My profile
        </Link>
        <Link
          to="/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--glass-hover)]"
        >
          <Settings className="h-4 w-4 text-[var(--text-secondary)]" />
          Settings
        </Link>
        {employer && (
          <>
            <Link
              to="/settings/billing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--glass-hover)]"
            >
              <CreditCard className="h-4 w-4 text-[var(--text-secondary)]" />
              Billing
            </Link>
            <Link
              to="/pricing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--glass-hover)]"
            >
              <Tag className="h-4 w-4 text-[var(--text-secondary)]" />
              Pricing
            </Link>
          </>
        )}
      </div>

      <div className="border-t border-[var(--border)] py-1">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={cn(
          'flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-[var(--glass-hover)] focus-ring',
          open && 'bg-[var(--glass-hover)]'
        )}
        aria-label="Account menu"
        aria-expanded={open}
      >
        <UserAvatar user={user} size="md" />
        <ChevronDown
          className={cn(
            'mr-0.5 h-3.5 w-3.5 text-[var(--text-secondary)] transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {panel && createPortal(panel, document.body)}
    </>
  );
}
