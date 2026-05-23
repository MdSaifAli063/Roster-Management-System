const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { PLAN_IDS } = require('../constants/plans');
const { ROLES } = require('../constants/roles');
const { DEMO_EMAIL } = require('../constants/demoAccount');

const DEMO_PASSWORD = process.env.DEMO_PRO_PASSWORD || 'DemoPro2025!';
const DEMO_NAME = 'Demo Pro Employer';

async function ensureDemoAccount() {
  const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let userId;

  if (existing[0]) {
    await query(
      `UPDATE users SET name = $1, password_hash = $2, role = $3 WHERE id = $4`,
      [DEMO_NAME, password_hash, ROLES.EMPLOYER, existing[0].id]
    );
    userId = existing[0].id;
  } else {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [DEMO_NAME, DEMO_EMAIL, password_hash, ROLES.EMPLOYER]
    );
    userId = rows[0].id;
  }

  const { rows: bizRows } = await query(
    'SELECT id FROM businesses WHERE owner_user_id = $1 LIMIT 1',
    [userId]
  );

  if (bizRows[0]) {
    await query(
      `UPDATE businesses SET
         business_name = $1,
         plan_id = $2,
         subscription_status = 'active',
         trial_ends_at = NULL,
         billing_interval = 'monthly',
         updated_at = NOW()
       WHERE id = $3`,
      ['Demo Pro Workspace', PLAN_IDS.BUSINESS, bizRows[0].id]
    );
  } else {
    await query(
      `INSERT INTO businesses (owner_user_id, business_name, plan_id, subscription_status, billing_interval)
       VALUES ($1, $2, $3, 'active', 'monthly')`,
      [userId, 'Demo Pro Workspace', PLAN_IDS.BUSINESS]
    );
  }

  console.log(`Demo account ready: ${DEMO_EMAIL}`);
}

module.exports = { ensureDemoAccount };
