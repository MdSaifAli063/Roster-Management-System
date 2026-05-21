const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../db');
const { sendEmail } = require('./email');
const { ROLES } = require('../constants/roles');

function randomPassword() {
  return crypto.randomBytes(4).toString('hex') + 'A1!';
}

/**
 * Create EMPLOYEE login for onboarding rows with email; send credentials once.
 */
async function provisionEmployeeLogins(employees = []) {
  const appUrl = process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:5173';
  let sent = 0;
  for (const emp of employees) {
    const email = emp.email?.trim().toLowerCase();
    if (!email || !emp.emp_name) continue;

    const { rows: existing } = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
    let userId = existing[0]?.id;
    let password = null;

    if (!userId) {
      password = randomPassword();
      const password_hash = await bcrypt.hash(password, 10);
      const { rows } = await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [emp.emp_name, email, password_hash, ROLES.EMPLOYEE]
      );
      userId = rows[0].id;
    }

    await query(
      `UPDATE employees SET user_id = $1, email = $2 WHERE emp_code = $3 OR LOWER(email) = LOWER($2)`,
      [userId, email, emp.emp_code]
    ).catch(() => {});

    if (password) {
      await sendEmail({
        to: email,
        subject: 'Your RosterPro login',
        text: `Hi ${emp.emp_name},\n\nYour employer set up RosterPro for you.\n\nLogin: ${email}\nTemporary password: ${password}\n\nSign in: ${appUrl}/login\n\nPlease change your password after first login.\n\n— RosterPro`,
        html: `<p>Hi ${emp.emp_name},</p><p>Login: <b>${email}</b><br/>Temporary password: <b>${password}</b></p><p><a href="${appUrl}/login">Sign in</a></p>`,
        type: 'employee_welcome',
      });
      sent++;
    }
  }
  return sent;
}

module.exports = { provisionEmployeeLogins };
