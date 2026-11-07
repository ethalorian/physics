'use client'
import { useState } from 'react'
import s from './etf-edition.module.css'

function Ballast() {
  const [fill,setFill]=useState(1)
  const labels=['Water pumped out','Balanced','Water taken aboard'],depth=[32,61,96][fill]
  return <section className={s.model}><p className={s.kicker}>Design experiment · Bob Brown</p><h3>Hold depth in the Alvin</h3><p>Change the water in a model ballast tank. Compare the vehicle’s weight with the buoyant force at the same external volume.</p><svg viewBox="0 0 330 155" role="img" aria-label={labels[fill]+'. The model vehicle '+['rises','hovers','sinks'][fill]+'.'}><rect width="330" height="155" rx="8" fill="#d9efeb"/><path d="M0 16 Q30 9 60 16 T120 16 T180 16 T240 16 T300 16 T360 16" fill="none" stroke="#307e87" strokeWidth="3"/><g className={s.moving} style={{transform:'translate(123px,'+depth+'px)'}}><path d="M-47 20 Q-28 -5 2 0 Q42 2 60 20 L43 32 H-40Z" fill="#e4b566" stroke="#284a48" strokeWidth="2"/><circle cx="-4" cy="9" r="6" fill="#466d73"/><path d="M-44 30H47" stroke="#284a48" strokeWidth="3"/></g><g transform="translate(235 44)"><rect width="52" height="64" rx="5" fill="#fff" stroke="#284a48" strokeWidth="2"/><rect x="3" y={55-fill*22} width="46" height={6+fill*22} fill="#54a4ae"/><text x="26" y="78" textAnchor="middle" fontSize="10" fill="#23423c">BALLAST</text></g></svg><div className={s.controls}>{labels.map((v,i)=><button type="button" key={v} aria-pressed={i===fill} onClick={()=>setFill(i)}>{v}</button>)}</div><p aria-live="polite">{['Less water aboard means less weight. Buoyancy now exceeds weight, so the vehicle starts rising.','The upward buoyant force balances the vehicle’s weight. Starting at rest, it can hover.','More water aboard means greater weight. Weight now exceeds buoyancy, so the vehicle starts sinking.'][fill]}</p></section>
}

function Circuit() {
  const [lamps,setLamps]=useState([true,true])
  return <section className={s.model}><p className={s.kicker}>Design experiment · Ken McAuliffe</p><h3>Open one lighting branch</h3><p>Predict what the other lamp will do. Then open or close either branch.</p><svg viewBox="0 0 330 145" role="img" aria-label={lamps.map((on,i)=>'Lamp '+(i+1)+(on?' on':' off')).join(', ')}><rect width="330" height="145" rx="8" fill="#f2efe3"/><g fill="none" stroke="#344b48" strokeWidth="3"><path d="M40 62V26H275 M40 83V116H275"/><path d="M23 63H57 M30 74H50 M23 84H57"/></g>{lamps.map((on,i)=>{const x=143+i*117;return <g key={i} transform={'translate('+x+' 0)'}><path d="M0 26V38 M0 55V67 M0 95V116" stroke="#344b48" strokeWidth="3"/><path className={s.moving} d={on?'M0 39V55':'M0 39L-15 53'} stroke="#246f60" strokeWidth="4"/><circle cx="0" cy="81" r="15" fill={on?'#ffcf60':'#d0d5ca'} stroke="#344b48" strokeWidth="2"/><path d="M-8 86 L-4 75 L2 86 L7 75" fill="none" stroke="#493f2e" strokeWidth="2"/>{on&&<g stroke="#ba8523" strokeWidth="2"><path d="M-20 70L-24 67 M20 70L24 67 M-22 82H-28 M22 82H28"/></g>}</g>})}</svg><div className={s.controls}>{lamps.map((on,i)=><button key={i} type="button" aria-pressed={on} onClick={()=>setLamps(v=>v.map((old,j)=>j===i?!old:old))}>{'Branch '+(i+1)+(on?' · closed':' · open')}</button>)}</div><p aria-live="polite">{lamps.every(Boolean)?'Both lamps have a closed path across the source.':lamps.some(Boolean)?'Only the branch with a closed path lights. Both branches connect to the same supply terminals.':'Both paths are open. Neither lamp lights.'}</p></section>
}

function Views() {
  const [view,setView]=useState(0)
  const names=['Corner view','Front','Top','Right'], outlines=['M75 93L151 55L235 89L155 132Z M75 93V61L151 24L235 58V89 M75 61L155 99L235 58 M155 99V132','M80 54H230V105H80Z','M80 40H230V119H80Z','M104 54H206V105H104Z']
  return <section className={s.model}><p className={s.kicker}>Drawing experiment · Lam Loc</p><h3>Read one block from four directions</h3><p>The solid is a rectangular block. Choose a view and identify which dimension disappears along your line of sight.</p><svg viewBox="0 0 310 156" role="img" aria-label={names[view]+' of a rectangular block'}><rect width="310" height="156" rx="8" fill="#ecf0e5"/><path key={view} className={s.trace} d={outlines[view]} fill="none" stroke="#2a6a5b" strokeWidth="3" pathLength="1"/></svg><div className={s.controls}>{names.map((v,i)=><button type="button" aria-pressed={view===i} key={v} onClick={()=>setView(i)}>{v}</button>)}</div><p aria-live="polite">{['Three faces reveal length, width and height together.','The front view shows length and height. Depth lies along the line of sight.','The top view shows the footprint. The height disappears.','The right view shows depth and height. Match its height to the front view.'][view]}</p></section>
}
export default function EtfBenchModel({chapter}:{chapter:number}) {
  if(chapter===4) return <Views/>
  if(chapter===17) return <Ballast/>
  if(chapter===30) return <Circuit/>
  return null
}
