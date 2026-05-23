-- Subscription & payments (non-destructive)
-- Order: CREATE tables first, then ALTER (safe on fresh and existing DBs)

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
);

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
);

CREATE TABLE IF NOT EXISTS trials (
  id SERIAL PRIMARY KEY,
  business_id INT REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id VARCHAR(20) DEFAULT 'professional',
  started_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,
  converted BOOLEAN DEFAULT FALSE
);

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plan_id VARCHAR(20) DEFAULT 'starter';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(10);

ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS razorpay_monthly_plan_id VARCHAR(100);
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS razorpay_annual_plan_id VARCHAR(100);
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_payment_history_business ON payment_history(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trials_business ON trials(business_id);
