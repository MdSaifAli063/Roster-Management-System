import { formatRangeLabel } from './DashboardDateRangePicker';
import { cn } from '../../lib/utils';
import DashboardPanel from './DashboardPanel';

const LEGEND = [
  { key: 'onTime', label: 'On-Time', color: 'bg-blue-500' },
  { key: 'late', label: 'Late', color: 'bg-amber-400' },
  { key: 'absent', label: 'Absent', color: 'bg-red-400' },
];

export default function AttendanceOverviewChart({
  data = [],
  attendanceRate,
  attendedToday,
  onRosterToday,
  rangeFrom,
  rangeTo,
  loading,
}) {
  const max = Math.max(1, ...data.map((d) => d.onTime + d.late + d.absent));

  return (
    <DashboardPanel className="flex h-full min-h-[320px] flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Attendance Overview
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {rangeFrom && rangeTo ? formatRangeLabel(rangeFrom, rangeTo) : "This week's workforce attendance"}
          </p>
        </div>
        {!loading && (
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-blue-600">{attendanceRate}%</p>
            <p className="text-xs text-slate-500">
              {attendedToday}/{onRosterToday} today on roster
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 items-end gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-t-lg bg-slate-100 dark:bg-slate-800" style={{ height: `${40 + i * 8}%` }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-end">
          <div className="flex h-[180px] items-end gap-2 sm:gap-3">
            {data.map((d) => {
              const total = d.onTime + d.late + d.absent || 1;
              const scale = (total / max) * 100;
              const onPct = (d.onTime / total) * scale;
              const latePct = (d.late / total) * scale;
              const absPct = (d.absent / total) * scale;
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
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
                          className="chart-bar-striped w-full bg-red-400"
                          style={{ height: `${absPct}%`, minHeight: d.absent ? 4 : 0 }}
                          title={`Absent: ${d.absent}`}
                        />
                      )}
                      {d.late > 0 && (
                        <div
                          className="chart-bar-striped w-full bg-amber-400"
                          style={{ height: `${latePct}%`, minHeight: d.late ? 4 : 0 }}
                          title={`Late: ${d.late}`}
                        />
                      )}
                      {d.onTime > 0 && (
                        <div
                          className="chart-bar-striped w-full bg-blue-500"
                          style={{ height: `${onPct}%`, minHeight: d.onTime ? 4 : 0 }}
                          title={`On-time: ${d.onTime}`}
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

      <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        {LEGEND.map((l) => (
          <span key={l.key} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className={cn('h-2.5 w-2.5 rounded-full', l.color)} />
            {l.label}
          </span>
        ))}
      </div>
    </DashboardPanel>
  );
}
