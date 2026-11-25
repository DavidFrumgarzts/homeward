#!/usr/bin/env python3
"""Serves Beacon web on this computer for development:  python3 web/serve.py  ->  http://localhost:4173

Plain `python3 -m http.server` also works, but it opens a new connection for every file and queues
only five at a time, so when the computer is busy the page sometimes loads without some of its
files. This small server keeps connections open, and it answers any address that is not a file
(/f/<shareId>, /demo) with the app itself, the way Firebase Hosting does. Nothing here is deployed.
"""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"  # keep connections open: one page loads about 25 files

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        path = self.path.split("?")[0].split("#")[0]
        if not os.path.exists(self.translate_path(path)):
            self.path = "/index.html"  # the app reads the address and draws the right page
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")  # always pick up edits
        super().end_headers()

    def log_message(self, *args):
        pass


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    print(f"Beacon web: http://localhost:{port}  (Ctrl+C to stop)")
    Server(("127.0.0.1", port), Handler).serve_forever()
