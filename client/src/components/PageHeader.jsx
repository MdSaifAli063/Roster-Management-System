import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isEmployee } from '../lib/auth';
import { cn } from '../lib/utils';

const ROUTE_META = {
  '/dashboard': { title: 'Dashboard', crumbs: ['Home', 'Dashboard'], employeeTitle: 'My Dashboard', employeeCrumbs: ['Home', 'My Dashboard'] },
  '/manage-roster': { title: 'Create Roster', crumbs: ['Roster', 'Create'] },
  '/view-roster': { title: 'View Roster', crumbs: ['Roster', 'View'], employeeTitle: 'My Roster', employeeCrumbs: ['My work', 'My Roster'] },
  '/actual-roster': { title: 'Actual Roster', crumbs: ['Roster', 'Actual'] },
  '/employees': { title: 'Employees', crumbs: ['Masters', 'Employees'] },
  '/shifts': { title: 'Shifts', crumbs: ['Masters', 'Shifts'] },
  '/plants': { title: 'Plant Master', crumbs: ['Masters', 'Plants'] },
  '/holidays': { title: 'Holidays', crumbs: ['Holidays'] },
  '/reports': { title: 'Reports', crumbs: ['Reports'] },
  '/pdf-extract': { title: 'PDF Extract', crumbs: ['Tools', 'PDF Extract'] },
  '/leave': { title: 'Leave', crumbs: ['Leave'], employeeTitle: 'Apply Leave', employeeCrumbs: ['My work', 'Apply Leave'] },
  '/attendance': { title: 'Attendance', crumbs: ['Attendance'], employeeTitle: 'My Attendance', employeeCrumbs: ['My work', 'Attendance'] },
  '/assignments': { title: 'Reassignment', crumbs: ['Masters', 'Reassignment'] },
  '/settings': { title: 'Settings', crumbs: ['Settings'] },
  '/settings/billing': { title: 'Billing', crumbs: ['Settings', 'Billing'] },
  '/profile': { title: 'Profile', crumbs: ['Profile'] },
};

export function usePageTitle(pathname, role) {
  const meta = ROUTE_META[pathname] || { title: 'RosterPro', crumbs: [] };
  if (isEmployee(role) && meta.employeeTitle) {
    return { title: meta.employeeTitle, crumbs: meta.employeeCrumbs || meta.crumbs };
  }
  return { title: meta.title, crumbs: meta.crumbs };
}

export default function PageHeader({ pathname, subtitle, actions }) {
  const { user } = useAuth();
  const { title, crumbs } = usePageTitle(pathname, user?.role);

  return (
    <div className="mb-4 flex min-w-0 flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 animate-fade-up">
        <nav className="mb-1 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-[var(--text-secondary)]">
          <Link to="/dashboard" className="hover:text-[var(--accent-glow)] transition-colors">Home</Link>
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
              <span className={cn(i === crumbs.length - 1 ? 'text-[var(--text-primary)]' : '', 'break-words')}>{c}</span>
            </span>
          ))}
        </nav>
        <h1 className="break-words font-display text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 break-words text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
