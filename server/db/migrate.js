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
  await pool.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id)');
  await pool.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id) WHERE user_id IS NOT NULL'
  );
  await pool.query('ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(30)');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT');
  await pool.query(`
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
    )
  `);
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, is_read, created_at DESC)'
  );

  const v2 = fs.readFileSync(path.join(__dirname, 'migrations-v2.sql'), 'utf8');
  await pool.query(v2);

  console.log('Database schema applied successfully (v2 migrations included).');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
