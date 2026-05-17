const { query } = require('../db');

async function getDefaultPlantId() {
  const { rows } = await query('SELECT id FROM plants ORDER BY id LIMIT 1');
  return rows[0]?.id || null;
}

async function getDefaultShiftPatternId() {
  const { rows } = await query('SELECT id FROM shift_patterns ORDER BY id LIMIT 1');
  return rows[0]?.id || null;
}

async function ensureWeekRoster(empId) {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const { rows: shifts } = await query(
    "SELECT id FROM shifts WHERE is_active = true ORDER BY id LIMIT 1"
  );
  const shiftId = shifts[0]?.id;
  if (!shiftId) return;

  for (let d = 0; d < 7; d++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + d);
    const dateStr = dt.toISOString().slice(0, 10);
    const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
    const status = isWeekend ? 'WO' : 'W';
    await query(
      `INSERT INTO rosters (emp_id, roster_date, status, shift_id, shift_start, shift_end, mandatory_start, mandatory_end)
       VALUES ($1, $2, $3, $4, '09:00', '18:00', '09:00', '18:00')
       ON CONFLICT (emp_id, roster_date) DO NOTHING`,
      [empId, dateStr, status, shiftId]
    );
  }
}

/**
 * Resolve employee record for a user account. Creates and links one if missing.
 */
async function resolveEmployeeForUser(user, { createIfMissing = true } = {}) {
  const email = user.email?.trim().toLowerCase();
  if (!email) return null;

  let { rows } = await query(
    `SELECT e.*, p.plant_name, p.location AS plant_location
     FROM employees e
     LEFT JOIN plants p ON e.plant_id = p.id
     WHERE e.user_id = $1 OR LOWER(e.email) = LOWER($2)
     LIMIT 1`,
    [user.id, email]
  );
  if (rows[0]) {
    if (!rows[0].user_id) {
      await query('UPDATE employees SET user_id = $1, email = COALESCE(email, $2) WHERE id = $3', [
        user.id,
        email,
        rows[0].id,
      ]);
      const { rows: updated } = await query(
        `SELECT e.*, p.plant_name, p.location AS plant_location
         FROM employees e LEFT JOIN plants p ON e.plant_id = p.id WHERE e.id = $1`,
        [rows[0].id]
      );
      return updated[0];
    }
    return rows[0];
  }

  if (!createIfMissing) return null;

  const plantId = await getDefaultPlantId();
  const patternId = await getDefaultShiftPatternId();
  const empCode = `U${String(user.id).padStart(4, '0')}`;

  const { rows: created } = await query(
    `INSERT INTO employees (emp_code, emp_name, email, plant_id, current_shift_pattern, shift_pattern_id, user_id)
     VALUES ($1, $2, $3, $4, 'Default', $5, $6)
     ON CONFLICT (emp_code) DO UPDATE SET
       emp_name = EXCLUDED.emp_name,
       email = EXCLUDED.email,
       user_id = EXCLUDED.user_id
     RETURNING *`,
    [empCode, user.name || 'Employee', email, plantId, patternId, user.id]
  );

  const employee = created[0];
  await ensureWeekRoster(employee.id);

  const { rows: full } = await query(
    `SELECT e.*, p.plant_name, p.location AS plant_location
     FROM employees e LEFT JOIN plants p ON e.plant_id = p.id WHERE e.id = $1`,
    [employee.id]
  );
  return full[0];
}

module.exports = { resolveEmployeeForUser, ensureWeekRoster };
