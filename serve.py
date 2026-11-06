# Local preview server that never lets the browser cache pages,
# so edits always show up on reload.
# Run from this folder:  python3 serve.py   then open http://localhost:8080

import http.server
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


http.server.ThreadingHTTPServer(("", 8080), NoCacheHandler).serve_forever()
