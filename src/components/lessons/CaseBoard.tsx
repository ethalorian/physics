'use client'

import type { ContentBlock } from '@/data/content-blocks'
import type { MeasurementState } from '@/lib/teaching-tool-spec'
import styles from './CaseBoard.module.css'

export default function CaseBoard({block,state,onChange,disabled,showControls}:{block:ContentBlock;state:MeasurementState;onChange:(p:Partial<MeasurementState>)=>void;disabled?:boolean;showControls:boolean}) {
  const tool=block.teachingTool
  if(tool?.kind!=='case-board')return null
  const index=Math.max(0,Math.min(tool.frames.length-1,state.frame??0))
  const frame=tool.frames[index]
  return <section className={styles.board} aria-label="Teaching board">
    <header><span>Inspection bench</span><span>{index+1} / {tool.frames.length} · classroom reference</span></header>
    {showControls&&<div className={styles.tabs} role="group" aria-label="Board views">{tool.frames.map((f,i)=><button key={i} type="button" disabled={disabled} aria-pressed={index===i} onClick={()=>onChange({frame:i,show:false})}>{f.title}</button>)}</div>}
    <div className={styles.face}>
      <h3>{frame.title}</h3>
      {frame.image&&<img src={frame.image} alt={frame.alt??frame.title}/>}
      <p className={styles.prompt}>{frame.prompt}</p>
      {frame.body&&<p className={styles.reference}>{frame.body}</p>}
      {state.show&&frame.check&&<div className={styles.check} role="status">{frame.check}</div>}
    </div>
    {showControls&&frame.check&&<footer><button type="button" disabled={disabled} aria-pressed={state.show} onClick={()=>onChange({show:!state.show})}>{state.show?'Hide check':'Show check'}</button><span>Say what you notice before revealing the check.</span></footer>}
  </section>
}
