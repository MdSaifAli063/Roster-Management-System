import DashboardPanel from '../dashboard/DashboardPanel';
import { cn } from '../../lib/utils';

function GaugeArc({ pct }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const angle = (clamped / 100) * 180;
  return (
    <div className="relative mx-auto h-[120px] w-[200px] overflow-hidden">
      <svg viewBox="0 0 200 110" className="h-full w-full">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-slate-100 dark:text-slate-800"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-blue-600"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 251} 251`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="font-display text-3xl font-bold text-blue-600">{clamped}%</p>
        <p className="text-xs text-slate-500">
          {clamped >= 80 ? "It's already great!" : clamped >= 50 ? 'On track' : 'Needs attention'}
        </p>
      </div>
    </div>
  );
}

export default function AttendanceDeptGauge({
  departments = [],
  selected,
  onSelect,
  loading,
  totalLogFormatted,
}) {
  const active =
    departments.find((d) => d.name === selected) ||
    departments[0] ||
    { name: 'All', performancePct: 0, employeePerfPct: 0, attended: 0, working: 0 };

  return (
    <DashboardPanel className="flex h-full flex-col">
      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
        Working Hour Performance
      </h3>
      <p className="mt-1 text-sm text-slate-500">By department · today</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {loading ? (
          <div className="h-8 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ) : (
          departments.slice(0, 6).map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => onSelect?.(d.name)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                selected === d.name || (!selected && d === departments[0])
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              {d.name}
            </button>
          ))
        )}
      </div>

      {loading ? (
        <div className="my-6 h-[120px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ) : (
        <GaugeArc pct={active.performancePct} />
      )}

      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-500">Employee Perf.</p>
          <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {loading ? '—' : `${active.employeePerfPct}%`}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Working Hours</p>
          <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {loading ? '—' : totalLogFormatted || '0:00:00'}
          </p>
        </div>
      </div>
    </DashboardPanel>
  );
}
