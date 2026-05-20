import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, CalendarDays, Building2,
  Clock, Palmtree, FileBarChart, FileText, Settings, ArrowLeftRight, Eye, Plane, UserCircle, CalendarCheck, X, LogOut, ChevronLeft, Pencil,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel, isStaff } from '../lib/auth';
import UserAvatar from './UserAvatar';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/attendance', icon: CalendarCheck, label: 'Attendance', employeeOnly: true },
    ],
  },
  {
    label: 'Roster',
    items: [
      { to: '/manage-roster', icon: Calendar, label: 'Manage', staffOnly: true },
      { to: '/view-roster', icon: Eye, label: 'View' },
      { to: '/actual-roster', icon: CalendarDays, label: 'Actual', staffOnly: true },
    ],
  },
  {
    label: 'Masters',
    staffOnly: true,
    items: [
      { to: '/plants', icon: Building2, label: 'Plants' },
      { to: '/employees', icon: Users, label: 'Employees' },
      { to: '/shifts', icon: Clock, label: 'Shifts' },
      { to: '/assignments', icon: ArrowLeftRight, label: 'Reassignment' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/holidays', icon: Palmtree, label: 'Holidays', staffOnly: true },
      { to: '/leave', icon: Plane, label: 'Leave' },
      { to: '/reports', icon: FileBarChart, label: 'Reports', staffOnly: true },
      { to: '/pdf-extract', icon: FileText, label: 'PDF Extract', staffOnly: true },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', icon: UserCircle, label: 'Profile' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

function filterItems(sections, staff) {
  return sections
    .filter((s) => !s.staffOnly || staff)
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => {
        if (item.staffOnly && !staff) return false;
        if (item.employeeOnly && staff) return false;
        return true;
      }),
    }))
    .filter((s) => s.items.length > 0);
}

export default function Sidebar({ collapsed, mobileOpen, onMobileClose, onToggleCollapse, onLogout }) {
  const { user } = useAuth();
  const staff = isStaff(user?.role);
  const sections = filterItems(navSections, staff);
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
        <div
          className="flex h-16 items-center justify-between gap-2 border-b px-4"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-500/30">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            {showLabels && (
              <div className="min-w-0">
                <span className="block truncate font-display text-base font-bold" style={{ color: 'var(--sidebar-text)' }}>
                  RosterPro
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--sidebar-section)' }}>
                  Enterprise
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="sidebar-icon-btn rounded-lg p-2 lg:hidden"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          {!mobileOpen && (
            <button
              type="button"
              className="sidebar-icon-btn hidden rounded-lg p-2 lg:block"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {sections.map((section, si) => (
            <div key={section.label}>
              {showLabels && (
                <p
                  className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest animate-fade-up"
                  style={{ color: 'var(--sidebar-section)', animationDelay: `${si * 40}ms` }}
                >
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }, ii) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/dashboard'}
                    onClick={onMobileClose}
                    title={!showLabels ? label : undefined}
                    className="sidebar-link group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 animate-fade-up hover:translate-x-0.5"
                    style={{ animationDelay: `${(si * 4 + ii) * 30}ms` }}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {showLabels && <span className="truncate">{label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-3" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3',
              !showLabels && 'justify-center'
            )}
            style={{
              background: 'var(--sidebar-user-bg)',
              borderColor: 'var(--sidebar-user-border)',
            }}
          >
            <Link to="/profile" onClick={onMobileClose} title="Edit profile">
              <UserAvatar user={user} size="md" />
            </Link>
            {showLabels && (
              <div className="min-w-0 flex-1">
                <Link
                  to="/profile"
                  onClick={onMobileClose}
                  className="block truncate text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ color: 'var(--sidebar-text)' }}
                >
                  {user?.name}
                </Link>
                <span
                  className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: 'var(--sidebar-active-bg)',
                    color: 'var(--sidebar-active-text)',
                  }}
                >
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            )}
            {showLabels && (
              <div className="flex shrink-0 flex-col gap-0.5">
                <Link
                  to="/profile"
                  onClick={onMobileClose}
                  className="sidebar-icon-btn rounded-lg p-1.5"
                  title="Edit profile"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="sidebar-icon-btn rounded-lg p-1.5 hover:!bg-red-500/10 hover:!text-red-500"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
