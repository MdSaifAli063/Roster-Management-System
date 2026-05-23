import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Search, LayoutDashboard, Calendar, Plane, CalendarCheck, UserCircle } from 'lucide-react';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import Sidebar from './Sidebar';
import GlobalSearchModal from './search/GlobalSearchModal';
import { ThemeToggleButton } from './ThemeToggle';
import { usePageTitle } from './PageHeader';
import { useAuth } from '../context/AuthContext';
import { isEmployer } from '../lib/auth';
import { cn } from '../lib/utils';
import TrialBanner from './TrialBanner';
import TrialExpiredModal from './TrialExpiredModal';

const EMPLOYER_MOBILE_TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/manage-roster', icon: Calendar, label: 'Create' },
  { to: '/staff', icon: UserCircle, label: 'Staff' },
  { to: '/leave', icon: Plane, label: 'Leave' },
];

const EMPLOYEE_MOBILE_TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/view-roster', icon: Calendar, label: 'Roster' },
  { to: '/leave', icon: Plane, label: 'Leave' },
  { to: '/attendance', icon: CalendarCheck, label: 'Attend' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { title } = usePageTitle(location.pathname);

  useEffect(() => {
    document.title = `${title} · RosterPro`;
  }, [title]);

  useEffect(() => {
    setMobileNav(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNav ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNav]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleNav = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setMobileNav(true);
    } else {
      setCollapsed((c) => !c);
    }
  };

  const employer = isEmployer(user?.role);
  const mobileTabs = employer ? EMPLOYER_MOBILE_TABS : EMPLOYEE_MOBILE_TABS;

  return (
    <div className="mesh-bg flex h-screen h-[100dvh] overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileNav}
        onMobileClose={() => setMobileNav(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onOpenSearch={() => setCmdOpen(true)}
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-3 overflow-visible border-b border-[var(--border)] bg-[var(--bg-secondary)]/95 px-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleNav}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-hover)] hover:text-[var(--text-primary)] focus-ring lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 lg:hidden">
              <p className="truncate font-display text-base font-bold text-[var(--text-primary)]">{title}</p>
            </div>
          </div>

          <div className="hidden max-w-md flex-1 lg:block">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-blue-500/40 focus-ring"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Search anything here…</span>
              <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-hover)] lg:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <ThemeToggleButton />
            <NotificationBell />
            <UserMenu onLogout={handleLogout} />
          </div>
        </header>

        <main className="app-workspace flex-1 overflow-y-auto overflow-x-hidden p-3 pb-20 sm:p-5 md:p-6 lg:pb-6">
          <div className="relative z-0 mx-auto min-w-0 w-full max-w-[1600px]">
            <TrialBanner />
            <TrialExpiredModal />
            <Outlet />
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--border)] bg-[var(--bg-secondary)]/95 backdrop-blur-xl lg:hidden">
          {mobileTabs.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                location.pathname === to || location.pathname.startsWith(to + '/')
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)]'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <GlobalSearchModal open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
