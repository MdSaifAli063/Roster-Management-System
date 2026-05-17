import { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Menu, LogOut, Moon, Sun, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCollapsed(!collapsed)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden gap-4 text-sm font-medium text-slate-600 md:flex dark:text-slate-400">
              {[
                { label: 'People', to: '/employees' },
                { label: 'Leave', to: '/leave' },
                { label: 'Attendance', to: '/actual-roster' },
                { label: 'Reports', to: '/reports' },
              ].map((item) => (
                <Link key={item.label} to={item.to} className="hover:text-teal dark:hover:text-teal">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggle} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button type="button" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
            </button>
            <span className="hidden text-sm text-slate-600 sm:block dark:text-slate-400">{user?.name}</span>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
