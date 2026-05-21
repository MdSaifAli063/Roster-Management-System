export const BREAK_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
];

export function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = String(t).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Display: 6:15a, 12:15p */
export function formatTime12(t) {
  if (!t) return '';
  const [h, m] = String(t).slice(0, 5).split(':').map(Number);
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${am ? 'a' : 'p'}`;
}

export const TIMELINE_START_HOUR = 5;
export const TIMELINE_END_HOUR = 22;
export const TIMELINE_START_MIN = TIMELINE_START_HOUR * 60;
export const TIMELINE_END_MIN = TIMELINE_END_HOUR * 60;
export const TIMELINE_TOTAL_MIN = TIMELINE_END_MIN - TIMELINE_START_MIN;

export function shiftBarPercent(shiftStart, shiftEnd) {
  const start = timeToMinutes(shiftStart);
  const end = timeToMinutes(shiftEnd);
  if (start == null || end == null || end <= start) return null;
  const left = ((Math.max(start, TIMELINE_START_MIN) - TIMELINE_START_MIN) / TIMELINE_TOTAL_MIN) * 100;
  const right = ((Math.min(end, TIMELINE_END_MIN) - TIMELINE_START_MIN) / TIMELINE_TOTAL_MIN) * 100;
  return { left: `${left}%`, width: `${Math.max(0, right - left)}%` };
}

export function snapMinutes(mins, step = 15) {
  return Math.round(mins / step) * step;
}

export function clickMinutesFromRatio(ratio) {
  const raw = TIMELINE_START_MIN + ratio * TIMELINE_TOTAL_MIN;
  return snapMinutes(Math.max(TIMELINE_START_MIN, Math.min(TIMELINE_END_MIN - 15, raw)));
}

export function generateTimeSlots(stepMinutes = 15) {
  const slots = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

export function computeTotalHours(shiftStart, shiftEnd, breakMinutes = 0) {
  const toMin = (t) => {
    if (!t) return null;
    const [h, m] = String(t).slice(0, 5).split(':').map(Number);
    return h * 60 + m;
  };
  const start = toMin(shiftStart);
  const end = toMin(shiftEnd);
  if (start == null || end == null || end <= start) return 0;
  return Math.max(0, Math.round(((end - start - (Number(breakMinutes) || 0)) / 60) * 100) / 100);
}

/** Break segment in cell label: None | 15m | 30m | 1h */
export function formatBreakLabel(minutes) {
  const m = Number(minutes) || 0;
  if (m === 0) return 'None';
  if (m === 60) return '1h';
  return `${m}m`;
}

export function formatCellLabel(cell) {
  if (!cell) return null;
  if (cell.status === 'LEAVE') return 'Leave';
  if (cell.status === 'PH' || cell.status === 'H') return 'PH';
  if (cell.status === 'WO') return 'WO';
  if (cell.shift_start && cell.shift_end) {
    const start = String(cell.shift_start).slice(0, 5);
    const end = String(cell.shift_end).slice(0, 5);
    const br = formatBreakLabel(cell.break_minutes);
    const hrs = cell.total_hours ?? computeTotalHours(start, end, cell.break_minutes);
    return `${start} – ${end} | ${br} | ${hrs}h`;
  }
  return cell.status || '—';
}
