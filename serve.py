"""Loopback-only preview. Also safe to open 芦汀观测站.html directly."""
import argparse
import functools
import http.server
from pathlib import Path
import webbrowser

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=18876)
parser.add_argument('--no-open', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
server = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler)
url = f'http://127.0.0.1:{args.port}/'
print(f'AVIAN–OS: {url}', flush=True)
if not args.no_open:
    webbrowser.open(url)
server.serve_forever()
