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

  // Attendance without roster
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
       VALUES ($1, $2, $3, 'PRESENT', 'MARK_IN')
       ON CONFLICT (emp_id, attendance_date) DO UPDATE SET
         punch_out = EXCLUDED.punch_out,
         punch_in = COALESCE(attendance_records.punch_in, EXCLUDED.punch_in),
         status = 'PRESENT'
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
