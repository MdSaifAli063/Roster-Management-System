import { cn } from '../../lib/utils';

export default function Card({ className, title, children, actions, glass = true, accent, ...props }) {
  return (
    <div
      className={cn(
        glass ? 'glass-card' : 'rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]',
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
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3 sm:px-5 sm:py-4">
          {title && (
            <h3 className="min-w-0 flex-1 font-display text-base font-semibold text-[var(--text-primary)] sm:text-lg">{title}</h3>
          )}
          {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>}
        </div>
      )}
      <div className={cn(!title && !actions ? 'p-4 sm:p-5' : 'p-4 sm:p-5')}>{children}</div>
    </div>
  );
}
