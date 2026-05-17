import { useEffect, useState } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronRight, Users, CalendarCheck, AlertTriangle, Palmtree } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Dashboard() {
  const today = new Date();
  const monthDays = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
  const [stats, setStats] = useState({ employees: 0, mismatches: 0, pendingLeave: 0, plants: 0 });

  useEffect(() => {
    const from = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const to = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    Promise.all([
      api.get('/employees'),
      api.get('/attendance/mismatches', { params: { start_date: from, end_date: to } }),
      api.get('/leave', { params: { status: 'PENDING' } }),
      api.get('/plants'),
    ]).then(([emp, mismatch, leave, plants]) => {
      setStats({
        employees: emp.data.length,
        mismatches: mismatch.data.count || 0,
        pendingLeave: leave.data.length,
        plants: plants.data.length,
      });
    }).catch(() => {});
  }, []);

  const tasks = [
    {
      title: 'Approve leave requests',
      count: stats.pendingLeave,
      urgent: stats.pendingLeave > 0,
      to: '/leave',
    },
    {
      title: 'Review attendance mismatches',
      count: stats.mismatches,
      urgent: stats.mismatches > 0,
      to: '/actual-roster',
    },
    {
      title: 'Update holiday calendar',
      count: 0,
      urgent: false,
      to: '/holidays',
    },
  ];

  const events = [
    { date: today, title: 'Team standup', type: 'meeting' },
    { date: addDays(today, 1), title: 'Roster review — Gurgaon', type: 'roster' },
    { date: addDays(today, 3), title: 'Weekly attendance check', type: 'attendance' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Dashboard</h1>
          <p className="text-slate-500">{format(today, 'EEEE, d MMMM yyyy')}</p>
        </div>
        <Link to="/actual-roster">
          <Button variant="teal"><CalendarCheck className="h-4 w-4" /> Attendance Today</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Calendar" className="lg:col-span-1">
          <div className="mb-3 text-center font-display font-semibold">{format(today, 'MMMM yyyy')}</div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
              <div key={d} className="py-1 font-medium text-slate-400">{d}</div>
            ))}
            {monthDays.map((d) => (
              <div
                key={d.toISOString()}
                className={`rounded py-1 ${isSameDay(d, today) ? 'bg-teal text-white font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                {format(d, 'd')}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Need to Act" className="lg:col-span-1">
          <ul className="space-y-3">
            {tasks.map((t) => (
              <Link key={t.title} to={t.to}>
                <li className={`flex items-center justify-between rounded-lg border p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800 ${t.urgent ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20' : 'border-slate-100 dark:border-slate-800'}`}>
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.count} pending</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </li>
              </Link>
            ))}
          </ul>
        </Card>

        <Card title="Events — Next 7 days" className="lg:col-span-1">
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.title} className="flex gap-3 text-sm">
                <span className="shrink-0 rounded bg-teal/10 px-2 py-1 text-xs font-medium text-teal">
                  {format(e.date, 'd MMM')}
                </span>
                <span>{e.title}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Employees', value: stats.employees, icon: Users, to: '/employees' },
          { label: 'Attendance Mismatches', value: stats.mismatches, icon: AlertTriangle, to: '/actual-roster' },
          { label: 'Pending Leave', value: stats.pendingLeave, icon: Palmtree, to: '/leave' },
          { label: 'Locations', value: stats.plants, icon: Users, to: '/plants' },
        ].map((s) => (
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
    </div>
  );
}
