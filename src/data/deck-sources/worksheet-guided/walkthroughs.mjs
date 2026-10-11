import {esc,diagram} from './diagrams.mjs';
import {workedModel} from './worked-models.mjs';
import {physicalModel} from './physical-models.mjs';
import {contextModel} from './context-models.mjs';
const plain=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const n=x=>x!==0&&(Math.abs(x)<.01||Math.abs(x)>=1e7)?Number(x.toPrecision(3)).toString():Number(x.toFixed(2)).toString();
const label=(x,y,t,cl='wb-label',anchor='start')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cl}">${esc(t)}</text>`;
const path=(d,cl='wb-line',motion=false)=>`<path d="${d}" class="${cl}"${motion?' data-motion="draw"':''}/>`;
const line=(x,y,X,Y,cl='wb-line',motion=false)=>path(`M${x} ${y}L${X} ${Y}`,cl,motion);
const arrow=(x,y,X,Y,cl='wb-a',motion=false)=>{if(Math.hypot(X-x,Y-y)<.1)return'';const a=Math.atan2(Y-y,X-x),l=12;return `<g>${path(`M${x} ${y}L${X} ${Y}M${X-l*Math.cos(a-.4)} ${Y-l*Math.sin(a-.4)}L${X} ${Y}L${X-l*Math.cos(a+.4)} ${Y-l*Math.sin(a+.4)}`,cl,motion)}</g>`};
const svg=(body,title)=>`<svg class="walk-graphic" viewBox="0 0 690 400" role="img" aria-label="${esc(title)}">${body}</svg>`;
const step=(cue,lines,graphic,kind='constructed')=>({cue,lines,graphic,kind});
function axes(points,{equal=true,xlabel='East (m)',ylabel='North (m)',bounds}={}){
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);let loX=Math.min(0,...xs),hiX=Math.max(1,...xs),loY=Math.min(0,...ys),hiY=Math.max(1,...ys);
 if(bounds){[loX,hiX,loY,hiY]=bounds}const rangeX=hiX-loX,rangeY=hiY-loY;
 const plotHeight=equal?225:255;let scaleX=480/(rangeX||1),scaleY=plotHeight/(rangeY||1);if(equal)scaleX=scaleY=Math.min(scaleX,scaleY);
 const L=100+(480-rangeX*scaleX)/2,T=58+(plotHeight-rangeY*scaleY)/2,B=T+rangeY*scaleY,R=L+rangeX*scaleX;
 const X=x=>L+(x-loX)*scaleX,Y=y=>B-(y-loY)*scaleY;
 const tick=range=>{const raw=range/6,p=10**Math.floor(Math.log10(raw));return [1,2,5,10].find(a=>a*p>=raw)*p};let grid='';
 for(let z=Math.ceil(loX/tick(rangeX))*tick(rangeX);z<=hiX+.0001;z+=tick(rangeX))grid+=line(X(z),T-8,X(z),B+8,'wb-grid')+label(X(z),B+30,n(z),'wb-tick','middle');
 for(let z=Math.ceil(loY/tick(rangeY))*tick(rangeY);z<=hiY+.0001;z+=tick(rangeY))grid+=line(L-8,Y(z),R+8,Y(z),'wb-grid')+label(L-15,Y(z)+6,n(z),'wb-tick','end');
 grid+=arrow(L-12,Y(0),R+17,Y(0),'wb-axis')+arrow(X(0),B+12,X(0),T-20,'wb-axis');
 grid+=label(340,386,xlabel,'wb-axis-label','middle')+label(40,25,ylabel,'wb-axis-label');
 return {X,Y,grid,L,R,T,B,scaleX,scaleY};
}
export function vectorConstruction(route,{unit='m',returnLeg=false,extra='',given=[],finalCue='How does the diagonal connect to the two components?'}={}){
 const terminal=route.at(-1),dx=terminal[0]-route[0][0],dy=terminal[1]-route[0][1];
 const {X,Y,grid}=axes([...route,[0,0]],{xlabel:`East (${unit})`,ylabel:`North (${unit})`});
 const dot=`<circle cx="${X(0)}" cy="${Y(0)}" r="5" class="wb-origin"/>`;
 const make=(count,result=false,components=false,returning=false)=>{
  let s=grid+dot;
  route.slice(1,1+count).forEach((end,i)=>{const start=route[i],cl=i%2?'wb-b':'wb-a';const isNew=i===count-1&&!result&&!components;
   const body=arrow(X(start[0]),Y(start[1]),X(end[0]),Y(end[1]),cl,isNew);
   s+=i===1&&isNew?`<g data-motion="translate" data-dx="${X(0)-X(start[0])}" data-dy="${Y(0)-Y(start[1])}">${body}</g>`:body;
   s+=label(65+i*190,355,`${String.fromCharCode(65+i)}: (${n(end[0]-start[0])}, ${n(end[1]-start[1])})`,i%2?'wb-legend wb-green':'wb-legend wb-blue');
  });
  if(components)s+=line(X(0),Y(0),X(dx),Y(0),'wb-component',true)+line(X(dx),Y(0),X(dx),Y(dy),'wb-component',true);
  if(result)s+=arrow(X(0),Y(0),X(dx),Y(dy),'wb-result',!components&&!returning)+`<circle cx="${X(dx)}" cy="${Y(dy)}" r="5" class="wb-end"/>`+label(650,25,`R = (${n(dx)}, ${n(dy)}) ${unit}`,'wb-result-label','end');
  if(returning)s+=arrow(X(dx)+7,Y(dy)+7,X(0)+7,Y(0)+7,'wb-return',true);
  return svg(s,'Tip-to-tail construction using this problem’s vectors');
 };
 const a=route[1],stages=[step('Where should the first arrow start? Choose east as +x and north as +y.',given,make(0),'vector')];
 for(let i=1;i<route.length;i++){const delta=[route[i][0]-route[i-1][0],route[i][1]-route[i-1][1]];stages.push(step(i===1?'Draw the first vector. Which signs match its direction?':'Move the next arrow to the previous tip. Does moving it change its components?', [...given.slice(0,1),`${String.fromCharCode(64+i)} = (${n(delta[0])}, ${n(delta[1])}) ${unit}`,i===1?'Start at the origin.':'Keep its length and direction.'],make(i),'vector'));}
 stages.push(step('Connect the original start to the final tip. Which arrow is the resultant?', ['R = A + B'+(route.length>3?' + …':''),'Start → finish',`R = (${n(dx)}, ${n(dy)}) ${unit}`],make(route.length-1,true),'vector'));
 const xs=route.slice(1).map((p,i)=>n(p[0]-route[i][0])),ys=route.slice(1).map((p,i)=>n(p[1]-route[i][1]));
 stages.push(step('Add the horizontal changes and vertical changes separately.',[`Rₓ = ${xs.join(' + ').replaceAll('+ -','− ')} = ${n(dx)} ${unit}`,`Rᵧ = ${ys.join(' + ').replaceAll('+ -','− ')} = ${n(dy)} ${unit}`],make(route.length-1,true,true),'vector'));
 const mag=Math.hypot(dx,dy),distance=route.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-route[i][0],p[1]-route[i][1]),0);
 stages.push(step(finalCue,[`|R| = √[(${n(dx)})² + (${n(dy)})²]`,`|R| = ${n(mag)} ${unit}`,extra||`Path length = ${n(distance)} ${unit}`],make(route.length-1,true,true).replaceAll(' data-motion="draw"',''),'vector'));
 if(returnLeg)stages.push(step('What vector would bring us back to the origin?', [`Return = −R`, `Return = (${n(-dx)}, ${n(-dy)}) ${unit}`,`Length = ${n(mag)} ${unit}`],make(route.length-1,true,false,true),'vector'));
 return stages;
}
function vectorDay(day,track,q){
 if(day.unit!==1||day.day!==6)return null;
 const routes=track==='cpa'?{2:[[0,0],[3,0],[3,4]],3:[[0,0],[4,0],[4,3]],4:[[0,0],[6,0],[2,0]],5:[[0,0],[6,0],[6,8]],6:[[0,0],[5,2],[2,3]],7:[[0,0],[3,0],[3,4],[0,4]],8:[[0,0],[4,0],[4,3]],9:[[0,0],[6,0],[6,8]],10:[[0,0],[4,1],[3,4]],11:[[0,0],[6,0],[6,3],[4,3]]}:{2:[[0,0],[4,1],[3,4]],3:[[0,0],[6,2],[2,5]],4:[[0,0],[2,-5],[-4,-3]],5:[[0,0],[5*Math.sqrt(3),5],[5*Math.sqrt(3)-3,5+3*Math.sqrt(3)]],6:[[0,0],[12*Math.sin(25*Math.PI/180),12*Math.cos(25*Math.PI/180)],[12*Math.sin(25*Math.PI/180)-7,12*Math.cos(25*Math.PI/180)]],7:[[0,0],[8,0],[8,5],[6,5]],8:[[0,0],[10,0],[15,5*Math.sqrt(3)]],9:[[0,0],[6,0],[6,8]],10:[[0,0],[4,-3],[3,2]],11:[[0,0],[6,0],[0,8]]};
 if(q.number===12)return vectorLimits(track);
 const route=routes[q.number];if(!route)return null;
 const out=vectorConstruction(route,{returnLeg:track==='honors'&&[7,10].includes(q.number),extra:track==='honors'?'Use the perpendicular components of R.':'',given:q.number===2?['First vector: A','Then add B at A’s tip.']:[]});
 if(track==='honors'){
  const end=(q.number===7?route.at(-1).map(x=>-x):route.at(-1)),deg=Math.atan2(Math.abs(end[1]),Math.abs(end[0]))*180/Math.PI;
  if(Math.abs(end[0])>.0001&&Math.abs(end[1])>.0001)out.push(step('Which quadrant contains the endpoint? Use it to name the angle.',[`tan θ = ${n(Math.abs(end[1]))} / ${n(Math.abs(end[0]))}`,`θ = ${n(deg)}°`,`${n(deg)}° ${end[1]>0?'north':'south'} of ${end[0]>0?'east':'west'}`],out.at(-1).graphic.replaceAll(' data-motion="draw"',''),'vector'));
 }
 if(track==='honors'&&q.number===5)out.unshift(...componentsConstruction(6,60,{from:'west',toward:'north',unit:'m'}));
 if(track==='honors'&&q.number===6)out.unshift(...componentsConstruction(12,25,{from:'north',toward:'east',unit:'m'}));
 if(track==='honors'&&q.number===11){
  out.splice(2,0,step('Finish directly north: what must the horizontal total be?', ['Rₓ = 0','6 + Bₓ = 0 → Bₓ = −6 m'],out[1].graphic.replaceAll(' data-motion="draw"',''),'vector'),step('Use the known length of B. Which sign puts the finish north?', ['10² = (−6)² + Bᵧ²','Bᵧ = +√(100 − 36) = +8 m'],out[1].graphic.replaceAll(' data-motion="draw"',''),'vector'));
  out.push(step('Name B’s direction using its quadrant.', ['tan θ = 8 / 6','B: 53.13° north of west','R: 8 m north'],out.at(-1).graphic,'vector'));
 }
 if(track==='honors'&&q.number===8){out.splice(2,0,step('The original arrows are 60° apart. Which right triangle can we actually use?', ['Bₓ = 10 cos 60° = 5 m','Bᵧ = 10 sin 60° ≈ 8.66 m','Resolve components before finding |A + B|.'],out[1].graphic.replaceAll(' data-motion="draw"',''),'vector'));}
 if(track==='honors'&&q.number===9){
  out.push(step('Average speed uses the whole path. Average velocity uses the start-to-finish change.', ['Time = 3 + 4 = 7 s','Average speed = 14 / 7 = 2 m/s','Average velocity = (6/7, 8/7) m/s'],out.at(-1).graphic,'vector'));
  out.push(...graphConstruction({points:[[0,0],[3,6],[7,6]],xlabel:'Time (s)',ylabel:'x position (m)'}));
  out.push(...graphConstruction({points:[[0,0],[3,0],[7,8]],xlabel:'Time (s)',ylabel:'y position (m)'}));
 }
 if(track==='cpa'&&q.number===11){const shorter=vectorConstruction([[0,0],[4,0],[4,3]]);out.push({...shorter.at(-1),cue:'Compare this 7 m route with the 11 m route. Why is displacement unchanged?'});}
 if(track==='honors'&&q.number===2){out[0].graphic=diagram(q.visual);out[0].lines=['A = (4, 1) m','R = (3, 4) m','B = R − A'];out[0].cue='Use the two known vectors. What must B add horizontally and vertically?';}
 return out;
}
function vectorLimits(track){
 const a=5,b=track==='cpa'?5:3, angle=Math.acos(1/15);
 const drawing=(theta,moving=false)=>{const B=[a+b*Math.cos(theta),b*Math.sin(theta)],A=[a,0];const {X,Y,grid}=axes([[0,0],[10,5]],{xlabel:'East (m)',ylabel:'North (m)'});return svg(grid+arrow(X(0),Y(0),X(A[0]),Y(A[1]),'wb-a')+arrow(X(A[0]),Y(A[1]),X(B[0]),Y(B[1]),'wb-b',moving)+arrow(X(0),Y(0),X(B[0]),Y(B[1]),'wb-result',moving)+label(650,25,`|R| = ${n(Math.hypot(...B))} m`,'wb-result-label','end'),'Compare different directions for fixed vector lengths')};
 return [step('Keep both lengths fixed. What can change?', [`|A| = ${a} m`,`|B| = ${b} m`],drawing(Math.PI/2),'vector'),step('Point the arrows in opposite directions. What survives?', [`Smallest |R| = |${a} − ${b}| = ${a-b} m`],drawing(Math.PI,true),'vector'),step('Point both arrows the same way. Can the resultant be any longer?', [`Largest |R| = ${a} + ${b} = ${a+b} m`,`${a-b} m ≤ |R| ≤ ${a+b} m`],drawing(0,true),'vector'),step(track==='cpa'?'Try a right angle. How does the resultant compare with the limits?':'Test 6 m: which angle gives that resultant?',track==='cpa'?['|R| = √(5² + 5²) ≈ 7.07 m']:['6² = 5² + 3² + 2(5)(3)cos θ','cos θ = 1/15 → θ ≈ 86.18°','1 m and 9 m lie outside the limits.'],drawing(track==='cpa'?Math.PI/2:angle,true),'vector')];
}
export function graphConstruction(v){
 if(!v?.points?.length||v.points.length<2)return null;
 const xLabel=v.xlabel||'Time (s)',yLabel=v.ylabel||'Position (m)';
 const time=/^Time \(s\)$/.test(xLabel),velocity=/velocity|v\(m\/s\)/i.test(yLabel),position=/position/i.test(yLabel),force=/Force \(N\)/i.test(yLabel),space=/Position change \(m\)/i.test(xLabel);
 const resistance=/Current/.test(xLabel)&&/Voltage/.test(yLabel);
 if(!((time&&(velocity||position||force))||(space&&force)||resistance))return null;
 const pts=v.points,{X,Y,grid}=axes(pts,{equal:false,xlabel:xLabel,ylabel:yLabel,bounds:[v.xmin??Math.min(0,...pts.map(p=>p[0])),v.xmax??Math.max(...pts.map(p=>p[0])),v.ymin??Math.min(0,...pts.map(p=>p[1])),v.ymax??Math.max(1,...pts.map(p=>p[1]))]});
 const graph=grid+path('M'+pts.map(p=>X(p[0])+' '+Y(p[1])).join('L'),'wb-a')+pts.map(p=>'<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="4" class="wb-origin"/>').join('');
 const stages=[step('Read the axes first. What does one point tell us—and what needs two points?', [xLabel,yLabel],svg(graph,'The supplied graph, with labeled axes'),'graph')];
 for(let i=1;i<pts.length;i++){
  const [t0,y0]=pts[i-1],[t1,y1]=pts[i],dt=t1-t0;if(dt<=0)continue;const dy=y1-y0;
  if(!force){
   const tri=line(X(t0),Y(y0),X(t1),Y(y0),'wb-component',true)+line(X(t1),Y(y0),X(t1),Y(y1),'wb-result',true)+label(650,25,n(t0)+'–'+n(t1)+(resistance?' A':' s'),'wb-result-label','end');
   const run=resistance?'ΔI':'Δt',rise=velocity?'Δv':resistance?'ΔV':'Δx',runUnit=resistance?'A':'s',riseUnit=velocity?'m/s':resistance?'V':'m',symbol=velocity?'a':resistance?'R':'v',unit=velocity?'m/s²':resistance?'Ω':'m/s';
   stages.push(step('Choose two points in this interval. Calculate the signed rise and the run.',[run+' = '+n(t1)+' − '+n(t0)+' = '+n(dt)+' '+runUnit,rise+' = '+n(y1)+' − ('+n(y0)+') = '+n(dy)+' '+riseUnit],svg(graph+tri,'Rise and run on the selected graph segment'),'graph'));
   stages.push(step('Divide rise by run. What does the slope represent?', [symbol+' = '+rise+' / '+run,symbol+' = '+n(dy)+' / '+n(dt)+' = '+n(dy/dt)+' '+unit],svg(graph+tri.replaceAll(' data-motion="draw"',''),'Slope of the selected segment'),'graph'));
  }
  if(velocity||force){const area=(y0+y1)*dt/2,unit=velocity?'m':space?'J':'N·s',symbol=velocity?'Δx':space?'W':'J';const fill='<path d="M'+X(t0)+' '+Y(0)+'L'+X(t0)+' '+Y(y0)+'L'+X(t1)+' '+Y(y1)+'L'+X(t1)+' '+Y(0)+'Z" class="wb-area" data-motion="reveal"/>';
   stages.push(step('What does the signed area represent? Read the units on both axes.', [symbol+' = ½('+n(y0)+' + '+n(y1)+') × '+n(dt),symbol+' = '+n(area)+' '+unit],svg(fill+graph,velocity?'Displacement from velocity-time area':space?'Work from force-displacement area':'Impulse from force-time area'),'graph'));
  }
 }
 return stages;
}
function graphFor(day,track,q,visual){
 let v=visual;
 const prompt=plain(q.prompt),text=prompt+' '+plain(q.worked||'');
 const givens=q.variantGivens||{};
 if(givens.start!=null&&givens.end!=null&&givens.time&&/velocity|position.time/i.test(text))v={kind:'graph',points:[[0,givens.start],[givens.time,givens.end]],xlabel:'Time (s)',ylabel:'Position (m)'};
 if(givens.t0!=null&&givens.x0!=null&&givens.t1!=null&&givens.x1!=null)v={kind:'graph',points:[[givens.t0,givens.x0],[givens.t1,givens.x1]],xlabel:'Time (s)',ylabel:'Position (m)'};
 if(day.unit===1&&day.day===3){if(track==='honors'&&q.number===2)v={kind:'graph',points:[[0,1],[3,7]],xlabel:'Time (s)',ylabel:'Position (m)'};
 if(track==='cpa'&&q.number===9)v={kind:'graph',points:[[0,9],[5,3]],xlabel:'Time (s)',ylabel:'Position (m)'};}
 if(!v&&/position.time|steady velocity|straight position|velocity from/i.test(text)){
  const match=text.match(/(?:from|at)\s*([+-]?\d+(?:\.\d+)?)\s*m\s*(?:to|→)\s*([+-]?\d+(?:\.\d+)?)\s*m\s*in\s*(\d+(?:\.\d+)?)\s*s/);if(match)v={kind:'graph',points:[[0,+match[1]],[+match[3],+match[2]]],xlabel:'Time (s)',ylabel:'Position (m)'};
 }
 if(v?.kind!=='graph')return null;
 if(!v.points?.length){const pairs=[...plain(q.answer).matchAll(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/g)].map(m=>[+m[1],+m[2]]);if(pairs.length>=2&&pairs.every(([x,y])=>x>=(v.xmin??0)&&x<=v.xmax&&y>=(v.ymin??0)&&y<=v.ymax))v={...v,points:pairs};}
 return graphConstruction(v);
}
function forcesFor(day,track,q){
 const p=plain(q.prompt),a=plain(q.answer),work=plain(q.worked||''),all=q.title+' '+p+' '+work;
 if(!/force|weight|tension|friction|normal|gravity|rope|cord|lamp|bag|book|sign/i.test(p))return null;
 const N=(a.match(/(?:weight|Weight)\s*(\d+(?:\.\d+)?)\s*N/)||[])[1];
 const mass=(all.match(/(\d+(?:\.\d+)?)\s*kg\b/)||[])[1];
 const g=(all.match(/g\s*=\s*(\d+(?:\.\d+)?)/)||[])[1]||(/10 N of weight/.test(all)?10:null);
 let weight=N?+N:mass&&g?+mass*+g:null;
 if(/weight 12 N/i.test(work))weight=12;
 const hang=/hang|suspend/i.test(all)&&/rest|still|motionless|steady speed|does not accelerate/i.test(all)&&/one vertical|vertical (?:rope|cord|string)|rope|cable|cord|string/i.test(all)&&!/two |symmetric|angle|°/.test(all);
 const book=/book.*(?:rest|table)|(?:rest.*book)/i.test(all)&&!/press|hand.*down|two|partner|third.law pair/i.test(p);
 const release=/ball.*(?:upward|thrown|up after)|after.*(?:hand|throw)/i.test(p)&&/only.*(?:weight|Earth)|weight.*(?:only|down)/i.test(a)&&!/air pushes/.test(p);
 const sliding=/slides? (?:to the )?(?:right|left)|sliding box/.test(p)&&/rough|friction/i.test(p)&&/release|no hand|after release/i.test(p+' '+a);
 const falling=/falls|falling/.test(p)&&/air pushes|drag|air resistance/.test(p)&&/longer|speeding up/.test(p+' '+a);
 const incline=/block rests on a rough incline/.test(p);
 let arrows=[],object=hang?'Hanging object':book?'Book':release||falling?'Ball':sliding?'Sliding box':incline?'Block':null;
 if(!object)return null;
 if(hang)arrows=[{dx:0,dy:1,label:'Earth → object',symbol:`Fɢ${weight?' = '+n(weight)+' N':''}`},{dx:0,dy:-1,label:'Rope → object',symbol:`T${weight?' = '+n(weight)+' N':''}`}];
 if(book)arrows=[{dx:0,dy:1,label:'Earth → book',symbol:'Weight'},{dx:0,dy:-1,label:'Table → book',symbol:'Normal force'}];
 if(release)arrows=[{dx:0,dy:1,label:'Earth → ball',symbol:'Weight'}];
 if(sliding)arrows=[{dx:0,dy:1,label:'Earth → box',symbol:'Weight'},{dx:0,dy:-1,label:'Floor → box',symbol:'Normal force'},{dx:/left/.test(p)?1:-1,dy:0,label:'Floor → box',symbol:'Friction'}];
 if(falling)arrows=[{dx:0,dy:1,label:'Earth → ball',symbol:'Weight',length:125},{dx:0,dy:-1,label:'Air → ball',symbol:'Drag',length:65}];
 if(incline)arrows=[{dx:0,dy:1,label:'Earth → block',symbol:'Weight'},{dx:-.5,dy:-.866,label:'Ramp → block',symbol:'Normal',length:95},{dx:.866,dy:-.5,label:'Ramp → block',symbol:'Static friction',length:60}];
 const graphic=count=>{let s=`<circle cx="335" cy="190" r="14" class="wb-object"/>`+label(35,27,object,'wb-axis-label');
  arrows.slice(0,count).forEach((f,i)=>{const len=f.length||105,x=335+f.dx*len,y=190+f.dy*len;s+=arrow(335,190,x,y,['wb-a','wb-b','wb-result'][i%3],i===count-1)+label(x+(f.dx<0?-18:f.dx>0?18:18),y+(f.dy<0?-10:f.dy>0?22:5),f.symbol,'wb-label',f.dx<0?'end':'start');});
  s+=label(35,380,incline?'Illustrative slope; no angle was supplied.':'Only interactions acting on this object.','wb-tick');return svg(s,'Free-body diagram: '+object)};
 const stages=[step('Choose one object. What touches it? What acts without contact?', [`Object: ${object}`,'Name a source for each force.'],graphic(0),'force')];
 arrows.forEach((f,i)=>stages.push(step(`Add the force from ${f.label.split(' → ')[0]}. Which way does it act?`, [f.label,...(i===0&&weight&&mass?[`Fg = mg = ${n(+mass)} × ${n(weight/+mass)}`,`Fg = ${n(weight)} N down`]:[f.symbol])],graphic(i+1),'force')));
 const check=hang||book?'The object has no acceleration: the vertical forces balance.':release?'Upward velocity is not an upward force. The hand is no longer touching.':sliding?'After release there is no hand force. Friction opposes sliding.':falling?'The downward force is larger, so downward velocity increases.':'Normal is perpendicular to the surface. Weight stays vertical.';
 stages.push(step('What can the force sum tell us about the motion?', [...(hang?['T − Fg = 0 → T = Fg']:[]),check],graphic(arrows.length).replaceAll(' data-motion="draw"',''),'force'));return stages;
}
// These corrections follow the printed givens. The original key is retained in
// the coverage ledger for audit, never projected as a second conflicting answer.
export const answerCorrections={
 '1/cpa/3/9':'Displacement = 3 − 9 = −6 m. Velocity = −6 m / 5 s = −1.2 m/s, or 1.2 m/s left. The position-time graph is a straight line from (0, 9) to (5, 3).',
 '1/honors/7/4':'(a) a = (0 − 24) / 7.0 = −3.43 m/s². (b) Average velocity = (24 + 0) / 2 = 12 m/s; displacement = 12 × 7.0 = +84 m. (c) Acceleration opposes the positive motion, so it is negative. The car continues forward while braking, so displacement is positive.',
 '6/cpa/2/4':'Frequency = 6 cycles / 5 s = 1.2 Hz. The separately stated one-cycle time gives period 0.5 s.',
 '6/cpa/10/4':'Speed = 12 m / 5 s = 2.4 m/s. At unchanged distance, a larger time gives a smaller calculated speed.',
 '7/cpa/5/4':'Use the stated 7 s: I = 12 C / 7 s ≈ 1.71 A. The printed “12÷4” instruction conflicts with the stated time.',
 '7/honors/16/4':'Average emf magnitude = N A |ΔB| / Δt = 10 × 5 × (2 × 10⁻⁶) / 7 ≈ 1.43 × 10⁻⁵ V. This follows from the hypothetical field change and does not establish an asteroid as its cause.',
 '7/cpa/17/4':'Average speed = 4 m / 4 s = 1 m/s. Actual trial entries remain blank until measured.'
};
export const correctedAnswer=(day,track,q)=>answerCorrections[`${day.unit}/${track}/${day.day}/${q.number}`]||q.answer;
function entryCue(q,v){
 if(q.diagnostic)return q.diagnostic;
 const p=plain(q.prompt);
 if(/estimate|uncertainty|range|bounds/.test(p))return 'Which values can vary? Mark the smallest and largest possibilities before calculating.';
 if(/predict|pattern/.test(p))return 'Point to the evidence for your prediction. Which assumption lets the pattern continue?';
 if(/compare|different|same|twice|double/.test(p))return 'Which quantity changes between the two cases? Which quantities stay fixed?';
 if(/mistake|student|claims|critique|correct/.test(p))return 'Find the first step you agree with. Where does the reasoning first need to change?';
 if(v?.kind==='table')return 'Read one row aloud with its units. Which two columns should we connect?';
 if(/draw|sketch|diagram/.test(p))return 'Place the object, origin, or boundary first. What should be added next?';
 if(/measure|trial|lab|experiment/.test(p))return 'What will be measured? Keep supplied model values separate from observations.';
 if(q.frame)return plain(q.frame);
 return 'What is the problem asking us to find? Point to the information we can use.';
}
function modelStages(model,q){
 // SVG groups are cumulative across slides. Only the next construction is
 // animated; existing marks remain still when the teacher advances.
 const html=model.html;const ats=[...html.matchAll(/data-at="([\d.]+)"/g)].map(m=>+m[1]);
 const cuts=[0,.34,.67,1];return cuts.map((cut,i)=>{
  if(i===0)return step(entryCue(q),[],q.visual?diagram(q.visual):'',model.kind);
  let pic=html.replace(/(<(?:g|path|line|polyline|polygon|circle|rect|text)[^>]*data-motion="[^"]+"[^>]*)(>)/g,(all,tag,end)=>{const at=+(tag.match(/data-at="([\d.]+)"/)||[0,0])[1];if(at>cut)return tag.replace(/ data-motion="[^"]+"/,'')+' style="opacity:0"'+end;if(i&&at<=cuts[i-1])return tag.replace(/ data-motion="[^"]+"/,'')+end;return tag.replace(/ data-at="[^"]+"/,'')+end});
  return step(i===0?entryCue(q):i===3?'Use the completed model to justify the result.':'What does this added part of the model represent?',[],pic,model.kind);
 });
}
export function walkthrough(day,track,q,visual){
 const authored=vectorDay(day,track,q)||quantitativeFor(day,track,q,visual)||graphFor(day,track,q,visual)||forcesFor(day,track,q);
 if(authored)return {stages:authored,authored:true};
 const model=workedModel(day,track,q)||contextModel(q);
 if(model)return {stages:modelStages(model,q),authored:true};
 const physical=!visual?physicalModel(day,track,q):null;
 if(physical)return {stages:physical,authored:false};
 const fig=visual?diagram(visual):'';
 return {stages:[step(entryCue(q,visual),[],fig,fig?'worksheet':'open-work')],authored:false};
}

function numberlineConstruction(points,{times,unit='m'}={}){
 const lo=Math.min(...points,0),hi=Math.max(...points,1),X=x=>100+(x-lo)/(hi-lo)*480;
 const scale=()=>{let s=arrow(70,295,620,295,'wb-axis');const delta=Math.max(1,Math.ceil((hi-lo)/10));for(let x=Math.ceil(lo);x<=hi;x+=delta)s+=line(X(x),290,X(x),300,'wb-axis')+label(X(x),328,n(x),'wb-tick','middle');return s+label(340,378,`Position (${unit}); right is positive`,'wb-axis-label','middle')};
 const draw=(count,net=false)=>{let s=scale();for(let i=0;i<=count;i++){const y=100+i*58;s+=`<circle cx="${X(points[i])}" cy="${y}" r="5" class="wb-origin"/>`+label(X(points[i]),y-20,['Start','Turn','Finish'][i]||'Position','wb-label','middle');if(i>0)s+=arrow(X(points[i-1]),y,X(points[i]),y,i%2?'wb-a':'wb-b',i===count&&!net)}if(net)s+=arrow(X(points[0]),260,X(points.at(-1)),260,'wb-result',true);return svg(s,net?'Displacement compares the first and final positions':'Track the actual route on a number line')};
 let distance=0;const stages=[step('Locate the start. Which direction is positive?', [`xᵢ = ${n(points[0])} ${unit}`],draw(0),'route')];for(let i=1;i<points.length;i++){const delta=points[i]-points[i-1];distance+=Math.abs(delta);stages.push(step('Follow this leg. How much path length does it add?', [`Change = ${n(points[i])} − (${n(points[i-1])}) = ${n(delta)} ${unit}`,`Leg length = ${n(Math.abs(delta))} ${unit}`],draw(i),'route'));}stages.push(step('Now ignore the turn and compare start to finish. Why are these two totals different?', [`Distance = ${n(distance)} ${unit}`,`Δx = ${n(points.at(-1))} − (${n(points[0])})`,`Δx = ${n(points.at(-1)-points[0])} ${unit}`],draw(points.length-1,true),'route'));return stages;
}
function netForceConstruction({mass,right,left}){
 const max=Math.max(right,left,1),R=150*right/max,L=150*left/max,net=right-left;
 const drawing=phase=>svg(label(340,40,`Object: ${n(mass)} kg`,'wb-label','middle')+`<rect x="290" y="145" width="100" height="75" rx="4" class="wb-object"/>`+(phase>=1?arrow(390,170,390+R,170,'wb-a',phase===1)+label(430,140,`${n(right)} N right`,'wb-legend'):'')+(phase>=2?arrow(290,190,290-L,190,'wb-b',phase===2)+label(210,242,`${n(left)} N left`,'wb-legend','end'):'')+(phase>=3?arrow(335,305,335+Math.sign(net)*Math.min(140,Math.abs(net)/max*150),305,'wb-result',phase===3)+label(340,360,`Horizontal sum: ${n(net)} N`,'wb-result-label','middle'):'')+label(340,390,'Horizontal forces only; +x to the right','wb-tick','middle'),'Add the opposing forces before finding acceleration');
 return [step('Choose the object and positive direction. Which forces oppose each other?', [`m = ${n(mass)} kg`],drawing(0),'net-force'),step('Add the rightward interaction.', [`Fright = +${n(right)} N`],drawing(1),'net-force'),step('Add the leftward interaction with a negative sign.', [`Fleft = −${n(left)} N`],drawing(2),'net-force'),step('Add the forces before dividing by mass. Which way is the sum?', ['ΣFₓ = Fright − Fleft',`ΣFₓ = ${n(right)} − ${n(left)} = ${n(net)} N`],drawing(3),'net-force'),step('Use the net force. Does the sign describe velocity or acceleration?', ['aₓ = ΣFₓ / m',`aₓ = ${n(net)} / ${n(mass)}`,`aₓ = ${n(net/mass)} m/s²`],drawing(3).replaceAll(' data-motion="draw"',''),'net-force')];
}
function proportionalBars({before,after,labels,unit,relation,substitution,result,cue}){
 const max=Math.max(Math.abs(before),Math.abs(after),1);
 const drawing=phase=>{let s=line(85,305,625,305,'wb-axis')+label(35,30,unit,'wb-axis-label');[[before,labels[0]],[after,labels[1]]].forEach(([v,l],i)=>{const x=145+i*270,h=Math.abs(v)/max*210;s+=label(x+50,355,l,'wb-legend','middle');if(i===0||phase>=2)s+=`<rect x="${x}" y="${305-h}" width="100" height="${h}" class="${i?'wb-bar-b':'wb-bar-a'}"${i&&phase===2?' data-motion="bar" data-base="305"':''}/>`+label(x+50,280-h,`${n(v)} ${unit}`,'wb-label','middle');else s+=`<rect x="${x}" y="85" width="100" height="220" class="wb-placeholder"/>`+label(x+50,200,'?','wb-label','middle');});return svg(s,'Compare the two quantities with a shared scale')};
 return [step(cue,[],drawing(0),'comparison'),step('Use the relationship before substituting numbers.',[relation,substitution],drawing(1),'comparison'),step('Compare the sizes. Does the calculated change make sense?', [relation,result],drawing(2),'comparison')];
}
function waveConstruction(frequency,wavelength,speed,unknown='speed'){
 const drawing=stage=>{const lambda=unknown==='wavelength'&&stage<2?'λ = ?':`λ = ${n(wavelength)} m`;let s=line(60,210,640,210,'wb-axis');s+=path('M'+Array.from({length:121},(_,i)=>[65+i*4.6,210-70*Math.sin(i*Math.PI/30)].join(' ')).join('L'),'wb-a',stage===1);s+=line(134,98,410,98,'wb-component',stage===1)+line(134,88,134,108,'wb-line')+line(410,88,410,108,'wb-line')+label(272,75,lambda,'wb-result-label','middle');s+=label(340,340,unknown==='frequency'&&stage<2?'f = ?':`f = ${n(frequency)} Hz`,'wb-label','middle');return svg(s,'One wavelength spans neighboring crests, while frequency counts cycles per second')};
 const relation=unknown==='speed'?'v = fλ':unknown==='frequency'?'f = v / λ':'λ = v / f',sub=unknown==='speed'?`v = (${n(frequency)} Hz)(${n(wavelength)} m)`:unknown==='frequency'?`f = ${n(speed)} m/s / ${n(wavelength)} m`:`λ = ${n(speed)} m/s / ${n(frequency)} Hz`,result=unknown==='speed'?`v = ${n(speed)} m/s`:unknown==='frequency'?`f = ${n(frequency)} Hz`:`λ = ${n(wavelength)} m`;
 return [step('Mark one complete cycle. Which quantity tells us how often it repeats?',[],drawing(0),'wave'),step('Connect distance per cycle with cycles per second.',[relation,sub],drawing(1),'wave'),step('Check that the units match the quantity we were asked to find.',[sub,result],drawing(2),'wave')];
}
function scalarRate(distance,time,{echo=false,unit='m',unknown='speed'}={}){
 const speed=distance/time,drawing=phase=>{let s=`<rect x="80" y="175" width="52" height="45" rx="4" class="wb-object"/>`+line(590,85,590,295,'wb-line')+label(100,263,'Start','wb-legend','middle')+label(590,335,echo?'Reflector':'Finish','wb-legend','middle');s+=arrow(142,150,570,150,'wb-a',phase===1)+label(350,120,`${n(echo?distance/2:distance)} ${unit}`,'wb-label','middle');if(echo)s+=arrow(570,235,142,235,'wb-b',phase===1);s+=label(350,375,`${n(time)} s ${echo?'for the full round trip':''}`,'wb-legend','middle');return svg(s,echo?'Follow the complete out-and-back signal path':'Connect the traveled distance and elapsed time')};
 return [step(echo?'Does the measured time cover one leg or both legs?':'Which distance belongs with this elapsed time?',[],drawing(0),'travel'),step(echo?'Count both legs before dividing by the time.':'Write the rate as distance divided by elapsed time.', [`Path = ${n(distance)} ${unit}`,`v = distance / time`],drawing(1),'travel'),step('Check the units. What distance does this rate describe in one second?', [`v = ${n(distance)} / ${n(time)}`,`v = ${n(speed)} ${unit}/s`],drawing(2),'travel')];
}
function circuitConstruction(voltage,r1,r2,parallel=false){
 const R=r2?(parallel?1/(1/r1+1/r2):r1+r2):r1,I=voltage/R,I1=parallel?voltage/r1:I,I2=r2?(parallel?voltage/r2:I):0;
 const draw=phase=>{let s=path('M100 145V70H570V315H100V195','wb-line')+line(75,145,125,145,'wb-line')+line(85,195,115,195,'wb-line')+label(40,175,`${n(voltage)} V`,'wb-legend');
 const res=(x,y,r)=>`<rect x="${x-23}" y="${y-32}" width="46" height="64" class="wb-object"/>`+label(x+35,y+5,`${n(r)} Ω`,'wb-label');
 if(parallel){s+=line(340,70,340,315,'wb-line')+res(340,185,r1)+res(570,185,r2)}else{s+=res(570,145,r1);if(r2)s+=res(570,255,r2)}
 if(phase>=2)s+=arrow(185,70,265,70,'wb-result',phase===2)+label(230,43,`I = ${n(I)} A`,'wb-result-label','middle');
 if(phase>=3&&parallel)s+=arrow(340,85,340,135,'wb-b',true)+label(290,115,`${n(I1)} A`,'wb-legend','end')+arrow(570,85,570,135,'wb-b',true)+label(620,115,`${n(I2)} A`,'wb-legend');
 if(phase>=3&&!parallel)s+=label(340,380,r2?`Drops: ${n(I*r1)} V + ${n(I*r2)} V = ${n(voltage)} V`:`Resistor drop: ${n(voltage)} V`,'wb-legend','middle');
 return svg(s,parallel?'Circuit model with separate current branches':'Circuit model with one continuous current path')};
 const out=[step(parallel?'Which components share both connection points?':'Trace the closed path. Does the current have a choice of branch?', [`Supply = ${n(voltage)} V`],draw(0),'circuit'),step(parallel?'Each branch has the full supply voltage. Find its current.':'Find the resistance along this single path.', parallel?[`I₁ = ${n(voltage)} / ${n(r1)} = ${n(I1)} A`,`I₂ = ${n(voltage)} / ${n(r2)} = ${n(I2)} A`]:[`Rtotal = ${r2?n(r1)+' + '+n(r2):n(r1)} = ${n(R)} Ω`],draw(1),'circuit'),step(parallel?'At the junction, how do the branch currents relate to supply current?':'Use the full supply voltage and total resistance.',parallel?[`Itotal = I₁ + I₂`, `Itotal = ${n(I1)} + ${n(I2)} = ${n(I)} A`]:['I = V / Rtotal',`I = ${n(voltage)} / ${n(R)} = ${n(I)} A`],draw(2),'circuit'),step(parallel?'Check current conservation at both junctions.':'Check that the voltage drops add back to the supply.',parallel?[`Req = V / Itotal = ${n(R)} Ω`]:[`V₁ = I R₁ = ${n(I*r1)} V`,...(r2?[`V₂ = I R₂ = ${n(I*r2)} V`]:[])],draw(3),'circuit')];return out;
}
function quantitativeFor(day,track,q,visual){
 const p=plain(q.prompt),a=plain(q.answer),v=q.variantGivens||{},fam=q.reviewVariant?.family?.join('/')||`${day.unit}/${day.day}/${track}/${q.number}`;
 if(visual?.kind==='numberline')return numberlineConstruction(visual.points);
 if(v.start!=null&&v.turn!=null&&v.end!=null)return numberlineConstruction([v.start,v.turn,v.end]);
 if(v.ax!=null&&v.ay!=null&&v.bx!=null&&v.by!=null)return vectorConstruction([[0,0],[v.ax,v.ay],[v.ax+v.bx,v.ay+v.by]]);
 if(v.east!=null&&v.north!=null&&v.west!=null&&v.south!=null)return vectorConstruction([[0,0],[v.east,v.north],[v.east-v.west,v.north-v.south]]);
 if(v.mass&&v.right!=null&&v.left!=null)return netForceConstruction(v);
 const polar=p.match(/(\d+(?:\.\d+)?)\s*(m\/s|N|m)(?:[^.]*?)(\d+(?:\.\d+)?)°\s*(north|south|east|west) of (north|south|east|west)/i);if(polar&&!/then|second|A =|B =/.test(p))return componentsConstruction(+polar[1],+polar[3],{toward:polar[4].toLowerCase(),from:polar[5].toLowerCase(),unit:polar[2]});
 const both=p.match(/(\d+(?:\.\d+)?)\s*kg[\s\S]*?(\d+(?:\.\d+)?)\s*N\s*right[\s\S]*?(\d+(?:\.\d+)?)\s*N\s*left/);if(both&&!/unknown/.test(p))return netForceConstruction({mass:+both[1],right:+both[2],left:+both[3]});
 if(v.initial!=null&&v.final!=null&&(v.time||v.changeTime)&&/velocity|speed|acceleration|m\/s/i.test(p)&&!/^3\//.test(fam)){
 const time=v.time||v.changeTime;return graphConstruction({points:[[0,v.initial],[time,v.final]],xlabel:'Time (s)',ylabel:'Velocity (m/s)'});}
 if(fam==='1/7/honors/4'&&!q.reviewVariant)return graphConstruction({points:[[0,24],[7,0]],xlabel:'Time (s)',ylabel:'Velocity (m/s)'});
 if(v.mass&&v.acceleration&&v.newMass){const F=v.mass*v.acceleration;return proportionalBars({before:v.acceleration,after:F/v.newMass,labels:[`${n(v.mass)} kg`,`${n(v.newMass)} kg`],unit:'m/s²',relation:'Fnet = ma; a₂ = Fnet / m₂',substitution:`Fnet = ${n(v.mass)} × ${n(v.acceleration)} = ${n(F)} N`,result:`a₂ = ${n(F)} / ${n(v.newMass)} = ${n(F/v.newMass)} m/s²`,cue:'The net force stays fixed. What should a larger mass do to acceleration?'});}
 if(v.oldForce&&v.oldAcceleration&&v.newForce){const mass=v.oldForce/v.oldAcceleration;return proportionalBars({before:v.oldAcceleration,after:v.newForce/mass,labels:[`${n(v.oldForce)} N`,`${n(v.newForce)} N`],unit:'m/s²',relation:'a = Fnet / m',substitution:`m = ${n(v.oldForce)} / ${n(v.oldAcceleration)} = ${n(mass)} kg`,result:`a₂ = ${n(v.newForce)} / ${n(mass)} = ${n(v.newForce/mass)} m/s²`,cue:'At fixed mass, should force and acceleration change by the same factor?'});}
 if(v.frequency&&v.wavelength)return waveConstruction(v.frequency,v.wavelength,v.frequency*v.wavelength);
 if(/^6\//.test(fam)&&v.distance&&v.time&&v.frequency)return waveConstruction(v.frequency,v.distance/v.time/v.frequency,v.distance/v.time,'wavelength');
 const wave=p.match(/(?:f\s*=|frequency\s+)(\d+(?:\.\d+)?)\s*Hz.*?(?:λ\s*=|wavelength\s+)(\d+(?:\.\d+)?)\s*m/);if(wave)return waveConstruction(+wave[1],+wave[2],+wave[1]*+wave[2]);
 if(v.distance&&v.time&&/speed|pulse|travel/.test(p)&&!/offset/.test(p))return scalarRate(v.distance,v.time);
 const travel=p.match(/(?:travels|moves|pulse travels)\s+(\d+(?:\.\d+)?)\s*m\s*in\s*(\d+(?:\.\d+)?)\s*s/);if(travel&&!/right|left|west|east|then|displacement/.test(p))return scalarRate(+travel[1],+travel[2]);
 if(day.unit===7&&[6,7,8,18].includes(day.day)&&q.number===4&&!q.reviewVariant){if(day.day===6)return track==='cpa'?circuitConstruction(6,3):circuitConstruction(12,30);if(day.day===7)return track==='cpa'?circuitConstruction(6,2,4):circuitConstruction(12,10,20);if(day.day===8)return track==='cpa'?circuitConstruction(6,3,6,true):circuitConstruction(12,6,12,true);if(day.day===18&&track==='cpa')return circuitConstruction(6,3,6,true);}
 if(v.input&&v.useful)return proportionalBars({before:v.input,after:v.useful,labels:['Input','Useful output'],unit:'J',relation:'Efficiency = useful / input',substitution:`η = ${n(v.useful)} / ${n(v.input)}`,result:`η = ${n(v.useful/v.input*100)}%; other transfers = ${n(v.input-v.useful)} J`,cue:'Where does the input energy go? The useful output is only one part.'});
 if(v.total!=null&&v.potential!=null&&/^4\/10\//.test(fam))return proportionalBars({before:v.total,after:v.total-v.potential,labels:['Total','Kinetic'],unit:'J',relation:'E = K + U',substitution:`K = ${n(v.total)} − ${n(v.potential)}`,result:`K = ${n(v.total-v.potential)} J`,cue:'What part of the total energy is already accounted for as potential energy?'});
 return null;
}
function componentsConstruction(magnitude,angle,{from='east',toward='north',unit='m/s'}={}){
 const r=angle*Math.PI/180,north=from==='north'||from==='south',sx=(from==='west'||toward==='west')?-1:1,sy=(from==='south'||toward==='south')?-1:1;
 const x=magnitude*(north?Math.sin(r):Math.cos(r))*sx,y=magnitude*(north?Math.cos(r):Math.sin(r))*sy;
 const {X,Y,grid}=axes([[0,0],[x,y]],{xlabel:`x (${unit})`,ylabel:`y (${unit})`});
 const image=phase=>{let s=grid+arrow(X(0),Y(0),X(x),Y(y),'wb-a')+label(655,26,`${n(magnitude)} ${unit}; ${n(angle)}° ${toward} of ${from}`,'wb-legend','end');
 if(phase>=1)s+=line(X(0),Y(0),X(x),Y(0),'wb-component',phase===1)+line(X(x),Y(0),X(x),Y(y),'wb-component',phase===1);
 if(phase>=2)s+=label(80,352,`x = ${n(x)} ${unit}`,'wb-legend wb-blue')+label(390,352,`y = ${n(y)} ${unit}`,'wb-legend wb-green');return svg(s,'Resolve the stated vector into signed perpendicular components')};
 return [step(`The angle starts from ${from}. Which component is adjacent to it?`,[`Magnitude = ${n(magnitude)} ${unit}`,`Angle = ${n(angle)}° ${toward} of ${from}`],image(0),'components'),step('Make the right triangle. Name adjacent and opposite before choosing sine or cosine.', [`${north?'y':'x'} component: adjacent → cosine`,`${north?'x':'y'} component: opposite → sine`,`${sx<0?'West gives negative x.':'East gives positive x.'} ${sy<0?'South gives negative y.':'North gives positive y.'}`],image(1),'components'),step('Substitute the same angle in both expressions. Keep the direction signs.', [`x = ${sx<0?'−':''}${n(magnitude)} ${north?'sin':'cos'} ${n(angle)}° = ${n(x)} ${unit}`,`y = ${sy<0?'−':''}${n(magnitude)} ${north?'cos':'sin'} ${n(angle)}° = ${n(y)} ${unit}`],image(2),'components'),step('Recombine the components. Does their magnitude match the original vector?', [`√[(${n(x)})² + (${n(y)})²] ≈ ${n(magnitude)} ${unit}`],image(2),'components')];
}
