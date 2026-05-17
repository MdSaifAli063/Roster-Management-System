const bcrypt = require('bcryptjs');
const { pool, query } = require('./index');

async function seed() {
  if (!pool) {
    console.error('\nCannot seed: configure DATABASE_URL in server/.env\n');
    process.exit(1);
  }

  const hash = await bcrypt.hash('admin123', 10);

  await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Admin User', 'admin@roster.com', $1, 'ADMIN')
     ON CONFLICT (email) DO NOTHING`,
    [hash]
  );
  await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('HR Manager', 'hr@roster.com', $1, 'HR_USER')
     ON CONFLICT (email) DO NOTHING`,
    [hash]
  );

  const plants = [
    ['GUR', 'Gurgaon Office', 'Gurgaon', 'India HQ'],
    ['DXB', 'Dubai Office', 'Dubai', 'Middle East'],
    ['LON', 'London Office', 'London', 'Europe'],
    ['SIN', 'Singapore Office', 'Singapore', 'APAC'],
    ['NOI', 'Noida Office', 'Noida', 'India'],
    ['CAI', 'Cairo Office', 'Cairo', 'Africa'],
  ];
  for (const [code, name, loc, desc] of plants) {
    await query(
      `INSERT INTO plants (plant_code, plant_name, location, description)
       VALUES ($1,$2,$3,$4) ON CONFLICT (plant_code) DO NOTHING`,
      [code, name, loc, desc]
    );
  }

  const { rows: plantRows } = await query('SELECT id, location FROM plants');
  const gurgaon = plantRows.find((p) => p.location === 'Gurgaon')?.id;

  const shifts = [
    ['Sales Shift', '09:00', '18:00', '09:00', '18:00'],
    ['Morning Shift', '09:30', '17:30', '09:30', '17:30'],
    ['Flexi-India', '08:00', '20:00', '10:00', '16:00'],
  ];
  for (const s of shifts) {
    const { rows: exists } = await query('SELECT 1 FROM shifts WHERE shift_name = $1', [s[0]]);
    if (!exists.length) {
      await query(
        `INSERT INTO shifts (shift_name, shift_start, shift_end, mandatory_start, mandatory_end)
         VALUES ($1,$2,$3,$4,$5)`,
        s
      );
    }
  }

  const { rows: shiftRows } = await query("SELECT id FROM shifts WHERE shift_name = 'Sales Shift'");
  const salesShiftId = shiftRows[0]?.id;

  if (salesShiftId) {
    const patterns = [
      ['Sales Shift Pattern', true, true, true, true, true, false, false],
      ['General Pattern', true, true, true, true, true, true, false],
    ];
    for (const [name, ...days] of patterns) {
      const { rows: exists } = await query(
        'SELECT 1 FROM shift_patterns WHERE pattern_name = $1',
        [name]
      );
      if (!exists.length) {
        await query(
          `INSERT INTO shift_patterns (pattern_name, shift_id, mon, tue, wed, thu, fri, sat, sun)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [name, salesShiftId, ...days]
        );
      }
    }
  }

  const { rows: patternRows } = await query("SELECT id FROM shift_patterns WHERE pattern_name = 'Sales Shift Pattern'");
  const patternId = patternRows[0]?.id;

  const employees = [
    ['0005', 'Dhruv D Sharma', 'dhruv@company.com', 'HR', 'VP-HUMAN RESOURCES', 'G1', 'G1-1', 'Corporate', 'HR', 'Sales Shift'],
    ['0030', 'Jamie C Wong', 'jamie@company.com', 'Operations', 'JR.ASSOCIATE-OPERATIONS', 'G4', 'G4-1', 'Retail', 'Store Ops', 'Sales Shift'],
    ['0038', 'Marcus K Lim', 'marcus@company.com', 'Operations', 'MANAGER-OPERATIONS', 'G2', 'G2-1', 'Retail', 'Store Ops', 'Sales Shift'],
    ['0035', 'Wong H Wong', 'wong@company.com', 'M&S', 'ASSOCIATE-M&S', 'G4', 'G4-2', 'Retail', 'Merchandising', 'Sales Shift'],
    ['0040', 'Darren M Wong', 'darren@company.com', 'Finance', 'EXECUTIVE-FINANCE', 'G3', 'G3-1', 'Corporate', 'Finance', 'Sales Shift'],
  ];
  for (const e of employees) {
    await query(
      `INSERT INTO employees (emp_code, emp_name, email, "function", role, grade, level, business_unit, process, plant_id, current_shift_pattern, shift_pattern_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (emp_code) DO UPDATE SET
         emp_name = EXCLUDED.emp_name,
         email = EXCLUDED.email,
         plant_id = EXCLUDED.plant_id,
         shift_pattern_id = EXCLUDED.shift_pattern_id`,
      [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], gurgaon, e[9], patternId]
    );
  }

  const { rows: empRows } = await query('SELECT id, emp_code FROM employees ORDER BY emp_code');
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  for (let d = 0; d < 7; d++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + d);
    const dateStr = dt.toISOString().slice(0, 10);
    const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;

    for (const emp of empRows) {
      const status = isWeekend ? 'WO' : 'W';
      await query(
        `INSERT INTO rosters (emp_id, roster_date, status, shift_id, shift_start, shift_end, mandatory_start, mandatory_end)
         VALUES ($1, $2, $3, $4, '09:00', '18:00', '09:00', '18:00')
         ON CONFLICT (emp_id, roster_date) DO NOTHING`,
        [emp.id, dateStr, status, salesShiftId]
      );
    }
  }

  const wed = new Date(monday);
  wed.setDate(monday.getDate() + 2);
  const wedStr = wed.toISOString().slice(0, 10);

  const attendanceSamples = [
    { code: '0005', date: wedStr, punch_in: '09:05', punch_out: '18:00', status: 'PRESENT' },
    { code: '0030', date: wedStr, punch_in: '09:45', punch_out: '18:00', status: 'LATE' },
    { code: '0038', date: wedStr, punch_in: null, punch_out: null, status: 'ABSENT' },
    { code: '0035', date: wedStr, punch_in: '10:00', punch_out: '15:00', status: 'PRESENT' },
    { code: '0040', date: wedStr, punch_in: '09:00', punch_out: '18:00', status: 'PRESENT' },
  ];
  for (const a of attendanceSamples) {
    const emp = empRows.find((e) => e.emp_code === a.code);
    if (!emp) continue;
    await query(
      `INSERT INTO attendance_records (emp_id, attendance_date, punch_in, punch_out, status, source)
       VALUES ($1,$2,$3,$4,$5,'SEED')
       ON CONFLICT (emp_id, attendance_date) DO UPDATE SET punch_in=$3, punch_out=$4, status=$5`,
      [emp.id, a.date, a.punch_in, a.punch_out, a.status]
    );
  }

  const jamie = empRows.find((e) => e.emp_code === '0030');
  if (jamie) {
    const { rows: existing } = await query(
      `SELECT id FROM leave_requests WHERE emp_id = $1 AND status = 'PENDING' LIMIT 1`,
      [jamie.id]
    );
    if (!existing.length) {
      await query(
        `INSERT INTO leave_requests (emp_id, start_date, end_date, leave_type, status, notes)
         VALUES ($1, $2, $3, 'ANNUAL', 'PENDING', 'Family event')`,
        [jamie.id, wedStr, wedStr]
      );
    }
  }

  await query(
    `INSERT INTO holidays (holiday_date, holiday_name, plant_id, is_national)
     SELECT '2025-01-01', 'New Year', NULL, true
     WHERE NOT EXISTS (SELECT 1 FROM holidays WHERE holiday_date = '2025-01-01' AND plant_id IS NULL)`
  );
  await query(
    `INSERT INTO holidays (holiday_date, holiday_name, plant_id, is_national)
     SELECT '2025-12-25', 'Christmas', NULL, true
     WHERE NOT EXISTS (SELECT 1 FROM holidays WHERE holiday_date = '2025-12-25' AND plant_id IS NULL)`
  );

  console.log('Seed completed.');
  console.log('Login: admin@roster.com / admin123');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
