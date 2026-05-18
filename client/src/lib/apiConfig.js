/**
 * API / WebSocket base URLs for local dev vs Vercel + Render split deploy.
 * Set VITE_API_URL in Vercel (e.g. https://your-api.onrender.com/api).
 * Socket uses VITE_SOCKET_URL or derives origin from VITE_API_URL.
 */
export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || '/api';
}

export function getSocketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const api = import.meta.env.VITE_API_URL;
  if (api && /^https?:\/\//i.test(api)) {
    try {
      return new URL(api).origin;
    } catch {
      /* use window origin */
    }
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
