from pathlib import Path
import base64
import re

root = Path(__file__).resolve().parent
html = (root / 'index.html').read_text()
def style(match):
    return '<style>' + (root / match.group(1).split('?')[0]).read_text() + '</style>'
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', style, html)
def script(match):
    name=match.group(1).split('?')[0]
    content=(root/name).read_text()
    if name in {'challenge-data.js','advanced-data.js','encounter-data.js','encounter-expansion.js','encounter-bank.js'}:
        for media in sorted((root/'assets/reference').glob('*')):
            if media.suffix not in {'.jpg','.mp3'}: continue
            mime='image/jpeg' if media.suffix=='.jpg' else 'audio/mpeg'
            uri='data:'+mime+';base64,'+base64.b64encode(media.read_bytes()).decode()
            content=content.replace(str(media.relative_to(root)),uri)
    return '<script>\n'+content.replace('</script','<\\/script')+'\n</script>'
html=re.sub(r'<script src="([^"]+)"></script>',script,html)
assert not re.search(r'<script[^>]+src=|<link[^>]+href=',html)
assert "image:'assets/reference/" not in html
out=root/'芦汀观测站.html'
out.write_text(html)
print(f'Built {out.name}: {out.stat().st_size:,} bytes; photos and recordings embedded')
