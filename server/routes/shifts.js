const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM shifts ORDER BY shift_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

router.post('/', requireRole('ADMIN', 'HR_USER'), async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO shifts (shift_name, shift_start, shift_end, mandatory_start, mandatory_end, stretched_start_hours, stretched_end_hours, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [b.shift_name, b.shift_start, b.shift_end, b.mandatory_start, b.mandatory_end, b.stretched_start_hours, b.stretched_end_hours, b.is_active ?? true]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

router.put('/:id', requireRole('ADMIN', 'HR_USER'), async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE shifts SET shift_name=$1, shift_start=$2, shift_end=$3, mandatory_start=$4, mandatory_end=$5,
       stretched_start_hours=$6, stretched_end_hours=$7, is_active=$8 WHERE id=$9 RETURNING *`,
      [b.shift_name, b.shift_start, b.shift_end, b.mandatory_start, b.mandatory_end, b.stretched_start_hours, b.stretched_end_hours, b.is_active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update shift' });
  }
});

router.get('/patterns', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT sp.*, s.shift_name, s.shift_start, s.shift_end
       FROM shift_patterns sp
       LEFT JOIN shifts s ON sp.shift_id = s.id
       ORDER BY sp.pattern_name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

router.post('/patterns', requireRole('ADMIN', 'HR_USER'), async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO shift_patterns (pattern_name, shift_id, mon, tue, wed, thu, fri, sat, sun)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [b.pattern_name, b.shift_id, b.mon, b.tue, b.wed, b.thu, b.fri, b.sat, b.sun]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create pattern' });
  }
});

router.put('/patterns/:id', requireRole('ADMIN', 'HR_USER'), async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE shift_patterns SET pattern_name=$1, shift_id=$2, mon=$3, tue=$4, wed=$5, thu=$6, fri=$7, sat=$8, sun=$9
       WHERE id=$10 RETURNING *`,
      [b.pattern_name, b.shift_id, b.mon, b.tue, b.wed, b.thu, b.fri, b.sat, b.sun, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pattern' });
  }
});

module.exports = router;
