#!/usr/bin/env python3
"""
UC Davis Pre-Purchasing Mock Server
Serves the extracted pre-purchasing request page locally for testing and development.
"""

import http.server
import socketserver
import os
import sys

PORT = 8000
HARNESS_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(HARNESS_DIR)
HTML_FILE = os.path.join(HARNESS_DIR, 'extracted_page.html')
if not os.path.exists(HTML_FILE):
    HTML_FILE = os.path.join(BASE_DIR, 'extracted_page.html')

EXT_DIR = os.path.join(BASE_DIR, 'browser-extension')

CSV_FILE = os.path.join(BASE_DIR, 'examples', 'Example Amazon Purchase Data.csv')
if not os.path.exists(CSV_FILE):
    CSV_FILE = os.path.join(BASE_DIR, 'Example Amazon Purchase Data.csv')

class MockHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve the order request page
        if self.path.startswith('/Order/Request') or self.path == '/':
            if not os.path.exists(HTML_FILE):
                self.send_error(404, "extracted_page.html not found")
                return

            with open(HTML_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Inject the extension scripts and CSS so it can be previewed directly in browser
            injection = """
            <!-- UC Davis Pre-Purchasing AutoFill Local Test Harness Injection -->
            <link rel="stylesheet" href="/styles.css">
            <script src="/src/icons.js" defer></script>
            <script src="/src/constants.js" defer></script>
            <script src="/src/dom_helpers.js" defer></script>
            <script src="/src/parser.js" defer></script>
            <script src="/src/autofill.js" defer></script>
            <script src="/src/ui.js" defer></script>
            """
            if '</head>' in content:
                content = content.replace('</head>', injection + '\n</head>', 1)
            else:
                content = injection + '\n' + content

            data = content.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        # Serve extension static files
        if self.path.startswith('/src/'):
            filename = os.path.basename(self.path)
            self.serve_file(os.path.join(EXT_DIR, 'src', filename), 'application/javascript')
            return
        if self.path == '/styles.css':
            self.serve_file(os.path.join(EXT_DIR, 'styles.css'), 'text/css')
            return
        if self.path == '/example.csv':
            self.serve_file(CSV_FILE, 'text/csv')
            return
        if self.path.startswith('/icons/'):
            icon_name = os.path.basename(self.path)
            mime = 'image/svg+xml' if icon_name.endswith('.svg') else 'image/png'
            self.serve_file(os.path.join(EXT_DIR, 'icons', icon_name), mime)
            return

        # Default fallback
        super().do_GET()

    def serve_file(self, filepath, mime_type):
        if os.path.exists(filepath):
            with open(filepath, 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            self.send_error(404, f"File not found: {filepath}")

def run_server():
    os.chdir(BASE_DIR)
    with socketserver.TCPServer(("", PORT), MockHandler) as httpd:
        print(f"\n==================================================================")
        print(f"[*] UC Davis Pre-Purchasing Mock Server running!")
        print(f"[>] Open in browser: http://localhost:{PORT}/Order/Request/5163")
        print(f"[*] Serving mock page with AutoFill extension pre-injected")
        print(f"Press Ctrl+C to stop server")
        print(f"==================================================================\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == '__main__':
    run_server()
