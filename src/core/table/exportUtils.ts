export function exportToCSV(data: Record<string, unknown>[], columns: { key: string; label: string; exportable?: boolean }[], filename = 'export.csv') {
  const exportableCols = columns.filter((c) => c.exportable !== false);
  const headers = exportableCols.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    exportableCols.map((c) => {
      const val = row[c.key];
      const str = val == null ? '' : String(val);
      return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename);
}

export function exportToExcel(data: Record<string, unknown>[], columns: { key: string; label: string; exportable?: boolean }[], filename = 'export.xlsx') {
  const exportableCols = columns.filter((c) => c.exportable !== false);
  const headers = exportableCols.map((c) => c.label).join('\t');
  const rows = data.map((row) =>
    exportableCols.map((c) => row[c.key] ?? '').join('\t')
  );
  const tsv = [headers, ...rows].join('\n');
  const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, filename.replace(/\.xlsx$/, '.xls'));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
