import * as THREE from './assets/three.module.js';
import { GLTFLoader } from './assets/GLTFLoader.js';
import { mergeGeometries, deinterleaveGeometry } from './assets/BufferGeometryUtils.js';

const FPS=30,FRAME=1000/FPS,TAU=Math.PI*2;
let active=null,modelPromise=null;
function loadModel(){
  if(!modelPromise)modelPromise=new GLTFLoader().loadAsync('./assets/peach-rdl.glb').catch(error=>{modelPromise=null;throw error});
  return modelPromise;
}
function prepareModel(model){
  if(model.userData.peachPrepared)return;
  const barbell=model.getObjectByName('Barbell');
  if(barbell){
    const batches=new Map();
    for(const child of [...barbell.children]){
      if(!child.isMesh||Array.isArray(child.material))continue;
      const key=child.material.name||child.material.uuid;
      if(!batches.has(key))batches.set(key,[]);
      batches.get(key).push(child);
    }
    for(const children of batches.values()){
      if(children.length<2)continue;
      const geometries=children.map(child=>{child.updateMatrix();const geometry=child.geometry.clone();deinterleaveGeometry(geometry);return geometry.applyMatrix4(child.matrix)});
      const geometry=mergeGeometries(geometries,false);geometries.forEach(item=>item.dispose());
      if(!geometry)continue;
      const merged=new THREE.Mesh(geometry,children[0].material);merged.name='Barbell detail';
      for(const child of children){barbell.remove(child);child.geometry.dispose();}
      barbell.add(merged);
    }
  }
  model.traverse(object=>{
    if(!object.isMesh)return;
    const source=object.material;
    const material=new THREE.MeshLambertMaterial({color:source.color?source.color.clone():new THREE.Color(0xffffff),map:source.map||null,side:source.side});
    material.name=source.name;object.material=material;object.frustumCulled=false;
  });
  model.userData.peachPrepared=true;
}
function create(canvas,kind){
  if(active)active.dispose();
  const root=canvas.closest('.motion-card');
  if(kind!=='rdl3d'||!root)return null;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}
  catch(error){root.classList.add('unavailable');return null;}
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
  renderer.shadowMap.enabled=false;
  renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-.7,.7,.59,-.59,.01,20);
  camera.position.set(0,.12,2.8);camera.lookAt(0,-.015,0);
  const css=getComputedStyle(document.documentElement);
  const coral=new THREE.Color(css.getPropertyValue('--a1').trim()||'#f04a36');
  const peach=new THREE.Color(css.getPropertyValue('--a2').trim()||'#ff8a5c');
  scene.add(new THREE.HemisphereLight(0xfff5f0,0x51434d,1.65));
  const key=new THREE.DirectionalLight(0xfff1e9,2.65);key.position.set(1.7,2.4,2.1);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffd9cf,.62);rim.position.set(-1.4,1.1,-1.8);scene.add(rim);
  const fill=new THREE.DirectionalLight(peach,.36);fill.position.set(-1.4,.15,1.6);scene.add(fill);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
  const shadowContext=shadowCanvas.getContext('2d'),gradient=shadowContext.createRadialGradient(128,128,8,128,128,124);gradient.addColorStop(0,'rgba(39,25,32,.42)');gradient.addColorStop(.45,'rgba(39,25,32,.16)');gradient.addColorStop(1,'rgba(39,25,32,0)');shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,256,256);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas),floor=new THREE.Mesh(new THREE.PlaneGeometry(.72,.48),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.502;scene.add(floor);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.34,.343,96),new THREE.MeshBasicMaterial({color:coral,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=-.498;scene.add(ring);
  const halo=new THREE.Mesh(new THREE.RingGeometry(.405,.407,96),new THREE.MeshBasicMaterial({color:peach,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}));
  halo.rotation.x=-Math.PI/2;halo.position.y=-.497;scene.add(halo);
  const modelRoot=new THREE.Group();modelRoot.rotation.y=-.34;scene.add(modelRoot);
  const play=root.querySelector('[data-motion-play]'),reducedNote=root.querySelector('.motion-reduced'),media=matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,loaded=false,raf=0,pending=0,last=0,lastDraw=0,time=0,yaw=-.34,playing=!media.matches,visible=true,drag=null,width=1,height=1,dpr=1,mixer=null,model=null;
  const stats={draws:0,totalMs:0,maxMs:0,segments:0,dpr:1,fps:FPS,triangles:0};
  const listeners=[];
  function on(el,type,fn,opts){if(!el)return;el.addEventListener(type,fn,opts);listeners.push([el,type,fn,opts]);}
  function resize(){
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    width=rect.width;height=rect.height;dpr=Math.min(window.devicePixelRatio||1,1.5);renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);
    const aspect=width/height,vertical=1.18;camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();stats.dpr=dpr;draw();
  }
  function draw(){
    if(disposed)return;const started=performance.now();modelRoot.rotation.y=yaw;
    if(mixer)mixer.setTime(((time%4)+4)%4);
    renderer.render(scene,camera);stats.draws++;const elapsed=performance.now()-started;stats.totalMs+=elapsed;stats.maxMs=Math.max(stats.maxMs,elapsed);
    if(loaded)window.__SCENE_READY__=true;
  }
  function requestDraw(){if(!pending&&!disposed)pending=requestAnimationFrame(()=>{pending=0;draw();});}
  function updatePlay(){play.textContent=playing?'Пауза':'Пуск';play.setAttribute('aria-label',playing?'Приостановить анимацию':'Запустить анимацию');reducedNote.hidden=!media.matches||playing;}
  function stopLoop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
  function startLoop(){if(loaded&&!raf&&playing&&visible&&!document.hidden&&!disposed){last=0;raf=requestAnimationFrame(frame);}}
  function frame(now){
    raf=0;if(disposed||!loaded||!playing||!visible||document.hidden)return;
    if(!last)last=now;const dt=Math.min(100,now-last);last=now;time+=dt/1000;
    const elapsed=now-lastDraw;if(elapsed>=FRAME-1){draw();lastDraw=lastDraw?now-(elapsed%FRAME):now;}raf=requestAnimationFrame(frame);
  }
  function toggle(){playing=!playing;updatePlay();if(playing)startLoop();else stopLoop();}
  function turn(delta){const next=yaw+delta,base=-.34,turns=Math.round((next-base)/TAU),aligned=next-turns*TAU;yaw=Math.abs(aligned-base)<1e-8?base:next;requestDraw();}
  on(play,'click',toggle);on(root.querySelector('[data-motion-left]'),'click',()=>turn(-Math.PI/4));on(root.querySelector('[data-motion-right]'),'click',()=>turn(Math.PI/4));
  on(canvas,'pointerdown',event=>{if(event.button!==undefined&&event.button!==0)return;drag={id:event.pointerId,x:event.clientX};if(canvas.setPointerCapture)try{canvas.setPointerCapture(event.pointerId);}catch(_){}canvas.focus({preventScroll:true});canvas.classList.add('dragging');});
  on(canvas,'pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x;drag.x=event.clientX;turn(dx*.012);});
  const endDrag=event=>{if(drag&&drag.id===event.pointerId){drag=null;canvas.classList.remove('dragging');}};
  on(canvas,'pointerup',endDrag);on(canvas,'pointercancel',endDrag);on(canvas,'lostpointercapture',endDrag);
  on(canvas,'keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();turn(event.key==='ArrowLeft'?-Math.PI/8:Math.PI/8);}else if(event.key===' '){event.preventDefault();toggle();}});
  const visibility=()=>{if(document.hidden)stopLoop();else startLoop();};on(document,'visibilitychange',visibility);
  const motionChange=()=>{if(media.matches){playing=false;stopLoop();updatePlay();}else reducedNote.hidden=true;};if(media.addEventListener)on(media,'change',motionChange);
  const ro=window.ResizeObserver?new ResizeObserver(resize):null;if(ro)ro.observe(canvas);else on(window,'resize',resize);
  const io=window.IntersectionObserver?new IntersectionObserver(entries=>{visible=!!entries[0]&&entries[0].isIntersecting;if(visible)startLoop();else stopLoop();},{root:root.closest('.panel'),threshold:.05}):null;if(io)io.observe(canvas);
  const api={seek(value){time=Number.isFinite(+value)?+value:0;draw();},stats(){return {...stats,averageMs:stats.draws?stats.totalMs/stats.draws:0,playing,visible,yaw,loaded};},dispose(){
    if(disposed)return;disposed=true;stopLoop();if(pending)cancelAnimationFrame(pending);pending=0;
    for(const [el,type,fn,opts] of listeners)el.removeEventListener(type,fn,opts);if(ro)ro.disconnect();if(io)io.disconnect();
    if(model)modelRoot.remove(model);mixer=null;floor.geometry.dispose();floor.material.dispose();shadowTexture.dispose();ring.geometry.dispose();ring.material.dispose();halo.geometry.dispose();halo.material.dispose();renderer.dispose();if(active===api)active=null;window.__SCENE_READY__=false;
  }};
  active=api;updatePlay();resize();
  loadModel().then(gltf=>{
    if(disposed)return;model=gltf.scene;prepareModel(model);modelRoot.add(model);
    model.traverse(object=>{if(object.isMesh){stats.segments++;const count=object.geometry.index?object.geometry.index.count:object.geometry.attributes.position.count;stats.triangles+=Math.round(count/3);}});
    mixer=new THREE.AnimationMixer(model);for(const clip of gltf.animations){const action=mixer.clipAction(clip);action.play();action.setLoop(THREE.LoopRepeat,Infinity);}
    loaded=true;root.classList.remove('unavailable');root.setAttribute('aria-busy','false');mixer.setTime(time%4);draw();startLoop();
  }).catch(()=>{if(disposed)return;root.classList.add('unavailable');root.setAttribute('aria-busy','false');const note=root.querySelector('.motion-note');if(note)note.textContent='3D не загрузилось. Все подсказки по технике доступны ниже.';});
  return api;
}
window.Peach3DMotion={create,available:value=>value==='rdl3d'};
window.__seek=value=>{if(active)active.seek(value);};
window.__PEACH_MOTION_STATS__=()=>active?active.stats():null;
window.__SCENE_READY__=false;
