/**
 * Vercel serverless entry — Express API (no Socket.IO).
 * Frontend is served from client/dist via vercel.json rewrites.
 */
const app = require('../server/app');

module.exports = app;
