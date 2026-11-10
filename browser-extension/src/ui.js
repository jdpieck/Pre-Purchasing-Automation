/**
 * Pre-Purchasing Assistant for UC Davis
 * User Interface & Drawer Management
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__ucd_prepurchasing_autofill_injected) return;
  window.__ucd_prepurchasing_autofill_injected = true;

  const ICONS = window.ICONS || {};
  const getSettings = window.getSettings;
  const saveSettings = window.saveSettings;
  const DEFAULT_SETTINGS = window.DEFAULT_SETTINGS;
  const STORAGE_KEY = window.STORAGE_KEY;
  const parseCSV = window.parseCSV;
  const fillPrePurchasingForm = window.fillPrePurchasingForm;

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
            <div class="ucd-settings-header-banner">
              <p class="ucd-settings-description">
                Configure default parameters. Settings auto-save as soon as you leave each field.
              </p>
              <span class="ucd-settings-floating-toast" id="ucd-settings-status-top"></span>
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label>Deliver To Name</label>
                <span class="ucd-field-saved-badge" data-for="setting-deliverTo">✓ Saved</span>
              </div>
              <input type="text" id="setting-deliverTo" placeholder="e.g., Your Name" />
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label>Phone Number</label>
                <span class="ucd-field-saved-badge" data-for="setting-phone">✓ Saved</span>
              </div>
              <input type="text" id="setting-phone" placeholder="e.g., (530) 555-0100" />
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label>Email Address</label>
                <span class="ucd-field-saved-badge" data-for="setting-email">✓ Saved</span>
              </div>
              <input type="text" id="setting-email" placeholder="e.g., yourkerberos@ucdavis.edu" />
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label>Shipping Address Search Keyword</label>
                <span class="ucd-field-saved-badge" data-for="setting-addressKeyword">✓ Saved</span>
              </div>
              <input type="text" id="setting-addressKeyword" placeholder="e.g., 1014 A Ghausi Hall" />
              <div class="help-text">Keyword that matches your destination in the shipping address dropdown.</div>
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label>Approver (Kerberos ID or Name)</label>
                <span class="ucd-field-saved-badge" data-for="setting-approver">✓ Saved</span>
              </div>
              <input type="text" id="setting-approver" placeholder="e.g., jsmith or Approver Name" />
              <div class="help-text">Matches against the workgroup approver list.</div>
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label>Account Manager</label>
                <span class="ucd-field-saved-badge" data-for="setting-accountManager">✓ Saved</span>
              </div>
              <input type="text" id="setting-accountManager" placeholder="anymanager" />
              <div class="help-text">Default: "anymanager" (*Any Workgroup Account Manager*).</div>
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label>Date Needed (Days from Today)</label>
                <span class="ucd-field-saved-badge" data-for="setting-dateOffsetDays">✓ Saved</span>
              </div>
              <input type="number" id="setting-dateOffsetDays" min="1" max="60" />
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label>Default Units</label>
                <span class="ucd-field-saved-badge" data-for="setting-unit">✓ Saved</span>
              </div>
              <select id="setting-unit">
                <option value="EA">Each (EA)</option>
                <option value="Box">Box</option>
                <option value="PCK">Pack</option>
                <option value="PR">Pair</option>
              </select>
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600; margin: 0;">
                  <input type="checkbox" id="setting-allowBackorder" />
                  <span>Allow Backorders</span>
                </label>
                <span class="ucd-field-saved-badge" data-for="setting-allowBackorder">✓ Saved</span>
              </div>
              <div class="help-text">Allow vendors to backorder items if temporarily out of stock (Default: unchecked/No).</div>
            </div>
            <div class="ucd-form-group">
              <div class="ucd-form-label-row">
                <label>Default Justification Fallback</label>
                <span class="ucd-field-saved-badge" data-for="setting-defaultJustification">✓ Saved</span>
              </div>
              <textarea id="setting-defaultJustification" rows="2" placeholder="e.g., General laboratory research supplies"></textarea>
            </div>

            <div class="ucd-settings-actions">
              <div class="ucd-settings-btn-group">
                <button class="ucd-btn ucd-btn-secondary" id="ucd-clear-settings-btn">
                  ${ICONS.clear}
                  <span>Clear Settings</span>
                </button>
                <span class="ucd-settings-inline-status" id="ucd-settings-status"></span>
              </div>
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
    const summarySection = document.getElementById('ucd-summary-section');
    const previewList = document.getElementById('ucd-preview-list');
    const badgeCount = document.getElementById('badge-count');
    const badgeVendor = document.getElementById('badge-vendor');
    const badgeTotal = document.getElementById('badge-total');
    const previewItemTally = document.getElementById('preview-item-tally');
    const onboardingBanner = document.getElementById('ucd-onboarding-banner');
    const gotoSettingsBtn = document.getElementById('ucd-goto-settings-btn');

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

  if (typeof window !== 'undefined') {
    window.injectUI = injectUI;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { injectUI };
  }
})();
