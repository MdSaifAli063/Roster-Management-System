const express = require('express');
const { query } = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.use(requireEmployer);

router.get('/', async (req, res) => {
  try {
    const { q, employment_type, status } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let i = 1;
    if (q) {
      conditions.push(`(e.emp_name ILIKE $${i} OR e.emp_code ILIKE $${i} OR e.email ILIKE $${i})`);
      params.push(`%${q}%`);
      i++;
    }
    if (employment_type) { conditions.push(`e.employment_type = $${i++}`); params.push(employment_type); }
    if (status) { conditions.push(`e.status = $${i++}`); params.push(status); }

    const { rows } = await query(
      `SELECT e.*, p.plant_name, u.role AS user_role
       FROM employees e
       LEFT JOIN plants p ON e.plant_id = p.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.emp_name`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list staff' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT e.*, p.plant_name, p.location, u.email AS login_email, u.role AS user_role
       FROM employees e
       LEFT JOIN plants p ON e.plant_id = p.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const { rows: balances } = await query(
      'SELECT * FROM leave_balances WHERE emp_id = $1',
      [req.params.id]
    );
    const { rows: history } = await query(
      `SELECT r.* FROM rosters r
       WHERE r.emp_id = $1 AND r.roster_date >= CURRENT_DATE - INTERVAL '28 days'
       ORDER BY r.roster_date DESC`,
      [req.params.id]
    );

    res.json({
      employee: rows[0],
      leave_balances: balances.length
        ? balances
        : [
            { leave_type: 'ANNUAL', balance_days: rows[0].annual_leave_balance },
            { leave_type: 'SICK', balance_days: rows[0].sick_leave_balance },
          ],
      roster_history: history,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load staff profile' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE employees SET
        emp_name = COALESCE($1, emp_name),
        email = COALESCE($2, email),
        employment_type = COALESCE($3, employment_type),
        status = COALESCE($4, status),
        hourly_rate = COALESCE($5, hourly_rate),
        plant_id = COALESCE($6, plant_id),
        annual_leave_balance = COALESCE($7, annual_leave_balance),
        sick_leave_balance = COALESCE($8, sick_leave_balance)
       WHERE id = $9 RETURNING *`,
      [
        b.emp_name,
        b.email,
        b.employment_type,
        b.status,
        b.hourly_rate,
        b.plant_id,
        b.annual_leave_balance,
        b.sick_leave_balance,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
