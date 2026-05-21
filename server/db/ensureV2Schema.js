const fs = require('fs');
const path = require('path');
const { query } = require('./index');

let applied = false;

async function ensureV2Schema() {
  if (applied) return;
  const v2Path = path.join(__dirname, 'migrations-v2.sql');
  if (!fs.existsSync(v2Path)) return;

  const sql = fs.readFileSync(v2Path, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await query(stmt);
    } catch (err) {
      if (err.code === '42P07' || err.code === '42710') continue;
      console.warn('Schema statement skipped:', err.message?.slice(0, 120));
    }
  }

  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_roster_periods_plant_dates
      ON roster_periods (COALESCE(plant_id, 0), start_date, end_date)
    `);
  } catch {
    /* ignore */
  }

  applied = true;
}

module.exports = { ensureV2Schema };
