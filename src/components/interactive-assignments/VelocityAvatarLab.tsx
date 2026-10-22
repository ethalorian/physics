'use client'

import { memo, useEffect, useId, useState } from 'react'
import Avatar from '@/components/avatar/Avatar'
import AvatarCharacter, { EmptyStudentDesk } from '@/components/avatar/AvatarCharacter'
import CustomizeAvatarLink from '@/components/avatar/CustomizeAvatarLink'
import teacher from '@/data/physics-coach-avatar.json'
import type { AvatarItem, AvatarTraits, EquippedItems } from '@/lib/avatar/types'
import { STORY_LANGUAGES } from '@/components/readings/interactive/reader-story-content'
import { GRAPH_TARGETS, type VelocityState } from '@/lib/interactive-assignments/velocity'
import { journeyMetrics, MOTION_BOUNDS, MOTION_SECONDS, positionAt } from '@/lib/interactive-assignments/velocity-lab'
import { useAssignmentAvatar } from './AssignmentAvatar'
import { ChoiceResponse } from './QuestionResponse'
import { VELOCITY_LAB_COPY } from './velocity-lab-copy'
import s from './velocity-lab.module.css'

const LabCharacter = memo(AvatarCharacter)
const number = (value: number) => (Math.abs(value) < .005 ? 0 : value).toFixed(1)
const signed = (value: number) => `${value > .005 ? '+' : ''}${number(value)}`

function PositionGraph({ start, velocity, time, copy, target }: {
 start: number; velocity: number; time: number; copy: typeof VELOCITY_LAB_COPY.en; target: typeof GRAPH_TARGETS[number]
}) {
 const id = useId(), y = (position: number) => 210 - (position + 20) * 3.6, x = (t: number) => 50 + t * 27
 return <svg viewBox="0 0 350 254" className={s.graph} role="img" aria-label={`${copy.graphLabel}: ${copy.position} ${number(positionAt(start, velocity, time))} m; ${copy.time} ${number(time)} s`}>
  <title>{copy.graphLabel}</title><defs><clipPath id={id}><rect x="50" y="28" width="270" height="183"/></clipPath></defs>
  {[-20,-10,0,10,20,30].map(n=><g key={n}><path d={`M50 ${y(n)}H320`} className={s.grid}/><text x="43" y={y(n)+4} textAnchor="end" className="notranslate">{n}</text></g>)}
  {[0,2,4,6,8,10].map(t=><g key={t}><path d={`M${x(t)} 30V210`} className={s.grid}/><text x={x(t)} y="227" textAnchor="middle" className="notranslate">{t}</text></g>)}
  <path d={`M50 28V210H325 M50 ${y(0)}H320`} className={s.axis}/>
  <g clipPath={`url(#${id})`}><path d={`M50 ${y(target.start)}L320 ${y(positionAt(target.start,target.velocity,10))}`} className={s.targetLine}/><path d={`M50 ${y(start)}L320 ${y(positionAt(start,velocity,10))}`} className={s.modelLine}/><path d={`M${x(time)} 30V210`} className={s.cursor}/></g><circle cx={x(time)} cy={y(positionAt(start,velocity,time))} r="5" className={s.point}/>
  <text x="185" y="249" textAnchor="middle">{copy.axisTime}</text><text transform="translate(13 120) rotate(-90)" textAnchor="middle">{copy.axisPosition}</text>
 </svg>
}

/** Exploration uses the existing saved walk/graph/explorers fields. Playback never writes on each frame. */
export default function VelocityAvatarLab({ part, state, onChange, readOnly = false }: {
 part: 1 | 2 | 4; state: VelocityState; onChange: (state: VelocityState) => void; readOnly?: boolean
}) {
 const classroom = useAssignmentAvatar(), id = useId()
 const language = classroom?.language ?? 'en', copy = VELOCITY_LAB_COPY[language]
 const experiment = `velocity-${part}`, active = classroom?.active === experiment
 const [time,setTime] = useState(0), [running,setRunning] = useState(false), [stepping,setStepping] = useState(false), [tested,setTested] = useState(false)
 const seconds = [0.5,1,2].includes(state.explorers?.['velocity-step-time']?.[0] ?? 1) ? (state.explorers?.['velocity-step-time']?.[0] ?? 1) : 1
 const route = state.walker, pos = route.at(-1) ?? 0, steps = route.length - 1
 const duration = part === 4 ? MOTION_SECONDS : steps * seconds
 const moment = Math.min(time,duration), trip = journeyMetrics(route,seconds,part === 1 ? undefined : moment)
 const target = GRAPH_TARGETS[state.graph.target], graphMatched = Math.abs(state.graph.start-target.start)<.01 && Math.abs(state.graph.velocity-target.velocity)<.01
 const moving = active && (part === 1 ? stepping : running && moment < duration && (part !== 4 || state.graph.velocity !== 0))
 const routeIndex=Math.min(Math.max(0,steps-1),Math.floor(moment/seconds))
 const direction=part===4?Math.sign(state.graph.velocity):part===1?Math.sign(pos-(route.at(-2)??pos)):Math.sign((route[routeIndex+1]??0)-(route[routeIndex]??0))
 const value = part === 4 ? positionAt(state.graph.start,state.graph.velocity,moment) : trip.position
 const bounds = part === 4 ? MOTION_BOUNDS : [-5,5], ticks = part === 4 ? [-20,-10,0,10,20,30] : [-5,-4,-3,-2,-1,0,1,2,3,4,5]
 const percent = (position: number) => 8 + (position-bounds[0])/(bounds[1]-bounds[0])*84
 const sceneIndex = part === 1 ? 0 : part === 2 ? 1 : 2
 const predictionKey = part === 4 ? 'velocity-graph-prediction' : 'velocity-walk-prediction'
 const prediction = state.explorers?.[predictionKey]?.[0]
 const save = (patch: Partial<VelocityState>) => { if (!readOnly) onChange({...state,...patch}) }
 const saveExplorer = (key: string, value: number) => save({explorers:{...state.explorers,[key]:[value]}})
 const enter = () => { if (!readOnly) { classroom?.setActive(experiment); setTested(true) } }
 const setGraph = (patch: Partial<VelocityState['graph']>) => {
  const graph = {...state.graph,...patch}, t = GRAPH_TARGETS[graph.target]
  setRunning(false); setTime(0)
  save({graph,matches:Math.abs(graph.start-t.start)<.01&&Math.abs(graph.velocity-t.velocity)<.01?{...state.matches,[graph.target]:{start:graph.start,velocity:graph.velocity}}:state.matches})
 }
 const walk = (direction: number) => { enter(); setStepping(true); save({walker:[...route,pos+direction]}) }

 useEffect(() => { if (!stepping) return; const timer = window.setTimeout(()=>setStepping(false),540); return ()=>window.clearTimeout(timer) },[stepping,pos])
 useEffect(() => { setTime(0); setRunning(false) },[route,seconds])
 useEffect(() => { if (!active || !classroom?.workVisible || readOnly) setRunning(false) },[active,classroom?.workVisible,readOnly])
 useEffect(() => {
  const pause = () => { if (document.hidden) setRunning(false) }
  document.addEventListener('visibilitychange',pause)
  return ()=>document.removeEventListener('visibilitychange',pause)
 },[])
 useEffect(() => {
  if (!running || !active || !classroom?.workVisible || readOnly) return
  let previous = performance.now(),frame=0
  const tick=(now:number)=>{const delta=Math.min(.1,(now-previous)/1000);previous=now;setTime(t=>Math.min(duration,t+delta));frame=requestAnimationFrame(tick)}
  frame=requestAnimationFrame(tick)
  return ()=>cancelAnimationFrame(frame)
 },[running,active,classroom?.workVisible,readOnly,duration])
 useEffect(() => { if (time >= duration) setRunning(false) },[time,duration])

 const metrics = part === 4 ? [[copy.time,`${number(moment)} s`],[copy.position,`${signed(value)} m`],[copy.slope,`${signed(state.graph.velocity)} m/s`]] : [
  [copy.distance,`${number(trip.distance)} m`],[copy.displacement,`${signed(trip.displacement)} m`],
  ...(part === 2 ? [[copy.time,`${number(moment)} s`],[copy.speed,trip.speed===null?null:`${number(trip.speed)} m/s`],[copy.velocity,trip.velocity===null?null:`${signed(trip.velocity)} m/s`]] : []),
 ]
 return <section className={s.lab} lang={language} translate="yes" aria-labelledby={`${id}-title`} data-velocity-lab={part}>
  <header className={s.header}><div><p className={s.eyebrow}>{copy.badge}</p><h3 id={`${id}-title`}>{copy.titles[sceneIndex]}</h3></div><label>{copy.language}<select value={language} onChange={e=>classroom?.setLanguage(e.target.value as typeof language)}>{STORY_LANGUAGES.map(([value,label])=><option key={value} value={value} lang={value}>{label}</option>)}</select></label></header>
  <div className={s.teacher}><div className={s.portrait}><Avatar traits={teacher.traits as AvatarTraits} equipped={teacher.equipped as EquippedItems} items={teacher.items as AvatarItem[]} crop="portrait" size={72} decorative/></div><p className={s.speech}><strong>{copy.teacher}</strong><span>{tested&&!active?copy.debriefs[sceneIndex]:copy.prompts[sceneIndex]}</span></p></div>
  <details className={s.prediction} open><summary>{copy.predict}</summary><ChoiceResponse label={part===4?copy.graphPrediction:copy.prediction} options={(part===4?copy.graphChoices:copy.choices).map((content,index)=>({id:String(index),content}))} value={prediction===undefined?undefined:String(prediction)} disabled={readOnly} onChange={v=>saveExplorer(predictionKey,Number(v))}/><p>{copy.practice}</p></details>
  <div className={s.stage}>
   <div className={s.desk}><span>{copy.you}</span><div className={s.seat}>{active?<EmptyStudentDesk/>:<LabCharacter portrait={classroom?.portrait??null} sampleStudent={classroom?.sample??false}/>}</div><CustomizeAvatarLink label={copy.change} language={language}>{copy.change} ↗</CustomizeAvatarLink></div>
   <div className={s.model}>
    <div className={s.modelHeading}><strong>{copy.test}</strong><span>{copy.negative} · {copy.positive}</span></div>
    <div className={s.ruler} role="img" aria-label={`${copy.position}: ${signed(value)} m`}>
     <div className={s.track}/><div className={s.origin} style={{left:`${percent(0)}%`}}/>
     {ticks.map(n=><span key={n} className={s.tick} style={{left:`${percent(n)}%`}} translate="no">{n}</span>)}
     <div className={s.actor} data-moving={moving} data-active={active} data-facing={direction<0?'left':'right'} style={{left:`${percent(value)}%`}} aria-hidden="true"><LabCharacter portrait={classroom?.portrait??null} sampleStudent={classroom?.sample??false} pose={moving?'walking':'side'}/></div>{!active&&<span className={s.marker} style={{left:`${percent(value)}%`}}/>}
    </div><p className={s.originLabel}>{copy.origin}</p>
    <div className={s.actions}>{part===1?<>
     <button type="button" disabled={readOnly||pos<=-5||steps>=500} onClick={()=>walk(-1)}>{copy.back}</button><button type="button" disabled={readOnly||pos>=5||steps>=500} onClick={()=>walk(1)}>{copy.forward}</button><button type="button" disabled={readOnly} onClick={()=>{setStepping(false);save({walker:[0]})}}>{copy.resetWalk}</button>
    </>:<><button type="button" disabled={readOnly||duration===0} onClick={()=>{enter();if(moment>=duration)setTime(0);setRunning(!running)}}>{running?copy.pause:copy.replay}</button><button type="button" disabled={readOnly||duration===0} onClick={()=>{enter();setRunning(false);setTime(0)}}>{copy.restart}</button></>}
     <button type="button" disabled={readOnly} onClick={()=>{if(active){classroom?.setActive(null);setRunning(false)}else enter()}}>{active?copy.desk:copy.enter}</button>
    </div>
   </div>
  </div>
  <dl className={s.metrics} aria-live={running?'off':'polite'}>{metrics.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value===null?<span>{copy.noTime}</span>:<span translate="no">{value}</span>}</dd></div>)}</dl>
  {part!==4&&<details className={s.path}><summary>{copy.path}</summary><p translate="no">{route.map(n=>`${n>0?'+':''}${n} m`).join(' → ')}</p></details>}
  {part===1&&<p className={s.goal}>{copy.challenge}<strong>{steps===7&&pos===1?` ✓ ${copy.matched}`:''}</strong></p>}
  {part===2&&<div className={s.controls}><label htmlFor={`${id}-seconds`}>{copy.stepTime}<select id={`${id}-seconds`} value={seconds} disabled={readOnly} onChange={e=>saveExplorer('velocity-step-time',Number(e.target.value))}>{[.5,1,2].map(n=><option key={n} value={n}>{n} s</option>)}</select></label>{steps===0&&<p>{copy.empty}</p>}<button type="button" disabled={readOnly} onClick={()=>{setRunning(false);setTime(0);save({walker:[0,1,2,3,2,1,0]});enter()}}>{copy.example}</button></div>}
  {part===4&&<div className={s.graphLayout}><div><PositionGraph start={state.graph.start} velocity={state.graph.velocity} target={target} time={moment} copy={copy}/><div className={s.legend}><span>{copy.solid} ━</span><span>{copy.dashed} ┄</span></div></div><div className={s.controls}><div className={s.targets}>{GRAPH_TARGETS.map((_,i)=><button type="button" key={i} aria-pressed={state.graph.target===i} disabled={readOnly} onClick={()=>setGraph({target:i})}>{copy.target} <span translate="no">{i+1}{state.matches[i]?' ✓':''}</span></button>)}</div><label htmlFor={`${id}-start`}>{copy.start}: <span translate="no">{number(state.graph.start)} m</span><input id={`${id}-start`} type="range" min="0" max="10" step="0.5" value={state.graph.start} disabled={readOnly} onChange={e=>setGraph({start:Number(e.target.value)})}/></label><label htmlFor={`${id}-velocity`}>{copy.slope}: <span translate="no">{signed(state.graph.velocity)} m/s</span><input id={`${id}-velocity`} type="range" min="-2" max="2" step="0.1" value={state.graph.velocity} disabled={readOnly} onChange={e=>setGraph({velocity:Number(e.target.value)})}/></label><p role="status">{graphMatched?`✓ ${copy.match}`:''}</p></div></div>}
  {part!==1&&<label className={s.scrub} htmlFor={`${id}-time`}>{copy.scrub}: <span translate="no">{number(moment)} / {number(duration)} s</span><input id={`${id}-time`} type="range" min="0" max={duration||1} step="0.1" value={moment} disabled={readOnly||duration===0} onChange={e=>{enter();setRunning(false);setTime(Number(e.target.value))}}/></label>}
  <footer className={s.evidence}><strong>{copy.explain}</strong><p>{part===1?copy.walkEvidence:part===2?copy.rateEvidence:copy.graphEvidence}</p></footer>
 </section>
}
