import {diagram,esc} from './diagrams.mjs';
export const plain=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const words=(s,width=42)=>{const lines=[];let line='';for(const w of plain(s).split(' ')){if(line.length+w.length>width&&line){lines.push(line);line=''}line+=(line?' ':'')+w}if(line)lines.push(line);return lines};
const txt=(x,y,s,cls='scene-label',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;
const path=(d,cls='scene-ink',step=0)=>`<path d="${d}" class="${cls}" data-motion="draw" data-at="${step}"/>`;
const arrow=(x,y,X,Y,cls='scene-primary',step=0)=>{const a=Math.atan2(Y-y,X-x);return path(`M${x} ${y}L${X} ${Y}`,cls,step)+`<path d="M${X-12*Math.cos(a-.45)} ${Y-12*Math.sin(a-.45)}L${X} ${Y}L${X-12*Math.cos(a+.45)} ${Y-12*Math.sin(a+.45)}" class="${cls}" data-motion="reveal" data-at="${Math.min(.76,step+.12)}"/>`};
const wrap=(body,label)=>`<svg class="solution-scene" viewBox="0 0 640 410" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${body}</svg>`;
const num=n=>+Number(n).toPrecision(4);
function axes(v,vector=false){
 const {xmin=0,xmax,ymin=0,ymax}=v;
 const scale=Math.min(490/(xmax-xmin),275/(ymax-ymin));
 const left=vector?320-(xmax-xmin)*scale/2:82,right=vector?320+(xmax-xmin)*scale/2:574;
 const top=vector?185-(ymax-ymin)*scale/2:53,bottom=vector?185+(ymax-ymin)*scale/2:326;
 const X=x=>left+(x-xmin)/(xmax-xmin)*(right-left),Y=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top);
 let s='';if(vector){const tick=Math.max(1,Math.ceil(Math.max(xmax-xmin,ymax-ymin)/10));for(let x=Math.ceil(xmin/tick)*tick;x<=xmax;x+=tick)s+=`<path d="M${X(x)} ${top}V${bottom}" class="scene-grid"/>`+txt(X(x),bottom+24,num(x),'scene-small','middle');for(let y=Math.ceil(ymin/tick)*tick;y<=ymax;y+=tick)s+=`<path d="M${left} ${Y(y)}H${right}" class="scene-grid"/>`+txt(left-12,Y(y)+5,num(y),'scene-small','end');}else for(let i=0;i<=5;i++){const x=left+(right-left)*i/5,y=bottom-(bottom-top)*i/5;s+=`<path d="M${x} ${top}V${bottom}M${left} ${y}H${right}" class="scene-grid"/>`;if(!vector)s+=txt(x,bottom+26,num(xmin+(xmax-xmin)*i/5),'scene-small','middle')+txt(left-13,y+5,num(ymin+(ymax-ymin)*i/5),'scene-small','end')}
 s+=`<path d="M${left} ${top}V${bottom}H${right}" class="scene-axis"/>`;
 if(ymin<0&&ymax>0)s+=`<path d="M${left} ${Y(0)}H${right}" class="scene-axis"/>`;
 if(xmin<0&&xmax>0)s+=`<path d="M${X(0)} ${top}V${bottom}" class="scene-axis"/>`;
 s+=txt(82,28,v.ylabel||(vector?'North / +y':'Quantity'),'scene-small')+txt(320,391,v.xlabel||(vector?'East / +x · equal scale on both axes':'Time'),'scene-small','middle');
 return {s,X,Y,left,right,top,bottom};
}
export function graphScene(v,answer){
 let pts=v.points; if(!pts?.length)pts=[...plain(answer).matchAll(/\((-?\d+(?:\.\d+)?)(?:\s*[a-z/]+)?,\s*(-?\d+(?:\.\d+)?)(?:\s*[a-z/]+)?\)/gi)].map(m=>[+m[1],+m[2]]);
 if(!pts?.length||pts.some(([x,y])=>x<(v.xmin??0)||x>v.xmax||y<(v.ymin??0)||y>v.ymax))return null;
 const a=axes(v),{X,Y}=a;let s=a.s;
 for(let i=1;i<pts.length;i++){
  const [x,y]=pts[i-1],[xx,yy]=pts[i],step=(i-1)/Math.max(1,pts.length-1)*.68;
  if(/\barea\b|work|impulse|displacement/i.test(answer)&&/force|velocity/i.test(v.ylabel||''))s+=`<path d="M${X(x)} ${Y(0)}L${X(x)} ${Y(y)}L${X(xx)} ${Y(yy)}L${X(xx)} ${Y(0)}Z" class="scene-area" data-motion="reveal" data-at="${step+.16}"/>`;
  s+=path(`M${X(x)} ${Y(y)}L${X(xx)} ${Y(yy)}`,'scene-primary',step);
  if(/slope|rise|run/i.test(answer)&&pts.length===2)s+=path(`M${X(x)} ${Y(y)}H${X(xx)}V${Y(yy)}`,'scene-secondary dashed',.55)+txt((X(x)+X(xx))/2,Y(y)+24,`Δx = ${num(xx-x)}`,'scene-small','middle')+txt(X(xx)+12,(Y(y)+Y(yy))/2,`Δy = ${num(yy-y)}`,'scene-small');
 }
 pts.forEach(([x,y],i)=>{s+=`<circle cx="${X(x)}" cy="${Y(y)}" r="6" class="scene-dot" data-motion="reveal" data-at="${i/pts.length*.7}"/>`});
 return wrap(s,'Worksheet data traced in order; coordinates and scales follow the worksheet');
}
export function vectorScene(v){
 const {s:base,X,Y}=axes(v,true);let s=base;
 const list=v.arrows||[],routes=list.filter(a=>a[4]!=='R'),result=list.find(a=>a[4]==='R');
 routes.forEach(([x,y,xx,yy,label],i)=>{
  const move=i>0,dx=X(0)-X(x),dy=Y(0)-Y(y);
  s+=`<g${move?` data-motion="translate" data-dx="${dx}" data-dy="${dy}" data-at="${.15+i*.11}"`:''}>${arrow(X(x),Y(y),X(xx),Y(yy),i%2?'scene-secondary':'scene-primary',i*.11)}${txt((X(x)+X(xx))/2+10,(Y(y)+Y(yy))/2-13,label,'scene-label')}</g>`;
 });
 if(result){const [x,y,xx,yy]=result;s+=arrow(X(x),Y(y),X(xx),Y(yy),'scene-result',.74)+`<g data-motion="reveal" data-at=".8">${txt(320,365,`Resultant R = (${num(xx)}, ${num(yy)})`,'scene-small','middle')}</g>`}
 s+=`<circle cx="${X(0)}" cy="${Y(0)}" r="5" class="scene-dot"/>`;
 return wrap(s,'Move vectors tip to tail without changing length or direction, then draw the resultant');
}
function numberlineScene(v){
 const X=x=>60+(x-v.lo)/(v.hi-v.lo)*520;let s=txt(40,32,'FOLLOW THE ROUTE','scene-small')+`<path d="M60 307H580" class="scene-axis"/>`;
 for(let i=0;i<=5;i++){const x=60+i*104;s+=`<path d="M${x} 300V315" class="scene-axis"/>`+txt(x,340,num(v.lo+(v.hi-v.lo)*i/5),'scene-small','middle')}
 v.points.forEach((x,i)=>{const y=100+i*54;s+=`<circle cx="${X(x)}" cy="${y}" r="8" class="scene-dot" data-motion="reveal" data-at="${i*.15}"/>`+txt(X(x),y-19,v.labels?.[i]||['Start','Turn','Finish'][i]||'Position','scene-small','middle');if(i<v.points.length-1)s+=arrow(X(x),y+15,X(v.points[i+1]),y+15,'scene-primary',i*.2)});
 s+=arrow(X(v.points[0]),273,X(v.points.at(-1)),273,'scene-result',.7)+txt(320,390,v.xlabel||'Position · right is positive','scene-small','middle');
 return wrap(s,'Travel each leg, then compare the start-to-finish displacement');
}
function barsScene(v){
 const max=Math.max(1,...v.values.map(Math.abs)),w=500/v.values.length;let s=txt(44,30,'COMPARE ON THE SAME SCALE','scene-small');
 v.values.forEach((val,i)=>{const h=Math.abs(val)/max*220,x=70+i*w,y=val>=0?300-h:300;s+=`<rect x="${x}" y="${y}" width="${w-28}" height="${h}" rx="7" class="${i%2?'scene-bar-secondary':'scene-bar'}" data-motion="bar" data-at="${i*.16}" data-base="300"/>`+`<g data-motion="reveal" data-at="${.3+i*.16}">${txt(x+(w-28)/2,y-16,`${val} ${v.unit||''}`,'scene-label','middle')}</g>`;words(v.labels[i],18).slice(0,2).forEach((l,j)=>s+=txt(x+(w-28)/2,337+j*22,l,'scene-small','middle'))});
 return wrap(s,'Build each bar from the baseline using the worksheet quantities');
}
function forceScene(v){
 if(v.blank)return null;const dirs={right:[1,0],left:[-1,0],up:[0,-1],down:[0,1]},vals=Object.keys(dirs).filter(d=>typeof v[d]==='number'),max=Math.max(1,...vals.map(d=>v[d]));if(!vals.length)return null;
 let s=`<rect x="284" y="164" width="72" height="72" rx="16" class="scene-object"/>`+txt(320,206,'object','scene-small','middle');
 vals.forEach((d,i)=>{const [dx,dy]=dirs[d],n=v[d],len=140*n/max;if(n)s+=arrow(320,200,320+dx*len,200+dy*len,i%2?'scene-secondary':'scene-primary',i*.14)+txt(320+dx*(len+26),200+dy*(len+26)+5,`${n} N`,'scene-small',dx<0?'end':dx?'start':'middle')});
 const fx=(v.right||0)-(v.left||0),fy=(v.up||0)-(v.down||0);if(fx||fy){const scale=110/Math.max(Math.abs(fx),Math.abs(fy));s+=arrow(320,200,320+fx*scale,200-fy*scale,'scene-result',.72)}
 s+=txt(320,380,'Combine signed components for the net force','scene-small','middle');return wrap(s,'Applied forces followed by their vector sum');
}
function equationBoard(text){
 // Every symbol and value comes from the reviewed answer; no calculation is guessed.
 const t=plain(text),pieces=t.split(/(?<=[.;])\s+/),eq=pieces.find(x=>x.includes('=')&&x.length<230);
 if(!eq)return null;
 const terms=eq.replace(/[.]$/,'').split(/\s*=\s*/).filter(Boolean);if(terms.length<2||terms.length>6||terms.some(t=>t.length>95))return null;
 const items=terms.length>4?[terms[0],terms.slice(1,-1).join(' = '),terms.at(-1)]:terms;
 const row=Math.min(99,330/items.length);let s=txt(34,28,'BUILD THE CALCULATION','scene-small');
 items.forEach((term,i)=>{const y=49+i*row,lines=words(term,Math.min(43,term.length>68?43:38));s+=`<g data-motion="translate" data-dx="${i?'-24':'0'}" data-dy="0" data-at="${i*.2}"><rect x="38" y="${y}" width="564" height="${row-13}" rx="12" class="${i===items.length-1?'equation-final':'equation-card'}"/>`;lines.slice(0,3).forEach((l,j)=>s+=txt(66,y+30+j*23,l,term.length>45?'equation-small':'equation-text'));s+='</g>';if(i)s+=`<g data-motion="reveal" data-at="${i*.2}">${txt(21,y+30,'=','scene-small','middle')}</g>`});
 return wrap(s,'The exact worksheet calculation builds from the relationship to the result');
}
function reasoningBoard(text){
 const t=plain(text);const parts=t.split(/;\s+|(?<=[.!?])\s+|,\s+(?=so |because |therefore |but )/i).filter(Boolean);
 const segments=parts.length>1?parts:words(t,86);const selected=segments.slice(0,3);let s=txt(34,28,'MAKE THE REASONING VISIBLE','scene-small');
 const row=110;selected.forEach((p,i)=>{const y=52+i*row;const lines=words(p,49);s+=`<g data-motion="translate" data-dx="0" data-dy="-12" data-at="${i*.25}"><rect x="56" y="${y}" width="548" height="92" rx="12" class="equation-card"/><circle cx="57" cy="${y+23}" r="17" class="scene-dot"/>${txt(57,y+29,i+1,'reason-number','middle')}`;lines.slice(0,3).forEach((l,j)=>s+=txt(86,y+25+j*23,l,'equation-small'));s+='</g>';if(i<selected.length-1)s+=arrow(322,y+95,322,y+105,'scene-secondary',.15+i*.25)});
 return wrap(s,'Trace the connections in the worksheet explanation');
}
export function solutionScene({visual,vector,answer,current}){
 if(vector)return {kind:'tip-to-tail',title:'Construct the solution',html:vectorScene(vector)};
 if(visual?.kind==='graph'){const html=graphScene(visual,answer);if(html)return {kind:'graph',title:'Trace · measure · explain',html}}
 if(visual?.kind==='numberline')return {kind:'route',title:'Route and displacement',html:numberlineScene(visual)};
 if(visual?.kind==='bars'&&visual.values.every(n=>n>=0))return {kind:'bars',title:'Compare the quantities',html:barsScene(visual)};
 if(visual?.kind==='forces'){const html=forceScene(visual);if(html)return {kind:'forces',title:'Add the forces',html}}
 const equation=equationBoard(current);if(equation)return {kind:'calculation',title:'Connect each line',html:equation};
 // A source figure remains a scaffold for annotation, not a fabricated answer.
 if(visual){let html=diagram(visual,answer),n=0;html=html.replace(/<(path|polyline|circle|rect)([^>]*class="figure-(?:line|object)[^>]*)(\/?)>/g,(_,t,a,end)=>`<${t}${a.replace(/\/$/,'')} data-motion="draw" data-at="${Math.min(.7,n++*.035)}"/>`);html=html.replace(/<tr class="build-part"/g,()=>`<tr data-motion="reveal" data-at="${Math.min(.7,n++*.1)}" class="build-part"`);return {kind:'worksheet-model',title:'Annotate the worksheet model',html}}
 return {kind:'reasoning',title:'Connect the ideas',html:reasoningBoard(current)};
}
export function collaborationCue(q){
 const v=q.visual?.kind,t=plain(q.prompt+' '+q.answer);
 if(v==='graph'||/graph|slope|area under/i.test(t))return {predict:'Predict the shape or sign before calculating.',plan:'Point to the interval, axes and units. Which feature gives the quantity we need?',check:'Connect one feature of the graph to a line in the calculation.'};
 if(/vector|displacement|component|tip.to.tail/i.test(t))return {predict:'Sketch a direction and estimate a size first.',plan:'One person builds the diagram; the other checks the origin, directions and scale.',check:'Does the result connect the correct start and finish? Check its direction and units.'};
 if(/force|newton|friction/i.test(t))return {predict:'Name the object and predict the direction of the change.',plan:'One person names each interaction; the other checks that all arrows act on the chosen object.',check:'Use the diagram to explain the sign of the result. Which assumption matters?'};
 if(/circuit|resistor|current|voltage/i.test(t))return {predict:'Trace a complete path. Predict which quantities are shared.',plan:'One person labels nodes and branches; the other chooses the relationship and checks units.',check:'Check the result against charge conservation and the arrangement of the circuit.'};
 if(/ray|lens|reflect|refract/i.test(t))return {predict:'Sketch the path you expect before using an equation.',plan:'One person draws the reference line; the other explains each ray or angle.',check:'Point to the diagram feature that agrees with the calculated or described result.'};
 if(/energy|work|heat/i.test(t))return {predict:'Choose the system. Predict where energy enters, leaves or changes form.',plan:'One person draws the transfers; the other checks signs, units and the system boundary.',check:'Account for every transfer or change. Does the size of the answer make sense?'};
 if(/calculate|find |determine|\d.*=/i.test(t))return {predict:'Estimate a size, sign or trend before calculating.',plan:'One person proposes the relationship; the other explains why it fits these givens.',check:'Check the units and compare the result with your estimate. Explain any difference.'};
 return {predict:'Make a claim before comparing answers.',plan:'One person proposes an explanation; the other asks for evidence from the problem.',check:'Which evidence supports the claim? Revise one sentence to make that link clear.'};
}
