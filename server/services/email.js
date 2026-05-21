const nodemailer = require('nodemailer');
const { query } = require('../db');

let transporter = null;

function isEmailEnabled() {
  return process.env.EMAIL_ENABLED === 'true' && process.env.SMTP_HOST;
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isEmailEnabled()) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

async function logNotification(type, recipient, subject, payload, status) {
  try {
    await query(
      `INSERT INTO notification_log (type, recipient, subject, payload, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [type, recipient, subject, JSON.stringify(payload || {}), status]
    );
  } catch (err) {
    console.error('Failed to log notification', err.message);
  }
}

async function sendEmail({ to, subject, html, text, type, payload, attachments }) {
  const from = process.env.SMTP_FROM || 'RosterPro <noreply@roster.app>';
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return { sent: false, reason: 'no_recipients' };

  const mailAttachments = (attachments || []).map((a) => ({
    filename: a.filename,
    content: a.content,
    contentType: a.contentType,
  }));

  const transport = getTransporter();
  if (!transport) {
    console.log('[email:dev]', {
      to: recipients,
      subject,
      attachments: mailAttachments.map((a) => a.filename),
      text: (text || html || '').slice(0, 200),
    });
    await Promise.all(
      recipients.map((r) => logNotification(type || 'GENERIC', r, subject, payload, 'LOGGED_DEV'))
    );
    return { sent: false, reason: 'dev_log' };
  }

  try {
    await transport.sendMail({
      from,
      to: recipients.join(', '),
      subject,
      text,
      html: html || `<p>${text}</p>`,
      attachments: mailAttachments.length ? mailAttachments : undefined,
    });
    await Promise.all(
      recipients.map((r) => logNotification(type || 'GENERIC', r, subject, payload, 'SENT'))
    );
    return { sent: true };
  } catch (err) {
    console.error('Email send failed:', err.message);
    await Promise.all(
      recipients.map((r) => logNotification(type || 'GENERIC', r, subject, payload, 'FAILED'))
    );
    return { sent: false, reason: err.message };
  }
}

async function getHrEmails() {
  const notify = process.env.HR_NOTIFY_EMAIL;
  if (notify) return notify.split(',').map((e) => e.trim());
  const { rows } = await query(
    `SELECT email FROM users WHERE role IN ('ADMIN', 'HR_USER', 'TRAINING_MANAGER') AND email IS NOT NULL`
  );
  return rows.map((r) => r.email);
}

async function notifyReassignment({ fromEmp, toEmp, date, reason, notes, assignedBy }) {
  const hrEmails = await getHrEmails();
  const employeeEmails = [fromEmp?.email, toEmp?.email].filter(Boolean);
  const to = [...new Set([...hrEmails, ...employeeEmails])];

  const subject = `Work reassignment: ${fromEmp.emp_name} → ${toEmp.emp_name}`;
  const text = [
    `Work has been reassigned on ${date}.`,
    `From: ${fromEmp.emp_code} ${fromEmp.emp_name}`,
    `To: ${toEmp.emp_code} ${toEmp.emp_name}`,
    `Reason: ${reason}`,
    notes ? `Notes: ${notes}` : '',
    assignedBy ? `Assigned by: ${assignedBy}` : '',
  ].filter(Boolean).join('\n');

  return sendEmail({
    to,
    subject,
    text,
    type: 'REASSIGNMENT',
    payload: { fromEmp: fromEmp.id, toEmp: toEmp.id, date, reason },
  });
}

async function notifyLeaveSubmitted({ leave, employee }) {
  const to = await getHrEmails();
  const subject = `Leave request: ${employee.emp_name} (${leave.leave_type})`;
  const text = [
    `${employee.emp_name} (${employee.emp_code}) submitted a leave request.`,
    `Type: ${leave.leave_type}`,
    `Dates: ${leave.start_date} to ${leave.end_date}`,
    leave.notes ? `Notes: ${leave.notes}` : '',
  ].join('\n');

  return sendEmail({ to, subject, text, type: 'LEAVE_SUBMITTED', payload: { leaveId: leave.id } });
}

async function notifyLeaveDecision({ leave, employee, approved, reviewerName }) {
  const to = [employee.email, ...(await getHrEmails())].filter(Boolean);
  const status = approved ? 'approved' : 'rejected';
  const subject = `Leave request ${status}: ${employee.emp_name}`;
  const text = [
    `Your leave request (${leave.leave_type}, ${leave.start_date} – ${leave.end_date}) was ${status}.`,
    reviewerName ? `Reviewed by: ${reviewerName}` : '',
  ].join('\n');

  return sendEmail({ to, subject, text, type: `LEAVE_${approved ? 'APPROVED' : 'REJECTED'}`, payload: { leaveId: leave.id } });
}

async function notifyAttendanceMismatch({ mismatches, date }) {
  if (!mismatches.length) return { sent: false };
  const to = await getHrEmails();
  const subject = `${mismatches.length} attendance mismatch(es) on ${date}`;
  const lines = mismatches.slice(0, 20).map(
    (m) => `• ${m.emp_code} ${m.emp_name}: ${m.message}`
  );
  const text = [`The following attendance mismatches were detected for ${date}:`, '', ...lines].join('\n');

  return sendEmail({ to, subject, text, type: 'ATTENDANCE_MISMATCH', payload: { count: mismatches.length, date } });
}

module.exports = {
  sendEmail,
  notifyReassignment,
  notifyLeaveSubmitted,
  notifyLeaveDecision,
  notifyAttendanceMismatch,
  getHrEmails,
  isEmailEnabled,
};
