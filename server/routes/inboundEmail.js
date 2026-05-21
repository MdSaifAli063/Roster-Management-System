const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { extractPdf } = require('../services/pdfExtract');

const router = express.Router();

/**
 * Inbound email webhook (Postmark / Mailgun).
 * POST /api/inbound/pdf with header x-inbound-secret = INBOUND_EMAIL_SECRET
 */
router.post('/pdf', express.json({ limit: '25mb' }), async (req, res) => {
  let filePath = null;
  try {
    const secret = process.env.INBOUND_EMAIL_SECRET;
    if (secret && req.headers['x-inbound-secret'] !== secret) {
      return res.status(401).json({ error: 'Invalid inbound secret' });
    }

    const attachment =
      req.body?.attachment ||
      req.body?.Attachments?.[0] ||
      req.body?.attachments?.[0];
    const base64 = attachment?.Content || attachment?.content || req.body?.pdf_base64;
    if (!base64) {
      return res.status(400).json({ error: 'No PDF attachment (Content / pdf_base64)' });
    }

    filePath = path.join(os.tmpdir(), `inbound-${Date.now()}.pdf`);
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    const data = await extractPdf(filePath, { includeTables: true, includeOcr: true });
    res.json({ ok: true, extracted: data });
  } catch (err) {
    console.error('inbound/pdf', err);
    res.status(500).json({ error: err.message || 'Inbound extract failed' });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

module.exports = router;
