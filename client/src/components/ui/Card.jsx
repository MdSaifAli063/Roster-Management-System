import { cn } from '../../lib/utils';

export default function Card({ className, title, children, actions, ...props }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', className)} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4 dark:border-slate-800">
          {title && <h3 className="font-display text-base font-semibold text-navy sm:text-lg dark:text-slate-100">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
