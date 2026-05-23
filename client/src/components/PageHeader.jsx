import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isEmployee } from '../lib/auth';
import { cn } from '../lib/utils';

const ROUTE_META = {
  '/dashboard': {
    title: 'Dashboard',
    eyebrow: 'Overview',
    crumbs: ['Home', 'Dashboard'],
    employeeTitle: 'My Dashboard',
    employeeEyebrow: 'My work',
    employeeCrumbs: ['Home', 'My Dashboard'],
  },
  '/manage-roster': { title: 'Create Roster', eyebrow: 'Roster', crumbs: ['Roster', 'Create'] },
  '/view-roster': {
    title: 'View Roster',
    eyebrow: 'Roster',
    crumbs: ['Roster', 'View'],
    employeeTitle: 'My Roster',
    employeeEyebrow: 'My work',
    employeeCrumbs: ['My work', 'My Roster'],
  },
  '/actual-roster': { title: 'Attendance', eyebrow: 'Workforce', crumbs: ['Workforce', 'Attendance'] },
  '/staff': { title: 'Staff', eyebrow: 'Workforce', crumbs: ['Workforce', 'Staff'] },
  '/employees': { title: 'Employees', eyebrow: 'Masters', crumbs: ['Masters', 'Employees'] },
  '/shifts': { title: 'Shifts', eyebrow: 'Masters', crumbs: ['Masters', 'Shifts'] },
  '/plants': { title: 'Sites & Plants', eyebrow: 'Masters', crumbs: ['Masters', 'Plants'] },
  '/holidays': { title: 'Holidays', eyebrow: 'Operations', crumbs: ['Operations', 'Holidays'] },
  '/reports': { title: 'Reports', eyebrow: 'Insights', crumbs: ['Insights', 'Reports'] },
  '/finance': { title: 'Finance', eyebrow: 'Insights', crumbs: ['Insights', 'Finance'] },
  '/pdf-extractor': { title: 'PDF Extractor', eyebrow: 'Tools', crumbs: ['Tools', 'PDF Extractor'] },
  '/pdf-extract': { title: 'PDF Extractor', eyebrow: 'Tools', crumbs: ['Tools', 'PDF Extractor'] },
  '/leave': {
    title: 'Leave',
    eyebrow: 'Workforce',
    crumbs: ['Workforce', 'Leave'],
    employeeTitle: 'Apply Leave',
    employeeEyebrow: 'My work',
    employeeCrumbs: ['My work', 'Leave'],
  },
  '/attendance': {
    title: 'Attendance',
    eyebrow: 'My work',
    crumbs: ['My work', 'Attendance'],
    employeeTitle: 'My Attendance',
    employeeEyebrow: 'My work',
    employeeCrumbs: ['My work', 'Attendance'],
  },
  '/assignments': { title: 'Reassignment', eyebrow: 'Masters', crumbs: ['Masters', 'Reassignment'] },
  '/organization': { title: 'Organization', eyebrow: 'Company', crumbs: ['Company', 'Organization'] },
  '/settings': { title: 'Settings', eyebrow: 'Preferences', crumbs: ['Preferences', 'Settings'] },
  '/settings/billing': { title: 'Billing', eyebrow: 'Preferences', crumbs: ['Settings', 'Billing'] },
  '/help': { title: 'Help Center', eyebrow: 'Support', crumbs: ['Support', 'Help Center'] },
  '/profile': { title: 'Profile', eyebrow: 'Account', crumbs: ['Account', 'Profile'] },
};

export function usePageTitle(pathname, role) {
  const meta = ROUTE_META[pathname] || { title: 'RosterPro', crumbs: [], eyebrow: 'RosterPro' };
  if (isEmployee(role) && meta.employeeTitle) {
    return {
      title: meta.employeeTitle,
      eyebrow: meta.employeeEyebrow || meta.eyebrow,
      crumbs: meta.employeeCrumbs || meta.crumbs,
    };
  }
  return { title: meta.title, eyebrow: meta.eyebrow, crumbs: meta.crumbs };
}

export default function PageHeader({ pathname, title: titleProp, eyebrow: eyebrowProp, subtitle, actions }) {
  const { user } = useAuth();
  const meta = usePageTitle(pathname, user?.role);
  const title = titleProp ?? meta.title;
  const eyebrow = eyebrowProp ?? meta.eyebrow;
  const { crumbs } = meta;

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1 animate-fade-up">
        <nav className="mb-1.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/dashboard" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
            Home
          </Link>
          {crumbs.map((c, i) => (
            <span key={`${c}-${i}`} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
              <span
                className={cn(
                  'break-words',
                  i === crumbs.length - 1 ? 'font-medium text-slate-700 dark:text-slate-200' : ''
                )}
              >
                {c}
              </span>
            </span>
          ))}
        </nav>
        {eyebrow && (
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{eyebrow}</p>
        )}
        <h1 className="break-words font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
