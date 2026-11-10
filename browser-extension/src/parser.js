/**
 * Pre-Purchasing Assistant for UC Davis
 * Spreadsheet & CSV Ingestion Engine
 */

function parseCSV(text) {
  if (!text || typeof text !== 'string') return [];

  // Auto-detect delimiter: tabs (TSV / Google Sheets / Excel copy-paste) vs commas (CSV)
  const sampleLines = text.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 5);
  let delimiter = ',';
  if (sampleLines.length > 0) {
    const tabLines = sampleLines.filter(l => l.includes('\t')).length;
    if (tabLines >= Math.ceil(sampleLines.length / 2)) {
      delimiter = '\t';
    }
  }

  const lines = [];
  let row = [];
  let inQuotes = false;
  let token = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (!inQuotes) {
        // Enter quote mode if quote is at the beginning of the field
        if (token.trim().length === 0) {
          token = '';
          inQuotes = true;
        } else {
          // Literal quote inside an unquoted field (e.g. 12" Ruler or (12.5"x12.5"))
          token += '"';
        }
      } else {
        // Inside quoted field: check for escaped quote ("") or closing quote
        if (nextChar === '"') {
          token += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(token.trim());
      token = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(token.trim());
      token = '';
      if (row.length > 0 && row.some(col => col.length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      token += char;
    }
  }

  if (token.length > 0 || row.length > 0) {
    row.push(token.trim());
    if (row.some(col => col.length > 0)) {
      lines.push(row);
    }
  }

  if (lines.length === 0) return [];

  // Check if first line is a header
  let startIndex = 0;
  const firstRowStr = lines[0].join(' ').toLowerCase();
  if (firstRowStr.includes('item name') || firstRowStr.includes('asin') || firstRowStr.includes('description')) {
    startIndex = 1;
  }

  const items = [];
  for (let i = startIndex; i < lines.length; i++) {
    const r = lines[i];
    if (r.length < 2) continue;

    const cleanPrice = (val) => {
      if (!val) return '0.00';
      return val.replace(/[^0-9.]/g, '') || '0.00';
    };

    const item = {
      name: r[0] || '',
      asin: r[1] || '',
      qty: parseInt(r[2], 10) || 1,
      unitPrice: cleanPrice(r[3]),
      totalPrice: cleanPrice(r[4]),
      url: r[5] || '',
      vendor: r[6] || '',
      purpose: r[7] || ''
    };

    items.push(item);
  }

  return items;
}

if (typeof window !== 'undefined') {
  window.parseCSV = parseCSV;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseCSV };
}
