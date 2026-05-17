import { cn } from '../../lib/utils';

export default function Card({ className, title, children, actions, ...props }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', className)} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          {title && <h3 className="font-display text-lg font-semibold text-navy dark:text-slate-100">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
