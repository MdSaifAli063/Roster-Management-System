import PageHeader from '../PageHeader';
import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

/** @deprecated Use PageHeader via PageShell — kept for settings tab layout imports */
export function SettingsPageHeader({ title, subtitle, actions }) {
  const location = useLocation();
  return (
    <PageHeader
      pathname={location.pathname}
      title={title}
      eyebrow="Preferences"
      subtitle={subtitle}
      actions={actions}
    />
  );
}

export function SettingsTabs({ tabs, active, onChange }) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-800/50 sm:min-w-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4',
              active === tab.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsSection({ title, description, action, children }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </div>
  );
}

export function SettingsFormRow({ label, hint, children }) {
  return (
    <div className="grid gap-4 border-b border-slate-100 py-5 last:border-0 dark:border-slate-800 sm:grid-cols-[minmax(0,280px)_1fr] sm:items-start">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
        {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SettingsToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className="toggle-track shrink-0 focus-ring"
        data-on={checked}
        onClick={() => onChange?.(!checked)}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}

export function SettingsToggleGroup({ title, description, children }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr]">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 dark:border-slate-800 dark:bg-slate-800/30">
        {children}
      </div>
    </div>
  );
}
