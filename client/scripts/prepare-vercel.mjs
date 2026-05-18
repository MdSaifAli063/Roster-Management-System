/**
 * Prepares client/vercel.json SPA rewrites before Vite build.
 * Vercel-only deploy: API is same-origin (/api) — no external proxy needed.
 * Split deploy: set VITE_API_URL to proxy /api to Render.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const clientRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiUrl = process.env.VITE_API_URL?.trim();

const vercelPath = join(clientRoot, 'vercel.json');
const config = JSON.parse(readFileSync(vercelPath, 'utf8'));

const rewrites = [];

if (apiUrl?.startsWith('http')) {
  const origin = new URL(apiUrl).origin;
  rewrites.push({
    source: '/api/:path*',
    destination: `${origin}/api/:path*`,
  });
  console.log(`[vercel] External API proxy: /api/* → ${origin}/api/*`);
}

rewrites.push({
  source: '/((?!api/)(?!assets/).*)',
  destination: '/index.html',
});

config.rewrites = rewrites;
writeFileSync(vercelPath, JSON.stringify(config, null, 2));

if (process.env.VERCEL === '1') {
  console.log(
    apiUrl?.startsWith('http')
      ? '[vercel] Split deploy: using VITE_API_URL'
      : '[vercel] Unified deploy: API at /api on same domain'
  );
}
