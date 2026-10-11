import {esc} from './diagrams.mjs';
const text=(x,y,s,c='scene-label',anchor='middle')=>`<text x="${x}" y="${y}" class="${c}" text-anchor="${anchor}">${esc(s)}</text>`;
const path=(d,at,c='scene-primary')=>`<path d="${d}" class="${c}" data-motion="draw" data-at="${at}"/>`;
const show=(s,at)=>`<g data-motion="reveal" data-at="${at}">${s}</g>`;
const scene=(kind,title,body)=>({kind,title,html:`<svg class="solution-scene" viewBox="0 0 640 410" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${body}${text(320,394,'Qualitative model · use the values on your worksheet','scene-small')}</svg>`});
export function contextModel(q){
 const s=(q.prompt+' '+q.answer+' '+(q.worked||'')).toLowerCase();
 if(/equal.*opposite|opposite.*equal/.test(s)&&/third law|interaction|action.reaction|two objects|different objects/.test(s)){
  let b=`<rect x="106" y="154" width="132" height="106" rx="24" class="scene-object"/><rect x="402" y="154" width="132" height="106" rx="24" class="scene-object"/>`+text(172,218,'Object A')+text(468,218,'Object B');
  b+=path('M172 116H75M75 116L91 108M75 116L91 124',.12)+path('M468 116H565M565 116L549 108M565 116L549 124',.4,'scene-secondary');
  b+=show(text(172,80,'Force on A','scene-small')+text(468,80,'Force on B','scene-small'),.4)+show(text(320,315,'Each force acts on a different object.'),.7);return scene('interaction-pair','Compare the two interacting objects',b);
 }
 if(/inverse.square|1\/r²|1\/r\^2|four times the area|one quarter|one fourth/.test(s)&&/distance|intensity|gravity|gravitational|field|radiat/.test(s)){
  let b=`<circle cx="236" cy="192" r="19" class="scene-object"/>`+text(236,197,'S','scene-small');
  for(const [i,r]of [67,134].entries())b+=`<circle cx="236" cy="192" r="${r}" class="${i?'scene-secondary':'scene-primary'}" data-motion="draw" data-at="${i*.36}"/>`;
  b+=path('M236 192H370',.55,'scene-result')+show(text(304,221,'r','scene-small')+text(370,221,'2r','scene-small'),.55)+show(text(487,141,'Same source power')+text(487,194,'Area × 4')+text(487,247,'Intensity ÷ 4'),.72);
  // The shell-area picture is specifically a radiation-intensity explanation.
  if(/intensity|radiat|power/.test(s))return scene('spreading','Spread the same energy over a larger area',b);
 }
 if(/toward(?:s)? the normal|away from the normal/.test(q.answer.toLowerCase())&&/refract/.test(s)&&!(/toward(?:s)? the normal/.test(q.answer.toLowerCase())&&/away from the normal/.test(q.answer.toLowerCase()))){
  const toward=/toward(?:s)? the normal/.test(q.answer.toLowerCase());
  let b=`<rect x="42" y="207" width="556" height="149" class="scene-object"/><path d="M42 207H598M320 54V356" class="scene-axis"/>`+text(353,68,'Normal','scene-small');
  b+=path('M176 63L320 207',.05)+path(toward?'M320 207L386 342':'M320 207L527 322',.4,'scene-secondary')+show(text(173,177,'Incident ray','scene-small')+text(450,280,'Refracted ray','scene-small'),.5)+show(text(320,30,toward?'Bends toward the normal':'Bends away from the normal','scene-small'),.7);return scene('refraction','Trace the ray across the boundary',b);
 }
 if(/angle of incidence|angle of reflection|equal angles/.test(s)&&/reflect|mirror/.test(s)){
  let b=`<rect x="50" y="267" width="540" height="16" rx="4" class="scene-object"/><path d="M320 66V267" class="scene-axis"/>`+text(350,68,'Normal','scene-small');
  b+=path('M150 97L320 267',.1)+path('M320 267L490 97',.43,'scene-secondary')+path('M320 181A86 86 0 0 0 259 206',.68,'scene-result')+path('M320 181A86 86 0 0 1 381 206',.68,'scene-result')+show(text(277,155,'θᵢ','scene-label')+text(364,155,'θᵣ','scene-label')+text(320,337,'Measure both angles from the normal.'),.72);return scene('reflection','Build the equal-angle construction',b);
 }
 if(/conduction|convection|radiation/.test(s)&&/vacuum|empty space|sunlight/.test(s)){
  let b=`<circle cx="120" cy="198" r="49" class="scene-object"/><circle cx="520" cy="198" r="35" class="scene-object"/>`+text(120,279,'Sun','scene-label')+text(520,279,'Object','scene-label');
  for(let j=0;j<3;j++){const y=151+j*43,pts=Array.from({length:81},(_,i)=>[185+i*3.65,y+10*Math.sin(i*.35)]);b+=path('M'+pts.map(p=>p.join(' ')).join('L'),j*.2,'scene-result')}
  b+=show(text(320,88,'Electromagnetic waves')+text(320,330,'No material medium is required.','scene-small'),.7);return scene('radiation','Follow radiation through empty space',b);
 }
 if(/wavelength|amplitude/.test(s)&&/wave/.test(s)&&!/standing|longitudinal|interference|doppler|sound/.test(s)){
  const pts=Array.from({length:121},(_,i)=>[55+i*4.4,201-71*Math.sin(i/120*4*Math.PI)]);let b=`<path d="M44 201H599" class="scene-axis"/>`+path('M'+pts.map(a=>a.join(' ')).join('L'),.04);
  b+=path('M121 130V201M115 130H127M115 201H127',.38,'scene-secondary')+show(text(90,107,'A','scene-label'),.45)+path('M121 82H385M121 75V89M385 75V89',.6,'scene-result')+show(text(253,67,'λ','scene-label'),.7)+text(320,322,'A: from equilibrium · λ: one complete spatial cycle','scene-small');return scene('wave-measures','Separate amplitude from wavelength',b);
 }
 return null;
}
