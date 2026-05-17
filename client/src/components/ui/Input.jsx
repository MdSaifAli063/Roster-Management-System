import { cn } from '../../lib/utils';

export function Input({ label, className, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <input
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Select({ label, className, children, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <select
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
