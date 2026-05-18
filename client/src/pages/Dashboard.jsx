import { useEffect, useState, useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronRight, Users, CalendarCheck, AlertTriangle, Palmtree, Eye, Clock, Briefcase } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import MonthCalendar from '../components/MonthCalendar';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/auth';
import { formatTime } from '../lib/utils';
import api from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const employeeMode = user?.role === ROLES.EMPLOYEE;
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

  const [stats, setStats] = useState({ a: 0, b: 0, c: 0, d: 0 });
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [calendarDays, setCalendarDays] = useState({});
  const [calLoading, setCalLoading] = useState(true);
  const [empData, setEmpData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCalendar = useCallback((y, m) => {
    setCalLoading(true);
    return api
      .get('/calendar', { params: { year: y, month: m } })
      .then((res) => {
        setCalendarDays(res.data.days || {});
        const upcoming = (res.data.upcoming || []).map((e) => ({
          date: new Date(e.date),
          title: e.label,
          national: e.national,
        }));
        if (upcoming.length) setEvents(upcoming);
      })
      .catch(() => setCalendarDays({}))
      .finally(() => setCalLoading(false));
  }, []);

  const loadStaff = useCallback(() => {
    const from = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const to = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    return Promise.all([
      api.get('/employees'),
      api.get('/attendance/mismatches', { params: { start_date: from, end_date: to } }),
      api.get('/leave', { params: { status: 'PENDING' } }),
      api.get('/plants'),
    ]).then(([emp, mismatch, leave, plants]) => {
      setStats({
        a: emp.data.length,
        b: mismatch.data.count || 0,
        c: leave.data.length,
        d: plants.data.length,
      });
      setTasks([
        { title: 'Approve leave requests', count: leave.data.length, urgent: leave.data.length > 0, to: '/leave', action: 'Review' },
        { title: 'Review attendance mismatches', count: mismatch.data.count || 0, urgent: (mismatch.data.count || 0) > 0, to: '/actual-roster', action: 'View' },
        { title: 'Update holiday calendar', count: 0, urgent: false, to: '/holidays', action: 'Open' },
      ]);
    });
  }, []);

  const loadEmployee = useCallback(() => {
    return api.get('/dashboard/employee').then((res) => {
      const data = res.data;
      setEmpData(data);
      if (!data.linked) return;

      const pendingLeave = data.pendingLeave || 0;
      const week = data.weekSummary || {};
      setStats({
        a: week.workingDays || 0,
        b: week.weeklyOffs || 0,
        c: pendingLeave,
        d: week.holidays || 0,
      });

      const needAct = [];
      if (pendingLeave > 0) {
        needAct.push({
          title: 'Leave request pending approval',
          count: pendingLeave,
          urgent: true,
          to: '/leave',
          action: 'View',
          meta: 'Awaiting HR',
        });
      }
      if (data.today?.status === 'W' && !data.todayAttendance?.punch_in) {
        needAct.push({
          title: 'Mark attendance for today',
          count: 1,
          urgent: true,
          to: '/attendance',
          action: 'Mark In',
          meta: format(today, 'd MMM yyyy'),
        });
      }
      needAct.push({
        title: 'View my roster this week',
        count: data.weekRoster?.length || 0,
        urgent: false,
        to: '/view-roster',
        action: 'Open',
        meta: `${week.from} – ${week.to}`,
      });
      if (data.leaveRequests?.some((l) => l.status === 'REJECTED')) {
        needAct.push({
          title: 'Review rejected leave',
          count: data.leaveRequests.filter((l) => l.status === 'REJECTED').length,
          urgent: false,
          to: '/leave',
          action: 'View',
          meta: 'Action required',
        });
      }
      setTasks(needAct.length ? needAct : [{
        title: 'No pending actions',
        count: 0,
        urgent: false,
        to: '/view-roster',
        action: 'Open roster',
        meta: 'You are up to date',
      }]);

      const ev = [];
      if (data.today?.status === 'W') {
        ev.push({
          date: today,
          title: `Today: ${formatTime(data.today.shift_start)} – ${formatTime(data.today.shift_end)}`,
        });
      } else if (data.today?.status === 'WO') {
        ev.push({ date: today, title: 'Today: Weekly off' });
      }
      setEvents((prev) => [...ev, ...prev].slice(0, 8));
    });
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      employeeMode ? loadEmployee() : loadStaff(),
      loadCalendar(viewYear, viewMonth),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [employeeMode, loadEmployee, loadStaff, loadCalendar, viewYear, viewMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    loadCalendar(viewYear, viewMonth);
  }, [viewYear, viewMonth, loadCalendar]);

  const statCards = employeeMode
    ? [
        { label: 'Working days (week)', value: stats.a, icon: Briefcase, to: '/view-roster' },
        { label: 'Weekly offs', value: stats.b, icon: Clock, to: '/view-roster' },
        { label: 'Leave pending', value: stats.c, icon: Palmtree, to: '/leave' },
        { label: 'Holidays (week)', value: stats.d, icon: CalendarCheck, to: '/view-roster' },
      ]
    : [
        { label: 'Total Employees', value: stats.a, icon: Users, to: '/employees' },
        { label: 'Attendance Mismatches', value: stats.b, icon: AlertTriangle, to: '/actual-roster' },
        { label: 'Pending Leave', value: stats.c, icon: Palmtree, to: '/leave' },
        { label: 'Locations', value: stats.d, icon: Users, to: '/plants' },
      ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy sm:text-2xl dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base dark:text-slate-400">
            {employeeMode && empData?.employee ? (
              <>
                <span className="block truncate font-medium text-slate-700 dark:text-slate-300">
                  {empData.employee.emp_name} · {empData.employee.emp_code}
                </span>
                <span>{format(today, 'EEEE, d MMMM yyyy')}</span>
              </>
            ) : (
              format(today, 'EEEE, d MMMM yyyy')
            )}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {employeeMode ? (
            <>
              <Button as={Link} to="/attendance" variant="teal" className="min-h-11 w-full sm:w-auto">
                <CalendarCheck className="h-4 w-4" /> Attendance
              </Button>
              <Button as={Link} to="/view-roster" variant="secondary" className="min-h-11 w-full sm:w-auto">
                <Eye className="h-4 w-4" /> My Roster
              </Button>
            </>
          ) : (
            <Button as={Link} to="/actual-roster" variant="teal" className="min-h-11 w-full sm:w-auto">
              <CalendarCheck className="h-4 w-4" /> Attendance Today
            </Button>
          )}
        </div>
      </div>

      {employeeMode && !loading && empData && !empData.linked && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="text-sm text-amber-900 dark:text-amber-200">{empData.message}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
            <Card title="Calendar" className="xl:col-span-1">
              <MonthCalendar
                year={viewYear}
                month={viewMonth}
                days={calendarDays}
                loading={calLoading}
                onMonthChange={(y, m) => {
                  setViewYear(y);
                  setViewMonth(m);
                }}
              />
              <p className="mt-3 text-xs text-slate-500">
                Live public holidays (India) and company holidays from your roster.
              </p>
            </Card>

            <Card title="Need to Act" className="xl:col-span-1">
              <ul className="space-y-3">
                {tasks.map((t) => (
                  <li key={t.title}>
                    <Link
                      to={t.to}
                      className={`flex items-center justify-between rounded-lg border p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800 ${t.urgent ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20' : 'border-slate-100 dark:border-slate-800'}`}
                    >
                      <TaskContent t={t} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Upcoming — holidays & events" className="xl:col-span-1">
              <ul className="space-y-3">
                {events.length === 0 ? (
                  <li className="text-sm text-slate-500">No upcoming holidays this month.</li>
                ) : (
                  events.map((e, i) => (
                    <li key={`${e.title}-${i}`} className="flex gap-3 text-sm dark:text-slate-300">
                      <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${e.national ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300' : 'bg-teal/10 text-teal'}`}>
                        {format(e.date, 'd MMM')}
                      </span>
                      <span>{e.title}</span>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {statCards.map((s) => (
              <Link key={s.label} to={s.to} className="min-w-0">
                <Card className="h-full transition hover:shadow-md">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="w-fit rounded-lg bg-teal/10 p-2.5 sm:p-3">
                      <s.icon className="h-5 w-5 text-teal sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-navy sm:text-2xl dark:text-white">{s.value}</p>
                      <p className="text-xs leading-snug text-slate-500 sm:text-sm">{s.label}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TaskContent({ t }) {
  return (
    <>
      <div>
        <p className="text-sm font-medium dark:text-slate-200">{t.title}</p>
        <p className="text-xs text-slate-500">{t.meta || `${t.count} pending`}</p>
      </div>
      <span className="flex items-center gap-1 text-xs font-medium text-teal">
        {t.action} <ChevronRight className="h-4 w-4 text-slate-400" />
      </span>
    </>
  );
}
