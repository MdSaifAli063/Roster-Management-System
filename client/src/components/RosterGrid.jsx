import { useState, useEffect } from 'react';
import { format, isSaturday, isSunday, isToday } from 'date-fns';
import ShiftBadge from './ShiftBadge';
import { cn } from '../lib/utils';
import { AlertTriangle, Pencil } from 'lucide-react';

export default function RosterGrid({ employees, dates, rosterMap, onCellClick, readOnly = false, showMismatchLegend = false }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto roster-scroll">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--bg-elevated)]">
              <th className="sticky left-0 z-30 min-w-[90px] border-b border-r border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
                Emp Code
              </th>
              <th className="sticky left-[90px] z-30 min-w-[160px] border-b border-r border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
                Emp Name
              </th>
              {dates.map((d) => {
                const weekend = isSaturday(d) || isSunday(d);
                const todayCol = isToday(d);
                return (
                  <th
                    key={d.toISOString()}
                    className={cn(
                      'min-w-[100px] border-b border-[var(--border)] px-2 py-2 text-center',
                      weekend && 'bg-black/20',
                      todayCol && 'border-l-2 border-l-blue-500 bg-blue-500/5'
                    )}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">{format(d, 'EEE')}</div>
                    <div className={cn('font-mono text-sm font-medium', todayCol ? 'text-blue-400' : 'text-[var(--text-primary)]')}>{format(d, 'd')}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, ri) => (
              <tr
                key={emp.id}
                className="group border-t border-[var(--border)] transition-colors hover:bg-blue-500/[0.04] stagger-row"
                style={{ animationDelay: `${ri * 50}ms` }}
              >
                <td className="sticky left-0 z-20 border-r border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)] shadow-[4px_0_12px_rgba(0,0,0,0.25)] group-hover:bg-[var(--bg-elevated)]">
                  {emp.emp_code}
                </td>
                <td className="sticky left-[90px] z-20 border-r border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)] shadow-[4px_0_12px_rgba(0,0,0,0.25)] group-hover:bg-[var(--bg-elevated)]">
                  {emp.emp_name}
                </td>
                {dates.map((d) => {
                  const key = `${emp.id}-${format(d, 'yyyy-MM-dd')}`;
                  const cell = rosterMap[key];
                  const status = cell?.status;
                  const mismatch = cell?.mismatch;
                  const weekend = isSaturday(d) || isSunday(d);
                  const todayCol = isToday(d);
                  return (
                    <td
                      key={key}
                      title={mismatch ? cell.message : undefined}
                      className={cn(
                        'relative min-w-[88px] border-l border-[var(--border)] px-1 py-1 text-center transition-all duration-200 sm:min-w-[100px]',
                        weekend && 'bg-black/10',
                        todayCol && 'border-l-2 border-l-blue-500/60 bg-blue-500/[0.03]',
                        !readOnly && 'cursor-pointer hover:scale-[1.02] hover:z-10 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]',
                        status === 'W' && !mismatch && 'bg-emerald-500/10',
                        status === 'WO' && !mismatch && 'bg-amber-500/10',
                        (status === 'H' || status === 'PH') && !mismatch && 'bg-red-500/10',
                        status === 'LEAVE' && !mismatch && 'bg-violet-500/10',
                        mismatch && 'bg-purple-500/15 ring-2 ring-inset ring-purple-400/50'
                      )}
                      onClick={() => !readOnly && status !== 'LEAVE' && status !== 'H' && status !== 'PH' && onCellClick?.(emp, format(d, 'yyyy-MM-dd'), cell)}
                    >
                      {!readOnly && (
                        <Pencil className="absolute right-1 top-1 h-3 w-3 text-blue-400 opacity-0 transition-opacity group-hover:opacity-0 hover:opacity-100" />
                      )}
                      {mismatch && <AlertTriangle className="absolute right-0.5 top-0.5 h-3 w-3 text-purple-400" aria-hidden />}
                      {cell && (cell.status || cell.shift_start) ? (
                        <ShiftBadge cell={cell} />
                      ) : cell?.mismatch ? (
                        <span className="text-xs text-purple-300">!</span>
                      ) : (
                        <span className="text-[var(--text-secondary)]/40">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--text-secondary)]">
        <span><span className="font-semibold text-emerald-400">W</span> Working</span>
        <span><span className="font-semibold text-amber-400">WO</span> Weekly Off</span>
        <span><span className="font-semibold text-red-400">PH</span> Public holiday</span>
        <span><span className="font-semibold text-violet-400">Leave</span> Approved leave</span>
        <span className="font-mono text-[10px] text-emerald-400/90">W cells: 09:00 – 17:00 | 30m | 7.5h</span>
        {showMismatchLegend && (
          <span><span className="font-semibold text-purple-400">▲</span> Mismatch</span>
        )}
      </div>
    </div>
  );
}
