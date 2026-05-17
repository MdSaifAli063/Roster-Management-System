import { useEffect, useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Trash2 } from 'lucide-react';

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [plants, setPlants] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ holiday_date: '', holiday_name: '', plant_id: '', is_national: false });
  const [bulkText, setBulkText] = useState('');

  const load = () => {
    api.get('/holidays', { params: { year } }).then((r) => setHolidays(r.data));
  };
  useEffect(() => {
    load();
    api.get('/plants').then((r) => setPlants(r.data));
  }, [year]);

  const addHoliday = async (e) => {
    e.preventDefault();
    await api.post('/holidays', {
      ...form,
      plant_id: form.is_national ? null : form.plant_id || null,
    });
    setForm({ holiday_date: '', holiday_name: '', plant_id: '', is_national: false });
    load();
  };

  const importCsv = async () => {
    const lines = bulkText.trim().split('\n').filter(Boolean);
    const items = lines.map((line) => {
      const [holiday_date, holiday_name, plant_code, national] = line.split(',').map((s) => s.trim());
      const plant = plants.find((p) => p.plant_code === plant_code);
      return {
        holiday_date,
        holiday_name,
        plant_id: national === 'Y' ? null : plant?.id,
        is_national: national === 'Y',
      };
    });
    await api.post('/holidays/import', { holidays: items });
    setBulkText('');
    load();
  };

  const remove = async (id) => {
    await api.delete(`/holidays/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Holidays</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Add Holiday">
          <form onSubmit={addHoliday} className="space-y-3">
            <Input label="Date" type="date" value={form.holiday_date} onChange={(e) => setForm({ ...form, holiday_date: e.target.value })} required />
            <Input label="Holiday Name" value={form.holiday_name} onChange={(e) => setForm({ ...form, holiday_name: e.target.value })} required />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_national} onChange={(e) => setForm({ ...form, is_national: e.target.checked })} />
              National holiday
            </label>
            {!form.is_national && (
              <Select label="Plant" value={form.plant_id} onChange={(e) => setForm({ ...form, plant_id: e.target.value })}>
                <option value="">All plants</option>
                {plants.map((p) => <option key={p.id} value={p.id}>{p.plant_name}</option>)}
              </Select>
            )}
            <Button type="submit" variant="teal">Add</Button>
          </form>
        </Card>

        <Card title="Bulk Import (CSV)">
          <p className="mb-2 text-xs text-slate-500">Format: date,name,plant_code,national(Y/N)</p>
          <textarea
            className="mb-3 h-32 w-full rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="2025-12-25,Christmas,,Y"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <Button variant="teal" onClick={importCsv}>Import</Button>
        </Card>
      </div>

      <Card title={`Holidays ${year}`} actions={
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      }>
        <table className="min-w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="p-2">Date</th><th className="p-2">Name</th><th className="p-2">Plant</th><th className="p-2">National</th><th /></tr></thead>
          <tbody>
            {holidays.map((h) => (
              <tr key={h.id} className="border-b dark:border-slate-800">
                <td className="p-2">{h.holiday_date?.slice?.(0, 10) || h.holiday_date}</td>
                <td className="p-2">{h.holiday_name}</td>
                <td className="p-2">{h.plant_name || '—'}</td>
                <td className="p-2">{h.is_national ? 'Yes' : 'No'}</td>
                <td className="p-2"><button type="button" onClick={() => remove(h.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
