const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { loadEnv } = require('./loadEnv');

loadEnv();

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
const notificationRoutes = require('./routes/notifications');

function buildCorsOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const fromEnv = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (process.env.VERCEL) {
    const vercelOrigin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null;
    const origins = [...new Set([...fromEnv, vercelOrigin].filter(Boolean))];
    return {
      origin: origins.length ? origins : true,
      credentials: true,
    };
  }

  return {
    origin: isProd && fromEnv.length ? fromEnv : true,
    credentials: true,
  };
}

function createApp() {
  const app = express();

  app.use(cors(buildCorsOptions()));
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
  app.use('/api/notifications', notificationRoutes);

  app.use((err, req, res, _next) => {
    console.error(err);
    const status = err.status || err.statusCode || 500;
    if (status === 400) {
      return res.status(400).json({ error: 'Invalid request. Send JSON with email and password.' });
    }
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: isDev && status >= 500 ? err.message : 'Internal server error',
    });
  });

  return app;
}

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
