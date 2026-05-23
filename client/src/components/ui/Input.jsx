import { cn } from '../../lib/utils';

const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

export function Input({ label, className, error, success, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className={labelClass}>{label}</span>}
      <div className="relative">
        <input
          className={cn(
            'w-full rounded-lg border bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-200',
            'border-[var(--border)] placeholder:italic placeholder:text-[var(--text-secondary)]',
            'focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]',
            error && 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]',
            success && 'border-emerald-500 pr-9',
            className
          )}
          {...props}
        />
        {success && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">✓</span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </label>
  );
}

export function Select({ label, className, children, error, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className={labelClass}>{label}</span>}
      <select
        className={cn(
          'w-full rounded-lg border bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-all duration-200',
          'border-[var(--border)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </label>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      {label && <span className="text-sm text-[var(--text-primary)]">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className="toggle-track focus-ring"
        data-on={checked}
        onClick={() => onChange?.(!checked)}
      >
        <span className="toggle-thumb" />
      </button>
    </label>
  );
}
