import * as XLSX from 'xlsx-js-style';

const BORDER_COLOR = { rgb: 'D9D9D9' };
const THIN_BORDER = {
  top: { style: 'thin', color: BORDER_COLOR },
  bottom: { style: 'thin', color: BORDER_COLOR },
  left: { style: 'thin', color: BORDER_COLOR },
  right: { style: 'thin', color: BORDER_COLOR },
};

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12, name: 'Calibri' },
  fill: { patternType: 'solid', fgColor: { rgb: '007030' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: THIN_BORDER,
};

const BODY_STYLE = {
  font: { sz: 11, name: 'Calibri' },
  alignment: { vertical: 'center', wrapText: true },
  border: THIN_BORDER,
};

const BODY_STYLE_ALT = {
  ...BODY_STYLE,
  fill: { patternType: 'solid', fgColor: { rgb: 'F2FCF5' } },
};

/**
 * Exporta datos tabulares a un archivo nativo de Microsoft Excel (.xlsx).
 * Aplica encabezado con color de marca, filas alternadas, bordes finos,
 * fila de encabezado congelada, autofiltro y ancho de columnas automático.
 */
export const downloadExcel = (
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void => {
  const cleanRows = rows.map(row =>
    row.map(cell => (cell === null || cell === undefined ? '' : cell))
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...cleanRows]);

  // Estilos de encabezado y cuerpo
  headers.forEach((_, c) => {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    if (worksheet[ref]) worksheet[ref].s = HEADER_STYLE;
  });
  cleanRows.forEach((row, r) => {
    row.forEach((_, c) => {
      const ref = XLSX.utils.encode_cell({ r: r + 1, c });
      if (worksheet[ref]) worksheet[ref].s = r % 2 === 1 ? BODY_STYLE_ALT : BODY_STYLE;
    });
  });

  // Auto-ajustar anchos de columnas según la longitud del contenido
  worksheet['!cols'] = headers.map((header, colIndex) => {
    let maxLen = header.length;
    for (const row of cleanRows) {
      const len = String(row[colIndex] ?? '').length;
      if (len > maxLen) maxLen = len;
    }
    return { wch: Math.min(Math.max(maxLen + 4, 12), 65) };
  });

  worksheet['!rows'] = [{ hpt: 24 }];
  worksheet['!views'] = [{ state: 'frozen', ySplit: 1 }];
  if (cleanRows.length > 0) {
    worksheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: cleanRows.length, c: headers.length - 1 },
      }),
    };
  }

  const workbook = XLSX.utils.book_new();
  const safeSheetName = (sheetName || 'Reporte')
    .replace(/[*?:/\\\[\]]/g, '')
    .substring(0, 31);

  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, finalFilename);
};

/**
 * Genera un sufijo de fecha estándar (YYYY-MM-DD) para nombres de archivo.
 */
export const getFormattedDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
