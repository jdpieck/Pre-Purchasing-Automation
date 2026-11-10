/**
 * Pre-Purchasing Assistant for UC Davis
 * Content Script / Userscript Core Engine
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__ucd_prepurchasing_autofill_injected) return;
  window.__ucd_prepurchasing_autofill_injected = true;

  // Generic default settings (clean of personal info so any lab member can use it)
  const DEFAULT_SETTINGS = {
    deliverTo: "",
    phone: "",
    email: "",
    addressKeyword: "Ghausi Hall",
    addressText: "",
    requestType: "Purchasing",
    approver: "",
    approverKeyword: "",
    accountManager: "anymanager",
    dateOffsetDays: 7,
    shippingType: "ST",
    allowBackorder: false,
    unit: "EA", // Each
    defaultJustification: ""
  };

  const STORAGE_KEY = "ucd_prepurchasing_settings_v1";

  // Lucide SVG Icons with accessible attributes
  const ICONS = {
    zap: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="AutoFill"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    help: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Help"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Close"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    upload: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Upload"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>`,
    package: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Package"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>`,
    building: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
    dollar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Dollar"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    save: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>`,
    clear: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Clear"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    mail: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    github: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="GitHub"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Clear File"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    fileText: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="File"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
    clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Clipboard"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`
  };

  function getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not read from localStorage, using defaults", e);
    }
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }
  }

  // --- CSV & Spreadsheet Parser ---
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

  // --- Date Calculation Helper ---
  function getFutureDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + (offsetDays || 7));
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // --- DOM Interaction Helpers ---
  function setInputValue(el, val) {
    if (!el) return;
    const valueSetter = Object.getOwnPropertyDescriptor(el, 'value')?.set;
    const prototype = Object.getPrototypeOf(el);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(el, val);
    } else if (valueSetter) {
      valueSetter.call(el, val);
    } else {
      el.value = val;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
  }

  function setSelectValue(select, targetValOrKeyword) {
    if (!select || !targetValOrKeyword) return null;
    const target = (targetValOrKeyword || '').toLowerCase().trim();
    let matchedOption = null;

    // Direct value match first
    for (const opt of select.options) {
      if (opt.value.toLowerCase() === target) {
        matchedOption = opt;
        break;
      }
    }

    // Substring in text match
    if (!matchedOption) {
      for (const opt of select.options) {
        if (opt.text.toLowerCase().includes(target)) {
          matchedOption = opt;
          break;
        }
      }
    }

    // Keyword match
    if (!matchedOption && target.length > 3) {
      for (const opt of select.options) {
        const optText = opt.text.toLowerCase();
        const words = target.split(/\s+/);
        if (words.some(w => w.length > 2 && optText.includes(w))) {
          matchedOption = opt;
          break;
        }
      }
    }

    if (matchedOption) {
      select.value = matchedOption.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));

      // Update jQuery Chosen if present
      if (window.jQuery) {
        window.jQuery(select).trigger('chosen:updated').trigger('liszt:updated').trigger('change');
      }

      // Directly update Chosen DOM span if present
      const chznSpan = document.querySelector(`#${select.id}_chzn .chzn-single span`);
      if (chznSpan) {
        chznSpan.textContent = matchedOption.text;
      }

      return matchedOption.text;
    }

    return null;
  }

  // --- Robust Backorder / tzCheckBox State Manager ---
  function setBackorderState(allow) {
    const checkbox = document.querySelector('input[name="backorder"]');
    if (!checkbox) return;

    const wantChecked = !!allow;
    const container = checkbox.closest('.tzCheckBox-Container') || checkbox.parentElement;
    const tzSpan = container ? container.querySelector('.tzCheckBox') : null;
    const tzContent = container ? container.querySelector('.tzCBContent') : null;

    if (tzSpan) {
      const isCurrentlyChecked = tzSpan.classList.contains('checked');
      if (isCurrentlyChecked !== wantChecked) {
        // Trigger tzCheckbox's click handler to toggle state cleanly
        tzSpan.click();
      }

      // Explicitly enforce state and classes without firing change event on checkbox
      // (Firing change on checkbox triggers tzCheckbox's reverse-toggle handler)
      if (wantChecked) {
        tzSpan.classList.add('checked');
        if (tzContent) tzContent.textContent = 'Yes';
        checkbox.checked = true;
        checkbox.setAttribute('checked', 'checked');
      } else {
        tzSpan.classList.remove('checked');
        if (tzContent) tzContent.textContent = 'No';
        checkbox.checked = false;
        checkbox.removeAttribute('checked');
      }
    } else {
      // Standard checkbox fallback when tzCheckbox is not present
      checkbox.checked = wantChecked;
      if (wantChecked) {
        checkbox.setAttribute('checked', 'checked');
      } else {
        checkbox.removeAttribute('checked');
      }
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Row Cloning Fallback Helper ---
  function cloneLineItemRow(newIndex) {
    const tbody = document.querySelector('#line-items tbody') || document.getElementById('line-items-body');
    if (!tbody) return;
    const baseRow = tbody.querySelector('tr.line-item-row');
    const baseDetails = tbody.querySelector('tr.line-item-details');
    if (!baseRow) return;

    const newRow = baseRow.cloneNode(true);
    newRow.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.name) el.name = el.name.replace(/items\[\d+\]/, `items[${newIndex}]`);
      if (el.id && el.id.startsWith('units_')) el.id = `units_${newIndex}`;
      el.value = '';
    });

    tbody.appendChild(newRow);

    if (baseDetails) {
      const newDetails = baseDetails.cloneNode(true);
      newDetails.style.display = '';
      newDetails.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.name) el.name = el.name.replace(/items\[\d+\]/, `items[${newIndex}]`);
        el.value = '';
      });
      tbody.appendChild(newDetails);
    }
  }

  // --- Main Form Filling Engine ---
  async function fillPrePurchasingForm(items, settings, onProgress) {
    const log = (msg, type = 'info') => {
      console.log(`[AutoFill] ${msg}`);
      if (onProgress) onProgress(msg, type);
    };

    if (!items || items.length === 0) {
      log("No items found in CSV data to fill.", 'error');
      return;
    }

    log("Starting form autofill sequence...", 'info');

    // 1. Justification & Business Purpose
    const justificationText = items[0].purpose || settings.defaultJustification || "";
    const justEl = document.querySelector('textarea[name="justification"]');
    if (justEl && justificationText) {
      setInputValue(justEl, justificationText);
      log("✓ Justification populated");
    }

    const reqTypeSel = document.getElementById('requestType') || document.querySelector('select[name="requestType"]');
    if (reqTypeSel) {
      setSelectValue(reqTypeSel, settings.requestType || 'Purchasing');
    }

    const busPurpEl = document.querySelector('textarea[name="businessPurpose"]');
    if (busPurpEl && justificationText) {
      setInputValue(busPurpEl, justificationText);
      log("✓ Business purpose populated");
    }

    // 2. Vendor Dropdown
    const vendorName = items[0].vendor || 'Amazon';
    const vendorSel = document.getElementById('vendor') || document.querySelector('select[name="vendor"]');
    if (vendorSel) {
      const matched = setSelectValue(vendorSel, vendorName);
      if (matched) {
        log(`✓ Vendor matched: ${matched}`);
      } else {
        log(`⚠️ Could not match vendor "${vendorName}". Please select vendor manually.`, 'error');
      }
    }

    // 3. Shipping Address
    const shipToEl = document.querySelector('input[name="shipTo"]');
    if (shipToEl && settings.deliverTo) setInputValue(shipToEl, settings.deliverTo);

    const shipPhoneEl = document.querySelector('input[name="shipPhone"]');
    if (shipPhoneEl && settings.phone) setInputValue(shipPhoneEl, settings.phone);

    const shipEmailEl = document.querySelector('input[name="shipEmail"]');
    if (shipEmailEl && settings.email) setInputValue(shipEmailEl, settings.email);

    const shipAddressSel = document.getElementById('shipAddress') || document.querySelector('select[name="shipAddress"]');
    if (shipAddressSel && (settings.addressKeyword || settings.addressText)) {
      const matchedAddr = setSelectValue(shipAddressSel, settings.addressKeyword || settings.addressText);
      if (matchedAddr) {
        log(`✓ Shipping address matched`);
      } else {
        log(`⚠️ Shipping address dropdown match not found.`, 'error');
      }
    }

    // 4. Order Details (Approver & Account Manager)
    const approverRadio = document.getElementById('approver');
    if (approverRadio) {
      approverRadio.checked = true;
      approverRadio.click();
      approverRadio.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(100);
    }

    const approverSel = document.getElementById('approvers') || document.querySelector('select[name="approvers"]');
    if (approverSel && (settings.approver || settings.approverKeyword)) {
      setSelectValue(approverSel, settings.approver || settings.approverKeyword);
      log(`✓ Approver selected`);
    }

    const acctMgrSel = document.getElementById('accountmanagers') || document.querySelector('select[name="accountmanagers"]');
    if (acctMgrSel) {
      setSelectValue(acctMgrSel, settings.accountManager || 'anymanager');
      log(`✓ Account manager selected`);
    }

    // 5. Order Preferences
    const dateNeededEl = document.querySelector('input[name="dateNeeded"]') || document.querySelector('#order-preferences-section input[type="text"]');
    if (dateNeededEl) {
      const dateStr = getFutureDate(settings.dateOffsetDays || 7);
      setInputValue(dateNeededEl, dateStr);
      log(`✓ Date needed set to ${dateStr}`);
    }

    const shipTypeSel = document.getElementById('shippingType') || document.querySelector('select[name="shippingType"]');
    if (shipTypeSel) {
      setSelectValue(shipTypeSel, settings.shippingType || 'ST');
      log(`✓ Shipping type set`);
    }

    // Backorder setting (handles tzCheckBox cleanly)
    setBackorderState(settings.allowBackorder);
    log(`✓ Backorder set to ${settings.allowBackorder ? 'Yes' : 'No'}`);

    // 6. Line Items
    log(`Populating ${items.length} line items...`);
    const addLineBtn = document.getElementById('add-line-item');

    // Ensure enough rows exist
    let currentRows = document.querySelectorAll('#line-items tbody tr.line-item-row');
    let neededRows = items.length - currentRows.length;
    let attempts = 0;

    while (neededRows > 0 && attempts < 50) {
      const prevCount = currentRows.length;
      if (addLineBtn) {
        addLineBtn.click();
        await sleep(50);
      }
      currentRows = document.querySelectorAll('#line-items tbody tr.line-item-row');

      // If click didn't add a row (e.g. offline mock or unbound), clone the row as fallback
      if (currentRows.length === prevCount) {
        cloneLineItemRow(prevCount);
        currentRows = document.querySelectorAll('#line-items tbody tr.line-item-row');
      }

      neededRows = items.length - currentRows.length;
      attempts++;
    }

    // Populate each row
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      log(`Filling item ${i + 1}/${items.length}: ${item.name.substring(0, 30)}...`);

      // Quantity
      const qtyEl = document.querySelector(`input[name="items[${i}].quantity"]`);
      if (qtyEl) setInputValue(qtyEl, String(item.qty));

      // Units (Default: Each)
      const unitSel = document.querySelector(`select[name="items[${i}].units"]`) || document.getElementById(`units_${i}`);
      if (unitSel) {
        setSelectValue(unitSel, settings.unit || 'EA');
      }

      // Catalog # / ASIN
      const catEl = document.querySelector(`input[name="items[${i}].catalogNumber"]`);
      if (catEl) setInputValue(catEl, item.asin);

      // Description
      const descEl = document.querySelector(`input[name="items[${i}].description"]`);
      if (descEl) setInputValue(descEl, item.name);

      // Unit Price
      const priceEl = document.querySelector(`input[name="items[${i}].price"]`);
      if (priceEl) setInputValue(priceEl, item.unitPrice);

      // Expand line item details by clicking comment balloon icon
      const row = qtyEl ? qtyEl.closest('tr.line-item-row') : null;
      if (row) {
        const toggleBtn = row.querySelector('a.toggle-line-item-details');
        const nextRow = row.nextElementSibling;
        if (toggleBtn) {
          toggleBtn.click();
          await sleep(20);
        }
        if (nextRow && nextRow.classList.contains('line-item-details')) {
          nextRow.style.display = '';
        }
      }

      // Fill URL
      const urlEl = document.querySelector(`input[name="items[${i}].url"]`);
      if (urlEl && item.url) {
        setInputValue(urlEl, item.url);
      }

      // Fill Item Notes (Purpose description)
      const notesEl = document.querySelector(`textarea[name="items[${i}].notes"]`);
      if (notesEl && item.purpose) {
        setInputValue(notesEl, item.purpose);
      }
    }

    log(`Success! All ${items.length} items and order details populated. Please review the form before submitting.`, 'success');
  }

  // --- UI Component (Injected Drawer) ---
  function injectUI() {
    if (document.getElementById('ucd-autofill-root')) return;

    let currentParsedItems = [];
    let currentFileName = "";
    let settings = getSettings();
    const isFirstTimeUser = !localStorage.getItem(STORAGE_KEY) || !settings.deliverTo;

    const root = document.createElement('div');
    root.id = 'ucd-autofill-root';

    root.innerHTML = `
      <!-- Launcher Button -->
      <div id="ucd-autofill-launcher" title="Click to open Pre-Purchasing Assistant (Beta)">
        <span class="launcher-icon">${ICONS.zap}</span>
        <span>AutoFill Order</span>
        <span class="ucd-launcher-beta-tag">Beta</span>
      </div>

      <!-- Main Panel Drawer (Fixed height to prevent vertical jumping!) -->
      <div id="ucd-autofill-panel" class="hidden">
        <div class="ucd-panel-header">
          <div class="title-group">
            <span class="title-icon">${ICONS.zap}</span>
            <h3>Pre-Purchasing Assistant for UC Davis <span class="ucd-beta-badge">Beta</span></h3>
          </div>
          <div class="ucd-header-actions">
            <button class="ucd-header-btn" id="ucd-minimize-btn" title="Close Panel">${ICONS.x}</button>
          </div>
        </div>

        <div class="ucd-panel-tabs">
          <button class="ucd-tab-btn active" data-tab="import" id="tab-btn-import">
            <span class="tab-icon">${ICONS.zap}</span>
            <span>Import Order</span>
          </button>
          <button class="ucd-tab-btn" data-tab="settings" id="tab-btn-settings">
            <span class="tab-icon">${ICONS.settings}</span>
            <span>Settings</span>
          </button>
          <button class="ucd-tab-btn" data-tab="help" id="tab-btn-help">
            <span class="tab-icon">${ICONS.help}</span>
            <span>Help</span>
          </button>
        </div>

        <div class="ucd-panel-body">
          <!-- TAB 1: Import Order -->
          <div class="ucd-tab-content active" id="tab-import">
            <!-- First-time setup notification banner -->
            <div class="ucd-onboarding-banner" id="ucd-onboarding-banner" style="${isFirstTimeUser ? '' : 'display:none;'}">
              <div class="ucd-onboarding-header">
                ${ICONS.info}
                <span>First-Time Setup Required</span>
              </div>
              <div>Please enter your Name, Email, and Approver in the <b>Settings</b> tab so your orders can be routed automatically.</div>
              <button class="ucd-btn ucd-btn-primary ucd-onboarding-btn" id="ucd-goto-settings-btn">Go to Settings →</button>
            </div>

            <!-- Import Source Selector & Input Area (Visible before data loaded) -->
            <div class="ucd-import-input-container" id="ucd-import-input-container">
              <!-- Segmented Subtabs: Upload CSV vs Paste Spreadsheet -->
              <div class="ucd-import-subtabs">
                <button type="button" class="ucd-subtab-btn active" id="subtab-upload-btn" data-subtab="upload">
                  <span class="subtab-icon">${ICONS.upload}</span>
                  <span>Upload CSV</span>
                </button>
                <button type="button" class="ucd-subtab-btn" id="subtab-paste-btn" data-subtab="paste">
                  <span class="subtab-icon">${ICONS.clipboard}</span>
                  <span>Paste Spreadsheet</span>
                </button>
              </div>

              <!-- Subview 1: Dropzone File Upload -->
              <div class="ucd-subview" id="ucd-subview-upload">
                <div class="ucd-dropzone" id="ucd-dropzone">
                  <div class="dropzone-icon">${ICONS.upload}</div>
                  <div class="dropzone-title">Drop your CSV order file here</div>
                  <div class="dropzone-desc">or click to browse from your computer</div>
                  <div class="dropzone-subhint">Tip: You can also press <b>Ctrl+V</b> anytime to paste spreadsheet rows</div>
                  <input type="file" id="ucd-csv-file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" style="display:none;" />
                </div>
              </div>

              <!-- Subview 2: Direct Paste Area -->
              <div class="ucd-subview" id="ucd-subview-paste" style="display: none;">
                <div class="ucd-paste-container">
                  <textarea id="ucd-paste-input" class="ucd-paste-textarea" placeholder="Copy rows from Google Sheets or Excel and paste here (Ctrl+V)...&#10;&#10;Supports 8 columns:&#10;Item Name | ASIN | Qty | Unit Price | Total Price | Link | Vendor | Purpose"></textarea>
                  <div class="ucd-paste-actions">
                    <button type="button" class="ucd-btn ucd-btn-primary" id="ucd-parse-paste-btn">
                      ${ICONS.zap}
                      <span>Parse Pasted Items</span>
                    </button>
                    <button type="button" class="ucd-btn ucd-btn-secondary" id="ucd-read-clipboard-btn" title="Paste directly from clipboard">
                      ${ICONS.clipboard}
                      <span>Paste from Clipboard</span>
                    </button>
                    <button type="button" class="ucd-btn ucd-btn-secondary" id="ucd-clear-paste-btn" title="Clear paste box">
                      ${ICONS.trash}
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Compact Uploaded File Bar (Visible after file upload) -->
            <div class="ucd-file-active-card" id="ucd-file-active-card" style="display: none;">
              <div class="ucd-file-active-info">
                <span class="ucd-file-active-icon" id="ucd-active-file-icon">${ICONS.fileText}</span>
                <span class="ucd-file-name" id="ucd-active-file-name">file.csv</span>
              </div>
              <div class="ucd-file-actions">
                <button class="ucd-clear-btn" id="ucd-clear-file-btn" title="Clear file and start over">
                  ${ICONS.trash}
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <!-- Summary & Preview Section (Fills remaining height!) -->
            <div id="ucd-summary-section" style="display: none;">
              <div class="ucd-summary-badges">
                <span class="ucd-badge blue" id="badge-count">${ICONS.package} 0 Items</span>
                <span class="ucd-badge gold" id="badge-vendor">${ICONS.building} None</span>
                <span class="ucd-badge green" id="badge-total">${ICONS.dollar} $0.00</span>
              </div>

              <div class="ucd-preview-card">
                <div class="ucd-preview-header">
                  <span>Parsed Items Preview</span>
                  <span id="preview-item-tally">0 items</span>
                </div>
                <div class="ucd-preview-list" id="ucd-preview-list"></div>
              </div>

              <button class="ucd-autofill-btn" id="ucd-execute-btn">
                ${ICONS.zap}
                <span>AutoFill Order Form</span>
              </button>
            </div>

            <div class="ucd-status-box" id="ucd-status-box"></div>
          </div>

          <!-- TAB 2: Settings -->
          <div class="ucd-tab-content" id="tab-settings">
            <p style="font-size: 12px; color: var(--ucd-text-muted); margin: 0 0 14px;">
              Configure your default order parameters once. They will be saved locally in your browser for all future orders.
            </p>
            <div class="ucd-form-group">
              <label>Deliver To Name</label>
              <input type="text" id="setting-deliverTo" placeholder="e.g., Your Name" />
            </div>
            <div class="ucd-form-group">
              <label>Phone Number</label>
              <input type="text" id="setting-phone" placeholder="e.g., (530) 555-0100" />
            </div>
            <div class="ucd-form-group">
              <label>Email Address</label>
              <input type="text" id="setting-email" placeholder="e.g., yourkerberos@ucdavis.edu" />
            </div>
            <div class="ucd-form-group">
              <label>Shipping Address Search Keyword</label>
              <input type="text" id="setting-addressKeyword" placeholder="e.g., 1014 A Ghausi Hall" />
              <div class="help-text">Keyword that matches your destination in the shipping address dropdown.</div>
            </div>
            <div class="ucd-form-group">
              <label>Approver (Kerberos ID or Name)</label>
              <input type="text" id="setting-approver" placeholder="e.g., jsmith or Approver Name" />
              <div class="help-text">Matches against the workgroup approver list.</div>
            </div>
            <div class="ucd-form-group">
              <label>Account Manager</label>
              <input type="text" id="setting-accountManager" placeholder="anymanager" />
              <div class="help-text">Default: "anymanager" (*Any Workgroup Account Manager*).</div>
            </div>
            <div class="ucd-form-group">
              <label>Date Needed (Days from Today)</label>
              <input type="number" id="setting-dateOffsetDays" min="1" max="60" />
            </div>
            <div class="ucd-form-group">
              <label>Default Units</label>
              <select id="setting-unit">
                <option value="EA">Each (EA)</option>
                <option value="Box">Box</option>
                <option value="PCK">Pack</option>
                <option value="PR">Pair</option>
              </select>
            </div>
            <div class="ucd-form-group">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600;">
                <input type="checkbox" id="setting-allowBackorder" />
                <span>Allow Backorders</span>
              </label>
              <div class="help-text">Allow vendors to backorder items if temporarily out of stock (Default: unchecked/No).</div>
            </div>
            <div class="ucd-form-group">
              <label>Default Justification Fallback</label>
              <textarea id="setting-defaultJustification" rows="2" placeholder="e.g., General laboratory research supplies"></textarea>
            </div>

            <div class="ucd-settings-actions">
              <div class="ucd-settings-btn-group">
                <button class="ucd-btn ucd-btn-primary" id="ucd-save-settings-btn">
                  ${ICONS.save}
                  <span>Save Settings</span>
                </button>
                <span class="ucd-settings-inline-status" id="ucd-settings-status"></span>
              </div>
              <button class="ucd-btn ucd-btn-secondary" id="ucd-clear-settings-btn">
                ${ICONS.clear}
                <span>Clear Settings</span>
              </button>
            </div>
            <!-- Dedicated scroll spacer to guarantee comfortable bottom clearance -->
            <div class="ucd-tab-footer-spacer"></div>
          </div>

          <!-- TAB 3: Help -->
          <div class="ucd-tab-content" id="tab-help">
            <div class="ucd-help-section">
              <!-- Quick Start -->
              <div class="ucd-help-card">
                <h4>${ICONS.info} Quick Start Guide</h4>
                <ul class="ucd-step-list">
                  <li class="ucd-step-item">
                    <span class="ucd-step-num">1</span>
                    <span>Set up your personal details once under the <b>Settings</b> tab (Name, Email, Approver).</span>
                  </li>
                  <li class="ucd-step-item">
                    <span class="ucd-step-num">2</span>
                    <span>Drop your lab order <code class="ucd-code-pill">.csv</code> file, or simply copy & paste cells directly from Google Sheets / Excel into the <b>Import Order</b> tab.</span>
                  </li>
                  <li class="ucd-step-item">
                    <span class="ucd-step-num">3</span>
                    <span>Click <b>AutoFill Order Form</b> to populate all items and expand line details.</span>
                  </li>
                  <li class="ucd-step-item">
                    <span class="ucd-step-num">4</span>
                    <span>Review the calculated subtotals on screen and click <b>Create</b> or <b>Save For Later</b>.</span>
                  </li>
                </ul>
              </div>

              <!-- CSV & Spreadsheet Format Reference -->
              <div class="ucd-help-card">
                <h4>${ICONS.package} Expected Spreadsheet Columns</h4>
                <p style="font-size: 11px; color: var(--ucd-text-muted); margin: 0 0 8px;">
                  Supports standard 8-column spreadsheets (headerless or with headers, CSV or copied Google Sheets/Excel table):
                </p>
                <div style="font-size: 11px; line-height: 1.8; color: #334155;">
                  1. <b>Item Name</b> (Description)<br/>
                  2. <b>ASIN / Catalog #</b> (Part number)<br/>
                  3. <b>Qty</b> (Quantity)<br/>
                  4. <b>Price (Unit)</b> (e.g. $7.98)<br/>
                  5. <b>Price (Total)</b> (Extended total)<br/>
                  6. <b>Link</b> (Direct product URL)<br/>
                  7. <b>Vendor</b> (e.g. Amazon)<br/>
                  8. <b>Purpose description</b> (Item notes / justification)
                </div>
                <div style="font-size: 11px; color: var(--ucd-text-muted); margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--ucd-border); line-height: 1.5;">
                  💡 <b>Tip</b>: You can copy cells directly in Google Sheets or Excel (Ctrl+C) and press <b>Ctrl+V</b> in the Import tab! Or use the <a href="https://chromewebstore.google.com/detail/amz-cart-export-export-yo/eijailhjjlcfiafgpghlcaoceabflbln" target="_blank" rel="noopener noreferrer" style="color: var(--ucd-blue); font-weight: 600; text-decoration: underline;">AMZ Cart Export</a> extension to export Amazon carts.
                </div>
              </div>

              <!-- Credits & Contact -->
              <div class="ucd-credits-card">
                <div class="ucd-credits-header">Pre-Purchasing Assistant for UC Davis <span class="ucd-version-tag">Beta v0.1.0</span></div>
                <div class="ucd-credits-author">
                  Developed by <a href="https://jdpieck.github.io/" target="_blank" rel="noopener noreferrer" style="color: var(--ucd-blue); font-weight: 600; text-decoration: underline;">Jason Pieck</a> using <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" style="color: #1a73e8; font-weight: 600; text-decoration: underline;">Gemini</a>.
                </div>
                <div class="ucd-credits-contact-actions">
                  <a href="https://github.com/jdpieck/Pre-Purchasing-Automation/issues" target="_blank" rel="noopener noreferrer" class="ucd-contact-link">
                    ${ICONS.github}
                    <span>Submit Issue on GitHub</span>
                  </a>
                  <a href="mailto:jdpieck@ucdavis.edu?subject=Pre-Purchasing%20Assistant%20Feedback" class="ucd-contact-link">
                    ${ICONS.mail}
                    <span>Email Support (jdpieck@ucdavis.edu)</span>
                  </a>
                </div>
              </div>
            </div>
            <!-- Dedicated scroll spacer to guarantee comfortable bottom clearance -->
            <div class="ucd-tab-footer-spacer"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    // DOM Elements
    const launcher = document.getElementById('ucd-autofill-launcher');
    const panel = document.getElementById('ucd-autofill-panel');
    const minimizeBtn = document.getElementById('ucd-minimize-btn');
    const importInputContainer = document.getElementById('ucd-import-input-container');
    const subtabUploadBtn = document.getElementById('subtab-upload-btn');
    const subtabPasteBtn = document.getElementById('subtab-paste-btn');
    const subviewUpload = document.getElementById('ucd-subview-upload');
    const subviewPaste = document.getElementById('ucd-subview-paste');
    const pasteInput = document.getElementById('ucd-paste-input');
    const parsePasteBtn = document.getElementById('ucd-parse-paste-btn');
    const readClipboardBtn = document.getElementById('ucd-read-clipboard-btn');
    const clearPasteBtn = document.getElementById('ucd-clear-paste-btn');
    const dropzone = document.getElementById('ucd-dropzone');
    const fileCard = document.getElementById('ucd-file-active-card');
    const activeFileIcon = document.getElementById('ucd-active-file-icon');
    const activeFileName = document.getElementById('ucd-active-file-name');
    const clearFileBtn = document.getElementById('ucd-clear-file-btn');
    const fileInput = document.getElementById('ucd-csv-file');
    const executeBtn = document.getElementById('ucd-execute-btn');
    const statusBox = document.getElementById('ucd-status-box');
    const settingsStatusEl = document.getElementById('ucd-settings-status');
    const summarySection = document.getElementById('ucd-summary-section');
    const previewList = document.getElementById('ucd-preview-list');
    const badgeCount = document.getElementById('badge-count');
    const badgeVendor = document.getElementById('badge-vendor');
    const badgeTotal = document.getElementById('badge-total');
    const previewItemTally = document.getElementById('preview-item-tally');
    const onboardingBanner = document.getElementById('ucd-onboarding-banner');
    const gotoSettingsBtn = document.getElementById('ucd-goto-settings-btn');

    function switchTab(tabKey) {
      const tabBtns = root.querySelectorAll('.ucd-tab-btn');
      const tabContents = root.querySelectorAll('.ucd-tab-content');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      const activeBtn = document.getElementById(`tab-btn-${tabKey}`);
      if (activeBtn) activeBtn.classList.add('active');
      const activeContent = document.getElementById(`tab-${tabKey}`);
      if (activeContent) activeContent.classList.add('active');
    }

    function showSettingsStatus(msg, type = 'success') {
      if (!settingsStatusEl) return;
      settingsStatusEl.textContent = msg;
      settingsStatusEl.className = `ucd-settings-inline-status active ${type}`;
      setTimeout(() => {
        settingsStatusEl.className = 'ucd-settings-inline-status';
        settingsStatusEl.textContent = '';
      }, 3500);
    }

    // Toggle Panel
    launcher.addEventListener('click', () => {
      panel.classList.remove('hidden');
      launcher.style.display = 'none';

      // If user hasn't configured settings yet, auto-switch to Settings tab
      if (!settings.deliverTo) {
        switchTab('settings');
      }
    });

    minimizeBtn.addEventListener('click', () => {
      panel.classList.add('hidden');
      launcher.style.display = 'flex';
    });

    // Tab button listeners
    root.querySelectorAll('.ucd-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    if (gotoSettingsBtn) {
      gotoSettingsBtn.addEventListener('click', () => switchTab('settings'));
    }

    // Populate Settings UI
    function populateSettingsUI() {
      settings = getSettings();
      document.getElementById('setting-deliverTo').value = settings.deliverTo || '';
      document.getElementById('setting-phone').value = settings.phone || '';
      document.getElementById('setting-email').value = settings.email || '';
      document.getElementById('setting-addressKeyword').value = settings.addressKeyword || '';
      document.getElementById('setting-approver').value = settings.approver || '';
      document.getElementById('setting-accountManager').value = settings.accountManager || '';
      document.getElementById('setting-dateOffsetDays').value = settings.dateOffsetDays || 7;
      document.getElementById('setting-unit').value = settings.unit || 'EA';
      document.getElementById('setting-allowBackorder').checked = !!settings.allowBackorder;
      document.getElementById('setting-defaultJustification').value = settings.defaultJustification || '';

      if (onboardingBanner) {
        onboardingBanner.style.display = settings.deliverTo ? 'none' : 'flex';
      }
    }

    populateSettingsUI();

    // Save Settings Event (inline notification instead of alert dialog)
    document.getElementById('ucd-save-settings-btn').addEventListener('click', () => {
      settings.deliverTo = document.getElementById('setting-deliverTo').value.trim();
      settings.phone = document.getElementById('setting-phone').value.trim();
      settings.email = document.getElementById('setting-email').value.trim();
      settings.addressKeyword = document.getElementById('setting-addressKeyword').value.trim();
      settings.approver = document.getElementById('setting-approver').value.trim();
      settings.accountManager = document.getElementById('setting-accountManager').value.trim();
      settings.dateOffsetDays = parseInt(document.getElementById('setting-dateOffsetDays').value, 10) || 7;
      settings.unit = document.getElementById('setting-unit').value;
      settings.allowBackorder = document.getElementById('setting-allowBackorder').checked;
      settings.defaultJustification = document.getElementById('setting-defaultJustification').value.trim();

      saveSettings(settings);
      if (onboardingBanner) onboardingBanner.style.display = 'none';
      showSettingsStatus('✓ Settings saved!', 'success');
    });

    // Clear Settings Event (renamed from Reset Defaults)
    document.getElementById('ucd-clear-settings-btn').addEventListener('click', () => {
      saveSettings(DEFAULT_SETTINGS);
      populateSettingsUI();
      showSettingsStatus('Settings cleared', 'info');
    });

    // Subtab switching (Upload CSV vs Paste Spreadsheet)
    if (subtabUploadBtn && subtabPasteBtn) {
      subtabUploadBtn.addEventListener('click', () => {
        subtabUploadBtn.classList.add('active');
        subtabPasteBtn.classList.remove('active');
        subviewUpload.style.display = 'block';
        subviewPaste.style.display = 'none';
      });

      subtabPasteBtn.addEventListener('click', () => {
        subtabPasteBtn.classList.add('active');
        subtabUploadBtn.classList.remove('active');
        subviewPaste.style.display = 'block';
        subviewUpload.style.display = 'none';
        pasteInput.focus();
      });
    }

    // Direct paste action buttons
    if (parsePasteBtn) {
      parsePasteBtn.addEventListener('click', () => {
        handleTextData(pasteInput.value, 'Pasted Spreadsheet Data', true);
      });
    }

    if (clearPasteBtn) {
      clearPasteBtn.addEventListener('click', () => {
        pasteInput.value = '';
        pasteInput.focus();
      });
    }

    if (readClipboardBtn) {
      readClipboardBtn.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text && text.trim().length > 0) {
              pasteInput.value = text;
              handleTextData(text, 'Pasted Spreadsheet Data', true);
              return;
            }
          }
        } catch (err) {
          console.warn('Clipboard readText failed or permission denied:', err);
        }
        // Fallback: switch to paste subtab and focus textarea
        if (subtabPasteBtn) subtabPasteBtn.click();
        pasteInput.focus();
      });
    }

    // Auto-parse on paste inside textarea
    if (pasteInput) {
      pasteInput.addEventListener('paste', (e) => {
        const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
        if (text && text.trim().length > 0) {
          setTimeout(() => {
            handleTextData(text, 'Pasted Spreadsheet Data', true);
          }, 50);
        }
      });
    }

    // Global paste listener on panel drawer for instant import from anywhere in import tab
    panel.addEventListener('paste', (e) => {
      const activeTabBtn = root.querySelector('.ucd-tab-btn.active');
      if (!activeTabBtn || activeTabBtn.dataset.tab !== 'import') return;
      if (e.target.id === 'ucd-paste-input') return; // Handled by textarea listener
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
      if (text && text.trim().length > 0) {
        e.preventDefault();
        handleTextData(text, 'Pasted Spreadsheet Data', true);
      }
    });

    // File Handling
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });

    function resetUploadedFile() {
      currentParsedItems = [];
      currentFileName = "";
      fileInput.value = "";
      pasteInput.value = "";
      summarySection.style.display = "none";
      fileCard.style.display = "none";
      importInputContainer.style.display = "flex";
      statusBox.className = "ucd-status-box";
      statusBox.textContent = "";
    }

    clearFileBtn.addEventListener('click', resetUploadedFile);

    function handleTextData(text, sourceName, isPasted = false) {
      if (!text || !text.trim()) {
        alert('No spreadsheet data provided to parse.');
        return;
      }

      const items = parseCSV(text);
      if (items.length === 0) {
        alert('Could not find valid items in data. Please ensure it contains columns for Item Name and Part #/Qty.');
        return;
      }

      currentParsedItems = items;
      currentFileName = sourceName || (isPasted ? 'Pasted Spreadsheet Data' : 'Imported Data');
      renderPreview(currentParsedItems, currentFileName, isPasted);
    }

    function handleFile(file) {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.csv') && !name.endsWith('.tsv') && !name.endsWith('.txt')) {
        alert('Please select a valid .csv or spreadsheet file.');
        return;
      }

      currentFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        handleTextData(text, currentFileName, false);
      };
      reader.readAsText(file);
    }

    function renderPreview(items, fileName, isPasted = false) {
      // Hide full input container and show compact active data card
      importInputContainer.style.display = 'none';
      fileCard.style.display = 'flex';
      if (activeFileIcon) {
        activeFileIcon.innerHTML = isPasted ? ICONS.clipboard : ICONS.fileText;
      }
      activeFileName.textContent = `${fileName} (${items.length} items)`;

      summarySection.style.display = 'flex';
      let subtotal = 0;
      let vendor = items[0].vendor || 'Amazon';

      previewList.innerHTML = '';
      items.forEach((item, index) => {
        const linePrice = parseFloat(item.unitPrice) * item.qty;
        subtotal += isNaN(linePrice) ? 0 : linePrice;

        const row = document.createElement('div');
        row.className = 'ucd-preview-row';
        row.innerHTML = `
          <div class="item-num">${index + 1}</div>
          <div class="item-desc" title="${item.name}">${item.name}</div>
          <div class="item-qty">${item.qty}</div>
          <div class="item-price">$${item.unitPrice}</div>
        `;
        previewList.appendChild(row);
      });

      badgeCount.innerHTML = `${ICONS.package} <span>${items.length} Items</span>`;
      badgeVendor.innerHTML = `${ICONS.building} <span>${vendor}</span>`;
      badgeTotal.innerHTML = `${ICONS.dollar} <span>$${subtotal.toFixed(2)}</span>`;
      previewItemTally.textContent = `${items.length} items parsed`;

      statusBox.className = 'ucd-status-box';
      statusBox.textContent = '';
    }

    // Execute Button
    executeBtn.addEventListener('click', async () => {
      if (currentParsedItems.length === 0) return;

      executeBtn.disabled = true;
      executeBtn.innerHTML = `${ICONS.zap} <span>Filling Form...</span>`;
      statusBox.className = 'ucd-status-box active info';

      try {
        await fillPrePurchasingForm(currentParsedItems, settings, (msg, type) => {
          statusBox.textContent = msg;
          statusBox.className = `ucd-status-box active ${type}`;
        });
      } catch (err) {
        console.error(err);
        statusBox.textContent = `Error: ${err.message}`;
        statusBox.className = 'ucd-status-box active error';
      } finally {
        executeBtn.disabled = false;
        executeBtn.innerHTML = `${ICONS.zap} <span>AutoFill Order Form</span>`;
      }
    });
  }

  // Inject UI when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }
})();
