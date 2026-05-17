const express = require('express');
const { query } = require('../db');
const { authenticate, requireStaff } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { plant_id, year } = req.query;
    const conditions = [];
    const params = [];
    let i = 1;
    if (plant_id) {
      conditions.push(`(h.plant_id = $${i} OR h.is_national = true)`);
      params.push(Number(plant_id));
      i++;
    }
    if (year) {
      conditions.push(`EXTRACT(YEAR FROM h.holiday_date) = $${i}`);
      params.push(Number(year));
      i++;
    }
    let sql = `
      SELECT h.*, p.plant_name, p.location
      FROM holidays h
      LEFT JOIN plants p ON h.plant_id = p.id
    `;
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY h.holiday_date';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

router.post('/', requireStaff, async (req, res) => {
  try {
    const { holiday_date, holiday_name, plant_id, is_national } = req.body;
    const { rows } = await query(
      `INSERT INTO holidays (holiday_date, holiday_name, plant_id, is_national)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [holiday_date, holiday_name, plant_id || null, is_national ?? false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

router.post('/import', requireStaff, async (req, res) => {
  try {
    const { holidays } = req.body;
    if (!Array.isArray(holidays) || !holidays.length) {
      return res.status(400).json({ error: 'holidays array required' });
    }
    const inserted = [];
    for (const h of holidays) {
      const { rows } = await query(
        `INSERT INTO holidays (holiday_date, holiday_name, plant_id, is_national)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (holiday_date, plant_id) DO UPDATE SET holiday_name = EXCLUDED.holiday_name, is_national = EXCLUDED.is_national
         RETURNING *`,
        [h.holiday_date, h.holiday_name, h.plant_id || null, h.is_national ?? false]
      );
      inserted.push(rows[0]);
    }
    res.status(201).json({ count: inserted.length, holidays: inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed' });
  }
});

router.delete('/:id', requireStaff, async (req, res) => {
  try {
    await query('DELETE FROM holidays WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

module.exports = router;
