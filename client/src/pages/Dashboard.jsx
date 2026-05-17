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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {employeeMode && empData?.employee
              ? `${empData.employee.emp_name} · ${empData.employee.emp_code} · ${format(today, 'EEEE, d MMMM yyyy')}`
              : format(today, 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {employeeMode ? (
            <>
              <Link to="/attendance">
                <Button variant="teal"><CalendarCheck className="h-4 w-4" /> Attendance</Button>
              </Link>
              <Link to="/view-roster">
                <Button variant="secondary"><Eye className="h-4 w-4" /> My Roster</Button>
              </Link>
            </>
          ) : (
            <Link to="/actual-roster">
              <Button variant="teal"><CalendarCheck className="h-4 w-4" /> Attendance Today</Button>
            </Link>
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
          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Calendar" className="lg:col-span-1">
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

            <Card title="Need to Act" className="lg:col-span-1">
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

            <Card title="Upcoming — holidays & events" className="lg:col-span-1">
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((s) => (
              <Link key={s.label} to={s.to}>
                <Card className="transition hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-teal/10 p-3">
                      <s.icon className="h-6 w-6 text-teal" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-navy dark:text-white">{s.value}</p>
                      <p className="text-sm text-slate-500">{s.label}</p>
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
