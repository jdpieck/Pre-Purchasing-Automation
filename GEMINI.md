# Pre-Purchasing Assistant for UC Davis - Development Guidelines

## 1. Safety & Form Submission Guardrails
- **Human-in-the-Loop Requirement**: Never programmatically trigger form submission (do not click "Create", "Submit", or "Save For Later"). The extension must stop after populating line items and fields so the user can verify subtotals and routing.
- **Privacy & Lab Distribution**: Form default settings must remain clean of personal data (Deliver To, Phone, Email, Approver). Default to empty strings so lab members configure their own settings on initial run.
- **Public Safety & Test Fixture Sanitization**: Never commit real user credentials, personal phone numbers, or institutional Full Accounting Unit (FAU) chart strings. Mock DOM snapshots (`test-harness/extracted_page.html`) must use generic placeholder accounts (`3110-13U00-SAMPLE-LAB-...`) and anonymized logins (`jsmith`, `jdoe`, `aggie_user`).

## 2. Project Branding, Versioning & Licensing
- **App Name**: Always use `"Pre-Purchasing Assistant for UC Davis"` (to prevent misconception of official UC Davis institutional development). For pre-1.0 releases, append `(Beta)` to the extension name and include beta badges in UI launchers.
- **Initial Versioning**: Pre-release versions start at `0.1.0` (matching across `manifest.json`, `content.js`, and `ucd_prepurchasing.user.js`).
- **License**: Licensed exclusively under the **GNU General Public License v3.0 (GPLv3)** to guarantee reciprocal open-source copyleft protection.
- **Credits & Links**: Maintain the exact attribution and dual contact channels:
  - "Developed by [Jason Pieck](https://jdpieck.github.io/) using [Gemini](https://gemini.google.com/)."
  - Support contact: Direct users to submit issues on GitHub (`https://github.com/jdpieck/Pre-Purchasing-Automation/issues`) or email `jdpieck@ucdavis.edu`.

## 3. Dual-Packaging Synchronization
- The application is distributed in two forms:
  1. Chrome/Edge/Firefox WebExtension in `browser-extension/` (`manifest.json`, `content.js`, `styles.css`).
  2. Standalone Userscript in `browser-extension/ucd_prepurchasing.user.js` (for Tampermonkey / Violentmonkey).
- **Rule**: Whenever `content.js` or `styles.css` is modified, run `python scripts/build_userscript.py` to regenerate `ucd_prepurchasing.user.js` to keep both distribution channels in 100% sync.
- Run tests (`python -m unittest test-harness/test_autofill.py`) to verify that all syntax, selectors, and simulations pass.

## 4. UI Architecture & Icon Rules
- **Lucide Iconography**: Use Lucide SVG icons (`lucide.dev`).
- **No Fill on Line Icons**: Never apply `fill: currentColor` to Lucide SVG icons; they are stroke-based. Use `fill: none; stroke: currentColor;`.
- **Tab Bar Styling**: Active tabs use a rounded tile/badge style (`background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; border-radius: 8px;`) matching the summary badges on the import tab, without bottom underline borders.
- **Chromium Overflow Scrolling Fix**: In Chromium/WebKit, flex containers with `overflow-y: auto` drop `padding-bottom` and child bottom margins at the scroll limit. Always include an in-flow DOM spacer `<div class="ucd-tab-footer-spacer"></div>` with `height: 36px; min-height: 36px; flex-shrink: 0;` at the bottom of scrollable tabs to guarantee clearance above drawer edges.
- **Header Typography & Letter-Spacing**: Card and sub-section headers (e.g. `.ucd-help-card h4`, `.ucd-credits-header`) must use `font-weight: 600` and positive `letter-spacing: 0.35px` with `line-height: 1.45` to prevent letter collision and glyph squishing on Windows system fonts.

## 5. Portal DOM & jQuery Plugin Traps
- **`tzCheckBox` (Backorder Toggle)**:
  - The portal wraps `input[name="backorder"]` in the legacy jQuery `tzCheckBox` plugin.
  - The plugin binds an unconditional toggle handler: `originalCheckBox.bind('change', function() { checkBox.click(); })`.
  - **Do NOT dispatch `change` events on the native checkbox** when `tzCheckBox` is present, as it will invert the toggle back to "Yes".
  - Always toggle via `tzSpan.click()` only when the visual state differs from `wantChecked`, and enforce `.checked` class, `.tzCBContent` ("Yes"/"No"), and `checkbox.checked = wantChecked`.
- **Knockout.js Observables**: Dispatched input events must fire both `input` and `change` events on standard text inputs to trigger Knockout view-model recalculations for line subtotals.
- **jQuery Chosen Dropdowns**: When updating styled selects (`vendor`, `shipAddress`, `approvers`), trigger `.trigger('chosen:updated').trigger('liszt:updated').trigger('change')` and update the visible Chosen single span text.

## 6. CSV Pipeline & Recommended Workflow
- **8-Column Format**: Columns must remain 1: `Item Name`, 2: `ASIN / Catalog #`, 3: `Qty`, 4: `Price (Unit)`, 5: `Price (Total)`, 6: `Link`, 7: `Vendor`, 8: `Purpose description`.
- **AMZ Cart Export Workflow**: Officially recommend the [AMZ Cart Export](https://chromewebstore.google.com/detail/amz-cart-export-export-yo/eijailhjjlcfiafgpghlcaoceabflbln) extension for Amazon orders (it provides columns 1–6 automatically; users append column 7 `Vendor` and column 8 `Purpose description`).
