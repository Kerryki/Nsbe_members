/**
 * Escape a value for safe CSV inclusion
 * Wraps value in quotes and escapes internal quotes
 * @param {*} value
 * @returns {string}
 */
export function escapeCSV(value) {
  const str = String(value || '');
  // Wrap in quotes and escape internal quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} headers - Column headers
 * @returns {string} CSV content
 */
export function toCSV(data, headers) {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = data.map(row =>
    headers.map(h => escapeCSV(row[h])).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}
