const { query } = require('../db');
const { syncNationalHolidays, DEFAULT_COUNTRY } = require('./publicHolidays');
const { resolveEmployeeForUser } = require('./employeeLink');
const { ROLES } = require('../constants/roles');
const { toDateKey } = require('../utils/dateKey');

function pad(n) {
  return String(n).padStart(2, '0');
}

function monthBounds(year, month) {
  const y = Number(year);
  const m = Number(month);
  const from = `${y}-${pad(m)}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${pad(m)}-${pad(lastDay)}`;
  return { from, to, year: y, month: m };
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

async function getCalendarForUser(req, { year, month }) {
  const { from, to } = monthBounds(year, month);

  let holidaySync = { synced: 0, error: null };
  try {
    holidaySync = await syncNationalHolidays(Number(year));
  } catch (err) {
    console.warn('Public holiday sync failed:', err.message);
    holidaySync.error = err.message;
  }

  let plantId = req.query.plant_id ? Number(req.query.plant_id) : null;
  let empId = null;

  if (req.user.role === ROLES.EMPLOYEE) {
    const employee = await resolveEmployeeForUser(req.user);
    if (employee) {
      empId = employee.id;
      plantId = employee.plant_id;
    }
  }

  const holidayParams = [from, to];
  let holidaySql = `
    SELECT holiday_date, holiday_name, is_national, plant_id
    FROM holidays
    WHERE holiday_date >= $1 AND holiday_date <= $2
      AND (is_national = true OR plant_id IS NULL`;
  if (plantId) {
    holidaySql += ` OR plant_id = $3`;
    holidayParams.push(plantId);
  }
  holidaySql += ') ORDER BY holiday_date';

  const { rows: holidays } = await query(holidaySql, holidayParams);

  let rosterByDate = {};
  if (empId) {
    const { rows: rosterRows } = await query(
      `SELECT r.roster_date, r.status, r.shift_start, r.shift_end, s.shift_name
       FROM rosters r
       LEFT JOIN shifts s ON r.shift_id = s.id
       WHERE r.emp_id = $1 AND r.roster_date >= $2 AND r.roster_date <= $3`,
      [empId, from, to]
    );
    rosterRows.forEach((r) => {
      const key = toDateKey(r.roster_date);
      rosterByDate[key] = r;
    });
  }

  const days = {};
  const monthEvents = [];
  const today = todayStr();

  const addEvent = (dateKey, event) => {
    if (!days[dateKey]) days[dateKey] = { events: [], isWeekend: false, isToday: dateKey === today };
    days[dateKey].events.push(event);
  };

  holidays.forEach((h) => {
    const key = toDateKey(h.holiday_date);
    if (!key) return;
    const label = h.holiday_name || 'Holiday';
    addEvent(key, {
      type: 'holiday',
      label,
      national: !!h.is_national,
      company: !h.is_national && h.plant_id != null,
    });
    monthEvents.push({ date: key, label, type: 'holiday', national: !!h.is_national });
  });

  Object.entries(rosterByDate).forEach(([key, r]) => {
    const labels = { W: 'Working day', WO: 'Weekly off', H: 'Holiday (roster)' };
    addEvent(key, {
      type: 'roster',
      label: labels[r.status] || r.status,
      status: r.status,
      shift_start: r.shift_start,
      shift_end: r.shift_end,
      shift_name: r.shift_name,
    });
  });

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    if (!days[key]) days[key] = { events: [], isWeekend, isToday: key === today };
    else days[key].isWeekend = isWeekend;
    if (isWeekend && !days[key].events.some((e) => e.type === 'roster')) {
      addEvent(key, { type: 'weekend', label: 'Weekend' });
    }
  }

  monthEvents.sort((a, b) => a.date.localeCompare(b.date));

  const upcoming = monthEvents.filter((e) => e.date >= today).slice(0, 10);

  return {
    year: Number(year),
    month: Number(month),
    from,
    to,
    country: DEFAULT_COUNTRY,
    today,
    days,
    monthEvents,
    upcoming,
    holidaySync,
  };
}

module.exports = { getCalendarForUser, monthBounds };
