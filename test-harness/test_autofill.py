#!/usr/bin/env python3
"""
Automated Unit and Integration Tests for Pre-Purchasing Assistant for UC Davis
Tests CSV parsing, data mapping, vendor matching, address matching, tzCheckBox backorder structure, and modular extension files.
"""

import unittest
import os
import re
import csv
import json
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'examples', 'Example Amazon Purchase Data.csv')
if not os.path.exists(CSV_PATH):
    CSV_PATH = os.path.join(BASE_DIR, 'Example Amazon Purchase Data.csv')

HTML_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extracted_page.html')
if not os.path.exists(HTML_PATH):
    HTML_PATH = os.path.join(BASE_DIR, 'extracted_page.html')

SRC_DIR = os.path.join(BASE_DIR, 'browser-extension', 'src')
ICONS_DIR = os.path.join(BASE_DIR, 'browser-extension', 'icons')
MANIFEST_PATH = os.path.join(BASE_DIR, 'browser-extension', 'manifest.json')

class TestPrePurchasingAutoFill(unittest.TestCase):

    def test_csv_file_structure(self):
        """Verify Example Amazon Purchase Data.csv has 10 items and expected columns."""
        self.assertTrue(os.path.exists(CSV_PATH), "CSV file must exist")
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)

        self.assertEqual(len(rows), 10, "Expected exactly 10 items in example CSV")
        row0 = rows[0]
        self.assertIn("Microfiber Cleaning Cloth", row0[0])
        self.assertEqual(row0[1], "B08BRJHJF9")
        self.assertEqual(row0[2], "1")
        self.assertIn("7.98", row0[3])
        self.assertTrue(row0[5].startswith("https://www.amazon.com/"))
        self.assertEqual(row0[6], "Amazon")
        self.assertIn("Cleaning up the office", row0[7])

    def test_vendor_matching_against_html(self):
        """Verify 'Amazon' matches the vendor option in the UC Davis portal."""
        with open(HTML_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()

        vendor_match = re.search(r'<select[^>]*id=["\']vendor["\'][^>]*>(.*?)</select>', html, re.DOTALL)
        self.assertIsNotNone(vendor_match)
        options = re.findall(r'<option[^>]*value=["\']([^"\']*)["\'][^>]*>(.*?)</option>', vendor_match.group(1))

        matched = next((opt for opt in options if 'amazon' in opt[1].lower()), None)
        self.assertIsNotNone(matched)
        self.assertEqual(matched[0], "253260")

    def test_shipping_address_matching(self):
        """Verify '1014 A Ghausi Hall' matches shipping address option 53406."""
        with open(HTML_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()

        addr_match = re.search(r'<select[^>]*id=["\']shipAddress["\'][^>]*>(.*?)</select>', html, re.DOTALL)
        self.assertIsNotNone(addr_match)
        options = re.findall(r'<option[^>]*value=["\']([^"\']*)["\'][^>]*>(.*?)</option>', addr_match.group(1))

        matched = next((opt for opt in options if '1014 a ghausi hall' in opt[1].lower()), None)
        self.assertIsNotNone(matched)
        self.assertEqual(matched[0], "53406")

    def test_backorder_checkbox_structure(self):
        """Verify backorder checkbox and its tzCheckBox container in the portal HTML."""
        with open(HTML_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()

        self.assertIn('name="backorder"', html, "Must contain input name backorder")
        self.assertIn('tzCheckBox', html, "Must contain tzCheckBox container in HTML")

    def test_date_needed_offset_logic(self):
        """Verify future date string generation format (MM/DD/YYYY)."""
        future_date = datetime.now() + timedelta(days=7)
        expected_str = future_date.strftime("%m/%d/%Y")
        self.assertTrue(re.match(r'^\d{2}/\d{2}/\d{4}$', expected_str))

    def test_extension_javascript_syntax_and_handlers(self):
        """Verify modular source files have all required handlers, branding, and contact channels."""
        ui_path = os.path.join(SRC_DIR, 'ui.js')
        template_path = os.path.join(SRC_DIR, 'template.js')
        dom_path = os.path.join(SRC_DIR, 'dom_helpers.js')
        icons_path = os.path.join(SRC_DIR, 'icons.js')

        self.assertTrue(os.path.exists(ui_path), "ui.js must exist")
        self.assertTrue(os.path.exists(template_path), "template.js must exist")
        self.assertTrue(os.path.exists(dom_path), "dom_helpers.js must exist")
        self.assertTrue(os.path.exists(icons_path), "icons.js must exist")

        with open(ui_path, 'r', encoding='utf-8') as f:
            ui_code = f.read()
        with open(template_path, 'r', encoding='utf-8') as f:
            template_code = f.read()
        with open(dom_path, 'r', encoding='utf-8') as f:
            dom_code = f.read()
        with open(icons_path, 'r', encoding='utf-8') as f:
            icons_code = f.read()

        self.assertIn("Pre-Purchasing Assistant for UC Davis", template_code)
        self.assertIn("jdpieck.github.io", template_code)
        self.assertIn("gemini.google.com", template_code)
        self.assertIn("github.com/jdpieck/Pre-Purchasing-Automation/issues", template_code)
        self.assertIn("jdpieck@ucdavis.edu", template_code)

        self.assertIn("showSettingsStatus", ui_code)
        self.assertIn("clear-settings", ui_code)
        self.assertIn("handleFieldAutoSave", ui_code)
        self.assertIn("saveCurrentSettings", ui_code)

        self.assertIn("setBackorderState", dom_code)
        self.assertIn("getIconUrl", icons_code)

    def test_tabs_span_and_settings_autosave(self):
        """Verify tab buttons span full width and settings auto-save is implemented in CSS and JS."""
        css_path = os.path.join(BASE_DIR, 'browser-extension', 'styles.css')
        with open(css_path, 'r', encoding='utf-8') as f:
            css = f.read()

        tab_btn_match = re.search(r'\.ucd-tab-btn\s*\{([^}]+)\}', css)
        self.assertIsNotNone(tab_btn_match, ".ucd-tab-btn must exist in styles.css")
        tab_rules = tab_btn_match.group(1)
        self.assertIn("flex: 1", tab_rules, ".ucd-tab-btn must have flex: 1 to span full horizontal space")
        self.assertIn("justify-content: center", tab_rules, ".ucd-tab-btn must have justify-content: center")

        self.assertIn(".ucd-input-saved", css, "Must define .ucd-input-saved visual feedback style in styles.css")
        self.assertIn(".ucd-field-saved-badge", css, "Must define .ucd-field-saved-badge in styles.css")
        self.assertIn(".ucd-settings-floating-toast", css, "Must define .ucd-settings-floating-toast in styles.css")

        ui_path = os.path.join(SRC_DIR, 'ui.js')
        with open(ui_path, 'r', encoding='utf-8') as f:
            js = f.read()

        self.assertIn("handleFieldAutoSave", js, "Auto-save handler must exist in ui.js")
        self.assertIn("showFieldSavedBadge", js, "showFieldSavedBadge function must exist in ui.js")
        self.assertIn("addEventListener('blur'", js, "Must bind blur event for text inputs in ui.js")
        self.assertIn("addEventListener('change'", js, "Must bind change event in ui.js")

    def test_mock_html_privacy_and_sanitization(self):
        """Verify mock HTML does not expose personal usernames, internal accounts, or personal emails."""
        with open(HTML_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()

        self.assertNotIn("jpieck", html, "Personal username must be sanitized from mock HTML")
        self.assertNotIn("FPEMAE3904", html, "Private FAU account must be sanitized from mock HTML")
        self.assertNotIn("yan24", html, "Specific approver login must be sanitized from mock HTML")

    def test_backorder_state_node_simulation(self):
        """Execute Node simulation of tzCheckbox behavior using dom_helpers module."""
        import subprocess
        node_script = """
        const { setBackorderState } = require('./browser-extension/src/dom_helpers.js');
        
        function runTest(initChecked, allowTarget) {
          let checkbox = { checked: initChecked, setAttribute: () => {}, removeAttribute: () => {} };
          let classes = new Set(['tzCheckBox', ...(initChecked ? ['checked'] : [])]);
          let tzSpan = {
            classList: {
              contains: (c) => classes.has(c),
              add: (c) => classes.add(c),
              remove: (c) => classes.delete(c)
            },
            click: () => {
              if (classes.has('checked')) {
                classes.delete('checked');
                tzContent.textContent = 'No';
                checkbox.checked = false;
              } else {
                classes.add('checked');
                tzContent.textContent = 'Yes';
                checkbox.checked = true;
              }
            }
          };
          let tzContent = { textContent: initChecked ? 'Yes' : 'No' };
          
          const docMock = {
            querySelector: (sel) => {
              if (sel === 'input[name="backorder"]') {
                return {
                  ...checkbox,
                  closest: () => ({ querySelector: (s) => s === '.tzCheckBox' ? tzSpan : tzContent })
                };
              }
              return null;
            }
          };
          setBackorderState(allowTarget, docMock);
          return { checked: classes.has('checked'), text: tzContent.textContent };
        }
        
        // 1. Initial false -> target false (must stay No / unchecked)
        const res1 = runTest(false, false);
        if (res1.checked !== false || res1.text !== 'No') process.exit(2);
        
        // 2. Initial false -> target true (must become Yes / checked)
        const res2 = runTest(false, true);
        if (res2.checked !== true || res2.text !== 'Yes') process.exit(3);
        
        // 3. Initial true -> target false (must revert to No / unchecked)
        const res3 = runTest(true, false);
        if (res3.checked !== false || res3.text !== 'No') process.exit(4);
        
        process.exit(0);
        """
        proc = subprocess.run(["node", "-e", node_script], cwd=BASE_DIR, capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, f"Backorder Node simulation failed: {proc.stderr}")

    def test_copy_paste_tsv_node_simulation(self):
        """Execute Node simulation of parseCSV with parser module."""
        import subprocess
        node_script = """
        const { parseCSV } = require('./browser-extension/src/parser.js');

        const tsvData = `USANOOKS Microfiber Cleaning Cloth Grey - 12 Pcs (12.5"x12.5") - High Performance - 1200 Washes Ultra Absorbent Microfiber Towel Weave Grime & Liquid for Streak-Free Mirror Shine - Car Washing Cloth\\tB08BRJHJF9\\t1\\t$7.98\\t$7.98\\thttps://www.amazon.com/gp/product/B08BRJHJF9/ref=ox_sc_act_title_1?smid=A3J8SPWK5KKD5E&psc=1\\tAmazon\\tCleaning up the office + general tools
Schneider Black Nitrile Exam Gloves Box of 100 Latex Free & Powder Free Disposable Gloves for Medical Food Prep & Cleaning Medium\\tB0FBGSPTPP\\t1\\t$7.19\\t$7.19\\thttps://www.amazon.com/gp/product/B0FBGSPTPP/ref=ox_sc_act_title_2?smid=A1UQTBRX1IU1GT&psc=1\\tAmazon\\tCleaning up the office + general tools
OneLeaf 60Pcs Reusable Cable Ties with Hook and Loop 3 Sizes Wire Ties | Fastening Multi-Purpose Cable Straps Adjustable Cable Management Ties for Organizing Computer/ TV/ Electronics 5 Colors\\tB083FKB7BL\\t1\\t$8.19\\t$8.19\\thttps://www.amazon.com/gp/product/B083FKB7BL/ref=ox_sc_act_title_3?smid=A186T7XWK88CES&psc=1\\tAmazon\\tCleaning up the office + general tools
Sharpie Permanent Markers Fine Tip Black 12 Count - Quick Drying Fade Resistant For Wood Plastic Paper Metal And More\\tB00006IFHD\\t1\\t$7.00\\t$7.00\\thttps://www.amazon.com/gp/product/B00006IFHD/ref=ox_sc_act_title_4?smid=ATVPDKIKX0DER&psc=1\\tAmazon\\tCleaning up the office + general tools
Goo Gone Adhesive Remover Spray Gel 12 Oz with Scraper Surface Safe | Citrus Cleaning Power for Hard Surfaces Carpet & Fabric Removes Glue Stickers Tape Residue Grease Gum & Wax Drip Free\\tB0F1DXKQRS\\t1\\t$15.75\\t$15.75\\thttps://www.amazon.com/gp/product/B0F1DXKQRS/ref=ox_sc_act_title_5?smid=A1ZWQ2E5HX10B0&psc=1\\tAmazon\\tCleaning up the office + general tools
Duck Brand Clean Release Blue Painter's Tape 1.88 in x 60 Yds 3 Rolls | Blue 2 Inch Painters Tape for Painting on Multiple Surfaces Blue Masking Tape 2 inch Wide Clean Removal 180 Total Yards\\tB00L2JOV0I\\t1\\t$18.76\\t$18.76\\thttps://www.amazon.com/gp/product/B00L2JOV0I/ref=ox_sc_act_title_6?smid=ATVPDKIKX0DER&psc=1\\tAmazon\\tCleaning up the office + general tools
Amazon Basics No Residue Non-Reflective Gaffers Tape for Photography 2 inch x 90 feet Black\\tB07K1WW8WW\\t1\\t$10.49\\t$10.49\\thttps://www.amazon.com/gp/product/B07K1WW8WW/ref=ox_sc_act_title_7?smid=ATVPDKIKX0DER&psc=1\\tAmazon\\tCleaning up the office + general tools
ScotchBlue Original Multi-Surface Painters Tape 1 Inch Wide (0.94 in. x 60 Yds) 3 Rolls Blue Paint Tape Protects and Removes Easily Masking Tape for Indoor and Outdoor Use (2090-24EC3)\\tB089NYWHJ5\\t1\\t$14.94\\t$14.94\\thttps://www.amazon.com/gp/product/B089NYWHJ5/ref=ox_sc_act_title_8?smid=ATVPDKIKX0DER&psc=1\\tAmazon\\tCleaning up the office + general tools
M MEEPO 4-Pack Box Cutter Colorful Folding Utility Knife w/ 10 pcs Blades | Tough Design Razor Sharp Blade Comfortable Handle Can cut Drywall Sheet Plastic Linoleum Boxes Rope\\tB09JYJLQXF\\t1\\t$9.99\\t$9.99\\thttps://www.amazon.com/gp/product/B09JYJLQXF/ref=ox_sc_act_title_9?smid=A10BNM4HVCCPTN&psc=1\\tAmazon\\tCleaning up the office + general tools
Cable Zip Ties400 Pack Black Assorted Sizes 12+8+6+4 InchMulti-Purpose Self-Locking Nylon Cable Cord ManagementPlastic Wire Ties for HomeOfficeGardenWorkshop. By HAVE ME TD\\tB08TVLYB3Q\\t1\\t$6.99\\t$6.99\\thttps://www.amazon.com/gp/product/B08TVLYB3Q/ref=ox_sc_act_title_10?smid=A3QR7MJ9FCPSP7&psc=1\\tAmazon\\tCleaning up the office + general tools`;

        const items = parseCSV(tsvData);
        if (items.length !== 10) {
          console.error(`Expected 10 items, got ${items.length}`);
          process.exit(2);
        }

        const item0 = items[0];
        if (!item0.name.includes('Microfiber Cleaning Cloth')) process.exit(3);
        if (item0.asin !== 'B08BRJHJF9') process.exit(4);
        if (item0.qty !== 1) process.exit(5);
        if (item0.unitPrice !== '7.98') process.exit(6);
        if (item0.totalPrice !== '7.98') process.exit(7);
        if (!item0.url.includes('B08BRJHJF9')) process.exit(8);
        if (item0.vendor !== 'Amazon') process.exit(9);
        if (!item0.purpose.includes('Cleaning up the office')) process.exit(10);

        // Test with headers included
        const withHeaders = `Item Name\\tASIN / Catalog #\\tQty\\tPrice (Unit)\\tPrice (Total)\\tLink\\tVendor\\tPurpose\\n` + tsvData;
        const itemsWithHeaders = parseCSV(withHeaders);
        if (itemsWithHeaders.length !== 10) {
          console.error(`Expected 10 items with header, got ${itemsWithHeaders.length}`);
          process.exit(11);
        }

        // Test quotes/inches inside unquoted item name
        const inchItem = parseCSV(`12" Heavy Duty Steel Ruler\\tB001XYZ\\t2\\t$15.00\\t$30.00\\thttps://amazon.com\\tAmazon\\tLab tools`)[0];
        if (inchItem.name !== '12" Heavy Duty Steel Ruler' || inchItem.asin !== 'B001XYZ' || inchItem.qty !== 2) {
          process.exit(12);
        }

        process.exit(0);
        """
        proc = subprocess.run(["node", "-e", node_script], cwd=BASE_DIR, capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, f"Copy-paste TSV Node simulation failed: {proc.stderr}")

    def test_copy_paste_ui_handlers_and_branding(self):
        """Verify template.js and ui.js include copy-paste components and accessibility attributes."""
        ui_path = os.path.join(SRC_DIR, 'ui.js')
        template_path = os.path.join(SRC_DIR, 'template.js')
        with open(ui_path, 'r', encoding='utf-8') as f:
            ui_code = f.read()
        with open(template_path, 'r', encoding='utf-8') as f:
            template_code = f.read()

        self.assertIn("ucd-paste-input", template_code)
        self.assertIn("ucd-import-subtabs", template_code)
        self.assertIn("Paste Spreadsheet", template_code)

        self.assertIn("handleTextData", ui_code)
        self.assertIn("clipboard", ui_code)

    def test_modular_manifest_and_icons_architecture(self):
        """Verify manifest.json has modular script sequence and icons reference the icons/ directory."""
        self.assertTrue(os.path.exists(MANIFEST_PATH), "manifest.json must exist")
        with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
            manifest = json.load(f)

        js_files = manifest["content_scripts"][0]["js"]
        expected_modules = [
            "src/icons.js",
            "src/constants.js",
            "src/template.js",
            "src/dom_helpers.js",
            "src/parser.js",
            "src/autofill.js",
            "src/ui.js"
        ]
        self.assertEqual(js_files, expected_modules, "manifest.json must load modular scripts in exact sequence")

        # Verify icons.js references files without hardcoded SVG paths
        icons_js_path = os.path.join(SRC_DIR, 'icons.js')
        with open(icons_js_path, 'r', encoding='utf-8') as f:
            icons_js = f.read()

        self.assertIn("ICON_FILES", icons_js)
        self.assertIn("getIconUrl", icons_js)
        self.assertNotIn("<path d=", icons_js, "icons.js must reference icons folder instead of hardcoding SVG path strings")

        # Verify all icons mapped in ICON_FILES exist in browser-extension/icons/
        for filename in ["zap.svg", "settings.svg", "help.svg", "close.svg", "upload.svg", "package.svg",
                         "building.svg", "dollar.svg", "save.svg", "clear.svg", "mail.svg", "github.svg",
                         "info.svg", "trash.svg", "file.svg", "clipboard.svg"]:
            svg_path = os.path.join(ICONS_DIR, filename)
            self.assertTrue(os.path.exists(svg_path), f"Icon file {filename} must exist in icons/ directory")

        # Verify retired userscript files are not present
        userscript_path = os.path.join(BASE_DIR, 'browser-extension', 'ucd_prepurchasing.user.js')
        build_script_path = os.path.join(BASE_DIR, 'scripts', 'build_userscript.py')
        content_js_path = os.path.join(BASE_DIR, 'browser-extension', 'content.js')
        self.assertFalse(os.path.exists(userscript_path), "ucd_prepurchasing.user.js must be deleted")
        self.assertFalse(os.path.exists(build_script_path), "build_userscript.py must be deleted")
        self.assertFalse(os.path.exists(content_js_path), "content.js monolith must be replaced by src/ modules")

    def test_date_needed_string_concatenation_fix(self):
        """Verify getFutureDate handles string integers safely without concatenation."""
        import subprocess
        node_script = """
        const { getFutureDate } = require('./browser-extension/src/dom_helpers.js');
        const res7Str = getFutureDate("7");
        const res14Str = getFutureDate("14");
        const res10Num = getFutureDate(10);
        console.log(JSON.stringify({ res7Str, res14Str, res10Num }));
        """
        proc = subprocess.run(['node', '-e', node_script], cwd=BASE_DIR, capture_output=True, text=True, check=True)
        data = json.loads(proc.stdout.strip())

        today = datetime.now()
        expected_7 = (today + timedelta(days=7)).strftime("%m/%d/%Y")
        expected_14 = (today + timedelta(days=14)).strftime("%m/%d/%Y")
        expected_10 = (today + timedelta(days=10)).strftime("%m/%d/%Y")

        self.assertEqual(data['res7Str'], expected_7, "String '7' must yield exactly 7 days from today")
        self.assertEqual(data['res14Str'], expected_14, "String '14' must yield exactly 14 days from today")
        self.assertEqual(data['res10Num'], expected_10, "Number 10 must yield exactly 10 days from today")

    def test_incomplete_table_heuristics_and_math(self):
        """Verify parser derives missing unit price, total price, Amazon ASIN, and vendor from URL."""
        import subprocess
        node_script = """
        const { parseCSV } = require('./browser-extension/src/parser.js');

        // Case 1: Missing unit price (has total price and qty) + vendor from URL
        const tsv1 = "Description\\tQuantity\\tTotal Price\\tProduct Link\\tItem Notes\\nHex Bolts\\t5\\t25.00\\thttps://www.mcmaster.com/123\\tChassis frame";
        const items1 = parseCSV(tsv1);

        // Case 2: Missing total price + missing ASIN (extracted from Amazon URL)
        const csv2 = "Product Name,Qty,Price Each,URL\\nWireless Mouse,3,15.00,https://www.amazon.com/dp/B09XYZ1234";
        const items2 = parseCSV(csv2);

        // Case 3: Incomplete row with safe fallbacks
        const tsv3 = "Item\\nOnlyName";
        const items3 = parseCSV(tsv3);

        console.log(JSON.stringify({ items1, items2, items3 }));
        """
        proc = subprocess.run(['node', '-e', node_script], cwd=BASE_DIR, capture_output=True, text=True, check=True)
        data = json.loads(proc.stdout.strip())

        item1 = data['items1'][0]
        self.assertEqual(item1['name'], "Hex Bolts")
        self.assertEqual(item1['qty'], 5)
        self.assertEqual(item1['unitPrice'], "5.00", "Unit price must be derived as $25.00 / 5 = $5.00")
        self.assertEqual(item1['totalPrice'], "25.00")
        self.assertEqual(item1['vendor'], "McMaster-Carr", "Vendor must be inferred from mcmaster.com URL")
        self.assertEqual(item1['notes'], "Chassis frame")

        item2 = data['items2'][0]
        self.assertEqual(item2['name'], "Wireless Mouse")
        self.assertEqual(item2['qty'], 3)
        self.assertEqual(item2['asin'], "B09XYZ1234", "ASIN must be extracted from Amazon URL")
        self.assertEqual(item2['unitPrice'], "15.00")
        self.assertEqual(item2['totalPrice'], "45.00", "Total price must be derived as 3 * $15.00 = $45.00")
        self.assertEqual(item2['vendor'], "Amazon")

        item3 = data['items3'][0]
        self.assertEqual(item3['name'], "OnlyName")
        self.assertEqual(item3['qty'], 1, "Qty must fallback to 1")
        self.assertEqual(item3['unitPrice'], "0.00", "Unit price must fallback to 0.00")
        self.assertEqual(item3['totalPrice'], "0.00", "Total price must fallback to 0.00")

    def test_multi_vendor_detection_and_filtering(self):
        """Verify multi-vendor orders are detected and can be isolated by vendor."""
        import subprocess
        node_script = """
        const { parseCSV } = require('./browser-extension/src/parser.js');
        const data = "Description\\tQty\\tPrice\\tVendor\\nScrew\\t10\\t1.00\\tMcMaster-Carr\\nCable\\t2\\t5.00\\tAmazon\\nNut\\t20\\t0.50\\tMcMaster-Carr";
        const items = parseCSV(data);

        const vendors = new Set(items.map(it => it.vendor));
        const mcmasterItems = items.filter(it => it.vendor === 'McMaster-Carr');
        const amazonItems = items.filter(it => it.vendor === 'Amazon');

        console.log(JSON.stringify({
          uniqueVendorCount: vendors.size,
          mcmasterCount: mcmasterItems.length,
          amazonCount: amazonItems.length
        }));
        """
        proc = subprocess.run(['node', '-e', node_script], cwd=BASE_DIR, capture_output=True, text=True, check=True)
        res = json.loads(proc.stdout.strip())

        self.assertEqual(res['uniqueVendorCount'], 2, "Must detect exactly 2 unique vendors")
        self.assertEqual(res['mcmasterCount'], 2, "Must filter 2 McMaster items")
        self.assertEqual(res['amazonCount'], 1, "Must filter 1 Amazon item")

    def test_terminology_and_item_notes(self):
        """Verify 'Item Notes' terminology consistency and UI elements for vendor bar & date preview."""
        template_path = os.path.join(SRC_DIR, 'template.js')
        with open(template_path, 'r', encoding='utf-8') as f:
            template = f.read()

        self.assertIn("Item Notes", template, "Must reference 'Item Notes' in template")
        self.assertIn("ucd-vendor-section", template, "Must include ucd-vendor-section in template")
        self.assertIn("ucd-vendor-filter-bar", template, "Must include ucd-vendor-filter-bar in template")
        self.assertIn("ucd-date-preview-label", template, "Must include ucd-date-preview-label in template")
        self.assertIn("Default Order Justification", template, "Must clarify default justification in Settings")

        css_path = os.path.join(BASE_DIR, 'browser-extension', 'styles.css')
        with open(css_path, 'r', encoding='utf-8') as f:
            css = f.read()

        self.assertIn(".ucd-vendor-warning-banner", css, "styles.css must style vendor warning banner")
        self.assertIn(".ucd-vendor-filter-bar", css, "styles.css must style vendor filter bar")
        self.assertIn(".ucd-vendor-pill", css, "styles.css must style vendor filter pills")
        self.assertIn(".ucd-date-preview", css, "styles.css must style date preview label")

    def test_mcmaster_irregular_order_parsing(self):
        """Verify 4-column McMaster order with unescaped inch marks, spaces in price, and no quantity column."""
        import subprocess
        node_script = """
        const { parseCSV } = require('./browser-extension/src/parser.js');
        const text = [
          '3/8 hex SS bar\\t $ 25.44 \\t https://www.mcmaster.com/89205K161/ \\tMcMaster Carr',
          'USB C Cable\\t $ 21.27 \\t https://www.mcmaster.com/4974T226/ \\tMcMaster Carr',
          '1/8" dash 255 O ring\\t $ 6.99 \\t https://www.mcmaster.com/9452K356/ \\tMcMaster Carr',
          '3/4" #4-40 BHCS\\t $ 5.17 \\t https://www.mcmaster.com/98164A434/ \\tMcMaster Carr',
          '1/16 hex keys\\t $ 1.65 \\t https://www.mcmaster.com/7122A39/ \\tMcMaster Carr',
          '1/8 hex keys\\t $ 2.30 \\t https://www.mcmaster.com/7122A44/ \\tMcMaster Carr',
          '1-3/8 1/4-20 BHCS\\t $ 9.20 \\t https://www.mcmaster.com/92949A836/ \\tMcMaster Carr'
        ].join('\\n');

        const items = parseCSV(text);
        console.log(JSON.stringify(items));
        """
        proc = subprocess.run(['node', '-e', node_script], cwd=BASE_DIR, capture_output=True, text=True, check=True)
        items = json.loads(proc.stdout.strip())

        self.assertEqual(len(items), 7, "All 7 McMaster items must be parsed")

        item0 = items[0]
        self.assertEqual(item0['name'], "3/8 hex SS bar")
        self.assertEqual(item0['qty'], 1, "Quantity must default to 1, not price digits")
        self.assertEqual(item0['unitPrice'], "25.44", "Price must be accurately parsed without space corruption")
        self.assertEqual(item0['totalPrice'], "25.44")
        self.assertEqual(item0['asin'], "89205K161", "McMaster part number must be extracted from URL")
        self.assertEqual(item0['vendor'], "McMaster-Carr", "Vendor must be normalized")

        item2 = items[2]
        self.assertEqual(item2['name'], '1/8" dash 255 O ring', "Unescaped inch mark in title must be preserved")
        self.assertEqual(item2['qty'], 1)
        self.assertEqual(item2['unitPrice'], "6.99")
        self.assertEqual(item2['asin'], "9452K356")

if __name__ == '__main__':
    unittest.main()
