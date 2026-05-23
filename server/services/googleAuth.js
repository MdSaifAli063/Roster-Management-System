const { OAuth2Client } = require('google-auth-library');
const { resolveGoogleClientId } = require('../utils/googleClientId');

function isGoogleAuthConfigured() {
  return Boolean(resolveGoogleClientId());
}

function getClient() {
  const clientId = resolveGoogleClientId();
  if (!clientId) return null;
  return new OAuth2Client(clientId);
}

async function verifyGoogleCredential(credential) {
  const client = getClient();
  if (!client) {
    throw Object.assign(new Error('Google sign-in is not configured on the server'), { status: 503 });
  }
  if (!credential?.trim()) {
    throw Object.assign(new Error('Google credential is required'), { status: 400 });
  }

  const ticket = await client.verifyIdToken({
    idToken: credential.trim(),
    audience: resolveGoogleClientId(),
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw Object.assign(new Error('Google account did not return an email'), { status: 400 });
  }
  if (payload.email_verified === false) {
    throw Object.assign(new Error('Please verify your Google email before signing in'), { status: 400 });
  }

  return {
    googleId: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: (payload.name || payload.email.split('@')[0] || 'User').trim().slice(0, 100),
    picture: payload.picture || null,
  };
}

module.exports = { verifyGoogleCredential, isGoogleAuthConfigured };
