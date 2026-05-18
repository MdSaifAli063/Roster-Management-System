import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, CalendarDays, Building2,
  Clock, Palmtree, FileBarChart, Settings, ArrowLeftRight, Eye, Plane, UserCircle, CalendarCheck, X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../lib/auth';

const allLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', staffOnly: false },
  { to: '/attendance', icon: CalendarCheck, label: 'Attendance', employeeOnly: true },
  { to: '/manage-roster', icon: Calendar, label: 'Manage Roster', staffOnly: true },
  { to: '/view-roster', icon: Eye, label: 'View Roster', staffOnly: false },
  { to: '/actual-roster', icon: CalendarDays, label: 'Actual Roster', staffOnly: true },
  { to: '/leave', icon: Plane, label: 'Leave', staffOnly: false },
  { to: '/employees', icon: Users, label: 'Employees', staffOnly: true },
  { to: '/shifts', icon: Clock, label: 'Shifts', staffOnly: true },
  { to: '/holidays', icon: Palmtree, label: 'Holidays', staffOnly: true },
  { to: '/plants', icon: Building2, label: 'Plant Master', staffOnly: true },
  { to: '/assignments', icon: ArrowLeftRight, label: 'Reassignment', staffOnly: true },
  { to: '/reports', icon: FileBarChart, label: 'Reports', staffOnly: true },
  { to: '/profile', icon: UserCircle, label: 'Profile', staffOnly: false },
  { to: '/settings', icon: Settings, label: 'Settings', staffOnly: false },
];

export default function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  const { user } = useAuth();
  const staff = isStaff(user?.role);
  const links = allLinks.filter((l) => {
    if (l.staffOnly && !staff) return false;
    if (l.employeeOnly && staff) return false;
    return true;
  });

  const showLabels = mobileOpen || !collapsed;

  return (
    <>
      <div
        role="presentation"
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onMobileClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200 bg-navy text-white shadow-xl transition-transform duration-300 ease-out dark:border-slate-800',
          'w-[min(288px,88vw)] lg:relative lg:z-auto lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-white/10 px-4 lg:h-16">
          <div className="flex min-w-0 items-center gap-2">
            <Calendar className="h-7 w-7 shrink-0 text-teal" />
            {showLabels && <span className="truncate font-display text-lg font-semibold">RosterPro</span>}
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/dashboard'}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors lg:min-h-0',
                  isActive ? 'bg-teal/20 text-teal' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {showLabels && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
