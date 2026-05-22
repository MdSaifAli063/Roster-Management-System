import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, CalendarDays, CalendarCheck, Palmtree, FileBarChart, FileText,
  Settings, Eye, Plane, UserCircle, X, LogOut, ChevronLeft, Pencil, Wallet, UserCog, CreditCard, Tag,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel, isEmployer } from '../lib/auth';
import UserAvatar from './UserAvatar';

const employerSections = [
  {
    label: 'Roster',
    items: [
      { to: '/manage-roster', icon: Pencil, label: 'Create Roster' },
      { to: '/view-roster', icon: Eye, label: 'View Roster' },
      { to: '/actual-roster', icon: CalendarDays, label: 'Actual Roster' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/staff', icon: UserCog, label: 'Staff' },
      { to: '/leave', icon: Plane, label: 'Leave Approvals' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/holidays', icon: Palmtree, label: 'Holidays' },
      { to: '/reports', icon: FileBarChart, label: 'Reports' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/pdf-extractor', icon: FileText, label: 'PDF Extractor' },
      { to: '/finance', icon: Wallet, label: 'Finance' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/profile', icon: UserCircle, label: 'Profile' },
      { to: '/settings', icon: Settings, label: 'Settings' },
      { to: '/settings/billing', icon: CreditCard, label: 'Billing' },
      { to: '/pricing', icon: Tag, label: 'Pricing' },
    ],
  },
];

const employeeSections = [
  {
    label: 'My work',
    items: [
      { to: '/view-roster', icon: Eye, label: 'My Roster' },
      { to: '/leave', icon: Plane, label: 'Apply Leave' },
      { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/profile', icon: UserCircle, label: 'Profile' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function Sidebar({ collapsed, mobileOpen, onMobileClose, onToggleCollapse, onLogout }) {
  const { user } = useAuth();
  const employer = isEmployer(user?.role);
  const sections = employer ? employerSections : employeeSections;
  const showLabels = mobileOpen || !collapsed;
  const width = collapsed && !mobileOpen ? 'lg:w-16' : 'lg:w-[260px]';

  return (
    <>
      <div
        role="presentation"
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onMobileClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={cn(
          'app-sidebar fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r shadow-xl transition-all duration-300 ease-out lg:relative lg:z-auto lg:shadow-none',
          'w-[min(280px,88vw)]',
          width,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b px-4" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            {showLabels && (
              <div className="min-w-0">
                <span className="block truncate font-display text-base font-bold" style={{ color: 'var(--sidebar-text)' }}>
                  RosterPro
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--sidebar-section)' }}>
                  {employer ? 'Employer' : 'Employee'}
                </span>
              </div>
            )}
          </div>
          <button type="button" className="sidebar-icon-btn rounded-lg p-2 lg:hidden" onClick={onMobileClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {sections.map((section) => (
            <div key={section.label} className="mb-4">
              {showLabels && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sidebar-section)' }}>
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive ? 'sidebar-nav-active' : 'sidebar-nav-idle'
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {showLabels && <span className="truncate">{label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t p-3" style={{ borderColor: 'var(--sidebar-border)' }}>
          {showLabels && user && (
            <div className="mb-3 flex items-center gap-3 rounded-lg px-2 py-2">
              <UserAvatar user={user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: 'var(--sidebar-text)' }}>{user.name}</p>
                <p className="truncate text-xs" style={{ color: 'var(--sidebar-section)' }}>{getRoleLabel(user.role)}</p>
              </div>
            </div>
          )}
          <div className="flex gap-1">
            <button type="button" onClick={onToggleCollapse} className="sidebar-icon-btn hidden rounded-lg p-2 lg:flex" aria-label="Collapse">
              <ChevronLeft className={cn('h-5 w-5 transition', collapsed && 'rotate-180')} />
            </button>
            <button type="button" onClick={onLogout} className="sidebar-icon-btn flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm lg:flex-initial">
              <LogOut className="h-4 w-4" />
              {showLabels && 'Sign out'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
