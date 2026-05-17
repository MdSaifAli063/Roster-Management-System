const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM plants';
    const params = [];
    if (search) {
      sql += ' WHERE plant_code ILIKE $1 OR plant_name ILIKE $1 OR location ILIKE $1';
      params.push(`%${search}%`);
    }
    sql += ' ORDER BY plant_name';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

router.post('/', requireRole('ADMIN', 'HR_USER'), async (req, res) => {
  try {
    const { plant_code, plant_name, location, description } = req.body;
    const { rows } = await query(
      `INSERT INTO plants (plant_code, plant_name, location, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [plant_code, plant_name, location, description]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Plant code already exists' });
    res.status(500).json({ error: 'Failed to create plant' });
  }
});

router.put('/:id', requireRole('ADMIN', 'HR_USER'), async (req, res) => {
  try {
    const { plant_code, plant_name, location, description } = req.body;
    const { rows } = await query(
      `UPDATE plants SET plant_code=$1, plant_name=$2, location=$3, description=$4
       WHERE id=$5 RETURNING *`,
      [plant_code, plant_name, location, description, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Plant not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plant' });
  }
});

module.exports = router;
