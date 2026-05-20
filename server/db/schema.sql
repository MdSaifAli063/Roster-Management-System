-- Users / Auth
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) DEFAULT 'HR_USER',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plant Master
CREATE TABLE IF NOT EXISTS plants (
  id SERIAL PRIMARY KEY,
  plant_code VARCHAR(20) UNIQUE NOT NULL,
  plant_name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  emp_code VARCHAR(20) UNIQUE NOT NULL,
  emp_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  user_id INT REFERENCES users(id),
  function VARCHAR(50),
  role VARCHAR(100),
  grade VARCHAR(10),
  level VARCHAR(20),
  business_unit VARCHAR(100),
  process VARCHAR(100),
  plant_id INT REFERENCES plants(id),
  current_shift_pattern VARCHAR(50),
  shift_pattern_id INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  shift_name VARCHAR(100) NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  mandatory_start TIME,
  mandatory_end TIME,
  stretched_start_hours INTERVAL,
  stretched_end_hours INTERVAL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Shift Patterns
CREATE TABLE IF NOT EXISTS shift_patterns (
  id SERIAL PRIMARY KEY,
  pattern_name VARCHAR(100) NOT NULL,
  shift_id INT REFERENCES shifts(id),
  mon BOOLEAN DEFAULT TRUE,
  tue BOOLEAN DEFAULT TRUE,
  wed BOOLEAN DEFAULT TRUE,
  thu BOOLEAN DEFAULT TRUE,
  fri BOOLEAN DEFAULT TRUE,
  sat BOOLEAN DEFAULT FALSE,
  sun BOOLEAN DEFAULT FALSE
);

-- Holidays
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  holiday_date DATE NOT NULL,
  holiday_name VARCHAR(100),
  plant_id INT REFERENCES plants(id),
  is_national BOOLEAN DEFAULT FALSE,
  UNIQUE (holiday_date, plant_id)
);

-- Rosters
CREATE TABLE IF NOT EXISTS rosters (
  id SERIAL PRIMARY KEY,
  emp_id INT REFERENCES employees(id) ON DELETE CASCADE,
  roster_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL,
  shift_id INT REFERENCES shifts(id),
  shift_start TIME,
  shift_end TIME,
  mandatory_start TIME,
  mandatory_end TIME,
  is_manual_override BOOLEAN DEFAULT FALSE,
  assigned_by INT REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (emp_id, roster_date)
);

-- Roster Templates
CREATE TABLE IF NOT EXISTS roster_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100),
  plant_id INT REFERENCES plants(id),
  shift_pattern_id INT REFERENCES shift_patterns(id),
  valid_from DATE,
  valid_to DATE,
  created_by INT REFERENCES users(id)
);

-- Work Reassignment
CREATE TABLE IF NOT EXISTS work_assignments (
  id SERIAL PRIMARY KEY,
  from_emp_id INT REFERENCES employees(id),
  to_emp_id INT REFERENCES employees(id),
  assignment_date DATE NOT NULL,
  reason VARCHAR(20),
  notes TEXT,
  assigned_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rosters_emp_date ON rosters(emp_id, roster_date);
CREATE INDEX IF NOT EXISTS idx_rosters_date ON rosters(roster_date);
CREATE INDEX IF NOT EXISTS idx_employees_plant ON employees(plant_id);
-- Attendance (actual punches vs planned roster)
CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  emp_id INT REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  punch_in TIME,
  punch_out TIME,
  status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
  source VARCHAR(20) DEFAULT 'MANUAL',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (emp_id, attendance_date)
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  emp_id INT REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type VARCHAR(30) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  notes TEXT,
  reviewed_by INT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- In-app notifications (real-time)
CREATE TABLE IF NOT EXISTS user_notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  link VARCHAR(200),
  payload JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, is_read, created_at DESC);

-- Email notification audit log
CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  recipient VARCHAR(200) NOT NULL,
  subject VARCHAR(200),
  payload JSONB,
  status VARCHAR(20) DEFAULT 'SENT',
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance_records(emp_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
