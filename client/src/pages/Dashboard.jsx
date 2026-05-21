import { useEffect, useState, useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronRight, Users, CalendarCheck, AlertTriangle, Palmtree, Eye, Clock, Briefcase, Plus, FileDown, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import KpiCard from '../components/KpiCard';
import PageHeader from '../components/PageHeader';
import MonthCalendar from '../components/MonthCalendar';
import { CardSkeleton } from '../components/ui/Skeleton';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/auth';
import { formatTime } from '../lib/utils';
import api from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
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
    const todayStr = format(today, 'yyyy-MM-dd');
    return Promise.all([
      api.get('/employees'),
      api.get('/rosters', { params: { start_date: todayStr, end_date: todayStr } }).catch(() => ({ data: [] })),
      api.get('/leave', { params: { status: 'PENDING' } }),
      api.get('/holidays', { params: { year: today.getFullYear(), month: today.getMonth() + 1 } }).catch(() => ({ data: [] })),
      api.get('/attendance/mismatches', { params: { start_date: from, end_date: to } }),
    ]).then(([emp, roster, leave, holidays, mismatch]) => {
      const rosterToday = Array.isArray(roster.data) ? roster.data.filter((r) => r.status === 'W').length : emp.data.length;
      const holidayCount = Array.isArray(holidays.data) ? holidays.data.length : 0;
      setStats({
        a: emp.data.length,
        b: rosterToday,
        c: leave.data.length,
        d: holidayCount,
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
          title: 'Leave request awaiting decision',
          count: pendingLeave,
          urgent: true,
          to: '/leave',
          action: 'View',
          meta: 'Pending approval',
        });
      }
      if (data.today?.status === 'W' && !data.todayAttendance?.punch_in) {
        needAct.push({ title: 'Mark attendance for today', count: 1, urgent: true, to: '/attendance', action: 'Mark In', meta: format(today, 'd MMM yyyy') });
      }
      needAct.push({ title: 'View my roster this week', count: data.weekRoster?.length || 0, urgent: false, to: '/view-roster', action: 'Open', meta: `${week.from} – ${week.to}` });
      setTasks(needAct.length ? needAct : [{ title: 'No pending actions', count: 0, urgent: false, to: '/view-roster', action: 'Open roster', meta: 'You are up to date' }]);

      const ev = [];
      if (data.today?.status === 'W') {
        ev.push({ date: today, title: `Today: ${formatTime(data.today.shift_start)} – ${formatTime(data.today.shift_end)}` });
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

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { loadCalendar(viewYear, viewMonth); }, [viewYear, viewMonth, loadCalendar]);

  const subtitle = employeeMode && empData?.employee
    ? `${empData.employee.emp_name} · ${format(today, 'EEEE, d MMMM yyyy')}`
    : format(today, 'EEEE, d MMMM yyyy');

  const statCards = employeeMode
    ? [
        { label: 'Working days (week)', value: stats.a, icon: Briefcase, to: '/view-roster', accent: 'green' },
        { label: 'Weekly offs', value: stats.b, icon: Clock, to: '/view-roster', accent: 'amber' },
        { label: 'Leave pending', value: stats.c, icon: Palmtree, to: '/leave', accent: 'red' },
        { label: 'Holidays (week)', value: stats.d, icon: CalendarCheck, to: '/view-roster', accent: 'blue' },
      ]
    : [
        { label: 'Total Employees', value: stats.a, icon: Users, to: '/employees', accent: 'blue' },
        { label: 'On Roster Today', value: stats.b, icon: CalendarCheck, to: '/manage-roster', accent: 'green' },
        { label: 'On Leave', value: stats.c, icon: Palmtree, to: '/leave', accent: 'amber' },
        { label: 'Holidays This Month', value: stats.d, icon: AlertTriangle, to: '/holidays', accent: 'red' },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        pathname={location.pathname}
        subtitle={subtitle}
        actions={
          employeeMode ? (
            <>
              <Button as={Link} to="/attendance" variant="primary"><CalendarCheck className="h-4 w-4" /> Attendance</Button>
              <Button as={Link} to="/view-roster" variant="secondary"><Eye className="h-4 w-4" /> My Roster</Button>
            </>
          ) : (
            <Button as={Link} to="/manage-roster" variant="primary"><Plus className="h-4 w-4" /> Create Roster</Button>
          )
        }
      />

      {employeeMode && !loading && empData && !empData.linked && (
        <Card accent="amber" className="border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-200">{empData.message}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : statCards.map((s) => <KpiCard key={s.label} {...s} loading={loading} />)}
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Roster Calendar">
            <MonthCalendar
              size="md"
              year={viewYear}
              month={viewMonth}
              days={calendarDays}
              loading={calLoading}
              onMonthChange={(y, m) => { setViewYear(y); setViewMonth(m); }}
            />
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              Public holidays and company holidays from your roster.
            </p>
          </Card>

          <Card title="Recent Activity">
            <ul className="space-y-2">
              {tasks.map((t, i) => (
                <li key={t.title} className="stagger-row" style={{ animationDelay: `${i * 50}ms` }}>
                  <Link
                    to={t.to}
                    className={`flex min-w-0 flex-col gap-2 rounded-lg border p-3 transition-all duration-200 hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between ${
                      t.urgent ? 'border-amber-500/30 bg-amber-500/5' : 'border-[var(--border)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{t.title}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{t.meta || `${t.count} pending`}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-blue-400">
                      {t.action} <ChevronRight className="h-4 w-4 opacity-50" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {!loading && events.length > 0 && (
        <Card title="Upcoming Events">
          <ul className="grid gap-2 sm:grid-cols-2">
            {events.map((e, i) => (
              <li key={`${e.title}-${i}`} className="flex gap-3 rounded-lg border border-[var(--border)] p-3 text-sm">
                <span className={`shrink-0 rounded-md px-2 py-1 font-mono text-xs font-medium ${e.national ? 'bg-red-500/15 text-red-300' : 'bg-blue-500/15 text-blue-300'}`}>
                  {format(e.date, 'd MMM')}
                </span>
                <span className="text-[var(--text-primary)]">{e.title}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!employeeMode && !loading && (
        <div className="flex flex-wrap gap-3">
          <Button as={Link} to="/manage-roster" variant="primary"><Calendar className="h-4 w-4" /> Create Roster</Button>
          <Button as={Link} to="/holidays" variant="secondary"><Palmtree className="h-4 w-4" /> Add Holiday</Button>
          <Button as={Link} to="/view-roster" variant="secondary"><Eye className="h-4 w-4" /> View Today&apos;s Roster</Button>
          <Button as={Link} to="/reports" variant="secondary"><FileDown className="h-4 w-4" /> Export Report</Button>
        </div>
      )}
    </div>
  );
}
