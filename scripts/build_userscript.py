#!/usr/bin/env python3
"""
Dual-Packaging Synchronization Script.
Compiles and synchronizes browser-extension/content.js and browser-extension/styles.css
into the standalone browser-extension/ucd_prepurchasing.user.js userscript.
"""

import os
import json
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT_DIR = os.path.join(BASE_DIR, 'browser-extension')
MANIFEST_PATH = os.path.join(EXT_DIR, 'manifest.json')
CONTENT_JS_PATH = os.path.join(EXT_DIR, 'content.js')
STYLES_CSS_PATH = os.path.join(EXT_DIR, 'styles.css')
USERSCRIPT_PATH = os.path.join(EXT_DIR, 'ucd_prepurchasing.user.js')

def build():
    if not os.path.exists(MANIFEST_PATH):
        raise FileNotFoundError(f"manifest.json not found at {MANIFEST_PATH}")
    if not os.path.exists(CONTENT_JS_PATH):
        raise FileNotFoundError(f"content.js not found at {CONTENT_JS_PATH}")
    if not os.path.exists(STYLES_CSS_PATH):
        raise FileNotFoundError(f"styles.css not found at {STYLES_CSS_PATH}")

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    with open(STYLES_CSS_PATH, 'r', encoding='utf-8') as f:
        css_content = f.read()

    with open(CONTENT_JS_PATH, 'r', encoding='utf-8') as f:
        js_content = f.read()

    name = manifest.get('name', 'Pre-Purchasing Assistant for UC Davis (Beta)')
    version = manifest.get('version', '0.1.0')
    content_script_config = manifest.get('content_scripts', [{}])[0]
    matches = content_script_config.get('matches', [
        "https://prepurchasing.ucdavis.edu/Order/Request/*",
        "https://prepurchasing.ucdavis.edu/Order/Edit/*",
        "http://localhost:*/*",
        "http://127.0.0.1:*/*"
    ])

    match_lines = "\n".join([f"// @match        {pattern}" for pattern in matches])

    userscript = f"""// ==UserScript==
// @name         {name}
// @namespace    https://jdpieck.github.io/
// @version      {version}
// @description  Automate entering lab purchasing orders into the UC Davis PrePurchasing portal from CSV spreadsheets.
// @author       Jason Pieck
{match_lines}
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {{
  // Inject CSS Styles
  const styleEl = document.createElement('style');
  styleEl.type = 'text/css';
  styleEl.textContent = {json.dumps(css_content)};
  (document.head || document.documentElement).appendChild(styleEl);

{js_content}
}})();
"""

    with open(USERSCRIPT_PATH, 'w', encoding='utf-8') as f:
        f.write(userscript)

    print(f"[OK] Successfully compiled {USERSCRIPT_PATH} (v{version})")

if __name__ == '__main__':
    build()
