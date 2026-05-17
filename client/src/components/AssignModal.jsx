import { useState, useEffect } from 'react';
import api from '../api/client';
import Button from './ui/Button';
import { Input, Select } from './ui/Input';
import { formatTime } from '../lib/utils';
import { X } from 'lucide-react';

export default function ShiftEditModal({ open, onClose, employee, date, cell, onSaved }) {
  const [shifts, setShifts] = useState([]);
  const [status, setStatus] = useState('W');
  const [shiftId, setShiftId] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [mandStart, setMandStart] = useState('');
  const [mandEnd, setMandEnd] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/shifts').then((r) => setShifts(r.data));
  }, []);

  useEffect(() => {
    if (!open) return;
    setStatus(cell?.status || 'W');
    setShiftId(cell?.shift_id ? String(cell.shift_id) : '');
    setShiftStart(formatTime(cell?.shift_start) || '09:00');
    setShiftEnd(formatTime(cell?.shift_end) || '18:00');
    setMandStart(formatTime(cell?.mandatory_start) || '09:00');
    setMandEnd(formatTime(cell?.mandatory_end) || '18:00');
  }, [open, cell]);

  const onShiftChange = (id) => {
    setShiftId(id);
    const s = shifts.find((x) => String(x.id) === id);
    if (s) {
      setShiftStart(formatTime(s.shift_start));
      setShiftEnd(formatTime(s.shift_end));
      setMandStart(formatTime(s.mandatory_start));
      setMandEnd(formatTime(s.mandatory_end));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        status,
        shift_id: status === 'W' ? Number(shiftId) : null,
        shift_start: status === 'W' ? shiftStart : null,
        shift_end: status === 'W' ? shiftEnd : null,
        mandatory_start: status === 'W' ? mandStart : null,
        mandatory_end: status === 'W' ? mandEnd : null,
      };
      await api.put(`/rosters/cell/${employee.id}/${date}`, payload);
      onSaved?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="font-display text-lg font-semibold text-navy dark:text-white">Edit Shift</h3>
            <p className="text-sm text-slate-500">{employee?.emp_name} · {date}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Status</legend>
            <label className="flex items-center gap-2">
              <input type="radio" checked={status === 'WO'} onChange={() => setStatus('WO')} />
              Weekly Off
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={status === 'W'} onChange={() => setStatus('W')} />
              Working
            </label>
          </fieldset>
          {status === 'W' && (
            <>
              <Select label="Shift" value={shiftId} onChange={(e) => onShiftChange(e.target.value)}>
                <option value="">Select shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.shift_name}</option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Shift Start" type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} />
                <Input label="Shift End" type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} />
                <Input label="Mandatory Start" type="time" value={mandStart} onChange={(e) => setMandStart(e.target.value)} />
                <Input label="Mandatory End" type="time" value={mandEnd} onChange={(e) => setMandEnd(e.target.value)} />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Exit</Button>
            <Button type="submit" variant="teal" disabled={saving}>{saving ? 'Saving…' : 'Submit'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
