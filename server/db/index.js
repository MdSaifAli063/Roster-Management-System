const { Pool, types } = require('pg');
const path = require('path');
const { loadEnv } = require('../loadEnv');

loadEnv();

// Return DATE columns as YYYY-MM-DD strings (avoids timezone shifts in calendars)
types.setTypeParser(1082, (val) => val);

function getPoolConfig() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || typeof connectionString !== 'string' || !connectionString.trim()) {
    throw new Error(
      'DATABASE_URL is missing. Set it in server/.env (see .env.example).\n' +
      'Example: postgresql://postgres:password@localhost:5432/roster_db'
    );
  }

  const conn = connectionString.trim();
  const isLocalHost = /@(localhost|127\.0\.0\.1)(:\d+)?\//i.test(conn);
  const isCloudSqlSocket = conn.includes('/cloudsql/');

  const useSsl =
    !isLocalHost &&
    !isCloudSqlSocket &&
    (process.env.DATABASE_SSL === 'true' ||
      /neon\.tech|supabase\.co|render\.com/i.test(conn));

  return {
    connectionString: conn,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: process.env.VERCEL ? 10000 : 30000,
  };
}

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool(getPoolConfig());
    pool.on('error', (err) => {
      console.error('Unexpected DB pool error', err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function testConnection() {
  const result = await query('SELECT 1 AS ok');
  return result.rows[0]?.ok === 1;
}

module.exports = { get pool() { return getPool(); }, query, testConnection };
