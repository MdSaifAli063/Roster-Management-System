import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, LogOut, Calendar } from 'lucide-react';
import NotificationBell from './NotificationBell';
import Sidebar from './Sidebar';
import Button from './ui/Button';
import { ThemeToggleButton } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../lib/auth';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileNav(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNav ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNav]);

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

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileNav}
        onMobileClose={() => setMobileNav(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:h-16 sm:px-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleNav}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/dashboard" className="flex min-w-0 items-center gap-2 lg:hidden">
              <Calendar className="h-6 w-6 shrink-0 text-teal" />
              <span className="truncate font-display text-base font-semibold text-navy dark:text-white">
                RosterPro
              </span>
            </Link>
            <nav className="hidden min-w-0 gap-4 overflow-x-auto text-sm font-medium text-slate-600 lg:flex dark:text-slate-400">
              {(user?.role === 'EMPLOYEE'
                ? [
                    { label: 'Dashboard', to: '/dashboard' },
                    { label: 'Attendance', to: '/attendance' },
                    { label: 'My Roster', to: '/view-roster' },
                    { label: 'Leave', to: '/leave' },
                  ]
                : [
                    { label: 'People', to: '/employees' },
                    { label: 'Leave', to: '/leave' },
                    { label: 'Attendance', to: '/actual-roster' },
                    { label: 'Reports', to: '/reports' },
                  ]
              ).map((item) => (
                <Link key={item.label} to={item.to} className="whitespace-nowrap hover:text-teal dark:hover:text-teal">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggleButton />
            <NotificationBell />
            <Link
              to="/profile"
              className="hidden max-w-[140px] truncate rounded-lg px-2 py-1 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-navy lg:block dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {user?.name}
              <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">({getRoleLabel(user?.role)})</span>
            </Link>
            <Button variant="ghost" onClick={handleLogout} aria-label="Log out" className="h-10 w-10 px-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-3 sm:p-4 md:p-6 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
