/**
 * Pre-Purchasing Assistant for UC Davis
 * User Interface & Drawer Management
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (typeof window !== 'undefined') {
    if (window.__ucd_prepurchasing_autofill_injected) return;
    window.__ucd_prepurchasing_autofill_injected = true;
  }

  const ICONS = (typeof window !== 'undefined' ? window.ICONS : (typeof global !== 'undefined' ? global.ICONS : null)) || {};
  const getSettings = typeof window !== 'undefined' ? window.getSettings : (typeof global !== 'undefined' ? global.getSettings : null);
  const saveSettings = typeof window !== 'undefined' ? window.saveSettings : (typeof global !== 'undefined' ? global.saveSettings : null);
  const DEFAULT_SETTINGS = typeof window !== 'undefined' ? window.DEFAULT_SETTINGS : (typeof global !== 'undefined' ? global.DEFAULT_SETTINGS : null);
  const STORAGE_KEY = typeof window !== 'undefined' ? window.STORAGE_KEY : (typeof global !== 'undefined' ? global.STORAGE_KEY : null);
  const parseCSV = typeof window !== 'undefined' ? window.parseCSV : (typeof global !== 'undefined' ? global.parseCSV : null);
  const fillPrePurchasingForm = typeof window !== 'undefined' ? window.fillPrePurchasingForm : (typeof global !== 'undefined' ? global.fillPrePurchasingForm : null);

  function injectUI() {
    if (document.getElementById('ucd-autofill-root')) return;

    let currentParsedItems = [];
    let currentFileName = "";
    let settings = getSettings();
    const isFirstTimeUser = !localStorage.getItem(STORAGE_KEY) || !settings.deliverTo;

    const root = document.createElement('div');
    root.id = 'ucd-autofill-root';
    root.innerHTML = (window.getDrawerHtml || getDrawerHtml)({ isFirstTimeUser });

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
    const summarySection = document.getElementById('ucd-summary-section');
    const previewList = document.getElementById('ucd-preview-list');
    const badgeCount = document.getElementById('badge-count');
    const badgeVendor = document.getElementById('badge-vendor');
    const badgeTotal = document.getElementById('badge-total');
    const previewItemTally = document.getElementById('preview-item-tally');
    const onboardingBanner = document.getElementById('ucd-onboarding-banner');
    const gotoSettingsBtn = document.getElementById('ucd-goto-settings-btn');
    const vendorSection = document.getElementById('ucd-vendor-section');
    const vendorFilterBar = document.getElementById('ucd-vendor-filter-bar');
    const vendorWarningText = document.getElementById('ucd-vendor-warning-text');
    const dateOffsetInput = document.getElementById('setting-dateOffsetDays');
    const datePreviewLabel = document.getElementById('ucd-date-preview-label');

    let selectedVendorFilter = '__all__';
    let activeFilteredItems = [];

    let settingsStatusTimer = null;
    function showSettingsStatus(msg, type = 'success') {
      const statusEls = [
        document.getElementById('ucd-settings-status'),
        document.getElementById('ucd-settings-status-top')
      ].filter(Boolean);

      if (statusEls.length === 0) return;

      statusEls.forEach(el => {
        el.textContent = msg;
        const isFloating = el.id === 'ucd-settings-status-top';
        const baseClass = isFloating ? 'ucd-settings-floating-toast' : 'ucd-settings-inline-status';
        el.className = `${baseClass} active ${type}`;
      });

      if (settingsStatusTimer) {
        clearTimeout(settingsStatusTimer);
      }
      settingsStatusTimer = setTimeout(() => {
        statusEls.forEach(el => {
          const isFloating = el.id === 'ucd-settings-status-top';
          el.className = isFloating ? 'ucd-settings-floating-toast' : 'ucd-settings-inline-status';
          el.textContent = '';
        });
        settingsStatusTimer = null;
      }, 2500);
    }

    function showFieldSavedBadge(fieldId) {
      if (!fieldId) return;
      const badge = root.querySelector(`.ucd-field-saved-badge[data-for="${fieldId}"]`);
      if (!badge) return;
      badge.classList.remove('active');
      void badge.offsetWidth; // Reflow to restart transition
      badge.classList.add('active');
      setTimeout(() => {
        badge.classList.remove('active');
      }, 1800);
    }

    function readSettingsFromUI() {
      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };
      const daysVal = parseInt(document.getElementById('setting-dateOffsetDays')?.value, 10);
      return {
        deliverTo: getVal('setting-deliverTo'),
        phone: getVal('setting-phone'),
        email: getVal('setting-email'),
        addressKeyword: getVal('setting-addressKeyword'),
        approver: getVal('setting-approver'),
        accountManager: getVal('setting-accountManager'),
        dateOffsetDays: Number.isNaN(daysVal) ? 7 : Math.max(1, Math.min(60, daysVal)),
        unit: document.getElementById('setting-unit')?.value || 'EA',
        allowBackorder: !!document.getElementById('setting-allowBackorder')?.checked,
        defaultJustification: getVal('setting-defaultJustification')
      };
    }

    function saveCurrentSettings(targetInput = null, notify = true) {
      const current = readSettingsFromUI();
      let changed = false;
      for (const [key, val] of Object.entries(current)) {
        if (settings[key] !== val) {
          settings[key] = val;
          changed = true;
        }
      }

      if (changed || !notify) {
        saveSettings(settings);
        if (onboardingBanner) {
          onboardingBanner.style.display = settings.deliverTo ? 'none' : 'flex';
        }
      }

      if (notify) {
        if (targetInput) {
          targetInput.classList.remove('ucd-input-saved');
          void targetInput.offsetWidth; // Reflow to restart pulse animation
          targetInput.classList.add('ucd-input-saved');
          showFieldSavedBadge(targetInput.id);
          setTimeout(() => {
            targetInput.classList.remove('ucd-input-saved');
          }, 1400);
        }
        showSettingsStatus(targetInput ? '✓ Auto-saved' : '✓ Settings saved!', 'success');
      }

      return changed;
    }

    function switchTab(tabKey) {
      // Auto-save any pending unsaved changes if leaving the settings tab
      const currentTab = root.querySelector('.ucd-tab-btn.active')?.dataset.tab;
      if (currentTab === 'settings' && tabKey !== 'settings') {
        saveCurrentSettings(null, false);
      }

      const tabBtns = root.querySelectorAll('.ucd-tab-btn');
      const tabContents = root.querySelectorAll('.ucd-tab-content');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      const activeBtn = document.getElementById(`tab-btn-${tabKey}`);
      if (activeBtn) activeBtn.classList.add('active');
      const activeContent = document.getElementById(`tab-${tabKey}`);
      if (activeContent) activeContent.classList.add('active');
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
      saveCurrentSettings(null, false);
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
    function updateDatePreview(offsetDays) {
      if (!datePreviewLabel) return;
      const days = parseInt(offsetDays, 10);
      const validDays = Number.isNaN(days) ? 7 : Math.max(1, Math.min(60, days));
      const getFutureDateFn = window.getFutureDate || (typeof getFutureDate === 'function' ? getFutureDate : null);
      if (getFutureDateFn) {
        const dateStr = getFutureDateFn(validDays);
        datePreviewLabel.textContent = `Fills with: ${dateStr} (${validDays} day${validDays === 1 ? '' : 's'} from today)`;
      }
    }

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

      updateDatePreview(settings.dateOffsetDays || 7);

      if (onboardingBanner) {
        onboardingBanner.style.display = settings.deliverTo ? 'none' : 'flex';
      }
    }

    populateSettingsUI();

    if (dateOffsetInput) {
      dateOffsetInput.addEventListener('input', () => {
        updateDatePreview(dateOffsetInput.value);
      });
    }

    // Auto-save settings on leaving field (blur) or changing value (change)
    const settingFieldSpecs = [
      { id: 'setting-deliverTo', key: 'deliverTo', type: 'text' },
      { id: 'setting-phone', key: 'phone', type: 'text' },
      { id: 'setting-email', key: 'email', type: 'text' },
      { id: 'setting-addressKeyword', key: 'addressKeyword', type: 'text' },
      { id: 'setting-approver', key: 'approver', type: 'text' },
      { id: 'setting-accountManager', key: 'accountManager', type: 'text' },
      { id: 'setting-dateOffsetDays', key: 'dateOffsetDays', type: 'number' },
      { id: 'setting-unit', key: 'unit', type: 'select' },
      { id: 'setting-allowBackorder', key: 'allowBackorder', type: 'checkbox' },
      { id: 'setting-defaultJustification', key: 'defaultJustification', type: 'textarea' }
    ];

    function handleFieldAutoSave(el, spec) {
      let currentVal;
      if (spec.type === 'checkbox') {
        currentVal = !!el.checked;
      } else if (spec.type === 'number') {
        const parsed = parseInt(el.value, 10);
        currentVal = Number.isNaN(parsed) ? 7 : Math.max(1, Math.min(60, parsed));
      } else {
        currentVal = el.value.trim();
      }

      if (currentVal !== settings[spec.key]) {
        saveCurrentSettings(el, true);
      }
    }

    settingFieldSpecs.forEach(spec => {
      const el = document.getElementById(spec.id);
      if (!el) return;
      el.addEventListener('blur', () => handleFieldAutoSave(el, spec));
      el.addEventListener('change', () => handleFieldAutoSave(el, spec));
    });

    // Clear Settings Event
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
      activeFilteredItems = [];
      selectedVendorFilter = '__all__';
      currentFileName = "";
      fileInput.value = "";
      pasteInput.value = "";
      summarySection.style.display = "none";
      if (vendorSection) vendorSection.style.display = "none";
      fileCard.style.display = "none";
      importInputContainer.style.display = "flex";
      statusBox.className = "ucd-status-box";
      statusBox.textContent = "";
    }

    clearFileBtn.addEventListener('click', resetUploadedFile);

    function getVendorCounts(items) {
      const counts = new Map();
      items.forEach(item => {
        const v = (item.vendor || '').trim();
        const displayVendor = v || 'Unspecified';
        counts.set(displayVendor, (counts.get(displayVendor) || 0) + 1);
      });
      return counts;
    }

    function renderVendorFilterPills(uniqueVendors, vendorCounts, totalCount) {
      if (!vendorFilterBar) return;
      vendorFilterBar.innerHTML = '';

      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = `ucd-vendor-pill ${selectedVendorFilter === '__all__' ? 'active' : ''}`;
      allBtn.textContent = `All Vendors (${totalCount} items - Mixed)`;
      allBtn.addEventListener('click', () => {
        selectedVendorFilter = '__all__';
        renderVendorFilterPills(uniqueVendors, vendorCounts, totalCount);
        updateFilteredDisplay(currentParsedItems, true);
      });
      vendorFilterBar.appendChild(allBtn);

      uniqueVendors.forEach(v => {
        const count = vendorCounts.get(v);
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `ucd-vendor-pill ${selectedVendorFilter === v ? 'active' : ''}`;
        pill.textContent = `${v} (${count} item${count === 1 ? '' : 's'})`;
        pill.addEventListener('click', () => {
          selectedVendorFilter = v;
          renderVendorFilterPills(uniqueVendors, vendorCounts, totalCount);
          updateFilteredDisplay(currentParsedItems, true);
        });
        vendorFilterBar.appendChild(pill);
      });
    }

    function updateFilteredDisplay(items, hasMultipleVendors) {
      const isAll = (selectedVendorFilter === '__all__');
      const displayItems = isAll
        ? items
        : items.filter(it => (it.vendor || 'Unspecified') === selectedVendorFilter);

      activeFilteredItems = displayItems;

      let subtotal = 0;
      previewList.innerHTML = '';
      displayItems.forEach((item, index) => {
        const linePrice = parseFloat(item.unitPrice) * item.qty;
        subtotal += isNaN(linePrice) ? 0 : linePrice;

        const row = document.createElement('div');
        row.className = 'ucd-preview-row';
        const vendorTagHtml = (hasMultipleVendors && isAll)
          ? `<div class="ucd-item-vendor-tag">${item.vendor || 'Unspecified'}</div>`
          : '';

        row.innerHTML = `
          <div class="item-num">${index + 1}</div>
          <div class="item-desc" title="${item.name}">
            <span>${item.name || '<span style="color:#ef4444;">[Missing Description]</span>'}</span>
            ${vendorTagHtml}
          </div>
          <div class="item-qty">${item.qty}</div>
          <div class="item-price">$${item.unitPrice}</div>
        `;
        previewList.appendChild(row);
      });

      const currentVendorText = isAll ? 'Multiple' : selectedVendorFilter;
      badgeCount.innerHTML = `${ICONS.package} <span>${displayItems.length} Items</span>`;
      badgeVendor.innerHTML = `${ICONS.building} <span>${currentVendorText}</span>`;
      badgeTotal.innerHTML = `${ICONS.dollar} <span>$${subtotal.toFixed(2)}</span>`;
      previewItemTally.textContent = isAll
        ? `${displayItems.length} items total`
        : `${displayItems.length} items for ${selectedVendorFilter}`;

      if (hasMultipleVendors && isAll) {
        executeBtn.disabled = true;
        executeBtn.innerHTML = `${ICONS.zap} <span>Select a Vendor Above to AutoFill</span>`;
        executeBtn.title = 'UC Davis permits only one vendor per order request. Please select a vendor above.';
        if (vendorWarningText) {
          vendorWarningText.innerHTML = `<b>Multiple Vendors Detected:</b> UC Davis requires separate order requests for each vendor. Select a vendor below to populate only that vendor's items.`;
        }
      } else {
        executeBtn.disabled = false;
        executeBtn.title = '';
        const vendorName = isAll ? (items[0]?.vendor || 'Order') : selectedVendorFilter;
        executeBtn.innerHTML = `${ICONS.zap} <span>AutoFill ${vendorName} Order</span>`;
        if (hasMultipleVendors && vendorWarningText) {
          vendorWarningText.innerHTML = `Populating ${displayItems.length} items for <b>${selectedVendorFilter}</b>. Review & submit this order in the portal, then select the next vendor to fill remaining items.`;
        }
      }

      statusBox.className = 'ucd-status-box';
      statusBox.textContent = '';
    }

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

      const vendorCounts = getVendorCounts(items);
      const uniqueVendors = Array.from(vendorCounts.keys());
      const hasMultipleVendors = uniqueVendors.length > 1;

      if (hasMultipleVendors) {
        if (vendorSection) vendorSection.style.display = 'block';
        selectedVendorFilter = '__all__';
        renderVendorFilterPills(uniqueVendors, vendorCounts, items.length);
      } else {
        if (vendorSection) vendorSection.style.display = 'none';
        selectedVendorFilter = uniqueVendors[0] || 'Amazon';
      }

      updateFilteredDisplay(items, hasMultipleVendors);
    }

    // Execute Button
    executeBtn.addEventListener('click', async () => {
      const vendorCounts = getVendorCounts(currentParsedItems);
      const hasMultipleVendors = vendorCounts.size > 1;

      if (hasMultipleVendors && selectedVendorFilter === '__all__') {
        alert('Please select a specific vendor pill to populate that vendor\'s order.');
        return;
      }

      const itemsToFill = (hasMultipleVendors && selectedVendorFilter !== '__all__')
        ? activeFilteredItems
        : currentParsedItems;

      if (itemsToFill.length === 0) return;

      executeBtn.disabled = true;
      executeBtn.innerHTML = `${ICONS.zap} <span>Filling Form...</span>`;
      statusBox.className = 'ucd-status-box active info';

      try {
        await fillPrePurchasingForm(itemsToFill, settings, (msg, type) => {
          statusBox.textContent = msg;
          statusBox.className = `ucd-status-box active ${type}`;
        });
      } catch (err) {
        console.error(err);
        statusBox.textContent = `Error: ${err.message}`;
        statusBox.className = 'ucd-status-box active error';
      } finally {
        executeBtn.disabled = false;
        const vendorName = (hasMultipleVendors && selectedVendorFilter !== '__all__')
          ? selectedVendorFilter
          : (currentParsedItems[0]?.vendor || 'Order');
        executeBtn.innerHTML = `${ICONS.zap} <span>AutoFill ${vendorName} Order</span>`;
      }
    });
  }

  // Inject UI when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectUI);
    } else {
      injectUI();
    }
  }

  if (typeof window !== 'undefined') {
    window.injectUI = injectUI;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { injectUI };
  }
})();
