// Authored scientific visuals. Coordinates come from the lesson's examples;
// illustrative data are labeled. No assessment solutions are introduced.
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ink = '#4b4ba8', green = '#28755a', rust = '#b94730';
const palette = [ink, green, rust];
const text = (x,y,label,extra='') => `<text x="${x}" y="${y}" ${extra}>${esc(label)}</text>`;
const line = (x1,y1,x2,y2,extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const poly = (points,extra='') => `<polyline points="${points.map(p=>p.join(',')).join(' ')}" ${extra}/>`;
const seq = (n,fn) => Array.from({length:n+1},(_,i)=>fn(i/n));
const shell = (title,body,caption,legend='') => `<figure class="lesson-visual"><div class="visual-heading">${esc(title)}</div>${body}${legend}<figcaption>${esc(caption)}</figcaption></figure>`;
const svg = (body,label) => `<svg class="science-svg" viewBox="0 0 620 390" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${body}</svg>`;
const key = entries => `<div class="visual-key">${entries.map((e,i)=>`<span style="--series:${palette[i%3]}">${esc(e)}</span>`).join('')}</div>`;

// True numerical plots, with shared axes and units. Animation draws each series
// and moves a cursor on the actual polyline, never on a decorative trajectory.
function plot(title,series,xlabel,ylabel,caption,options={}) {
  series = Array.isArray(series[0]?.[0]) ? [{name:'Model',data:series[0]}] : series;
  const pts = series.flatMap(s=>s.data), xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  let [xmin,xmax] = options.xrange || [Math.min(0,...xs),Math.max(1,...xs)];
  let [ymin,ymax] = options.yrange || [Math.min(0,...ys),Math.max(1,...ys)];
  if(xmin===xmax)xmax=xmin+1;if(ymin===ymax)ymax=ymin+1;
  const X=x=>82+(x-xmin)/(xmax-xmin)*492, Y=y=>306-(y-ymin)/(ymax-ymin)*244;
  const fmt=n=>Math.abs(n)>=1e5? n.toExponential(1):Number(n.toFixed(2)).toString();
  let body='';
  for(const x of options.xticks||seq(4,q=>xmin+(xmax-xmin)*q)){
    body+=line(X(x),62,X(x),306,'class="v-grid"')+text(X(x),343,fmt(x),'text-anchor="middle"');
  }
  for(const y of options.yticks||seq(4,q=>ymin+(ymax-ymin)*q)){
    body+=line(82,Y(y),574,Y(y),'class="v-grid"')+text(70,Y(y)+6,fmt(y),'text-anchor="end"');
  }
  body+=line(82,Y(Math.max(ymin,Math.min(ymax,0))),574,Y(Math.max(ymin,Math.min(ymax,0))),'class="v-axis"');
  body+=line(82,62,82,306,'class="v-axis"')+text(328,375,xlabel,'text-anchor="middle" class="axis-name"')+text(16,30,ylabel,'class="axis-name"');
  if(options.band){const {low,high}=options.band;body+=`<polygon points="${[...low.map(p=>[X(p[0]),Y(p[1])]),...high.toReversed().map(p=>[X(p[0]),Y(p[1])])].map(p=>p.join(',')).join(' ')}" fill="${ink}" opacity=".11"/>`;}
  series.forEach((s,i)=>{
    const points=s.data.map(p=>[X(p[0]),Y(p[1])]),color=palette[i%3];
    if(options.area){body+=`<polygon points="${[[points[0][0],Y(0)],...points,[points.at(-1)[0],Y(0)]].map(p=>p.join(',')).join(' ')}" fill="${color}" opacity=".12"/>`;}
    body+=poly(points,`class="v-trace" fill="none" stroke="${color}" stroke-width="4" ${s.dashed?'stroke-dasharray="8 7"':''}`);
    if(!s.dashed)body+=`<circle class="v-cursor" cx="${points.at(-1)[0]}" cy="${points.at(-1)[1]}" r="7" fill="${color}" data-points="${esc(JSON.stringify(points))}" ${s.data.every((p,j)=>!j||p[0]>=s.data[j-1][0])?`data-x-range="82,574"`:''}/>`;
    if(s.data.length<=8)points.forEach(([x,y])=>body+=`<circle cx="${x}" cy="${y}" r="4.5" fill="${color}"/>`);
  });
  return shell(title,svg(body,`${title}. ${ylabel} versus ${xlabel}. ${caption}`),caption,series.length>1?key(series.map(s=>s.name)):'');
}
const graph = (title,data,xlabel,ylabel,caption,options={})=>plot(title,[{name:'Model',data}],xlabel,ylabel,caption,options);

function route(title,positions,caption,{unit='m',times,values=true,ticks}={}){
  const min=Math.min(0,...positions),max=Math.max(1,...positions),X=x=>65+(x-min)/(max-min)*490;
  let body=line(65,190,555,190,'class="v-axis"');
  for(const v of ticks||Array.from({length:6},(_,i)=>min+(max-min)*i/5)){body+=line(X(v),182,X(v),198,'class="v-axis"')+text(X(v),227,Number(v.toFixed(1)),'text-anchor="middle"');}
  body+=text(315,273,`Position (${unit}) →`,'text-anchor="middle" class="axis-name"');
  positions.forEach((x,i)=>{const yy=98+i*19;body+=line(X(x),yy,X(x),179,`stroke="${palette[i%3]}" stroke-dasharray="3 5"`)+`<circle cx="${X(x)}" cy="${yy}" r="7" fill="${palette[i%3]}"/>`+text(X(x),yy-14,times?`${times[i]} s`:`${i===0?'Start':i===positions.length-1?'Finish':'Turn'}`,'text-anchor="middle"');});
  const points=positions.map(x=>[X(x),174]);body+=poly(points,`class="v-trace" fill="none" stroke="${ink}" stroke-width="4"`)+`<image class="v-cursor v-cart" href="./art/dynamics-cart.png" x="${points.at(-1)[0]-45}" y="155" width="90" height="30" data-points="${esc(JSON.stringify(points))}"/><circle cx="${points.at(-1)[0]}" cy="190" r="3" fill="${ink}" class="v-cursor" data-points="${esc(JSON.stringify(positions.map(x=>[X(x),190])))}"/>`;
  if(values)body+=text(310,335,positions.map(p=>`${p} ${unit}`).join('  →  '),'text-anchor="middle" class="route-values"');
  return shell(title,svg(body,`${title}: ${positions.join(', ')} ${unit}. ${caption}`),caption);
}

function numberLine(title,marks,domain,caption,interval){
  const [min,max]=domain,X=x=>70+(x-min)/(max-min)*480;
  let body=line(70,200,550,200,'class="v-axis"');
  if(interval)body+=line(X(interval[0]),200,X(interval[1]),200,`class="v-trace" stroke="${ink}" stroke-width="12"`);
  for(let i=0;i<=4;i++){const x=min+(max-min)*i/4;body+=line(X(x),191,X(x),209,'class="v-axis"')+text(X(x),239,x,'text-anchor="middle"');}
  marks.forEach(([x,label],i)=>{body+=`<circle cx="${X(x)}" cy="200" r="7" fill="${palette[i%3]}"/>`+text(X(x),151,label,'text-anchor="middle"');});
  body+=text(310,291,'Position (m) →','text-anchor="middle" class="axis-name"');
  return shell(title,svg(body,`${title}. ${caption}`),caption);
}

function vectors(title,items,caption,{unit='m',axes=['+x','+y'],originLabel='0'}={}){
  const points=[[0,0],...items.flatMap(v=>[[v.sx||0,v.sy||0],[(v.sx||0)+v.x,(v.sy||0)+v.y]])];
  const xmin=Math.min(...points.map(p=>p[0])),xmax=Math.max(...points.map(p=>p[0])),ymin=Math.min(...points.map(p=>p[1])),ymax=Math.max(...points.map(p=>p[1]));
  const scale=Math.min(330/Math.max(1,xmax-xmin),218/Math.max(1,ymax-ymin));
  const X=x=>302+(x-(xmin+xmax)/2)*scale,Y=y=>193-(y-(ymin+ymax)/2)*scale;
  let body=line(55,Y(0),570,Y(0),'class="v-grid"')+line(X(0),55,X(0),320,'class="v-grid"')+text(570,Y(0)+26,axes[0],'text-anchor="end"')+text(X(0)+12,43,axes[1])+text(X(0)-12,Y(0)+26,originLabel,'text-anchor="end"');
  items.forEach((v,i)=>{
    const x1=X(v.sx||0),y1=Y(v.sy||0),x2=X((v.sx||0)+v.x),y2=Y((v.sy||0)+v.y),color=palette[i%3];
    const len=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/(len||1),uy=(y2-y1)/(len||1);
    body+=line(x1,y1,x2,y2,`class="v-trace" stroke="${color}" stroke-width="4"`);
    if(len)body+=poly([[x2-ux*13-uy*7,y2-uy*13+ux*7],[x2,y2],[x2-ux*13+uy*7,y2-uy*13-ux*7]],`fill="none" stroke="${color}" stroke-width="4"`);
    const labelX=Math.max(90,Math.min(530,x2+(v.dx||0))),labelY=Math.max(30,Math.min(345,y2+(v.dy??(v.y>=0?-16:28))));
    body+=text(labelX,labelY,v.label,`text-anchor="middle" style="fill:${color}"`);
  });
  body+=text(310,375,`Common scale • ${unit}`,'text-anchor="middle" class="axis-name"');
  return shell(title,svg(body,`${title}. ${caption}`),caption);
}

function forces(title,values,labels,caption,{qualitative=false}={}){
  const max=Math.max(1,...values),scale=108/max,cx=305,cy=196;
  let body=`<circle cx="${cx}" cy="${cy}" r="13" fill="#22233a"/>`;
  const ends=values.map((v,i)=>[cx+(i===0?1:i===1?-1:0)*v*scale,cy+(i===2?-1:i===3?1:0)*v*scale]);
  ends.forEach(([x,y],i)=>{if(!values[i])return;const dx=x-cx,dy=y-cy,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,color=palette[i<2?0:1];
    body+=line(cx,cy,x,y,`class="v-trace" stroke="${color}" stroke-width="5"`)+poly([[x-ux*13-uy*7,y-uy*13+ux*7],[x,y],[x-ux*13+uy*7,y-uy*13-ux*7]],`fill="none" stroke="${color}" stroke-width="4"`);
    const tx=i===0?x+15:i===1?x-15:x+20,ty=i<2?y-20:y+5;
    body+=text(tx,ty,labels[i],`text-anchor="${i===1?'end':'start'}"`);
    if(!qualitative)body+=text(tx,ty+25,`${values[i]} N`,`text-anchor="${i===1?'end':'start'}" class="force-value"`);
  });
  body+=text(cx,362,'Forces on one object','text-anchor="middle" class="axis-name"');
  return shell(title,svg(body,`${title}. ${values.map((v,i)=>v?`${labels[i]} ${qualitative?'':v+' N'}`:'').filter(Boolean).join('; ')}. ${caption}`),caption);
}

function steps(title,items,caption){return shell(title,`<ol class="visual-steps">${items.map(([a,b])=>`<li><strong>${esc(a)}</strong><span>${esc(b)}</span></li>`).join('')}</ol>`,caption);}

const f = (title,v,caption,labels=['Pull','Friction','Normal','Weight'],opts={})=>forces(title,v,labels,caption,opts);
const band = (title,x0,v,dx,dv,t,unit='m')=>{
  const central=[[0,x0],[t,x0+v*t]],low=[[0,x0-dx],[t,x0+v*t-dx-t*dv]],high=[[0,x0+dx],[t,x0+v*t+dx+t*dv]];
  return plot(title,[{name:'Central',data:central},{name:'Lower bound',data:low,dashed:true},{name:'Upper bound',data:high,dashed:true}], 'Time (s)',`Position (${unit})`,'The shaded region is a measurement bound, not a probability.',{band:{low,high}});
};

export { esc, shell, svg, text, line, poly, plot, graph, route, numberLine, vectors, forces, steps, f, band };

export function illustrateDeck(day,deck){
  const cover=deck[0];cover.art=[1,4,5,6,19,20,21,22].includes(day)?'space':'lab';
  cover.note+=' Cover artwork: AI-generated conceptual illustration; not an observation and not to scale.';
  const add=(title,graphic,solution=false)=>{
    const s=deck.find(s=>s.title===title&&!!s.solution===solution);if(!s)throw new Error(`Missing visual target: day ${day}, ${title}, solution=${solution}`);
    // Existing numerical diagrams stay intact; new counterparts replace only a
    // duplicate legacy plot, never text, equations, questions, or tables.
    s.body=s.body.replace(/<div class="(?:chart|vectorplot|forceplot)"[^>]*><\/div>/g,'');
    s.body=`<div class="visual-layout"><div class="visual-copy">${s.body}</div>${graphic}</div>`;s.visual=true;
    s.note+=' Visual teaching: let the finite animation finish, discuss the labeled states, then advance. Replay or scrub the visual when presenting directly. Reduced-motion and print modes show the complete static visual.';
  };
  const g=(title,data,x,y,cap,options={})=>graph(title,data,x,y,cap,options);
  switch(day){
    case 1:
      deck.find(s=>s.title==='2026-XJ: the classroom briefing').art='space';
      add('A prediction needs information',steps('What would you measure?',[['Where now?','Locate the object.'],['How is it moving?','Measure motion over time.'],['How far ahead?','Choose a prediction interval.']],'A prediction needs measurements and assumptions.'),true);
      add('Evidence, inference, and a question',steps('Read → distinguish → investigate',[['Stated','An approaching object was detected.'],['Not established','A collision with Earth.'],['Investigate','Repeated position measurements.']],'The image is artwork. The briefing is the source of the stated evidence.'));
      add('A stronger question',plot('Compare position and time',[{name:'Object A',data:[[0,0],[2,2],[4,4]]},{name:'Object B',data:[[0,3],[2,2],[4,1]]}],'Time (s)','Position (m)','Illustrative 1D case: compare position at the same time.'),true);
      add('A model makes a testable prediction',route('Equal times • equal changes',[0,1,2],'Illustrative constant motion: 1 m farther along each second.',{times:[0,1,2]}));
      add('A tiny prediction we can test',route('Observe the pattern',[2,4,6],'Only the supplied observations are shown. Predict the next position.',{times:[0,1,2]}));
      add('A tiny prediction we can test',plot('Test the prediction',[{name:'Constant-velocity model',data:[[0,2],[1,4],[2,6],[3,8]]},{name:'Challenging new reading',data:[[3,7]]}],'Time (s)','Position (m)','At 3 s: 8 m is the prediction; 7 m would challenge it.'),true);
      add('Independent application',route('Follow the direction',[10,8,6],'Positions decrease as time increases. Continue the pattern yourself.',{times:[0,1,2]}));
      add('Independent application',g('Extend the same change',[[0,10],[1,8],[2,6],[3,4],[4,2]],'Time (s)','Position (m)','The prediction assumes −2 m of position change each second.'),true);
      break;
    case 2:
      add('A return trip',route('Out and back',[0,4,0],'Trace all the travel, then compare the start and finish.'));
      add('A coordinate system makes position precise',numberLine('Location relative to the door',[[-2,'Desk'],[0,'Door: origin']],[-3,1],'The desk is left of the origin. Negative position does not specify motion.'));
      add('Worked route: out and back',route('One route, two quantities',[0,4,1],'Travel: 4 m + 3 m. Change in position: +1 m.'));
      add('Guided route',route('Sketch the supplied route',[2,6,3],'Count both legs for distance. Compare endpoints for displacement.'));
      add('Changing the positive direction',vectors('The same eastward movement',[{x:3,y:0,label:'3 m east'}],'The physical displacement stays eastward; its coordinate sign depends on the axis.'),true);
      break;
    case 3:
      add('Same trip, different rates',plot('Same endpoint, different times',[{name:'A: 6 s',data:[[0,0],[6,12]]},{name:'B: 4 s',data:[[0,0],[4,12]]}],'Time (s)','Position change (m)','A steeper position–time line represents a greater velocity.'),true);
      add('Slope connects a graph to motion',g('Read the slope',[[0,1],[2,5],[4,9]],'Time (s)','Position (m)','The object gains 4 m in each 2 s interval.'));
      add('Position is the graph’s height; velocity is its slope',plot('Same slope, different positions',[{name:'Starts at 1 m',data:[[0,1],[4,9]]},{name:'Starts at 4 m',data:[[0,4],[4,12]]}],'Time (s)','Position (m)','Parallel lines: both velocities are +2 m/s.'));
      add('A walk with a pause',g('Move • wait • return',[[0,1],[2,5],[4,5],[6,1]],'Time (s)','Position (m)','The horizontal segment means the position is unchanged.'),true);
      add('Independent graph calculation',g('A negative slope',[[2,14],[6,6],[8,2]],'Time (s)','Position (m)','The line falls because position decreases over time.'),true);
      break;
    case 4:
      add('A horizontal line can mean motion',g('Velocity stays positive',[[0,3],[4,3]],'Time (s)','Velocity (m/s)','The shaded area is (+3 m/s)(4 s) = +12 m.',{area:true}),true);
      add('Area under a velocity graph',g('Signed area gives displacement',[[0,2],[3,2],[3,-1],[5,-1]],'Time (s)','Velocity (m/s)','Above zero adds +6 m; below zero adds −2 m.',{area:true}));
      add('A velocity vector has two components',vectors('One velocity, two components',[{x:4,y:0,label:'+4 east',dy:28},{x:0,y:3,label:'+3 north'},{x:4,y:3,label:'5 m/s'}],'Both components happen at the same time.',{unit:'m/s',axes:['East','North']}));
      add('Guided components',vectors('10 m/s • 30° north of east',[{x:8.66,y:0,label:'+8.66',dy:28},{x:0,y:5,label:'+5.00'},{x:8.66,y:5,label:'10 m/s'}],'East is adjacent to the stated angle.',{unit:'m/s',axes:['East','North']}),true);
      break;
    case 5:
      add('Position includes the starting point',g('Start away from the origin',[[0,12],[4,4]],'Time (s)','Position (m)','Illustrative case: x₀ = 12 m, v = −2 m/s.'));
      add('Worked two-dimensional prediction',vectors('The endpoint is not the origin',[{sx:-120,sy:0,x:131.36,y:35.2,label:'Displacement',dy:-24},{x:11.36,y:35.2,label:'Final position',dy:28}],'Earth is fixed at (0,0) in this simplified model.',{unit:'million km'}));
      add('Guided uncertainty',band('The interval widens with time',10,2,1,.2,5),true);
      add('A measurement interval is a bound',numberLine('A bounded position',[[98,'Lower'],[100,'Central'],[102,'Upper']],[96,104],'100 ± 2 m spans 98–102 m; the full width is 4 m.',[98,102]));
      break;
    case 6:
      add('Tip-to-tail addition',vectors('Preserve length and direction',[{x:4,y:0,label:'4 m east',dy:28},{sx:4,sy:0,x:0,y:3,label:'3 m north',dx:30},{x:4,y:3,label:'Resultant',dx:-95,dy:28}],'The resultant connects the first tail to the final tip.'));
      add('Vector addition on common axes',vectors('Add matching components',[{x:6,y:2,label:'A'},{sx:6,sy:2,x:-4,y:3,label:'B',dx:35},{x:2,y:5,label:'R = (2, 5)',dx:-85}],'B is translated without rotating it.'));
      add('Decomposition from a stated angle',vectors('One pull, resolved on two axes',[{x:17.32,y:0,label:'17.3 N',dy:28},{x:0,y:10,label:'10.0 N'},{x:17.32,y:10,label:'20 N'}],'The components replace the force in a sum; they are not extra interactions.',{unit:'N'}));
      add('Guided addition',vectors('A resultant in quadrant II',[{x:3,y:-2,label:'A'},{sx:3,sy:-2,x:-7,y:5,label:'B',dx:-20},{x:-4,y:3,label:'R',dx:25,dy:26}],'The negative x component points west; positive y points north.'),true);
      break;
    case 7:
      add('Acceleration measures velocity change',g('Velocity gains 2 m/s each second',[[0,2],[1,4],[2,6],[3,8]],'Time (s)','Velocity (m/s)','A straight velocity–time line has constant acceleration.'));
      add('Signs describe directions',plot('One positive acceleration',[{name:'Starts with v > 0',data:[[0,2],[2,6]]},{name:'Starts with v < 0',data:[[0,-6],[2,-2]]}],'Time (s)','Velocity (m/s)','Both have a = +2 m/s². One speeds up while the other slows.'));
      add('The slope of a velocity–time graph',g('A reversal at t = 2 s',[[0,-4],[2,0],[4,4]],'Time (s)','Velocity (m/s)','Velocity crosses zero. Acceleration stays +2 m/s².'));
      add('Braking in the negative direction',g('Positive acceleration, falling speed',[[0,-12],[2,-4]],'Time (s)','Velocity (m/s)','The magnitude drops from 12 to 4 m/s.'),true);
      break;
    case 8:
      add('Three equations, one model',plot('Constant acceleration links the values',[{name:'v₀ = 2, a = 1',data:[[0,2],[4,6]]}],'Time (s)','Velocity (m/s)','Illustrative case: slope gives a; area gives Δx.',{area:true}));
      add('Worked braking distance',g('Stop at 5 seconds',[[0,20],[5,0]],'Time (s)','Velocity (m/s)','Triangle area = ½(5 s)(20 m/s) = 50 m.',{area:true}),true);
      add('Worked final position',g('The position curve gets steeper',seq(32,q=>{let t=q*4;return [t,-3+2*t+.5*t*t]}),'Time (s)','Position (m)','Starts at −3 m and reaches +13 m at 4 s.'),true);
      add('Vertical motion uses the same tools',g('The ball rises, stops, then falls',seq(40,q=>{let t=q*2*14/9.8;return[t,14*t-4.9*t*t]}),'Time (s)','Height above launch (m)','Ideal model: ignore air resistance. Acceleration is downward throughout.'),true);
      break;
    case 9:
      add('Newton’s first law',plot('Zero net force permits either state',[{name:'At rest',data:[[0,1],[4,1]]},{name:'Moving steadily',data:[[0,1],[4,9]]}],'Time (s)','Position (m)','Illustrative inertial-frame cases: both have a = 0.'));
      add('Inertia and mass',plot('Same 2 N force, starting from rest',[{name:'1 kg',data:[[0,0],[3,6]]},{name:'2 kg',data:[[0,0],[3,3]]}],'Time (s)','Velocity (m/s)','Twice the mass gives half the velocity change per second.'));
      add('A moving object with balanced forces',f('Horizontal forces balance',[8,8,0,0],'No horizontal acceleration; the existing motion continues.'),true);
      add('The passenger explanation',plot('A simplified braking interval',[{name:'Bus slows',data:[[0,6],[3,0]]},{name:'Body without restraining force',data:[[0,6],[3,6]]}],'Time (s)','Forward velocity (m/s)','Illustrative ideal comparison: contact forces change the passenger’s velocity.'),true);
      break;
    case 10:
      add('A force describes an interaction',steps('Agent → force → object',[['Earth on cart','Gravity points toward Earth.'],['Track on cart','Normal force acts perpendicular to the track.'],['Rope on cart','Tension acts along a taut rope.']],'Every force needs a physical source.'));
      add('Mass and weight',g('Same g, different masses',[[0,0],[1,9.8],[2,19.6],[5,49]],'Mass (kg)','Weight (N)','Near Earth’s surface: slope = g = 9.8 N/kg.'));
      add('Book on a table',f('Choose the book',[0,0,1,1],'Equal arrow lengths here indicate balance; magnitudes were not supplied.',['Right','Left','Table','Earth'],{qualitative:true}),true);
      add('A hanging object',f('Forces on the hanging mass',[0,0,19.6,19.6],'Rest requires zero net force.',['Right','Left','Rope','Earth']),true);
      add('A moving object after release',f('After the hand loses contact',[0,0,0,1],'Only weight acts in this ideal model. Motion can still be upward.',['Right','Left','Up','Earth'],{qualitative:true}),true);
      break;
    case 11:
      add('Same driving force, different mass',plot('One force, two inertias',[{name:'M = 0.5 kg',data:[[0,0],[1,.98]]},{name:'M = 1.0 kg',data:[[0,0],[1,.49]]}],'Time (s)','Velocity (m/s)','Ideal example: net driving force is 0.49 N for both.'),true);
      add('The system includes the hanging mass',steps('Keep the full system in view',[['Moving mass M','Cart + added masses + hanger'],['External drive','Hanger’s weight, mₕg'],['Internal interaction','String tension between the parts']],'Resistance is subtracted from the driving weight.'));
      add('Online alternative: ideal model data',g('More mass, less acceleration',seq(30,q=>{const m=.5+q;return[m,.49/m]}),'Total mass M (kg)','Acceleration (m/s²)','Calculated ideal values: a = 0.49 N / M.',{xrange:[.5,1.5]}));
      add('The linearized relationship',g('A straight line using reciprocal mass',[[.667,.327],[1,.49],[1.333,.653],[2,.98]],'1/M (kg⁻¹)','Acceleration (m/s²)','Slope ≈ 0.49 N, the model’s net driving force.'));
      add('From a velocity graph to acceleration',g('Measure the velocity slope',[[.2,.1],[.8,.4]],'Time (s)','Velocity (m/s)','Δv = 0.30 m/s over Δt = 0.60 s.'),true);
      break;
    case 12:
      add('Transfer mass from cart to hanger',steps('Redistribute the same mass',[['Before','More added mass rides on the cart.'],['Transfer','Move a small mass onto the hanger.'],['After','M stays fixed; driving weight increases.']],'Adding mass from outside would change two variables.'));
      add('Acceleration versus net force',g('At fixed mass, a grows with F',[[0,0],[.245,.245],[.49,.49],[.735,.735],[.98,.98]],'Net force (N)','Acceleration (m/s²)','Ideal model with M = 1.00 kg.'));
      add('Reading a slope as mass',g('Slope = 1/M',[[0,0],[1,2],[2,4]],'Net force (N)','Acceleration (m/s²)','A slope of 2.0 (m/s²)/N corresponds to 0.50 kg.'),true);
      add('Force and mass both change',plot('Compare the acceleration slopes',[{name:'A: 2 N / 1 kg',data:[[0,0],[2,4]]},{name:'B: 6 N / 2 kg',data:[[0,0],[2,6]]}],'Time (s)','Velocity change (m/s)','Over the same time, B gains velocity 1.5 times as quickly.'),true);
      break;
    case 13:
      add('What does F mean?',f('Use the net horizontal force',[20,5,0,0],'20 N − 5 N = 15 N right. Divide by 5 kg.'),true);
      add('A signed force sum',vectors('Opposing forces on a common axis',[{x:30,y:0,label:'+30 N',dy:-24},{x:-10,y:0,label:'−10 N',dy:30}],'Illustrative horizontal force sum: +20 N.',{unit:'N'}));
      add('Four forces on one box',f('Resolve each axis separately',[30,10,49,49],'Vertical balance; horizontal net force = +20 N.'));
      add('Solving for a missing applied force',f('A net 8 N gives 2 m/s²',[14,6,0,0],'The applied force must also overcome 6 N of friction.'),true);
      add('Braking force from motion data',g('The slope gives acceleration',[[0,30],[5,0]],'Time (s)','Velocity (m/s)','a = −6 m/s²; multiplying by 1,500 kg gives −9,000 N.'),true);
      break;
    case 14:
      add('One interaction, two force statements',vectors('Separate receivers',[{sx:-1,sy:0,x:-1,y:0,label:'B on A',dy:30},{sx:1,sy:0,x:1,y:0,label:'A on B',dy:30}],'Schematic equal forces, opposite directions, acting on different objects.',{unit:'equal force scale'}));
      add('Example paired measurements',plot('Compare the same instant',[{name:'A on B',data:[[.5,2],[1,4.1],[1.5,3]]},{name:'B on A',data:[[.5,-2.1],[1,-4],[1.5,-3.1]]}],'Time (s)','Force (N)','Illustrative readings: small discrepancies represent measurement effects.'));
      add('Equal forces, unequal accelerations',plot('Same interaction magnitude: 12 N',[{name:'A: 1 kg, a = −12',data:[[0,0],[1,-12]]},{name:'B: 4 kg, a = +3',data:[[0,0],[1,3]]}],'Time (s)','Velocity change (m/s)','Ideal constant-force illustration; acceleration units are m/s².'),true);
      add('Balanced forces or a third-law pair?',steps('Track the receiver',[['Earth → book','Partner: book → Earth'],['Table → book','Partner: book → table'],['Both forces on book','They can balance, but are not a third-law pair.']],'A third-law pair acts on two different objects.'),true);
      break;
    case 15:
      add('A diagram is a force inventory',f('One dot represents the chosen object',[30,10,49,49],'Example: a rope pulls a 5 kg box right across a floor.'));
      add('Worked horizontal pull',f('Forces on the 5 kg box',[30,10,49,49],'The longer horizontal arrow is the rope’s pull.'));
      add('Guided diagram: hanging lamp',f('Two equal vertical forces',[0,0,19.6,19.6],'The lamp is at rest.',['Right','Left','Rope','Earth']),true);
      add('Guided diagram: a falling ball',f('Downward force is larger',[0,0,1,2],'Qualitative arrow lengths: downward speed is increasing.',['Right','Left','Air drag','Earth'],{qualitative:true}),true);
      add('Components do not create extra interactions',vectors('Resolve one force once',[{x:4,y:3,label:'Original force'},{x:4,y:0,label:'x component',dy:30},{x:0,y:3,label:'y component',dx:-38}],'A schematic component diagram; components are alternatives in the sum.',{unit:'relative force'}));
      break;
    case 16:
      add('From arrows to a result',f('The horizontal resultant is 20 N',[30,10,0,0],'For a 5 kg box, aₓ = +4 m/s².'),true);
      add('An upward-angled pull changes normal force',vectors('Sum the vertical components',[{x:0,y:37,label:'Normal: 37 N',dx:-115},{x:0,y:12,label:'Rope y: 12 N',dx:115,dy:7},{x:0,y:-49,label:'Weight: 49 N',dx:105}],'The rope’s horizontal component is omitted from this vertical-component sum.',{unit:'N',axes:['','Up']}),true);
      add('Weight in ramp coordinates',vectors('Rotate the axes, not gravity',[{x:19.6,y:0,label:'+19.6 N',dy:30},{x:0,y:-33.948,label:'−33.9 N',dx:-60},{x:19.6,y:-33.948,label:'39.2 N',dx:35}],'Shown in ramp coordinates: +x is down-ramp, +y points outward.',{unit:'N',axes:['Down ramp','Outward']}));
      add('Worked ramp with given friction',f('Forces parallel to the ramp',[19.6,5,0,0],'Right on this plot means down the ramp. Net force = 14.6 N.',['mg sin θ','Friction','Outward','Inward']));
      add('Independent flat-surface case',f('Each axis is a separate sum',[50,15,98,98],'No vertical acceleration. Horizontal acceleration is +3.5 m/s².'),true);
      break;
    case 17:
      add('Two friction models',g('Static adjusts; kinetic stays near μₖN',[[0,0],[19.6,19.6],[19.6,14.7],[30,14.7]],'Applied push (N)','Friction magnitude (N)','Illustrative 5 kg box: μs = 0.40, μk = 0.30; the drop idealizes slip onset.'));
      add('Before and after slipping',f('Static friction matches this push',[12,12,49,49],'12 N is below the 19.6 N maximum. The actual friction is 12 N.'),true);
      add('The same box with a larger push',f('After slipping begins',[25,14.7,49,49],'Kinetic friction is 14.7 N; the net horizontal force is 10.3 N.'),true);
      add('Practice force-trace data',plot('Compare peak and steady readings',[{name:'Peak before sliding',data:[[1,8],[2,8.4],[3,8.2]]},{name:'Steady sliding',data:[[1,5.8],[2,6],[3,5.9]]}],'Trial number','Measured force (N)','Authored practice data; points compare trials, not a time trace.',{xrange:[1,3]}));
      break;
    case 18:
      add('Translational equilibrium',plot('Zero acceleration can include motion',[{name:'At rest',data:[[0,0],[4,0]]},{name:'Constant +2 m/s',data:[[0,2],[4,2]]}],'Time (s)','Velocity (m/s)','Both have ΣF = 0 in an inertial frame.'));
      add('A single hanging lamp',f('Support balances weight',[0,0,49,49],'A 5 kg lamp at rest.',['Right','Left','Rope','Earth']),true);
      add('The two tension vectors',vectors('Two vertical contributions support 98 N',[{x:-84.87,y:49,label:'98 N',dx:-12},{x:84.87,y:49,label:'98 N',dx:12},{x:0,y:-98,label:'98 N weight',dx:65}],'Each 30° rope contributes 49 N upward; horizontal components cancel.',{unit:'N'}));
      add('A steeper rope angle',g('More vertical rope, less tension',seq(40,q=>{let a=20+q*60;return[a,98/(2*Math.sin(a*Math.PI/180))]}),'Angle above horizontal (°)','Each rope tension (N)','For a 10 kg sign: 98 N at 30°, about 56.6 N at 60°.',{xrange:[20,80]}),true);
      break;
    case 19:
      add('Diagnostic A: motion graphs',g('Use the two supplied points',[[0,7],[3,1]],'Time (s)','Position (m)','Find the change in each coordinate before dividing.'));
      add('Station A: slope and motion',g('Worked example: read changes',[[1,2],[4,8]],'Time (s)','Position (m)','Example only: Δx = +6 m, Δt = 3 s. Solve the separate “Try” case yourself.'));
      add('Station B: vector components',vectors('Worked example: 10 N at 30°',[{x:8.66,y:0,label:'+8.66 N',dy:30},{x:0,y:5,label:'+5.00 N'},{x:8.66,y:5,label:'10 N'}],'This is the example. Decide the signs for the “Try” case yourself.',{unit:'N'}));
      add('Station C: force sum and object boundary',f('Worked example: a 2 kg object',[10,4,0,0],'Example: net force = +6 N and a = +3 m/s².'));
      add('Station D: position and uncertainty',band('Worked example: a growing interval',10,2,1,.1,5));
      break;
    case 20:
      add('The chain of reasoning',steps('Build a defensible prediction',[['Describe','Object, axes, forces, motion model'],['Calculate','Components → endpoint → bounds'],['Explain','Prediction, evidence, limitations']],'Each step supplies the next with a stated quantity or assumption.'));
      add('Worked case: endpoint and separation',vectors('Different vectors, different tails',[{sx:-100,sy:0,x:80,y:60,label:'Displacement',dx:-65},{x:-20,y:60,label:'Final position',dx:65,dy:28}],'Start (−100,0) km; finish (−20,60) km.',{unit:'km'}),true);
      add('Worked case: the bounds',band('The x-coordinate interval',-100,4,1,.1,20,'km'),true);
      add('The graph is evidence too',band('Group case: central line and bounds',-80,5*Math.cos(Math.PI/6),.5,.2*Math.cos(Math.PI/6),10,'km'),true);
      add('A new force changes the prediction',g('Extra displacement accumulates',seq(30,q=>{let t=q*10;return[t,.1*t*t]}),'Time (s)','Extra displacement (m)','For the same initial state, Δxextra = ½at² with a = 0.20 m/s².'),true);
      break;
    case 21:
      add('The coordinate convention',vectors('Orient the given velocity',[{sx:-1,sy:0,x:.65*Math.cos(Math.PI/12),y:.65*Math.sin(Math.PI/12),label:'v: 15° above +x',dy:-30}],'Schematic only: asteroid starts left of Earth; the angle is given, not calculated.',{unit:'schematic; not to scale',axes:['+x','+y'],originLabel:'Earth'}));
      add('Five required products',steps('Make each result visible',[['Calculations','Components, final coordinates, bounds'],['Graph','Central and bounding position lines'],['Public explanation','Prediction and limitations']],'Use your own calculations; no solved assessment values are shown.'));
      add('A plan before the calculation',steps('Plan your work',[['Choose','Units and quantities'],['Order','Steps and required products'],['Reserve time','Graph and public explanation']],'Write your own method before calculating.'));
      break;
    case 22:
      add('Completion checklist',steps('Check the complete analysis',[['Numerical work','Components → coordinates → bounds'],['Graph','Axes, units, central line, bounds'],['Briefing','Prediction versus real encounter forecast']],'Use this structure to inspect your own work.'));
      add('Peer defense: two equal turns',steps('A 14-minute exchange',[['0–4 min','A explains; B listens.'],['4–7 min','B questions and records evidence.'],['7–14 min','Switch roles and repeat.']],'Give both partners equal time to explain and question.'));
      add('A revision with a reason',steps('Keep the reasoning visible',[['Original','Preserve the claim or calculation.'],['Change','Mark one substantive revision.'],['Because','Connect the change to evidence.']],'If you keep a challenged claim, defend it with evidence.'));
      add('The next question: why does the path curve?',plot('A changing direction',[{name:'Illustrative circular path',data:seq(60,q=>[Math.cos(q*Math.PI*1.5),Math.sin(q*Math.PI*1.5)])}],'x position (arbitrary units)','y position (arbitrary units)','An ideal curved path previews the next unit; this is not the asteroid trajectory.',{xrange:[-2.4,2.4],yrange:[-1.2,1.2]}));
      break;
  }
}
