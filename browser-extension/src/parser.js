/**
 * Pre-Purchasing Assistant for UC Davis
 * Spreadsheet & CSV Ingestion Engine
 * Handles delimiter detection, quote invariants, smart column auto-detection,
 * missing field derivations (prices, ASINs, vendors), and irregular finance tables.
 */

// Column header matching dictionaries (exact regex and broader keyword regex)
const COLUMN_SYNONYMS = {
  name: [
    /^(item(\s*name)?|description|product(\s*name)?|title|part\s*description|item\s*desc)$/i,
    /description|product|title/i
  ],
  asin: [
    /^(asin|catalog(\s*#|\s*no\.?|\s*num(ber)?)?|part(\s*#|\s*no\.?|\s*num(ber)?)?|sku|model|item\s*#)$/i,
    /asin|catalog|part\s*#|sku|model/i
  ],
  qty: [
    /^(qty|quantity|count|units?|amount)$/i,
    /qty|quantity|count/i
  ],
  unitPrice: [
    /^(unit\s*price|price(\s*each)?|cost(\s*each)?|rate|unit\s*cost)$/i,
    /unit\s*price|cost\s*each|price\s*each/i
  ],
  totalPrice: [
    /^(total(\s*price)?|ext(ended)?\s*price|ext\s*cost|subtotal|total)$/i,
    /total|ext\s*price|extended/i
  ],
  url: [
    /^(link|url|web(\s*address)?|product\s*link|href|item\s*link)$/i,
    /url|link|href/i
  ],
  vendor: [
    /^(vendor|supplier|store|merchant|distributor|brand)$/i,
    /vendor|supplier|merchant|distributor/i
  ],
  notes: [
    /^(item\s*notes?|notes?|purpose(\s*description)?|comments?|reason)$/i,
    /notes?|purpose|comment/i
  ]
};

// Known vendor URL domain mappings
const KNOWN_VENDOR_DOMAINS = [
  { pattern: /amazon\./i, name: 'Amazon' },
  { pattern: /mcmaster\./i, name: 'McMaster-Carr' },
  { pattern: /grainger\./i, name: 'Grainger' },
  { pattern: /digikey\./i, name: 'DigiKey' },
  { pattern: /mouser\./i, name: 'Mouser' },
  { pattern: /fishersci\./i, name: 'Fisher Scientific' },
  { pattern: /vwr\./i, name: 'VWR' },
  { pattern: /sigmaaldrich\./i, name: 'Sigma-Aldrich' },
  { pattern: /thorlabs\./i, name: 'Thorlabs' },
  { pattern: /newark\./i, name: 'Newark' }
];

function inferVendorFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  for (const entry of KNOWN_VENDOR_DOMAINS) {
    if (entry.pattern.test(trimmed)) {
      return entry.name;
    }
  }

  // Fallback: extract domain name
  try {
    const parsedUrl = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
    const parts = host.split('.');
    if (parts.length > 0 && parts[0]) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  } catch (e) {
    // Non-fatal if invalid URL string
  }
  return '';
}

function extractCatalogNumberFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Amazon ASIN (e.g. /dp/B08BRJHJF9 or /gp/product/B08BRJHJF9)
  const asinMatch = trimmed.match(/(?:dp|gp\/product|product-reviews)\/([A-Z0-9]{10})/i);
  if (asinMatch) return asinMatch[1].toUpperCase();

  // McMaster-Carr catalog/part number (e.g. mcmaster.com/89205K161/ or /4974T226/)
  const mcmasterMatch = trimmed.match(/mcmaster\.com\/([0-9]+[A-Z0-9]+|[A-Z0-9]+[0-9]+[A-Z0-9]*)/i);
  if (mcmasterMatch && mcmasterMatch[1] && !['order', 'cart', 'help'].includes(mcmasterMatch[1].toLowerCase())) {
    return mcmasterMatch[1].toUpperCase();
  }

  return '';
}

function extractAsinFromUrl(url) {
  return extractCatalogNumberFromUrl(url);
}

function isCurrencyCell(val) {
  if (!val) return false;
  const t = String(val).trim();
  // Matches $ 25.44, $25.44, 25.44, $1,250.00, etc.
  return (/^\$?\s*\d+(?:,\d{3})*(?:\.\d{1,2})?$/.test(t) && (t.includes('$') || t.includes('.')))
      || (/^\$?\s*\d+\.\d{2}$/.test(t));
}

function cleanPriceNum(str) {
  if (str === null || str === undefined) return null;
  const s = String(str).trim();
  if (!s) return null;
  const cleaned = s.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
}

function isHeaderRow(row) {
  if (!row || row.length === 0) return false;
  let matches = 0;
  for (const cell of row) {
    const text = String(cell || '').trim();
    if (!text) continue;
    for (const [field, [exactRegex, broadRegex]] of Object.entries(COLUMN_SYNONYMS)) {
      if (exactRegex.test(text) || broadRegex.test(text)) {
        matches++;
        break;
      }
    }
  }
  // If at least 2 cells match common column synonyms (or 1 if table is 2-3 columns), it's a header
  const threshold = Math.min(2, Math.max(1, Math.floor(row.length / 2)));
  return matches >= threshold;
}

function mapHeaders(headerRow) {
  const mapping = {};
  const usedFields = new Set();

  // First pass: exact matches
  headerRow.forEach((col, idx) => {
    const text = String(col || '').trim();
    if (!text) return;
    for (const [field, [exactRegex]] of Object.entries(COLUMN_SYNONYMS)) {
      if (!usedFields.has(field) && exactRegex.test(text)) {
        mapping[field] = idx;
        usedFields.add(field);
        break;
      }
    }
  });

  // Second pass: broad matches for unassigned fields
  headerRow.forEach((col, idx) => {
    if (Object.values(mapping).includes(idx)) return;
    const text = String(col || '').trim();
    if (!text) return;
    for (const [field, [, broadRegex]] of Object.entries(COLUMN_SYNONYMS)) {
      if (!usedFields.has(field) && broadRegex.test(text)) {
        mapping[field] = idx;
        usedFields.add(field);
        break;
      }
    }
  });

  return mapping;
}

function inferHeaderlessMapping(rows) {
  if (!rows || rows.length === 0) return {};
  const numCols = Math.max(...rows.map(r => r.length));

  // Canonical standard 8-column format
  if (numCols >= 8) {
    return {
      name: 0,
      asin: 1,
      qty: 2,
      unitPrice: 3,
      totalPrice: 4,
      url: 5,
      vendor: 6,
      notes: 7
    };
  }

  // Content-based heuristic mapping for irregular tables
  const sample = rows.slice(0, 10);
  const mapping = {};
  const assignedCols = new Set();

  // 1. Detect URL column (>40% of non-empty cells contain http/https/www)
  for (let c = 0; c < numCols; c++) {
    const nonBlank = sample.map(r => r[c] || '').filter(val => val.trim().length > 0);
    if (nonBlank.length > 0) {
      const urlMatches = nonBlank.filter(val => /^https?:\/\/|www\./i.test(val.trim())).length;
      if (urlMatches / nonBlank.length >= 0.4) {
        mapping.url = c;
        assignedCols.add(c);
        break;
      }
    }
  }

  // 2. Detect ASIN column (>40% match standard 10-char alphanumeric ASIN format)
  for (let c = 0; c < numCols; c++) {
    if (assignedCols.has(c)) continue;
    const nonBlank = sample.map(r => r[c] || '').filter(val => val.trim().length > 0);
    if (nonBlank.length > 0) {
      const asinMatches = nonBlank.filter(val => /^B0[A-Z0-9]{8}$/i.test(val.trim())).length;
      if (asinMatches / nonBlank.length >= 0.4) {
        mapping.asin = c;
        assignedCols.add(c);
        break;
      }
    }
  }

  // 3. Detect Price columns (>50% currency format: $?digits.digits with decimal or $)
  const priceCols = [];
  for (let c = 0; c < numCols; c++) {
    if (assignedCols.has(c)) continue;
    const nonBlank = sample.map(r => r[c] || '').filter(val => val.trim().length > 0);
    if (nonBlank.length > 0) {
      const priceMatches = nonBlank.filter(isCurrencyCell).length;
      if (priceMatches / nonBlank.length >= 0.5) {
        priceCols.push(c);
        assignedCols.add(c);
      }
    }
  }

  if (priceCols.length === 1) {
    mapping.unitPrice = priceCols[0];
  } else if (priceCols.length >= 2) {
    mapping.unitPrice = priceCols[0];
    mapping.totalPrice = priceCols[1];
  }

  // 4. Detect Quantity column (>60% integer numbers under 10000, no currency symbols or decimals)
  for (let c = 0; c < numCols; c++) {
    if (assignedCols.has(c)) continue;
    const nonBlank = sample.map(r => r[c] || '').filter(val => val.trim().length > 0);
    if (nonBlank.length > 0) {
      const qtyMatches = nonBlank.filter(val => {
        const t = val.trim();
        const n = parseInt(t, 10);
        return /^\d{1,4}(\s*(ea|pcs|units?|box|pk|pack))?$/i.test(t) && !t.includes('$') && !t.includes('.') && !Number.isNaN(n) && n > 0 && n < 10000;
      }).length;
      if (qtyMatches / nonBlank.length >= 0.6) {
        mapping.qty = c;
        assignedCols.add(c);
        break;
      }
    }
  }

  // 5. Detect Vendor column (known vendor names or short title-case words)
  for (let c = 0; c < numCols; c++) {
    if (assignedCols.has(c)) continue;
    const nonBlank = sample.map(r => r[c] || '').filter(val => val.trim().length > 0);
    if (nonBlank.length > 0) {
      const vendorMatches = nonBlank.filter(val => {
        const v = val.trim().toLowerCase();
        return ['amazon', 'mcmaster', 'mcmaster-carr', 'mcmaster carr', 'grainger', 'digikey', 'mouser', 'vwr', 'fisher'].some(k => v.includes(k));
      }).length;
      if (vendorMatches / nonBlank.length >= 0.4) {
        mapping.vendor = c;
        assignedCols.add(c);
        break;
      }
    }
  }

  // 6. Remaining unassigned columns: first text column is name, subsequent is notes
  for (let c = 0; c < numCols; c++) {
    if (!assignedCols.has(c)) {
      if (mapping.name === undefined) {
        mapping.name = c;
        assignedCols.add(c);
      } else if (mapping.notes === undefined) {
        mapping.notes = c;
        assignedCols.add(c);
      }
    }
  }

  // Fallback defaults if still unmapped
  if (mapping.name === undefined) mapping.name = 0;
  // NOTE: Do NOT default mapping.qty = 1! If quantity is not present, it stays undefined so extractAndDeriveItem defaults each item to 1 safely.

  return mapping;
}

function extractAndDeriveItem(r, mapping) {
  const getVal = (field) => {
    const idx = mapping[field];
    return (idx !== undefined && r[idx] !== undefined) ? String(r[idx]).trim() : '';
  };

  const rawName = getVal('name');
  const rawAsin = getVal('asin');
  const rawQty = getVal('qty');
  const rawUnitPrice = getVal('unitPrice');
  const rawTotalPrice = getVal('totalPrice');
  const rawUrl = getVal('url');
  const rawVendor = getVal('vendor');
  const rawNotes = getVal('notes');

  // 1. Quantity: default to 1 if missing, invalid, or misidentified as price
  let qty = 1;
  if (rawQty) {
    const trimmed = String(rawQty).trim();
    if (!trimmed.includes('$') && !/\.\d{2}$/.test(trimmed)) {
      const parsedQty = parseInt(trimmed, 10);
      if (!Number.isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
      }
    }
  }

  // 2. Unit and Total Price Derivations
  let unitNum = cleanPriceNum(rawUnitPrice);
  let totalNum = cleanPriceNum(rawTotalPrice);

  if (unitNum === null && totalNum !== null) {
    // Missing unit price, derive: totalPrice / qty
    unitNum = Math.round((totalNum / qty) * 100) / 100;
  } else if (totalNum === null && unitNum !== null) {
    // Missing total price, derive: unitPrice * qty
    totalNum = Math.round((unitNum * qty) * 100) / 100;
  } else if (unitNum === null && totalNum === null) {
    unitNum = 0.0;
    totalNum = 0.0;
  }

  const unitPriceStr = unitNum.toFixed(2);
  const totalPriceStr = totalNum.toFixed(2);

  // 3. ASIN / Catalog # Derivation from URL if missing
  let asin = rawAsin;
  let url = rawUrl;
  if (!asin && url) {
    asin = extractCatalogNumberFromUrl(url);
  }

  // 4. Vendor Derivation from URL or normalization
  let vendor = rawVendor;
  if (!vendor && url) {
    vendor = inferVendorFromUrl(url);
  } else if (vendor) {
    if (/mcmaster(\s*carr)?/i.test(vendor)) {
      vendor = 'McMaster-Carr';
    } else if (/amazon/i.test(vendor)) {
      vendor = 'Amazon';
    }
  }

  const notes = rawNotes;

  return {
    name: rawName,
    asin: asin || '',
    qty: qty,
    unitPrice: unitPriceStr,
    totalPrice: totalPriceStr,
    url: url || '',
    vendor: vendor || '',
    notes: notes || '',
    purpose: notes || '' // Retain purpose for backwards-compatibility
  };
}

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

  // Determine if first row is a header
  const hasHeader = isHeaderRow(lines[0]);
  let mapping;
  let dataRows;

  if (hasHeader) {
    mapping = mapHeaders(lines[0]);
    dataRows = lines.slice(1);
  } else {
    mapping = inferHeaderlessMapping(lines);
    dataRows = lines;
  }

  const items = [];
  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    // Skip empty or trivial rows
    if (r.length === 0 || (r.length === 1 && !r[0])) continue;

    const item = extractAndDeriveItem(r, mapping);
    // Ignore rows that don't have a name and have 0 qty
    if (item.name || item.asin || item.url || parseFloat(item.unitPrice) > 0) {
      items.push(item);
    }
  }

  return items;
}

if (typeof window !== 'undefined') {
  window.COLUMN_SYNONYMS = COLUMN_SYNONYMS;
  window.inferVendorFromUrl = inferVendorFromUrl;
  window.extractAsinFromUrl = extractAsinFromUrl;
  window.extractCatalogNumberFromUrl = extractCatalogNumberFromUrl;
  window.isCurrencyCell = isCurrencyCell;
  window.isHeaderRow = isHeaderRow;
  window.mapHeaders = mapHeaders;
  window.inferHeaderlessMapping = inferHeaderlessMapping;
  window.extractAndDeriveItem = extractAndDeriveItem;
  window.parseCSV = parseCSV;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLUMN_SYNONYMS,
    inferVendorFromUrl,
    extractAsinFromUrl,
    extractCatalogNumberFromUrl,
    isCurrencyCell,
    isHeaderRow,
    mapHeaders,
    inferHeaderlessMapping,
    extractAndDeriveItem,
    parseCSV
  };
}
