import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ChevronRight, Video } from 'lucide-react';
import DashboardPanel from './DashboardPanel';
import { cn } from '../../lib/utils';

export function DashboardAgendaCard({ tasks, loading }) {
  const primary = tasks?.find((t) => t.urgent) || tasks?.[0];

  return (
    <DashboardPanel className="bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 dark:from-blue-600 dark:to-blue-700">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Action needed</p>
      {loading ? (
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-white/20" />
      ) : primary ? (
        <>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Video className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-snug">{primary.title}</p>
              <p className="mt-1 text-sm text-blue-100">
                {primary.count > 0 ? `${primary.count} pending` : 'Review when ready'}
              </p>
            </div>
          </div>
          <Link
            to={primary.to}
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-white py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            {primary.action} now
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm text-blue-100">You&apos;re all caught up.</p>
      )}
    </DashboardPanel>
  );
}

export function DashboardScheduleCard({ schedule, events, loading }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <DashboardPanel>
      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">This week</h3>
      {loading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-4 flex justify-between gap-1">
            {schedule?.map((d) => {
              const active = d.date === todayStr;
              return (
                <div
                  key={d.date}
                  className={cn(
                    'flex flex-1 flex-col items-center rounded-lg py-2 text-center',
                    active ? 'bg-blue-600 text-white' : 'text-slate-500'
                  )}
                >
                  <span className="text-[10px] font-medium uppercase">{d.label}</span>
                  <span className={cn('mt-0.5 text-sm font-bold', active ? 'text-white' : 'text-slate-800 dark:text-slate-200')}>
                    {format(parseISO(d.date), 'd')}
                  </span>
                </div>
              );
            })}
          </div>
          <ul className="mt-4 space-y-2">
            {(events || []).slice(0, 4).map((e) => (
              <li
                key={`${e.date}-${e.title}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800"
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                    e.national ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  )}
                >
                  {format(parseISO(e.date), 'd')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{e.title}</p>
                  <p className="text-xs text-slate-500">{format(parseISO(e.date), 'EEE, d MMM')}</p>
                </div>
              </li>
            ))}
            {!events?.length && (
              <li className="py-4 text-center text-sm text-slate-500">No upcoming holidays this week.</li>
            )}
          </ul>
        </>
      )}
    </DashboardPanel>
  );
}

export function DashboardTasksList({ tasks, loading }) {
  return (
    <DashboardPanel>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Quick tasks</h3>
      </div>
      <ul className="space-y-2">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))
          : tasks?.map((t) => (
              <li key={t.title}>
                <Link
                  to={t.to}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    t.urgent ? 'border-amber-200 bg-amber-50/50 dark:border-amber-500/30' : 'border-slate-100 dark:border-slate-800'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.count} item{t.count !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
      </ul>
    </DashboardPanel>
  );
}
