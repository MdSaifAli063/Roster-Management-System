const express = require('express');
const { query } = require('../db');
const { authenticate, requireStaff } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const { compareRosterAttendance } = require('../services/attendanceMatcher');
const { notifyAttendanceMismatch } = require('../services/email');
const {
  notifyAttendanceMarkRealtime,
  notifyAttendanceMismatchRealtime,
} = require('../services/inAppNotifications');
const { resolveEmployeeForUser } = require('../services/employeeLink');

function pad(n) {
  return String(n).padStart(2, '0');
}

function dateTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function parseISODate(str) {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(`${str}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function weekRangeFrom(anchor = new Date()) {
  const day = anchor.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: toDateStr(monday), to: toDateStr(sunday) };
}

function resolveRange(query) {
  const fromQ = parseISODate(query.from);
  const toQ = parseISODate(query.to);
  if (fromQ && toQ && fromQ <= toQ) {
    return {
      from: query.from,
      to: query.to,
      dayCount: Math.round((toQ - fromQ) / 86400000) + 1,
    };
  }
  const w = weekRangeFrom();
  return { ...w, dayCount: 7 };
}

function formatTime12(t) {
  if (!t) return '—';
  const s = String(t).slice(0, 5);
  const [h, m] = s.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function minutesBetween(inT, outT) {
  if (!inT || !outT) return 0;
  const [ih, im] = String(inT).slice(0, 5).split(':').map(Number);
  const [oh, om] = String(outT).slice(0, 5).split(':').map(Number);
  let mins = oh * 60 + om - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, '0')}:00`;
}

function trendPct(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const router = express.Router();
router.use(authenticate);

async function buildMismatchRows(startDate, endDate, plantId) {
  const conditions = ['r.roster_date >= $1', 'r.roster_date <= $2'];
  const params = [startDate, endDate];
  let i = 3;
  if (plantId) {
    conditions.push(`e.plant_id = $${i++}`);
    params.push(Number(plantId));
  }

  const { rows } = await query(
    `SELECT r.*, e.emp_code, e.emp_name, e.email AS emp_email,
      a.punch_in, a.punch_out, a.status AS attendance_status, a.id AS attendance_id
     FROM rosters r
     JOIN employees e ON r.emp_id = e.id
     LEFT JOIN attendance_records a ON a.emp_id = r.emp_id AND a.attendance_date = r.roster_date
     WHERE ${conditions.join(' AND ')}
     ORDER BY r.roster_date, e.emp_code`,
    params
  );

  const mismatches = [];
  const rosterMap = {};

  rows.forEach((row) => {
    const dateKey = String(row.roster_date).slice(0, 10);
    const key = `${row.emp_id}-${dateKey}`;
    const roster = {
      status: row.status,
      shift_start: row.shift_start,
      shift_end: row.shift_end,
      mandatory_start: row.mandatory_start,
      mandatory_end: row.mandatory_end,
    };
    const attendance = row.attendance_id
      ? { punch_in: row.punch_in, punch_out: row.punch_out, status: row.attendance_status }
      : null;

    const result = compareRosterAttendance(roster, attendance);
    rosterMap[key] = {
      ...row,
      roster_date: dateKey,
      ...result,
    };
    if (result.mismatch) {
      mismatches.push({
        emp_id: row.emp_id,
        emp_code: row.emp_code,
        emp_name: row.emp_name,
        roster_date: dateKey,
        planned_status: row.status,
        attendance_status: row.attendance_status,
        punch_in: row.punch_in,
        punch_out: row.punch_out,
        mismatch_type: result.mismatch_type,
        message: result.message,
      });
    }
  });

  const { rows: orphanAttendance } = await query(
    `SELECT a.*, e.emp_code, e.emp_name
     FROM attendance_records a
     JOIN employees e ON a.emp_id = e.id
     LEFT JOIN rosters r ON r.emp_id = a.emp_id AND r.roster_date = a.attendance_date
     WHERE a.attendance_date >= $1 AND a.attendance_date <= $2 AND r.id IS NULL
     ${plantId ? 'AND e.plant_id = $3' : ''}`,
    plantId ? [startDate, endDate, Number(plantId)] : [startDate, endDate]
  );

  orphanAttendance.forEach((a) => {
    const dateKey = String(a.attendance_date).slice(0, 10);
    const key = `${a.emp_id}-${dateKey}`;
    const result = compareRosterAttendance(null, a);
    rosterMap[key] = { emp_id: a.emp_id, emp_code: a.emp_code, emp_name: a.emp_name, roster_date: dateKey, status: null, ...result };
    mismatches.push({
      emp_id: a.emp_id,
      emp_code: a.emp_code,
      emp_name: a.emp_name,
      roster_date: dateKey,
      planned_status: null,
      attendance_status: a.status,
      punch_in: a.punch_in,
      punch_out: a.punch_out,
      mismatch_type: result.mismatch_type,
      message: result.message,
    });
  });

  return { mismatches, rosterMap };
}

router.get('/employer', requireStaff, async (req, res) => {
  try {
    const { from, to, dayCount } = resolveRange(req.query);
    const todayStr = dateTodayStr();
    const department = req.query.department?.trim() || '';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const sort = req.query.sort === 'name' ? 'name' : 'date';

    const todayRosterParams = [todayStr];
    let todayDeptSql = '';
    if (department && department !== 'all') {
      todayDeptSql = ` AND COALESCE(e.business_unit, 'General') = $2`;
      todayRosterParams.push(department);
    }

    const todayRosterRes = await query(
      `SELECT r.emp_id, r.shift_start, r.mandatory_start,
              a.punch_in, a.status AS att_status
       FROM rosters r
       JOIN employees e ON e.id = r.emp_id
       LEFT JOIN attendance_records a ON a.emp_id = r.emp_id AND a.attendance_date = r.roster_date
       WHERE r.roster_date = $1 AND r.status = 'W'${todayDeptSql}`,
      todayRosterParams
    );

    let onTime = 0;
    let late = 0;
    let notAttend = 0;
    todayRosterRes.rows.forEach((r) => {
      if (!r.punch_in) {
        notAttend += 1;
        return;
      }
      if (String(r.att_status).toUpperCase() === 'LATE') late += 1;
      else onTime += 1;
    });
    const rosterToday = todayRosterRes.rows.length;
    const attendedToday = onTime + late;
    const attendanceRate = rosterToday > 0 ? Math.round((attendedToday / rosterToday) * 1000) / 10 : 0;
    const onTimePct = rosterToday > 0 ? Math.round((onTime / rosterToday) * 1000) / 10 : 0;
    const latePct = rosterToday > 0 ? Math.round((late / rosterToday) * 1000) / 10 : 0;
    const notAttendPct = rosterToday > 0 ? Math.round((notAttend / rosterToday) * 1000) / 10 : 0;

    const { rows: empTotalRows } = await query(
      `SELECT COUNT(*)::int AS c FROM employees WHERE COALESCE(status, 'ACTIVE') <> 'INACTIVE'`
    );
    const totalEmployees = empTotalRows[0]?.c || 0;

    const rangeStart = parseISODate(from);
    const weeklyChart = [];
    for (let i = 0; i < Math.min(dayCount, 7); i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const { rows: dayRows } = await query(
        `SELECT r.emp_id, a.punch_in, a.status AS att_status
         FROM rosters r
         LEFT JOIN attendance_records a ON a.emp_id = r.emp_id AND a.attendance_date = r.roster_date
         WHERE r.roster_date = $1 AND r.status = 'W'`,
        [key]
      );
      let dOn = 0;
      let dLate = 0;
      let dAbs = 0;
      dayRows.forEach((r) => {
        if (!r.punch_in) dAbs += 1;
        else if (String(r.att_status).toUpperCase() === 'LATE') dLate += 1;
        else dOn += 1;
      });
      weeklyChart.push({ day: labels[d.getDay()], date: key, onTime: dOn, late: dLate, absent: dAbs });
    }

    const prevFrom = new Date(rangeStart);
    prevFrom.setDate(prevFrom.getDate() - dayCount);
    const prevTo = new Date(rangeStart);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFromStr = `${prevFrom.getFullYear()}-${pad(prevFrom.getMonth() + 1)}-${pad(prevFrom.getDate())}`;
    const prevToStr = `${prevTo.getFullYear()}-${pad(prevTo.getMonth() + 1)}-${pad(prevTo.getDate())}`;

    const { rows: rangeAtt } = await query(
      `SELECT a.punch_in, a.punch_out FROM attendance_records a
       JOIN employees e ON e.id = a.emp_id
       WHERE a.attendance_date >= $1 AND a.attendance_date <= $2 AND a.punch_in IS NOT NULL`,
      [from, to]
    );
  let totalLogMins = 0;
    rangeAtt.forEach((a) => {
      totalLogMins += minutesBetween(a.punch_in, a.punch_out);
    });

    const { rows: prevAtt } = await query(
      `SELECT COUNT(DISTINCT a.emp_id)::int AS c FROM attendance_records a
       WHERE a.attendance_date >= $1 AND a.attendance_date <= $2 AND a.punch_in IS NOT NULL`,
      [prevFromStr, prevToStr]
    );
    const { rows: currAtt } = await query(
      `SELECT COUNT(DISTINCT a.emp_id)::int AS c FROM attendance_records a
       WHERE a.attendance_date >= $1 AND a.attendance_date <= $2 AND a.punch_in IS NOT NULL`,
      [from, to]
    );
    const attendTrend = trendPct(currAtt[0]?.c || 0, prevAtt[0]?.c || 0);

    const expectedMins = rosterToday * 8 * 60;
    const { rows: deptRows } = await query(
      `SELECT COALESCE(e.business_unit, 'General') AS name,
              COUNT(DISTINCT e.id)::int AS employees,
              COUNT(DISTINCT CASE WHEN a.punch_in IS NOT NULL THEN e.id END)::int AS attended
       FROM employees e
       LEFT JOIN rosters r ON r.emp_id = e.id AND r.roster_date = $1 AND r.status = 'W'
       LEFT JOIN attendance_records a ON a.emp_id = e.id AND a.attendance_date = $1
       WHERE COALESCE(e.status, 'ACTIVE') <> 'INACTIVE'
       GROUP BY COALESCE(e.business_unit, 'General')
       HAVING COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN e.id END) > 0
       ORDER BY name
       LIMIT 8`,
      [todayStr]
    );

    const departments = deptRows.map((d) => {
      const working = d.employees || 1;
      const perf = Math.round((d.attended / working) * 1000) / 10;
      return {
        name: d.name,
        performancePct: perf,
        employeePerfPct: perf,
        attended: d.attended,
        working,
      };
    });

    const listParams = [from, to];
    let listWhere = `a.attendance_date >= $1 AND a.attendance_date <= $2`;
    if (department && department !== 'all') {
      listParams.push(department);
      listWhere += ` AND COALESCE(e.business_unit, 'General') = $3`;
    }

    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS c FROM attendance_records a
       JOIN employees e ON e.id = a.emp_id
       WHERE ${listWhere}`,
      listParams
    );
    const totalRows = countRows[0]?.c || 0;

    const orderBy =
      sort === 'name'
        ? 'e.emp_name ASC, a.attendance_date DESC'
        : 'a.attendance_date DESC, a.punch_in DESC NULLS LAST';

    listParams.push(limit, offset);
    const { rows: listRows } = await query(
      `SELECT a.id, a.attendance_date, a.punch_in, a.punch_out, a.status,
              e.id AS emp_id, e.emp_code, e.emp_name,
              COALESCE(e.business_unit, 'General') AS department
       FROM attendance_records a
       JOIN employees e ON e.id = a.emp_id
       WHERE ${listWhere}
       ORDER BY ${orderBy}
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    const rows = listRows.map((r) => {
      const mins = minutesBetween(r.punch_in, r.punch_out);
      const present = !!r.punch_in;
      return {
        id: r.id,
        empId: r.emp_id,
        empCode: r.emp_code,
        empName: r.emp_name,
        department: r.department,
        date: String(r.attendance_date).slice(0, 10),
        checkIn: formatTime12(r.punch_in),
        checkOut: formatTime12(r.punch_out),
        logHours: present ? formatDuration(mins) : '—',
        status: present ? 'Present' : 'Absent',
      };
    });

    res.json({
      range: { from, to, today: todayStr },
      stats: {
        attendanceRate,
        onTimePct,
        latePct,
        notAttendPct,
        attendedToday,
        onRosterToday: rosterToday,
        totalEmployees,
        totalLogMinutes: totalLogMins,
        totalLogFormatted: formatDuration(totalLogMins),
        expectedLogFormatted: formatDuration(expectedMins),
        attendTrend: { value: Math.abs(attendTrend), positive: attendTrend >= 0 },
      },
      weeklyChart,
      departments,
      rows,
      pagination: {
        page,
        limit,
        total: totalRows,
        totalPages: Math.max(1, Math.ceil(totalRows / limit)),
      },
    });
  } catch (err) {
    console.error('attendance/employer', err);
    res.status(500).json({ error: 'Failed to load attendance overview' });
  }
});

router.get('/mismatches', async (req, res) => {
  try {
    const { start_date, end_date, plant_id } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date required' });
    }
    const { mismatches, rosterMap } = await buildMismatchRows(start_date, end_date, plant_id);
    res.json({
      count: mismatches.length,
      mismatches,
      rosterMap,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute mismatches' });
  }
});

router.get('/my', async (req, res) => {
  try {
    if (req.user.role !== ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Employees only' });
    }
    const employee = await resolveEmployeeForUser(req.user);
    if (!employee) {
      return res.status(400).json({ error: 'No employee profile linked' });
    }

    const today = dateTodayStr();
    const { rows: todayAtt } = await query(
      'SELECT * FROM attendance_records WHERE emp_id = $1 AND attendance_date = $2',
      [employee.id, today]
    );
    const { rows: todayRoster } = await query(
      `SELECT r.*, s.shift_name FROM rosters r
       LEFT JOIN shifts s ON r.shift_id = s.id
       WHERE r.emp_id = $1 AND r.roster_date = $2`,
      [employee.id, today]
    );

    const start = req.query.start_date;
    const end = req.query.end_date;
    let history = [];
    if (start && end) {
      const { rows } = await query(
        `SELECT a.*, r.status AS roster_status, r.shift_start, r.shift_end
         FROM attendance_records a
         LEFT JOIN rosters r ON r.emp_id = a.emp_id AND r.roster_date = a.attendance_date
         WHERE a.emp_id = $1 AND a.attendance_date >= $2 AND a.attendance_date <= $3
         ORDER BY a.attendance_date DESC`,
        [employee.id, start, end]
      );
      history = rows;
    }

    res.json({
      employee: {
        id: employee.id,
        emp_code: employee.emp_code,
        emp_name: employee.emp_name,
      },
      today,
      todayAttendance: todayAtt[0] || null,
      todayRoster: todayRoster[0] || null,
      history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load attendance' });
  }
});

router.post('/mark-in', async (req, res) => {
  try {
    if (req.user.role !== ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Employees only' });
    }
    const employee = await resolveEmployeeForUser(req.user);
    if (!employee) return res.status(400).json({ error: 'No employee profile found' });

    const today = dateTodayStr();
    const now = new Date();
    const punchIn = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const { rows } = await query(
      `INSERT INTO attendance_records (emp_id, attendance_date, punch_in, status, source)
       VALUES ($1, $2, $3, 'PRESENT', 'MARK_IN')
       ON CONFLICT (emp_id, attendance_date) DO UPDATE SET
         punch_in = COALESCE(attendance_records.punch_in, EXCLUDED.punch_in),
         status = 'PRESENT', source = 'MARK_IN'
       RETURNING *`,
      [employee.id, today, punchIn]
    );
    await notifyAttendanceMarkRealtime({
      employee,
      action: 'in',
      time: punchIn.slice(0, 5),
    });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mark in failed' });
  }
});

router.post('/mark-out', async (req, res) => {
  try {
    if (req.user.role !== ROLES.EMPLOYEE) {
      return res.status(403).json({ error: 'Employees only' });
    }
    const employee = await resolveEmployeeForUser(req.user);
    if (!employee) return res.status(400).json({ error: 'No employee profile found' });

    const today = dateTodayStr();
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
      [employee.id, today, punchOut]
    );
    await notifyAttendanceMarkRealtime({
      employee,
      action: 'out',
      time: punchOut.slice(0, 5),
    });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mark out failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, emp_id } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let i = 1;
    if (req.user.role === ROLES.EMPLOYEE) {
      const employee = await resolveEmployeeForUser(req.user);
      if (!employee) return res.json([]);
      conditions.push(`a.emp_id = $${i++}`);
      params.push(employee.id);
    }
    if (start_date) { conditions.push(`a.attendance_date >= $${i++}`); params.push(start_date); }
    if (end_date) { conditions.push(`a.attendance_date <= $${i++}`); params.push(end_date); }
    if (emp_id && req.user.role !== ROLES.EMPLOYEE) { conditions.push(`a.emp_id = $${i++}`); params.push(Number(emp_id)); }

    const { rows } = await query(
      `SELECT a.*, e.emp_code, e.emp_name FROM attendance_records a
       JOIN employees e ON a.emp_id = e.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.attendance_date DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.post('/', requireStaff, async (req, res) => {
  try {
    const { emp_id, attendance_date, punch_in, punch_out, status, notes } = req.body;
    const { rows } = await query(
      `INSERT INTO attendance_records (emp_id, attendance_date, punch_in, punch_out, status, notes, source)
       VALUES ($1,$2,$3,$4,$5,$6,'MANUAL')
       ON CONFLICT (emp_id, attendance_date) DO UPDATE SET
         punch_in = EXCLUDED.punch_in, punch_out = EXCLUDED.punch_out,
         status = EXCLUDED.status, notes = EXCLUDED.notes
       RETURNING *`,
      [emp_id, attendance_date, punch_in, punch_out, status || 'PRESENT', notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

router.post('/notify-mismatches', requireStaff, async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    const { mismatches } = await buildMismatchRows(start_date, end_date);
    const byDate = {};
    mismatches.forEach((m) => {
      if (!byDate[m.roster_date]) byDate[m.roster_date] = [];
      byDate[m.roster_date].push(m);
    });
    const results = [];
    for (const [date, list] of Object.entries(byDate)) {
      await Promise.all([
        notifyAttendanceMismatch({ mismatches: list, date }),
        notifyAttendanceMismatchRealtime({ mismatches: list, date }),
      ]);
      results.push({ date });
    }
    res.json({ notified: results.length, mismatches: mismatches.length });
  } catch (err) {
    res.status(500).json({ error: 'Notification failed' });
  }
});

module.exports = router;