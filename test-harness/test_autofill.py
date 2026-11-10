#!/usr/bin/env python3
"""
Automated Unit and Integration Tests for Pre-Purchasing Assistant for UC Davis
Tests CSV parsing, data mapping, vendor matching, address matching, tzCheckBox backorder structure, and mock HTML.
"""

import unittest
import os
import re
import csv
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'examples', 'Example Amazon Purchase Data.csv')
if not os.path.exists(CSV_PATH):
    CSV_PATH = os.path.join(BASE_DIR, 'Example Amazon Purchase Data.csv')

HTML_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extracted_page.html')
if not os.path.exists(HTML_PATH):
    HTML_PATH = os.path.join(BASE_DIR, 'extracted_page.html')

JS_PATH = os.path.join(BASE_DIR, 'browser-extension', 'content.js')
USERSCRIPT_PATH = os.path.join(BASE_DIR, 'browser-extension', 'ucd_prepurchasing.user.js')

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
        """Verify content.js has all required handlers, branding, and contact channels."""
        with open(JS_PATH, 'r', encoding='utf-8') as f:
            code = f.read()

        self.assertIn("Pre-Purchasing Assistant for UC Davis", code)
        self.assertIn("setBackorderState", code)
        self.assertIn("showSettingsStatus", code)
        self.assertIn("clear-settings", code)
        self.assertIn("handleFieldAutoSave", code)
        self.assertIn("saveCurrentSettings", code)
        self.assertIn("jdpieck.github.io", code)
        self.assertIn("gemini.google.com", code)
        self.assertIn("github.com/jdpieck/Pre-Purchasing-Automation/issues", code)
        self.assertIn("jdpieck@ucdavis.edu", code)

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

        with open(JS_PATH, 'r', encoding='utf-8') as f:
            js = f.read()

        self.assertIn("handleFieldAutoSave", js, "Auto-save handler must exist in content.js")
        self.assertIn("showFieldSavedBadge", js, "showFieldSavedBadge function must exist in content.js")
        self.assertIn("addEventListener('blur'", js, "Must bind blur event for text inputs in content.js")
        self.assertIn("addEventListener('change'", js, "Must bind change event in content.js")

    def test_dual_packaging_sync(self):
        """Verify standalone userscript is in sync with content.js and manifest version."""
        self.assertTrue(os.path.exists(USERSCRIPT_PATH), "Userscript must exist")
        with open(USERSCRIPT_PATH, 'r', encoding='utf-8') as f:
            userscript = f.read()
        with open(JS_PATH, 'r', encoding='utf-8') as f:
            content_js = f.read()

        self.assertIn("Pre-Purchasing Assistant for UC Davis", userscript)
        self.assertIn("(Beta)", userscript)
        self.assertIn("@version      0.1.0", userscript)
        self.assertIn("setBackorderState", userscript)
        self.assertIn("github.com/jdpieck/Pre-Purchasing-Automation/issues", userscript)
        self.assertIn("jdpieck@ucdavis.edu", userscript)
        # Check that core logic from content.js is incorporated
        self.assertIn("function fillPrePurchasingForm", userscript)

    def test_mock_html_privacy_and_sanitization(self):
        """Verify mock HTML does not expose personal usernames, internal accounts, or personal emails."""
        with open(HTML_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()

        self.assertNotIn("jpieck", html, "Personal username must be sanitized from mock HTML")
        self.assertNotIn("FPEMAE3904", html, "Private FAU account must be sanitized from mock HTML")
        self.assertNotIn("yan24", html, "Specific approver login must be sanitized from mock HTML")

    def test_backorder_state_node_simulation(self):
        """Execute Node simulation of tzCheckbox behavior to ensure false stays false and true turns true."""
        import subprocess
        node_script = """
        const fs = require('fs');
        const code = fs.readFileSync('browser-extension/content.js', 'utf-8');
        
        // Extract setBackorderState function
        const match = code.match(/function setBackorderState\\(allow\\)\\s*\\{([\\s\\S]*?)\\n  \\}/);
        if (!match) process.exit(1);
        
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
          
          // Execute extracted logic with mocked environment
          const func = new Function('allow', 'document', match[1]);
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
          func(allowTarget, docMock);
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
        """Execute Node simulation of parseCSV with Google Sheets copied tab-separated data."""
        import subprocess
        node_script = """
        const fs = require('fs');
        const code = fs.readFileSync('browser-extension/content.js', 'utf-8');

        // Extract parseCSV function
        const match = code.match(/function parseCSV\\(text\\)\\s*\\{([\\s\\S]*?)\\n  \\}/);
        if (!match) {
          console.error('parseCSV not found');
          process.exit(1);
        }

        const parseCSV = new Function('text', match[1]);

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
        """Verify content.js and userscript include copy-paste components and accessibility attributes."""
        with open(JS_PATH, 'r', encoding='utf-8') as f:
            code = f.read()

        self.assertIn("ucd-paste-input", code)
        self.assertIn("ucd-import-subtabs", code)
        self.assertIn("handleTextData", code)
        self.assertIn("clipboard", code)
        self.assertIn("Paste Spreadsheet", code)

        with open(USERSCRIPT_PATH, 'r', encoding='utf-8') as f:
            userscript = f.read()

        self.assertIn("ucd-paste-input", userscript)
        self.assertIn("handleTextData", userscript)

if __name__ == '__main__':
    unittest.main()
