const { Client } = require('pg');

/**
 * Creates the target database from DATABASE_URL if it does not exist.
 * Connects to the default "postgres" database to run CREATE DATABASE.
 */
async function ensureDatabase(connectionString) {
  const url = new URL(connectionString.replace(/^postgresql:\/\//, 'http://'));
  const dbName = url.pathname.replace(/^\//, '').split('?')[0];

  if (!dbName) {
    throw new Error('DATABASE_URL must include a database name (e.g. /roster_db)');
  }

  url.pathname = '/postgres';
  const adminUrl = connectionString.replace(/\/[^/?]+(\?|$)/, '/postgres$1');

  const client = new Client({
    connectionString: adminUrl,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  const { rows } = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );

  if (rows.length === 0) {
    await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`Created database "${dbName}"`);
  } else {
    console.log(`Database "${dbName}" already exists`);
  }

  await client.end();
}

module.exports = { ensureDatabase };
