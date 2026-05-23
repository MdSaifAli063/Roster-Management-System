import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Timer, Users, Clock, AlertTriangle, Mail } from 'lucide-react';
import api from '../api/client';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RosterGrid from '../components/RosterGrid';
import DashboardDateRangePicker, { weekBounds } from '../components/dashboard/DashboardDateRangePicker';
import AttendanceTodayCard from '../components/attendance/AttendanceTodayCard';
import AttendanceMiniStat from '../components/attendance/AttendanceMiniStat';
import AttendanceDeptGauge from '../components/attendance/AttendanceDeptGauge';
import AttendanceListTable from '../components/attendance/AttendanceListTable';
import { eachDate } from '../lib/utils';
import { cn } from '../lib/utils';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'roster', label: 'Roster comparison' },
];

export default function ActualRoster() {
  const initial = weekBounds();
  const [rangeFrom, setRangeFrom] = useState(initial.from);
  const [rangeTo, setRangeTo] = useState(initial.to);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('date');
  const [department, setDepartment] = useState('all');
  const [deptGauge, setDeptGauge] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [employees, setEmployees] = useState([]);
  const [rosterMap, setRosterMap] = useState({});
  const [dates, setDates] = useState([]);
  const [mismatches, setMismatches] = useState([]);
  const [mismatchOnly, setMismatchOnly] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/employer', {
        params: {
          from: rangeFrom,
          to: rangeTo,
          page,
          limit,
          sort,
          department: department === 'all' ? '' : department,
        },
      });
      setData(res.data);
      if (!deptGauge && res.data.departments?.[0]) {
        setDeptGauge(res.data.departments[0].name);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [rangeFrom, rangeTo, page, limit, sort, department]);

  const loadRosterComparison = useCallback(async () => {
    const from = rangeFrom;
    const to = rangeTo;
    setDates(eachDate(from, to));
    setRosterLoading(true);
    try {
      const [empRes, mismatchRes] = await Promise.all([
        api.get('/employees'),
        api.get('/attendance/mismatches', { params: { start_date: from, end_date: to } }),
      ]);
      setEmployees(empRes.data);
      setRosterMap(mismatchRes.data.rosterMap || {});
      setMismatches(mismatchRes.data.mismatches || []);
    } finally {
      setRosterLoading(false);
    }
  }, [rangeFrom, rangeTo]);

  useEffect(() => {
    if (activeTab === 'overview') loadOverview();
  }, [activeTab, loadOverview]);

  useEffect(() => {
    if (activeTab === 'roster') loadRosterComparison();
  }, [activeTab, loadRosterComparison]);

  const handleRangeChange = (from, to) => {
    setRangeFrom(from);
    setRangeTo(to);
    setPage(1);
  };

  const sendMismatchEmail = async () => {
    setNotifying(true);
    try {
      await api.post('/attendance/notify-mismatches', {
        start_date: rangeFrom,
        end_date: rangeTo,
      });
      alert('Mismatch notification sent to HR (or logged in dev mode).');
    } catch {
      alert('Failed to send notification');
    } finally {
      setNotifying(false);
    }
  };

  const visibleEmployees = mismatchOnly
    ? employees.filter((e) => mismatches.some((m) => m.emp_id === e.id))
    : employees;

  const stats = data?.stats;

  return (
    <div className="-mx-3 -mt-2 space-y-6 sm:-mx-5 md:-mx-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Workforce</p>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track employee attendance and manage daily records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            title="Live clock"
            aria-label="Live clock"
          >
            <Timer className="h-4 w-4 text-blue-600" />
          </button>
          <DashboardDateRangePicker from={rangeFrom} to={rangeTo} onChange={handleRangeChange} />
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-800/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition',
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <AttendanceTodayCard
              stats={stats}
              weeklyChart={data?.weeklyChart}
              loading={loading}
              trend={stats?.attendTrend}
            />
            <AttendanceMiniStat
              label="Employee Attend"
              value={
                loading
                  ? '—'
                  : `${stats?.attendedToday ?? 0} / ${stats?.onRosterToday ?? stats?.totalEmployees ?? 0}`
              }
              sub={!loading && stats?.totalEmployees ? `${stats.totalEmployees} active employees` : undefined}
              trend={stats?.attendTrend}
              loading={loading}
              icon={Users}
            />
            <AttendanceMiniStat
              label="Total Log Hours"
              value={
                loading
                  ? '—'
                  : `${stats?.totalLogFormatted ?? '0:00:00'} / ${stats?.expectedLogFormatted ?? '0:00:00'}`
              }
              loading={loading}
              icon={Clock}
            />
            <AttendanceDeptGauge
              departments={data?.departments}
              selected={deptGauge}
              onSelect={setDeptGauge}
              loading={loading}
              totalLogFormatted={stats?.totalLogFormatted}
            />
          </div>

          <AttendanceListTable
            rows={data?.rows}
            loading={loading}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            pagination={data?.pagination}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(n) => {
              setLimit(n);
              setPage(1);
            }}
            sort={sort}
            onSortChange={setSort}
            department={department}
            departments={data?.departments}
            onDepartmentChange={(d) => {
              setDepartment(d);
              setPage(1);
            }}
          />
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mismatchOnly ? 'teal' : 'secondary'}
              onClick={() => setMismatchOnly(!mismatchOnly)}
            >
              {mismatchOnly ? 'Show all' : 'Mismatches only'}
            </Button>
            <Button
              variant="secondary"
              onClick={sendMismatchEmail}
              disabled={notifying || !mismatches.length}
            >
              <Mail className="h-4 w-4" />
              {notifying ? 'Sending…' : 'Email HR'}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-l-4 border-l-purple-500">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{mismatches.length}</p>
              <p className="text-sm text-slate-500">Mismatches in range</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-navy dark:text-white">{employees.length}</p>
              <p className="text-sm text-slate-500">Employees tracked</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-teal">{dates.length}</p>
              <p className="text-sm text-slate-500">Days in view</p>
            </Card>
          </div>

          {mismatches.length > 0 && (
            <Card title="Mismatch details">
              <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                {mismatches.map((m, i) => (
                  <li
                    key={`${m.emp_id}-${m.roster_date}-${i}`}
                    className="flex gap-2 rounded-lg bg-purple-50 px-3 py-2 dark:bg-purple-950/30"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                    <span>
                      <strong>{m.emp_code}</strong> {m.emp_name} · {m.roster_date} — {m.message}
                      <span className="ml-2 text-xs text-slate-500">({m.mismatch_type})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            {rosterLoading ? (
              <p className="text-center text-slate-500">Loading attendance comparison…</p>
            ) : visibleEmployees.length > 0 ? (
              <RosterGrid
                employees={visibleEmployees}
                dates={dates}
                rosterMap={rosterMap}
                readOnly
                showMismatchLegend
              />
            ) : (
              <p className="text-center text-slate-500">
                No mismatches found.{' '}
                <Link to="/manage-roster" className="text-teal">
                  Generate a roster
                </Link>{' '}
                first.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
