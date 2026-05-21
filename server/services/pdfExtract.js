const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXTRACTOR_ROOT = process.env.PDF_EXTRACTOR_ROOT
  || path.resolve(__dirname, '../../pdf-extractor');

function resolvePython() {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }

  const candidates = process.platform === 'win32'
    ? [
        path.join(EXTRACTOR_ROOT, '.venv', 'Scripts', 'python.exe'),
        path.join(EXTRACTOR_ROOT, '.venv', 'Scripts', 'python'),
        'python',
        'py',
      ]
    : [
        path.join(EXTRACTOR_ROOT, '.venv', 'bin', 'python'),
        'python3',
        'python',
      ];

  for (const cmd of candidates) {
    if (cmd.includes(path.sep) && !fs.existsSync(cmd)) continue;
    return cmd;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function checkPythonAvailable() {
  return new Promise((resolve) => {
    const python = resolvePython();
    const proc = spawn(python, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    proc.stdout.on('data', (d) => { out += d; });
    proc.stderr.on('data', (d) => { out += d; });
    proc.on('error', () => resolve({ ok: false, python, version: null }));
    proc.on('close', (code) => {
      resolve({
        ok: code === 0,
        python,
        version: out.trim() || null,
        extractorRoot: EXTRACTOR_ROOT,
        scriptExists: fs.existsSync(path.join(EXTRACTOR_ROOT, 'run_api.py')),
      });
    });
  });
}

async function extractPdf(filePath, options = {}) {
  const {
    pages = 'all',
    includeTables = true,
    includeOcr = true,
    dpi = 200,
    timeoutMs = 300000,
  } = options;

  if (process.env.PDF_API_URL || process.env.USE_PDF_API === 'true') {
    try {
      const { extractViaFastApi } = require('./pdfExtractHttp');
      return await extractViaFastApi(filePath, { pages, includeTables, includeOcr, timeoutMs });
    } catch (err) {
      if (process.env.PDF_API_FALLBACK !== 'spawn') throw err;
      console.warn('PDF API failed, falling back to spawn:', err.message);
    }
  }

  const python = resolvePython();
  const script = path.join(EXTRACTOR_ROOT, 'run_api.py');

  if (!fs.existsSync(script)) {
    return Promise.reject(new Error('PDF extractor module not found on server'));
  }

  const args = [script, '--input', filePath, '--pages', pages, '--dpi', String(dpi)];
  if (!includeTables) args.push('--no-tables');
  if (!includeOcr) args.push('--no-ocr');

  return new Promise((resolve, reject) => {
    const proc = spawn(python, args, {
      cwd: EXTRACTOR_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('PDF extraction timed out (max 5 minutes)'));
    }, timeoutMs);

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Cannot run Python (${python}): ${err.message}`));
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        let msg = stderr.trim() || 'PDF extraction failed';
        try {
          const parsed = JSON.parse(stderr);
          if (parsed.error) msg = parsed.error;
        } catch {
          /* use raw stderr */
        }
        return reject(new Error(msg));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Invalid JSON from PDF extractor'));
      }
    });
  });
}

module.exports = { checkPythonAvailable, extractPdf, resolvePython, EXTRACTOR_ROOT };
