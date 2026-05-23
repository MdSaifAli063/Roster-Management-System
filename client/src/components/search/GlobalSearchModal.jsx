import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Users,
  Folder,
  BarChart3,
  Calendar,
  Clock,
  Megaphone,
  History,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { isEmployer } from '../../lib/auth';
import api from '../../api/client';
import {
  loadRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '../../lib/searchRecent';
import { getInitials } from '../UserAvatar';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'employee', label: 'Employee', icon: Users },
  { id: 'department', label: 'Department', icon: Folder },
  { id: 'analytic', label: 'Analytic', icon: BarChart3 },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'broadcast', label: 'Pages', icon: Megaphone },
];

function DeptIcon({ name }) {
  const n = (name || '?')[0]?.toUpperCase();
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
      {n}
    </span>
  );
}

function EmployeeAvatar({ emp }) {
  if (emp.avatarUrl) {
    return (
      <img src={emp.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-bold text-white">
      {getInitials(emp.empName)}
    </span>
  );
}

export default function GlobalSearchModal({ open, onClose }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [recent, setRecent] = useState([]);
  const [data, setData] = useState({ employees: [], departments: [], pages: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const employer = isEmployer(user?.role);

  const visibleCategories = useMemo(() => {
    if (employer) return CATEGORIES;
    return CATEGORIES.filter((c) => c.id !== 'department');
  }, [employer]);

  const fetchResults = useCallback(
    async (query, cat) => {
      setLoading(true);
      try {
        const { data: res } = await api.get('/search', {
          params: { q: query, category: cat },
        });
        setData(res);
      } catch {
        setData({ employees: [], departments: [], pages: [] });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!open) {
      setQ('');
      setCategory('all');
      return;
    }
    setRecent(loadRecentSearches());
    fetchResults('', 'all');
  }, [open, fetchResults]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchResults(q, category), 200);
    return () => clearTimeout(t);
  }, [q, category, open, fetchResults]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const go = (path, label) => {
    if (q.trim()) {
      setRecent(saveRecentSearch(q.trim()));
    } else if (label) {
      setRecent(saveRecentSearch(label));
    }
    navigate(path);
    onClose();
  };

  const showEmployees =
    (category === 'all' || category === 'employee') && data.employees?.length > 0;
  const showDepartments =
    employer && (category === 'all' || category === 'department') && data.departments?.length > 0;
  const showPages =
    (category === 'all' ||
      category === 'schedule' ||
      category === 'attendance' ||
      category === 'analytic' ||
      category === 'broadcast') &&
    data.pages?.length > 0;
  const showRecent = !q && recent.length > 0 && category === 'all';

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 p-3 pt-[10vh] backdrop-blur-sm sm:p-4 sm:pt-[12vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-scale-in flex max-h-[min(85vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search"
      >
        <div className="shrink-0 border-b border-slate-100 p-3 dark:border-slate-800 sm:p-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search anything here..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleCategories.map((c) => {
              const Icon = c.icon;
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    active
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">Searching…</p>
          )}

          {!loading && showEmployees && (
            <section className="mt-2">
              <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Employee</h3>
              <ul className="space-y-1">
                {data.employees.map((emp) => (
                  <li key={emp.id}>
                    <button
                      type="button"
                      onClick={() => go(emp.to, emp.empName)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <EmployeeAvatar emp={emp} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {emp.empName}
                        </p>
                        <p className="truncate text-xs text-slate-500">{emp.handle}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!loading && showDepartments && (
            <section className="mt-5">
              <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Department</h3>
              <div className="flex flex-wrap gap-2">
                {data.departments.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => go(d.to, d.name)}
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <DeptIcon name={d.name} />
                    <span className="truncate">{d.name}</span>
                    <span className="text-slate-400">({d.headcount})</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!loading && showPages && (
            <section className="mt-5">
              <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Pages</h3>
              <ul className="space-y-0.5">
                {data.pages.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => go(p.to, p.label)}
                      className="flex w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60"
                    >
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!loading && showRecent && (
            <section className="mt-2">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Search</h3>
                <button
                  type="button"
                  onClick={() => setRecent(clearRecentSearches())}
                  className="text-xs font-medium text-slate-500 hover:text-blue-600"
                >
                  Clear All
                </button>
              </div>
              <ul className="space-y-0.5">
                {recent.map((term) => (
                  <li key={term}>
                    <div className="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          setQ(term);
                          setCategory('all');
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 px-1 py-2 text-left"
                      >
                        <History className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate text-sm text-slate-600 dark:text-slate-300">{term}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecent(removeRecentSearch(term))}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!loading &&
            !showEmployees &&
            !showDepartments &&
            !showPages &&
            !showRecent && (
              <p className="py-10 text-center text-sm text-slate-500">
                {q ? 'No results found' : 'Start typing to search staff, departments, and pages'}
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
