const express = require('express');
const XLSX = require('xlsx');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function formatTime(t) {
  if (!t) return '';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

router.get('/roster', async (req, res) => {
  try {
    const { start_date, end_date, emp_ids, plant_id, format } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let i = 1;

    if (start_date) { conditions.push(`r.roster_date >= $${i++}`); params.push(start_date); }
    if (end_date) { conditions.push(`r.roster_date <= $${i++}`); params.push(end_date); }
    if (emp_ids) { conditions.push(`r.emp_id = ANY($${i++})`); params.push(emp_ids.split(',').map(Number)); }
    if (plant_id) { conditions.push(`e.plant_id = $${i++}`); params.push(Number(plant_id)); }

    const { rows } = await query(
      `SELECT e.emp_code, e.emp_name, r.roster_date, r.status,
        r.shift_start, r.shift_end, s.shift_name, p.location
       FROM rosters r
       JOIN employees e ON r.emp_id = e.id
       LEFT JOIN shifts s ON r.shift_id = s.id
       LEFT JOIN plants p ON e.plant_id = p.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.emp_code, r.roster_date`,
      params
    );

    const data = rows.map((r) => ({
      'Emp Code': r.emp_code,
      'Emp Name': r.emp_name,
      Date: r.roster_date,
      Status: r.status,
      Shift: r.shift_name || '',
      Start: formatTime(r.shift_start),
      End: formatTime(r.shift_end),
      Location: r.location || '',
      Display:
        r.status === 'WO' ? 'WO' : r.status === 'H' ? 'H' : `${formatTime(r.shift_start)}–${formatTime(r.shift_end)}`,
    }));

    if (format === 'json') return res.json(data);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Roster');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=roster-report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Report failed' });
  }
});

router.get('/attendance-summary', async (req, res) => {
  try {
    const { start_date, end_date, plant_id } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let i = 1;
    if (start_date) { conditions.push(`r.roster_date >= $${i++}`); params.push(start_date); }
    if (end_date) { conditions.push(`r.roster_date <= $${i++}`); params.push(end_date); }
    if (plant_id) { conditions.push(`e.plant_id = $${i++}`); params.push(Number(plant_id)); }

    const { rows } = await query(
      `SELECT e.emp_code, e.emp_name,
        COUNT(*) FILTER (WHERE r.status = 'W') AS working_days,
        COUNT(*) FILTER (WHERE r.status = 'WO') AS weekly_offs,
        COUNT(*) FILTER (WHERE r.status = 'H') AS holidays
       FROM rosters r
       JOIN employees e ON r.emp_id = e.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY e.id, e.emp_code, e.emp_name
       ORDER BY e.emp_code`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Summary failed' });
  }
});

module.exports = router;
