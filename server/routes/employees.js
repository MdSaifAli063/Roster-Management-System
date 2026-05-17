const express = require('express');
const { query } = require('../db');
const { authenticate, requireStaff } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function buildEmployeeFilter(q) {
  const conditions = [];
  const params = [];
  let i = 1;

  const add = (sql, val) => {
    if (val === undefined || val === null || val === '') return;
    if (Array.isArray(val) && val.length === 0) return;
    if (Array.isArray(val)) {
      conditions.push(`${sql} = ANY($${i})`);
      params.push(val);
    } else {
      conditions.push(`${sql} ILIKE $${i}`);
      params.push(`%${val}%`);
    }
    i++;
  };

  if (q.emp_code) {
    conditions.push(`e.emp_code ILIKE $${i}`);
    params.push(`%${q.emp_code}%`);
    i++;
  }
  if (q.emp_name) {
    conditions.push(`e.emp_name ILIKE $${i}`);
    params.push(`%${q.emp_name}%`);
    i++;
  }
  add('e.business_unit', q.business_unit?.split?.(',') || q.business_unit);
  add('e."function"', q.function?.split?.(',') || q.function);
  add('e.role', q.role?.split?.(',') || q.role);
  add('e.grade', q.grade?.split?.(',') || q.grade);
  add('e.level', q.level?.split?.(',') || q.level);
  add('e.process', q.process?.split?.(',') || q.process);

  if (q.plant_id && q.plant_id !== 'all') {
    conditions.push(`e.plant_id = $${i}`);
    params.push(Number(q.plant_id));
    i++;
  }
  if (q.location) {
    conditions.push(`p.location ILIKE $${i}`);
    params.push(`%${q.location}%`);
    i++;
  }
  if (q.shift) {
    conditions.push(`(e.current_shift_pattern ILIKE $${i} OR sp.pattern_name ILIKE $${i})`);
    params.push(`%${q.shift}%`);
    i++;
  }

  return { conditions, params };
}

router.get('/', async (req, res) => {
  try {
    const { conditions, params } = buildEmployeeFilter(req.query);
    let sql = `
      SELECT e.*, p.plant_name, p.location AS plant_location, sp.pattern_name
      FROM employees e
      LEFT JOIN plants p ON e.plant_id = p.id
      LEFT JOIN shift_patterns sp ON e.shift_pattern_id = sp.id
    `;
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY e.emp_code';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.get('/filters', async (_req, res) => {
  try {
    const fields = ['business_unit', 'function', 'role', 'grade', 'level', 'process'];
    const result = {};
    for (const f of fields) {
      const col = f === 'function' ? '"function"' : f;
      const { rows } = await query(
        `SELECT DISTINCT ${col} AS value FROM employees WHERE ${col} IS NOT NULL AND ${col} != '' ORDER BY ${col}`
      );
      result[f] = rows.map((r) => r.value);
    }
    const { rows: locations } = await query(
      'SELECT DISTINCT location FROM plants WHERE location IS NOT NULL ORDER BY location'
    );
    result.locations = locations.map((r) => r.location);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

router.post('/', requireStaff, async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO employees (emp_code, emp_name, email, "function", role, grade, level, business_unit, process, plant_id, current_shift_pattern, shift_pattern_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [b.emp_code, b.emp_name, b.email, b.function, b.role, b.grade, b.level, b.business_unit, b.process, b.plant_id, b.current_shift_pattern, b.shift_pattern_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Employee code exists' });
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

router.put('/:id', requireStaff, async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE employees SET emp_code=$1, emp_name=$2, email=$3, "function"=$4, role=$5, grade=$6, level=$7,
       business_unit=$8, process=$9, plant_id=$10, current_shift_pattern=$11, shift_pattern_id=$12
       WHERE id=$13 RETURNING *`,
      [b.emp_code, b.emp_name, b.email, b.function, b.role, b.grade, b.level, b.business_unit, b.process, b.plant_id, b.current_shift_pattern, b.shift_pattern_id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

router.delete('/:id', requireStaff, async (req, res) => {
  try {
    await query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
