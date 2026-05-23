import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Users,
  Palmtree,
  CalendarCheck,
  BarChart3,
  Plus,
  Eye,
  Briefcase,
  Clock,
  Calendar,
  Timer,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/auth';
import api from '../api/client';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import AttendanceOverviewChart from '../components/dashboard/AttendanceOverviewChart';
import {
  DashboardAgendaCard,
  DashboardScheduleCard,
  DashboardTasksList,
} from '../components/dashboard/DashboardSideColumn';
import DashboardActivityTable from '../components/dashboard/DashboardActivityTable';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardDateRangePicker, { weekBounds } from '../components/dashboard/DashboardDateRangePicker';
import MonthCalendar from '../components/MonthCalendar';

export default function Dashboard() {
  const { user } = useAuth();
  const employeeMode = user?.role === ROLES.EMPLOYEE;
  const today = new Date();

  const [loading, setLoading] = useState(true);
  const [employer, setEmployer] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [calendarDays, setCalendarDays] = useState({});

  const initialRange = weekBounds(today);
  const [rangeFrom, setRangeFrom] = useState(initialRange.from);
  const [rangeTo, setRangeTo] = useState(initialRange.to);

  const loadEmployer = useCallback(() => {
    return api
      .get('/dashboard/employer', { params: { from: rangeFrom, to: rangeTo } })
      .then((res) => setEmployer(res.data));
  }, [rangeFrom, rangeTo]);

  const loadEmployee = useCallback(() => {
    return Promise.all([
      api.get('/dashboard/employee'),
      api.get('/calendar', { params: { year: viewYear, month: viewMonth } }),
    ]).then(([dash, cal]) => {
      setEmployee(dash.data);
      setCalendarDays(cal.data.days || {});
    });
  }, [viewYear, viewMonth]);

  useEffect(() => {
    setLoading(true);
    const p = employeeMode ? loadEmployee() : loadEmployer();
    p.catch(() => {})
      .finally(() => setLoading(false));
  }, [employeeMode, loadEmployee, loadEmployer]);

  if (employeeMode) {
    const emp = employee;
    const stats = emp?.weekSummary
      ? {
          a: emp.weekSummary.workingDays || 0,
          b: emp.weekSummary.weeklyOffs || 0,
          c: emp.pendingLeave || 0,
          d: emp.weekSummary.holidays || 0,
        }
      : { a: 0, b: 0, c: 0, d: 0 };

    return (
      <div className="app-page-shell space-y-6 pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">My workspace</p>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              My Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {emp?.employee?.emp_name ? `${emp.employee.emp_name} · ` : ''}
              {format(today, 'EEEE, d MMMM yyyy')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button as={Link} to="/attendance" variant="primary">
              <CalendarCheck className="h-4 w-4" /> Attendance
            </Button>
            <Button as={Link} to="/view-roster" variant="secondary">
              <Eye className="h-4 w-4" /> My roster
            </Button>
          </div>
        </div>

        {emp && !emp.linked && (
          <DashboardPanel className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-sm text-amber-800 dark:text-amber-200">{emp.message}</p>
          </DashboardPanel>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard label="Working days (week)" value={stats.a} icon={Briefcase} to="/view-roster" loading={loading} />
          <DashboardStatCard label="Weekly offs" value={stats.b} icon={Clock} to="/view-roster" loading={loading} />
          <DashboardStatCard label="Leave pending" value={stats.c} icon={Palmtree} to="/leave" loading={loading} />
          <DashboardStatCard label="Holidays (week)" value={stats.d} icon={CalendarCheck} to="/view-roster" loading={loading} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardPanel>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Roster calendar</h3>
            <div className="mt-4">
              <MonthCalendar
                size="md"
                year={viewYear}
                month={viewMonth}
                days={calendarDays}
                loading={loading}
                onMonthChange={(y, m) => {
                  setViewYear(y);
                  setViewMonth(m);
                  api.get('/calendar', { params: { year: y, month: m } }).then((res) => setCalendarDays(res.data.days || {}));
                }}
              />
            </div>
          </DashboardPanel>
          <DashboardTasksList
            loading={loading}
            tasks={
              emp?.pendingLeave > 0
                ? [
                    { title: 'Leave awaiting decision', count: emp.pendingLeave, urgent: true, to: '/leave' },
                    { title: 'View my roster', count: emp.weekRoster?.length || 0, urgent: false, to: '/view-roster' },
                  ]
                : [{ title: 'View my roster', count: emp?.weekRoster?.length || 0, urgent: false, to: '/view-roster' }]
            }
          />
        </div>
      </div>
    );
  }

  const s = employer?.stats;

  const handleRangeChange = (from, to) => {
    setRangeFrom(from);
    setRangeTo(to);
  };

  return (
    <div className="app-page-shell space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Overview</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Track workforce attendance, leave, and roster health for your organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30 sm:flex"
            title="Live roster week"
          >
            <Timer className="h-5 w-5" />
          </span>
          <DashboardDateRangePicker from={rangeFrom} to={rangeTo} onChange={handleRangeChange} />
          <Button as={Link} to="/manage-roster" variant="primary" className="shadow-md shadow-blue-500/20">
            <Plus className="h-4 w-4" /> Create roster
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Total employees"
          value={s?.totalEmployees?.toLocaleString() ?? '—'}
          icon={Users}
          to="/staff"
          trend={s?.trends?.employees}
          loading={loading}
        />
        <DashboardStatCard
          label="Leave requests"
          value={s?.pendingLeave ?? '—'}
          icon={Palmtree}
          to="/leave"
          trend={s?.trends?.leave}
          loading={loading}
        />
        <DashboardStatCard
          label="Attendance rate"
          value={s ? `${s.attendanceRate}%` : '—'}
          icon={BarChart3}
          to="/actual-roster"
          trend={s?.trends?.attendance}
          loading={loading}
        />
        <DashboardStatCard
          label="Holidays this month"
          value={s?.holidaysMonth ?? '—'}
          icon={Calendar}
          to="/holidays"
          loading={loading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AttendanceOverviewChart
            data={employer?.weeklyChart}
            attendanceRate={employer?.weekAttendancePct ?? employer?.stats?.attendanceRate ?? 0}
            attendedToday={employer?.stats?.attendedToday ?? 0}
            onRosterToday={employer?.stats?.onRosterToday ?? 0}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            loading={loading}
          />
        </div>
        <div className="flex flex-col gap-4">
          <DashboardAgendaCard tasks={employer?.tasks} loading={loading} />
          <DashboardScheduleCard
            schedule={employer?.schedule}
            events={employer?.events}
            loading={loading}
          />
        </div>
      </div>

      <DashboardActivityTable rows={employer?.recentActivity} loading={loading} rangeFrom={rangeFrom} rangeTo={rangeTo} />
    </div>
  );
}
