const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { loadEnv } = require('./loadEnv');
const { apiLimiter } = require('./middleware/rateLimit');
const { isGoogleAuthConfigured } = require('./services/googleAuth');

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
const pdfExtractRoutes = require('./routes/pdfExtract');
const { ensureV2Schema } = require('./db/ensureV2Schema');
const businessRoutes = require('./routes/business');
const settingsRoutes = require('./routes/settings');
const financeRoutes = require('./routes/finance');
const staffRoutes = require('./routes/staff');
const searchRoutes = require('./routes/search');
const inboundEmailRoutes = require('./routes/inboundEmail');
const paymentsRoutes = require('./routes/payments');
const { createWebhookRouter } = require('./routes/payments');

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

let schemaPromise = null;
function schemaReady() {
  if (!schemaPromise) {
    schemaPromise = ensureV2Schema().catch((err) => {
      console.warn('Schema ensure warning:', err.message);
      schemaPromise = null;
    });
  }
  return schemaPromise;
}

function createApp() {
  const app = express();

  if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  app.use(async (_req, _res, next) => {
    await schemaReady();
    next();
  });

  app.use(cors(buildCorsOptions()));
  app.use(compression());
  app.use('/api/payments', createWebhookRouter());
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter);

  app.get('/api/health', async (_req, res) => {
    try {
      const { testConnection } = require('./db');
      await testConnection();
      res.json({
        status: 'ok',
        googleAuth: isGoogleAuthConfigured(),
      });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'unavailable' });
    }
  });

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
  app.use('/api/pdf-extract', pdfExtractRoutes);
  app.use('/api/business', businessRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/inbound', inboundEmailRoutes);
  app.use('/api/payments', paymentsRoutes);

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
