/* PEACH technique plates: lightweight, offline, parametric SVG figures. */
(function(){
"use strict";
const P={
 ht:[
  {head:[67,66],shoulder:[83,91],hip:[105,151],knee:[174,116],ankle:[174,204],elbow:[105,112],hand:[121,145],gear:"bench",bar:[91,139,151,151],arrow:"up"},
  {head:[58,90],shoulder:[82,111],hip:[132,111],knee:[184,111],ankle:[184,204],elbow:[105,125],hand:[139,117],gear:"bench",bar:[105,99,167,111],arrow:"down",line:[[82,111],[132,111],[184,111]]}
 ],
 rdl:[
  {head:[126,31],shoulder:[123,57],hip:[119,113],knee:[128,160],ankle:[126,211],elbow:[133,89],hand:[133,119],bar:[96,121,171,121],arrow:"back"},
  {head:[55,91],shoulder:[77,103],hip:[126,119],knee:[139,163],ankle:[132,211],elbow:[101,126],hand:[119,157],bar:[87,159,159,159],arrow:"up",line:[[55,91],[77,103],[126,119]]}
 ],
 bulg:[
  {head:[115,31],shoulder:[108,59],hip:[105,116],knee:[142,161],ankle:[142,211],backKnee:[66,147],backAnkle:[52,108],elbow:[99,92],hand:[102,120],gear:"rearBench",arrow:"down"},
  {head:[83,70],shoulder:[91,94],hip:[111,146],knee:[157,157],ankle:[164,211],backKnee:[65,169],backAnkle:[48,113],elbow:[90,121],hand:[103,144],gear:"rearBench",arrow:"up",line:[[83,70],[91,94],[111,146]]}
 ],
 sq:[
  {head:[124,29],shoulder:[119,56],hip:[118,112],knee:[125,159],ankle:[124,211],elbow:[105,79],hand:[101,103],gear:"hack",arrow:"down"},
  {head:[91,74],shoulder:[99,96],hip:[117,148],knee:[159,159],ankle:[139,211],elbow:[93,113],hand:[100,128],gear:"hack",arrow:"up",line:[[91,74],[99,96],[117,148]]}
 ],
 abd:[
  {head:[110,36],shoulder:[108,65],hip:[108,120],knee:[151,151],ankle:[155,207],otherKnee:[87,151],otherAnkle:[83,207],elbow:[94,93],hand:[91,119],gear:"seat",arrow:"out"},
  {head:[110,36],shoulder:[108,65],hip:[108,120],knee:[174,143],ankle:[193,194],otherKnee:[66,143],otherAnkle:[47,194],elbow:[94,93],hand:[91,119],gear:"seat",arrow:"in"}
 ],
 hyper:[
  {head:[66,75],shoulder:[89,100],hip:[137,126],knee:[185,131],ankle:[220,139],elbow:[98,116],hand:[115,129],gear:"hyper",arrow:"up"},
  {head:[83,51],shoulder:[105,75],hip:[139,116],knee:[186,126],ankle:[220,139],elbow:[112,96],hand:[127,107],gear:"hyper",arrow:"down",line:[[83,51],[105,75],[139,116],[186,126]]}
 ],
 kick:[
  {head:[99,45],shoulder:[93,73],hip:[107,124],knee:[107,167],ankle:[105,211],backKnee:[149,128],backAnkle:[154,163],elbow:[78,100],hand:[75,126],gear:"cable",arrow:"back"},
  {head:[99,45],shoulder:[93,73],hip:[107,124],knee:[107,167],ankle:[105,211],backKnee:[148,107],backAnkle:[190,82],elbow:[78,100],hand:[75,126],gear:"cable",arrow:"return",line:[[93,73],[107,124],[148,107],[190,82]]}
 ],
 curl:[
  {head:[105,36],shoulder:[105,65],hip:[106,121],knee:[158,137],ankle:[166,199],elbow:[98,93],hand:[107,116],gear:"seat",arrow:"bend"},
  {head:[105,36],shoulder:[105,65],hip:[106,121],knee:[158,137],ankle:[113,179],elbow:[98,93],hand:[107,116],gear:"seat",arrow:"extend"}
 ]
};
const LABELS={ht:"Таз вверх · линия плечи—колени",rdl:"Таз назад · гриф вдоль ног",bulg:"Корпус вперёд · пятка передней ноги",sq:"Глубоко · колени по носкам",abd:"Отведение без поворота таза",hyper:"Подъём тазом · без переразгибания",kick:"Нога назад · корпус неподвижен",curl:"Плавное сгибание · таз прижат"};
function equipment(kind){
 if(kind==="bench")return '<path class="tv-equip" d="M35 100v83h39v-83M30 183h50"/>';
 if(kind==="rearBench")return '<path class="tv-equip" d="M25 105v91h45v-91M20 196h54"/>';
 if(kind==="seat")return '<path class="tv-equip" d="M73 119h68v17H80v72M65 208h34M140 136l30 72"/>';
 if(kind==="hack")return '<path class="tv-equip" d="M72 39l36 161M54 201h91M75 48l58 22"/>';
 if(kind==="hyper")return '<path class="tv-equip" d="M127 131h69l31 65M145 143l-23 53M110 197h105"/>';
 if(kind==="cable")return '<path class="tv-equip" d="M29 28v183M20 211h30M29 151l47 12"/>';
 return ''
}
function arrow(kind){
 const paths={up:'M245 176V86m-9 12 9-12 9 12',down:'M245 86v90m-9-12 9 12 9-12',back:'M185 105H75m12-10-12 10 12 10',out:'M126 165h95m-12-10 12 10-12 10',in:'M220 165h-95m12-10-12 10 12 10',bend:'M207 173q-8 37-48 42m5-12-5 12 13 1',extend:'M159 215q40-5 48-42m-13-1 13 1-5 12',return:'M204 105q25-25 12-57m-12 8 12-8 5 13'};
 return paths[kind]?`<path class="tv-arrow" d="${paths[kind]}"/>`:''
}
function figure(p,offset){
 const seg=(a,b,cls='tv-body')=>`<path class="${cls}" d="M${p[a][0]+offset} ${p[a][1]}L${p[b][0]+offset} ${p[b][1]}"/>`;
 let h=`<g>${equipment(p.gear||'')}<circle class="tv-head" cx="${p.head[0]+offset}" cy="${p.head[1]}" r="15"/>`;
 h+=seg('shoulder','hip')+seg('hip','knee','tv-body tv-focus')+seg('knee','ankle')+seg('shoulder','elbow','tv-arm')+seg('elbow','hand','tv-arm');
 if(p.backKnee){h+=`<path class="tv-body tv-back" d="M${p.hip[0]+offset} ${p.hip[1]}L${p.backKnee[0]+offset} ${p.backKnee[1]}L${p.backAnkle[0]+offset} ${p.backAnkle[1]}"/>`}
 if(p.otherKnee){h+=`<path class="tv-body tv-back" d="M${p.hip[0]+offset} ${p.hip[1]}L${p.otherKnee[0]+offset} ${p.otherKnee[1]}L${p.otherAnkle[0]+offset} ${p.otherAnkle[1]}"/>`}
 if(p.bar){const b=p.bar;h+=`<path class="tv-bar" d="M${b[0]+offset} ${b[1]}L${b[2]+offset} ${b[3]}"/><path class="tv-plate" d="M${b[0]+5+offset} ${b[1]-13}v26M${b[2]-5+offset} ${b[3]-13}v26"/>`}
 if(p.line)h+=`<path class="tv-align" d="M${p.line.map(q=>q[0]+offset+' '+q[1]).join(' L')}"/>`;
 return h+arrow(p.arrow)+'</g>'
}
function plate(id){
 const poses=P[id]||P.rdl;
 return `<figure class="tech-visual" aria-label="Схема техники: ${LABELS[id]||LABELS.rdl}"><svg viewBox="0 0 620 260" role="img" aria-hidden="true"><path class="tv-floor" d="M20 218h580"/>${figure(poses[0],20)}${figure(poses[1],315)}<path class="tv-divider" d="M310 30v190"/></svg><figcaption><span><b>01</b> Начало</span><strong>${LABELS[id]||LABELS.rdl}</strong><span><b>02</b> Движение</span></figcaption></figure>`
}
window.peachTechnique=plate;
})();
