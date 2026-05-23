/**
 * Creates / updates a demo employer with Business plan (all features, no limits).
 * Safe to run on local DB. Usage: npm run db:seed-demo
 */
const { loadEnv } = require('../loadEnv');
loadEnv();

const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { ensureV2Schema } = require('../db/ensureV2Schema');
const { PLAN_IDS } = require('../constants/plans');
const { ROLES } = require('../constants/roles');
const { seedSubscriptionPlans } = require('../services/subscription');

const DEMO_EMAIL = (process.env.DEMO_PRO_EMAIL || 'demo@rosterpro.com').trim().toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PRO_PASSWORD || 'DemoPro2025!';
const DEMO_NAME = 'Demo Pro Employer';

async function main() {
  await ensureV2Schema();
  await seedSubscriptionPlans();

  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);
  let userId;

  if (existing[0]) {
    await query(
      `UPDATE users SET name = $1, password_hash = $2, role = $3 WHERE id = $4`,
      [DEMO_NAME, password_hash, ROLES.EMPLOYER, existing[0].id]
    );
    userId = existing[0].id;
    console.log('Updated existing demo user');
  } else {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [DEMO_NAME, DEMO_EMAIL, password_hash, ROLES.EMPLOYER]
    );
    userId = rows[0].id;
    console.log('Created demo user');
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

  console.log('\n✅ Demo account ready (Business — all features free)\n');
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`   Plan:     ${PLAN_IDS.BUSINESS} (unlimited, no payment required)\n`);
  console.log('   Sign in at /login — do not use this account in production.\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
