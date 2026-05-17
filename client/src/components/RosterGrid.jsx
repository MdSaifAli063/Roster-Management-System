import { format } from 'date-fns';
import ShiftBadge from './ShiftBadge';
import { cn } from '../lib/utils';
import { AlertTriangle } from 'lucide-react';

export default function RosterGrid({ employees, dates, rosterMap, onCellClick, readOnly, showMismatchLegend = false }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <th className="sticky left-0 z-20 min-w-[90px] border-b border-r bg-slate-50 px-3 py-2 text-left font-semibold dark:bg-slate-800/50">Emp Code</th>
            <th className="sticky left-[90px] z-20 min-w-[160px] border-b border-r bg-slate-50 px-3 py-2 text-left font-semibold dark:bg-slate-800/50">Emp Name</th>
            {dates.map((d) => (
              <th key={d.toISOString()} className="min-w-[100px] border-b px-2 py-2 text-center font-medium text-slate-600 dark:text-slate-400">
                <div>{format(d, 'EEE')}</div>
                <div className="text-xs">{format(d, 'd MMM')}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="sticky left-0 z-10 border-r bg-white px-3 py-2 font-mono text-xs dark:bg-slate-900">{emp.emp_code}</td>
              <td className="sticky left-[90px] z-10 border-r bg-white px-3 py-2 dark:bg-slate-900">{emp.emp_name}</td>
              {dates.map((d) => {
                const key = `${emp.id}-${format(d, 'yyyy-MM-dd')}`;
                const cell = rosterMap[key];
                const status = cell?.status;
                const mismatch = cell?.mismatch;
                return (
                  <td
                    key={key}
                    title={mismatch ? cell.message : undefined}
                    className={cn(
                      'relative border-l px-1 py-1 text-center',
                      !readOnly && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800',
                      status === 'W' && !mismatch && 'bg-green-50/50 dark:bg-green-950/20',
                      status === 'WO' && !mismatch && 'bg-amber-50/50 dark:bg-amber-950/20',
                      status === 'H' && !mismatch && 'bg-red-50/50 dark:bg-red-950/20',
                      mismatch && 'bg-purple-50 ring-2 ring-inset ring-purple-400 dark:bg-purple-950/30 dark:ring-purple-500'
                    )}
                    onClick={() => !readOnly && onCellClick?.(emp, format(d, 'yyyy-MM-dd'), cell)}
                  >
                    {mismatch && (
                      <AlertTriangle className="absolute right-0.5 top-0.5 h-3 w-3 text-purple-600" aria-hidden />
                    )}
                    {cell && (cell.status || cell.shift_start) ? (
                      <ShiftBadge status={cell.status} shiftStart={cell.shift_start} shiftEnd={cell.shift_end} />
                    ) : cell?.mismatch ? (
                      <span className="text-xs text-purple-700 dark:text-purple-300">!</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-4 border-t px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
        <span><span className="font-semibold text-green-600">W</span> = Working</span>
        <span><span className="font-semibold text-amber-600">WO</span> = Weekly Off</span>
        <span><span className="font-semibold text-red-600">H</span> = Company Holiday</span>
        {showMismatchLegend && (
          <span><span className="font-semibold text-purple-600">▲</span> = Attendance mismatch</span>
        )}
      </div>
    </div>
  );
}
