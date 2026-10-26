"""Export the saved public portfolio as a self-contained GitHub Pages snapshot.
Usage: python scripts/export_snapshot.py https://YOUR-EDITOR-SITE
Only published content is read; no credentials are needed or stored.
"""
import concurrent.futures, datetime, hashlib, json, pathlib, re, sys, subprocess
from urllib.parse import urljoin, urlparse

root = pathlib.Path(__file__).resolve().parents[1]
origin = sys.argv[1].rstrip('/')
if urlparse(origin).scheme != 'https':
    raise ValueError('Use the HTTPS URL of the editor site')
def fetch(path):
    return subprocess.check_output(['curl', '-fLsS', '--max-time', '60', urljoin(origin+'/', path)])
paths = ['/', '/api/portfolio', '/portfolio.js', '/editor.css']
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    responses = dict(zip(paths, pool.map(fetch, paths)))
snapshot = json.loads(responses['/api/portfolio'])
state = snapshot['content']
assert isinstance(state['projects'], list) and state['projects'], 'Missing portfolio data'
# Copy displayed crops, never unpublished drafts or original uncropped photos.
for im in [state['portrait']] + [im for p in state['projects'] for im in p['images']]:
    im.pop('original', None)
    src = im.get('src')
    if not src:
        continue
    url = urljoin(origin+'/', src)
    if urlparse(url).netloc != urlparse(origin).netloc:
        raise ValueError('Unexpected image origin: '+urlparse(url).netloc)
    data = fetch(src)
    ext = '.png' if data.startswith(b'\x89PNG') else '.jpg' if data.startswith(b'\xff\xd8') else '.webp' if data[:4] == b'RIFF' and data[8:12] == b'WEBP' else None
    if not ext:
        raise ValueError('Unsupported image format')
    asset = 'assets/'+hashlib.sha256(data).hexdigest()[:24]+ext
    (root/'assets').mkdir(exist_ok=True)
    (root/asset).write_bytes(data)
    im['src'] = asset
html = responses['/'].decode()
html = re.sub(r'<a\b[^>]*href="nam-hai-cv.pdf"[^>]*>.*?</a>', '', html, flags=re.S)
# Static visitors have no editor controls or sign-in routes.
html = re.sub(r'<a\b[^>]*id="edit-toggle"[^>]*>.*?</a>', '', html, flags=re.S)
html = re.sub(r'<aside\b[^>]*id="editor-bar".*?</aside>', '', html, flags=re.S)
html = re.sub(r'<input\b[^>]*id="image-input"[^>]*>', '', html)
for ident in ['content-editor', 'crop-dialog']:
    html = re.sub(r'<dialog\b[^>]*id="'+ident+r'".*?</dialog>', '', html, flags=re.S)
html = html.replace('href="/editor.css"', 'href="portfolio.css"').replace('src="/portfolio.js"', 'src="portfolio.js"')
html = html.replace('project index and image editor', 'project index')
html = html.replace('</head>', '<link rel="canonical" href="https://namhai-portfolio.github.io/">\n</head>')
# Retain the existing viewer rendering and navigation; exclude all editor code.
source = responses['/portfolio.js'].decode()
helpers = source[source.index('const $='):source.index('let state,')]
rendering = source[source.index('function media('):source.index('function setEditing(')]
share = source[source.index("$('#share-site').addEventListener"):source.index('async function start()')]
viewer = "(()=>{'use strict';\n" + helpers + "\nlet state,active=null,filter='all';const editing=false;\nconst project=id=>state.projects.find(p=>p.id===id);\n"
viewer += source[source.index('const toast='):source.index('async function api(')]
viewer += rendering
viewer += """
$('#dialog-close').addEventListener('click',closeProject);
$('#project-dialog').addEventListener('cancel',e=>{e.preventDefault();closeProject()});
window.addEventListener('hashchange',route);
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(state)render()}));
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;if(d.dismiss){$('#'+d.dismiss).close();return;}if(d.open){history.replaceState(null,'','#project/'+d.open);openProject(d.open);return;}if('close'in d)closeProject();});
"""
viewer += share
viewer += """
async function start(){try{const r=await fetch('portfolio.json');if(!r.ok)throw Error('Không tải được nội dung portfolio.');state=await r.json();render();route();}catch(e){$('#project-grid').innerHTML='<div class="load-error">'+esc(e.message)+' <button onclick="location.reload()">Thử lại</button></div>';}}
start();
})();
"""
(root/'index.html').write_text(html)
(root/'portfolio.js').write_text(viewer)
(root/'portfolio.json').write_text(json.dumps(state, ensure_ascii=False, indent=2)+'\n')
(root/'portfolio.css').write_bytes(responses['/editor.css'])
(root/'.nojekyll').touch()
(root/'snapshot.json').write_text(json.dumps({'exported_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'content_version':snapshot['version']},indent=2)+'\n')
print('Exported',len(state['projects']),'projects and',sum(bool(i.get('src')) for p in state['projects'] for i in p['images']),'project images.')
