import { cn } from '../../lib/utils';

/** @param {'panel' | 'glass'} variant — panel matches dashboard cards */
export default function Card({
  className,
  title,
  children,
  actions,
  variant = 'panel',
  glass,
  accent,
  padding = true,
  ...props
}) {
  const usePanel = variant === 'panel' || glass === false;
  const useGlass = !usePanel && (glass !== false);

  return (
    <div
      className={cn(
        usePanel &&
          'rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none',
        useGlass && 'glass-card',
        accent && 'border-l-[3px]',
        accent === 'blue' && 'border-l-blue-500',
        accent === 'green' && 'border-l-emerald-500',
        accent === 'amber' && 'border-l-amber-500',
        accent === 'red' && 'border-l-red-500',
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5 sm:py-4">
          {title && (
            <h3 className="min-w-0 flex-1 font-display text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
              {title}
            </h3>
          )}
          {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>}
        </div>
      )}
      <div className={cn(padding && 'p-4 sm:p-5')}>{children}</div>
    </div>
  );
}
