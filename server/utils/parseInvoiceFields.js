/** Normalize PDF-extracted invoice fields for PostgreSQL insert */

function parseAmount(val) {
  if (val == null || val === '') return null;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDate(val) {
  if (!val || !String(val).trim()) return null;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  const m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (m) {
    const d2 = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
    if (!Number.isNaN(d2.getTime())) return d2.toISOString().slice(0, 10);
  }
  return null;
}

function normalizeFinanceFields(fields = {}) {
  const subtotal = parseAmount(fields.subtotal ?? fields.amount_ex_gst);
  const gst = parseAmount(fields.gst ?? fields.gst_amount);
  let total = parseAmount(fields.total ?? fields.total_inc_gst);
  if (total == null && subtotal != null && gst != null) {
    total = Math.round((subtotal + gst) * 100) / 100;
  }
  if (total == null && subtotal != null) total = subtotal;

  return {
    supplier: fields.supplier?.trim() || 'Unknown supplier',
    invoice_number: fields.invoice_number?.trim() || null,
    invoice_date: parseDate(fields.invoice_date),
    due_date: parseDate(fields.due_date),
    amount_ex_gst: subtotal,
    gst_amount: gst,
    total_inc_gst: total ?? 0,
    line_items: Array.isArray(fields.line_items) ? fields.line_items : [],
    category: fields.category?.trim() || 'General',
  };
}

module.exports = { parseAmount, parseDate, normalizeFinanceFields };
