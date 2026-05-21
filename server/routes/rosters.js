const express = require('express');
const { query } = require('../db');
const { authenticate, requireStaff, requireEmployer } = require('../middleware/auth');
const { computeTotalHours } = require('../utils/rosterTime');
const { sendRosterEmails } = require('../services/rosterPublish');
const { ROLES } = require('../constants/roles');
const { resolveEmployeeForUser } = require('../services/employeeLink');

const router = express.Router();
router.use(authenticate);

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function eachDate(start, end) {
  const dates = [];
  const d = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (d <= last) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

async function isHoliday(date, plantId) {
  const { rows } = await query(
    `SELECT 1 FROM holidays
     WHERE holiday_date = $1 AND (is_national = true OR plant_id = $2 OR plant_id IS NULL)
     LIMIT 1`,
    [date, plantId]
  );
  return rows.length > 0;
}

async function getPattern(patternId) {
  const { rows } = await query(
    `SELECT sp.*, s.shift_start, s.shift_end, s.mandatory_start, s.mandatory_end, s.id AS shift_id
     FROM shift_patterns sp
     JOIN shifts s ON sp.shift_id = s.id
     WHERE sp.id = $1`,
    [patternId]
  );
  return rows[0];
}

router.get('/', async (req, res) => {
  try {
    const { emp_id, emp_ids, start_date, end_date, plant_id } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let i = 1;

    if (emp_id) {
      conditions.push(`r.emp_id = $${i++}`);
      params.push(Number(emp_id));
    }
    if (emp_ids) {
      const ids = emp_ids.split(',').map(Number);
      conditions.push(`r.emp_id = ANY($${i++})`);
      params.push(ids);
    }
    if (start_date) {
      conditions.push(`r.roster_date >= $${i++}`);
      params.push(start_date);
    }
    if (end_date) {
      conditions.push(`r.roster_date <= $${i++}`);
      params.push(end_date);
    }
    if (plant_id) {
      conditions.push(`e.plant_id = $${i++}`);
      params.push(Number(plant_id));
    }
    if (req.user.role === ROLES.EMPLOYEE) {
      const employee = await resolveEmployeeForUser(req.user, { createIfMissing: false });
      if (!employee) return res.json([]);
      conditions.push(`r.emp_id = $${i++}`);
      params.push(employee.id);
    }

    const { rows } = await query(
      `SELECT r.*, e.emp_code, e.emp_name, s.shift_name
       FROM rosters r
       JOIN employees e ON r.emp_id = e.id
       LEFT JOIN shifts s ON r.shift_id = s.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.emp_code, r.roster_date`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rosters' });
  }
});

router.get('/view', async (req, res) => {
  req.url = '/';
  return router.handle(req, res);
});

router.post('/generate', requireStaff, async (req, res) => {
  try {
    const { emp_ids, start_date, end_date, shift_pattern_id } = req.body;
    if (!emp_ids?.length || !start_date || !end_date || !shift_pattern_id) {
      return res.status(400).json({ error: 'emp_ids, start_date, end_date, shift_pattern_id required' });
    }

    const pattern = await getPattern(shift_pattern_id);
    if (!pattern) return res.status(404).json({ error: 'Shift pattern not found' });

    const dates = eachDate(start_date, end_date);
    let count = 0;

    for (const empId of emp_ids) {
      const { rows: empRows } = await query('SELECT plant_id FROM employees WHERE id = $1', [empId]);
      const plantId = empRows[0]?.plant_id;

      for (const date of dates) {
        const dow = new Date(date + 'T12:00:00').getDay();
        const dayKey = DAY_KEYS[dow];
        let status, shiftId, shiftStart, shiftEnd, mandStart, mandEnd;

        if (await isHoliday(date, plantId)) {
          status = 'H';
          shiftId = null;
          shiftStart = shiftEnd = mandStart = mandEnd = null;
        } else if (!pattern[dayKey]) {
          status = 'WO';
          shiftId = null;
          shiftStart = shiftEnd = mandStart = mandEnd = null;
        } else {
          status = 'W';
          shiftId = pattern.shift_id;
          shiftStart = pattern.shift_start;
          shiftEnd = pattern.shift_end;
          mandStart = pattern.mandatory_start;
          mandEnd = pattern.mandatory_end;
        }

        const breakMinutes = 0;
        const totalHours =
          status === 'W' && shiftStart && shiftEnd
            ? computeTotalHours(shiftStart, shiftEnd, breakMinutes)
            : 0;

        await query(
          `INSERT INTO rosters (emp_id, roster_date, status, shift_id, shift_start, shift_end, mandatory_start, mandatory_end, break_minutes, total_hours, assigned_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (emp_id, roster_date) DO UPDATE SET
             status = EXCLUDED.status,
             shift_id = EXCLUDED.shift_id,
             shift_start = EXCLUDED.shift_start,
             shift_end = EXCLUDED.shift_end,
             mandatory_start = EXCLUDED.mandatory_start,
             mandatory_end = EXCLUDED.mandatory_end,
             break_minutes = EXCLUDED.break_minutes,
             total_hours = EXCLUDED.total_hours,
             is_manual_override = false,
             assigned_by = EXCLUDED.assigned_by,
             assigned_at = NOW()`,
          [empId, date, status, shiftId, shiftStart, shiftEnd, mandStart, mandEnd, breakMinutes, totalHours, req.user.id]
        );
        count++;
      }
    }

    res.json({ message: 'Roster generated', entries: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generation failed' });
  }
});

router.post('/bulk', requireStaff, async (req, res) => {
  try {
    const { entries } = req.body;
    for (const e of entries) {
      const breakMinutes = Number(e.break_minutes) || 0;
      const totalHours =
        e.status === 'W' && e.shift_start && e.shift_end
          ? computeTotalHours(e.shift_start, e.shift_end, breakMinutes)
          : 0;
      await query(
        `INSERT INTO rosters (emp_id, roster_date, status, shift_id, shift_start, shift_end, mandatory_start, mandatory_end, break_minutes, total_hours, is_manual_override, assigned_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (emp_id, roster_date) DO UPDATE SET
           status=EXCLUDED.status, shift_id=EXCLUDED.shift_id, shift_start=EXCLUDED.shift_start,
           shift_end=EXCLUDED.shift_end, mandatory_start=EXCLUDED.mandatory_start,
           mandatory_end=EXCLUDED.mandatory_end, break_minutes=EXCLUDED.break_minutes,
           total_hours=EXCLUDED.total_hours, is_manual_override=EXCLUDED.is_manual_override`,
        [e.emp_id, e.roster_date, e.status, e.shift_id, e.shift_start, e.shift_end, e.mandatory_start, e.mandatory_end, breakMinutes, totalHours, e.is_manual_override ?? false, req.user.id]
      );
    }
    res.json({ message: 'Bulk saved', count: entries.length });
  } catch (err) {
    res.status(500).json({ error: 'Bulk save failed' });
  }
});

router.put('/:id', requireStaff, async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE rosters SET status=$1, shift_id=$2, shift_start=$3, shift_end=$4,
       mandatory_start=$5, mandatory_end=$6, is_manual_override=true, assigned_by=$7, assigned_at=NOW()
       WHERE id=$8 RETURNING *`,
      [b.status, b.shift_id, b.shift_start, b.shift_end, b.mandatory_start, b.mandatory_end, req.user.id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

router.put('/cell/:empId/:date', requireStaff, async (req, res) => {
  try {
    const { empId, date } = req.params;
    const b = req.body;
    const breakMinutes = Number(b.break_minutes) || 0;
    const totalHours =
      b.status === 'W' && b.shift_start && b.shift_end
        ? computeTotalHours(b.shift_start, b.shift_end, breakMinutes)
        : 0;
    const { rows } = await query(
      `INSERT INTO rosters (emp_id, roster_date, status, shift_id, shift_start, shift_end, mandatory_start, mandatory_end, break_minutes, total_hours, is_manual_override, assigned_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)
       ON CONFLICT (emp_id, roster_date) DO UPDATE SET
         status=EXCLUDED.status, shift_id=EXCLUDED.shift_id, shift_start=EXCLUDED.shift_start,
         shift_end=EXCLUDED.shift_end, mandatory_start=EXCLUDED.mandatory_start,
         mandatory_end=EXCLUDED.mandatory_end, break_minutes=EXCLUDED.break_minutes,
         total_hours=EXCLUDED.total_hours, is_manual_override=true, assigned_by=EXCLUDED.assigned_by, assigned_at=NOW()
       RETURNING *`,
      [
        empId,
        date,
        b.status,
        b.shift_id,
        b.shift_start,
        b.shift_end,
        b.mandatory_start,
        b.mandatory_end,
        breakMinutes,
        totalHours,
        req.user.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Cell update failed' });
  }
});

async function loadPreviousRosterEntries(plantId) {
  let period = null;
  try {
    const params = [];
    let sql = `
      SELECT start_date, end_date, plant_id FROM roster_periods
      WHERE status IN ('DRAFT', 'PUBLISHED')
    `;
    if (plantId) {
      sql += ' AND plant_id = $1';
      params.push(Number(plantId));
    }
    sql += ' ORDER BY end_date DESC LIMIT 1';
    const { rows: periodRows } = await query(sql, params);
    period = periodRows[0] || null;
  } catch {
    period = null;
  }

  if (!period) {
    const cond = ['1=1'];
    const params = [];
    if (plantId) {
      cond.push('e.plant_id = $1');
      params.push(Number(plantId));
    }
    const { rows: bounds } = await query(
      `SELECT MIN(r.roster_date) AS start_date, MAX(r.roster_date) AS end_date
       FROM rosters r
       JOIN employees e ON r.emp_id = e.id
       WHERE ${cond.join(' AND ')}`,
      params
    );
    if (!bounds[0]?.start_date) {
      return { period: null, entries: [] };
    }
    period = {
      start_date: bounds[0].start_date,
      end_date: bounds[0].end_date,
      plant_id: plantId ? Number(plantId) : null,
      source: 'rosters',
    };
  }

  const pid = period.plant_id;
  const { rows } = await query(
    `SELECT r.* FROM rosters r
     JOIN employees e ON r.emp_id = e.id
     WHERE r.roster_date >= $1 AND r.roster_date <= $2
     ${pid ? 'AND e.plant_id = $3' : ''}
     ORDER BY r.emp_id, r.roster_date`,
    pid ? [period.start_date, period.end_date, pid] : [period.start_date, period.end_date]
  );
  return { period, entries: rows };
}

router.get('/previous-period', requireStaff, async (req, res) => {
  try {
    const { plant_id } = req.query;
    const data = await loadPreviousRosterEntries(plant_id ? Number(plant_id) : null);
    res.json(data);
  } catch (err) {
    console.error('previous-period', err);
    res.json({ period: null, entries: [] });
  }
});

router.get('/period-status', async (req, res) => {
  try {
    const { start_date, end_date, plant_id } = req.query;
    if (!start_date || !end_date) {
      return res.json({ status: 'DRAFT' });
    }
    try {
      const { rows } = await query(
        `SELECT * FROM roster_periods
         WHERE start_date = $1::date AND end_date = $2::date
           AND COALESCE(plant_id, 0) = COALESCE($3::int, 0)
         LIMIT 1`,
        [start_date, end_date, plant_id ? Number(plant_id) : 0]
      );
      return res.json(rows[0] || { status: 'DRAFT' });
    } catch {
      return res.json({ status: 'DRAFT' });
    }
  } catch (err) {
    console.error('period-status', err);
    res.json({ status: 'DRAFT' });
  }
});

router.post('/publish', requireEmployer, async (req, res) => {
  try {
    const { start_date, end_date, plant_id, send_email } = req.body;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date required' });
    }
    const pid = plant_id ? Number(plant_id) : null;
    await query(
      `DELETE FROM roster_periods
       WHERE start_date = $1::date AND end_date = $2::date AND COALESCE(plant_id, 0) = COALESCE($3, 0)`,
      [start_date, end_date, pid || 0]
    );
    const { rows } = await query(
      `INSERT INTO roster_periods (plant_id, start_date, end_date, status, published_at, published_by)
       VALUES ($1,$2::date,$3::date,'PUBLISHED',NOW(),$4) RETURNING *`,
      [pid, start_date, end_date, req.user.id]
    );
    const period = rows[0];
    let emailed = 0;
    if (send_email) {
      emailed = await sendRosterEmails({ start_date, end_date, plant_id });
    }
    res.json({ period, emailed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Publish failed' });
  }
});

module.exports = router;
