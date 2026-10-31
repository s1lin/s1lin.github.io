"""Serve the built site at / and Brick Locator at /brick-locator/, as GitHub Pages does.

Brick Locator is its own repository (s1lin/brick-locator), published by Pages
under this site's domain, so `vite preview` alone answers /brick-locator/ with
the issue. This serves both, on this machine only.

Usage: python3 -I scripts/serve-local.py [port] [brick-locator site dir]
       (defaults: 4173 and ../brick-locator/site, the checkout next to this one)
Run `npm run build` first; it serves dist/ as it is.
"""
import http.server
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "dist"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
BRICK = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT.parent / "brick-locator" / "site"


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".mjs": "text/javascript"}

    def translate_path(self, path):
        if path == "/brick-locator" or path.startswith("/brick-locator/"):
            self.directory = str(BRICK)
            path = path[len("/brick-locator"):] or "/"
        else:
            self.directory = str(SITE)
        return super().translate_path(path)

    def log_message(self, *args):
        pass


if not (SITE / "index.html").is_file():
    sys.exit("dist/ has no index.html: run npm run build first")
if not (BRICK / "index.html").is_file():
    print(f"no Brick Locator at {BRICK}; /brick-locator/ will 404", file=sys.stderr)
print(f"http://127.0.0.1:{PORT}/  (Brick Locator from {BRICK})")
http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
