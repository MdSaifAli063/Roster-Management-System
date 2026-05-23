const fs = require('fs');
const path = require('path');
const { query } = require('./index');

let applied = false;

/** Strip full-line SQL comments so chunks are not dropped by leading `--`. */
function stripLineComments(sql) {
  return sql
    .split('\n')
    .filter((line) => !/^\s*--/.test(line))
    .join('\n');
}

async function runSqlStatements(sql, label) {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    try {
      await query(statement);
    } catch (err) {
      console.warn(`${label}:`, err.message?.slice(0, 200));
    }
  }
}

async function ensureRosterColumns() {
  await query('ALTER TABLE rosters ADD COLUMN IF NOT EXISTS break_minutes INT DEFAULT 0');
  await query('ALTER TABLE rosters ADD COLUMN IF NOT EXISTS total_hours NUMERIC(5,2)');
}

/** Idempotent — runs every startup until columns/tables exist (fixes partial migration failures). */
async function ensureSubscriptionSchema() {
  await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plan_id VARCHAR(20) DEFAULT 'starter'`);
  await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active'`);
  await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP`);
  await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP`);
  await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(10)`);
  await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100)`);
  await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100)`);
  await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(100)`);
  await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(100)`);

  await query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      monthly_price DECIMAL(10,2) DEFAULT 0,
      annual_price DECIMAL(10,2) DEFAULT 0,
      stripe_monthly_price_id VARCHAR(100),
      stripe_annual_price_id VARCHAR(100),
      paypal_monthly_plan_id VARCHAR(100),
      paypal_annual_plan_id VARCHAR(100),
      razorpay_monthly_plan_id VARCHAR(100),
      razorpay_annual_plan_id VARCHAR(100),
      max_employees INT,
      max_locations INT,
      features JSONB DEFAULT '{}',
      sort_order INT DEFAULT 0
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS trials (
      id SERIAL PRIMARY KEY,
      business_id INT REFERENCES businesses(id) ON DELETE CASCADE,
      plan_id VARCHAR(20) DEFAULT 'professional',
      started_at TIMESTAMP DEFAULT NOW(),
      ends_at TIMESTAMP,
      converted BOOLEAN DEFAULT FALSE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payment_history (
      id SERIAL PRIMARY KEY,
      business_id INT REFERENCES businesses(id) ON DELETE CASCADE,
      stripe_invoice_id VARCHAR(100),
      paypal_transaction_id VARCHAR(100),
      razorpay_payment_id VARCHAR(100),
      amount DECIMAL(10,2),
      currency VARCHAR(10) DEFAULT 'usd',
      status VARCHAR(20),
      plan_id VARCHAR(20),
      billing_period_start TIMESTAMP,
      billing_period_end TIMESTAMP,
      invoice_url TEXT,
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function ensureOAuthSchema() {
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)');
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
    ON users (google_id) WHERE google_id IS NOT NULL
  `);
  await query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');
}

async function ensureV2Schema() {
  await ensureSubscriptionSchema();
  await ensureOAuthSchema();

  if (applied) return;

  const v2Path = path.join(__dirname, 'migrations-v2.sql');
  if (fs.existsSync(v2Path)) {
    const sql = stripLineComments(fs.readFileSync(v2Path, 'utf8'));
    await runSqlStatements(sql, 'v2 migration');
  }

  try {
    await ensureRosterColumns();
  } catch (err) {
    console.error('ensureRosterColumns failed:', err.message);
    throw err;
  }

  const subsPath = path.join(__dirname, 'migrations-subscriptions.sql');
  if (fs.existsSync(subsPath)) {
    const subsSql = stripLineComments(fs.readFileSync(subsPath, 'utf8'));
    await runSqlStatements(subsSql, 'subscriptions migration');
    try {
      const { seedSubscriptionPlans } = require('../services/subscription');
      await seedSubscriptionPlans();
    } catch (err) {
      console.warn('seedSubscriptionPlans:', err.message?.slice(0, 120));
    }
  }

  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_roster_periods_plant_dates
      ON roster_periods (COALESCE(plant_id, 0), start_date, end_date)
    `);
  } catch {
    /* roster_periods may not exist yet on very old DBs */
  }

  const oauthPath = path.join(__dirname, 'migrations-auth-oauth.sql');
  if (fs.existsSync(oauthPath)) {
    const oauthSql = stripLineComments(fs.readFileSync(oauthPath, 'utf8'));
    await runSqlStatements(oauthSql, 'oauth migration');
  }

  applied = true;
}

module.exports = { ensureV2Schema, ensureRosterColumns, ensureSubscriptionSchema, ensureOAuthSchema };
