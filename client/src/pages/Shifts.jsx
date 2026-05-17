import { useEffect, useState } from 'react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatTime } from '../lib/utils';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [tab, setTab] = useState('shifts');
  const [shiftForm, setShiftForm] = useState(null);
  const [patternForm, setPatternForm] = useState(null);

  const load = () => {
    api.get('/shifts').then((r) => setShifts(r.data));
    api.get('/shifts/patterns').then((r) => setPatterns(r.data));
  };
  useEffect(load, []);

  const saveShift = async (e) => {
    e.preventDefault();
    if (shiftForm.id) await api.put(`/shifts/${shiftForm.id}`, shiftForm);
    else await api.post('/shifts', shiftForm);
    setShiftForm(null);
    load();
  };

  const savePattern = async (e) => {
    e.preventDefault();
    if (patternForm.id) await api.put(`/shifts/patterns/${patternForm.id}`, patternForm);
    else await api.post('/shifts/patterns', patternForm);
    setPatternForm(null);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Shifts</h1>
      <div className="flex gap-2">
        <Button variant={tab === 'shifts' ? 'teal' : 'secondary'} onClick={() => setTab('shifts')}>Shifts</Button>
        <Button variant={tab === 'patterns' ? 'teal' : 'secondary'} onClick={() => setTab('patterns')}>Patterns</Button>
      </div>

      {tab === 'shifts' && (
        <Card title="Shift Definitions" actions={<Button variant="teal" onClick={() => setShiftForm({ shift_name: '', shift_start: '09:00', shift_end: '18:00', mandatory_start: '09:00', mandatory_end: '18:00' })}>Add</Button>}>
          <table className="min-w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="p-2">Name</th><th className="p-2">Start</th><th className="p-2">End</th><th className="p-2">Mandatory</th><th /></tr></thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} className="border-b dark:border-slate-800">
                  <td className="p-2 font-medium">{s.shift_name}</td>
                  <td className="p-2">{formatTime(s.shift_start)}</td>
                  <td className="p-2">{formatTime(s.shift_end)}</td>
                  <td className="p-2">{formatTime(s.mandatory_start)}–{formatTime(s.mandatory_end)}</td>
                  <td className="p-2"><Button variant="ghost" onClick={() => setShiftForm({ ...s, shift_start: formatTime(s.shift_start), shift_end: formatTime(s.shift_end), mandatory_start: formatTime(s.mandatory_start), mandatory_end: formatTime(s.mandatory_end) })}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'patterns' && (
        <Card title="Shift Patterns" actions={<Button variant="teal" onClick={() => setPatternForm({ pattern_name: '', shift_id: shifts[0]?.id, mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false })}>Add</Button>}>
          <table className="min-w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="p-2">Pattern</th><th className="p-2">Shift</th>{DAYS.map((d) => <th key={d} className="p-2 uppercase">{d}</th>)}<th /></tr></thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.id} className="border-b dark:border-slate-800">
                  <td className="p-2">{p.pattern_name}</td>
                  <td className="p-2">{p.shift_name}</td>
                  {DAYS.map((d) => <td key={d} className="p-2 text-center">{p[d] ? '✓' : '—'}</td>)}
                  <td className="p-2"><Button variant="ghost" onClick={() => setPatternForm({ ...p })}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {shiftForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card title="Shift" className="w-full max-w-md">
            <form onSubmit={saveShift} className="space-y-3">
              <Input label="Name" value={shiftForm.shift_name} onChange={(e) => setShiftForm({ ...shiftForm, shift_name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start" type="time" value={shiftForm.shift_start} onChange={(e) => setShiftForm({ ...shiftForm, shift_start: e.target.value })} />
                <Input label="End" type="time" value={shiftForm.shift_end} onChange={(e) => setShiftForm({ ...shiftForm, shift_end: e.target.value })} />
                <Input label="Mandatory In" type="time" value={shiftForm.mandatory_start} onChange={(e) => setShiftForm({ ...shiftForm, mandatory_start: e.target.value })} />
                <Input label="Mandatory Out" type="time" value={shiftForm.mandatory_end} onChange={(e) => setShiftForm({ ...shiftForm, mandatory_end: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="teal">Save</Button>
                <Button type="button" variant="secondary" onClick={() => setShiftForm(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {patternForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card title="Pattern" className="w-full max-w-md">
            <form onSubmit={savePattern} className="space-y-3">
              <Input label="Pattern Name" value={patternForm.pattern_name} onChange={(e) => setPatternForm({ ...patternForm, pattern_name: e.target.value })} />
              <select className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" value={patternForm.shift_id} onChange={(e) => setPatternForm({ ...patternForm, shift_id: Number(e.target.value) })}>
                {shifts.map((s) => <option key={s.id} value={s.id}>{s.shift_name}</option>)}
              </select>
              <div className="flex flex-wrap gap-3">
                {DAYS.map((d) => (
                  <label key={d} className="flex items-center gap-1 text-sm capitalize">
                    <input type="checkbox" checked={!!patternForm[d]} onChange={(e) => setPatternForm({ ...patternForm, [d]: e.target.checked })} />
                    {d}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="teal">Save</Button>
                <Button type="button" variant="secondary" onClick={() => setPatternForm(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
