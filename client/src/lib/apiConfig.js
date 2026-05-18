/**
 * API base URL.
 * - Vercel unified deploy: omit VITE_API_URL → same-origin `/api`
 * - Local dev: `/api` via Vite proxy
 * - Split deploy (Vercel + Render): set VITE_API_URL=https://api.example.com/api
 */
export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || '/api';
}

/** True when production build has no external API URL (split-deploy misconfiguration). */
export function isApiMisconfigured() {
  if (!import.meta.env.PROD) return false;
  const url = import.meta.env.VITE_API_URL;
  if (!url) return false;
  return !/^https?:\/\//i.test(url);
}
