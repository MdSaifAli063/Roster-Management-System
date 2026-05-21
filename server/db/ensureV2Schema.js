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

async function ensureRosterColumns() {
  await query('ALTER TABLE rosters ADD COLUMN IF NOT EXISTS break_minutes INT DEFAULT 0');
  await query('ALTER TABLE rosters ADD COLUMN IF NOT EXISTS total_hours NUMERIC(5,2)');
}

async function ensureV2Schema() {
  if (applied) return;

  const v2Path = path.join(__dirname, 'migrations-v2.sql');
  if (fs.existsSync(v2Path)) {
    const sql = stripLineComments(fs.readFileSync(v2Path, 'utf8'));
    try {
      await query(sql);
    } catch (err) {
      console.warn('v2 migration batch:', err.message?.slice(0, 200));
    }
  }

  try {
    await ensureRosterColumns();
  } catch (err) {
    console.error('ensureRosterColumns failed:', err.message);
    throw err;
  }

  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_roster_periods_plant_dates
      ON roster_periods (COALESCE(plant_id, 0), start_date, end_date)
    `);
  } catch {
    /* roster_periods may not exist yet on very old DBs */
  }

  applied = true;
}

module.exports = { ensureV2Schema, ensureRosterColumns };
