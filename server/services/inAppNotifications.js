const { query } = require('../db');
const { STAFF_ROLES } = require('../constants/roles');
const { emitToUser } = require('../realtime');

async function getStaffUserIds() {
  const { rows } = await query(
    `SELECT id FROM users WHERE role = ANY($1::varchar[])`,
    [STAFF_ROLES]
  );
  return rows.map((r) => r.id);
}

async function getUserIdByEmployeeId(empId) {
  const { rows } = await query(
    `SELECT u.id FROM users u
     INNER JOIN employees e ON e.user_id = u.id OR LOWER(u.email) = LOWER(e.email)
     WHERE e.id = $1 LIMIT 1`,
    [empId]
  );
  return rows[0]?.id || null;
}

async function getAllUserIds() {
  const { rows } = await query('SELECT id FROM users');
  return rows.map((r) => r.id);
}

/**
 * Create in-app notification(s) and push over Socket.IO in real time.
 */
async function pushNotification({
  userIds = [],
  broadcast = false,
  staffOnly = false,
  type,
  title,
  message,
  link = null,
  payload = {},
}) {
  let targets = [...new Set(userIds.filter(Boolean))];

  if (staffOnly) {
    const staffIds = await getStaffUserIds();
    targets = [...new Set([...targets, ...staffIds])];
  }

  if (broadcast) {
    targets = await getAllUserIds();
  }

  if (!targets.length) return [];

  const created = [];

  for (const userId of targets) {
    const { rows } = await query(
      `INSERT INTO user_notifications (user_id, type, title, message, link, payload)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message, link, JSON.stringify(payload)]
    );
    const notification = formatNotification(rows[0]);
    created.push(notification);
    emitToUser(userId, 'notification', notification);
  }

  return created;
}

function formatNotification(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload || '{}') : row.payload || {},
    is_read: row.is_read,
    created_at: row.created_at,
  };
}

// ——— Event helpers (used alongside email) ———

async function notifyLeaveSubmittedRealtime({ leave, employee }) {
  await pushNotification({
    staffOnly: true,
    type: 'LEAVE_SUBMITTED',
    title: 'New leave request',
    message: `${employee.emp_name} requested ${leave.leave_type} (${leave.start_date} – ${leave.end_date})`,
    link: '/leave',
    payload: { leaveId: leave.id, empId: employee.id },
  });
}

async function notifyLeaveDecisionRealtime({ leave, employee, approved, reviewerName }) {
  const empUserId = await getUserIdByEmployeeId(employee.id);
  const status = approved ? 'approved' : 'rejected';
  await pushNotification({
    userIds: empUserId ? [empUserId] : [],
    type: approved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
    title: `Leave ${status}`,
    message: `Your ${leave.leave_type} leave (${leave.start_date} – ${leave.end_date}) was ${status}${reviewerName ? ` by ${reviewerName}` : ''}.`,
    link: '/leave',
    payload: { leaveId: leave.id },
  });
}

async function notifyReassignmentRealtime({ fromEmp, toEmp, date, reason, assignedBy }) {
  const userIds = [];
  const fromUser = await getUserIdByEmployeeId(fromEmp.id);
  const toUser = await getUserIdByEmployeeId(toEmp.id);
  if (fromUser) userIds.push(fromUser);
  if (toUser) userIds.push(toUser);

  await pushNotification({
    userIds,
    staffOnly: true,
    type: 'REASSIGNMENT',
    title: 'Work reassignment',
    message: `${fromEmp.emp_name} → ${toEmp.emp_name} on ${date}. Reason: ${reason}`,
    link: '/assignments',
    payload: { fromEmpId: fromEmp.id, toEmpId: toEmp.id, date },
  });

}

async function notifyAttendanceMarkRealtime({ employee, action, time }) {
  await pushNotification({
    staffOnly: true,
    type: 'ATTENDANCE_MARK',
    title: `Employee ${action}`,
    message: `${employee.emp_name} (${employee.emp_code}) marked ${action} at ${time}`,
    link: '/actual-roster',
    payload: { empId: employee.id, action },
  });

  const empUserId = await getUserIdByEmployeeId(employee.id);
  if (empUserId) {
    await pushNotification({
      userIds: [empUserId],
      type: 'ATTENDANCE_CONFIRM',
      title: `${action === 'in' ? 'Marked in' : 'Marked out'}`,
      message: `You successfully marked ${action} at ${time}.`,
      link: '/attendance',
      payload: { action },
    });
  }
}

async function notifyAttendanceMismatchRealtime({ mismatches, date }) {
  if (!mismatches?.length) return;
  await pushNotification({
    staffOnly: true,
    type: 'ATTENDANCE_MISMATCH',
    title: 'Attendance mismatches',
    message: `${mismatches.length} mismatch(es) detected for ${date}`,
    link: '/actual-roster',
    payload: { count: mismatches.length, date },
  });
}

module.exports = {
  pushNotification,
  formatNotification,
  notifyLeaveSubmittedRealtime,
  notifyLeaveDecisionRealtime,
  notifyReassignmentRealtime,
  notifyAttendanceMarkRealtime,
  notifyAttendanceMismatchRealtime,
  getStaffUserIds,
  getUserIdByEmployeeId,
};
