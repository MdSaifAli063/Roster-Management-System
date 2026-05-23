const DEMO_EMAIL = (process.env.DEMO_PRO_EMAIL || 'demo@rosterpro.com').trim().toLowerCase();

function isDemoEmail(email) {
  return Boolean(email && email.trim().toLowerCase() === DEMO_EMAIL);
}

module.exports = { DEMO_EMAIL, isDemoEmail };
