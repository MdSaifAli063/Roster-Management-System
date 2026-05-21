const fs = require('fs');
const path = require('path');

const PDF_API_URL = (process.env.PDF_API_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

async function extractViaFastApi(filePath, options = {}) {
  const buffer = fs.readFileSync(filePath);
  const form = new FormData();
  const blob = new Blob([buffer], { type: 'application/pdf' });
  form.append('file', blob, path.basename(filePath) || 'upload.pdf');
  form.append('pages', options.pages || 'all');
  form.append('include_tables', String(options.includeTables !== false));
  form.append('include_ocr', String(options.includeOcr !== false));

  const resp = await fetch(`${PDF_API_URL}/extract`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(options.timeoutMs || 300000),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(err || `PDF API error ${resp.status}`);
  }
  return resp.json();
}

async function checkFastApiHealth() {
  try {
    const resp = await fetch(`${PDF_API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) return { ok: false };
    const data = await resp.json();
    return { ok: true, ...data, mode: 'fastapi', url: PDF_API_URL };
  } catch {
    return { ok: false, mode: 'fastapi', url: PDF_API_URL };
  }
}

module.exports = { extractViaFastApi, checkFastApiHealth, PDF_API_URL };
