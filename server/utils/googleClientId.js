function resolveGoogleClientId() {
  const raw = process.env.GOOGLE_CLIENT_ID?.trim();
  return raw || null;
}

module.exports = { resolveGoogleClientId };
