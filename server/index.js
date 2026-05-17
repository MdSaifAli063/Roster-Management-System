const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { setupClient } = require('./setupClient');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const rosterRoutes = require('./routes/rosters');
const shiftRoutes = require('./routes/shifts');
const holidayRoutes = require('./routes/holidays');
const plantRoutes = require('./routes/plants');
const reportRoutes = require('./routes/reports');
const assignmentRoutes = require('./routes/assignments');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const dashboardRoutes = require('./routes/dashboard');
const calendarRoutes = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.CLIENT_URL || `http://localhost:${PORT}`)
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: isProd ? allowedOrigins : true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/rosters', rosterRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar', calendarRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await setupClient(app);

  app.listen(PORT, () => {
    console.log(`Roster app running at http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
