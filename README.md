# Pre-Purchasing Assistant for UC Davis (Beta) ⚡

A lightweight browser extension designed to automate entering lab purchasing requests into the **UC Davis Pre-Purchasing System** (`https://prepurchasing.ucdavis.edu`).

> **Status: Beta (v0.3.0)** — Actively tested with the UC Davis Pre-Purchasing order request portal.

Instead of typing dozens of items, quantities, catalog numbers, URLs, and notes by hand, simply drag and drop your order CSV spreadsheet. The extension automatically fills every field, expands line items, sets approver routing, matches vendors and shipping addresses, and leaves the form ready for your final review.

---

## Key Features

- **⚡ Instant Form Population**: Enters Justification, Business Purpose, Vendor, Shipping Address, Approver Routing, Date Needed, and Line Items in seconds.
- **🔍 Expands Item Details**: Automatically clicks the comment bubble to reveal and populate **Product Link (URL)** and **Item Notes** for every line item.
- **🏷️ Multi-Vendor Support**: Detects mixed-vendor spreadsheets, respects UC Davis single-vendor order rules, and provides one-click vendor selector pills to fill each vendor's order sequentially without re-copying.
- **🧮 Smart Column Detection & Auto-Derivation**: Accepts irregular or incomplete spreadsheets. Derives missing unit prices from total price & qty, extracts ASINs from Amazon links, and infers vendors from domains.
- **🛠️ In-Browser Settings UI**: Lab members can enter their personal details (Deliver To, Phone, Email, Approver, Shipping Address, Backorders, Date Needed offset, and Default Order Justification) with instant **auto-save on blur**.
- **📅 Accurate Date Needed & Live Preview**: Real-time preview of exact future delivery dates (`Fills with: MM/DD/YYYY`), preventing date calculation errors.
- **📁 Compact Dropzone & Clear Option**: After uploading a CSV, the dropzone collapses into a sleek file card with a one-click **Clear / Start Over** button, while the preview table dynamically expands to fill the panel height.
- **🎨 Sleek, Stable Interface**: Styled with [Lucide Icons](https://lucide.dev/) (with filled icons on active tabs) and a fixed-height layout to prevent vertical jumping between tabs.
- **🔒 100% Client-Side & Private**: Runs entirely in your browser using plaintext open-source tools. No AI subscriptions, no external APIs, and no telemetry.
- **🛡️ Duo 2FA & CAS Compatible**: Works inside your normal authenticated browser session without session hijacking or login workarounds.
- **👀 Review-First Safety**: Populates the fields and calculates totals but **never** submits automatically. You maintain full control to review before clicking *Create* or *Save For Later*.

---

## Installation (No Web Store Approval Needed)

You do **not** need browser store approval to install and use this tool. Follow these simple steps to load the extension in Chrome, Microsoft Edge, or Brave:

1. Clone or download this repository to your computer.
2. Open your browser and navigate to the extensions management page:
   - **Chrome / Brave**: `chrome://extensions`
   - **Microsoft Edge**: `edge://extensions`
3. Toggle on **Developer mode** (switch located in the top-right corner).
4. Click the **"Load unpacked"** button in the top-left toolbar.
5. In the file picker, select the `browser-extension` folder inside this repository.
6. The extension is now installed! It will automatically activate whenever you visit `https://prepurchasing.ucdavis.edu/Order/Request/*`.

> **Updating**: When you pull updates from GitHub, simply go to your extensions page and click the reload icon on the extension card.

---

## How to Use

1. Navigate to your UC Davis Pre-Purchasing order request page (e.g. `https://prepurchasing.ucdavis.edu/Order/Request/<workgroup-id>`).
2. Click the floating **`⚡ AutoFill Order`** pill button in the bottom-right corner.
3. **First-time setup**: Switch to the **Settings** tab and enter your personal details (Deliver To Name, Phone, Email, Shipping Address keyword, Approver, Backorder preference, and Default Order Justification). Fields auto-save automatically as you leave each field.
4. In the **Import Order** tab, drag and drop your order CSV file or paste spreadsheet cells (<kbd>Ctrl+V</kbd>).
5. **Multi-Vendor Handling**: If your import contains items for multiple vendors (e.g. McMaster-Carr and Amazon), click the desired vendor pill to filter the order. (UC Davis requires separate requests per vendor).
6. Click **`⚡ AutoFill Order Form`**.
7. Watch as the extension:
   - Fills Justification and Business Purpose (from Settings or first line item).
   - Matches and selects the Vendor (e.g., *Amazon Capital Services* or *McMaster-Carr Supply Company*).
   - Enters recipient name, phone, email, and selects your Shipping Address.
   - Selects "Approver & Account Manager" with your specified Approver.
   - Calculates and sets the Date Needed (today + offset days), Standard shipping, and Backorder preference.
   - Adds necessary line item rows and fills Quantity, Units (*Each*), ASIN / Catalog #, Description, and Price.
   - Expands line details to fill Product URLs and Item Notes.
8. Review the populated form on screen and click **Create** or **Save For Later**.

---

## Spreadsheet Formats & Auto-Derivations

The assistant supports standard 8-column spreadsheets as well as irregular lab finance spreadsheets (with or without headers, CSV files or copied Excel / Google Sheets tables):

### Standard 8-Column Format

| Column # | Field Name | Description | Example |
| :---: | :--- | :--- | :--- |
| **1** | `Item Name` | Full description of the item | `USANOOKS Microfiber Cleaning Cloth Grey - 12 Pcs` |
| **2** | `ASIN / Catalog #` | Vendor part number or Amazon ASIN | `B08BRJHJF9` |
| **3** | `Qty` | Quantity of units requested (defaults to 1 if omitted) | `1` |
| **4** | `Price (Unit)` | Unit price (with or without `$`) | `$7.98` |
| **5** | `Price (Total)` | Extended total price | `$7.98` |
| **6** | `Link` | Direct product URL | `https://www.amazon.com/gp/product/B08BRJHJF9...` |
| **7** | `Vendor` | Vendor name for matching | `Amazon` |
| **8** | `Item Notes` | Line-item notes (order justification is in Settings) | `Cleaning up the office + general tools` |

See [`examples/Example Amazon Purchase Data.csv`](examples/Example%20Amazon%20Purchase%20Data.csv) for a full working sample.

### Irregular Finance Tables & Smart Auto-Derivations

Lab accounting and export sheets often have custom column arrangements, missing ASINs, or omitted unit prices. The assistant's ingestion engine handles these automatically:

- **Missing Unit Price**: Calculated automatically if only Total Price and Qty are present ($\text{unitPrice} = \text{totalPrice} / \text{qty}$).
- **Missing Total Price**: Calculated automatically if only Unit Price and Qty are present ($\text{totalPrice} = \text{unitPrice} \times \text{qty}$).
- **Part Number & ASIN Extraction**: Extracted directly from product links:
  - Amazon ASINs: `/(?:dp|gp\/product)\/([A-Z0-9]{10})/i`
  - McMaster-Carr catalog numbers: `mcmaster.com/<part#>` (e.g. `89205K161`, `4974T226`)
- **Vendor Inference**: Extracted from link domains (`mcmaster.com` $\to$ `McMaster-Carr`, `amazon.com` $\to$ `Amazon`, `grainger.com` $\to$ `Grainger`, `digikey.com` $\to$ `DigiKey`, etc.).
- **Missing Quantities**: Safe fallback to `1` unit when no quantity column is present (e.g. 4-column tables: `[Description] [Price] [Link] [Vendor]`).
- **Quote & Inch Mark Invariant**: Handles unescaped inch marks in product titles (e.g. `1/8" dash 255 O ring` or `(12.5"x12.5")`) without breaking delimiters.

### Multi-Vendor Isolation Workflow

UC Davis Pre-Purchasing restricts each order request to a single vendor. When mixed vendors are detected:
1. AutoFill is locked for "All Vendors" to prevent mixed submissions.
2. Filter pills appear (`[● All Vendors] [○ McMaster-Carr] [○ Amazon]`).
3. Click a vendor pill to isolate items for that vendor and unlock AutoFill.
4. Fill and submit the request in the portal, then select the next vendor pill to populate the remaining items—**no spreadsheet re-copying required**.

### 💡 Recommended Workflow: Exporting Amazon Carts to CSV

If you are placing orders from Amazon, you don't need to create your spreadsheet manually! This tool was built to integrate cleanly with the [AMZ Cart Export](https://chromewebstore.google.com/detail/amz-cart-export-export-yo/eijailhjjlcfiafgpghlcaoceabflbln) browser extension:

1. Add your items to your Amazon cart.
2. Click **[AMZ Cart Export](https://chromewebstore.google.com/detail/amz-cart-export-export-yo/eijailhjjlcfiafgpghlcaoceabflbln)** to download your cart items directly into a CSV spreadsheet (this automatically populates columns 1–6: Item Name, ASIN, Qty, Unit Price, Total Price, and Product Link).
3. Open the downloaded CSV in Excel, Google Sheets, or any text editor and **add the two remaining columns**:
   - **Column 7 (`Vendor`)**: Enter `Amazon` (or leave empty if the URL is an Amazon link; the assistant infers it automatically).
   - **Column 8 (`Item Notes`)**: Enter line-item notes or purpose (e.g., *"Cleaning up the office + general tools"*). Order-level justification can be preconfigured once in the Settings tab.
4. Save the file and drop it into the Pre-Purchasing Assistant drawer!

---

## Repository Structure

```text
Pre-Perchase-Automation/
├── browser-extension/              # Browser extension manifest, modular scripts, styles, and icons
│   ├── src/                        # Modular content script engine
│   │   ├── icons.js                # Lucide SVG icon definitions
│   │   ├── constants.js            # Settings defaults and storage helpers
│   │   ├── template.js             # Injected drawer HTML layout component
│   │   ├── dom_helpers.js          # Portal DOM interaction and event dispatchers
│   │   ├── parser.js               # CSV/TSV spreadsheet parsing engine
│   │   ├── autofill.js             # Form population engine
│   │   └── ui.js                   # Injected drawer UI and event listeners
│   ├── styles.css                  # UI styling with UC Davis theme
│   ├── manifest.json               # Manifest V3 extension configuration
│   └── icons/                      # WebExtension action and toolbar icons
├── examples/                       # Sample order spreadsheets
│   └── Example Amazon Purchase Data.csv
└── test-harness/                   # Development test fixtures and mock server
    ├── extracted_page.html         # Local sanitized DOM snapshot of the portal
    ├── serve_mock.py               # Local HTTP server with extension pre-injected
    └── test_autofill.py            # Automated unit and integration test suite
```

---

## Development & Testing

### Offline Mock Server
You can test the entire extension and form-filling flow offline without connecting to the live UC Davis portal:

1. Start the local mock server:
   ```bash
   python test-harness/serve_mock.py
   ```
2. Open your browser to:
   ```
   http://localhost:8000/Order/Request/5163
   ```
3. The mock server serves a local snapshot of the UC Davis portal with the extension pre-injected. Drop [`examples/Example Amazon Purchase Data.csv`](examples/Example%20Amazon%20Purchase%20Data.csv) into the drawer and test the filling sequence!

### Automated Test Suite
Run the automated test suite anytime to verify syntax, selectors, mock page compatibility, and modular parsing logic:
```bash
python -m unittest test-harness/test_autofill.py
```

---

## Credits & Support

Developed by [Jason Pieck](https://jdpieck.github.io/) using [Gemini](https://gemini.google.com/).

- **GitHub Issues**: If you run into bugs, need help, or have feature requests, please [submit an issue on GitHub](https://github.com/jdpieck/Pre-Purchasing-Automation/issues).
- **Email Contact**: You can also reach out directly via email at [jdpieck@ucdavis.edu](mailto:jdpieck@ucdavis.edu?subject=Pre-Purchasing%20Assistant%20Feedback).

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.

- **Copyleft**: Guarantees that anyone who modifies or incorporates this code into their own projects must also release their full source code under the GPLv3.
- **Freedom & Open Source**: Users have the freedom to run, study, share, and modify the software without proprietary lock-in.

See the full [LICENSE](LICENSE) file for complete legal terms.
