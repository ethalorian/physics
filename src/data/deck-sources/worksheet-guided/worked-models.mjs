import {esc} from './diagrams.mjs';
// Authored constructions for the worksheet examples. Values below are checked
// against the source during the build; qualitative diagrams carry no invented data.
const t=(x,y,s,cls='scene-label',a='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${a}">${esc(s)}</text>`;
const p=(d,at=0,cls='scene-primary')=>`<path d="${d}" class="${cls}" data-motion="draw" data-at="${at}"/>`;
const a=(x,y,X,Y,at=0,cls='scene-primary')=>{const z=Math.atan2(Y-y,X-x);return p(`M${x} ${y}L${X} ${Y}`,at,cls)+`<path d="M${X-11*Math.cos(z-.4)} ${Y-11*Math.sin(z-.4)}L${X} ${Y}L${X-11*Math.cos(z+.4)} ${Y-11*Math.sin(z+.4)}" class="${cls}" data-motion="reveal" data-at="${Math.min(.76,at+.12)}"/>`};
const reveal=(s,at)=>`<g data-motion="reveal" data-at="${at}">${s}</g>`;
const svg=(body,alt)=>`<svg class="solution-scene" viewBox="0 0 640 410" role="img" aria-label="${esc(alt)}"><title>${esc(alt)}</title>${body}</svg>`;
const result=(kind,title,body)=>({kind,title,html:svg(body,title)});
const circle=(x,y,r,cls='scene-dot')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${cls}"/>`;
export function circuitModel({parallel=true,voltage=null,resistors=null}){
 const top=85,bottom=305,left=95,xs=parallel?[325,520]:[300,520];
 let s=t(34,30,parallel?'SHARED NODES · BRANCH CURRENTS':'ONE LOOP · SAME CURRENT','scene-small');
 s+=`<path d="M95 85V172M95 219V305M73 176H117M82 215H108" class="scene-axis"/>`+t(51,177,'+','scene-small')+t(53,221,'−','scene-small');
 s+=p('M95 85H520',0)+p('M520 305H95',.56);
 if(parallel){xs.forEach((x,i)=>{s+=p(`M${x} 85V168M${x} 228V305`,.12+i*.22,i?'scene-secondary':'scene-primary')+`<rect x="${x-18}" y="168" width="36" height="60" rx="4" class="scene-object"/>`+circle(x,85,5)+circle(x,305,5)+t(x+27,205,resistors?`${resistors[i]} Ω`:`R${i+1}`,'scene-small');s+=a(x-38,124,x-38,166,.2+i*.24,i?'scene-secondary':'scene-primary');if(resistors&&voltage)s+=reveal(t(x-15,349,`${+(voltage/resistors[i]).toPrecision(3)} A`, 'scene-label','middle'),.45+i*.22)});s+=reveal(t(250,65,voltage&&resistors?`I total = ${+(resistors.reduce((sum,r)=>sum+voltage/r,0)).toPrecision(3)} A`:'Current splits here','scene-small'),.72)}
 else {s+=p('M520 85V305',.3);s+=`<rect x="242" y="69" width="92" height="32" rx="4" class="scene-object"/><rect x="242" y="289" width="92" height="32" rx="4" class="scene-object"/>`;s+=t(288,53,resistors?`${resistors[0]} Ω`:'R1','scene-small','middle')+t(288,354,resistors?`${resistors[1]} Ω`:'R2','scene-small','middle');s+=a(405,120,472,120,.15)+a(472,270,405,270,.6);if(voltage&&resistors)s+=reveal(t(320,208,`I = ${+(voltage/(resistors[0]+resistors[1])).toPrecision(3)} A`,'scene-label','middle'),.7)}
 s+=t(36,258,voltage?`${voltage} V`:'supply','scene-small');s+=t(320,393,parallel?'Trace each complete path back to the supply.':'Charge does not disappear at a resistor.','scene-small','middle');
 return result('circuit',parallel?'Build the parallel circuit':'Trace the series circuit',s);
}
export function lensModel(mode='pair',f=100,object=300){
 let s=t(34,28,'THIN-LENS RAY CONSTRUCTION','scene-small');
 if(mode==='pair'){
  for(const [i,div]of [false,true].entries()){
   const x=170+i*305,y=200,F=90;s+=`<path d="M${x-132} ${y}H${x+132}" class="scene-axis"/><path d="M${x} 90Q${x+(div?-19:32)} 200 ${x} 310Q${x+(div?19:-32)} 200 ${x} 90Z" class="scene-object"/>`+t(x,350,div?'Diverging':'Converging','scene-label','middle');
   for(const dy of [-44,44]){s+=a(x-120,y+dy,x-10,y+dy,.05);s+=p(`M${x} ${y+dy}L${x+130} ${div?y+dy*(1+130/F):y+dy*(1-130/F)}`,.35,div?'scene-secondary':'scene-primary');if(div)s+=p(`M${x} ${y+dy}L${x-F} ${y}`,.68,'scene-secondary dashed')}
   s+=circle(x+(div?-F:F),y,4)+t(x+(div?-F:F),y+25,'F','scene-small','middle');
  }
 }else{
  const lens=355,axis=215,scale=1,di=f*object/(object-f),ox=lens-object,oh=80,ix=lens+di,ih=-oh*di/object;
  s+=`<path d="M30 ${axis}H615" class="scene-axis"/><path d="M355 66Q398 215 355 342Q312 215 355 66Z" class="scene-object"/>`;
  for(const x of [lens-f,lens+f])s+=circle(x,axis,4)+t(x,axis+25,'F','scene-small','middle');
  s+=a(ox,axis,ox,axis-oh,0)+t(ox,axis+49,'Object','scene-small','middle');
  s+=p(`M${ox} ${axis-oh}H${lens}`,0)+p(`M${lens} ${axis-oh}L${Math.min(610,ix>lens?ix:420)} ${axis-oh+(Math.min(610,ix>lens?ix:610)-lens)*oh/f}`,.27);
  const end=ix>lens?ix:420;s+=p(`M${ox} ${axis-oh}L${end} ${axis+(end-lens)*oh/object}`,.45,'scene-secondary');
  if(di<0)s+=p(`M${lens} ${axis-oh}L${ix} ${axis-ih}`,.65,'scene-primary dashed')+p(`M${lens} ${axis}L${ix} ${axis-ih}`,.65,'scene-secondary dashed');
  s+=a(ix,axis,ix,axis-ih,.77,'scene-result')+reveal(t(ix,axis-ih+(ih<0?25:-13),di<0?'Virtual image':'Real image','scene-small','middle'),.77);
  s+=t(320,390,di<0?'Back extensions meet on the object side.':'Real rays intersect: the image is inverted.','scene-small','middle');
 }
 return result('lens','Draw rays, then locate the image',s);
}
function projectileModel(height,velocity,time){
 const range=velocity*time,X=x=>130+430*x/range,Y=drop=>93+228*drop/height;let s=`<path d="M53 93H130V321H589" class="scene-axis"/><rect x="54" y="95" width="74" height="226" class="scene-object"/>`;
 s+=a(78,108,78,305,0,'scene-secondary')+t(44,355,`${height} m drop`,'scene-small');
 const pts=Array.from({length:51},(_,i)=>{const u=i/50;return[X(range*u),Y(height*u*u)]});s+=p('M'+pts.map(a=>a.join(' ')).join('L'),.24);
 s+=a(130,65,230,65,0)+t(130,43,`vₓ = ${velocity} m/s`,'scene-small');
 s+=a(137,351,560,351,.68,'scene-result')+reveal(t(350,384,`Range = ${range} m`,'scene-label','middle'),.73);
 s+=reveal(t(350,133,`Time first: ${time} s`,'scene-label','middle'),.14);
 for(const [i,pt]of pts.filter((_,i)=>i%10===0).entries())s+=reveal(circle(...pt,5),.25+i*.065);
 return result('projectile','Separate vertical and horizontal motion',s);
}
function impulseModel(impulse,times){
 const fs=times.map(t=>impulse/t),max=Math.max(...fs),T=Math.max(...times),X=t=>95+t/T*465,Y=f=>310-f/max*230;
 let s=t(34,28,'SAME IMPULSE · DIFFERENT STOPPING TIME','scene-small');s+=`<path d="M95 60V310H584" class="scene-axis"/>`;
 times.forEach((duration,i)=>{s+=`<path d="M95 310H${X(duration)}V${Y(fs[i])}H95Z" class="scene-area" data-motion="reveal" data-at="${i*.4}"/>`+p(`M95 ${Y(fs[i])}H${X(duration)}V310`,.12+i*.4,i?'scene-secondary':'scene-primary')+reveal(t(X(duration),335,`${duration} s`,'scene-small','middle')+t(110,Y(fs[i])-13,`${+fs[i].toPrecision(5)} N`,'scene-small'),.18+i*.4)});
 s+=t(320,386,`Each area = ${impulse} N·s · force magnitudes shown`,'scene-small','middle');return result('impulse','Build equal-area force–time rectangles',s);
}
function thermalModel(){
 let s=t(34,28,'THREE WAYS TO TRANSFER ENERGY','scene-small');
 s+=`<rect x="36" y="105" width="166" height="41" rx="10" class="scene-object"/>`;
 for(let i=0;i<7;i++){s+=circle(53+i*21,126,5);if(i<6)s+=a(54+i*21,163,69+i*21,163,i*.07,'scene-result')}
 s+=t(39,91,'Hot','scene-small')+t(201,91,'Cool','scene-small','end')+t(119,219,'Conduction','scene-label','middle');
 s+=`<rect x="252" y="82" width="136" height="115" rx="15" class="scene-object"/>`+p('M278 172V106Q320 74 362 106V172Q320 204 278 172',.2,'scene-secondary')+a(278,154,278,115,.45,'scene-result')+a(362,120,362,165,.6,'scene-secondary')+t(320,219,'Convection','scene-label','middle');
 s+=circle(470,137,20,'scene-object')+circle(588,137,23,'scene-object');for(let i=0;i<3;i++)s+=p(`M491 ${116+i*20}Q505 ${102+i*20} 520 ${116+i*20}T548 ${116+i*20}L559 ${116+i*20}`,i*.16,'scene-result');s+=t(530,219,'Radiation','scene-label','middle');
 for(const [x,label]of [[119,'Microscopic interactions'],[320,'Bulk fluid movement'],[530,'Electromagnetic waves']])s+=reveal(t(x,272,label,'scene-small','middle'),.73);
 s+=t(320,350,'Use the mechanism to explain each example.','scene-small','middle');return result('thermal-transfer','Follow the energy transfer',s);
}
function fieldModel(){
 let s=t(34,28,'CURRENT OUT OF THE PAGE','scene-small')+circle(320,201,26,'scene-object')+circle(320,201,7);
 for(const [i,r]of [68,110,150].entries()){s+=p(`M${320+r} 201A${r} ${r} 0 1 0 ${320-r} 201A${r} ${r} 0 1 0 ${320+r} 201`,i*.18,'scene-secondary')+a(320+r,207,320+r,189,.22+i*.18,'scene-secondary')}
 s+=reveal(t(320,394,'Right-hand rule → counterclockwise field','scene-small','middle'),.72);return result('magnetic-field','Build the field around the wire',s);
}
export function workedModel(day,track,q){
 const key=`${day.unit}/${day.day}/${q.number}`;
 if(day.unit===7&&[7,8].includes(day.day)&&[2,3,4,5].includes(q.number)){
  const parallel=day.day===8;
  if(q.number===2)return circuitModel({parallel,voltage:parallel?6:12,resistors:parallel?[6,3]:[2,4]});
  if(q.number===4)return circuitModel({parallel,voltage:track==='cpa'?6:12,resistors:parallel?(track==='cpa'?[3,6]:[6,12]):(track==='cpa'?[2,4]:[10,20])});
  // The open-branch questions are explained by the worksheet scaffold itself.
  if(q.number===5)return circuitModel({parallel});
 }
 if(day.unit===6&&day.day===14&&[2,3,4,5].includes(q.number))return lensModel(q.number===3?'pair':q.number===5?'virtual':'real',q.number===5?140:100,q.number===5?60:300);
 if(key==='2/10/2')return projectileModel(20,3,2);
 if(key==='2/10/4'&&track==='honors')return projectileModel(45,15,3);
 if(key==='3/4/2')return impulseModel(8,[.2,.8]);
 if(key==='3/4/4')return track==='cpa'?impulseModel(20,[1,4]):impulseModel(1.2,[.01,.05]);
 if(day.unit===5&&day.day===3&&[2,3].includes(q.number))return thermalModel();
 if(day.unit===7&&day.day===13&&q.number===2)return fieldModel();
 return null;
}
