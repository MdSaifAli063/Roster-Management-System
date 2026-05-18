import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, CalendarDays, Building2,
  Clock, Palmtree, FileBarChart, Settings, ArrowLeftRight, Eye, Plane, UserCircle, CalendarCheck,
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

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();
  const staff = isStaff(user?.role);
  const links = allLinks.filter((l) => {
    if (l.staffOnly && !staff) return false;
    if (l.employeeOnly && staff) return false;
    return true;
  });

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-slate-200 bg-navy text-white transition-all dark:border-slate-800',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
        <Calendar className="h-7 w-7 shrink-0 text-teal" />
        {!collapsed && <span className="font-display text-lg font-semibold">RosterPro</span>}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={label}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive ? 'bg-teal/20 text-teal' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
