'use client'

import { useId, useState } from 'react'
import type { ContentBlock } from '@/data/content-blocks'
import styles from './TradesWorkshop.module.css'
import type { MeasurementState } from '@/lib/teaching-tool-spec'

export function inches(sixteenths: number) {
  const whole = Math.floor(sixteenths / 16)
  let n = sixteenths % 16, d = 16
  while (n > 0 && n % 2 === 0) { n /= 2; d /= 2 }
  return `${whole}${n ? ` ${n}/${d}` : ''}`
}

export default function WorkshopScene({ block, state, onChange, disabled = false, showControls = true }: { block: ContentBlock; state?: MeasurementState; onChange?: (p:Partial<MeasurementState>)=>void; disabled?: boolean; showControls?: boolean }) {
  const id = useId()
  const [own,setOwn] = useState<MeasurementState>({setup:'offset',mark:128,show:false})
  const [markDraft,setMarkDraft] = useState<number|null>(null)
  const {setup,show} = state??own
  const mark = markDraft??(state??own).mark
  const update = (p:Partial<MeasurementState>) => onChange ? onChange(p) : setOwn(v=>({...v,...p}))
  const commitMark = (value:number) => {setMarkDraft(null);update({mark:value,show:false})}
  const w = block.workshop ?? {title: "Measurement bench"}
  const marking = block.teachingTool?.kind === 'measurement-bench' && block.teachingTool.variant === 'mark'
  const inspect = block.teachingTool?.kind === 'measurement-bench' && block.teachingTool.variant === 'inspect'
  const start = setup === 'offset' && !marking && !inspect ? 1 : 0
  const x = (n: number) => 60 + n * 76
  const markInches = (inspect ? 138 : mark) / 16
  const arrow = `arrow-${id.replace(/:/g, '')}`
  return <section className={styles.scene} aria-label={w.title}>
    <div className={styles.sceneTop}><span>{marking ? 'Your practice bench' : inspect ? 'The quality check' : 'Class demonstration'}</span><span>Enlarged model · inches</span></div>
    <svg viewBox="0 0 880 290" role="img" aria-label={marking ? `Practice mark at ${inches(mark)} inches. Target: 8 3/8 inches.` : inspect ? 'Sample strip marked at 8 5/8 inches; required length is 8 3/8 inches.' : `Same piece starts at ${start} and ends at ${start + 6} 3/8 inches. ${setup === 'tilted' ? 'The ruler is tilted away from the edge.' : 'The ruler is straight.'}`}>
      <defs><marker id={arrow} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
      <rect x={x(start)} y="58" width={(marking || inspect ? 10 : 6.375) * 76} height="86" rx="4" fill="var(--secondary)" stroke="currentColor" strokeWidth="2" />
      <path d={`M ${x(start) + 12} 81 H ${x(start) + (marking || inspect ? 730 : 460)} M ${x(start) + 18} 117 H ${x(start) + (marking || inspect ? 728 : 450)}`} stroke="var(--border)" strokeWidth="2" />
      <g transform={setup === 'tilted' && !marking && !inspect ? 'rotate(-6 60 175)' : undefined}>
        <rect x="44" y="160" width="790" height="70" rx="4" fill="var(--card)" stroke="currentColor" />
        {Array.from({length:161}, (_, i) => <line key={i} x1={x(i / 16)} x2={x(i / 16)} y1="160" y2={i % 16 === 0 ? 190 : i % 8 === 0 ? 183 : i % 4 === 0 ? 178 : 170} stroke="currentColor" strokeWidth={i % 16 === 0 ? 2 : 1} />)}
        {Array.from({length:11},(_, i) => <text key={i} x={x(i)} y="215" textAnchor="middle" fill="currentColor" fontSize="19" fontFamily="sans-serif">{i}</text>)}
      </g>
      {marking || inspect ? <>
        <line x1={x(markInches)} x2={x(markInches)} y1="44" y2="157" stroke="var(--primary)" strokeWidth="5" />
        <text x="65" y="34" fontSize="22" fill="currentColor">Job: mark 8 3/8 in</text>
        <text x="440" y="273" textAnchor="middle" fontSize="22" fill="currentColor">{inspect ? 'Does this mark meet the job?' : `Your mark: ${inches(mark)} in`}</text>
      </> : <>
        <line x1={x(start)} x2={x(start)} y1="48" y2="153" stroke="var(--primary)" strokeWidth="3" />
        <line x1={x(start + 6.375)} x2={x(start + 6.375)} y1="48" y2="153" stroke="var(--primary)" strokeWidth="3" />
        <text x="440" y="273" textAnchor="middle" fontSize="22" fill="currentColor">{setup === 'tilted' ? 'Would you trust this placement?' : `Start: ${start} in     End: ${start + 6} 3/8 in`}</text>
      </>}
    </svg>
    {showControls && <fieldset disabled={disabled} className="min-w-0 border-0 p-0 m-0">{marking ? <div className={styles.markControls}>
      <label htmlFor={id}>Move the mark. Each step is 1/16 inch.</label>
      <input id={id} type="range" min="0" max="160" step="1" value={mark} aria-valuetext={`${inches(mark)} inches`} onChange={e=>setMarkDraft(Number(e.target.value))} onPointerUp={e=>commitMark(Number(e.currentTarget.value))} onKeyUp={e=>commitMark(Number(e.currentTarget.value))} onBlur={e=>{if(markDraft!==null)commitMark(Number(e.currentTarget.value))}} />
      <div className={styles.buttons}><button type="button" disabled={mark === 0} onClick={() => update({mark:mark-1,show:false})}>− 1/16 in</button><button type="button" disabled={mark === 160} onClick={() => update({mark:mark+1,show:false})}>+ 1/16 in</button><button type="button" onClick={()=>update({show:true})}>Check my mark</button></div>
    </div> : inspect ? <button type="button" onClick={()=>update({show:!show})}>{show ? 'Hide the check' : 'Reveal the check'}</button> : <div className={styles.buttons}>
      {(['offset','straight','tilted'] as const).map(v=><button type="button" key={v} aria-pressed={setup===v} onClick={()=>update({setup:v,show:false})}>{v==='offset'?'Start away from zero':v==='straight'?'Line up zero':'Tilt the ruler'}</button>)}
      <button type="button" onClick={()=>update({show:!show})}>{show?'Hide explanation':'Explain the setup'}</button>
    </div>}</fieldset>}
    {show && <div className={styles.feedback} role="status">{marking ? mark === 134 ? 'That matches: 8 inches plus 6 sixteenths = 8 3/8 inches. Now make the mark on your real practice piece.' : `${inches(mark)} in is ${mark < 134 ? 'short of' : 'past'} the target. Find 8 inches, then count six small spaces of 1/16 inch. Adjust and check again.` : inspect ? 'Needs a fix. This sample is marked at 8 5/8 in, which is 1/4 in past the required 8 3/8 in. Keep zero fixed and move the mark back 1/4 in.' : setup==='tilted' ? 'Straighten the ruler along the edge before reading. A tilted tool is measuring a different path.' : `The piece is 6 3/8 inches long. ${start ? '7 3/8 − 1 = 6 3/8. The end number alone includes the extra inch before the piece.' : 'With the start at zero, the end reading is the length.'}`}</div>}
    <p className={styles.practiceNote}>Try it freely. These controls do not submit work or earn XP.</p>
  </section>
}
