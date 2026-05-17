const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function getPoolConfig() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || typeof connectionString !== 'string' || !connectionString.trim()) {
    throw new Error(
      'DATABASE_URL is missing. Copy server/.env.example to server/.env and set your PostgreSQL connection string.\n' +
      'Example: DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/roster_db'
    );
  }

  const config = {
    connectionString: connectionString.trim(),
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };

  // Avoid SCRAM error when password is missing from a malformed URL
  try {
    const url = new URL(connectionString.replace(/^postgresql:\/\//, 'http://'));
    if (url.username && url.password === undefined) {
      throw new Error('DATABASE_URL appears to have a username but no password.');
    }
  } catch (err) {
    if (err.message.includes('username')) throw err;
    // Non-URL formats (e.g. some cloud strings) — let pg handle them
  }

  return config;
}

let pool;
try {
  pool = new Pool(getPoolConfig());
} catch (err) {
  console.error(err.message);
  pool = null;
}

pool?.on('error', (err) => {
  console.error('Unexpected DB error', err);
});

async function query(text, params) {
  if (!pool) {
    throw new Error(
      'Database not configured. Create server/.env with DATABASE_URL (see .env.example).'
    );
  }
  return pool.query(text, params);
}

module.exports = { pool, query };
