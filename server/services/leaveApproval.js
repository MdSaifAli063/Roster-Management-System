const { query } = require('../db');
const { parseJsonbBool } = require('../utils/settings');

async function getAutoApproveLeave(businessId) {
  if (!businessId) return false;
  const { rows } = await query(
    `SELECT value FROM app_settings WHERE business_id = $1 AND key = 'auto_approve_leave'`,
    [businessId]
  );
  return parseJsonbBool(rows[0]?.value);
}

async function applyLeaveToRoster(leave) {
  const start = new Date(leave.start_date + 'T00:00:00');
  const end = new Date(leave.end_date + 'T00:00:00');
  const dates = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  for (const date of dates) {
    await query(
      `INSERT INTO rosters (emp_id, roster_date, status, shift_id, shift_start, shift_end, break_minutes, total_hours, is_manual_override, assigned_by)
       VALUES ($1, $2, 'LEAVE', NULL, NULL, NULL, 0, 0, true, NULL)
       ON CONFLICT (emp_id, roster_date) DO UPDATE SET
         status = 'LEAVE',
         shift_id = NULL,
         shift_start = NULL,
         shift_end = NULL,
         break_minutes = 0,
         total_hours = 0,
         is_manual_override = true`,
      [leave.emp_id, date]
    );
  }
}

async function autoApproveIfEnabled(leave, reviewerId) {
  const { rows: bizRows } = await query('SELECT id FROM businesses LIMIT 1');
  const auto = await getAutoApproveLeave(bizRows[0]?.id);
  if (!auto) return leave;

  const { rows } = await query(
    `UPDATE leave_requests SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2 RETURNING *`,
    [reviewerId || null, leave.id]
  );
  const approved = rows[0];
  if (approved) await applyLeaveToRoster(approved);
  return approved;
}

module.exports = { getAutoApproveLeave, applyLeaveToRoster, autoApproveIfEnabled };
