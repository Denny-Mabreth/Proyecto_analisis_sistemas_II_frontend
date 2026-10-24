export * from './excelExport';

/**
 * Utilidad para exportar datos tabulares a formato CSV y detonar la descarga en el navegador.
 * Agrega el byte order mark UTF-8 (\uFEFF) para garantizar la compatibilidad con tildes,
 * eñes y caracteres especiales en Microsoft Excel y otras hojas de cálculo.
 */
export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void => {
  const formatCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) {
      return '""';
    }
    const str = String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const headerLine = headers.map(formatCell).join(',');
  const rowLines = rows.map(row => row.map(formatCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', finalFilename);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
