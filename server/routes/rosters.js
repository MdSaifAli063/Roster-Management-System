const express = require('express');
const { query } = require('../db');
const { authenticate, requireStaff } = require('../middleware/auth');

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

        await query(
          `INSERT INTO rosters (emp_id, roster_date, status, shift_id, shift_start, shift_end, mandatory_start, mandatory_end, assigned_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (emp_id, roster_date) DO UPDATE SET
             status = EXCLUDED.status,
             shift_id = EXCLUDED.shift_id,
             shift_start = EXCLUDED.shift_start,
             shift_end = EXCLUDED.shift_end,
             mandatory_start = EXCLUDED.mandatory_start,
             mandatory_end = EXCLUDED.mandatory_end,
             is_manual_override = false,
             assigned_by = EXCLUDED.assigned_by,
             assigned_at = NOW()`,
          [empId, date, status, shiftId, shiftStart, shiftEnd, mandStart, mandEnd, req.user.id]
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
      await query(
        `INSERT INTO rosters (emp_id, roster_date, status, shift_id, shift_start, shift_end, mandatory_start, mandatory_end, is_manual_override, assigned_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (emp_id, roster_date) DO UPDATE SET
           status=EXCLUDED.status, shift_id=EXCLUDED.shift_id, shift_start=EXCLUDED.shift_start,
           shift_end=EXCLUDED.shift_end, mandatory_start=EXCLUDED.mandatory_start,
           mandatory_end=EXCLUDED.mandatory_end, is_manual_override=EXCLUDED.is_manual_override`,
        [e.emp_id, e.roster_date, e.status, e.shift_id, e.shift_start, e.shift_end, e.mandatory_start, e.mandatory_end, e.is_manual_override ?? false, req.user.id]
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
    const { rows } = await query(
      `INSERT INTO rosters (emp_id, roster_date, status, shift_id, shift_start, shift_end, mandatory_start, mandatory_end, is_manual_override, assigned_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9)
       ON CONFLICT (emp_id, roster_date) DO UPDATE SET
         status=EXCLUDED.status, shift_id=EXCLUDED.shift_id, shift_start=EXCLUDED.shift_start,
         shift_end=EXCLUDED.shift_end, mandatory_start=EXCLUDED.mandatory_start,
         mandatory_end=EXCLUDED.mandatory_end, is_manual_override=true, assigned_by=EXCLUDED.assigned_by, assigned_at=NOW()
       RETURNING *`,
      [empId, date, b.status, b.shift_id, b.shift_start, b.shift_end, b.mandatory_start, b.mandatory_end, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Cell update failed' });
  }
});

module.exports = router;
