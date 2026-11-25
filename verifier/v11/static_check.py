#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys, hashlib
root=Path(__file__).resolve().parents[2]
errors=[];values={}
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'flagship.css').read_text(encoding='utf-8')
sw=(root/'sw.js').read_text(encoding='utf-8')
V9={'technique.js':'0e191372a436a2f764e5d24ad3d94f076bc85e6411549fca1e4e651c7709e868',
 'technique3d.js':'fa9b3f998f92215df64fe31b8145c5eaf4f64f7ad4e17586b230338b97a2ad8f',
 'assets/technique/peach-mannequin.glb':'e7b24b80c5a35d448f9fac2b5e8ad08e841e755edfc83f4bae8232e9ef156303',
 'assets/technique/LICENSE-desk-break.txt':'bc10bb1b96ce2f12accf8ae26f50b7fe8146376f7cb6635dc11464eda425f23b',
 'assets/technique/LICENSE-three.txt':'bfe119ea4fd413f5f7ca3fcd63adb0c4a073ed39daa2fe7d3e6b769e21272601',
 'assets/technique/technique3d.src.js':'de80ecfebc1480d78253269e086f253f385fe7cf3b2d99ceef2f10ddfe91d939'}
for name,expect in V9.items():
 h=hashlib.sha256((root/name).read_bytes()).hexdigest()
 if h!=expect:errors.append('animation modified: '+name)
values['animation_byte_identical']=True
for name in ['technique.js','technique3d.js','sw.js']:
 p=subprocess.run(['node','--check',str(root/name)],capture_output=True,text=True)
 if p.returncode:errors.append(name+' syntax '+p.stderr[:200])
if 'peach-flagship-14' not in sw:errors.append('cache not bumped to 14')
if 'peach-flagship-13' in sw:errors.append('old cache active')
if 'release-strip' in html:errors.append('promo strip still on welcome')
if 'RELEASE={version:"1.1.0"' not in html:errors.append('release version not 1.1.0')
if 'onboarding-intro' in html:errors.append('redundant onboarding intro remains')
if 'ex-help' not in html:errors.append('merged exercise help absent')
if html.count('class="card fold"')<2:errors.append('progress folds missing')
if 'about-card' not in html:errors.append('compact about card missing')
for marker in ['left:12px;right:12px','.rest-clockbox','details.card.fold','main{padding-bottom:calc(104px']:
 if marker not in css:errors.append('css missing '+marker)
for name in ['manifest.webmanifest','manifest-dark.webmanifest']:
 try:json.loads((root/name).read_text(encoding='utf-8'))
 except Exception as e:errors.append(name+' '+str(e))
print(json.dumps({'values':values,'errors':errors},ensure_ascii=False,indent=2));sys.exit(bool(errors))
