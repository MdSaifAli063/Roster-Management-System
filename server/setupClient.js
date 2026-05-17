const path = require('path');
const express = require('express');
const { pathToFileURL } = require('url');

const clientRoot = path.resolve(__dirname, '../client');
const distPath = path.join(clientRoot, 'dist');

async function setupClient(app) {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    app.use(express.static(distPath, { index: false }));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build from client/dist');
    return;
  }

  const viteEntry = path.join(clientRoot, 'node_modules', 'vite', 'dist', 'node', 'index.js');
  const { createServer } = await import(pathToFileURL(viteEntry).href);

  const vite = await createServer({
    configFile: path.join(clientRoot, 'vite.config.js'),
    root: clientRoot,
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);
  console.log('Vite dev middleware active (HMR)');
}

module.exports = { setupClient };
