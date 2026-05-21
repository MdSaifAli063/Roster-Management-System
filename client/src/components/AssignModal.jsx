import { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import Button from './ui/Button';
import { Input, Select, Toggle } from './ui/Input';
import { formatTime } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { X, Clock } from 'lucide-react';
import { BREAK_OPTIONS, generateTimeSlots, computeTotalHours } from '../lib/rosterTime';

const TIME_SLOTS = generateTimeSlots(15);

export default function ShiftEditModal({
  open,
  onClose,
  employee,
  date,
  cell,
  onSaved,
  /** When false, apply via onSaved(cell) only — parent handles Save to server */
  persistOnSave = true,
}) {
  const [shifts, setShifts] = useState([]);
  const [working, setWorking] = useState(true);
  const [locked, setLocked] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [mandStart, setMandStart] = useState('');
  const [mandEnd, setMandEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const totalHours = useMemo(
    () => (working ? computeTotalHours(shiftStart, shiftEnd, breakMinutes) : 0),
    [working, shiftStart, shiftEnd, breakMinutes]
  );

  useEffect(() => {
    api.get('/shifts').then((r) => setShifts(r.data));
  }, []);

  useEffect(() => {
    if (!open) return;
    const st = cell?.status || 'W';
    setLocked(st === 'LEAVE' || st === 'H' || st === 'PH');
    setWorking(st === 'W');
    setShiftId(cell?.shift_id ? String(cell.shift_id) : '');
    setShiftStart(formatTime(cell?.shift_start) || '09:00');
    setShiftEnd(formatTime(cell?.shift_end) || '17:00');
    setBreakMinutes(Number(cell?.break_minutes) || 0);
    setMandStart(formatTime(cell?.mandatory_start) || '09:00');
    setMandEnd(formatTime(cell?.mandatory_end) || '17:00');
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
    if (locked) return;
    setSaving(true);
    const status = working ? 'W' : 'WO';
    try {
      const payload = {
        emp_id: employee.id,
        roster_date: date,
        status,
        shift_id: status === 'W' && shiftId ? Number(shiftId) : null,
        shift_start: status === 'W' ? shiftStart : null,
        shift_end: status === 'W' ? shiftEnd : null,
        mandatory_start: status === 'W' ? mandStart : null,
        mandatory_end: status === 'W' ? mandEnd : null,
        break_minutes: status === 'W' ? breakMinutes : 0,
        total_hours: status === 'W' ? totalHours : 0,
      };
      if (persistOnSave) {
        await api.put(`/rosters/cell/${employee.id}/${date}`, {
          status: payload.status,
          shift_id: payload.shift_id,
          shift_start: payload.shift_start,
          shift_end: payload.shift_end,
          mandatory_start: payload.mandatory_start,
          mandatory_end: payload.mandatory_end,
          break_minutes: payload.break_minutes,
        });
        toast?.success('Shift saved');
        onSaved?.();
      } else {
        onSaved?.(payload);
        toast?.success('Shift updated — click Save to store roster');
      }
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
          {locked && (
            <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-200">
              This cell is locked ({cell?.status === 'LEAVE' ? 'approved leave' : 'public holiday'}).
            </p>
          )}
          <Toggle label="Working day" checked={working} onChange={setWorking} disabled={locked} />

          {working && !locked && (
            <>
              <Select label="Shift" value={shiftId} onChange={(e) => onShiftChange(e.target.value)}>
                <option value="">Select shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.shift_name}</option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Start (15 min)" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)}>
                  {TIME_SLOTS.map((t) => (
                    <option key={`s-${t}`} value={t}>{t}</option>
                  ))}
                </Select>
                <Select label="End (15 min)" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)}>
                  {TIME_SLOTS.map((t) => (
                    <option key={`e-${t}`} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <Select label="Break" value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))}>
                {BREAK_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </Select>
              <p className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-mono text-[var(--text-primary)]">
                {shiftStart} – {shiftEnd} | {BREAK_OPTIONS.find((b) => b.value === breakMinutes)?.label || 'None'} | {totalHours}h
              </p>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Mandatory Window</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {mandStart}</span>
                  <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {mandEnd}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving || locked}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
