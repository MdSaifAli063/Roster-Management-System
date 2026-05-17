import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, CalendarDays, Building2,
  Clock, Palmtree, FileBarChart, Settings, ArrowLeftRight, Eye, Plane,
} from 'lucide-react';
import { cn } from '../lib/utils';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/manage-roster', icon: Calendar, label: 'Manage Roster' },
  { to: '/view-roster', icon: Eye, label: 'View Roster' },
  { to: '/actual-roster', icon: CalendarDays, label: 'Actual Roster' },
  { to: '/leave', icon: Plane, label: 'Leave' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/shifts', icon: Clock, label: 'Shifts' },
  { to: '/holidays', icon: Palmtree, label: 'Holidays' },
  { to: '/plants', icon: Building2, label: 'Plant Master' },
  { to: '/assignments', icon: ArrowLeftRight, label: 'Reassignment' },
  { to: '/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed }) {
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
            key={to}
            to={to}
            end={to === '/'}
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
