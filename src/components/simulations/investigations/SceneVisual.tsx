'use client'
import {InvestigationActor,useInvestigationParticipation} from '@/components/avatar/InvestigationParticipation'
import {SIMULATION_ROLES} from '@/lib/avatar/investigation-missions'
import {useId,useMemo,type ReactNode} from 'react'
import {investigationFrame,displayLabValue as fmt,type LabFrame,type Point} from '@/lib/interactive-assignments/investigation-model'
import {Arrow,Astronaut,Asteroid,Badge,Boat,Cart,Crate,Earth,Landscape,SceneDefs,Space,Walker,ink} from './SceneArt'
import s from './scenes.module.css'

type Props={id:string;frame:LabFrame;parameters:Record<string,number>;progress:number;running?:boolean}
type Camera={x:(x:number)=>number;y:(y:number)=>number;lo:number;hi:number;bottom:number;top:number;scale:number}
type Context=Props&{uid:string;history:LabFrame[];dots:LabFrame[];camera:Camera}
const rad=(degrees:number)=>degrees*Math.PI/180
const value=(frame:LabFrame,label:string)=>Number(frame.metrics.find(m=>m.label===label)?.value??0)
const line=(points:Point[],c:Camera)=>points.map(p=>`${c.x(p.x)},${c.y(p.y)}`).join(' ')
function cameraFor(history:LabFrame[],uniform:boolean):Camera{
 const all=history.flatMap(f=>f.scene.bodies).concat(history[0].scene.paths.flatMap(p=>p.points).map(p=>({...p,label:'',shape:'orb' as const})))
 const vectors=history[0].scene.vectors?.flatMap(v=>v.points)??[]
 const points:Point[]=[...all,...vectors,{x:0,y:0}],bounds=history[0].scene.bounds
 let lo=bounds?.[0]??Math.min(...points.map(p=>p.x)),hi=bounds?.[1]??Math.max(...points.map(p=>p.x)),bottom=bounds?.[2]??Math.min(...points.map(p=>p.y)),top=bounds?.[3]??Math.max(...points.map(p=>p.y))
 if(hi-lo<2){const mid=(hi+lo)/2;lo=mid-1;hi=mid+1}if(top-bottom<2){const mid=(top+bottom)/2;bottom=mid-1;top=mid+1}
 const sx=500/Math.max(2,hi-lo),sy=205/Math.max(2,top-bottom),scale=Math.min(sx,sy)
 return {lo,hi,bottom,top,scale,x:x=>380+(x-(lo+hi)/2)*(uniform?scale:sx),y:y=>210-(y-(bottom+top)/2)*(uniform?scale:sy)}
}
function Cue({tag,children}:{tag:string;children:ReactNode}){return <div className={s.caption}><strong>{tag}</strong><p>{children}</p></div>}
function Rail({c,y=348,label='Position (m)'}:{c:Camera;y?:number;label?:string}){const lo=c.lo,hi=c.hi;return <g><path d={`M88 ${y}H672`} stroke="#6b9bb5" strokeOpacity=".55"/>{Array.from({length:5},(_,i)=>{const v=lo+(hi-lo)*i/4,x=c.x(v);return <g key={i}><path d={`M${x} ${y-4}v9`} stroke="#9bc1d4"/><text x={x} y={y+23} textAnchor="middle" className={s.number}>{fmt(v)}</text></g>})}<text x="380" y={y+47} textAnchor="middle" className={s.small}>{label}</text></g>}
function Heading({kicker,title}:{kicker:string;title:string}){return <g><text x="28" y="32" className={s.eyebrow}>{kicker}</text><text x="28" y="57" fill={ink.white} fontSize="20" fontWeight="600">{title}</text></g>}
function Trail({ctx,index=0,y,color=ink.cyan}:{ctx:Context;index?:number;y?:number;color?:string}){return <g data-visual="equal-time-trail">{ctx.dots.filter(f=>f.time<=ctx.frame.time+1e-8).map((f,i)=>{const b=f.scene.bodies[index];return b?<g key={i} opacity={.25+.55*(i+1)/ctx.dots.length}><circle cx={ctx.camera.x(b.x)} cy={y??ctx.camera.y(b.y)} r="4" fill={color}/><circle cx={ctx.camera.x(b.x)} cy={y??ctx.camera.y(b.y)} r="8" fill="none" stroke={color} strokeOpacity=".25"/></g>:null})}</g>}
function WorldAxes({c,xLabel,yLabel}:{c:Camera;xLabel:string;yLabel:string}){return <g>{[0,1,2,3,4].map(i=>{const x=c.lo+(c.hi-c.lo)*i/4,y=c.bottom+(c.top-c.bottom)*i/4;return <g key={i}><line x1={c.x(x)} x2={c.x(x)} y1="100" y2="322" stroke="#9fc9dd" opacity=".1"/><line x1="105" x2="655" y1={c.y(y)} y2={c.y(y)} stroke="#9fc9dd" opacity=".1"/><text x={c.x(x)} y="347" textAnchor="middle" className={s.number}>{fmt(x)}</text><text x="92" y={c.y(y)+4} textAnchor="end" className={s.number}>{fmt(y)}</text></g>})}<text x="380" y="375" textAnchor="middle" className={s.small}>{xLabel}</text><text x="28" y="84" className={s.small}>{yLabel}</text></g>}

function AstronautScene({ctx}:{ctx:Context}){
 const {frame:f,camera:c,parameters:p,uid}=ctx,x=c.x(f.scene.bodies[0].x),force=value(f,'Current thrust'),v=value(f,'Velocity'),burning=f.time<p.burn&&p.force!==0,velocityScale=72/Math.max(1,...ctx.history.map(h=>Math.abs(value(h,'Velocity'))))
 return <><Space id={uid} earth/><Heading kicker="DEEP SPACE · MOTION OBSERVATORY" title="A push changes motion. Coasting preserves it."/><Badge x={568} y={24} tone={burning?'amber':'cyan'} width={164}>{burning?'THRUSTER FIRING':'FREE COAST'}</Badge>
 <line x1="92" x2="668" y1="234" y2="234" stroke="#92b9d1" strokeDasharray="3 7" opacity=".18"/>
 <Trail ctx={ctx} y={234}/>
 <g transform={`translate(${x},224) scale(.88)`}><Astronaut id={uid} thrust={force}/><InvestigationActor x={0} y={-46} width={35} height={35} pose="head"/></g>
 <Arrow id={uid} x={x} y={118} dx={v*velocityScale} label={`v = ${fmt(v)} m/s`}/>
 {force!==0?<Arrow id={uid} x={x} y={306} dx={force/40*72} color="amber" label={`F = ${fmt(force)} N`}/>:<text x={x} y="313" textAnchor="middle" className={s.small}>No thrust · a = 0</text>}
 <line x1={x} x2={x} y1="325" y2="348" stroke={ink.cyan} strokeDasharray="2 4"/><circle cx={x} cy="348" r="4" fill={ink.cyan}/>
 <Rail c={c}/><text x="28" y="410" className={s.small}>Local inertial frame · gravity and drag omitted</text>
 </>
}
function TrackScene({ctx}:{ctx:Context}){
 const {frame:f,parameters:p,camera:c,uid,id}=ctx,race=id==='car-race',spring=id==='carts-third-law',crate=id==='friction-lab'||id==='free-body-diagram',walker=f.scene.bodies[0]?.shape==='person'
 const v=value(f,'Velocity')||value(f,'Current velocity')||value(f,'Velocity / slope'),velocityScale=70/Math.max(1,...ctx.history.map(h=>Math.abs(value(h,'Velocity')||value(h,'Current velocity')||value(h,'Velocity / slope')))),forceCeiling=Math.max(1,...ctx.history.flatMap(h=>(h.forces??[]).flatMap(g=>g.forces.map(a=>Math.abs(a.x))))),contact=value(f,'Force on right cart')>1e-8,cartScale=spring?Math.min(1,(c.x(ctx.history[0].scene.bodies[1].x)-c.x(ctx.history[0].scene.bodies[0].x))/90):1
 return <><Landscape id={uid} ground={293}/><Heading kicker={race?'TEST CIRCUIT · TWO MOVING OBJECTS':crate?'MECHANICS WORKSHOP':walker?'MOTION FIELD STATION':'DYNAMICS BENCH'} title={race?'A head start is a position advantage.':spring?'One interaction. Two equal forces.':id==='friction-lab'?'Watch the contact, then the motion.':id==='free-body-diagram'?'Identify the interactions on the crate.':walker?'Read motion from the space between positions.':'Force changes velocity, one moment at a time.'}/>
 <rect x="38" y={race?177:286} width="684" height={race?143:34} rx="9" fill={race?'#263f4c':'#243b48'} stroke="#5b8293"/>
 {race?<><line x1="40" x2="720" y1="250" y2="250" stroke="#9cb5c1" strokeDasharray="18 16" opacity=".5"/><path d="M94 179v137" stroke="#d8e8e8" strokeWidth="4" strokeDasharray="7 7"/></>:<><path d="M40 287H720M40 307H720" stroke="#9bb9c9" strokeWidth="3"/>{Array.from({length:27},(_,i)=><path key={i} d={`M${51+i*25} 310v8`} stroke="#7395a9"/>)}<path d="M105 320v13M655 320v13" stroke="#48687d" strokeWidth="11"/></>}
 {id==='friction-lab'&&<rect x="39" y="286" width="682" height={6+p.surface*4} fill={p.surface===0?'#a5bdc7':`url(#${uid}-rough)`}/>}
 {spring&&contact&&<polyline points={Array.from({length:17},(_,i)=>`${c.x(f.scene.bodies[0].x)+34*cartScale+(c.x(f.scene.bodies[1].x)-c.x(f.scene.bodies[0].x)-68*cartScale)*i/16},${i===0||i===16?267:267+(i%2?7:-7)}`).join(' ')} fill="none" stroke={ink.amber} strokeWidth="3"/>}
 {f.scene.bodies.map((b,i)=>{const x=c.x(b.x),y=race?(i===0?222:294):284,color=i===0?ink.cyan:ink.rose,velocity=spring?value(f,i===0?'Left velocity':'Right velocity'):race?(i===0?p.a:f.time<p.delay?0:p.b):v
 return <g key={b.label}><Trail ctx={ctx} index={i} y={race?y-4:266} color={color}/><g transform={`translate(${x},${y})`}>{crate?<Crate mass={p.mass}/>:walker?<InvestigationActor x={0} y={0} height={88} pose={ctx.running&&Math.abs(velocity)>1e-6?"walking":"side"} facing={velocity<0?-1:1} fallback={<Walker phase={f.time*8} moving={Boolean(ctx.running)&&Math.abs(velocity)>1e-6}/>}/>:<g transform={`scale(${cartScale})`}><Cart id={uid} color={color} mass={spring?(i===0?p.ma:p.mb):p.mass} car={race}/>{race&&i===0&&<InvestigationActor x={8} y={-28} height={19} width={19} pose="head"/>}</g>}</g>
 <text x={x} y={race?y-61:spring?178+i*25:196} textAnchor="middle" className={s.label}>{race?`${b.label} · ${fmt(velocity)} m/s`:spring?`${b.label} · ${fmt(velocity)} m/s`:b.label}</text>
 {!race&&!spring&&!crate&&<Arrow id={uid} x={x} y={159} dx={velocity*velocityScale} label={`v = ${fmt(velocity)} m/s`}/>}
 {f.forces?.[spring?i:0]?.forces.filter(a=>a.y===0&&Math.abs(a.x)>1e-8).map((a,j)=>{const len=a.x/forceCeiling*68;return <Arrow key={j} id={uid} x={x+Math.sign(a.x)*34*cartScale} y={spring?267:258} dx={len} color={j%2?'rose':'amber'} label={`${spring?'':a.x>0?'→ ':'← '}${fmt(Math.abs(a.x))} N`}/>})}
 <line x1={x} x2={x} y1={race?y+13:322} y2="348" stroke={color} strokeDasharray="2 5" opacity=".6"/>
 </g>})}
 <Rail c={c}/>
 {id==='friction-lab'&&<Badge x={554} y={80} width={174} tone={String(f.metrics.find(m=>m.label==='State')?.value)==='Sliding'?'amber':'cyan'}>{String(f.metrics.find(m=>m.label==='State')?.value)} · surface {p.surface+1}</Badge>}
 {spring&&<Badge x={552} y={80} width={176} tone={contact?'amber':'cyan'}>{contact?'SPRING IN CONTACT':'CARTS COASTING'}</Badge>}
 </>
}

function FallScene({ctx}:{ctx:Context}){
 const {frame:f,parameters:p,uid,camera:c,id}=ctx,vacuum=id==='vacuum-chamber',top=Math.max(p.height,value(f,'Maximum height'),1),py=(y:number)=>312-y/top*190
 if(vacuum)return <><rect width="760" height="420" fill="#0b2134"/><rect width="760" height="420" fill={`url(#${uid}-grid)`}/><Heading kicker="CONTROLLED ENVIRONMENT · DROP CHAMBER" title="Same release. Same shape. Different mass."/><Badge x={567} y={25} width={164} tone={p.pressure===0?'cyan':'amber'}>{p.pressure===0?'VACUUM':'AIR RESISTANCE'}</Badge>
 {[0,1].map(i=>{const x=267+i*226,b=f.scene.bodies[i],color=i?ink.rose:ink.cyan;return <g key={i}>
 <rect x={x-78} y="104" width="156" height="222" rx="36" fill={`url(#${uid}-glass)`} stroke="#7bb5c9" strokeWidth="2"/><path d={`M${x-65} 137V294`} stroke="#b5e7ee" strokeWidth="5" opacity=".18"/><rect x={x-87} y="93" width="174" height="26" rx="7" fill={`url(#${uid}-metal)`}/><rect x={x-88} y="316" width="176" height="20" rx="6" fill="#6b8b9d"/>
 {p.pressure>0&&Array.from({length:p.pressure===1?30:15},(_,j)=><circle key={j} cx={x-58+(j*43)%116} cy={133+(j*37)%167} r="1.7" fill="#9ac5d9" opacity=".4"/>)}
 {ctx.dots.filter(d=>d.time<=f.time).map((d,j)=><circle key={j} cx={x} cy={py(d.scene.bodies[i].y)} r="3" fill={color} opacity=".5"/>)}
 <circle cx={x} cy={py(b.y)-9} r="11" fill={i?ink.rose:`url(#${uid}-ball)`} stroke="#e1f4ef" strokeWidth="1"/>
 <text x={x} y="364" textAnchor="middle" className={s.label}>{i?'Heavy':'Light'} · {fmt(i?p.heavy:p.light)} kg</text><text x={x} y="387" textAnchor="middle" className={s.number}>{fmt(b.y)} m above floor</text>
 </g>})}
 <path d="M99 122V312M92 122h14M92 312h14" stroke="#7fa5ba"/><text transform="translate(75 219) rotate(-90)" textAnchor="middle" className={s.small}>Drop height · {p.height} m</text>
 </>
 const x=446,y=py(f.scene.bodies[0].y),vy=value(f,'Vertical velocity'),velocityScale=55/Math.max(1,...ctx.history.map(h=>Math.abs(value(h,'Vertical velocity'))))
 return <><Landscape id={uid} ground={326}/><Heading kicker="FREE FALL · VERTICAL MOTION" title="Gravity changes velocity throughout the fall."/><Badge x={557} y={25} width={174} tone="amber">{p.g===1.6?'MOON':p.g===3.7?'MARS':'EARTH'} · g = {p.g} m/s²</Badge>
 <path d={`M0 ${py(p.height)}H356L349 ${py(p.height)+36}L369 ${py(p.height)+77}L344 326H0Z`} fill="#5b6667"/>
 <path d={`M0 ${py(p.height)}H356L349 ${py(p.height)+14}H0Z`} fill="#829783"/>
 <path d={`M298 ${py(p.height)+15}L311 ${py(p.height)+53}L288 280L305 326M341 ${py(p.height)+24}L326 242L343 274M221 ${py(p.height)+24}L237 326`} fill="none" stroke="#3b5159" strokeWidth="6"/>
 <path d={`M414 ${py(p.height)}H499`} stroke="#bdd3d6" strokeDasharray="5 5" opacity=".5"/>
 {ctx.dots.filter(d=>d.time<=f.time).map((d,i)=><circle key={i} cx={x} cy={py(d.scene.bodies[0].y)} r="4" fill={ink.cyan} opacity=".35"/>)}
 <circle cx={x} cy={y-10} r="13" fill={`url(#${uid}-ball)`} stroke="#c4fff0"/>
 <Arrow id={uid} x={x+58} y={Math.min(245,Math.max(178,y))} dx={0} dy={-vy*velocityScale} label={`vᵧ ${fmt(vy)} m/s`}/>
 <Arrow id={uid} x={600} y={170} dx={0} dy={70} color="amber" label="gravity"/>
 <path d={`M399 ${py(p.height)}V312M393 ${py(p.height)}h12M393 312h12`} fill="none" stroke="#85b8c7"/><text x="380" y={(py(p.height)+312)/2} textAnchor="end" className={s.number}>{p.height} m</text>
 <text x="446" y="366" textAnchor="middle" className={s.label}>Height {fmt(f.scene.bodies[0].y)} m</text><text x="446" y="391" textAnchor="middle" className={s.small}>Equal-time dots · closer together means slower motion</text>
 <text x={c.x(0)} y="415" textAnchor="middle" className={s.small}>Release platform · air resistance omitted</text>
 </>
}

function RampScene({ctx}:{ctx:Context}){const {parameters:p,uid,frame:f}=ctx,a=rad(p.angle),length=360,x=380,y=220,dx=Math.cos(a)*length/2,dy=Math.sin(a)*length/2,weight=value(f,'Weight'),normal=value(f,'Normal force'),tension=value(f,'Rope tension'),scale=90/Math.max(weight,1)
 return <><rect width="760" height="420" fill="#10293b"/><rect width="760" height="420" fill={`url(#${uid}-grid)`}/><Heading kicker="INCLINED PLANE · INTERACTION FORCES" title="Tilt the surface. Watch the normal force change."/>
 <path d={`M${x-dx} ${y-dy}L${x+dx} ${y+dy}H${x-dx}Z`} fill="#345366" stroke="#60879b" strokeWidth="2"/><path d={`M${x-dx} ${y-dy}L${x+dx} ${y+dy}`} stroke="#b1cbd5" strokeWidth="7"/>
 <g transform={`translate(${x},${y}) rotate(${p.angle})`}><Crate mass={p.mass}/>{p.held>0&&<><path d="M-29 -28H-165" stroke={ink.amber} strokeWidth="3"/><path d="M-165 -41v39M-172 -41h14" stroke="#b6c8d3" strokeWidth="5"/></>}</g>
 <Arrow id={uid} x={x+20} y={y-28} dx={0} dy={weight*scale} color="rose" label="weight"/>
 <Arrow id={uid} x={x+20} y={y-28} dx={normal*Math.sin(a)*scale} dy={-normal*Math.cos(a)*scale} color="cyan" label="normal"/>
 {tension>0&&<Arrow id={uid} x={x-18} y={y-36} dx={-tension*Math.cos(a)*scale} dy={-tension*Math.sin(a)*scale} color="amber" label="tension"/>}
 <line x1={x-dx} x2={x+dx} y1={y+dy+22} y2={y+dy+22} stroke="#698ea2" strokeDasharray="4 5"/>
 <text x="585" y="323" className={s.label}>θ = {p.angle}°</text><Badge x={28} y={367} width={234} tone={p.held?'amber':'cyan'}>{p.held?'HELD · FORCES BALANCED':'RELEASED · INSTANT OF RELEASE'}</Badge>
 <text x="728" y="389" textAnchor="end" className={s.small}>Arrows use one force scale · static force model</text>
 </>
}

function PulleyScene({ctx}:{ctx:Context}){const {uid,parameters:p,frame:f,history}=ctx,max=Math.max(.5,...history.map(h=>Math.abs(h.scene.pulley!.left))),scale=66/max,left=225-f.scene.pulley!.left*scale,right=225-f.scene.pulley!.right*scale,velocityScale=50/Math.max(1,...history.map(h=>Math.abs(value(h,'Right velocity'))))
 return <><rect width="760" height="420" fill="#10293b"/><rect width="760" height="420" fill={`url(#${uid}-grid)`}/><Heading kicker="ATWOOD MACHINE · COUPLED MOTION" title="The same rope links both accelerations."/>
 <path d="M153 353V93H607V353" fill="none" stroke="#304e62" strokeWidth="15"/><path d="M153 353V93H607" fill="none" stroke="#64869b" strokeWidth="3"/>
 <path d="M380 94V120" stroke="#a3c3d3" strokeWidth="7"/><circle cx="380" cy="151" r="38" fill="#34576d" stroke="#9bbfce" strokeWidth="4"/>
 <g transform={`rotate(${f.scene.pulley!.left*scale},380,151)`}>{[0,60,120].map(a=><path key={a} d="M350 151H410" transform={`rotate(${a},380,151)`} stroke="#7697aa" strokeWidth="4"/>)}</g><circle cx="380" cy="151" r="8" fill={`url(#${uid}-metal)`}/>
 <path d={`M342 ${left}V151A38 38 0 0 1 418 151V${right}`} fill="none" stroke={ink.amber} strokeWidth="3"/>
 {[{x:342,y:left,m:p.ma,color:ink.cyan,label:'LEFT'},{x:418,y:right,m:p.mb,color:ink.rose,label:'RIGHT'}].map(({x,y,m,color,label})=><g key={label}><rect x={x-25} y={y} width="50" height="46" rx="5" fill={color}/><path d={`M${x-21} ${y+5}H${x+21}`} stroke="#effaff" opacity=".5"/><text x={x} y={y+27} textAnchor="middle" fill="#163043" fontSize="13" fontWeight="700">{m} kg</text><text x={x} y={y+65} textAnchor="middle" className={s.small}>{label}</text></g>)}
 <Arrow id={uid} x={236} y={225} dx={0} dy={-value(f,'Right velocity')*velocityScale} label="left v"/>
 <Arrow id={uid} x={522} y={225} dx={0} dy={value(f,'Right velocity')*velocityScale} color="rose" label="right v"/>
 <path d="M127 359H633" stroke="#6f91a5" strokeWidth="4"/><text x="380" y="389" textAnchor="middle" className={s.small}>Equal travel · fixed scale within this trial · schematic</text>
 </>
}

function VectorScene({ctx}:{ctx:Context}){const {uid,frame:f,camera:c}=ctx,vectors=f.scene.vectors??[];return <><rect width="760" height="420" fill="#112e3b"/><rect width="760" height="420" fill={`url(#${uid}-grid)`}/><path d="M0 281Q140 201 196 324T408 364T760 278" fill="none" stroke="#254955" strokeWidth="32"/><Heading kicker="VECTOR SURVEY · PLAN VIEW" title="Follow the route. Then connect the endpoints."/>
 <WorldAxes c={c} xLabel="East (m)" yLabel="North (m)"/>
 {vectors.map((v,i)=>{const a=v.points[0],b=v.points[1],color=i===0?'cyan':i===1?'amber':'rose';return <g key={v.label}><line x1={c.x(a.x)} y1={c.y(a.y)} x2={c.x(b.x)} y2={c.y(a.y)} stroke={ink[color]} opacity=".2" strokeDasharray="3 5"/><line x1={c.x(b.x)} y1={c.y(a.y)} x2={c.x(b.x)} y2={c.y(b.y)} stroke={ink[color]} opacity=".2" strokeDasharray="3 5"/><Arrow id={uid} x={c.x(a.x)} y={c.y(a.y)+(i===2?4:0)} dx={c.x(b.x)-c.x(a.x)} dy={c.y(b.y)-c.y(a.y)} color={color} dashed={i===2}/><text x={(c.x(a.x)+c.x(b.x))/2+(i===2?-14:0)} y={Math.hypot(b.x-a.x,b.y-a.y)<1e-8?(i===2?c.y(a.y)-12:83+i*20):(c.y(a.y)+c.y(b.y))/2-12} textAnchor={i===2?"end":"middle"} className={s.label} style={{fill:ink[color]}}>{v.label}</text></g>})}
 {f.scene.bodies.map((b,i)=>i===1&&b.x===0&&b.y===0?null:<g key={b.label}><circle cx={c.x(b.x)} cy={c.y(b.y)} r="8" fill="#0e2636" stroke={i?ink.rose:ink.cyan} strokeWidth="3"/><text x={c.x(b.x)} y={c.y(b.y)+27} textAnchor="middle" className={s.label}>{i===0&&f.scene.bodies[1].x===0&&f.scene.bodies[1].y===0?'Start = finish':b.label}</text></g>)}
 <g transform="translate(697,119)"><path d="M0 -24L-7 0H7Z" fill={ink.cyan}/><path d="M0 24L-7 0H7Z" fill="#426779"/><text x="0" y="-32" textAnchor="middle" className={s.small}>N</text></g>
 </>}

function RiverScene({ctx}:{ctx:Context}){const {uid,camera:c,frame:f,parameters:p}=ctx,b=f.scene.bodies[0],north=c.y(p.width),south=c.y(0),flowShift=(f.time*p.current*3)%65
 return <><rect width="760" height="420" fill="#173e48"/><rect x="0" y={north} width="760" height={south-north} fill={`url(#${uid}-water)`}/><path d={`M0 ${north-8}Q120 ${north-17} 250 ${north-7}T760 ${north-8}M0 ${south+9}Q200 ${south+18} 400 ${south+8}T760 ${south+9}`} stroke="#729782" strokeWidth="15" fill="none"/>
 {Array.from({length:24},(_,i)=>{const x=(i*107+flowShift)%760,y=north+17+(i%5)*(south-north-34)/5;return <path key={i} d={`M${x} ${y}q12 -3 24 0`} fill="none" stroke="#8bcdd9" opacity=".18"/>})}
 <Heading kicker="RIVER CROSSING · VELOCITY ADDITION" title="Your heading is not always your path."/>
 {p.current>0&&[185,380,575].map(x=><Arrow key={x} id={uid} x={x-20} y={(north+south)/2} dx={Math.min(52,p.current*12)} color="blue"/>)}
 <Trail ctx={ctx}/><polyline points={line(ctx.history.filter(h=>h.time<=f.time).map(h=>h.scene.bodies[0]),c)} fill="none" stroke={ink.cyan} strokeWidth="2" opacity=".5"/>
 <g transform={`translate(${c.x(b.x)},${c.y(b.y)}) rotate(${p.angle}) scale(.7)`}><Boat id={uid}/><InvestigationActor x={0} y={9} height={24} width={24} pose="head"/></g>
 <path d={`M${c.x(0)-28} ${south+12}h56v15h-56Z`} fill="#ae9069"/><path d={`M${c.x(0)-22} ${south+15}v9m12-9v9m12-9v9m12-9v9`} stroke="#6f6252"/>
 <text x="28" y="392" className={s.small}>Current → {p.current} m/s · across-river distance {p.width} m</text><text x="728" y="392" textAnchor="end" className={s.small}>East → · North ↑</text>
 <g transform="translate(648,133)"><rect x="-96" y="-44" width="169" height="122" rx="8" fill="#0b2539" opacity=".93"/><text x="3" y="-27" textAnchor="middle" className={s.small}>Velocity vectors</text><Arrow id={uid} x={-30} y={54} dx={p.speed*Math.sin(rad(p.angle))*10} dy={-p.speed*Math.cos(rad(p.angle))*10} color="amber"/><Arrow id={uid} x={-30+p.speed*Math.sin(rad(p.angle))*10} y={54-p.speed*Math.cos(rad(p.angle))*10} dx={p.current*10} color="blue"/><Arrow id={uid} x={-30} y={54} dx={(p.current+p.speed*Math.sin(rad(p.angle)))*10} dy={-p.speed*Math.cos(rad(p.angle))*10}/></g>
 </>}

function FlightScene({ctx}:{ctx:Context}){const {uid,frame:f,camera:c,parameters:p,id}=ctx,target=id==='monkey-hunter',ground=c.y(0),b=f.scene.bodies[0],x=c.x(b.x),y=c.y(b.y)
 return <><Landscape id={uid} ground={ground}/><Heading kicker={target?'DROP INTERCEPT · SHARED GRAVITY':'LAUNCH RANGE · TWO-DIMENSIONAL MOTION'} title={target?'Both objects fall below the original aim line.':'Horizontal motion continues. Vertical motion changes.'}/>
 <WorldAxes c={c} xLabel="Horizontal position (m)" yLabel="Height (m)"/>
 <path d={`M${c.x(0)-25} ${c.y(target?0:p.height)+8}h50l-9 17h-32Z`} fill="#688699"/>
 <g transform={`translate(${c.x(0)},${c.y(target?0:p.height)}) rotate(${-value(f,'Initial aim')||(target?0:-p.angle)})`}><rect x="-10" y="-9" width="33" height="17" rx="4" fill={`url(#${uid}-metal)`}/><rect x="15" y="-7" width="10" height="13" fill="#24495f"/></g>
 {target&&<polyline points={line(f.scene.paths.find(q=>q.label==='Initial aim')!.points,c)} fill="none" stroke={ink.amber} strokeDasharray="6 5" opacity=".6"/>}
 <Trail ctx={ctx}/><polyline points={line(ctx.history.filter(h=>h.time<=f.time).map(h=>h.scene.bodies[0]),c)} fill="none" stroke={ink.cyan} strokeWidth="2" opacity=".7"/>
 {target&&f.time>0&&f.time<Math.min(Math.sqrt(2*p.y/9.8),2*p.speed*p.y/Math.hypot(p.x,p.y)/9.8)&&<g data-visual="equal-gravity-offsets"><circle cx={x} cy={c.y(p.speed*p.y/Math.hypot(p.x,p.y)*f.time)} r="7" fill="none" stroke={ink.amber} strokeDasharray="2 3"/><line x1={x} x2={x} y1={c.y(p.speed*p.y/Math.hypot(p.x,p.y)*f.time)} y2={y} stroke={ink.amber} strokeWidth="2"/><line x1={c.x(p.x)+24} x2={c.x(p.x)+24} y1={c.y(p.y)} y2={c.y(f.scene.bodies[1].y)} stroke={ink.amber} strokeWidth="2"/><text x={c.x(p.x)+34} y={c.y(p.y)+(c.y(f.scene.bodies[1].y)-c.y(p.y))/2+4} className={s.small} style={{fill:ink.amber}}>same drop</text></g>}
 <circle cx={x} cy={y-6} r="10" fill={`url(#${uid}-ball)`} stroke="#e1fff5"/>
 {target?<><Trail ctx={ctx} index={1} color={ink.rose}/><g transform={`translate(${c.x(f.scene.bodies[1].x)},${c.y(f.scene.bodies[1].y)-9})`}><circle r="17" fill="#ebeee6" stroke="#fc8496" strokeWidth="4"/><circle r="10" fill="none" stroke="#df596e" strokeWidth="4"/><circle r="3" fill="#df596e"/></g><text x={c.x(p.x)} y={c.y(p.y)-24} textAnchor="middle" className={s.small}>Target release</text></>:<><Arrow id={uid} x={x+14} y={y-15} dx={value(f,'Horizontal velocity')/30*65} label="vₓ"/><Arrow id={uid} x={x} y={y-15} dx={0} dy={-value(f,'Vertical velocity')/30*65} color="amber" label="vᵧ"/></>}
 </>}

function OrbitScene({ctx}:{ctx:Context}){const {uid,frame:f,camera:c,id,parameters:p}=ctx,b=f.scene.bodies[1],earth=f.scene.bodies[0],vx=id==='closing-speed'?-p.speed*Math.cos(rad(p.angle)):p.vx,vy=id==='closing-speed'?p.speed*Math.sin(rad(p.angle)):p.vy
 return <><Space id={uid}/><Heading kicker="MISSION OBSERVATORY · FICTIONAL SCENARIO" title={id==='predicting-2026-xj'?'Small velocity bounds become larger position bounds.':id==='closing-speed'?'Only the inward part of velocity closes the distance.':'Position is a vector. Distance is its length.'}/>
 <WorldAxes c={c} xLabel="x position (million km)" yLabel="y position (million km)"/>
 <polyline points={line(f.scene.paths[0].points,c)} fill="none" stroke={ink.cyan} strokeDasharray="5 7" opacity=".3"/>
 <Trail ctx={ctx} index={1}/><line x1={c.x(earth.x)} y1={c.y(earth.y)} x2={c.x(b.x)} y2={c.y(b.y)} stroke={ink.amber} strokeDasharray="4 5" opacity=".65"/>
 {id==='predicting-2026-xj'&&<polygon points={line(f.scene.paths[1].points,c)} stroke={ink.rose} strokeWidth="2" fill={ink.rose} fillOpacity=".15"/>}
 <g transform={`translate(${c.x(0)},${c.y(0)})`}><Earth id={uid}/><text y="43" textAnchor="middle" className={s.label}>Earth</text></g>
 {id==='predicting-2026-xj'&&<g transform={`translate(${c.x(b.x)>380?114:500},93)`} data-visual="forecast-detail"><rect width="174" height="131" rx="9" fill="#0c2236" stroke="#5d617c"/><text x="87" y="20" textAnchor="middle" className={s.small}>Envelope · magnified</text><path d="M25 70H149M87 35V105" stroke="#405b70" strokeDasharray="3 4"/><rect x={87-36*ctx.progress} y={70-36*ctx.progress} width={p.uncertainty>0?72*ctx.progress:0} height={p.uncertainty>0?72*ctx.progress:0} fill={ink.rose} fillOpacity=".13" stroke={ink.rose} strokeWidth="2"/><circle cx="87" cy="70" r="3" fill={ink.cyan}/><text x="87" y="120" textAnchor="middle" className={s.small}>±{fmt(value(f,'Bound ± per coordinate'))} million km / axis</text></g>}
 <g transform={`translate(${c.x(b.x)},${c.y(b.y)-(id==='predicting-2026-xj'?27:0)}) scale(.7)`}><Asteroid id={uid}/></g>
 {id==='predicting-2026-xj'&&<circle cx={c.x(b.x)} cy={c.y(b.y)} r="2" fill={ink.cyan}/>}
 {id==='closing-speed'&&value(f,'Distance from Earth')>1e-8&&<Arrow id={uid} x={c.x(b.x)} y={c.y(b.y)+24} dx={-b.x/value(f,'Distance from Earth')*value(f,'Closing speed')*6} dy={b.y/value(f,'Distance from Earth')*value(f,'Closing speed')*6} color="rose"/>}
 <Arrow id={uid} x={c.x(b.x)} y={c.y(b.y)-24} dx={vx*6} dy={-vy*6} label="velocity"/>
 <text x={c.x(b.x)} y={c.y(b.y)+37} textAnchor="middle" className={s.label}>Asteroid</text><text x="28" y="409" className={s.small}>Earth and asteroid are location markers · sizes not to scale</text>
 </>}

function MeasurementScene({ctx}:{ctx:Context}){const {uid,frame:f,parameters:p}=ctx,{reference,readings,division}=f.scene.ruler!,start=96,scale=35,zx=(n:number)=>380+(n-12.34)*170
 return <><rect width="760" height="420" fill="#102b3c"/><rect width="760" height="420" fill={`url(#${uid}-grid)`}/><Heading kicker="METROLOGY BENCH · PRECISION & CALIBRATION" title="A precise cluster can still miss the reference."/>
 <rect x={start} y="111" width={reference*scale} height="33" rx="4" fill={`url(#${uid}-metal)`} stroke="#cce0e8"/><path d={`M${start+8} 116H${start+reference*scale-8}`} stroke="#fff" opacity=".5"/><text x={start+reference*scale/2} y="133" textAnchor="middle" fill="#234355" fontSize="12" fontWeight="600">REFERENCE BAR · 12.34 cm</text>
 <rect x={start-13} y="155" width="555" height="59" rx="5" fill="#dbbb7b" stroke="#f1dba7"/>
 {Array.from({length:Math.round(15/division)+1},(_,i)=>{const v=i*division,whole=Math.abs(v-Math.round(v))<1e-6;return <g key={i}><path d={`M${start+v*scale} 155v${whole?24:11}`} stroke="#625337" strokeWidth={whole?1.5:.7}/>{whole&&<text x={start+v*scale} y="199" textAnchor="middle" fill="#4e4738" fontSize="12">{Math.round(v)}</text>}</g>})}<text x="631" y="201" fill="#4e4738" fontSize="11">cm</text>
 <path d={`M${start+reference*scale} 104V224`} stroke={ink.rose} strokeWidth="2" strokeDasharray="4 4"/>
 <text x="28" y="259" className={s.eyebrow}>READING DISTRIBUTION · ENLARGED SCALE</text><line x1="111" x2="649" y1="314" y2="314" stroke="#6c97ae"/>
 <line x1={zx(reference)} x2={zx(reference)} y1="276" y2="332" stroke={ink.rose} strokeWidth="2"/><text x={zx(reference)} y="355" textAnchor="middle" className={s.small}>Reference 12.34</text>
 {readings.map((n,i)=><g key={i}><circle cx={zx(n)} cy={303-i*4} r="6" fill={ink.cyan} stroke="#0c283c" strokeWidth="1.5"/><text x={128+i*126} y="389" textAnchor="middle" className={s.number}>{fmt(n)} cm</text></g>)}
 <Badge x={568} y={26} width={164} tone={p.bias===0?'cyan':'amber'}>{p.bias===0?'ZERO ALIGNED':`OFFSET ${fmt(p.bias)} cm`}</Badge>
 </>}

function Explanation({ctx}:{ctx:Context}){const {id,frame:f,parameters:p}=ctx
 if(id==='astronaut-thrust')return <Cue tag={f.time<p.burn&&p.force!==0?'Thrust active':'Coasting'}>{f.time<p.burn&&p.force!==0?'The amber force arrow changes the cyan velocity arrow. Exhaust points opposite the force; each trail dot marks the same time interval.':`The exhaust is off and acceleration is zero. Velocity stays at ${fmt(value(f,'Velocity'))} m/s, so ${Math.abs(value(f,'Velocity'))<1e-8?'the astronaut stays at rest':'the astronaut keeps moving and new trail dots are equally spaced'}.`}</Cue>
 if(id==='friction-lab')return <Cue tag={String(f.metrics.find(m=>m.label==='State')?.value)}>{f.note} Compare the opposing arrows: equal lengths mean zero horizontal acceleration.</Cue>
 if(id==='carts-third-law')return <Cue tag={f.time<value(f,'Contact ends')?'Contact':'Released'}>{f.note} The cyan and coral carts keep their own equal-time trails.</Cue>
 if(id==='vacuum-chamber')return <Cue tag={p.pressure===0?'Air removed':'Drag present'}>{p.pressure===0?'Both objects accelerate equally. Their heights and equal-time trails match even though their masses differ.':'The same drag model slows the lighter object more. Compare the heights at the same instant, then remove the air.'}</Cue>
 if(id==='riverboat-crossing')return <Cue tag="Add the vectors">Amber is the boat through water; blue is the current; cyan is motion over ground. The bow shows heading. The trail shows the actual path.</Cue>
 if(id==='incline-lab')return <Cue tag={p.held?'Held':'Released'}>Weight always points straight down. The normal force is perpendicular to the ramp. {p.held?'The rope balances gravity along the slope.':'With the rope removed, the forces leave a downhill acceleration; this view inspects the release instant.'}</Cue>
 if(id==='maze-vectors')return <Cue tag="Route ≠ displacement">Cyan and amber show the two legs, with faint component guides. The coral resultant connects start to finish. Reversing the order changes the route, not the endpoint.</Cue>
 if(id==='measurement-precision')return <Cue tag="Read the evidence">The ruler shows its actual divisions. Below it, the spread of five readings shows repeatability; their distance from the coral reference shows calibration error.</Cue>
 if(id==='monkey-hunter')return <Cue tag="Shared gravity">The dashed amber line is the initial aim. Both objects acquire the same downward gravitational offset until contact with the ground. {f.note}</Cue>
 if(id==='projectile-motion')return <Cue tag="Two components">The cyan horizontal velocity stays constant; the amber vertical velocity changes. Trail dots mark equal times, so the horizontal spacing stays equal.</Cue>
 if(id==='atwood-machine')return <Cue tag="One connected system">The masses move by equal distances in opposite directions. Velocity arrows show motion; use Forces to compare tension and weight. The drawing keeps one scale throughout this trial.</Cue>
 if(id==='freefall-cliff')return <Cue tag="Read the spacing">Dots are equally spaced in time. Growing gaps show increasing speed. At the top of an upward throw, vertical velocity is zero but gravity still points down.</Cue>
 if(id==='predicting-2026-xj')return <Cue tag="Bounded forecast">The coral rectangle shows independent position bounds in x and y. It expands with elapsed time. It is a bound, not a probability region or an impact forecast.</Cue>
 if(id==='closing-speed'||id==='asteroid-trajectory')return <Cue tag="Read the geometry">The amber line measures distance to Earth. The cyan arrow shows velocity. {id==='closing-speed'?'The coral arrow is its radial component; the rest is sideways motion.':'Sideways motion can contribute to speed without contributing equally to closing speed.'}</Cue>
 if(id==='car-race')return <Cue tag="Compare positions">Each lane shares the same position scale. The cars meet when their positions line up, even if their speeds differ. Watch B wait until its start delay ends.</Cue>
 if(id==='free-body-diagram')return <Cue tag="Trace each interaction">Switch to Forces to see gravity, contact, and applied pushes separately. The normal force decreases as the upward pull increases; the table cannot pull down.</Cue>
 return <Cue tag="Read the motion">Each dot marks {id==='uniformly-accelerated-motion'?'one second':'an equal time interval'}. Wider gaps mean higher speed. Watch the direction and spacing when velocity changes or reverses.</Cue>
}

export function SceneVisual(props:Props){
 const participant=useInvestigationParticipation()
 const uid='scene'+useId().replaceAll(':',''),{id,parameters,frame,progress}=props
 const history=useMemo(()=>Array.from({length:81},(_,i)=>investigationFrame(id,parameters,i/80)),[id,parameters])
 const dots=useMemo(()=>{const duration=history[0].duration,step=id==='uniformly-accelerated-motion'?1:duration/12;return duration>0?Array.from({length:Math.floor(duration/step)+1},(_,i)=>investigationFrame(id,parameters,i*step/duration)):[history[0]]},[history,id,parameters])
 const camera=useMemo(()=>cameraFor(history,frame.scene.kind==='plane'),[history,frame.scene.kind])
 const ctx={...props,uid,history,dots,camera},scene=frame.scene
 let content:ReactNode
 if(id==='astronaut-thrust')content=<AstronautScene ctx={ctx}/>
 else if(id==='incline-lab')content=<RampScene ctx={ctx}/>
 else if(id==='atwood-machine')content=<PulleyScene ctx={ctx}/>
 else if(id==='measurement-precision')content=<MeasurementScene ctx={ctx}/>
 else if(id==='maze-vectors')content=<VectorScene ctx={ctx}/>
 else if(id==='riverboat-crossing')content=<RiverScene ctx={ctx}/>
 else if(id==='projectile-motion'||id==='monkey-hunter')content=<FlightScene ctx={ctx}/>
 else if(id==='freefall-cliff'||id==='vacuum-chamber')content=<FallScene ctx={ctx}/>
 else if(['asteroid-trajectory','closing-speed','predicting-2026-xj'].includes(id))content=<OrbitScene ctx={ctx}/>
 else content=<TrackScene ctx={ctx}/>
 return <div className={s.scene} data-scene={id} data-progress={progress.toFixed(3)}><svg viewBox="0 0 760 510" className={s.canvas} role="img" aria-label={`${id.replaceAll('-',' ')} at ${fmt(frame.time)} seconds. ${scene.bodies.map(b=>`${b.label}: x ${fmt(b.x)}, y ${fmt(b.y)}`).join('; ')}. ${frame.metrics.slice(0,4).map(m=>`${m.label} ${fmt(m.value)} ${m.unit}`).join('. ')}`}><SceneDefs id={uid}/>{content}{participant?.active&&<><rect x="0" y="420" width="760" height="90" fill="#10293b"/>{!(['astronaut-thrust','riverboat-crossing','car-race'].includes(id)||scene.bodies[0]?.shape==='person')&&<InvestigationActor x={43} y={501} height={74}/>}<text x="86" y="446" fill="#b6e8db" fontSize="14">{SIMULATION_ROLES[id]}</text><text x="86" y="472" fill="#eef5f3" fontSize="14">{frame.metrics.slice(0,2).map(m=>m.label+': '+fmt(m.value)+' '+m.unit).join(' · ')}</text><text x="86" y="494" fill="#a7c0c9" fontSize="12">Capture two observations below. Compare one changed condition.</text></>}</svg><Explanation ctx={ctx}/></div>
}
