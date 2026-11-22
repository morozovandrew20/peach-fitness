/* PEACH: original parametric line figure. No models, textures or external libraries. */
(function(){
"use strict";
const TAU=Math.PI*2, FPS=30, FRAME=1000/FPS;
const v=(x=0,y=0,z=0)=>[x,y,z], add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], mul=(a,n)=>[a[0]*n,a[1]*n,a[2]*n], mix=(a,b,t)=>add(a,mul(sub(b,a),t));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=a=>mul(a,1/(Math.sqrt(dot(a,a))||1));
function rotate(p,o,a){const c=Math.cos(a),s=Math.sin(a),q=sub(p,o);return [o[0]+q[0],o[1]+c*q[1]-s*q[2],o[2]+s*q[1]+c*q[2]]}
function base(){
  const j={p:v(0,1.65,0),c:v(0,2.35,0),n:v(0,2.61,0),h:v(0,2.88,0),
    sl:v(-.34,2.48,0),sr:v(.34,2.48,0),hl:v(-.20,1.65,0),hr:v(.20,1.65,0),
    kl:v(-.22,.91,.04),kr:v(.22,.91,.04),al:v(-.22,.18,0),ar:v(.22,.18,0),tl:v(-.22,.09,.27),tr:v(.22,.09,.27)};
  armsHang(j);return j
}
function armsHang(j,len=.79){for(const side of ["l","r"]){const q=side==="l"?-1:1,s=j["s"+side];j["w"+side]=add(s,v(q*.10,-len,.05));j["e"+side]=mix(s,j["w"+side],.52)}}
function lean(j,a){for(const k of ["c","n","h","sl","sr"])j[k]=rotate(j[k],j.p,a)}
function shiftUpper(j,dy,dz=0){for(const k of ["p","c","n","h","sl","sr","hl","hr"]){j[k][1]+=dy;j[k][2]+=dz}}
function line(seg,a,b,type="prop"){seg.push({a:a.slice(),b:b.slice(),type})}
function poly(seg,pts,type="prop",closed=false){for(let i=1;i<pts.length;i++)line(seg,pts[i-1],pts[i],type);if(closed&&pts.length>2)line(seg,pts[pts.length-1],pts[0],type)}
function circle(seg,c,u,w,rx,ry=rx,n=8,type="body"){const pts=[];for(let i=0;i<n;i++){const a=TAU*i/n;pts.push(add(c,add(mul(u,Math.cos(a)*rx),mul(w,Math.sin(a)*ry))))}seg.push({path:pts,closed:true,type});return pts}
function basis(axis,ref=v(1,0,0)){const up=norm(axis),r=norm(sub(ref,mul(up,dot(ref,up))));return [r,norm(cross(r,up)),up]}
function wireLimb(seg,a,b,ra,rb=ra){const axis=sub(b,a),[u,w]=basis(axis,Math.abs(norm(axis)[0])>.85?v(0,0,1):v(1,0,0)),r=(ra+rb)/2;circle(seg,mix(a,b,.5),u,w,r,r,6);for(const i of [0,2,4]){const t=TAU*i/6,ca=Math.cos(t),sa=Math.sin(t);line(seg,add(a,add(mul(u,ca*ra),mul(w,sa*ra))),add(b,add(mul(u,ca*rb),mul(w,sa*rb))),"body")}}
function barbell(seg,y,z,half=.78){line(seg,v(-half,y,z),v(half,y,z));for(const q of [-1,1]){const c=v(q*half,y,z);circle(seg,c,v(0,1,0),v(0,0,1),.17,.17,8,"prop");line(seg,v(q*(half-.09),y,z),v(q*(half+.09),y,z))}}
function bench(seg,y,z,len=.9,width=.55){const x=width/2,a=z-len/2,b=z+len/2;for(const yy of [y,y-.12]){line(seg,v(-x,yy,a),v(x,yy,a));line(seg,v(-x,yy,b),v(x,yy,b));line(seg,v(-x,yy,a),v(-x,yy,b));line(seg,v(x,yy,a),v(x,yy,b))}for(const xx of [-x,x])for(const zz of [a,b])line(seg,v(xx,y-.12,zz),v(xx,.03,zz))}
function seated(){return {p:v(0,.92,0),c:v(0,1.58,-.05),n:v(0,1.84,-.05),h:v(0,2.10,-.05),sl:v(-.34,1.70,-.05),sr:v(.34,1.70,-.05),hl:v(-.2,.92,0),hr:v(.2,.92,0),kl:v(-.25,.78,.58),kr:v(.25,.78,.58),al:v(-.25,.17,.63),ar:v(.25,.17,.63),tl:v(-.25,.09,.88),tr:v(.25,.09,.88),el:v(-.43,1.25,.08),er:v(.43,1.25,.08),wl:v(-.39,.93,.26),wr:v(.39,.93,.26)}}
function standingSquat(s){const j=base();shiftUpper(j,-.52*s,-.10*s);lean(j,.22*s);j.kl=v(-.25,.91-.12*s,.05+.39*s);j.kr=v(.25,.91-.12*s,.05+.39*s);for(const side of ["l","r"]){const q=side==="l"?-1:1,sh=j["s"+side];j["e"+side]=add(sh,v(q*.17,-.27,.13));j["w"+side]=add(sh,v(q*.15,-.02,-.06))}return j}
function standingRdl(s,single=false){const j=base(),a=1.18*s;j.p[2]-=.10*s;j.hl[2]=j.hr[2]=j.p[2];lean(j,a);j.kl[2]+=.13;j.kr[2]+=.13;armsHang(j,.80);if(single){const hip=j.hr;for(const k of ["kr","ar","tr"])j[k]=rotate(j[k],hip,a);j.wl=add(j.sl,v(-.08,-.79,.05));j.el=mix(j.sl,j.wl,.52);j.wr=add(j.sr,v(.34,-.16,.02));j.er=mix(j.sr,j.wr,.52)}return j}
function standingRdlFocus(s){const j=base();lean(j,1.08*s);shiftUpper(j,-.06*s,-.38*s);j.kl[2]+=.13+.04*s;j.kr[2]+=.13+.04*s;for(const side of ["l","r"]){const q=side==="l"?-1:1,sh=j["s"+side];j["w"+side]=add(sh,v(q*.10,-.82,.05-.10*s));j["e"+side]=mix(sh,j["w"+side],.52)}return j}
const STAND={center:v(0,1.53,.03),height:3.15,breadth:2.02,yaw:-.48}, RDL={center:v(0,1.51,.02),height:3.12,breadth:2.04,yaw:-.92}, LOW={center:v(0,.83,-.10),height:1.58,breadth:2.78,yaw:-1.02}, SEAT={center:v(0,1.13,.18),height:2.34,breadth:1.48,yaw:-.72};
function pack(j,view=STAND,props=[],duration=3.6){return {j,view,props,duration}}
const POSES={
  ht(s,one=false){const y=.72+.40*s,j={p:v(0,y,0),c:v(0,1.12,-.72),n:v(0,1.15,-.94),h:v(0,1.18,-1.18),sl:v(-.34,1.12,-.72),sr:v(.34,1.12,-.72),hl:v(-.2,y,0),hr:v(.2,y,0),kl:v(-.22,.88,.57),kr:v(.22,.88,.57),al:v(-.22,.16,.72),ar:v(.22,.16,.72),tl:v(-.22,.08,.98),tr:v(.22,.08,.98)};for(const side of ["l","r"]){const q=side==="l"?-1:1;j["w"+side]=v(q*.48,y+.10,0);j["e"+side]=v(q*.52,.93,-.34)}if(one){j.kr=v(.20,1.19,.38);j.ar=v(.20,1.47,.22);j.tr=v(.20,1.49,.46)}const p=[];bench(p,1.00,-.75,.68,.66);barbell(p,y+.13,0,.72);return pack(j,LOW,p,3.4)},
  ht1(s){return POSES.ht(s,true)},
  rdl(s){const j=standingRdlFocus(s),p=[];barbell(p,(j.wl[1]+j.wr[1])/2,(j.wl[2]+j.wr[2])/2,.72);return pack(j,RDL,p,3.8)},
  rdl1(s){const j=standingRdl(s,true),p=[];line(p,add(j.wl,v(-.10,0,0)),add(j.wl,v(.10,0,0)));circle(p,j.wl,v(0,1,0),v(0,0,1),.11,.11,6,"prop");return pack(j,STAND,p,4)},
  sq(s){const j=standingSquat(s),p=[],sh=mix(j.sl,j.sr,.5);barbell(p,sh[1]+.06,sh[2]-.13,.72);line(p,v(-.48,.05,-.34),v(-.48,2.75,-.34));line(p,v(.48,.05,-.34),v(.48,2.75,-.34));return pack(j,STAND,p,3.8)},
  bulg(s){const j=base();shiftUpper(j,-.48*s,-.08*s);lean(j,.38);j.al=v(-.22,.16,.48);j.tl=v(-.22,.08,.75);j.kl=v(-.22,.88,.48+.20*s);j.ar=v(.22,.56,-.58);j.tr=v(.22,.53,-.35);j.kr=v(.22,1.00-.43*s,-.52);armsHang(j,.70);const p=[];bench(p,.48,-.60,.52,.55);for(const side of ["l","r"]){const w=j["w"+side];line(p,add(w,v(-.09,0,0)),add(w,v(.09,0,0)))}return pack(j,STAND,p,4)},
  lunge(s){const j=base();shiftUpper(j,-.50*s,0);lean(j,.30*s);j.al=v(-.22,.16,.30);j.tl=v(-.22,.08,.57);j.kl=v(-.22,.90,.30+.24*s);j.ar=v(.22,.16,-.64*s);j.tr=v(.22,.08,.27-.64*s);j.kr=v(.22,.91-.52*s,-.56*s);armsHang(j,.72);return pack(j,STAND,[],4)},
  step(s){const j=base();shiftUpper(j,-.30+.38*s,.16);lean(j,.30*(1-s));j.al=v(-.22,.66,.46);j.tl=v(-.22,.58,.72);j.kl=v(-.22,1.05+.23*s,.42);j.ar=v(.22,.16,-.20+.10*s);j.tr=v(.22,.08,.07+.10*s);j.kr=v(.22,.78+.48*s,-.12);armsHang(j,.74);const p=[];bench(p,.58,.48,.58,.62);return pack(j,STAND,p,4)},
  hyper(s){const j=base();j.p=v(0,1.24,0);j.c=v(0,2.02,0);j.n=v(0,2.28,0);j.h=v(0,2.55,0);j.sl=v(-.34,2.14,0);j.sr=v(.34,2.14,0);j.hl=v(-.2,1.24,0);j.hr=v(.2,1.24,0);j.kl=v(-.22,.70,-.16);j.kr=v(.22,.70,-.16);j.al=v(-.22,.17,-.30);j.ar=v(.22,.17,-.30);j.tl=v(-.22,.10,-.04);j.tr=v(.22,.10,-.04);lean(j,1.03*s);for(const side of ["l","r"]){const q=side==="l"?-1:1,sh=j["s"+side];j["e"+side]=add(sh,v(q*.12,-.12,.16));j["w"+side]=add(j.n,v(q*.13,-.02,-.03))}const p=[];bench(p,1.12,-.02,.64,.62);line(p,v(-.42,.26,-.32),v(.42,.26,-.32));return pack(j,STAND,p,3.8)},
  abd(s){const j=seated();j.kl=v(-.25-.30*s,.78,.58);j.kr=v(.25+.30*s,.78,.58);j.al=v(-.25-.27*s,.17,.63);j.ar=v(.25+.27*s,.17,.63);j.tl=add(j.al,v(0,-.08,.25));j.tr=add(j.ar,v(0,-.08,.25));const p=[];bench(p,.82,-.03,.62,.62);line(p,v(-.42,.88,-.20),v(-.42,1.90,-.28));line(p,v(.42,.88,-.20),v(.42,1.90,-.28));return pack(j,SEAT,p,3.2)},
  abds(s){const j=base();j.kr=v(.23+.47*s,.93,-.10*s);j.ar=v(.23+.58*s,.18,-.18*s);j.tr=add(j.ar,v(0,-.09,.27));j.wl=v(-.67,1.90,.02);j.el=v(-.53,2.12,0);const p=[];line(p,v(-.76,.04,-.15),v(-.76,2.45,-.15));line(p,v(-.76,.20,-.15),j.ar);return pack(j,STAND,p,3.2)},
  kick(s){const j=base();lean(j,.20);j.kr=rotate(j.kr,j.hr,.68*s);j.ar=rotate(j.ar,j.hr,.68*s);j.tr=rotate(j.tr,j.hr,.68*s);j.wl=v(-.67,1.92,.12);j.el=v(-.52,2.13,.06);const p=[];line(p,v(-.76,.04,.10),v(-.76,2.45,.10));line(p,v(-.76,.23,.10),j.ar);return pack(j,STAND,p,3.2)},
  curl(s){const j=seated();j.c[2]+=.06;j.n[2]+=.06;j.h[2]+=.06;j.sl[2]+=.06;j.sr[2]+=.06;j.al=v(-.25,.17,.76-.48*s);j.ar=v(.25,.17,.76-.48*s);j.al[1]+=.28*s;j.ar[1]+=.28*s;j.tl=add(j.al,v(0,-.08,.25));j.tr=add(j.ar,v(0,-.08,.25));const p=[];bench(p,.82,-.03,.62,.62);line(p,v(-.42,.88,-.20),v(-.42,1.90,-.28));line(p,v(.42,.88,-.20),v(.42,1.90,-.28));line(p,v(-.40,j.al[1]+.09,j.al[2]),v(.40,j.ar[1]+.09,j.ar[2]));return pack(j,SEAT,p,3.2)}
};
Object.assign(POSES,{
  curl1(s){const j={p:v(0,.78,0),c:v(0,.86,-.72),n:v(0,.88,-.94),h:v(0,.91,-1.17),sl:v(-.34,.86,-.72),sr:v(.34,.86,-.72),hl:v(-.2,.78,0),hr:v(.2,.78,0),kl:v(-.22,.70,.53),kr:v(.22,.70,.53),al:v(-.22,.62,.98),ar:v(.22,.62,.98),tl:v(-.22,.58,1.22),tr:v(.22,.58,1.22),el:v(-.43,.62,-.58),er:v(.43,.62,-.58),wl:v(-.40,.57,-.20),wr:v(.40,.57,-.20)};j.al=v(-.22,.62+.36*s,.98-.48*s);j.ar=v(.22,.62+.36*s,.98-.48*s);j.tl=add(j.al,v(0,-.04,.24));j.tr=add(j.ar,v(0,-.04,.24));const p=[];bench(p,.66,.02,2.15,.64);line(p,v(-.39,j.al[1]+.10,j.al[2]),v(.39,j.ar[1]+.10,j.ar[2]));return pack(j,LOW,p,3.2)},
  legpress(s){const j=seated();j.p=v(0,.79,-.22);j.c=v(0,1.35,-.61);j.n=v(0,1.57,-.73);j.h=v(0,1.81,-.85);j.sl=v(-.34,1.43,-.64);j.sr=v(.34,1.43,-.64);j.hl=v(-.2,.79,-.22);j.hr=v(.2,.79,-.22);j.kl=v(-.25,1.00-.16*s,.47-.34*s);j.kr=v(.25,1.00-.16*s,.47-.34*s);j.al=v(-.25,.82,1.00-.43*s);j.ar=v(.25,.82,1.00-.43*s);j.tl=add(j.al,v(0,0,.25));j.tr=add(j.ar,v(0,0,.25));j.el=v(-.43,1.05,-.32);j.er=v(.43,1.05,-.32);j.wl=v(-.40,.83,-.10);j.wr=v(.40,.83,-.10);const p=[];bench(p,.69,-.33,.70,.64);line(p,v(-.43,.79,-.61),v(-.43,1.72,-.98));line(p,v(.43,.79,-.61),v(.43,1.72,-.98));const z=1.09-.43*s;line(p,v(-.55,.40,z),v(-.55,1.24,z));line(p,v(.55,.40,z),v(.55,1.24,z));line(p,v(-.55,.40,z),v(.55,.40,z));line(p,v(-.55,1.24,z),v(.55,1.24,z));return pack(j,{center:v(0,1.04,.10),height:2.08,breadth:2.38,yaw:-.92},p,3.8)}
});
const TORSO=[[0,.27,.18],[.18,.32,.19],[.42,.215,.135],[.67,.27,.17],[.86,.32,.18],[1,.345,.145]];
function bodySegments(j){
  const seg=[],top=mix(j.c,j.n,.44),axis=sub(top,j.p),[right,front]=basis(axis),rings=[];
  for(const [t,rx,rz] of TORSO){const c=mix(j.p,top,t);rings.push(circle(seg,c,right,front,rx,rz,8))}
  for(let k=1;k<rings.length;k++)for(let i=0;i<8;i+=2)line(seg,rings[k-1][i],rings[k][i],"body");
  wireLimb(seg,j.n,mix(j.n,j.h,.36),.085,.09);
  const haxis=sub(j.h,j.n),[hr,hf,hu]=basis(haxis),headRings=[],offsets=[-.19,-.10,.07,.19],rX=[.07,.135,.145,.085],rZ=[.075,.115,.125,.075];
  for(let k=0;k<4;k++)headRings.push(circle(seg,add(j.h,mul(hu,offsets[k])),hr,hf,rX[k],rZ[k],8));
  for(let k=1;k<4;k++)for(let i=0;i<8;i+=2)line(seg,headRings[k-1][i],headRings[k][i],"body");
  poly(seg,[add(j.h,add(mul(hu,.03),mul(hf,-.12))),add(j.h,add(mul(hu,-.15),mul(hf,-.24))),add(j.h,add(mul(hu,-.35),mul(hf,-.20))) ],"body");
  for(const side of ["l","r"]){
    wireLimb(seg,j["s"+side],j["e"+side],.072,.062);wireLimb(seg,j["e"+side],j["w"+side],.062,.047);
    wireLimb(seg,j["h"+side],j["k"+side],.118,.088);wireLimb(seg,j["k"+side],j["a"+side],.088,.055);
    line(seg,j["w"+side],add(j["w"+side],v(0,-.10,.035)),"body");
    wireLimb(seg,j["a"+side],j["t"+side],.060,.067)
  }
  return seg
}
function smoothPath(seg,pts,type="soft",closed=false){seg.push({path:pts,closed,type})}
function sculptedLoft(seg,rings,yaw,flow=true){
  const sx=v(Math.cos(yaw),0,Math.sin(yaw)),near=v(-Math.sin(yaw),0,Math.cos(yaw)),edges=[[],[]],flows=[[],[]];
  for(const r of rings){const point=a=>add(r.c,add(mul(r.u,Math.cos(a)*r.rx),mul(r.w,Math.sin(a)*(Math.sin(a)>=0?r.front:r.back)))),rz=(r.front+r.back)*.5,edge=Math.atan2(rz*dot(r.w,sx),r.rx*dot(r.u,sx)),facing=Math.atan2(rz*dot(r.w,near),r.rx*dot(r.u,near));edges[0].push(point(edge));edges[1].push(point(edge+Math.PI));if(flow){flows[0].push(point(facing-.48));flows[1].push(point(facing+.48))}if(r.arc){const pts=[];for(let k=-2;k<=2;k++)pts.push(point(facing+k*.34));smoothPath(seg,pts,"soft")}}
  smoothPath(seg,edges[0],"contour");smoothPath(seg,edges[1],"contour");if(flow){smoothPath(seg,flows[0],"soft");smoothPath(seg,flows[1],"soft")}
}
function organicLimb(seg,a,b,radii,yaw,flow=true,offset=0){const axis=sub(b,a),[u,w]=basis(axis,Math.abs(norm(axis)[0])>.85?v(0,0,1):v(1,0,0)),ts=[0,.18,.42,.72,1];sculptedLoft(seg,ts.map((t,i)=>({c:add(mix(a,b,t),mul(w,Math.sin(Math.PI*t)*offset)),u,w,rx:radii[i],front:radii[i],back:radii[i],arc:i===2&&flow})),yaw,flow)}
function sculptRdl(j,yaw,phase){
  const seg=[],top=mix(j.c,j.n,.44),axis=sub(top,j.p),[right,front]=basis(axis),profile=[[0,.28,.17,.22,0],[.10,.33,.18,.28,1],[.24,.31,.16,.23,0],[.40,.225,.13,.14,1],[.55,.23,.15,.15,0],[.72,.285,.19,.16,0],[.88,.32,.19,.15,1],[1,.30,.11,.11,0]];
  sculptedLoft(seg,profile.map(([t,rx,f,b,arc])=>({c:mix(j.p,top,t),u:right,w:front,rx,front:f,back:b,arc:!!arc})),yaw);
  const haxis=sub(j.h,j.n),[hr,hf,hu]=basis(haxis),neckEnd=mix(j.n,j.h,.36);sculptedLoft(seg,[0,.5,1].map((t,i)=>({c:mix(j.n,neckEnd,t),u:hr,w:hf,rx:[.09,.078,.085][i],front:.078,back:.078})),yaw,false);
  const hp=[[-.19,.055,.06,.065,0],[-.10,.12,.11,.115,1],[.04,.142,.125,.125,0],[.15,.12,.105,.105,0],[.21,.05,.05,.055,0]];sculptedLoft(seg,hp.map(([o,rx,f,b,arc])=>({c:add(j.h,mul(hu,o)),u:hr,w:hf,rx,front:f,back:b,arc:!!arc})),yaw,false);
  const sway=Math.sin(TAU*phase)*.045,hairRoot=add(j.h,add(mul(hu,.08),mul(hf,-.12))),hairMid=add(hairRoot,v(0,-.23,-.10+sway*.5)),hairEnd=add(hairRoot,v(0,-.43,-.08+sway));smoothPath(seg,[hairRoot,add(hairRoot,v(0,-.08,-.10)),hairMid,hairEnd],"hair");smoothPath(seg,[add(hairRoot,mul(hr,.04)),add(hairMid,mul(hr,.035)),add(hairEnd,mul(hr,.015))],"hair");
  for(const side of ["l","r"]){const q=side==="l"?-1:1,s=j["s"+side],e=j["e"+side],w=j["w"+side],h=j["h"+side],k=j["k"+side],a=j["a"+side],t=j["t"+side];organicLimb(seg,s,e,[.09,.098,.087,.066,.052],yaw,false);organicLimb(seg,e,w,[.055,.064,.060,.047,.035],yaw,false);organicLimb(seg,h,k,[.14,.155,.145,.112,.082],yaw);organicLimb(seg,k,a,[.082,.092,.09,.063,.043],yaw,true,-.018);organicLimb(seg,a,t,[.052,.063,.064,.052,.035],yaw,false);smoothPath(seg,[add(w,v(q*.025,0,0)),add(w,v(q*.035,-.065,.025)),add(w,v(q*.018,-.11,.03))],"body")}
  return seg
}
function groundSegments(){const seg=[],u=v(1,0,0),w=v(0,0,1);circle(seg,v(0,.015,0),u,w,.76,.76,24,"ground");line(seg,v(-.92,.015,0),v(.92,.015,0),"ground");line(seg,v(0,.015,-.92),v(0,.015,.92),"ground");return seg}
const GROUND=groundSegments();
let active=null;
function create(canvas,kind){
  if(active)active.dispose();
  const root=canvas.closest(".motion-card"),poseDef=POSES[kind];if(!root||!poseDef)return null;
  const initial=poseDef(0),duration=initial.duration;
  const ctx=canvas.getContext("2d",{alpha:true});if(!ctx){root.classList.add("unavailable");return null}
  const play=root.querySelector("[data-motion-play]"),reducedNote=root.querySelector(".motion-reduced"),media=matchMedia("(prefers-reduced-motion: reduce)");
  let disposed=false,raf=0,pending=0,last=0,lastDraw=0,time=0,yaw=initial.view.yaw,pitch=-.10,playing=!media.matches,visible=true,drag=null,width=1,height=1,dpr=1,scale=1,gradient=null,propColor="",groundColor="";
  const stats={draws:0,totalMs:0,maxMs:0,segments:0,dpr:1,fps:FPS};
  const listeners=[];function on(el,type,fn,opts){el.addEventListener(type,fn,opts);listeners.push([el,type,fn,opts])}
  function colors(){const css=getComputedStyle(document.documentElement);gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,css.getPropertyValue("--a1").trim()||"#f04a36");gradient.addColorStop(1,css.getPropertyValue("--a2").trim()||"#ff8a5c");propColor=css.getPropertyValue("--muted").trim()||"#6e6e78";groundColor=propColor}
  function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;width=r.width;height=r.height;dpr=Math.min(window.devicePixelRatio||1,1.5);const bw=Math.round(width*dpr),bh=Math.round(height*dpr);if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh}ctx.setTransform(dpr,0,0,dpr,0,0);const view=initial.view;scale=Math.min(width/(view.breadth*1.12),height/(view.height*1.16));colors();stats.dpr=dpr;draw()}
  function project(p,center){const q=sub(p,center),c=Math.cos(yaw),s=Math.sin(yaw),x=c*q[0]+s*q[2],z=-s*q[0]+c*q[2],cp=Math.cos(pitch),sp=Math.sin(pitch),y=cp*q[1]-sp*z,d=sp*q[1]+cp*z;return [width*.5+x*scale,height*.51-y*scale,d]}
  function draw(){
    if(disposed)return;const started=performance.now(),phase=((time%duration)+duration)%duration/duration,s=(1-Math.cos(TAU*phase))/2,current=poseDef(s),j=current.j,center=current.view.center;
    ctx.clearRect(0,0,width,height);ctx.lineCap="round";ctx.lineJoin="round";
    const seg=GROUND.concat(current.props||[],kind==="rdl"?sculptRdl(j,yaw,phase):bodySegments(j));
    const projected=seg.map(q=>{if(q.path){const path=q.path.map(p=>project(p,center)),d=path.reduce((n,p)=>n+p[2],0)/path.length;return {path,d,type:q.type,closed:q.closed}}const a=project(q.a,center),b=project(q.b,center);return {a,b,d:(a[2]+b[2])*.5,type:q.type}}).sort((a,b)=>a.d-b.d),depths=projected.map(q=>q.d),minD=Math.min(...depths),maxD=Math.max(...depths),rangeD=maxD-minD||1;
    for(const q of projected){const near=(q.d-minD)/rangeD,body=["body","contour","soft","hair"].includes(q.type);ctx.globalAlpha=q.type==="ground"?.12:q.type==="prop"?.12+.25*near:q.type==="soft"?.10+.27*near:q.type==="hair"?.16+.52*near:q.type==="contour"?.42+.53*near:.10+.76*near;ctx.strokeStyle=body?gradient:q.type==="ground"?groundColor:propColor;ctx.lineWidth=q.type==="contour"?1.40+.45*near:q.type==="soft"?.82+.22*near:body?1.05+.40*near:1;ctx.beginPath();if(q.path){const p=q.path,n=p.length;if(q.closed){const last=p[n-1];ctx.moveTo((last[0]+p[0][0])/2,(last[1]+p[0][1])/2);for(let i=0;i<n;i++){const cur=p[i],next=p[(i+1)%n];ctx.quadraticCurveTo(cur[0],cur[1],(cur[0]+next[0])/2,(cur[1]+next[1])/2)}}else{ctx.moveTo(p[0][0],p[0][1]);for(let i=1;i<n-1;i++){const cur=p[i],next=p[i+1];ctx.quadraticCurveTo(cur[0],cur[1],(cur[0]+next[0])/2,(cur[1]+next[1])/2)}if(n>1)ctx.lineTo(p[n-1][0],p[n-1][1])}}else{ctx.moveTo(q.a[0],q.a[1]);ctx.lineTo(q.b[0],q.b[1])}ctx.stroke()}
    ctx.globalAlpha=1;stats.draws++;stats.segments=seg.length;const elapsed=performance.now()-started;stats.totalMs+=elapsed;stats.maxMs=Math.max(stats.maxMs,elapsed);window.__SCENE_READY__=true
  }
  function requestDraw(){if(!pending&&!disposed)pending=requestAnimationFrame(()=>{pending=0;draw()})}
  function updatePlay(){play.textContent=playing?"Пауза":"Пуск";play.setAttribute("aria-label",playing?"Приостановить анимацию":"Запустить анимацию");reducedNote.hidden=!media.matches||playing}
  function stopLoop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0}
  function startLoop(){if(!raf&&playing&&visible&&!document.hidden&&!disposed){last=0;raf=requestAnimationFrame(frame)}}
  function frame(now){raf=0;if(disposed||!playing||!visible||document.hidden)return;if(!last)last=now;const dt=Math.min(100,now-last);last=now;time+=dt/1000;if(now-lastDraw>=FRAME-1){draw();lastDraw=now}raf=requestAnimationFrame(frame)}
  function toggle(){playing=!playing;updatePlay();if(playing)startLoop();else stopLoop()}
  function turn(delta){const next=yaw+delta,base=initial.view.yaw,turns=Math.round((next-base)/TAU),aligned=next-turns*TAU;yaw=Math.abs(aligned-base)<1e-8?base:next;requestDraw()}
  on(play,"click",toggle);on(root.querySelector("[data-motion-left]"),"click",()=>turn(-Math.PI/4));on(root.querySelector("[data-motion-right]"),"click",()=>turn(Math.PI/4));
  on(canvas,"pointerdown",e=>{if(e.button!==undefined&&e.button!==0)return;drag={id:e.pointerId,x:e.clientX};if(canvas.setPointerCapture)try{canvas.setPointerCapture(e.pointerId)}catch(_){}canvas.focus({preventScroll:true});canvas.classList.add("dragging")});
  on(canvas,"pointermove",e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x;drag.x=e.clientX;turn(dx*.012)});
  const endDrag=e=>{if(drag&&drag.id===e.pointerId){drag=null;canvas.classList.remove("dragging")}};on(canvas,"pointerup",endDrag);on(canvas,"pointercancel",endDrag);on(canvas,"lostpointercapture",endDrag);
  on(canvas,"keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();turn(e.key==="ArrowLeft"?-Math.PI/8:Math.PI/8)}else if(e.key===" "){e.preventDefault();toggle()}});
  const visibility=()=>{if(document.hidden)stopLoop();else startLoop()};on(document,"visibilitychange",visibility);
  const motionChange=()=>{if(media.matches){playing=false;stopLoop();updatePlay()}else reducedNote.hidden=true};if(media.addEventListener)on(media,"change",motionChange);
  const ro=window.ResizeObserver?new ResizeObserver(resize):null;if(ro)ro.observe(canvas);else on(window,"resize",resize);
  const io=window.IntersectionObserver?new IntersectionObserver(entries=>{visible=!!entries[0]&&entries[0].isIntersecting;if(visible)startLoop();else stopLoop()},{root:root.closest(".panel"),threshold:.05}):null;if(io)io.observe(canvas);
  const api={seek(t){time=Number.isFinite(+t)?+t:0;draw()},stats(){return Object.assign({},stats,{averageMs:stats.draws?stats.totalMs/stats.draws:0,playing,visible,yaw})},dispose(){if(disposed)return;disposed=true;stopLoop();if(pending)cancelAnimationFrame(pending);pending=0;for(const [el,type,fn,opts] of listeners)el.removeEventListener(type,fn,opts);if(ro)ro.disconnect();if(io)io.disconnect();if(active===api)active=null;window.__SCENE_READY__=false}};
  active=api;updatePlay();resize();startLoop();return api
}
window.PeachMotion={create,available:kind=>!!POSES[kind]};
window.__seek=t=>{if(active)active.seek(t)};
window.__PEACH_MOTION_STATS__=()=>active?active.stats():null;
window.__SCENE_READY__=false;
})();
