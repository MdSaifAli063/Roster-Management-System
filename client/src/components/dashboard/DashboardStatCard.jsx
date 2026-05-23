import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import DashboardPanel from './DashboardPanel';

export default function DashboardStatCard({ label, value, icon: Icon, to, trend, loading }) {
  const inner = (
    <DashboardPanel className="relative overflow-hidden transition-all hover:border-blue-200/80 hover:shadow-md dark:hover:border-blue-500/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {loading ? (
            <div className="mt-2 h-9 w-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : (
            <p className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </p>
          )}
          {trend && !loading && (
            <p
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                trend.positive ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {trend.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend.positive ? '+' : '-'}
              {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </DashboardPanel>
  );

  if (to) return <Link to={to} className="block min-w-0">{inner}</Link>;
  return inner;
}
