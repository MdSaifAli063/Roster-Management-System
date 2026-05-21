-- Non-destructive v2 migrations (applied via migrate.js)

-- Business / onboarding
CREATE TABLE IF NOT EXISTS businesses (
  id SERIAL PRIMARY KEY,
  owner_user_id INT REFERENCES users(id),
  business_name VARCHAR(200),
  tax_id VARCHAR(50),
  country_code VARCHAR(2) DEFAULT 'AU',
  state_code VARCHAR(20),
  location_name VARCHAR(200),
  timezone VARCHAR(64) DEFAULT 'Australia/Sydney',
  operating_days JSONB DEFAULT '{}',
  min_employee_age INT DEFAULT 18,
  employment_types JSONB DEFAULT '[]',
  pay_rules JSONB DEFAULT '{}',
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- App settings (employer)
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  business_id INT REFERENCES businesses(id) ON DELETE CASCADE,
  key VARCHAR(80) NOT NULL,
  value JSONB DEFAULT '{}',
  UNIQUE (business_id, key)
);

-- Roster publish periods
CREATE TABLE IF NOT EXISTS roster_periods (
  id SERIAL PRIMARY KEY,
  plant_id INT REFERENCES plants(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT',
  published_at TIMESTAMP,
  published_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (plant_id, start_date, end_date)
);

-- Roster cell extensions
ALTER TABLE rosters ADD COLUMN IF NOT EXISTS break_minutes INT DEFAULT 0;
ALTER TABLE rosters ADD COLUMN IF NOT EXISTS total_hours NUMERIC(5,2);
ALTER TABLE rosters ADD COLUMN IF NOT EXISTS roster_period_id INT REFERENCES roster_periods(id);

-- Holidays extensions
ALTER TABLE holidays ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT TRUE;
ALTER TABLE holidays ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE holidays ADD COLUMN IF NOT EXISTS state_code VARCHAR(20);
ALTER TABLE holidays ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'manual';

-- Employee extensions
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS annual_leave_balance NUMERIC(6,2) DEFAULT 20;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sick_leave_balance NUMERIC(6,2) DEFAULT 10;

-- Leave balance tracking
CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  emp_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(30) NOT NULL,
  balance_days NUMERIC(6,2) DEFAULT 0,
  used_days NUMERIC(6,2) DEFAULT 0,
  UNIQUE (emp_id, leave_type)
);

-- Finance organiser
CREATE TABLE IF NOT EXISTS finance_invoices (
  id SERIAL PRIMARY KEY,
  supplier VARCHAR(200),
  invoice_number VARCHAR(100),
  invoice_date DATE,
  due_date DATE,
  category VARCHAR(80) DEFAULT 'General',
  amount_ex_gst NUMERIC(12,2),
  gst_amount NUMERIC(12,2),
  total_inc_gst NUMERIC(12,2),
  status VARCHAR(20) DEFAULT 'UNPAID',
  line_items JSONB DEFAULT '[]',
  source VARCHAR(30) DEFAULT 'manual',
  pdf_extract_id VARCHAR(100),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_invoices_status ON finance_invoices(status);
CREATE INDEX IF NOT EXISTS idx_finance_invoices_due ON finance_invoices(due_date);

-- PDF extraction review queue
CREATE TABLE IF NOT EXISTS pdf_extract_jobs (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255),
  status VARCHAR(30) DEFAULT 'pending',
  extracted_fields JSONB DEFAULT '{}',
  finance_invoice_id INT REFERENCES finance_invoices(id),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
