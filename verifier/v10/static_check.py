#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json, re, struct, subprocess, sys, hashlib
root=Path(__file__).resolve().parents[2]
errors=[];values={}
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'flagship.css').read_text(encoding='utf-8')
sw=(root/'sw.js').read_text(encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')

# 1. Animation byte-identical to v9 tag
V9={'technique.js':'0e191372a436a2f764e5d24ad3d94f076bc85e6411549fca1e4e651c7709e868',
 'technique3d.js':'fa9b3f998f92215df64fe31b8145c5eaf4f64f7ad4e17586b230338b97a2ad8f',
 'assets/technique/peach-mannequin.glb':'e7b24b80c5a35d448f9fac2b5e8ad08e841e755edfc83f4bae8232e9ef156303',
 'assets/technique/LICENSE-desk-break.txt':'bc10bb1b96ce2f12accf8ae26f50b7fe8146376f7cb6635dc11464eda425f23b',
 'assets/technique/LICENSE-three.txt':'bfe119ea4fd413f5f7ca3fcd63adb0c4a073ed39daa2fe7d3e6b769e21272601',
 'assets/technique/technique3d.src.js':'de80ecfebc1480d78253269e086f253f385fe7cf3b2d99ceef2f10ddfe91d939'}
for name,expect in V9.items():
 h=hashlib.sha256((root/name).read_bytes()).hexdigest()
 values[name+'_sha']=h[:12]
 if h!=expect:errors.append('animation modified: '+name)

# 2. Syntax
for name in ['technique.js','technique3d.js','sw.js']:
 p=subprocess.run(['node','--check',str(root/name)],capture_output=True,text=True)
 if p.returncode:errors.append(name+' syntax '+p.stderr[:200])

# 3. SW cache + offline core
if 'peach-flagship-13' not in sw:errors.append('stale cache name')
if 'peach-flagship-12' in sw:errors.append('old cache active')
core=['release.html','privacy.html','terms.html','credits.html','favicon.ico',
 'assets/release/screenshot-mobile.png','assets/release/screenshot-progress.png']
for name in core:
 if not (root/name).exists():errors.append('missing '+name)
 if '"./'+name+'"' not in sw:errors.append('not in offline core '+name)

# 4. Manifests
for name in ['manifest.webmanifest','manifest-dark.webmanifest']:
 try:
  m=json.loads((root/name).read_text(encoding='utf-8'))
  for k in ['id','name','description','categories','screenshots','icons','display']:
   if k not in m:errors.append(f'{name} missing {k}')
  if not m.get('screenshots'):errors.append(name+' has no screenshots')
 except Exception as e:errors.append(name+' JSON '+str(e))

# 5. Release metadata in index
for marker in ['RELEASE={version:"1.0.0"','release-strip','releaseCard()','og:image','manifest.webmanifest','application-name','rel="canonical"','robots" content="index']:
 if marker not in html:errors.append('index missing '+marker)
if 'release.html' not in html or 'privacy.html' not in html:errors.append('release card links absent')

# 6. Doc pages valid + favicon + honest wording
for name in ['privacy.html','terms.html','credits.html','release.html']:
 t=(root/name).read_text(encoding='utf-8')
 s=BeautifulSoup(t,'html.parser')
 if not s.find('link',rel='icon'):errors.append(name+' no favicon')
 if 'PEACH' not in s.title.string:errors.append(name+' wrong title')
 if s.find('nav') is None:errors.append(name+' missing doc-nav')
if not (root/'favicon.ico').exists():errors.append('favicon.ico missing')

# 7. CSS release/doc system
for sel in ['.release-strip','.release-card','.release-actions','body.doc-page','.doc-shell','.doc-hero','.doc-nav','.doc-content']:
 if sel not in css:errors.append('css missing '+sel)

# 8. No external runtime URLs in new code (GitHub/issues links allowed as links only)
for m in re.finditer(r'https?://[^\s"\'<>]+',html):
 u=m.group(0)
 if not any(ok in u for ok in ['morozovandrew20.github.io/peach-fitness','github.com/morozovandrew20/peach-fitness','ogp.me','twitter.com','schema.org','w3.org']):
  errors.append('unexpected external URL '+u)

print(json.dumps({'values':values,'errors':errors},ensure_ascii=False,indent=2));sys.exit(bool(errors))
