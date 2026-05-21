const { query } = require('../db');
const { sendEmail } = require('./email');
const { buildEmployeeRosterAttachments, dayDisplay } = require('./rosterExportAttach');

async function sendRosterEmails({ start_date, end_date, plant_id }) {
  const conditions = ['r.roster_date >= $1', 'r.roster_date <= $2', 'e.email IS NOT NULL'];
  const params = [start_date, end_date];
  if (plant_id) {
    conditions.push('e.plant_id = $3');
    params.push(Number(plant_id));
  }

  const { rows } = await query(
    `SELECT e.id, e.emp_code, e.emp_name, e.email,
       json_agg(json_build_object(
         'date', r.roster_date,
         'status', r.status,
         'shift_start', r.shift_start,
         'shift_end', r.shift_end,
         'break_minutes', r.break_minutes,
         'total_hours', r.total_hours
       ) ORDER BY r.roster_date) AS days
     FROM employees e
     JOIN rosters r ON r.emp_id = e.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY e.id, e.emp_code, e.emp_name, e.email`,
    params
  );

  let sent = 0;
  for (const emp of rows) {
    const lines = (emp.days || []).map((d) => {
      const display = dayDisplay({
        status: d.status,
        shift_start: d.shift_start,
        shift_end: d.shift_end,
        break_minutes: d.break_minutes,
        total_hours: d.total_hours,
      });
      const dateStr = String(d.date).slice(0, 10);
      return `${dateStr}: ${display}`;
    }).join('\n');

    let attachments = [];
    try {
      attachments = await buildEmployeeRosterAttachments({
        empId: emp.id,
        empName: emp.emp_name,
        empCode: emp.emp_code,
        start_date,
        end_date,
      });
    } catch (err) {
      console.error('roster attachment build failed', emp.email, err.message);
    }

    const result = await sendEmail({
      to: emp.email,
      subject: `Your roster ${start_date} to ${end_date}`,
      text: [
        `Hi ${emp.emp_name},`,
        '',
        'Your published roster is attached (Excel + PDF) and copied below:',
        '',
        lines || '(no shifts in this period)',
        '',
        '— RosterPro',
      ].join('\n'),
      html: [
        `<p>Hi ${emp.emp_name},</p>`,
        '<p>Your published roster is <strong>attached</strong> (Excel + PDF).</p>',
        `<pre style="font-family:monospace;font-size:12px">${lines || '(no shifts in this period)'}</pre>`,
        '<p>— RosterPro</p>',
      ].join(''),
      type: 'roster_published',
      payload: { emp_id: emp.id, start_date, end_date },
      attachments,
    });
    if (result?.sent) sent += 1;
  }
  return sent;
}

module.exports = { sendRosterEmails };
