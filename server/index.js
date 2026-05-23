const http = require('http');
const https = require('https');
const { loadEnv } = require('./loadEnv');

loadEnv();

const { testConnection } = require('./db');
const { ensureV2Schema } = require('./db/ensureV2Schema');
const app = require('./app');
const { setupClient } = require('./setupClient');
const { initRealtime } = require('./realtime');
const { useHttps, getHttpsOptions } = require('./ssl');

const PORT = process.env.PORT || 5000;
const enableSocket = process.env.ENABLE_SOCKET !== 'false';
const httpsEnabled = useHttps();
const protocol = httpsEnabled ? 'https' : 'http';

async function start() {
  try {
    await testConnection();
    await ensureV2Schema();
    if (process.env.SEED_DEMO_ON_START === 'true') {
      try {
        const { ensureDemoAccount } = require('./services/demoAccountSeed');
        await ensureDemoAccount();
      } catch (err) {
        console.warn('Demo account seed skipped:', err.message);
      }
    }
    console.log('Database connected (schema v2 ensured)');
  } catch (err) {
    console.error('\n❌ Database connection failed:', err.message);
    console.error('   • Is PostgreSQL running?');
    console.error('   • server/.env → DATABASE_URL and DATABASE_SSL=false for localhost\n');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET?.trim()) {
    console.error('\n❌ JWT_SECRET is missing in server/.env\n');
    process.exit(1);
  }

  await setupClient(app);

  const server = httpsEnabled
    ? https.createServer(getHttpsOptions(), app)
    : http.createServer(app);

  if (enableSocket) {
    initRealtime(server);
    console.log(`WebSocket: ${protocol}://localhost:${PORT}/socket.io`);
  }

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error('   Stop the other server, or run:');
      console.error(`   netstat -ano | findstr :${PORT}`);
      console.error('   taskkill /PID <pid> /F\n');
      process.exit(1);
    }
    throw err;
  });

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Roster app → ${protocol}://localhost:${PORT}`);
    console.log(`           → ${protocol}://127.0.0.1:${PORT}`);
    console.log(`API        → ${protocol}://localhost:${PORT}/api`);
    if (httpsEnabled) {
      console.log('(Self-signed cert — browser may warn; click Advanced → Proceed)');
    }
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
