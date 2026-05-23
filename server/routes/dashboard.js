const express = require('express');
const { query } = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const { resolveEmployeeForUser } = require('../services/employeeLink');
const { countActiveEmployeesSql } = require('../utils/employees');

const router = express.Router();
router.use(authenticate);

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function weekRange(anchor = new Date()) {
  const today = new Date(anchor);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toDateStr(monday), to: toDateStr(sunday), todayStr: toDateStr(new Date()), monday };
}

function parseISODate(str) {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(`${str}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function resolveEmployerRange(query) {
  const fromQ = parseISODate(query.from);
  const toQ = parseISODate(query.to);
  if (fromQ && toQ) {
    if (fromQ > toQ) return weekRange();
    const diffDays = Math.round((toQ - fromQ) / (24 * 60 * 60 * 1000)) + 1;
    if (diffDays > 14) return weekRange();
    const monday = new Date(fromQ);
    return {
      from: toDateStr(fromQ),
      to: toDateStr(toQ),
      todayStr: toDateStr(new Date()),
      monday,
      dayCount: diffDays,
    };
  }
  return { ...weekRange(), dayCount: 7 };
}

function dayLabelForDate(d) {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return labels[d.getDay()] || '—';
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDateLabel(iso) {
  const [, m, d] = iso.split('-');
  return `${MONTH_SHORT[Number(m) - 1]} ${Number(d)}`;
}

function formatTime(t) {
  if (!t) return '—';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function hoursBetween(inT, outT) {
  if (!inT || !outT) return '—';
  const [ih, im] = String(inT).slice(0, 5).split(':').map(Number);
  const [oh, om] = String(outT).slice(0, 5).split(':').map(Number);
  let mins = oh * 60 + om - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function trendPct(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

router.get('/employer', requireEmployer, async (req, res) => {
  try {
    const { from, to, todayStr, monday, dayCount } = resolveEmployerRange(req.query);
    const month = todayStr.slice(0, 7);
    const chartDays = dayCount || 7;

    const [
      empRes,
      leaveRes,
      leavePrevRes,
      holidayRes,
      rosterTodayRes,
      rosterWeekRes,
      attWeekRes,
      recentRes,
      mismatchRes,
      upcomingRes,
    ] = await Promise.all([
      query(countActiveEmployeesSql()),
      query(`SELECT COUNT(*)::int AS c FROM leave_requests WHERE status = 'PENDING'`),
      query(
        `SELECT COUNT(*)::int AS c FROM leave_requests
         WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '7 days'`
      ),
      query(
        `SELECT COUNT(*)::int AS c FROM holidays
         WHERE to_char(holiday_date, 'YYYY-MM') = $1`,
        [month]
      ),
      query(
        `SELECT COUNT(DISTINCT emp_id)::int AS c FROM rosters
         WHERE roster_date = $1 AND status = 'W'`,
        [todayStr]
      ),
      query(
        `SELECT roster_date::date AS d, emp_id, status FROM rosters
         WHERE roster_date >= $1 AND roster_date <= $2`,
        [from, to]
      ),
      query(
        `SELECT attendance_date::date AS d, emp_id, punch_in, punch_out, status
         FROM attendance_records WHERE attendance_date >= $1 AND attendance_date <= $2`,
        [from, to]
      ),
      query(
        `SELECT a.id, a.attendance_date, a.punch_in, a.punch_out, a.status,
                e.emp_code, e.emp_name, COALESCE(e.business_unit, p.location, 'General') AS department
         FROM attendance_records a
         JOIN employees e ON e.id = a.emp_id
         LEFT JOIN plants p ON p.id = e.plant_id
         WHERE a.attendance_date >= $1
         ORDER BY a.attendance_date DESC, a.punch_in DESC NULLS LAST
         LIMIT 8`,
        [from]
      ),
      query(
        `SELECT COUNT(*)::int AS c FROM attendance_records a
         LEFT JOIN rosters r ON r.emp_id = a.emp_id AND r.roster_date = a.attendance_date
         WHERE a.attendance_date >= $1 AND a.attendance_date <= $2 AND r.id IS NULL`,
        [from, to]
      ),
      query(
        `SELECT holiday_date, holiday_name, is_national FROM holidays
         WHERE holiday_date >= $1 ORDER BY holiday_date LIMIT 5`,
        [todayStr]
      ),
    ]);

    const totalEmployees = empRes.rows[0]?.c || 0;
    const pendingLeave = leaveRes.rows[0]?.c || 0;
    const pendingLeavePrev = leavePrevRes.rows[0]?.c || 0;
    const holidaysMonth = holidayRes.rows[0]?.c || 0;
    const rosterToday = rosterTodayRes.rows[0]?.c || 0;

    const attTodayRes = await query(
      `SELECT COUNT(DISTINCT emp_id)::int AS c FROM attendance_records
       WHERE attendance_date = $1 AND punch_in IS NOT NULL`,
      [todayStr]
    );
    const attendedToday = attTodayRes.rows[0]?.c || 0;
    const attendanceRate = rosterToday > 0 ? Math.round((attendedToday / rosterToday) * 1000) / 10 : 0;

    const rosterByDay = {};
    rosterWeekRes.rows.forEach((r) => {
      const d = String(r.d).slice(0, 10);
      if (!rosterByDay[d]) rosterByDay[d] = { working: new Set(), emps: new Set() };
      if (r.status === 'W') rosterByDay[d].working.add(r.emp_id);
      rosterByDay[d].emps.add(r.emp_id);
    });

    const attByDay = {};
    attWeekRes.rows.forEach((a) => {
      const d = String(a.d).slice(0, 10);
      if (!attByDay[d]) attByDay[d] = { present: new Set(), late: new Set() };
      if (a.punch_in) {
        attByDay[d].present.add(a.emp_id);
        if (String(a.status).toUpperCase() === 'LATE') attByDay[d].late.add(a.emp_id);
      }
    });

    const weeklyChart = [];
    let weekOnTime = 0;
    let weekLate = 0;
    let weekAbsent = 0;
    let weekTotal = 0;

    const rangeStart = parseISODate(from);
    for (let i = 0; i < chartDays; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      const key = toDateStr(d);
      const working = rosterByDay[key]?.working || new Set();
      const present = attByDay[key]?.present || new Set();
      const late = attByDay[key]?.late || new Set();
      let onTime = 0;
      let lateCount = 0;
      let absent = 0;
      working.forEach((empId) => {
        if (!present.has(empId)) absent += 1;
        else if (late.has(empId)) lateCount += 1;
        else onTime += 1;
      });
      weekOnTime += onTime;
      weekLate += lateCount;
      weekAbsent += absent;
      weekTotal += working.size;
      weeklyChart.push({
        day: chartDays <= 7 ? dayLabelForDate(d) : shortDateLabel(key),
        date: key,
        onTime,
        late: lateCount,
        absent,
      });
    }

    const weekDenom = weekTotal || 1;
    const weekAttendancePct = Math.round((weekOnTime / weekDenom) * 1000) / 10;

    const recentActivity = recentRes.rows.map((r) => ({
      id: r.id,
      empCode: r.emp_code,
      empName: r.emp_name,
      department: r.department,
      date: String(r.attendance_date).slice(0, 10),
      checkIn: formatTime(r.punch_in),
      checkOut: formatTime(r.punch_out),
      logHours: hoursBetween(r.punch_in, r.punch_out),
      status: r.punch_in ? 'Present' : 'Absent',
    }));

    const mismatchCount = mismatchRes.rows[0]?.c || 0;

    const tasks = [
      {
        title: 'Approve leave requests',
        count: pendingLeave,
        urgent: pendingLeave > 0,
        to: '/leave',
        action: 'Review',
      },
      {
        title: 'Review attendance mismatches',
        count: mismatchCount,
        urgent: mismatchCount > 0,
        to: '/actual-roster',
        action: 'View',
      },
      {
        title: 'Update holiday calendar',
        count: holidaysMonth,
        urgent: false,
        to: '/holidays',
        action: 'Open',
      },
    ];

    const schedule = [];
    for (let i = 0; i < chartDays; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      schedule.push({ date: toDateStr(d), label: dayLabelForDate(d) });
    }

    const events = upcomingRes.rows.map((h) => ({
      date: String(h.holiday_date).slice(0, 10),
      title: h.holiday_name,
      national: h.is_national,
    }));

    res.json({
      stats: {
        totalEmployees,
        pendingLeave,
        attendanceRate,
        holidaysMonth,
        onRosterToday: rosterToday,
        attendedToday,
        trends: {
          employees: { value: 2.8, positive: true },
          leave: {
            value: Math.abs(trendPct(pendingLeave, pendingLeavePrev || pendingLeave)),
            positive: pendingLeave <= pendingLeavePrev,
          },
          attendance: { value: 0.8, positive: true },
        },
      },
      weeklyChart,
      weekAttendancePct,
      weekOnTime,
      weekTotal,
      recentActivity,
      tasks,
      schedule,
      events,
      range: { from, to, today: todayStr },
    });
  } catch (err) {
    console.error('dashboard/employer', err);
    res.status(500).json({
      error: 'Failed to load employer dashboard',
      detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
});

router.get('/employee', async (req, res) => {
  try {
    if (req.user.role !== ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Employee dashboard only' });
    }

    const employee = await resolveEmployeeForUser(req.user);
    if (!employee) {
      return res.json({
        linked: false,
        message: 'Could not link your account to an employee profile. Contact HR for assistance.',
        user: { name: req.user.name, email: req.user.email },
      });
    }

    const { from, to, todayStr } = weekRange();

    const { rows: weekRoster } = await query(
      `SELECT r.*, s.shift_name
       FROM rosters r
       LEFT JOIN shifts s ON r.shift_id = s.id
       WHERE r.emp_id = $1 AND r.roster_date >= $2 AND r.roster_date <= $3
       ORDER BY r.roster_date`,
      [employee.id, from, to]
    );

    const todayRoster = weekRoster.find(
      (r) => String(r.roster_date).slice(0, 10) === todayStr
    );

    const { rows: leaveRows } = await query(
      `SELECT * FROM leave_requests WHERE emp_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [employee.id]
    );

    const { rows: attendanceRows } = await query(
      `SELECT * FROM attendance_records
       WHERE emp_id = $1 AND attendance_date >= $2 AND attendance_date <= $3`,
      [employee.id, from, to]
    );

    const workingDays = weekRoster.filter((r) => r.status === 'W').length;
    const weeklyOffs = weekRoster.filter((r) => r.status === 'WO').length;
    const holidays = weekRoster.filter((r) => r.status === 'H').length;
    const pendingLeave = leaveRows.filter((l) => l.status === 'PENDING').length;

    const { rows: upcomingHolidays } = await query(
      `SELECT holiday_date, holiday_name FROM holidays
       WHERE holiday_date >= $1
         AND (is_national = true OR plant_id = $2 OR plant_id IS NULL)
       ORDER BY holiday_date LIMIT 3`,
      [todayStr, employee.plant_id]
    );

    const { rows: todayAtt } = await query(
      `SELECT * FROM attendance_records WHERE emp_id = $1 AND attendance_date = $2`,
      [employee.id, todayStr]
    );
    const todayAttendance = todayAtt[0] || null;

    res.json({
      linked: true,
      employee: {
        id: employee.id,
        emp_code: employee.emp_code,
        emp_name: employee.emp_name,
        plant_name: employee.plant_name,
        plant_location: employee.plant_location,
        current_shift_pattern: employee.current_shift_pattern,
      },
      today: todayRoster
        ? {
            date: todayStr,
            status: todayRoster.status,
            shift_name: todayRoster.shift_name,
            shift_start: todayRoster.shift_start,
            shift_end: todayRoster.shift_end,
          }
        : null,
      weekSummary: { workingDays, weeklyOffs, holidays, from, to },
      weekRoster: weekRoster.map((r) => ({
        date: String(r.roster_date).slice(0, 10),
        status: r.status,
        shift_name: r.shift_name,
        shift_start: r.shift_start,
        shift_end: r.shift_end,
      })),
      leaveRequests: leaveRows,
      attendance: attendanceRows,
      upcomingHolidays,
      pendingLeave,
      todayAttendance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load employee dashboard' });
  }
});

router.post('/employee/mark-in', async (req, res) => {
  try {
    if (req.user.role !== ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Employees only' });
    }
    const employee = await resolveEmployeeForUser(req.user);
    if (!employee) return res.status(400).json({ error: 'No employee profile found' });
    const empId = employee.id;

    const { todayStr } = weekRange();
    const now = new Date();
    const punchIn = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const { rows } = await query(
      `INSERT INTO attendance_records (emp_id, attendance_date, punch_in, status, source)
       VALUES ($1, $2, $3, 'PRESENT', 'MARK_IN')
       ON CONFLICT (emp_id, attendance_date) DO UPDATE SET
         punch_in = COALESCE(attendance_records.punch_in, EXCLUDED.punch_in),
         status = 'PRESENT',
         source = 'MARK_IN'
       RETURNING *`,
      [empId, todayStr, punchIn]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mark in failed' });
  }
});

router.post('/employee/mark-out', async (req, res) => {
  try {
    if (req.user.role !== ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Employees only' });
    }
    const employee = await resolveEmployeeForUser(req.user);
    if (!employee) return res.status(400).json({ error: 'No employee profile found' });
    const empId = employee.id;

    const { todayStr } = weekRange();
    const now = new Date();
    const punchOut = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const { rows } = await query(
      `INSERT INTO attendance_records (emp_id, attendance_date, punch_out, status, source)
       VALUES ($1, $2, $3, 'PRESENT', 'MARK_OUT')
       ON CONFLICT (emp_id, attendance_date) DO UPDATE SET
         punch_out = EXCLUDED.punch_out,
         punch_in = COALESCE(attendance_records.punch_in, EXCLUDED.punch_in),
         status = 'PRESENT',
         source = 'MARK_OUT'
       RETURNING *`,
      [empId, todayStr, punchOut]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mark out failed' });
  }
});

module.exports = router;
