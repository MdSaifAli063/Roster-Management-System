const express = require('express');
const { query } = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');
const { normalizeFinanceFields } = require('../utils/parseInvoiceFields');

const router = express.Router();
router.use(authenticate);

router.get('/invoices', requireEmployer, async (req, res) => {
  try {
    const { category, supplier, status, from, to } = req.query;
    const conditions = ['1=1'];
    const params = [];
    let i = 1;
    if (category?.trim()) { conditions.push(`category = $${i++}`); params.push(category); }
    if (supplier?.trim()) { conditions.push(`supplier ILIKE $${i++}`); params.push(`%${supplier}%`); }
    if (status?.trim()) { conditions.push(`status = $${i++}`); params.push(status); }
    if (from?.trim()) { conditions.push(`invoice_date >= $${i++}`); params.push(from); }
    if (to?.trim()) { conditions.push(`invoice_date <= $${i++}`); params.push(to); }

    const { rows } = await query(
      `SELECT * FROM finance_invoices WHERE ${conditions.join(' AND ')} ORDER BY due_date ASC NULLS LAST`,
      params
    );
    const today = new Date().toISOString().slice(0, 10);
    const enriched = rows.map((r) => {
      let st = r.status;
      if (st === 'UNPAID' && r.due_date && r.due_date < today) st = 'OVERDUE';
      return { ...r, display_status: st };
    });
    res.json(enriched);
  } catch (err) {
    console.error('finance/invoices', err);
    res.json([]);
  }
});

router.post('/invoices', requireEmployer, async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO finance_invoices (supplier, invoice_number, invoice_date, due_date, category,
        amount_ex_gst, gst_amount, total_inc_gst, status, line_items, source, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        b.supplier,
        b.invoice_number,
        b.invoice_date,
        b.due_date,
        b.category || 'General',
        b.amount_ex_gst,
        b.gst_amount,
        b.total_inc_gst,
        b.status || 'UNPAID',
        JSON.stringify(b.line_items || []),
        b.source || 'manual',
        req.user.id,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.post('/from-extract', requireEmployer, async (req, res) => {
  try {
    const { fields, job_id } = req.body;
    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'fields object is required' });
    }

    const norm = normalizeFinanceFields(fields);

    const { rows } = await query(
      `INSERT INTO finance_invoices (supplier, invoice_number, invoice_date, due_date, category,
        amount_ex_gst, gst_amount, total_inc_gst, line_items, source, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,'pdf_extract',$10,'UNPAID') RETURNING *`,
      [
        norm.supplier,
        norm.invoice_number,
        norm.invoice_date,
        norm.due_date,
        norm.category,
        norm.amount_ex_gst,
        norm.gst_amount,
        norm.total_inc_gst,
        JSON.stringify(norm.line_items),
        req.user.id,
      ]
    );

    if (job_id) {
      try {
        await query(
          `UPDATE pdf_extract_jobs SET status = 'confirmed', finance_invoice_id = $1 WHERE id = $2`,
          [rows[0].id, job_id]
        );
      } catch (jobErr) {
        console.warn('pdf_extract_jobs update skipped:', jobErr.message);
      }
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('finance/from-extract', err);
    res.status(500).json({
      error: process.env.NODE_ENV !== 'production' ? err.message : 'Failed to save invoice from extract',
    });
  }
});

router.get('/reports/summary', requireEmployer, async (req, res) => {
  try {
    const { rows: paid } = await query(
      `SELECT DATE_TRUNC('month', invoice_date) AS month, SUM(total_inc_gst) AS total
       FROM finance_invoices WHERE status = 'PAID' GROUP BY 1 ORDER BY 1`
    );
    const { rows: due } = await query(
      `SELECT DATE_TRUNC('month', due_date) AS month, SUM(total_inc_gst) AS total
       FROM finance_invoices WHERE status IN ('UNPAID', 'OVERDUE') GROUP BY 1 ORDER BY 1`
    );
    const { rows: byCat } = await query(
      `SELECT category, SUM(total_inc_gst) AS total FROM finance_invoices GROUP BY category`
    );
    res.json({ paid_by_month: paid, due_by_month: due, by_category: byCat, salary_feed: null });
  } catch (err) {
    console.error('finance/summary', err);
    res.json({ paid_by_month: [], due_by_month: [], by_category: [], salary_feed: null });
  }
});

router.patch('/invoices/:id', requireEmployer, async (req, res) => {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE finance_invoices SET
        supplier = COALESCE($1, supplier),
        status = COALESCE($2, status),
        category = COALESCE($3, category),
        updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [b.supplier, b.status, b.category, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
