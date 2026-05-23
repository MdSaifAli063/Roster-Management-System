const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || (isDev ? 200 : 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX) || (isDev ? 5000 : 600),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' && isDev,
  message: { error: 'Too many requests. Please slow down.' },
});

/** Only limits checkout / billing mutations — not GET /plans */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PAYMENTS_MAX) || (isDev ? 120 : 30),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET',
  message: { error: 'Too many payment requests. Please try again shortly.' },
});

module.exports = { authLimiter, apiLimiter, paymentLimiter };
