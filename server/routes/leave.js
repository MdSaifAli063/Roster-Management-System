const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole, requireStaff } = require('../middleware/auth');
const { notifyLeaveSubmitted, notifyLeaveDecision } = require('../services/email');
const {
  notifyLeaveSubmittedRealtime,
  notifyLeaveDecisionRealtime,
} = require('../services/inAppNotifications');

const router = express.Router();
router.use(authenticate);

const { resolveEmployeeForUser } = require('../services/employeeLink');
const { autoApproveIfEnabled, applyLeaveToRoster } = require('../services/leaveApproval');

async function employeeIdForUser(user) {
  const employee = await resolveEmployeeForUser(user);
  return employee?.id;
}

router.get('/', async (req, res) => {
  try {
    let { status, emp_id } = req.query;
    if (req.user.role === 'EMPLOYEE') {
      emp_id = await employeeIdForUser(req.user);
    }
    const conditions = ['1=1'];
    const params = [];
    let i = 1;
    if (status) { conditions.push(`lr.status = $${i++}`); params.push(status); }
    if (emp_id) { conditions.push(`lr.emp_id = $${i++}`); params.push(Number(emp_id)); }

    const { rows } = await query(
      `SELECT lr.*, e.emp_code, e.emp_name, e.email AS emp_email, u.name AS reviewer_name
       FROM leave_requests lr
       JOIN employees e ON lr.emp_id = e.id
       LEFT JOIN users u ON lr.reviewed_by = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY lr.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

router.post('/', async (req, res) => {
  try {
    let { emp_id, start_date, end_date, leave_type, notes } = req.body;
    if (req.user.role === 'EMPLOYEE') {
      emp_id = await employeeIdForUser(req.user);
      if (!emp_id) return res.status(400).json({ error: 'No employee record linked to your email' });
    }
    const { rows } = await query(
      `INSERT INTO leave_requests (emp_id, start_date, end_date, leave_type, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [emp_id, start_date, end_date, leave_type, notes]
    );
    let leave = rows[0];
    const { rows: empRows } = await query('SELECT * FROM employees WHERE id = $1', [emp_id]);
    const employee = empRows[0];
    leave = (await autoApproveIfEnabled(leave, req.user.id)) || leave;
    await Promise.all([
      notifyLeaveSubmitted({ leave, employee }),
      notifyLeaveSubmittedRealtime({ leave, employee }),
    ]);
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

router.put('/:id/approve', requireStaff, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE leave_requests SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const leave = rows[0];
    await applyLeaveToRoster(leave);
    const { rows: empRows } = await query('SELECT * FROM employees WHERE id = $1', [leave.emp_id]);
    await Promise.all([
      notifyLeaveDecision({
        leave,
        employee: empRows[0],
        approved: true,
        reviewerName: req.user.name,
      }),
      notifyLeaveDecisionRealtime({
        leave,
        employee: empRows[0],
        approved: true,
        reviewerName: req.user.name,
      }),
    ]);
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Approve failed' });
  }
});

router.put('/:id/reject', requireStaff, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE leave_requests SET status = 'REJECTED', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const leave = rows[0];
    const { rows: empRows } = await query('SELECT * FROM employees WHERE id = $1', [leave.emp_id]);
    await Promise.all([
      notifyLeaveDecision({
        leave,
        employee: empRows[0],
        approved: false,
        reviewerName: req.user.name,
      }),
      notifyLeaveDecisionRealtime({
        leave,
        employee: empRows[0],
        approved: false,
        reviewerName: req.user.name,
      }),
    ]);
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Reject failed' });
  }
});

router.get('/balances', async (req, res) => {
  try {
    let empId = req.query.emp_id;
    if (req.user.role === 'EMPLOYEE') {
      empId = await employeeIdForUser(req.user);
    }
    if (!empId) return res.status(400).json({ error: 'emp_id required' });
    const { rows: emp } = await query(
      'SELECT annual_leave_balance, sick_leave_balance FROM employees WHERE id = $1',
      [empId]
    );
    const { rows: balances } = await query(
      'SELECT * FROM leave_balances WHERE emp_id = $1',
      [empId]
    );
    res.json({
      annual: balances.find((b) => b.leave_type === 'ANNUAL')?.balance_days ?? emp[0]?.annual_leave_balance ?? 0,
      sick: balances.find((b) => b.leave_type === 'SICK')?.balance_days ?? emp[0]?.sick_leave_balance ?? 0,
      balances,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load balances' });
  }
});

module.exports = router;
