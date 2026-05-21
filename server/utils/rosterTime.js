/** 15-minute slot helpers and total hours with break deduction */

const BREAK_OPTIONS = [0, 15, 30, 60];

function timeToMinutes(t) {
  if (!t) return null;
  const s = String(t).slice(0, 5);
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateTimeSlots(stepMinutes = 15) {
  const slots = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

function computeTotalHours(shiftStart, shiftEnd, breakMinutes = 0) {
  const start = timeToMinutes(shiftStart);
  const end = timeToMinutes(shiftEnd);
  if (start == null || end == null || end <= start) return 0;
  const worked = end - start - (Number(breakMinutes) || 0);
  return Math.max(0, Math.round((worked / 60) * 100) / 100);
}

function formatBreakLabel(minutes) {
  const m = Number(minutes) || 0;
  if (m === 0) return 'None';
  if (m === 60) return '1h';
  return `${m}m`;
}

function sqlTimeOrNull(value) {
  if (value == null || value === '') return null;
  return String(value).slice(0, 8);
}

function sqlShiftIdOrNull(value) {
  if (value == null || value === '' || value === 0) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatCellDisplay(shiftStart, shiftEnd, breakMinutes, totalHours) {
  if (!shiftStart || !shiftEnd) return null;
  const start = String(shiftStart).slice(0, 5);
  const end = String(shiftEnd).slice(0, 5);
  const br = formatBreakLabel(breakMinutes);
  const hrs = totalHours != null ? totalHours : computeTotalHours(start, end, breakMinutes);
  return `${start} – ${end} | ${br} | ${hrs}h`;
}

module.exports = {
  BREAK_OPTIONS,
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  computeTotalHours,
  formatBreakLabel,
  formatCellDisplay,
  sqlTimeOrNull,
  sqlShiftIdOrNull,
};
