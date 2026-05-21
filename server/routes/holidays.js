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
    const { holiday_date, holiday_name, plant_id, is_national, is_paid } = req.body;
    const { rows } = await query(
      `INSERT INTO holidays (holiday_date, holiday_name, plant_id, is_national, is_paid)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [holiday_date, holiday_name, plant_id || null, is_national ?? false, is_paid ?? true]
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

router.get('/fetch-public', requireStaff, async (req, res) => {
  try {
    const { country, year } = req.query;
    if (!country || !year) {
      return res.status(400).json({ error: 'country and year required (ISO country code)' });
    }
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
    const resp = await fetch(url);
    if (!resp.ok) return res.status(502).json({ error: 'Holiday API unavailable' });
    const data = await resp.json();
    res.json(
      data.map((h) => ({
        holiday_date: h.date,
        holiday_name: h.localName || h.name,
        is_national: true,
        is_paid: true,
        country_code: country,
        source: 'nager',
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public holidays' });
  }
});

router.post('/save-public', requireStaff, async (req, res) => {
  try {
    const { holidays, is_paid_default } = req.body;
    const inserted = [];
    for (const h of holidays || []) {
      const { rows } = await query(
        `INSERT INTO holidays (holiday_date, holiday_name, is_national, is_paid, country_code, source)
         VALUES ($1,$2,true,$3,$4,'nager')
         ON CONFLICT (holiday_date, plant_id) DO UPDATE SET holiday_name = EXCLUDED.holiday_name, is_paid = EXCLUDED.is_paid
         RETURNING *`,
        [h.holiday_date, h.holiday_name, h.is_paid ?? is_paid_default ?? true, h.country_code]
      ).catch(async () => {
        const r = await query(
          `INSERT INTO holidays (holiday_date, holiday_name, is_national, is_paid, country_code, source, plant_id)
           VALUES ($1,$2,true,$3,$4,'nager', NULL) RETURNING *`,
          [h.holiday_date, h.holiday_name, h.is_paid ?? true, h.country_code]
        );
        return r;
      });
      if (rows?.[0]) inserted.push(rows[0]);
    }
    res.json({ count: inserted.length, holidays: inserted });
  } catch (err) {
    res.status(500).json({ error: 'Save failed' });
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
