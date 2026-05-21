const { query } = require('../db');
const { toExcelBuffer, toPdfBuffer } = require('../utils/reportExport');
const { formatCellDisplay } = require('../utils/rosterTime');

function formatTime(t) {
  if (!t) return '';
  return String(t).slice(0, 5);
}

function dayDisplay(r) {
  if (r.status === 'LEAVE') return 'Leave';
  if (r.status === 'WO') return 'Weekly Off';
  if (r.status === 'H' || r.status === 'PH') return 'PH';
  if (r.status === 'W' && r.shift_start && r.shift_end) {
    return (
      formatCellDisplay(r.shift_start, r.shift_end, r.break_minutes, r.total_hours) ||
      `${formatTime(r.shift_start)} – ${formatTime(r.shift_end)}`
    );
  }
  return r.status || '—';
}

async function fetchEmployeeRosterRows(empId, start_date, end_date) {
  const { rows } = await query(
    `SELECT r.roster_date, r.status, r.shift_start, r.shift_end, r.break_minutes, r.total_hours, s.shift_name
     FROM rosters r
     LEFT JOIN shifts s ON r.shift_id = s.id
     WHERE r.emp_id = $1 AND r.roster_date >= $2::date AND r.roster_date <= $3::date
     ORDER BY r.roster_date`,
    [empId, start_date, end_date]
  );
  return rows;
}

/**
 * Excel + PDF buffers for one employee's published roster period.
 */
async function buildEmployeeRosterAttachments({ empId, empName, empCode, start_date, end_date }) {
  const rows = await fetchEmployeeRosterRows(empId, start_date, end_date);
  const excelRows = rows.map((r) => ({
    Date: String(r.roster_date).slice(0, 10),
    Status: r.status,
    Shift: r.shift_name || '',
    Start: formatTime(r.shift_start),
    End: formatTime(r.shift_end),
    Break: Number(r.break_minutes) || 0,
    Hours: r.total_hours ?? '',
    Schedule: dayDisplay(r),
  }));

  const safeName = String(empCode || empName || 'employee').replace(/[^\w.-]/g, '_');
  const xlsx = toExcelBuffer(excelRows, 'My Roster');

  const pdfRows = excelRows.map((r) => ({
    Date: r.Date,
    Status: r.Status,
    Schedule: r.Schedule,
    Hours: r.Hours,
  }));
  const pdf = await toPdfBuffer(
    `${empName} — Roster ${start_date} to ${end_date}`,
    [
      { key: 'Date', label: 'Date' },
      { key: 'Status', label: 'Status' },
      { key: 'Schedule', label: 'Schedule' },
      { key: 'Hours', label: 'Hrs' },
    ],
    pdfRows
  );

  return [
    {
      filename: `roster-${safeName}.xlsx`,
      content: xlsx,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    {
      filename: `roster-${safeName}.pdf`,
      content: pdf,
      contentType: 'application/pdf',
    },
  ];
}

module.exports = { buildEmployeeRosterAttachments, dayDisplay };
