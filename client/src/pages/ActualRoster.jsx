import { useEffect, useState, useCallback } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import RosterGrid from '../components/RosterGrid';
import { eachDate } from '../lib/utils';
import { AlertTriangle, Mail } from 'lucide-react';

export default function ActualRoster() {
  const [employees, setEmployees] = useState([]);
  const [rosterMap, setRosterMap] = useState({});
  const [dates, setDates] = useState([]);
  const [mismatches, setMismatches] = useState([]);
  const [mismatchOnly, setMismatchOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [range, setRange] = useState({ from: '', to: '' });

  const load = useCallback(async () => {
    const from = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const to = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    setRange({ from, to });
    setDates(eachDate(from, to));
    setLoading(true);
    try {
      const [empRes, mismatchRes] = await Promise.all([
        api.get('/employees'),
        api.get('/attendance/mismatches', { params: { start_date: from, end_date: to } }),
      ]);
      setEmployees(empRes.data);
      setRosterMap(mismatchRes.data.rosterMap || {});
      setMismatches(mismatchRes.data.mismatches || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleEmployees = mismatchOnly
    ? employees.filter((e) =>
        mismatches.some((m) => m.emp_id === e.id)
      )
    : employees;

  const sendMismatchEmail = async () => {
    setNotifying(true);
    try {
      await api.post('/attendance/notify-mismatches', {
        start_date: range.from,
        end_date: range.to,
      });
      alert('Mismatch notification sent to HR (or logged in dev mode).');
    } catch {
      alert('Failed to send notification');
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Actual Roster</h1>
          <p className="text-slate-500">
            Planned roster vs attendance · {range.from} to {range.to}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mismatchOnly ? 'teal' : 'secondary'}
            onClick={() => setMismatchOnly(!mismatchOnly)}
          >
            {mismatchOnly ? 'Show all' : 'Mismatches only'}
          </Button>
          <Button variant="secondary" onClick={sendMismatchEmail} disabled={notifying || !mismatches.length}>
            <Mail className="h-4 w-4" />
            {notifying ? 'Sending…' : 'Email HR'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-purple-500">
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{mismatches.length}</p>
          <p className="text-sm text-slate-500">Mismatches this week</p>
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
              <li key={`${m.emp_id}-${m.roster_date}-${i}`} className="flex gap-2 rounded-lg bg-purple-50 px-3 py-2 dark:bg-purple-950/30">
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
        {loading ? (
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
          <p className="text-center text-slate-500">No mismatches found. <Link to="/manage-roster" className="text-teal">Generate a roster</Link> first.</p>
        )}
      </Card>
    </div>
  );
}
