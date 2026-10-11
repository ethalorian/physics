'use client'

import type { ContentBlock } from '@/data/content-blocks'
import type { MeasurementState } from '@/lib/teaching-tool-spec'
import styles from './CaseBoard.module.css'

export default function CaseBoard({block,state,onChange,disabled,showControls}:{block:ContentBlock;state:MeasurementState;onChange:(p:Partial<MeasurementState>)=>void;disabled?:boolean;showControls:boolean}) {
  const tool=block.teachingTool
  if(tool?.kind!=='case-board')return null
  const index=Math.max(0,Math.min(tool.frames.length-1,state.frame??0))
  const frame=tool.frames[index]
  const compact=Boolean(block.workshop?.pageBreakBefore)
  const dimensionedDrawing=frame.image?.startsWith('/trades-etf/') ?? false
  const workshopVisual=frame.image?.startsWith('/trades-etf/workshop/') ?? false
  return <section className={`${styles.board} ${compact?styles.compact:''} ${dimensionedDrawing?styles.drawingBoard:''} ${workshopVisual?styles.workshopVisual:''}`} aria-label="Teaching board">
    <header><span>{workshopVisual?'Workshop demo':'Inspection bench'}</span><span>{index+1} / {tool.frames.length} · {workshopVisual?'look → try → check':'classroom reference'}</span></header>
    {showControls&&tool.frames.length>1&&<div className={styles.tabs} role="group" aria-label="Board views">{tool.frames.map((f,i)=><button key={i} type="button" disabled={disabled} aria-pressed={index===i} onClick={()=>onChange({frame:i,show:false})}>{f.title}</button>)}</div>}
    <div className={styles.face}>
      {(!compact||workshopVisual)&&<h3>{frame.title}</h3>}
      {frame.image&&<img src={frame.image} alt={frame.alt??frame.title}/>}
      {dimensionedDrawing&&<a className={styles.drawingLink} href={frame.image} target="_blank" rel="noopener noreferrer">Open drawing full size</a>}
      <p className={styles.prompt}>{workshopVisual&&<span className={styles.actionLabel}>Your move</span>}{frame.prompt}</p>
      {frame.body&&<p className={styles.reference}>{frame.body}</p>}
      {state.show&&frame.check&&<div className={styles.check} role="status">{frame.check}</div>}
    </div>
    {showControls&&frame.check&&<footer><button type="button" disabled={disabled} aria-pressed={state.show} onClick={()=>onChange({show:!state.show})}>{state.show?'Hide check':'Show check'}</button><span>Say what you notice before revealing the check.</span></footer>}
    {showControls&&workshopVisual&&tool.frames.length>1&&<nav className={styles.frameNav} aria-label="Demonstration steps"><button type="button" disabled={disabled||index===0} onClick={()=>onChange({frame:index-1,show:false})}>← Previous view</button><span>{index+1} of {tool.frames.length}</span><button type="button" disabled={disabled||index===tool.frames.length-1} onClick={()=>onChange({frame:index+1,show:false})}>Next view →</button></nav>}
  </section>
}
