import { MoreHorizontal, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardPanel from '../dashboard/DashboardPanel';
import { formatRangeLabel } from '../dashboard/DashboardDateRangePicker';
import { cn } from '../../lib/utils';

export default function AttendanceListTable({
  rows = [],
  loading,
  rangeFrom,
  rangeTo,
  pagination,
  page,
  limit,
  onPageChange,
  onLimitChange,
  sort,
  onSortChange,
  department,
  departments = [],
  onDepartmentChange,
}) {
  const { total = 0, totalPages = 1 } = pagination || {};

  const pageNumbers = () => {
    const pages = [];
    const max = totalPages;
    const cur = page;
    if (max <= 7) {
      for (let i = 1; i <= max; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (cur > 3) pages.push('…');
    for (let i = Math.max(2, cur - 1); i <= Math.min(max - 1, cur + 1); i++) pages.push(i);
    if (cur < max - 2) pages.push('…');
    pages.push(max);
    return pages;
  };

  return (
    <DashboardPanel padding={false} className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Attendance List</h3>
            <p className="text-sm text-slate-500">
              {rangeFrom && rangeTo ? formatRangeLabel(rangeFrom, rangeTo) : 'Records in selected range'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={department || 'all'}
            onChange={(e) => onDepartmentChange?.(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onSortChange?.(sort === 'name' ? 'date' : 'name')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort by {sort === 'name' ? 'name' : 'date'}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
            aria-hidden
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="w-10 px-5 py-3 sm:px-6">
                <input type="checkbox" className="rounded border-slate-300" aria-label="Select all" />
              </th>
              <th className="px-3 py-3">ID Employee</th>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Department</th>
              <th className="px-3 py-3">Check-In</th>
              <th className="px-3 py-3">Check-Out</th>
              <th className="px-3 py-3">Log Hours</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-5 py-3 sm:px-6" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: limit || 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800">
                    <td colSpan={9} className="px-5 py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              : rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-50 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-3.5 sm:px-6">
                      <input type="checkbox" className="rounded border-slate-300" aria-label={`Select ${r.empName}`} />
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-slate-500">#{r.empCode}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-bold text-white">
                          {r.empName?.slice(0, 2)?.toUpperCase() || '??'}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">{r.empName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {r.department}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-slate-700 dark:text-slate-200">{r.checkIn}</td>
                    <td className="px-3 py-3.5 font-mono text-slate-700 dark:text-slate-200">{r.checkOut}</td>
                    <td className="px-3 py-3.5 text-slate-600 dark:text-slate-300">{r.logHours}</td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          r.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 sm:px-6">
                      <button
                        type="button"
                        className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && !rows.length && (
          <p className="px-6 py-10 text-center text-sm text-slate-500">No attendance records in this range.</p>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-slate-500">
          Total Attendance: <span className="font-semibold text-slate-700 dark:text-slate-200">{total.toLocaleString()}</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          {pageNumbers().map((n, i) =>
            n === '…' ? (
              <span key={`e-${i}`} className="px-2 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange?.(n)}
                className={cn(
                  'min-w-[2rem] rounded-lg px-2 py-1.5 text-sm font-medium',
                  page === n
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                )}
              >
                {n}
              </button>
            )
          )}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          Show per page
          <select
            value={limit}
            onChange={(e) => onLimitChange?.(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {[10, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </DashboardPanel>
  );
}
