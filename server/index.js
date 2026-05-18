const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const http = require('http');
const app = require('./app');
const { setupClient } = require('./setupClient');
const { initRealtime } = require('./realtime');

const PORT = process.env.PORT || 5000;
const enableSocket = process.env.ENABLE_SOCKET !== 'false';

async function start() {
  await setupClient(app);

  const server = http.createServer(app);

  if (enableSocket) {
    initRealtime(server);
    console.log('WebSocket: /socket.io (set ENABLE_SOCKET=false to disable)');
  }

  server.listen(PORT, () => {
    console.log(`Roster app running at http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
