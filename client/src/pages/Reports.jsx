import { useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { downloadRosterExcel } from '../api/export';

export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState([]);

  const exportRoster = () => {
    downloadRosterExcel({ start_date: startDate, end_date: endDate });
  };

  const loadSummary = async () => {
    const { data } = await api.get('/reports/attendance-summary', {
      params: { start_date: startDate, end_date: endDate },
    });
    setSummary(data);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Reports</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Roster Report">
          <div className="space-y-3">
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Button variant="teal" onClick={exportRoster}>Export to Excel</Button>
          </div>
        </Card>

        <Card title="Attendance Summary">
          <div className="space-y-3">
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Button variant="primary" onClick={loadSummary}>Generate Summary</Button>
          </div>
        </Card>
      </div>

      {summary.length > 0 && (
        <Card title="Summary Results">
          <table className="min-w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="p-2">Code</th><th className="p-2">Name</th><th className="p-2">Working</th><th className="p-2">Weekly Off</th><th className="p-2">Holidays</th></tr></thead>
            <tbody>
              {summary.map((r) => (
                <tr key={r.emp_code} className="border-b dark:border-slate-800">
                  <td className="p-2 font-mono">{r.emp_code}</td>
                  <td className="p-2">{r.emp_name}</td>
                  <td className="p-2">{r.working_days}</td>
                  <td className="p-2">{r.weekly_offs}</td>
                  <td className="p-2">{r.holidays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
