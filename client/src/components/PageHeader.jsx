import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ROUTE_META = {
  '/dashboard': { title: 'Dashboard', crumbs: ['Home', 'Dashboard'] },
  '/manage-roster': { title: 'Manage Roster', crumbs: ['Roster', 'Manage'] },
  '/view-roster': { title: 'View Roster', crumbs: ['Roster', 'View'] },
  '/actual-roster': { title: 'Actual Roster', crumbs: ['Roster', 'Actual'] },
  '/employees': { title: 'Employees', crumbs: ['Masters', 'Employees'] },
  '/shifts': { title: 'Shifts', crumbs: ['Masters', 'Shifts'] },
  '/plants': { title: 'Plant Master', crumbs: ['Masters', 'Plants'] },
  '/holidays': { title: 'Holidays', crumbs: ['Holidays'] },
  '/reports': { title: 'Reports', crumbs: ['Reports'] },
  '/pdf-extract': { title: 'PDF Extract', crumbs: ['Tools', 'PDF Extract'] },
  '/leave': { title: 'Leave', crumbs: ['Leave'] },
  '/attendance': { title: 'Attendance', crumbs: ['Attendance'] },
  '/assignments': { title: 'Reassignment', crumbs: ['Masters', 'Reassignment'] },
  '/settings': { title: 'Settings', crumbs: ['Settings'] },
  '/profile': { title: 'Profile', crumbs: ['Profile'] },
};

export function usePageTitle(pathname) {
  const meta = ROUTE_META[pathname] || { title: 'RosterPro', crumbs: [] };
  return meta;
}

export default function PageHeader({ pathname, subtitle, actions }) {
  const { title, crumbs } = usePageTitle(pathname);

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 animate-fade-up">
        <nav className="mb-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <Link to="/dashboard" className="hover:text-[var(--accent-glow)] transition-colors">Home</Link>
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className={i === crumbs.length - 1 ? 'text-[var(--text-primary)]' : ''}>{c}</span>
            </span>
          ))}
        </nav>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
