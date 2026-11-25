import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

(() => {
  const fallbackTechnique = window.peachTechnique;
  const MODEL_URL = 'assets/technique/peach-mannequin.glb';
  const DURATION = 4.8;
  const LABELS = {
    ht: ['Ягодичный мост со штангой', 'Пауза вверху · таз и корпус одной линией', 'Ягодицы'],
    rdl: ['Румынская тяга', 'Таз назад · гриф скользит по ногам', 'Задняя поверхность бедра'],
    bulg: ['Болгарские выпады', 'Корпус вперёд · толчок передней пяткой', 'Ягодица передней ноги'],
    abd: ['Отведение бедра в тренажёре', 'Плавно разводи бёдра · без рывка', 'Верх и бок ягодиц'],
    sq: ['Гакк-присед', 'Таз на опоре · колени по направлению носков', 'Бёдра и ягодицы'],
    hyper: ['Гиперэкстензия на ягодицы', 'Мягко скругли верх спины · без переразгибания', 'Ягодицы'],
    kick: ['Кикбэк в кроссовере', 'Таз неподвижен · нога назад без прогиба', 'Ягодица рабочей ноги'],
    curl: ['Сгибание ног сидя', 'Бедро прижато · пятки тяни под сиденье', 'Задняя поверхность бедра']
  };
  const CAMERA = {
    ht:    { target: [0,.48,-.12], yaw: .92, radius: 2.85, pitch: .22 },
    rdl:   { target: [0,.82,0], yaw: 1.05, radius: 3.05, pitch: .16 },
    bulg:  { target: [0,.78,0], yaw: 1.45, radius: 3.15, pitch: .16 },
    abd:   { target: [0,.58,.05], yaw: .28, radius: 3.05, pitch: .16 },
    sq:    { target: [0,.82,0], yaw: 1.42, radius: 3.0, pitch: .16 },
    hyper: { target: [0,.86,.1], yaw: 1.5, radius: 2.9, pitch: .2 },
    kick:  { target: [0,.92,.05], yaw: 1.4, radius: 3.65, pitch: .15 },
    curl:  { target: [0,.68,.08], yaw: 1.18, radius: 2.75, pitch: .16 }
  };
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let modelPromise, active = null;

  const icons = {
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="m8 5 11 7-11 7Z"/>',
    side: '<path d="M5 19 19 5M5 5h14v14"/>',
    front: '<path d="M12 3v18M4 7l8-4 8 4M7 21l5-3 5 3"/>',
    hero: '<path d="m4 8 8-5 8 5v9l-8 4-8-4ZM4 8l8 5 8-5M12 13v8"/>',
    reset: '<path d="M4 10a8 8 0 1 1 2 7M4 4v6h6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;

  function plate(id) {
    const safeId = LABELS[id] ? id : 'rdl';
    const [title, cue, muscle] = LABELS[safeId];
    const fallback = fallbackTechnique(safeId).replace('class="tech-visual tech-animated"','class="tech-animated"');
    const paused = reduceMotion();
    const html = `<figure class="tech-visual tech3d-shell" data-tech3d="${safeId}" aria-label="Интерактивная 3D-техника: ${title}">
      <div class="tech3d-stage">
        <div class="tech3d-loading"><span></span><b>Готовим 3D-технику</b></div>
        <div class="tech3d-topline"><span class="tech3d-badge">3D · ${muscle}</span><span class="tech3d-phase" data-t3phase>ДВИЖЕНИЕ</span></div>
        <div class="tech3d-canvas" data-t3canvas tabindex="0" role="img" aria-label="${title}. Перетаскивай, чтобы повернуть. Стрелки также меняют ракурс."></div>
        <span class="tech3d-hint">Потяни, чтобы рассмотреть</span>
      </div>
      <div class="tech3d-controls" aria-label="Управление анимацией">
        <button type="button" class="tech3d-play" data-t3play aria-pressed="${paused}" aria-label="${paused?'Воспроизвести':'Пауза'}">${icon(paused?'play':'pause')}<span>${paused?'Смотреть':'Пауза'}</span></button>
        <label class="tech3d-scrub"><span class="sr-only">Положение в повторении</span><input data-t3scrub type="range" min="0" max="1000" value="0" aria-label="Положение в повторении"></label>
        <button type="button" class="tech3d-speed" data-t3speed aria-label="Скорость 1 раз">1×</button>
      </div>
      <div class="tech3d-views" aria-label="Ракурс">
        <button type="button" data-t3view="hero" aria-pressed="true">${icon('hero')}Ракурс</button>
        <button type="button" data-t3view="side" aria-pressed="false">${icon('side')}Сбоку</button>
        <button type="button" data-t3view="front" aria-pressed="false">${icon('front')}Спереди</button>
        <button type="button" data-t3reset aria-label="Вернуть исходный ракурс">${icon('reset')}<span class="sr-only">Сбросить</span></button>
      </div>
      <figcaption><strong>${title}</strong><span>${cue}</span></figcaption>
    </figure><div class="tech3d-fallback" hidden>${fallback}</div>`;
    setTimeout(() => mount(safeId), 0);
    return html;
  }

  function loadModel() {
    if (!modelPromise) modelPromise = new GLTFLoader().loadAsync(MODEL_URL);
    return modelPromise;
  }

  function material(color, roughness=.38, metalness=.08) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  function mesh(geometry, mat, parent, position=[0,0,0]) {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(...position); m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  }
  function box(parent, size, pos, mat, radius=0) {
    return mesh(new THREE.BoxGeometry(...size), mat, parent, pos);
  }
  function cyl(parent, radius, length, pos, mat, axis='y', segments=20) {
    const m = mesh(new THREE.CylinderGeometry(radius,radius,length,segments),mat,parent,pos);
    if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;
    return m;
  }
  function ball(parent, radius, pos, mat) { return mesh(new THREE.SphereGeometry(radius,20,14),mat,parent,pos); }
  function beam(parent, a, b, radius, mat) {
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);
    const m=cyl(parent,radius,d.length(),av.clone().add(bv).multiplyScalar(.5).toArray(),mat);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;
  }

  function studio(scene) {
    const ground = mesh(new THREE.CircleGeometry(3.4,64), material(0x282126,.82,0), scene, [0,-.012,0]);
    ground.rotation.x=-Math.PI/2;ground.castShadow=false;
    const ring = mesh(new THREE.RingGeometry(1.13,1.145,80),new THREE.MeshBasicMaterial({color:0xe8917f,transparent:true,opacity:.36,side:THREE.DoubleSide}),scene,[0,.002,0]);
    ring.rotation.x=-Math.PI/2;ring.castShadow=false;
    const c=document.createElement('canvas');c.width=c.height=128;
    const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,4,64,64,62);
    g.addColorStop(0,'rgba(0,0,0,.48)');g.addColorStop(.45,'rgba(0,0,0,.20)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
    const shadow=mesh(new THREE.PlaneGeometry(1.55,1.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}),scene,[0,.006,0]);
    shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
  }

  function equipment(id, scene) {
    const g=new THREE.Group();scene.add(g);
    const dark=material(0x332c31,.3,.48), metal=material(0x9c9297,.24,.75), pad=material(0x5b3c42,.48,.08), peach=material(0xe8927f,.32,.18);
    const dyn={group:g};
    const bench=(z,y=.43,length=.75)=>{
      box(g,[.5,.10,length],[0,y,z],pad);box(g,[.42,.06,length-.06],[0,y-.08,z],dark);
      for(const dz of [-length*.32,length*.32]){box(g,[.06,y-.12,.06],[0,(y-.12)/2,z+dz],dark);box(g,[.5,.045,.07],[0,.035,z+dz],dark)}
    };
    const barbell=(radius=.18)=>{
      const b=new THREE.Group();g.add(b);cyl(b,.025,1.65,[0,0,0],metal,'x');
      for(const s of [-1,1]){for(let i=0;i<2;i++)cyl(b,radius-i*.025,.075,[s*(.66+i*.08),0,0],i?dark:peach,'x',28);cyl(b,.034,.12,[s*.5,0,0],dark,'x')}
      dyn.bar=b;return b;
    };
    if(id==='ht'){
      bench(-.61,.43,.68);barbell(.145);
      box(g,[1.35,.025,1.55],[0,.012,-.05],material(0x3a3035,.9,0));
    }else if(id==='rdl'){
      barbell(.18);
      box(g,[.7,.016,.48],[0,.008,0],material(0x3a3035,.9,0));
    }else if(id==='bulg'){
      bench(-.48,.43,.58);
      dyn.dumbbells=[-1,1].map(()=>{const d=new THREE.Group();g.add(d);cyl(d,.018,.22,[0,0,0],metal,'x');for(const s of [-1,1])cyl(d,.065,.055,[s*.095,0,0],dark,'x');return d});
    }else if(id==='abd'){
      box(g,[.56,.12,.52],[0,.46,-.03],pad);box(g,[.56,.68,.12],[0,.8,-.3],pad);box(g,[.12,.42,.12],[0,.22,-.03],dark);
      box(g,[.8,.07,.65],[0,.035,-.04],dark);dyn.pads=[];
      for(const s of [-1,1]){const p=new THREE.Group();g.add(p);box(p,[.09,.32,.16],[0,0,0],peach);beam(p,[0,-.16,0],[0,-.36,-.18],.035,dark);dyn.pads.push(p)}
      for(const s of [-1,1])beam(g,[s*.28,.77,.08],[s*.28,.77,.28],.025,metal);
    }else if(id==='sq'){
      const sled=new THREE.Group();sled.rotation.x=-.20;g.add(sled);
      box(sled,[.66,.95,.10],[0,.9,-.24],pad);box(sled,[.82,.10,.62],[0,.18,.26],dark);
      for(const s of [-1,1]){beam(g,[s*.38,.1,-.48],[s*.38,1.65,-.05],.035,metal);box(sled,[.22,.12,.24],[s*.23,1.28,-.13],peach)}
      dyn.sled=sled;
    }else if(id==='hyper'){
      box(g,[.44,.14,.52],[0,.82,0],pad);box(g,[.16,.74,.16],[0,.41,0],dark);box(g,[.65,.06,.58],[0,.035,0],dark);
      box(g,[.58,.12,.18],[0,.35,-.52],peach);for(const s of [-1,1])beam(g,[s*.25,.35,-.52],[s*.25,.08,-.52],.035,dark);
    }else if(id==='kick'){
      box(g,[.14,1.9,.14],[0,.95,.72],dark);box(g,[.5,.06,.52],[0,.03,.72],dark);box(g,[.22,.24,.20],[0,.2,.69],peach);
      for(const s of [-1,1])beam(g,[s*.28,1.02,.68],[s*.28,1.02,.4],.025,metal);
      const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
      dyn.cable=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xd9a698}));g.add(dyn.cable);
      dyn.strap=new THREE.Group();g.add(dyn.strap);const tor=mesh(new THREE.TorusGeometry(.055,.013,8,20),peach,dyn.strap);tor.rotation.x=Math.PI/2;
    }else if(id==='curl'){
      box(g,[.56,.12,.55],[0,.46,-.04],pad);box(g,[.56,.62,.12],[0,.78,-.32],pad);box(g,[.12,.42,.12],[0,.22,-.04],dark);box(g,[.82,.06,.7],[0,.035,-.04],dark);
      dyn.curlPad=new THREE.Group();g.add(dyn.curlPad);cyl(dyn.curlPad,.075,.66,[0,0,0],peach,'x');
      box(g,[.64,.09,.12],[0,.66,.39],peach);
    }
    return dyn;
  }

  function createRig(source, scene) {
    const model=cloneSkeleton(source.scene);scene.add(model);
    const bones={},rest={};
    model.traverse(n=>{
      if(n.isMesh){n.castShadow=true;n.receiveShadow=true;n.frustumCulled=false}
      if(n.name&&/^(hips|spine|neck|arm[LR]|elbow[LR]|hand[LR]|leg[LR]|knee[LR]|foot[LR]|prop)$/.test(n.name)){
        bones[n.name]=n;rest[n.name]={q:n.quaternion.clone(),p:n.position.clone()};
      }
    });
    if(bones.prop)bones.prop.scale.setScalar(0);
    const euler=new THREE.Euler(),q=new THREE.Quaternion();
    function rot(name,x=0,y=0,z=0){
      const b=bones[name];if(!b)return;
      euler.set(THREE.MathUtils.degToRad(x),THREE.MathUtils.degToRad(y),THREE.MathUtils.degToRad(z),'YZX');
      q.setFromEuler(euler);b.quaternion.copy(rest[name].q).multiply(q);
    }
    function both(name,a,b=a){rot(name+'L',...a);rot(name+'R',b[0],-b[1],-b[2])}
    function reset(){for(const [name,b] of Object.entries(bones)){b.quaternion.copy(rest[name].q);b.position.copy(rest[name].p)}}
    function root(y=.95,z=0,x=0){bones.hips.position.copy(rest.hips.p);bones.hips.position.y=y;bones.hips.position.z=z;bones.hips.position.x=x}
    function point(name,target=new THREE.Vector3()){model.updateMatrixWorld(true);return bones[name].getWorldPosition(target)}
    return {model,bones,rot,both,reset,root,point};
  }

  function animate(id, rig, eq, p) {
    const T=Math.PI*2, s=(1-Math.cos(p*T))/2, smooth=s*s*(3-2*s), up=smooth;
    rig.reset();
    rig.both('arm',[0,0,6]);rig.both('elbow',[-6,0,0]);
    if(id==='rdl'){
      const a=up*64;rig.root(.95-up*.055,-up*.19);rig.rot('spine',a);rig.rot('neck',-a*.22);
      rig.both('leg',[-7,0,0]);rig.both('knee',[22,0,0]);rig.both('arm',[-a-5,0,7]);rig.both('elbow',[-5,0,0]);
    }else if(id==='ht'){
      const a=-90+up*7;rig.root(.22+up*.28,-up*.035);rig.rot('hips',a);rig.rot('neck',18);
      rig.both('leg',[up*4,0,4]);rig.both('knee',[88-up*4,0,0]);rig.both('arm',[5,0,14]);rig.both('elbow',[-5,0,0]);
    }else if(id==='bulg'){
      rig.root(.88-up*.23,up*.025);rig.rot('spine',22);rig.rot('neck',-7);
      rig.rot('legL',-34-up*18,0,3);rig.rot('kneeL',43+up*43);rig.rot('legR',33,0,-4);rig.rot('kneeR',112+up*38);
      rig.both('arm',[5,0,9]);rig.both('elbow',[-8,0,0]);
    }else if(id==='abd'){
      rig.root(.57,-.02);rig.rot('spine',5);rig.both('leg',[-80,0,5+up*25]);rig.both('knee',[88,0,0]);
      rig.both('arm',[-25,0,20]);rig.both('elbow',[-65,0,0]);
    }else if(id==='sq'){
      rig.root(.96-up*.31,-up*.03);rig.rot('hips',-12);rig.rot('spine',2);rig.rot('neck',5);
      rig.both('leg',[-26-up*22,0,7]);rig.both('knee',[35+up*60,0,0]);rig.both('foot',[-8,0,0]);
      rig.both('arm',[-52,0,12]);rig.both('elbow',[-75,0,0]);
    }else if(id==='hyper'){
      rig.root(.94,0);rig.rot('hips',82);rig.rot('spine',up*30);rig.rot('neck',12);
      rig.both('leg',[-7,0,6]);rig.both('knee',[8,0,0]);rig.both('arm',[-82,0,-42]);rig.both('elbow',[-88,0,0]);
    }else if(id==='kick'){
      rig.root(.95,0);rig.rot('spine',30);rig.rot('neck',-12);
      rig.rot('legR',-4);rig.rot('kneeR',14);rig.rot('legL',8+up*48,0,3);rig.rot('kneeL',8);
      rig.both('arm',[-68,0,12]);rig.both('elbow',[-18,0,0]);
    }else if(id==='curl'){
      rig.root(.57,-.02);rig.rot('spine',-3);rig.both('leg',[-80,0,3]);rig.both('knee',[12+up*82,0,0]);
      rig.both('arm',[-18,0,14]);rig.both('elbow',[-58,0,0]);
    }
    rig.model.updateMatrixWorld(true);
    const v=(name)=>rig.point(name,new THREE.Vector3());
    if(eq.bar){
      if(id==='rdl'){
        const a=v('handL'),b=v('handR');eq.bar.position.copy(a).add(b).multiplyScalar(.5);eq.bar.position.y-=.035;
      }else{
        const h=v('hips');eq.bar.position.copy(h);eq.bar.position.y+=.095;eq.bar.position.z+=.045;
      }
    }
    if(eq.dumbbells){['handL','handR'].forEach((n,i)=>{eq.dumbbells[i].position.copy(v(n));eq.dumbbells[i].position.y-=.04})}
    if(eq.pads){['kneeL','kneeR'].forEach((n,i)=>{const k=v(n);eq.pads[i].position.copy(k);eq.pads[i].position.z+=.02})}
    if(eq.curlPad){const a=v('footL'),b=v('footR');eq.curlPad.position.copy(a).add(b).multiplyScalar(.5);eq.curlPad.position.y+=.06}
    if(eq.cable){const ankle=v('footL'),origin=new THREE.Vector3(0,.2,.58);eq.cable.geometry.setFromPoints([origin,ankle]);eq.strap.position.copy(ankle)}
    const phaseLabels={ht:['ПОДЪЁМ','ОПУСКАНИЕ'],rdl:['ОПУСКАНИЕ','ПОДЪЁМ'],bulg:['ОПУСКАНИЕ','ПОДЪЁМ'],abd:['ОТВЕДЕНИЕ','ВОЗВРАТ'],sq:['ОПУСКАНИЕ','ПОДЪЁМ'],hyper:['ОПУСКАНИЕ','ПОДЪЁМ'],kick:['ОТВЕДЕНИЕ','ВОЗВРАТ'],curl:['СГИБАНИЕ','ВОЗВРАТ']};
    return phaseLabels[id][p<.5?0:1];
  }

  async function mount(id) {
    const shell=document.querySelector(`[data-tech3d="${id}"]`);
    if(!shell||shell.dataset.mounted)return;
    shell.dataset.mounted='1';
    if(active)active.dispose();
    const host=shell.querySelector('[data-t3canvas]'),loading=shell.querySelector('.tech3d-loading');
    const state={id,shell,host,time:0,paused:reduceMotion(),speed:1,yaw:CAMERA[id].yaw,pitch:CAMERA[id].pitch,radius:CAMERA[id].radius,view:'hero',disposed:false,frames:0};
    active=state;
    let renderer;
    try {
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    } catch(error) { fail(shell,'WebGL недоступен');return; }
    state.renderer=renderer;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
    const scene=new THREE.Scene();state.scene=scene;
    const pmrem=new THREE.PMREMGenerator(renderer),env=new RoomEnvironment();state.env=env;
    scene.environment=pmrem.fromScene(env,.04).texture;pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffeee6,0x30222c,1.35));
    const key=new THREE.DirectionalLight(0xffe5d8,2.65);key.position.set(2.6,4.2,3.2);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=2;key.shadow.camera.bottom=-2;key.shadow.bias=-.0004;scene.add(key);
    const rim=new THREE.DirectionalLight(0xf6a58e,1.25);rim.position.set(-3,2,-2);scene.add(rim);
    const camera=new THREE.PerspectiveCamera(31,1,.05,30);state.camera=camera;
    studio(scene);const eq=equipment(id,scene);state.eq=eq;
    function resize(){
      if(state.disposed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render();
    }
    function updateCamera(){
      const c=CAMERA[id],target=new THREE.Vector3(...c.target),r=state.radius;
      camera.position.set(target.x+r*Math.sin(state.yaw)*Math.cos(state.pitch),target.y+r*Math.sin(state.pitch),target.z+r*Math.cos(state.yaw)*Math.cos(state.pitch));
      camera.lookAt(target);
    }
    function render(){
      if(state.disposed||!state.rig)return;updateCamera();state.phase=animate(id,state.rig,eq,state.time);
      const phase=shell.querySelector('[data-t3phase]');if(phase)phase.textContent=state.paused?'ПОКАДРОВО':state.phase;
      const scrub=shell.querySelector('[data-t3scrub]');if(scrub&&document.activeElement!==scrub)scrub.value=Math.round(state.time*1000);
      renderer.render(scene,camera);state.frames++;shell.dataset.ready='1';
    }
    state.render=render;state.resize=resize;
    try {
      const gltf=await loadModel();if(state.disposed)return;
      state.rig=createRig(gltf,scene);loading.hidden=true;shell.classList.add('is-ready');
      resize();render();
    } catch(error) { fail(shell,'3D-модель не загрузилась');return; }
    const observer=new ResizeObserver(resize);observer.observe(host);state.observer=observer;
    bind(state);
    let previous=performance.now();
    function frame(now){
      if(state.disposed)return;const dt=Math.min((now-previous)/1000,.05);previous=now;
      const visible=shell.isConnected&&shell.getClientRects().length>0;
      if(!state.paused&&!document.hidden&&visible){state.time=(state.time+dt*state.speed/DURATION)%1;render()}
      if(shell.isConnected)state.raf=requestAnimationFrame(frame);
    }
    state.raf=requestAnimationFrame(frame);
    window.__PEACH_TECH__={get id(){return id},get ready(){return !!state.rig},get frames(){return state.frames},get paused(){return state.paused},get time(){return state.time},get triangles(){return renderer.info.render.triangles},get calls(){return renderer.info.render.calls},setTime(value){state.paused=true;state.time=Math.max(0,Math.min(1,value));syncPlay(state);render()},render};
  }

  function syncPlay(state){
    const b=state.shell.querySelector('[data-t3play]');if(!b)return;
    b.setAttribute('aria-pressed',String(state.paused));b.setAttribute('aria-label',state.paused?'Воспроизвести':'Пауза');
    b.innerHTML=`${icon(state.paused?'play':'pause')}<span>${state.paused?'Смотреть':'Пауза'}</span>`;
  }

  function setView(state,view){
    state.view=view;const base=CAMERA[state.id].yaw;
    state.yaw=view==='side'?Math.PI/2:view==='front'?0:base;state.pitch=CAMERA[state.id].pitch;state.radius=CAMERA[state.id].radius;
    state.shell.querySelectorAll('[data-t3view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.t3view===view)));state.render();
  }

  function bind(state){
    const {shell,host}=state;
    shell.querySelector('[data-t3play]').addEventListener('click',()=>{state.paused=!state.paused;syncPlay(state);state.render()});
    shell.querySelector('[data-t3speed]').addEventListener('click',e=>{state.speed=state.speed===1?.5:1;e.currentTarget.textContent=state.speed===1?'1×':'0,5×';e.currentTarget.setAttribute('aria-label',`Скорость ${state.speed===1?'1':'0,5'} раз`)});
    shell.querySelector('[data-t3scrub]').addEventListener('input',e=>{state.paused=true;state.time=+e.target.value/1000;syncPlay(state);state.render()});
    shell.querySelectorAll('[data-t3view]').forEach(b=>b.addEventListener('click',()=>setView(state,b.dataset.t3view)));
    shell.querySelector('[data-t3reset]').addEventListener('click',()=>setView(state,'hero'));
    let drag=null;
    host.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:state.yaw,pitch:state.pitch};host.setPointerCapture(e.pointerId);host.classList.add('is-dragging')});
    host.addEventListener('pointermove',e=>{if(!drag)return;state.yaw=drag.yaw-(e.clientX-drag.x)*.009;state.pitch=Math.max(-.05,Math.min(.55,drag.pitch+(e.clientY-drag.y)*.006));state.render()});
    const end=()=>{drag=null;host.classList.remove('is-dragging')};host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);
    host.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))return;e.preventDefault();if(e.key===' '){state.paused=!state.paused;syncPlay(state)}else{if(e.key==='ArrowLeft')state.yaw-=.12;if(e.key==='ArrowRight')state.yaw+=.12;if(e.key==='ArrowUp')state.pitch=Math.min(.55,state.pitch+.08);if(e.key==='ArrowDown')state.pitch=Math.max(-.05,state.pitch-.08)}state.render()});
    state.dispose=()=>{state.disposed=true;cancelAnimationFrame(state.raf);state.observer?.disconnect();state.scene.traverse(n=>{n.geometry?.dispose();if(n.material){const ms=Array.isArray(n.material)?n.material:[n.material];ms.forEach(m=>m.dispose())}});state.renderer.dispose();state.env?.dispose();state.renderer.domElement.remove();if(active===state)active=null};
  }

  function fail(shell,message){
    shell.hidden=true;const fallback=shell.parentElement.querySelector('.tech3d-fallback');if(fallback)fallback.hidden=false;
    console.warn(`PEACH technique fallback: ${message}`);
  }

  window.peachTechnique=plate;
})();
