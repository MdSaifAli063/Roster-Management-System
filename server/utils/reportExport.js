const XLSX = require('xlsx');

/** Build xlsx buffer from array of row objects */
function toExcelBuffer(rows, sheetName = 'Report') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ note: 'No data' }]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Simple PDF table (no Puppeteer — works on Cloud Run).
 * Returns Buffer of PDF bytes.
 */
function toPdfBuffer(title, columns, rows) {
  // eslint-disable-next-line global-require
  const PDFDocument = require('pdfkit');
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(title, { underline: true });
    doc.moveDown();
    doc.fontSize(9);

    const header = columns.map((c) => c.label).join('  |  ');
    doc.font('Helvetica-Bold').text(header);
    doc.font('Helvetica');
    doc.moveDown(0.5);

    for (const row of rows.slice(0, 500)) {
      const line = columns.map((c) => String(row[c.key] ?? '')).join('  |  ');
      doc.text(line);
    }
    if (!rows.length) doc.text('No data for selected period.');
    doc.end();
  });
}

module.exports = { toExcelBuffer, toPdfBuffer };
