/**
 * Pre-Purchasing Assistant for UC Davis
 * DOM & Portal Interaction Helpers
 */

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
    if (typeof window !== 'undefined' && window.jQuery) {
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
function setBackorderState(allow, doc = document) {
  const checkbox = doc.querySelector('input[name="backorder"]');
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
function cloneLineItemRow(newIndex, doc = document) {
  const tbody = doc.querySelector('#line-items tbody') || doc.getElementById('line-items-body');
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

if (typeof window !== 'undefined') {
  window.getFutureDate = getFutureDate;
  window.setInputValue = setInputValue;
  window.setSelectValue = setSelectValue;
  window.setBackorderState = setBackorderState;
  window.sleep = sleep;
  window.cloneLineItemRow = cloneLineItemRow;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFutureDate,
    setInputValue,
    setSelectValue,
    setBackorderState,
    sleep,
    cloneLineItemRow
  };
}
