const http = require('http');
const { loadEnv } = require('./loadEnv');

loadEnv();

const { testConnection } = require('./db');
const app = require('./app');
const { setupClient } = require('./setupClient');
const { initRealtime } = require('./realtime');

const PORT = process.env.PORT || 5000;
const enableSocket = process.env.ENABLE_SOCKET !== 'false';

async function start() {
  try {
    await testConnection();
    console.log('Database connected');
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

  const server = http.createServer(app);

  if (enableSocket) {
    initRealtime(server);
    console.log('WebSocket: /socket.io (set ENABLE_SOCKET=false to disable)');
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
    console.log(`Roster app listening on 0.0.0.0:${PORT}`);
    console.log(`API: /api`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
