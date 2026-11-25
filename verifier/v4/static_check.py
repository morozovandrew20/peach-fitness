#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image
from collections import Counter
import json, re, subprocess, sys
root=Path(__file__).resolve().parents[2]
errors=[]; values={}
html=(root/'index.html').read_text(encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')
ids=[x['id'] for x in soup.find_all(id=True)]
dup=[k for k,v in Counter(ids).items() if v>1]
if dup: errors.append('duplicate static ids: '+', '.join(dup))
if not soup.find('meta',attrs={'name':'viewport'}): errors.append('viewport missing')
assets=['flagship.css','technique.js','peach-logo.svg','sw.js','manrope-cyrillic.woff2','manrope-latin.woff2','manifest.webmanifest','manifest-dark.webmanifest','apple-touch-icon.png','icon-192.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png','logo-512.png']
for asset in assets:
 p=root/asset
 if not p.exists() or p.stat().st_size==0: errors.append(f'missing asset: {asset}')
 else: values[asset+'_bytes']=p.stat().st_size
scripts='\n'.join(x.string or '' for x in soup.find_all('script') if not x.get('src'))
proc=subprocess.run(['node','--check'],input=scripts,text=True,capture_output=True)
if proc.returncode: errors.append('JavaScript syntax: '+proc.stderr[:600])
for name in ['technique.js','sw.js']:
 proc=subprocess.run(['node','--check',str(root/name)],text=True,capture_output=True)
 if proc.returncode: errors.append(name+' syntax: '+proc.stderr[:600])
sw=(root/'sw.js').read_text(encoding='utf-8')
if 'peach-flagship-7' not in sw: errors.append('stale service worker cache; expected peach-flagship-7')
for name in ['./'+x for x in assets]:
 if name not in sw: errors.append('asset missing from offline core: '+name)
for marker in ['function openSetFocus','function completeSetFocus','function backupCard','function safetyCard','class="brand-logo"','volny-v1']:
 if marker not in html: errors.append('missing product marker: '+marker)
for a in soup.find_all('a',href=True):
 href=a['href']
 if href=='#': errors.append('placeholder href')
 if href.startswith('#') and not soup.find(id=href[1:]): errors.append('dead anchor '+href)
for tag,attr in [(x,'src') for x in soup.find_all(src=True)]+[(x,'href') for x in soup.find_all(href=True)]:
 ref=tag.get(attr,'')
 if ref.startswith(('data:','http:','https:','#','mailto:')): continue
 path=ref.split('?')[0].split('#')[0]
 if path and not (root/path).exists(): errors.append('missing referenced file: '+path)
try:
 manifest=json.loads((root/'manifest.webmanifest').read_text())
 for icon in manifest['icons']:
  p=root/icon['src']
  with Image.open(p) as im:
   expected=tuple(map(int,icon['sizes'].split('x')))
   if im.size!=expected: errors.append(f'wrong icon dimensions: {icon["src"]} {im.size} != {expected}')
 values['manifest_icons']=len(manifest['icons'])
except Exception as e: errors.append('manifest validation: '+str(e))
css=(root/'flagship.css').read_text(encoding='utf-8')
values['reduced_motion_rules']=css.count('prefers-reduced-motion')+html.count('prefers-reduced-motion')
values['has_dark_theme']=bool(re.search(r'data-theme="dark"|prefers-color-scheme',css))
values['static_ids']=len(ids)
values['core_assets_kb']=round(sum(p.stat().st_size for p in root.iterdir() if p.is_file())/1024,1)
print(json.dumps({'values':values,'errors':errors},ensure_ascii=False,indent=2))
sys.exit(bool(errors))
