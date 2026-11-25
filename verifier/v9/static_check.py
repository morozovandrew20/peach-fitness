#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json, re, struct, subprocess, sys
root=Path(__file__).resolve().parents[2]
errors=[];values={}
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'flagship.css').read_text(encoding='utf-8')
sw=(root/'sw.js').read_text(encoding='utf-8')
src=(root/'assets/technique/technique3d.src.js').read_text(encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')
assets=['technique.js','technique3d.js','flagship.css','assets/technique/peach-mannequin.glb','assets/technique/LICENSE-desk-break.txt','assets/technique/LICENSE-three.txt']
for name in assets:
 p=root/name
 if not p.exists() or p.stat().st_size==0:errors.append('missing '+name)
 else:values[name+'_bytes']=p.stat().st_size
 if './'+name not in sw:errors.append('not in offline core '+name)
for name in ['technique.js','technique3d.js','sw.js']:
 p=subprocess.run(['node','--check',str(root/name)],capture_output=True,text=True)
 if p.returncode:errors.append(name+' syntax '+p.stderr[:300])
if 'peach-flagship-12' not in sw:errors.append('stale cache')
for id in ['ht','rdl','bulg','abd','sq','hyper','kick','curl']:
 if not re.search(r"\b"+id+r":\s*\[",src):errors.append('missing label '+id)
 if not re.search(r"id==='"+id+r"'",src):errors.append('missing movement/equipment '+id)
for marker in ['GLTFLoader','prefers-reduced-motion','data-t3play','data-t3speed','data-t3view','data-t3scrub','fail(shell']:
 if marker not in src:errors.append('missing marker '+marker)
if 'fallbackTechnique' not in src:errors.append('SVG fallback absent')
if 'peach-flagship-11' in sw:errors.append('old cache active')
for p in [root/'assets/technique/LICENSE-desk-break.txt',root/'assets/technique/LICENSE-three.txt']:
 text=p.read_text()
 if 'MIT License' not in text or 'Permission is hereby granted' not in text:errors.append('invalid license '+p.name)
try:
 b=(root/'assets/technique/peach-mannequin.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);values['glb_meshes']=len(g.get('meshes',[]));values['glb_skins']=len(g.get('skins',[]));values['glb_external_uris']=[b['uri'] for b in g.get('buffers',[]) if 'uri' in b]
 if not g.get('skins'):errors.append('model is not rigged')
 if values['glb_external_uris']:errors.append('model has external dependencies')
except Exception as e:errors.append('GLB parse '+str(e))
values['local_3d_bundle_kb']=round((root/'technique3d.js').stat().st_size/1024,1)
values['model_kb']=round((root/'assets/technique/peach-mannequin.glb').stat().st_size/1024,1)
print(json.dumps({'values':values,'errors':errors},ensure_ascii=False,indent=2));sys.exit(bool(errors))