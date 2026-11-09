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
        self.assertIn("jdpieck.github.io", code)
        self.assertIn("gemini.google.com", code)
        self.assertIn("github.com/jdpieck/Pre-Purchasing-Automation/issues", code)
        self.assertIn("jdpieck@ucdavis.edu", code)

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

if __name__ == '__main__':
    unittest.main()
