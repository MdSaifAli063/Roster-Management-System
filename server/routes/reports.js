const express = require('express');
const XLSX = require('xlsx');
const { query } = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');
const { toExcelBuffer, toPdfBuffer } = require('../utils/reportExport');

const router = express.Router();
router.use(authenticate);
router.use(requireEmployer);

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

function periodGroupSql(groupBy) {
  const g = (groupBy || 'month').toLowerCase();
  if (g === 'week') return `DATE_TRUNC('week', r.roster_date)`;
  if (g === 'quarter') return `DATE_TRUNC('quarter', r.roster_date)`;
  if (g === 'half-year' || g === 'halfyear') {
    return `(DATE_TRUNC('year', r.roster_date) + (((EXTRACT(MONTH FROM r.roster_date)::int - 1) / 6) * INTERVAL '6 months'))`;
  }
  if (g === 'year') return `DATE_TRUNC('year', r.roster_date)`;
  return `DATE_TRUNC('month', r.roster_date)`;
}

async function fetchHoursRows(req) {
  const { start_date, end_date, group_by, plant_id } = req.query;
  const trunc = periodGroupSql(group_by);
  const conditions = ['r.status = $1'];
  const params = ['W'];
  let i = 2;
  if (start_date) { conditions.push(`r.roster_date >= $${i++}`); params.push(start_date); }
  if (end_date) { conditions.push(`r.roster_date <= $${i++}`); params.push(end_date); }
  if (plant_id) { conditions.push(`e.plant_id = $${i++}`); params.push(Number(plant_id)); }
  const { rows } = await query(
    `SELECT e.emp_code, e.emp_name, ${trunc} AS period,
      SUM(COALESCE(r.total_hours,
        CASE WHEN r.shift_start IS NOT NULL AND r.shift_end IS NOT NULL
          THEN EXTRACT(EPOCH FROM (r.shift_end - r.shift_start)) / 3600 - COALESCE(r.break_minutes,0)/60.0
          ELSE 0 END, 0)) AS total_hours
     FROM rosters r JOIN employees e ON r.emp_id = e.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY e.emp_code, e.emp_name, period ORDER BY period, e.emp_code`,
    params
  );
  return rows;
}

async function fetchWagesRows(req) {
  const { start_date, end_date, group_by, plant_id } = req.query;
  const trunc = periodGroupSql(group_by);
  const conditions = ['r.status = $1'];
  const params = ['W'];
  let i = 2;
  if (start_date) { conditions.push(`r.roster_date >= $${i++}`); params.push(start_date); }
  if (end_date) { conditions.push(`r.roster_date <= $${i++}`); params.push(end_date); }
  if (plant_id) { conditions.push(`e.plant_id = $${i++}`); params.push(Number(plant_id)); }
  const { rows } = await query(
    `SELECT e.emp_code, e.emp_name, ${trunc} AS period,
      SUM(COALESCE(r.total_hours,
        CASE WHEN r.shift_start IS NOT NULL AND r.shift_end IS NOT NULL
          THEN EXTRACT(EPOCH FROM (r.shift_end - r.shift_start)) / 3600 - COALESCE(r.break_minutes,0)/60.0
          ELSE 0 END, 0)) AS total_hours,
      SUM(COALESCE(r.total_hours,
        CASE WHEN r.shift_start IS NOT NULL AND r.shift_end IS NOT NULL
          THEN EXTRACT(EPOCH FROM (r.shift_end - r.shift_start)) / 3600 - COALESCE(r.break_minutes,0)/60.0
          ELSE 0 END, 0) * COALESCE(e.hourly_rate, 0)) AS total_wages
     FROM rosters r JOIN employees e ON r.emp_id = e.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY e.emp_code, e.emp_name, period ORDER BY period, e.emp_code`,
    params
  );
  return rows;
}

router.get('/hours', async (req, res) => {
  try {
    res.json(await fetchHoursRows(req));
  } catch (err) {
    console.error('reports/hours', err);
    res.json([]);
  }
});

router.get('/wages', async (req, res) => {
  try {
    res.json(await fetchWagesRows(req));
  } catch (err) {
    console.error('reports/wages', err);
    res.json([]);
  }
});

router.get('/combined', async (req, res) => {
  try {
    const hours = await fetchHoursRows(req);
    const wages = await fetchWagesRows(req);
    const wageMap = new Map(wages.map((w) => [`${w.emp_code}-${w.period}`, w.total_wages]));
    const combined = hours.map((h) => ({
      emp_code: h.emp_code,
      emp_name: h.emp_name,
      period: h.period,
      total_hours: h.total_hours,
      total_wages: wageMap.get(`${h.emp_code}-${h.period}`) ?? 0,
    }));
    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: 'Combined report failed' });
  }
});

function sendExport(res, filename, buffer, contentType) {
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-Type', contentType);
  res.send(buffer);
}

router.get('/hours/export', async (req, res) => {
  try {
    const rows = await fetchHoursRows(req);
    const fmt = (req.query.format || 'xlsx').toLowerCase();
    const data = rows.map((r) => ({
      'Emp Code': r.emp_code,
      Employee: r.emp_name,
      Period: r.period,
      Hours: Number(r.total_hours),
    }));
    if (fmt === 'pdf') {
      const buf = await toPdfBuffer('Hours Report', [
        { key: 'Emp Code', label: 'Code' },
        { key: 'Employee', label: 'Name' },
        { key: 'Period', label: 'Period' },
        { key: 'Hours', label: 'Hours' },
      ], data);
      return sendExport(res, 'hours-report.pdf', buf, 'application/pdf');
    }
    return sendExport(res, 'hours-report.xlsx', toExcelBuffer(data, 'Hours'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/wages/export', async (req, res) => {
  try {
    const rows = await fetchWagesRows(req);
    const fmt = (req.query.format || 'xlsx').toLowerCase();
    const data = rows.map((r) => ({
      'Emp Code': r.emp_code,
      Employee: r.emp_name,
      Period: r.period,
      Hours: Number(r.total_hours),
      Wages: Number(r.total_wages || 0).toFixed(2),
    }));
    if (fmt === 'pdf') {
      const buf = await toPdfBuffer('Wages Report', [
        { key: 'Emp Code', label: 'Code' },
        { key: 'Employee', label: 'Name' },
        { key: 'Wages', label: 'Wages' },
      ], data);
      return sendExport(res, 'wages-report.pdf', buf, 'application/pdf');
    }
    return sendExport(res, 'wages-report.xlsx', toExcelBuffer(data, 'Wages'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/roster-pdf', async (req, res) => {
  try {
    const { start_date, end_date, emp_ids, plant_id } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let i = 1;
    if (start_date) { conditions.push(`r.roster_date >= $${i++}`); params.push(start_date); }
    if (end_date) { conditions.push(`r.roster_date <= $${i++}`); params.push(end_date); }
    if (emp_ids) { conditions.push(`r.emp_id = ANY($${i++})`); params.push(emp_ids.split(',').map(Number)); }
    if (plant_id) { conditions.push(`e.plant_id = $${i++}`); params.push(Number(plant_id)); }
    const { rows } = await query(
      `SELECT e.emp_code, e.emp_name, r.roster_date, r.status, r.shift_start, r.shift_end, r.break_minutes, r.total_hours
       FROM rosters r JOIN employees e ON r.emp_id = e.id
       WHERE ${conditions.join(' AND ')} ORDER BY e.emp_code, r.roster_date`,
      params
    );
    const data = rows.map((r) => ({
      Code: r.emp_code,
      Name: r.emp_name,
      Date: String(r.roster_date).slice(0, 10),
      Status: r.status,
      Display: r.status === 'W' ? `${r.shift_start}–${r.shift_end}` : r.status,
      Hours: r.total_hours ?? '',
    }));
    const buf = await toPdfBuffer(`Roster ${start_date || ''} – ${end_date || ''}`, [
      { key: 'Code', label: 'Code' },
      { key: 'Name', label: 'Name' },
      { key: 'Date', label: 'Date' },
      { key: 'Display', label: 'Shift' },
    ], data);
    sendExport(res, 'roster.pdf', buf, 'application/pdf');
  } catch (err) {
    console.error('roster-pdf', err);
    res.status(500).json({ error: 'PDF export failed' });
  }
});

router.get('/comparison', async (req, res) => {
  try {
    const { start_date, end_date, prev_start, prev_end, plant_id } = req.query;
    const run = async (from, to) => {
      const conditions = ['r.status = $1', 'r.roster_date >= $2', 'r.roster_date <= $3'];
      const params = ['W', from, to];
      if (plant_id) { conditions.push('e.plant_id = $4'); params.push(Number(plant_id)); }
      const { rows } = await query(
        `SELECT SUM(COALESCE(r.total_hours,0)) AS hours,
          SUM(COALESCE(r.total_hours,0)*COALESCE(e.hourly_rate,0)) AS wages
         FROM rosters r JOIN employees e ON r.emp_id = e.id
         WHERE ${conditions.join(' AND ')}`,
        params
      );
      return rows[0] || { hours: 0, wages: 0 };
    };
    const current = await run(start_date, end_date);
    const previous = await run(prev_start, prev_end);
    const pct = (a, b) => (b ? Math.round(((a - b) / b) * 1000) / 10 : null);
    res.json({
      current,
      previous,
      hours_change_pct: pct(Number(current.hours), Number(previous.hours)),
      wages_change_pct: pct(Number(current.wages), Number(previous.wages)),
    });
  } catch (err) {
    res.status(500).json({ error: 'Comparison report failed' });
  }
});

module.exports = router;
