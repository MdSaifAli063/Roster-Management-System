const express = require('express');
const { query } = require('../db');
const { authenticate, requireStaff } = require('../middleware/auth');
const { notifyReassignment } = require('../services/email');
const { notifyReassignmentRealtime } = require('../services/inAppNotifications');

const router = express.Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT wa.*,
        fe.emp_code AS from_code, fe.emp_name AS from_name,
        te.emp_code AS to_code, te.emp_name AS to_name,
        u.name AS assigned_by_name
       FROM work_assignments wa
       JOIN employees fe ON wa.from_emp_id = fe.id
       JOIN employees te ON wa.to_emp_id = te.id
       LEFT JOIN users u ON wa.assigned_by = u.id
       ORDER BY wa.assignment_date DESC, wa.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.post('/', requireStaff, async (req, res) => {
  try {
    const { from_emp_id, to_emp_id, assignment_date, reason, notes } = req.body;
    const { rows } = await query(
      `INSERT INTO work_assignments (from_emp_id, to_emp_id, assignment_date, reason, notes, assigned_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [from_emp_id, to_emp_id, assignment_date, reason, notes, req.user.id]
    );

    const { rows: fromRows } = await query('SELECT * FROM employees WHERE id = $1', [from_emp_id]);
    const { rows: toRows } = await query('SELECT * FROM employees WHERE id = $1', [to_emp_id]);

    await Promise.all([
      notifyReassignment({
        fromEmp: fromRows[0],
        toEmp: toRows[0],
        date: assignment_date,
        reason,
        notes,
        assignedBy: req.user.name || req.user.email,
      }),
      notifyReassignmentRealtime({
        fromEmp: fromRows[0],
        toEmp: toRows[0],
        date: assignment_date,
        reason,
        assignedBy: req.user.name || req.user.email,
      }),
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

module.exports = router;
