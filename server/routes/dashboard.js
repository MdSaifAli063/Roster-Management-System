const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');
const { resolveEmployeeForUser } = require('../services/employeeLink');

const router = express.Router();
router.use(authenticate);

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function weekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toDateStr(monday), to: toDateStr(sunday), todayStr: toDateStr(today) };
}

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
       VALUES ($1, $2, $3, 'PRESENT', 'MARK_IN')
       ON CONFLICT (emp_id, attendance_date) DO UPDATE SET
         punch_out = EXCLUDED.punch_out,
         punch_in = COALESCE(attendance_records.punch_in, EXCLUDED.punch_in),
         status = 'PRESENT'
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
