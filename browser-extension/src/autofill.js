/**
 * Pre-Purchasing Assistant for UC Davis
 * Form Autofill Sequence Engine
 */

async function fillPrePurchasingForm(items, settings, onProgress) {
  const _setInputValue = typeof setInputValue === 'function' ? setInputValue : window.setInputValue;
  const _setSelectValue = typeof setSelectValue === 'function' ? setSelectValue : window.setSelectValue;
  const _setBackorderState = typeof setBackorderState === 'function' ? setBackorderState : window.setBackorderState;
  const _getFutureDate = typeof getFutureDate === 'function' ? getFutureDate : window.getFutureDate;
  const _cloneLineItemRow = typeof cloneLineItemRow === 'function' ? cloneLineItemRow : window.cloneLineItemRow;
  const _sleep = typeof sleep === 'function' ? sleep : (window.sleep || (ms => new Promise(res => setTimeout(res, ms))));

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
    _setInputValue(justEl, justificationText);
    log("✓ Justification populated");
  }

  const reqTypeSel = document.getElementById('requestType') || document.querySelector('select[name="requestType"]');
  if (reqTypeSel) {
    _setSelectValue(reqTypeSel, settings.requestType || 'Purchasing');
  }

  const busPurpEl = document.querySelector('textarea[name="businessPurpose"]');
  if (busPurpEl && justificationText) {
    _setInputValue(busPurpEl, justificationText);
    log("✓ Business purpose populated");
  }

  // 2. Vendor Dropdown
  const vendorName = items[0].vendor || 'Amazon';
  const vendorSel = document.getElementById('vendor') || document.querySelector('select[name="vendor"]');
  if (vendorSel) {
    const matched = _setSelectValue(vendorSel, vendorName);
    if (matched) {
      log(`✓ Vendor matched: ${matched}`);
    } else {
      log(`⚠️ Could not match vendor "${vendorName}". Please select vendor manually.`, 'error');
    }
  }

  // 3. Shipping Address
  const shipToEl = document.querySelector('input[name="shipTo"]');
  if (shipToEl && settings.deliverTo) _setInputValue(shipToEl, settings.deliverTo);

  const shipPhoneEl = document.querySelector('input[name="shipPhone"]');
  if (shipPhoneEl && settings.phone) _setInputValue(shipPhoneEl, settings.phone);

  const shipEmailEl = document.querySelector('input[name="shipEmail"]');
  if (shipEmailEl && settings.email) _setInputValue(shipEmailEl, settings.email);

  const shipAddressSel = document.getElementById('shipAddress') || document.querySelector('select[name="shipAddress"]');
  if (shipAddressSel && (settings.addressKeyword || settings.addressText)) {
    const matchedAddr = _setSelectValue(shipAddressSel, settings.addressKeyword || settings.addressText);
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
    await _sleep(100);
  }

  const approverSel = document.getElementById('approvers') || document.querySelector('select[name="approvers"]');
  if (approverSel && (settings.approver || settings.approverKeyword)) {
    _setSelectValue(approverSel, settings.approver || settings.approverKeyword);
    log(`✓ Approver selected`);
  }

  const acctMgrSel = document.getElementById('accountmanagers') || document.querySelector('select[name="accountmanagers"]');
  if (acctMgrSel) {
    _setSelectValue(acctMgrSel, settings.accountManager || 'anymanager');
    log(`✓ Account manager selected`);
  }

  // 5. Order Preferences
  const dateNeededEl = document.querySelector('input[name="dateNeeded"]') || document.querySelector('#order-preferences-section input[type="text"]');
  if (dateNeededEl) {
    const dateStr = _getFutureDate(settings.dateOffsetDays || 7);
    _setInputValue(dateNeededEl, dateStr);
    log(`✓ Date needed set to ${dateStr}`);
  }

  const shipTypeSel = document.getElementById('shippingType') || document.querySelector('select[name="shippingType"]');
  if (shipTypeSel) {
    _setSelectValue(shipTypeSel, settings.shippingType || 'ST');
    log(`✓ Shipping type set`);
  }

  // Backorder setting (handles tzCheckBox cleanly)
  _setBackorderState(settings.allowBackorder);
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
      await _sleep(50);
    }
    currentRows = document.querySelectorAll('#line-items tbody tr.line-item-row');

    // If click didn't add a row (e.g. offline mock or unbound), clone the row as fallback
    if (currentRows.length === prevCount) {
      _cloneLineItemRow(prevCount);
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
    if (qtyEl) _setInputValue(qtyEl, String(item.qty));

    // Units (Default: Each)
    const unitSel = document.querySelector(`select[name="items[${i}].units"]`) || document.getElementById(`units_${i}`);
    if (unitSel) {
      _setSelectValue(unitSel, settings.unit || 'EA');
    }

    // Catalog # / ASIN
    const catEl = document.querySelector(`input[name="items[${i}].catalogNumber"]`);
    if (catEl) _setInputValue(catEl, item.asin);

    // Description
    const descEl = document.querySelector(`input[name="items[${i}].description"]`);
    if (descEl) _setInputValue(descEl, item.name);

    // Unit Price
    const priceEl = document.querySelector(`input[name="items[${i}].price"]`);
    if (priceEl) _setInputValue(priceEl, item.unitPrice);

    // Expand line item details by clicking comment balloon icon
    const row = qtyEl ? qtyEl.closest('tr.line-item-row') : null;
    if (row) {
      const toggleBtn = row.querySelector('a.toggle-line-item-details');
      const nextRow = row.nextElementSibling;
      if (toggleBtn) {
        toggleBtn.click();
        await _sleep(20);
      }
      if (nextRow && nextRow.classList.contains('line-item-details')) {
        nextRow.style.display = '';
      }
    }

    // Fill URL
    const urlEl = document.querySelector(`input[name="items[${i}].url"]`);
    if (urlEl && item.url) {
      _setInputValue(urlEl, item.url);
    }

    // Fill Item Notes (Purpose description)
    const notesEl = document.querySelector(`textarea[name="items[${i}].notes"]`);
    if (notesEl && item.purpose) {
      _setInputValue(notesEl, item.purpose);
    }
  }

  log(`Success! All ${items.length} items and order details populated. Please review the form before submitting.`, 'success');
}

if (typeof window !== 'undefined') {
  window.fillPrePurchasingForm = fillPrePurchasingForm;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fillPrePurchasingForm };
}
