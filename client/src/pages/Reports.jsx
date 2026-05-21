import { useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { downloadRosterExcel, downloadRosterPdf, downloadReportExport } from '../api/export';
import { TrendingDown, TrendingUp } from 'lucide-react';

const GROUPS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'half-year', label: 'Half-Year' },
  { value: 'year', label: 'Year' },
];

export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prevStart, setPrevStart] = useState('');
  const [prevEnd, setPrevEnd] = useState('');
  const [groupBy, setGroupBy] = useState('month');
  const [hours, setHours] = useState([]);
  const [wages, setWages] = useState([]);
  const [combined, setCombined] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [summary, setSummary] = useState([]);

  const params = { start_date: startDate, end_date: endDate, group_by: groupBy };

  const needDates = () => {
    if (!startDate || !endDate) {
      alert('Select start and end dates first');
      return false;
    }
    return true;
  };

  const loadHours = async () => {
    if (!needDates()) return;
    const { data } = await api.get('/reports/hours', { params });
    setHours(data || []);
  };

  const loadWages = async () => {
    if (!needDates()) return;
    const { data } = await api.get('/reports/wages', { params });
    setWages(data || []);
  };

  const loadCombined = async () => {
    if (!needDates()) return;
    const { data } = await api.get('/reports/combined', { params });
    setCombined(data || []);
  };

  const loadComparison = async () => {
    if (!needDates()) return;
    const { data } = await api.get('/reports/comparison', {
      params: { start_date: startDate, end_date: endDate, prev_start: prevStart, prev_end: prevEnd },
    });
    setComparison(data);
  };

  const loadSummary = async () => {
    if (!needDates()) return;
    const { data } = await api.get('/reports/attendance-summary', { params: { start_date: startDate, end_date: endDate } });
    setSummary(data);
  };

  const PctBadge = ({ value }) => {
    if (value == null) return <span>—</span>;
    const up = value > 0;
    return (
      <span className={`inline-flex items-center gap-1 ${up ? 'text-red-400' : 'text-emerald-400'}`}>
        {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Reports</h1>

      <Card title="Date range">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input label="Start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            {GROUPS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-2 self-end">
            <Button variant="secondary" onClick={() => downloadRosterExcel(params)}>Roster Excel</Button>
            <Button variant="secondary" onClick={() => downloadRosterPdf(params)}>Roster PDF</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Hours report">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={loadHours}>Generate</Button>
            <Button variant="ghost" onClick={() => downloadReportExport('hours', params, 'xlsx')}>Excel</Button>
            <Button variant="ghost" onClick={() => downloadReportExport('hours', params, 'pdf')}>PDF</Button>
          </div>
          {hours.length > 0 && (
            <table className="mt-4 w-full text-xs">
              <thead><tr className="text-[var(--text-secondary)]"><th className="p-1">Employee</th><th>Period</th><th>Hours</th></tr></thead>
              <tbody>
                {hours.slice(0, 30).map((r, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="p-1">{r.emp_name}</td>
                    <td>{String(r.period || '').slice(0, 10)}</td>
                    <td className="font-mono">{Number(r.total_hours).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Wages report">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={loadWages}>Generate</Button>
            <Button variant="ghost" onClick={() => downloadReportExport('wages', params, 'xlsx')}>Excel</Button>
            <Button variant="ghost" onClick={() => downloadReportExport('wages', params, 'pdf')}>PDF</Button>
          </div>
          {wages.length > 0 && (
            <table className="mt-4 w-full text-xs">
              <thead><tr className="text-[var(--text-secondary)]"><th className="p-1">Employee</th><th>Wages</th></tr></thead>
              <tbody>
                {wages.slice(0, 30).map((r, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="p-1">{r.emp_name}</td>
                    <td className="font-mono">${Number(r.total_wages || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Combined (hours + wages)" className="lg:col-span-2">
          <Button variant="teal" onClick={loadCombined}>Generate combined</Button>
          {combined.length > 0 && (
            <table className="mt-4 w-full text-xs">
              <thead>
                <tr className="text-[var(--text-secondary)]">
                  <th className="p-1">Employee</th><th>Period</th><th>Hours</th><th>Wages</th>
                </tr>
              </thead>
              <tbody>
                {combined.slice(0, 40).map((r, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="p-1">{r.emp_name}</td>
                    <td>{String(r.period || '').slice(0, 10)}</td>
                    <td className="font-mono">{Number(r.total_hours).toFixed(2)}</td>
                    <td className="font-mono">${Number(r.total_wages || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Comparison vs previous period">
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <Input label="Previous start" type="date" value={prevStart} onChange={(e) => setPrevStart(e.target.value)} />
            <Input label="Previous end" type="date" value={prevEnd} onChange={(e) => setPrevEnd(e.target.value)} />
          </div>
          <Button variant="primary" onClick={loadComparison}>Compare</Button>
          {comparison && (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Hours change</dt><dd><PctBadge value={comparison.hours_change_pct} /></dd></div>
              <div className="flex justify-between"><dt>Wages change</dt><dd><PctBadge value={comparison.wages_change_pct} /></dd></div>
              <p className="text-xs text-[var(--text-secondary)]">Green ↓ = lower cost/hours · Red ↑ = increase</p>
            </dl>
          )}
        </Card>
      </div>

      <Card title="Attendance summary">
        <Button variant="secondary" onClick={loadSummary}>Generate</Button>
        {summary.length > 0 && (
          <table className="mt-4 min-w-full text-sm">
            <thead><tr className="border-b text-left text-[var(--text-secondary)]"><th className="p-2">Code</th><th>Name</th><th>Working</th><th>WO</th><th>Holidays</th></tr></thead>
            <tbody>
              {summary.map((r) => (
                <tr key={r.emp_code} className="border-b border-[var(--border)]">
                  <td className="p-2 font-mono">{r.emp_code}</td>
                  <td className="p-2">{r.emp_name}</td>
                  <td className="p-2">{r.working_days}</td>
                  <td className="p-2">{r.weekly_offs}</td>
                  <td className="p-2">{r.holidays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
