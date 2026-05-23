import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, '..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '');
  const envLocal = loadEnv(mode, rootDir, '');
  const googleClientId =
    envLocal.VITE_GOOGLE_CLIENT_ID?.trim() ||
    env.VITE_GOOGLE_CLIENT_ID?.trim() ||
    env.GOOGLE_CLIENT_ID?.trim() ||
    '';

  return {
    plugins: [react(), tailwindcss()],
    envDir: projectRoot,
    define: googleClientId
      ? { 'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId) }
      : {},
    server: {
      proxy: {
        '/api': { target: 'http://localhost:5000', changeOrigin: true },
      },
    },
  };
});
