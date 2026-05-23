import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { isEmployer } from '../lib/auth';

const ALL_ITEMS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Organization', to: '/organization', employer: true },
  { label: 'Attendance', to: '/actual-roster', employer: true },
  { label: 'Schedule', to: '/view-roster', employer: true },
  { label: 'Create Roster', to: '/manage-roster', employer: true },
  { label: 'View Roster', to: '/view-roster', employer: true },
  { label: 'My Roster', to: '/view-roster', employee: true },
  { label: 'Apply Leave', to: '/leave', employee: true },
  { label: 'Leave', to: '/leave', employer: true },
  { label: 'Attendance', to: '/attendance', employee: true },
  { label: 'Actual Roster', to: '/actual-roster', employer: true },
  { label: 'Staff', to: '/staff', employer: true },
  { label: 'Holidays', to: '/holidays', employer: true },
  { label: 'Reports', to: '/reports', employer: true },
  { label: 'PDF Extractor', to: '/pdf-extractor', employer: true },
  { label: 'Finance', to: '/finance', employer: true },
  { label: 'Billing', to: '/settings/billing', employer: true },
  { label: 'Pricing', to: '/pricing', employer: true },
  { label: 'Settings', to: '/settings' },
  { label: 'Profile', to: '/profile' },
];

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const employer = isEmployer(user?.role);

  const items = useMemo(() => {
    return ALL_ITEMS.filter((item) => {
      if (item.employer && !employer) return false;
      if (item.employee && employer) return false;
      if (!q) return true;
      return item.label.toLowerCase().includes(q.toLowerCase());
    });
  }, [q, employer]);

  useEffect(() => {
    if (!open) {
      setQ('');
      setIdx(0);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
      }
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, items.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && items[idx]) {
        navigate(items[idx].to);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, idx, navigate, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 p-4 pt-[15vh] backdrop-blur-sm" onClick={onClose}>
      <div className="animate-scale-in glass-card w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--text-secondary)]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:italic placeholder:text-[var(--text-secondary)]"
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">ESC</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2">
          {items.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">No results</li>
          ) : (
            items.map((item, i) => (
              <li key={item.to}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-2.5 text-sm transition-all duration-200',
                    i === idx ? 'bg-blue-500/10 text-[var(--accent-glow)]' : 'text-[var(--text-primary)] hover:bg-white/5'
                  )}
                  onClick={() => { navigate(item.to); onClose(); }}
                >
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
