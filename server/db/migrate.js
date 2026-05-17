const fs = require('fs');
const path = require('path');
const pathEnv = require('path');
require('dotenv').config({ path: pathEnv.join(__dirname, '..', '.env') });
const { ensureDatabase } = require('./ensureDatabase');
const { pool } = require('./index');

async function migrate() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('\nCannot migrate: configure DATABASE_URL in server/.env\n');
    process.exit(1);
  }

  try {
    await ensureDatabase(process.env.DATABASE_URL.trim());
  } catch (err) {
    if (err.code === '3D000' || err.message?.includes('does not exist')) {
      console.error('Migration failed:', err.message);
      console.error('\nCreate the database manually in psql:\n  CREATE DATABASE roster_db;\n');
    } else {
      console.error('Could not ensure database exists:', err.message);
    }
    process.exit(1);
  }

  if (!pool) {
    console.error('\nCannot migrate: invalid DATABASE_URL in server/.env\n');
    process.exit(1);
  }

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  await pool.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(100)');
  console.log('Database schema applied successfully.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
