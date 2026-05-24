function isLikelyPlaceholder(value) {
  const normalized = String(value).toLowerCase();
  return (
    normalized.includes('xxxx') ||
    normalized.includes('example') ||
    normalized.includes('your-client-id')
  );
}

function isValidGoogleClientId(value) {
  const clientId = String(value || '').trim();
  return Boolean(clientId) &&
    clientId.endsWith('.apps.googleusercontent.com') &&
    !isLikelyPlaceholder(clientId);
}

function resolveGoogleClientId() {
  const raw = process.env.GOOGLE_CLIENT_ID?.trim();
  return isValidGoogleClientId(raw) ? raw : null;
}

module.exports = { resolveGoogleClientId, isValidGoogleClientId };
