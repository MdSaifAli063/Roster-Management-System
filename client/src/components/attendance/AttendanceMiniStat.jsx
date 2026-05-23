import { TrendingDown, TrendingUp } from 'lucide-react';
import DashboardPanel from '../dashboard/DashboardPanel';
import { cn } from '../../lib/utils';

export default function AttendanceMiniStat({ label, value, sub, trend, loading, icon: Icon }) {
  return (
    <DashboardPanel className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {loading ? (
        <div className="mt-3 h-9 w-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ) : (
        <>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
          {trend && (
            <p
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                trend.positive ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {trend.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              Last week {trend.positive ? '+' : '-'}
              {trend.value}%
            </p>
          )}
        </>
      )}
    </DashboardPanel>
  );
}
