#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json, re, subprocess, sys
root=Path(__file__).resolve().parents[2]
errors=[]; values={}
html=(root/'index.html').read_text(encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')
if not soup.find('meta',attrs={'name':'viewport'}): errors.append('viewport missing')
for asset in ['flagship.css','technique.js','peach-logo.svg','sw.js','manrope-cyrillic.woff2','manrope-latin.woff2']:
    p=root/asset
    if not p.exists() or p.stat().st_size==0: errors.append(f'missing asset: {asset}')
    else: values[asset+'_bytes']=p.stat().st_size
scripts='\n'.join(x.string or '' for x in soup.find_all('script') if not x.get('src'))
proc=subprocess.run(['node','--check'],input=scripts,text=True,capture_output=True)
if proc.returncode: errors.append('JavaScript syntax: '+proc.stderr[:400])
for name in ['technique.js','sw.js']:
    proc=subprocess.run(['node','--check',str(root/name)],text=True,capture_output=True)
    if proc.returncode: errors.append(name+' syntax: '+proc.stderr[:400])
sw=(root/'sw.js').read_text(encoding='utf-8')
if 'peach-flagship-5' not in sw: errors.append('stale service worker cache')
for name in ['./flagship.css','./technique.js','./peach-logo.svg','./manrope-cyrillic.woff2','./manrope-latin.woff2']:
    if name not in sw: errors.append('asset missing from offline core: '+name)
for marker in ['function progressOverview','function renderProgressEmpty','class="summary-mark"']:
    if marker not in html: errors.append('missing product marker: '+marker)
for a in soup.find_all('a',href=True):
    href=a['href']
    if href=='#': errors.append('placeholder href')
    if href.startswith('#') and not soup.find(id=href[1:]): errors.append('dead anchor '+href)
css=(root/'flagship.css').read_text(encoding='utf-8')
values['reduced_motion_rules']=css.count('prefers-reduced-motion')+html.count('prefers-reduced-motion')
values['has_dark_theme']=bool(re.search(r'data-theme="dark"|prefers-color-scheme',css))
values['has_local_fonts']='manrope-cyrillic.woff2' in css
values['primary_exercise_count']=len(re.findall(r'\{id:"(?:ht|rdl|sq)"',html))
values['core_assets_kb']=round(sum(p.stat().st_size for p in root.iterdir() if p.is_file())/1024,1)
print(json.dumps({'values':values,'errors':errors},ensure_ascii=False,indent=2))
sys.exit(bool(errors))
