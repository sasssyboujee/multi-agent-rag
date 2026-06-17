import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = "src/dashboard"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve from the dashboard directory
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

if __name__ == "__main__":
    # Ensure dashboard directory exists
    if not os.path.exists(DIRECTORY):
        print(f"[-] Error: Directory '{DIRECTORY}' does not exist.")
        sys.exit(1)
        
    print(f"[*] Serving M&A Audit Dashboard on http://localhost:{PORT}")
    print(f"[!] Press Ctrl+C to terminate.")
    
    # Allow port reuse to prevent address already in use errors on rapid restarts
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[+] Server shut down cleanly.")
        sys.exit(0)
