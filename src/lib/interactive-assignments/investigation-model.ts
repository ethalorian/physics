import {investigationById, validLabParameters} from './investigation-definitions'
export type Point={x:number;y:number}
export type LabMetric={label:string;value:number|string;unit:string}
export type LabPath={label:string;points:Point[];tone?:'primary'|'secondary'|'muted'}
export type LabBody=Point&{label:string;shape:'cart'|'person'|'orb'|'crate'|'boat'|'target'|'asteroid';tone?:'primary'|'secondary'|'muted'}
export type ForceSet={body:string;forces:{label:string;x:number;y:number}[]}
export type LabScene={kind:'track'|'plane'|'fall'|'pulley'|'ruler';bodies:LabBody[];paths:LabPath[];xLabel:string;yLabel:string;vectors?:LabPath[];bounds?:[number,number,number,number];ruler?:{division:number;readings:number[];reference:number};pulley?:{left:number;right:number}}
export type LabFrame={time:number;duration:number;metrics:LabMetric[];scene:LabScene;graph?:{xLabel:string;yLabel:string;paths:LabPath[];areas?:{start:number;end:number;height:number}[]};forces?:ForceSet[];note?:string}
export type LabTrial={id:number;parameters:Record<string,number>}
const G=9.8,rad=(d:number)=>d*Math.PI/180
const metric=(label:string,value:number|string,unit=''):LabMetric=>({label,value:typeof value==='number'&&Math.abs(value)<1e-10?0:value,unit})
const trace=(duration:number,at:(t:number)=>Point):Point[]=>Array.from({length:81},(_,i)=>at(duration*i/80))
const xy=(x:number,y=0):Point=>({x,y})
const series=(label:string,duration:number,at:(t:number)=>number,tone:LabPath['tone']='primary'):LabPath=>({label,tone,points:trace(duration,t=>xy(t,at(t)))})
const path=(label:string,points:Point[],tone:LabPath['tone']='primary'):LabPath=>({label,points,tone})
const body=(label:string,x:number,y=0,shape:LabBody['shape']='cart',tone:LabBody['tone']='primary'):LabBody=>({label,x,y,shape,tone})
const track=(duration:number,at:(t:number)=>number,bodies:LabBody[]):LabScene=>({kind:'track',bodies,paths:[path('Journey',trace(duration,t=>xy(at(t))))],xLabel:'Position (m)',yLabel:''})
const graph=(duration:number,at:(t:number)=>number,yLabel:string)=>({xLabel:'Time (s)',yLabel,paths:[series(yLabel,duration,at)]})
export function constantAccelerationDistance(v:number,a:number,t:number):number{const turn=a===0?-1:-v/a;const x=(s:number)=>v*s+a*s*s/2;return turn>0&&turn<t?Math.abs(x(turn))+Math.abs(x(t)-x(turn)):Math.abs(x(t))}
export function linearDragFall(m:number,b:number,t:number){if(b===0)return {distance:G*t*t/2,speed:G*t};const tau=m/b,oneMinus=-Math.expm1(-t/tau);return {distance:G*tau*(t-tau*oneMinus),speed:G*tau*oneMinus}}
function fallTime(height:number,m:number,b:number){if(b===0)return Math.sqrt(2*height/G);let lo=0,hi=1;while(linearDragFall(m,b,hi).distance<height)hi*=2;for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(linearDragFall(m,b,mid).distance<height)lo=mid;else hi=mid}return (lo+hi)/2}
export function investigationFrame(id:string,p:Record<string,number>,progress:number):LabFrame {
 const lab=investigationById(id);if(!lab||!validLabParameters(lab,p))throw Error('Invalid experiment conditions.')
 const f=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0))
 let duration=p.duration??1,t=duration*f
 if(id==='incline-lab'){
  const a=rad(p.angle),weight=p.mass*G,normal=weight*Math.cos(a),down=weight*Math.sin(a),tension=p.held?down:0
  return {time:0,duration:0,metrics:[metric('Weight',weight,'N'),metric('Normal force',normal,'N'),metric('Gravity along ramp',down,'N'),metric('Rope tension',tension,'N'),metric('Down-ramp acceleration',p.held?0:G*Math.sin(a),'m/s²')],scene:{kind:'plane',xLabel:'Horizontal direction',yLabel:'Vertical direction',paths:[path('Ramp',[xy(-3*Math.cos(a),3*Math.sin(a)),xy(3*Math.cos(a),-3*Math.sin(a))],'muted')],bodies:[body('Crate',0,0,'crate')],bounds:[-4,4,-4,4]},forces:[{body:'Crate (world axes)',forces:[{label:'Earth: gravity',x:0,y:-weight},{label:'Ramp: normal',x:normal*Math.sin(a),y:normal*Math.cos(a)},{label:'Rope tension',x:-tension*Math.cos(a),y:tension*Math.sin(a)}]}],note:'Components of gravity are parts of one force. Do not add them as two extra forces alongside the weight arrow.'}
 }
 if(id==='measurement-precision'){
  const offsets=[[-1,0.5,0,-0.5,1],[0.8,-0.8,0.2,-0.4,0.6],[-0.6,1,-1,0.4,-0.2]][p.batch-1]
  const resolution=p.division/10,readings=offsets.map(v=>Math.round((12.34+p.bias+p.scatter*v)/resolution)*resolution),mean=readings.reduce((a,b)=>a+b,0)/readings.length
  return {time:0,duration:0,metrics:[metric('Mean reading',mean,'cm'),metric('Reference',12.34,'cm'),metric('Mean − reference',mean-12.34,'cm'),metric('Reading range',Math.max(...readings)-Math.min(...readings),'cm'),metric('Smallest division',p.division,'cm')],scene:{kind:'ruler',xLabel:'Length (cm)',yLabel:'',paths:[],bodies:[],ruler:{division:p.division,reference:12.34,readings}},note:'Repeated readings can be close together even when a zero offset shifts all of them.'}
 }
 if(id==='distance-displacement'||id==='area-under-curve'){
  const velocities=id==='distance-displacement'?[p.first/p.seconds,p.second/p.seconds]:[p.v1,p.v2,p.v3]
  duration=velocities.length*p.seconds;t=duration*f
  const position=(s:number)=>velocities.reduce((sum,v,i)=>sum+v*Math.max(0,Math.min(p.seconds,s-i*p.seconds)),0)
  const distance=velocities.reduce((sum,v,i)=>sum+Math.abs(v)*Math.max(0,Math.min(p.seconds,t-i*p.seconds)),0)
  const index=Math.min(velocities.length-1,Math.floor(t/p.seconds)),v=velocities[index]
  return {time:t,duration,metrics:[metric('Position / displacement',position(t),'m'),metric('Distance',distance,'m'),metric('Current velocity',v,'m/s'),metric('Average velocity',t?position(t)/t:0,'m/s'),metric('Average speed',t?distance/t:0,'m/s')],scene:track(duration,position,[body('Walker',position(t),0,'person')]),graph:{xLabel:'Time (s)',yLabel:'Velocity (m/s)',paths:[path('Velocity',velocities.flatMap((v,i)=>[xy(i*p.seconds,v),xy((i+1)*p.seconds,v)]))],areas:velocities.map((v,i)=>({start:i*p.seconds,end:(i+1)*p.seconds,height:v}))}}
 }
 if(id==='constant-velocity'||id==='slope-calculator'){
  const v=id==='slope-calculator'?(p.end-p.start)/duration:p.velocity,origin=p.origin??0,start=p.start-origin,at=(s:number)=>start+v*s
  return {time:t,duration,metrics:[metric('Position',at(t),'m'),metric('Displacement',v*t,'m'),metric('Velocity / slope',v,'m/s'),metric('Distance',Math.abs(v*t),'m'),metric('Graph rise (whole trip)',v*duration,'m'),metric('Graph run (whole trip)',duration,'s')],scene:track(duration,at,[body('Walker',at(t),0,'person')]),graph:graph(duration,at,'Position (m)')}
 }
 if(id==='car-race'){
  const a=(s:number)=>p.head+p.a*s,b=(s:number)=>p.b*Math.max(0,s-p.delay),catchAt=p.b>p.a?(p.head+p.b*p.delay)/(p.b-p.a):p.head===0&&p.delay===0?0:null
  return {time:t,duration,metrics:[metric('A position',a(t),'m'),metric('B position',b(t),'m'),metric('A − B separation',a(t)-b(t),'m'),metric('Catch time',catchAt??'No later catch',catchAt===null?'':'s'),metric('Catch position',catchAt===null?'—':a(catchAt),catchAt===null?'':'m')],scene:{kind:'track',xLabel:'Position (m)',yLabel:'',paths:[path('A route',[xy(p.head,1),xy(a(duration),1)]),path('B route',[xy(0,-1),xy(b(duration),-1)],'secondary')],bodies:[body('A',a(t),1),body('B',b(t),-1,'cart','secondary')]},graph:{xLabel:'Time (s)',yLabel:'Position (m)',paths:[series('A',duration,a),{label:'B',tone:'secondary',points:[xy(0,0),xy(Math.min(p.delay,duration),0),xy(duration,b(duration))]}]},note:catchAt!==null&&catchAt>duration?'The catch occurs after the selected observation window. Extend the observation time.':undefined}
 }
 if(id==='uniformly-accelerated-motion'||id==='sumo-forces'||id==='force-mass'){
  const v=p.velocity??0,force=id==='sumo-forces'?p.right-p.left:p.force??0,a=id==='uniformly-accelerated-motion'?p.acceleration:force/p.mass,at=(s:number)=>v*s+a*s*s/2
  const forces=id==='uniformly-accelerated-motion'?undefined:[{body:'Cart · horizontal forces',forces:id==='sumo-forces'?[{label:'Right push',x:p.right,y:0},{label:'Left push',x:-p.left,y:0}]:[{label:'Applied force',x:force,y:0}]}]
  const scene=track(duration,at,[body('Cart',at(t))]);scene.paths.push(path('Equal-time dots',Array.from({length:Math.floor(duration)+1},(_,i)=>xy(at(i))),'muted'))
  return {time:t,duration,metrics:[metric('Displacement',at(t),'m'),metric('Distance',constantAccelerationDistance(v,a,t),'m'),metric('Velocity',v+a*t,'m/s'),metric('Acceleration',a,'m/s²'),...(id==='uniformly-accelerated-motion'?[metric('Reversal time',a!==0&&-v/a>0?-v/a:'No future reversal',a!==0&&-v/a>0?'s':'')]:[metric('Net force',force,'N'),metric('Mass',p.mass,'kg')])],scene,graph:graph(duration,s=>v+a*s,'Velocity (m/s)'),forces}
 }
 if(id==='freefall-cliff'||id==='projectile-motion'){
  const g=p.g??G,vx=id==='projectile-motion'?p.speed*Math.cos(rad(p.angle)):0,vy=id==='projectile-motion'?p.speed*Math.sin(rad(p.angle)):p.velocity
  duration=(vy+Math.sqrt(vy*vy+2*g*p.height))/g;t=duration*f
  const at=(s:number)=>xy(vx*s,Math.max(0,p.height+vy*s-g*s*s/2)),pos=at(t)
  return {time:t,duration,metrics:[metric('Height',pos.y,'m'),metric('Horizontal position',pos.x,'m'),metric('Vertical velocity',vy-g*t,'m/s'),metric('Horizontal velocity',vx,'m/s'),metric('Flight time',duration,'s'),metric('Maximum height',p.height+Math.max(0,vy)**2/(2*g),'m')],scene:{kind:id==='freefall-cliff'?'fall':'plane',xLabel:'Horizontal position (m)',yLabel:'Height (m)',paths:[path('Flight',trace(duration,at))],bodies:[body('Ball',pos.x,pos.y,'orb')]},graph:graph(duration,s=>vy-g*s,'Vertical velocity (m/s)')}
 }
 if(id==='vacuum-chamber'){
  const b=0.08*p.pressure,tl=fallTime(p.height,p.light,b),th=fallTime(p.height,p.heavy,b);duration=Math.max(tl,th);t=duration*f
  const light=linearDragFall(p.light,b,Math.min(t,tl)),heavy=linearDragFall(p.heavy,b,Math.min(t,th))
  return {time:t,duration,metrics:[metric('Light fall time',tl,'s'),metric('Heavy fall time',th,'s'),metric('Light height',Math.max(0,p.height-light.distance),'m'),metric('Heavy height',Math.max(0,p.height-heavy.distance),'m'),metric('Light impact speed',linearDragFall(p.light,b,tl).speed,'m/s'),metric('Heavy impact speed',linearDragFall(p.heavy,b,th).speed,'m/s')],scene:{kind:'fall',xLabel:'',yLabel:'Height (m)',paths:[path('Light',[xy(-1,0),xy(-1,p.height)]),path('Heavy',[xy(1,0),xy(1,p.height)],'secondary')],bodies:[body('Light',-1,Math.max(0,p.height-light.distance),'orb'),body('Heavy',1,Math.max(0,p.height-heavy.distance),'orb','secondary')]},graph:{xLabel:'Time (s)',yLabel:'Height (m)',paths:[series('Light',duration,s=>Math.max(0,p.height-linearDragFall(p.light,b,Math.min(s,tl)).distance)),series('Heavy',duration,s=>Math.max(0,p.height-linearDragFall(p.heavy,b,Math.min(s,th)).distance),'secondary')]},note:'Objects stop at the floor. Impact speeds describe the instant before contact.'}
 }
 if(id==='maze-vectors'){
  const a=xy(p.ax,p.ay),b=xy(p.bx,p.by),first=p.order===0?a:b,end=xy(a.x+b.x,a.y+b.y),lengthA=Math.hypot(a.x,a.y),lengthB=Math.hypot(b.x,b.y)
  return {time:0,duration:0,metrics:[metric('Resultant x',end.x,'m'),metric('Resultant y',end.y,'m'),metric('Resultant magnitude',Math.hypot(end.x,end.y),'m'),metric('Route length',lengthA+lengthB,'m'),metric('A magnitude',lengthA,'m'),metric('B magnitude',lengthB,'m')],scene:{kind:'plane',xLabel:'East (m)',yLabel:'North (m)',paths:[],bodies:[body('Start',0,0,'target','muted'),body('Finish',end.x,end.y,'target')],vectors:[path(p.order===0?'A':'B',[xy(0),first]),path(p.order===0?'B':'A',[first,end],'secondary'),path('Resultant',[xy(0),end],'muted')]}}
 }
 if(id==='free-body-diagram'){
  const weight=p.mass*G,normal=Math.max(0,weight-p.lift),fx=p.right-p.left,fy=p.lift+normal-weight
  return {time:0,duration:0,metrics:[metric('Weight',weight,'N'),metric('Normal force',normal,'N'),metric('Net horizontal force',fx,'N'),metric('Net vertical force',fy,'N'),metric('Horizontal acceleration',fx/p.mass,'m/s²'),metric('Vertical acceleration',fy/p.mass,'m/s²')],scene:{kind:'track',xLabel:'',yLabel:'',paths:[],bodies:[body(normal>0?'Crate on table':'Crate losing contact',0,0,'crate')],bounds:[-2,2,-1,1]},forces:[{body:'Crate',forces:[{label:'Earth: gravity',x:0,y:-weight},{label:'Table: normal',x:0,y:normal},{label:'Right push',x:p.right,y:0},{label:'Left pull',x:-p.left,y:0},{label:'Upward pull',x:0,y:p.lift}]}],note:normal===0&&fy>0?'Contact is lost. A table cannot pull downward on the crate.':'A net force is a sum of the interaction forces, not an extra interaction arrow.'}
 }
 if(id==='carts-third-law'){
  const total=p.ma+p.mb,mu=p.ma*p.mb/total,omega=Math.sqrt(p.spring/mu),release=Math.PI/(2*omega),relativeSpeed=p.compression*omega
  duration=release+1.5;t=duration*f
  const separation=(s:number)=>s<=release?p.compression*(1-Math.cos(omega*s)):p.compression+relativeSpeed*(s-release)
  const va=-p.mb/total*(t<=release?p.compression*omega*Math.sin(omega*t):relativeSpeed),vb=-va*p.ma/p.mb,force=t<release?p.spring*p.compression*Math.cos(omega*t):0
  const xa=(s:number)=>-0.35-p.mb/total*separation(s),xb=(s:number)=>0.35+p.ma/total*separation(s)
  return {time:t,duration,metrics:[metric('Force on left cart',-force,'N'),metric('Force on right cart',force,'N'),metric('Left velocity',va,'m/s'),metric('Right velocity',vb,'m/s'),metric('Peak force on each',p.spring*p.compression,'N'),metric('Contact ends',release,'s')],scene:{kind:'track',xLabel:'Position (m)',yLabel:'',paths:[path('Left',trace(duration,s=>xy(xa(s)))),path('Right',trace(duration,s=>xy(xb(s))),'secondary')],bodies:[body('Left cart',xa(t)),body('Right cart',xb(t),0,'cart','secondary')]},forces:[{body:'Left cart · horizontal forces',forces:[{label:'Spring',x:-force,y:0}]},{body:'Right cart · horizontal forces',forces:[{label:'Spring',x:force,y:0}]}],graph:{xLabel:'Time (s)',yLabel:'Force (N)',paths:[series('On left',duration,s=>s<release?-p.spring*p.compression*Math.cos(omega*s):0),series('On right',duration,s=>s<release?p.spring*p.compression*Math.cos(omega*s):0,'secondary')]},note:t>=release?'The spring no longer pushes. Both carts coast at their release velocities.':'The forces have equal magnitudes at every instant, even when the masses differ.'}
 }
 if(id==='astronaut-thrust'){
  const a=p.force/p.mass,burn=p.burn,at=(s:number)=>s<=burn?p.velocity*s+a*s*s/2:p.velocity*burn+a*burn*burn/2+(p.velocity+a*burn)*(s-burn),velocity=(s:number)=>p.velocity+a*Math.min(s,burn)
  return {time:t,duration,metrics:[metric('Position',at(t),'m'),metric('Velocity',velocity(t),'m/s'),metric('Current thrust',t<burn?p.force:0,'N'),metric('Current acceleration',t<burn?a:0,'m/s²'),metric('Change in velocity',a*Math.min(t,burn),'m/s'),metric('Burn ends',burn,'s')],scene:track(duration,at,[body('Astronaut',at(t),0,'person')]),graph:graph(duration,velocity,'Velocity (m/s)'),forces:[{body:'Astronaut',forces:[{label:'Thruster',x:t<burn?p.force:0,y:0}]}],note:t>=burn?'Engine off. Position continues changing because velocity persists.':'Thrust changes velocity; it does not directly set velocity.'}
 }
 if(id==='atwood-machine'){
  const a=(p.mb-p.ma)*G/(p.ma+p.mb),tension=2*p.ma*p.mb*G/(p.ma+p.mb),s=p.velocity*t+a*t*t/2
  return {time:t,duration,metrics:[metric('Right displacement (down +)',s,'m'),metric('Right velocity',p.velocity+a*t,'m/s'),metric('Acceleration (right down +)',a,'m/s²'),metric('Rope tension',tension,'N'),metric('Left weight',p.ma*G,'N'),metric('Right weight',p.mb*G,'N')],scene:{kind:'pulley',xLabel:'',yLabel:'',paths:[],bodies:[],pulley:{left:s,right:-s}},forces:[{body:'Left mass',forces:[{label:'Rope tension',x:0,y:tension},{label:'Earth: gravity',x:0,y:-p.ma*G}]},{body:'Right mass',forces:[{label:'Rope tension',x:0,y:tension},{label:'Earth: gravity',x:0,y:-p.mb*G}]}],graph:graph(duration,time=>p.velocity+a*time,'Right velocity (m/s)')}
 }
 if(id==='friction-lab'){
  const [mus,muk]=[[0.3,0.2],[0.5,0.3],[0.8,0.6]][p.surface],normal=p.mass*G,limit=mus*normal,kinetic=muk*normal,moves=p.velocity>0||p.force>limit,a=moves?(p.force-kinetic)/p.mass:0,stop=a<0?-p.velocity/a:Infinity
  const at=(s:number)=>{const q=Math.min(s,stop);return moves?p.velocity*q+a*q*q/2:0},sliding=moves&&t<stop,friction=sliding?kinetic:p.force
  return {time:t,duration,metrics:[metric('Position',at(t),'m'),metric('Velocity',moves?Math.max(0,p.velocity+a*Math.min(t,stop)):0,'m/s'),metric('Friction magnitude',friction,'N'),metric('Maximum static friction',limit,'N'),metric('Net horizontal force',p.force-friction,'N'),metric('State',sliding?'Sliding':'Sticking')],scene:track(duration,at,[body('Crate',at(t),0,'crate')]),forces:[{body:'Crate · horizontal forces',forces:[{label:'Pull',x:p.force,y:0},{label:sliding?'Kinetic friction':'Static friction',x:-friction,y:0}]}],graph:graph(duration,s=>moves?Math.max(0,p.velocity+a*Math.min(s,stop)):0,'Velocity (m/s)'),note:sliding?'Kinetic friction opposes the sliding motion.':'Static friction matches the pull. Its maximum is a limit, not its automatic value.'}
 }
 if(id==='riverboat-crossing'){
  const vx=p.current+p.speed*Math.sin(rad(p.angle)),vy=p.speed*Math.cos(rad(p.angle));duration=p.width/vy;t=duration*f
  return {time:t,duration,metrics:[metric('Downstream drift',vx*t,'m'),metric('Across-river position',vy*t,'m'),metric('Ground velocity east',vx,'m/s'),metric('Ground velocity north',vy,'m/s'),metric('Crossing time',duration,'s'),metric('Direct-crossing aim',p.current<p.speed?-Math.asin(p.current/p.speed)*180/Math.PI:'Not possible',p.current<p.speed?'°':'')],scene:{kind:'plane',xLabel:'East / downstream (m)',yLabel:'North / across (m)',paths:[path('Ground path',[xy(0),xy(vx*duration,p.width)])],bodies:[body('Boat',vx*t,vy*t,'boat')]},note:'Ground velocity is the vector sum of boat-through-water velocity and water-over-ground velocity.'}
 }
 if(id==='monkey-hunter'){
  const d=Math.hypot(p.x,p.y),vx=p.speed*p.x/d,vy=p.speed*p.y/d,ground=2*vy/G,targetGround=Math.sqrt(2*p.y/G),intercept=d/p.speed,hit=intercept<targetGround
  duration=hit?intercept:Math.max(ground,targetGround);t=duration*f
  const ball=(s:number)=>xy(vx*Math.min(s,ground),Math.max(0,vy*Math.min(s,ground)-G*Math.min(s,ground)**2/2)),target=(s:number)=>xy(p.x,Math.max(0,p.y-G*s*s/2)),point=ball(t),tar=target(t)
  return {time:t,duration,metrics:[metric('Predicted intercept time',intercept,'s'),metric('Target reaches ground',targetGround,'s'),metric('Intercept height (unbounded)',p.y-G*intercept*intercept/2,'m'),metric('Outcome',hit?'Intercept above ground':'Ground arrives first'),metric('Initial aim',Math.atan2(p.y,p.x)*180/Math.PI,'°')],scene:{kind:'plane',xLabel:'Horizontal position (m)',yLabel:'Height (m)',paths:[path('Ball',trace(duration,ball)),path('Target',[xy(p.x,p.y),target(duration)],'secondary'),path('Initial aim',[xy(0),xy(p.x,p.y)],'muted')],bodies:[body('Ball',point.x,point.y,'orb'),body('Target',tar.x,tar.y,'target','secondary')]},note:hit?'The ball and target have the same downward gravitational offset at the interception time.':'The ideal paths would meet below the ground. A slower launch does not guarantee a reachable interception.'}
 }
 if(id==='asteroid-trajectory'||id==='closing-speed'||id==='predicting-2026-xj'){
  const start=id==='closing-speed'?120:p.start,vx=id==='closing-speed'?-p.speed*Math.cos(rad(p.angle)):p.vx,vy=id==='closing-speed'?p.speed*Math.sin(rad(p.angle)):p.vy
  duration=id==='predicting-2026-xj'?p.time*1e6:p.days*86400;t=duration*f
  const at=(s:number)=>xy(start+vx*s/1e6,vy*s/1e6),pos=at(t),distance=Math.hypot(pos.x,pos.y),speed=Math.hypot(vx,vy),closing=distance>1e-10?-(pos.x*vx+pos.y*vy)/distance:'Undefined at Earth',paths=[path('Nominal path',[xy(start),at(duration)])]
  const metrics=[metric('x position',pos.x,'million km'),metric('y position',pos.y,'million km'),metric('Distance from Earth',distance,'million km')]
  if(id==='predicting-2026-xj'){
   const e=p.uncertainty*t/1e6;metrics.push(metric('Bound ± per coordinate',e,'million km'),metric('Forecast time',t/1e6,'million s'))
   paths.push(path('Position bounds',[xy(pos.x-e,pos.y-e),xy(pos.x+e,pos.y-e),xy(pos.x+e,pos.y+e),xy(pos.x-e,pos.y+e),xy(pos.x-e,pos.y-e)],'secondary'))
  }else metrics.push(metric('Speed',speed,'km/s'),metric('Closing speed',closing,typeof closing==='number'?'km/s':''),metric('x velocity',vx,'km/s'))
  return {time:t,duration,metrics,scene:{kind:'plane',xLabel:'x (million km)',yLabel:'y (million km)',paths,bodies:[body('Earth',0,0,'orb','secondary'),body('Asteroid',pos.x,pos.y,'asteroid')],bounds:[Math.min(0,at(duration).x)-12,start+12,Math.min(0,at(duration).y)-12,Math.max(0,at(duration).y)+12]},graph:id==='asteroid-trajectory'?{xLabel:'Time (days)',yLabel:'x (million km)',paths:[series('x position',p.days,day=>at(day*86400).x)]}:undefined,note:'Fictional scenario. Constant-velocity extrapolation omits gravitational curvature and does not establish an impact prediction.'}
 }
 throw Error('Experiment model is unavailable.')
}

/** Only supported conditions are stored. Results are reconstructed for student and teacher views. */
export function encodeLabTrials(id:string,trials:LabTrial[]):number[]{const lab=investigationById(id);if(!lab)return [];return trials.flatMap(t=>[t.id,...lab.controls.map(c=>t.parameters[c.key])])}
export function decodeLabTrials(id:string,values:number[]|undefined):LabTrial[]{
 const lab=investigationById(id);if(!lab||!values)return [];const size=lab.controls.length+1
 if(values.length%size||values.length>size*12)return []
 const trials:LabTrial[]=[];let last=0
 for(let i=0;i<values.length;i+=size){const trialId=values[i],parameters=Object.fromEntries(lab.controls.map((c,j)=>[c.key,values[i+j+1]]));if(!Number.isSafeInteger(trialId)||trialId<=last||!validLabParameters(lab,parameters))return [];trials.push({id:trialId,parameters});last=trialId}
 return trials
}
export const labTrialKey=(id:string)=>'lab-'+id
export const displayLabValue=(value:number|string)=>typeof value==='string'?value:Math.abs(value)>=1e6?value.toExponential(3):Number(value.toFixed(3)).toLocaleString('en-US',{maximumFractionDigits:3})
