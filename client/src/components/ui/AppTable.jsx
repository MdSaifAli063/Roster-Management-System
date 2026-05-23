import { cn } from '../../lib/utils';

export function AppTable({ className, children }) {
  return (
    <div className={cn('app-table-wrap overflow-x-auto', className)}>
      <table className="app-table w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function AppTableHead({ children }) {
  return (
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
        {children}
      </tr>
    </thead>
  );
}

export function AppTableTh({ className, children }) {
  return <th className={cn('px-4 py-3 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6', className)}>{children}</th>;
}

export function AppTableBody({ children }) {
  return <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{children}</tbody>;
}

export function AppTableRow({ className, children, onClick }) {
  const Tag = onClick ? 'tr' : 'tr';
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function AppTableTd({ className, children, ...props }) {
  return (
    <td
      className={cn('px-4 py-3.5 text-slate-700 first:pl-5 last:pr-5 dark:text-slate-200 sm:first:pl-6 sm:last:pr-6', className)}
      {...props}
    >
      {children}
    </td>
  );
}
