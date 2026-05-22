const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const { authenticate, requireStaff } = require('../middleware/auth');
const { query } = require('../db');
const { checkPythonAvailable, extractPdf } = require('../services/pdfExtract');
const { checkFastApiHealth } = require('../services/pdfExtractHttp');
const { checkPlanLimit } = require('../middleware/planLimits');

const router = express.Router();
router.use(authenticate);
router.use(requireStaff);
router.use(checkPlanLimit('pdf_extractor'));

const uploadDir = path.join(os.tmpdir(), 'roster-pdf-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!ok) return cb(new Error('Only PDF files are allowed'));
    cb(null, true);
  },
});

router.get('/status', async (_req, res) => {
  try {
    const fastApi = await checkFastApiHealth();
    if (fastApi.ok) return res.json(fastApi);
    const status = await checkPythonAvailable();
    res.json({ ...status, fastapi: fastApi });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/extract', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'PDF file is required' });
  }

  const filePath = req.file.path;
  const pages = req.body.pages || 'all';
  const includeTables = req.body.includeTables !== 'false';
  const includeOcr = req.body.includeOcr === 'true';
  const dpi = Math.min(300, Math.max(100, Number(req.body.dpi) || 200));

  try {
    const data = await extractPdf(filePath, {
      pages,
      includeTables,
      includeOcr,
      dpi,
    });
    let job_id = null;
    try {
      const { rows } = await query(
        `INSERT INTO pdf_extract_jobs (filename, status, extracted_fields, created_by)
         VALUES ($1, 'review', $2::jsonb, $3) RETURNING id`,
        [req.file.originalname, JSON.stringify(data.invoice_fields || {}), req.user.id]
      );
      job_id = rows[0]?.id;
    } catch (jobErr) {
      console.warn('pdf_extract_jobs insert skipped:', jobErr.message);
    }
    res.json({ ...data, job_id, invoice_fields: data.invoice_fields || {} });
  } catch (err) {
    console.error('PDF extract error:', err.message);
    res.status(500).json({ error: err.message || 'PDF extraction failed' });
  } finally {
    fs.unlink(filePath, () => {});
  }
});

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 50 MB)' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
