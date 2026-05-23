import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, CalendarDays, CalendarCheck, Palmtree, FileBarChart, FileText,
  Settings, Eye, Plane, UserCircle, X, Pencil, Wallet, UserCog, CreditCard, Tag,
  Building2, ChevronDown, PanelLeft,
} from 'lucide-react';
import Logo from './Logo';
import SidebarQuickSearch from './SidebarQuickSearch';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel, isEmployer } from '../lib/auth';
import UserAvatar from './UserAvatar';

const employerSections = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/actual-roster', icon: CalendarCheck, label: 'Attendance' },
      { to: '/view-roster', icon: Eye, label: 'Schedule' },
      { to: '/manage-roster', icon: Pencil, label: 'Create Roster' },
      { to: '/leave', icon: Plane, label: 'Leave' },
      { to: '/staff', icon: UserCog, label: 'Staff' },
    ],
  },
  {
    label: 'Others',
    items: [
      { to: '/holidays', icon: Palmtree, label: 'Holidays' },
      { to: '/reports', icon: FileBarChart, label: 'Reports' },
      { to: '/actual-roster', icon: CalendarDays, label: 'Actual Roster' },
      { to: '/pdf-extractor', icon: FileText, label: 'PDF Extractor' },
      { to: '/finance', icon: Wallet, label: 'Finance' },
      { to: '/profile', icon: UserCircle, label: 'Profile' },
      { to: '/settings', icon: Settings, label: 'Settings' },
      { to: '/settings/billing', icon: CreditCard, label: 'Billing' },
      { to: '/pricing', icon: Tag, label: 'Pricing' },
    ],
  },
];

const employeeSections = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/view-roster', icon: Eye, label: 'My Roster' },
      { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
      { to: '/leave', icon: Plane, label: 'Apply Leave' },
    ],
  },
  {
    label: 'Others',
    items: [
      { to: '/profile', icon: UserCircle, label: 'Profile' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function Sidebar({ collapsed, mobileOpen, onMobileClose, onToggleCollapse, onOpenSearch }) {
  const { user } = useAuth();
  const employer = isEmployer(user?.role);
  const sections = employer ? employerSections : employeeSections;
  const showLabels = mobileOpen || !collapsed;
  const width = collapsed && !mobileOpen ? 'lg:w-[72px]' : 'lg:w-[260px]';
  const orgName = user?.businessName || (employer ? 'My organization' : 'RosterPro');

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
        <div
          className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-4"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <Link to="/dashboard" className="flex min-w-0 flex-1 items-center overflow-visible" onClick={onMobileClose}>
            {showLabels ? (
              <Logo variant="full" size="sm" />
            ) : (
              <Logo variant="mark" size="sm" />
            )}
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="sidebar-icon-btn hidden h-9 w-9 items-center justify-center rounded-lg border lg:flex"
              style={{ borderColor: 'var(--sidebar-border)' }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
            <button type="button" className="sidebar-icon-btn rounded-lg p-2 lg:hidden" onClick={onMobileClose} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showLabels && employer && (
          <div className="shrink-0 px-3 pt-3 sm:px-4">
            <Link
              to="/organization"
              onClick={onMobileClose}
              className="flex items-center gap-2 rounded-xl border px-3 py-2.5 transition hover:bg-white/80 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--sidebar-border)', background: 'var(--sidebar-user-bg)' }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--sidebar-text)' }}>
                  {orgName}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--sidebar-section)' }}>
                  Organization
                </p>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-40" style={{ color: 'var(--sidebar-section)' }} />
            </Link>
          </div>
        )}

        <div className={cn('shrink-0 px-3 sm:px-4', showLabels && employer ? 'pt-3' : 'pt-4')}>
          <SidebarQuickSearch collapsed={!showLabels} onOpen={onOpenSearch} />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {sections.map((section) => (
            <div key={section.label} className="mb-5">
              {showLabels && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sidebar-section)' }}>
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <li key={`${section.label}-${to}-${label}`}>
                    <NavLink
                      to={to}
                      end={to === '/dashboard'}
                      onClick={onMobileClose}
                      title={!showLabels ? label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                          isActive ? 'sidebar-nav-active' : 'sidebar-nav-idle',
                          !showLabels && 'justify-center px-2'
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

        <div className="shrink-0 border-t p-3" style={{ borderColor: 'var(--sidebar-border)' }}>
          {showLabels && user && (
            <div
              className="flex items-center gap-3 rounded-xl px-2 py-2"
              style={{ background: 'var(--sidebar-user-bg)' }}
            >
              <UserAvatar user={user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--sidebar-text)' }}>{user.name}</p>
                <p className="truncate text-xs" style={{ color: 'var(--sidebar-section)' }}>{getRoleLabel(user.role)}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
