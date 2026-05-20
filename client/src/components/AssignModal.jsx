import { useState, useEffect } from 'react';
import api from '../api/client';
import Button from './ui/Button';
import { Input, Select, Toggle } from './ui/Input';
import { formatTime } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { X, Clock } from 'lucide-react';

export default function ShiftEditModal({ open, onClose, employee, date, cell, onSaved }) {
  const [shifts, setShifts] = useState([]);
  const [working, setWorking] = useState(true);
  const [shiftId, setShiftId] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [mandStart, setMandStart] = useState('');
  const [mandEnd, setMandEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/shifts').then((r) => setShifts(r.data));
  }, []);

  useEffect(() => {
    if (!open) return;
    const st = cell?.status || 'W';
    setWorking(st === 'W');
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
    const status = working ? 'W' : 'WO';
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
      toast?.success('Shift saved successfully');
      onSaved?.();
      onClose();
    } catch (err) {
      toast?.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-scale-in glass-card w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-[var(--border)] px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">{employee?.emp_name}</h3>
              <p className="mt-1 font-mono text-sm text-[var(--text-secondary)]">{date}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-white/5">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <Toggle label="Working day" checked={working} onChange={setWorking} />
          {!working && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Marked as Weekly Off
            </p>
          )}

          {working && (
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
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Mandatory Window</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-[var(--text-secondary)]">Start</span>
                    <p className="mt-1 flex items-center gap-2 font-mono text-sm text-[var(--text-primary)]">
                      <Clock className="h-3.5 w-3.5 text-blue-400" /> {mandStart}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--text-secondary)]">End</span>
                    <p className="mt-1 flex items-center gap-2 font-mono text-sm text-[var(--text-primary)]">
                      <Clock className="h-3.5 w-3.5 text-blue-400" /> {mandEnd}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
