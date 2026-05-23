import { Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import DashboardPanel from '../dashboard/DashboardPanel';
import { cn } from '../../lib/utils';

const LEGEND = [
  { key: 'onTimePct', label: 'On-Time', color: 'bg-blue-500' },
  { key: 'latePct', label: 'Late', color: 'bg-amber-400' },
  { key: 'notAttendPct', label: 'Not Attend Yet', color: 'bg-slate-300 dark:bg-slate-600' },
];

export default function AttendanceTodayCard({ stats, weeklyChart = [], loading, trend }) {
  const max = Math.max(1, ...weeklyChart.map((d) => d.onTime + d.late + d.absent));

  return (
    <DashboardPanel className="flex h-full min-h-[320px] flex-col lg:col-span-2">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Today&apos;s Attendance
            </h3>
            <p className="text-sm text-slate-500">On-roster check-ins for today</p>
          </div>
        </div>
        {!loading && trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              trend.positive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
            )}
          >
            {trend.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend.positive ? '+' : '-'}
            {trend.value}%
          </span>
        )}
      </div>

      {!loading && (
        <p className="mb-4 font-display text-4xl font-bold tracking-tight text-blue-600">
          {stats?.attendanceRate ?? 0}%
        </p>
      )}

      {loading ? (
        <div className="flex flex-1 items-end gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t-lg bg-slate-100 dark:bg-slate-800"
              style={{ height: `${40 + i * 8}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-end">
          <div className="flex h-[180px] items-end gap-2 sm:gap-3">
            {weeklyChart.map((d) => {
              const total = d.onTime + d.late + d.absent || 1;
              const scale = (total / max) * 100;
              const onPct = (d.onTime / total) * scale;
              const latePct = (d.late / total) * scale;
              const absPct = (d.absent / total) * scale;
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="flex h-full w-full max-w-[52px] flex-col justify-end overflow-hidden rounded-t-xl border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80"
                    style={{ minHeight: '148px' }}
                  >
                    <div
                      className="flex w-full flex-col justify-end overflow-hidden rounded-t-[10px]"
                      style={{ height: `${Math.max(onPct + latePct + absPct, 8)}%` }}
                    >
                      {d.absent > 0 && (
                        <div
                          className="chart-bar-striped w-full bg-slate-300 dark:bg-slate-600"
                          style={{ height: `${absPct}%`, minHeight: d.absent ? 4 : 0 }}
                        />
                      )}
                      {d.late > 0 && (
                        <div
                          className="chart-bar-striped w-full bg-amber-400"
                          style={{ height: `${latePct}%`, minHeight: d.late ? 4 : 0 }}
                        />
                      )}
                      {d.onTime > 0 && (
                        <div
                          className="chart-bar-striped w-full bg-blue-500"
                          style={{ height: `${onPct}%`, minHeight: d.onTime ? 4 : 0 }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        {LEGEND.map((l) => (
          <div key={l.key} className="text-center sm:text-left">
            <span className="flex items-center justify-center gap-2 text-xs text-slate-500 sm:justify-start">
              <span className={cn('h-2.5 w-2.5 rounded-full', l.color)} />
              {l.label}
            </span>
            {!loading && (
              <p className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                {stats?.[l.key] ?? 0}%
              </p>
            )}
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
