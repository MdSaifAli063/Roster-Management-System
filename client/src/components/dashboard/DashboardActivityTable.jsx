import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import DashboardPanel from './DashboardPanel';
import { formatRangeLabel } from './DashboardDateRangePicker';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'attendance', label: 'Attendance', to: '/actual-roster' },
  { id: 'leave', label: 'Leave request', to: '/leave' },
  { id: 'finance', label: 'Finance', to: '/finance' },
];

export default function DashboardActivityTable({ rows, loading, rangeFrom, rangeTo }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const detailTo = TABS.find((t) => t.id === activeTab)?.to || '/actual-roster';

  return (
    <DashboardPanel padding={false} className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Recent activity</h3>
            <p className="text-sm text-slate-500">
              {rangeFrom && rangeTo
                ? `Attendance in ${formatRangeLabel(rangeFrom, rangeTo)}`
                : 'Latest attendance records'}
            </p>
          </div>
          <Link to={detailTo} className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            See detail
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-800/50">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm',
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              <ArrowUpDown className="h-3.5 w-3.5" /> Sort by
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'attendance' ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-5 py-3 sm:px-6">Employee</th>
                <th className="px-3 py-3">Department</th>
                <th className="px-3 py-3">Check-in</th>
                <th className="px-3 py-3">Check-out</th>
                <th className="px-3 py-3">Hours</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 sm:px-6" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))
                : rows?.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-50 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-bold text-white">
                            {r.empName?.slice(0, 2)?.toUpperCase() || '??'}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white">{r.empName}</p>
                            <p className="text-xs text-slate-500">{r.empCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 dark:text-slate-300">{r.department}</td>
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
                        <button type="button" className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="More">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && !rows?.length && (
            <p className="px-6 py-10 text-center text-sm text-slate-500">No attendance records in this range.</p>
          )}
        </div>
      ) : (
        <div className="px-6 py-14 text-center">
          <p className="text-sm text-slate-500">
            Open <span className="font-medium text-slate-700 dark:text-slate-300">{TABS.find((t) => t.id === activeTab)?.label}</span>{' '}
            for full details.
          </p>
          <Link
            to={detailTo}
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to {TABS.find((t) => t.id === activeTab)?.label}
          </Link>
        </div>
      )}
    </DashboardPanel>
  );
}
