from pathlib import Path
import re

root = Path(__file__).resolve().parent
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (root / 'style.css').read_text() + '</style>')
for name in ['engine.js', 'audio.js', 'render.js', 'app.js']:
    script = (root / name).read_text().replace('</script', '<\\/script')
    html = html.replace(f'<script src="{name}"></script>', f'<script>\n{script}\n</script>')
out = root / '芦汀观测站.html'
out.write_text(html)
assert not re.search(r'<script[^>]+src=|<link[^>]+href=', html)
print(f'Built {out.name}: {out.stat().st_size:,} bytes; no external assets')
