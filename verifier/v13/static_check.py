#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys, hashlib, re
root=Path(__file__).resolve().parents[2]
errors=[];values={}
html=(root/'index.html').read_text(encoding='utf-8')
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
if 'peach-flagship-16' not in sw:errors.append('cache not 16')
if 'RELEASE={version:"1.3.0"' not in html:errors.append('version not 1.3.0')
# Subjective effort controls were inert for planning and must stay removed.
css=(root/'flagship.css').read_text(encoding='utf-8')
for bad in ['data-effort','rfeffort','rfnote','inline-effort','rest-effort','setEffort','effortOf','updateEffortUI','effortCoach']:
 if bad in html or bad in css:errors.append('effort UI/logic remains: '+bad)
values['effort_controls_removed']=True
# Evidence UI must be gone from product copy
for bad in ['доказательность','Доказательность','const BASIS=','<b>Исследования.</b>']:
 if bad in html:errors.append('evidence UI remains: '+bad)
for good in ['Зачем это упражнение','Почему план именно такой','Подходов ровно столько','Волна вместо вечного']:
 if good not in html:errors.append('practical copy missing: '+good)
# Research stays only on credits page
credits=(root/'credits.html').read_text(encoding='utf-8')
if 'Plotkin' not in credits and 'Kubo' not in credits:values['credits_note']='check sources list manually'
print(json.dumps({'values':values,'errors':errors},ensure_ascii=False,indent=2));sys.exit(bool(errors))
