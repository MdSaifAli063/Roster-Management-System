import { useCallback, useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import MonthCalendar from '../components/MonthCalendar';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/auth';
import { formatTime } from '../lib/utils';
import api from '../api/client';

export default function Attendance() {
  const { user } = useAuth();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [calendarDays, setCalendarDays] = useState({});
  const [calLoading, setCalLoading] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);

  if (user?.role !== ROLES.EMPLOYEE) {
    return <Navigate to="/actual-roster" replace />;
  }

  const loadCalendar = useCallback((y, m) => {
    setCalLoading(true);
    api
      .get('/calendar', { params: { year: y, month: m } })
      .then((res) => setCalendarDays(res.data.days || {}))
      .catch(() => setCalendarDays({}))
      .finally(() => setCalLoading(false));
  }, []);

  const loadAttendance = useCallback(() => {
    const from = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const to = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    setLoading(true);
    return api
      .get('/attendance/my', { params: { start_date: from, end_date: to } })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCalendar(viewYear, viewMonth);
  }, [viewYear, viewMonth, loadCalendar]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const markIn = async () => {
    setMarking(true);
    try {
      await api.post('/attendance/mark-in');
      await loadAttendance();
    } catch (err) {
      alert(err.response?.data?.error || 'Mark in failed');
    } finally {
      setMarking(false);
    }
  };

  const markOut = async () => {
    setMarking(true);
    try {
      await api.post('/attendance/mark-out');
      await loadAttendance();
    } catch (err) {
      alert(err.response?.data?.error || 'Mark out failed');
    } finally {
      setMarking(false);
    }
  };

  const roster = data?.todayRoster;
  const att = data?.todayAttendance;
  const canMark =
    roster?.status !== 'WO' && roster?.status !== 'H';

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedInfo = calendarDays[selectedKey];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {data?.employee
              ? `${data.employee.emp_name} · ${data.employee.emp_code}`
              : format(today, 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        {canMark && (
          <div className="flex gap-2">
            <Button variant="teal" onClick={markIn} disabled={marking || !!att?.punch_in}>
              <LogIn className="h-4 w-4" /> Mark In
            </Button>
            <Button variant="secondary" onClick={markOut} disabled={marking || !att?.punch_in}>
              <LogOut className="h-4 w-4" /> Mark Out
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[120px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-green-200 p-0 dark:border-green-900">
              <div className="bg-green-600 px-4 py-3 text-center font-display text-lg font-semibold text-white dark:bg-green-700">
                Attendance Today — {format(today, 'd MMM yyyy')}
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Planned" value={
                  roster?.status === 'W'
                    ? `${formatTime(roster.shift_start)} – ${formatTime(roster.shift_end)}`
                    : roster?.status === 'WO'
                      ? 'Weekly off'
                      : roster?.status === 'H'
                        ? 'Holiday'
                        : '—'
                } />
                <Stat label="Mark In" value={att?.punch_in ? formatTime(att.punch_in) : 'Not marked'} />
                <Stat label="Mark Out" value={att?.punch_out ? formatTime(att.punch_out) : 'Not marked'} />
                <Stat
                  label="Status"
                  value={att?.status?.toLowerCase() || 'Pending'}
                  accent
                />
              </div>
            </Card>

            <Card title="This week">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Planned</th>
                      <th className="pb-2 pr-4">In</th>
                      <th className="pb-2">Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.history || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          No punches recorded this week yet.
                        </td>
                      </tr>
                    ) : (
                      data.history.map((row) => (
                        <tr key={row.id} className="border-b border-slate-50 dark:border-slate-800/80">
                          <td className="py-2 pr-4">{format(new Date(row.attendance_date), 'EEE d MMM')}</td>
                          <td className="py-2 pr-4 capitalize">{row.roster_status?.toLowerCase() || '—'}</td>
                          <td className="py-2 pr-4">{row.punch_in ? formatTime(row.punch_in) : '—'}</td>
                          <td className="py-2">{row.punch_out ? formatTime(row.punch_out) : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <Card title="Calendar — holidays & roster">
            <MonthCalendar
              size="md"
              year={viewYear}
              month={viewMonth}
              days={calendarDays}
              loading={calLoading}
              onMonthChange={(y, m) => {
                setViewYear(y);
                setViewMonth(m);
              }}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            {selectedInfo?.events?.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                <p className="text-xs font-medium uppercase text-slate-500">
                  {format(selectedDate, 'd MMMM yyyy')}
                </p>
                {selectedInfo.events.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                    <span>
                      {e.label}
                      {e.national && (
                        <span className="ml-1 text-xs text-red-600 dark:text-red-400">(Public holiday)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold capitalize ${accent ? 'text-green-700 dark:text-green-400' : 'text-navy dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}
