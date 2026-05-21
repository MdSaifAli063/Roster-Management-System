import api from './client';

async function downloadBlob(url, params, filename) {
  const response = await api.get(url, { params, responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function downloadRosterExcel(params) {
  return downloadBlob('/reports/roster', params, 'roster-report.xlsx');
}

export async function downloadRosterPdf(params) {
  return downloadBlob('/reports/roster-pdf', params, 'roster.pdf');
}

export async function downloadReportExport(type, params, format = 'xlsx') {
  const ext = format === 'pdf' ? 'pdf' : 'xlsx';
  return downloadBlob(`/reports/${type}/export`, { ...params, format }, `${type}-report.${ext}`);
}
