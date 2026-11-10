/**
 * Pre-Purchasing Assistant for UC Davis
 * Injected Drawer HTML Template Component
 * Separates presentation markup from ui.js event and interaction logic.
 */

function getDrawerHtml(options = {}) {
  const ICONS = (typeof window !== 'undefined' ? window.ICONS : (typeof global !== 'undefined' ? global.ICONS : null)) || {};
  const isFirstTimeUser = !!options.isFirstTimeUser;

  return `
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
              <div class="ucd-credits-header">Pre-Purchasing Assistant for UC Davis <span class="ucd-version-tag">Beta v0.2.0</span></div>
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
}

if (typeof window !== 'undefined') {
  window.getDrawerHtml = getDrawerHtml;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getDrawerHtml };
}
