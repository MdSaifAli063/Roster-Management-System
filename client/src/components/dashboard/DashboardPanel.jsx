import { cn } from '../../lib/utils';

/** Reference-style white card used across dashboard */
export default function DashboardPanel({ className, children, padding = true }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
        'dark:border-slate-800 dark:bg-slate-900 dark:shadow-none',
        padding && 'p-5 sm:p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
