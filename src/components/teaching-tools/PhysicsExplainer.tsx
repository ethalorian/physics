'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ContentBlock } from '@/data/content-blocks'
import type { MeasurementState } from '@/lib/teaching-tool-spec'
import { PHYSICS_DEFAULTS, deflection, dimensionName, motionAt, walkAt, type PhysicsControls, type PhysicsModel } from '@/lib/physics-explainer'
import styles from './PhysicsExplainer.module.css'

const fmt = (n:number) => (Math.abs(n)<0.00005?0:n).toFixed(2)
function Plot({points,label,cursor,secant}:{points:[number,number][];label:string;cursor?:number;secant?:[number,number][]}) {
  const all=[...points,...(secant??[])], maxX=Math.max(1,...all.map(p=>p[0])),lo=Math.min(0,...all.map(p=>p[1])),hi=Math.max(1,...all.map(p=>p[1])),span=hi-lo
  const X=(x:number)=>85+400*x/maxX,Y=(y:number)=>165-130*(y-lo)/span
  return <svg viewBox="0 0 520 215" role="img" aria-label={label}><title>{label}</title>
    {[0,.5,1].map(p=><g key={p}><line x1="85" x2="485" y1={35+130*p} y2={35+130*p} className={styles.grid}/><text x="78" y={40+130*p} textAnchor="end">{Number((hi-p*span).toFixed(1))}</text><text x={85+400*p} y="186" textAnchor="middle">{Number((maxX*p).toFixed(1))}</text></g>)}
    <line x1="85" x2="485" y1={Y(0)} y2={Y(0)} className={styles.axis}/><polyline points={points.map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')} className={styles.curve}/>
    {secant&&<polyline points={secant.map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')} className={styles.secant}/>}
    {cursor!==undefined&&<line x1={X(cursor)} x2={X(cursor)} y1="30" y2="169" className={styles.cursor}/>}<text x="275" y="208" textAnchor="middle">{label}</text>
  </svg>
}
function PhysicsVisual({model,state}:{model:PhysicsModel;state:MeasurementState}) {
 const s={...PHYSICS_DEFAULTS,...state}
 if(model==='dimensions')return <div className={styles.dimension}><p>Mass × length × time</p><strong>M<sup>{s.massPower}</sup> L<sup>{s.lengthPower}</sup> T<sup>{s.timePower}</sup></strong><p>kg<sup>{s.massPower}</sup> m<sup>{s.lengthPower}</sup> s<sup>{s.timePower}</sup></p><p>{dimensionName(s.massPower,s.lengthPower,s.timePower)}</p></div>
 if(model==='walk') {
  const p=walkAt(s.time,s.path), px=(x:number)=>70+x*12,py=(y:number)=>225-y*16, path=s.path==='square'?'M70 225 H166 V97 H70 Z':`M70 225 H${s.path==='straight'?454:262}`
  return <div><svg viewBox="0 0 540 285" role="img" aria-label="Walk path and displacement from the start"><path d={path} className={styles.route}/><line x1="70" y1="225" x2={px(p.x)} y2={py(p.y)} className={styles.curve}/><circle cx="70" cy="225" r="5" fill="currentColor"/><circle cx={px(p.x)} cy={py(p.y)} r="11" className={styles.walker}/><text x="55" y="257">Start · east → · north ↑</text><text x="55" y="35">Time {fmt(s.time)} s · speed 4 m/s along each segment</text></svg><div className={styles.readouts}><span>Distance <b>{fmt(p.distance)} m</b></span><span>Displacement <b>({fmt(p.x)} E, {fmt(p.y)} N) m</b></span><span>Magnitude <b>{fmt(Math.hypot(p.x,p.y))} m</b></span></div><p className={styles.caption}>Idealized corners. Velocity at the exact instant of a sharp turn is undefined; at the end we report distance and displacement just before stopping.</p></div>
 }
 if(model==='deflection') {
  const p=deflection(s.burn,s.angle),endY=200-400*p.vy/p.vx
  return <div><svg viewBox="0 0 540 300" role="img" aria-label="Toy asteroid trajectory after the burn"><title>Toy asteroid trajectory after the burn</title><circle cx="450" cy="200" r="20" className={styles.earth}/><text x="450" y="240" textAnchor="middle">Earth</text><circle cx="50" cy="200" r="7" fill="currentColor"/><text x="40" y="235">Asteroid</text><path d="M50 200 H450" className={styles.route}/><line x1="50" y1="200" x2="450" y2={endY} className={styles.curve}/><line x1="50" y1="200" x2={50+45*s.burn*Math.cos(s.angle*Math.PI/180)} y2={200-45*s.burn*Math.sin(s.angle*Math.PI/180)} className={styles.secant}/><text x="30" y="35">Indigo: new path · sage: burn vector</text></svg><div className={styles.readouts}><span>New speed <b>{fmt(p.speed)} km/s</b></span><span>Heading <b>{fmt(p.heading)}°</b></span><span>Closest approach <b>{fmt(p.closest)} Earth radii</b></span></div><p className={styles.caption}>{p.hit?'Path intersects Earth':'Path misses Earth'} in this toy model. Distance measured from Earth’s center; Earth’s radius = 1. Start = 20 radii, initial velocity = 8 km/s, Earth fixed, no gravity.</p></div>
 }
 if(model==='derivative') {
  const t=Math.min(6,s.time),h=s.interval,points=Array.from({length:81},(_,i)=>[i/10,(i/10)**2] as [number,number])
  return <div><Plot points={points} label="Position x (m) versus time t (s)" cursor={t} secant={[[t,t*t],[t+h,(t+h)**2]]}/><div className={styles.readouts}><span>Interval <b>{fmt(h)} s</b></span><span>Secant slope <b>{fmt(2*t+h)} m/s</b></span><span>Tangent slope <b>{fmt(2*t)} m/s</b></span></div><p className={styles.caption}>x = t² m. The green secant connects two measured positions. The instantaneous velocity is the limiting slope as Δt → 0.</p></div>
 }
 const ramp=model==='ramp',a=ramp?9.81*s.height/100:s.acceleration,v0=ramp?0:s.v0,x0=ramp?0:s.x0,T=ramp?Math.sqrt(1.6/a):8,t=ramp?s.time/8*T:s.time,p=motionAt(t,x0,v0,a),values=Array.from({length:65},(_,i)=>{const at=i*T/64;return {t:at,...motionAt(at,x0,v0,a)}})
 return <div><div className={styles.graphs}><Plot points={values.map(p=>[p.t,p.x])} label="x (m) vs t (s)" cursor={t}/><Plot points={values.map(p=>[p.t,p.v])} label="v (m/s) vs t (s)" cursor={t}/><Plot points={values.map(p=>[p.t,p.a])} label="a (m/s²) vs t (s)" cursor={t}/></div><div className={styles.readouts}><span>Time <b>{fmt(t)} s</b></span><span>Position <b>{fmt(p.x)} m</b></span><span>Velocity <b>{fmt(p.v)} m/s</b></span><span>Acceleration <b>{fmt(a)} m/s²</b></span></div><p className={styles.caption}>{ramp?'Simulated ideal ramp: 1 m track, release from rest, downhill positive, 0.8 m run. Wheel rotation, friction, and sensor noise are omitted.':'Constant acceleration, one dimension. Positive x points right. Graph scales adjust when settings change; read the labeled axes.'}</p></div>
}
function ModelControls({model,state,onChange,disabled}:{model:PhysicsModel;state:MeasurementState;onChange:(s:Partial<MeasurementState>)=>void;disabled?:boolean}) {
 const [draft,setDraft]=useState({...PHYSICS_DEFAULTS,...state})
 const sliders: [keyof PhysicsControls,string,number,number,number][] = model==='dimensions' ? [['massPower','Mass exponent',-3,3,1],['lengthPower','Length exponent',-3,3,1],['timePower','Time exponent',-3,3,1]] : model==='deflection' ? [['burn','Burn Δv (km/s)',0,4,.1],['angle','Burn direction (degrees)',-180,180,5]] : model==='derivative' ? [['time','Time t (s)',0,6,.1],['interval','Interval Δt (s)',.01,2,.01]] : model==='ramp' ? [['height','Ramp rise (cm)',1,20,.5],['time','Run progress (0–8)',0,8,.1]] : model==='walk' ? [['time','Time (s)',0,8,.1]] : [['x0','Initial position (m)',-20,20,1],['v0','Initial velocity (m/s)',-20,20,.5],['acceleration','Acceleration (m/s²)',-10,10,.1],['time','Time (s)',0,8,.1]]
 return <fieldset disabled={disabled} className={styles.controls}><legend>Model settings</legend>{model==='walk'&&<label>Path<select value={draft.path} onChange={e=>setDraft({...draft,path:e.target.value as typeof draft.path})}><option value="return">Out and back</option><option value="square">Around a square</option><option value="straight">Straight line</option></select></label>}{sliders.map(([key,label,min,max,step])=><label key={key}>{label}<output>{draft[key]}</output><input aria-label={label} type="range" value={Number(draft[key])} min={min} max={max} step={step} onChange={e=>setDraft({...draft,[key]:Number(e.target.value)})}/></label>)}<Button onClick={()=>onChange(Object.fromEntries([...sliders.map(([key])=>[key,draft[key]]),...(model==='walk'?[['path',draft.path]]:[])]))}>Apply model settings</Button><p>Adjust, predict, then apply to the classroom screen.</p></fieldset>
}
export default function PhysicsExplainer({block,state,onChange,disabled,showControls,controlsOnly=false}:{block:ContentBlock;state:MeasurementState;onChange:(p:Partial<MeasurementState>)=>void;disabled?:boolean;showControls:boolean;controlsOnly?:boolean}) {
 const tool=block.teachingTool
 if(tool?.kind!=='physics-explainer')return null
 const index=Math.max(0,Math.min(tool.frames.length-1,state.frame??0)),frame=tool.frames[index]
 return <section className={`${styles.explainer} ${showControls?styles.remote:styles.projector}`} aria-label="Physics explainer">
   <header><span>Antocci Physics</span><span>{index+1} / {tool.frames.length}</span></header>
   {showControls&&<nav aria-label="Explainer slides"><Button variant="outline" disabled={disabled||index===0} onClick={()=>onChange({frame:index-1,show:false})}>Previous</Button><select aria-label="Explainer slide" value={index} disabled={disabled} onChange={e=>onChange({frame:Number(e.target.value),show:false})}>{tool.frames.map((f,i)=><option key={i} value={i}>{i+1}. {f.title}</option>)}</select><Button disabled={disabled||index===tool.frames.length-1} onClick={()=>onChange({frame:index+1,show:false})}>Next</Button></nav>}
   {!controlsOnly&&<><h2>{frame.title}</h2><p className={styles.body}>{frame.body}</p>
   {frame.model&&<PhysicsVisual model={frame.model} state={state}/>}
   <div className={styles.prompt}><strong>{frame.discussion?'Group discussion':'Predict · explain'}</strong><p>{frame.prompt}</p></div>
   {state.show&&frame.reasoning&&<div className={styles.reasoning} role="status"><strong>Reasoning</strong><p>{frame.reasoning}</p></div>}
   </>}
   {showControls&&<><Button className="min-h-12" variant="outline" disabled={disabled} aria-pressed={state.show} onClick={()=>onChange({show:!state.show})}>{state.show?'Hide reasoning':'Reveal reasoning'}</Button>{frame.model&&<ModelControls key={`${index}-${JSON.stringify(state)}`} model={frame.model} state={state} onChange={onChange} disabled={disabled}/>}</>}
 </section>
}
