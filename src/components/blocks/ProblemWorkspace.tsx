'use client'

import { useId, useState } from 'react'
import { Lightbulb } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import coachAvatar from '@/data/physics-coach-avatar.json'
import type { AvatarTraits, EquippedItems, AvatarItem } from '@/lib/avatar/types'
import type { GewaBlock, WorkedExampleBlock } from '@/data/content-blocks'
import type { GewaValue } from './GewaInteractive'
import { SeiFrameBox, SeiPrompt, SeiVisual, useSei } from './SeiLayer'
import { useDraft } from './useDraft'
import MathMarkdown from '@/components/MathMarkdown'
import theme from '@/components/lessons/LearningTheme.module.css'
import styles from './ProblemWorkspace.module.css'
import ProblemStageInput,{ProblemStageDisplay} from './ProblemStageInput'
import {lessonProblemAnswer,stageHasEvidence,stageResponse} from '@/lib/problem-response'

const stages=['Problem','Model','Plan','Work','Answer'] as const
type Stage=typeof stages[number]
const guidance:Record<Stage,string>={Problem:'What are you being asked to find or explain?',Model:'Represent the situation. Identify known values, units, directions, and useful assumptions.',Plan:'Explain your approach and the relationship you will use before calculating.',Work:'Show your substitutions, calculation, or evidence. Explain the steps that matter.',Answer:'State the result and what it means, with units, direction, or precision when relevant.'}
const defaultHints:Record<Stage,string>={Problem:'Read the final question again. Name the quantity you need to find.',Model:'Start with a simple labeled sketch or a description. Separate what is given from what is unknown.',Plan:'Which physics relationship connects what you know to what you need? Explain why it applies.',Work:'Substitute one value at a time, keeping its sign and unit. Keep extra digits until the final answer.',Answer:'Read your result back in the context of the question. Include its meaning, not just a number.'}

export function ProblemCoach({stage,hints,onHint}:{stage:Stage;hints?:GewaBlock['stageHints'];onHint?:(id:string)=>void}){
  const [shown,setShown]=useState<Stage|null>(null)
  return <section className={styles.coach} aria-label="Problem coach"><div className={styles.portrait}><Avatar traits={coachAvatar.traits as AvatarTraits} equipped={coachAvatar.equipped as EquippedItems} items={coachAvatar.items as AvatarItem[]} size={64} decorative/></div><h4>Mr. Antocci’s hints</h4><p>{stage==='Plan'?'A clear plan is useful evidence—even before you calculate.':'You can show your thinking even when you are unsure.'}</p><button type="button" onClick={()=>{setShown(stage);onHint?.(stage.toLowerCase())}}><Lightbulb size={16} className="mr-2 inline"/>Hint for {stage.toLowerCase()}</button>{shown===stage&&<p className={styles.hint} role="status">{hints?.[stage.toLowerCase() as keyof NonNullable<GewaBlock['stageHints']>]??defaultHints[stage]}</p>}</section>
}

export default function ProblemWorkspace({block,value,onDraft,onSave,readOnly=false}:{block:GewaBlock;value?:GewaValue;readOnly?:boolean;onDraft:(v:GewaValue)=>void;onSave:(v:GewaValue,scaffolds:string[])=>void|Promise<boolean>}) {
  const id=useId()
  const [work,setWork]=useState<GewaValue>(()=>({...value,format:'problem-workspace'}))
  const [active,setActive]=useState<Stage>('Model')
  // Saved responses open in full so locked reviews remain readable.
  const [review,setReview]=useState(Boolean(value)||readOnly)
  const [touched,setTouched]=useState(false)
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const support=useSei(block.sei,{supportedModes:['text']})
  useDraft(onDraft,touched?work:undefined)
  const change=(patch:Partial<GewaValue>)=>{setTouched(true);setSaved(false);setWork(p=>({...p,...patch}))}
  const fields=[{key:'given' as const,stage:'Model' as const},{key:'equation' as const,stage:'Plan' as const},{key:'work' as const,stage:'Work' as const},{key:'answer' as const,stage:'Answer' as const}]
  const responses=lessonProblemAnswer(work)
  const complete=Object.values(responses).every(stageHasEvidence)
  const go=(stage:Stage)=>{setActive(stage);setReview(false);document.getElementById(`${id}-board`)?.scrollIntoView({block:'start',behavior:'auto'})}
  const next=stages[stages.indexOf(active)+1]
  return <section id={`${id}-board`} className={`${theme.theme} ${styles.board}`} aria-label="Problem solving workspace">
    <nav className={styles.steps} aria-label="Problem stages">
      {stages.map(stage=><button key={stage} type="button" aria-current={!review&&active===stage?'step':undefined} onClick={()=>go(stage)}>{stage}</button>)}
      <button type="button" aria-pressed={review} onClick={()=>setReview(p=>!p)} className={styles.review}>Review all work</button>
    </nav>
    <div className={styles.layout}>
      <div>
        <header className={styles.band} id={`${id}-Problem`}>
          <h3>Problem</h3><SeiPrompt prompt={block.prompt} l1Text={support.l1Text}/>
          <dl><dt>Model</dt><dd className={styles.known}>{stageResponse(responses.model).text||(stageHasEvidence(responses.model)?'Model drawing below.':'Record your values or representation below.')}</dd><dt>Found</dt><dd>{stageResponse(responses.answer).text||(stageHasEvidence(responses.answer)?'Answer drawing below.':'Your result will appear here.')}</dd></dl>
        </header>
        <SeiFrameBox state={support}/>
        {!review&&active==='Problem'&&<p className={styles.intro}>{guidance.Problem} Begin with a model, then choose a plan. You can move between stages as your thinking develops.</p>}
        {fields.filter(f=>review||f.stage===active).map(f=><section key={f.key} id={`${id}-${f.stage}`} className={styles.field} onFocus={()=>setActive(f.stage)}>
          {readOnly?<><h4>{f.stage}</h4><ProblemStageDisplay value={responses[f.stage.toLowerCase() as keyof typeof responses]} label={f.stage}/></>:<ProblemStageInput label={f.stage} help={guidance[f.stage]} value={responses[f.stage.toLowerCase() as keyof typeof responses]} disabled={saving} onChange={value=>{const stage=f.stage.toLowerCase() as keyof typeof responses;change({responses:{...responses,[stage]:value},[f.key]:stageResponse(value).text,...(stage==='model'?{modelStrokes:stageResponse(value).strokes}:{})})}}/>}
        </section>)}
        {!review&&<div className={styles.advance}><button type="button" onClick={()=>next?go(next):setReview(true)}>{next?`Continue to ${next}`:'Review all work'}</button><span>Your draft stays with you between stages.</span></div>}
      </div>
      <aside className={styles.reference}>
        {block.sei?.visual&&<figure className={styles.figure}><SeiVisual visual={block.sei.visual}/><figcaption>Reference diagram</figcaption></figure>}
        <ProblemCoach stage={active} hints={block.stageHints} onHint={readOnly?undefined:hint=>change({hintsUsed:[...new Set([...(work.hintsUsed??[]),hint])]})}/>
      </aside>
    </div>
    {!readOnly&&<footer className={styles.footer}>
      <button type="button" disabled={!complete||saving} onClick={async()=>{setSaving(true);try{setSaved((await onSave(work,[...support.scaffolds,...(work.hintsUsed??[]).map(h=>'hint:'+h)]))!==false)}finally{setSaving(false)}}}>{saving?'Saving…':saved?'Saved ✓':'Save problem work'}</button>
      <p>Save your reasoning, including uncertainty. Hints support your learning; your teacher reviews the evidence.</p>
    </footer>}
  </section>
}

export function WorkedProblemExample({block}:{block:WorkedExampleBlock}){
 const [active,setActive]=useState<Stage>('Problem')
 const [review,setReview]=useState(false)
 const [revealed,setRevealed]=useState<Stage[]>(['Problem'])
 const values={Model:block.given,Plan:block.equation,Work:block.work,Answer:block.answer}
 const interactive=Boolean(block.interactive)
 const available=stages.filter(stage=>stage==='Problem'||values[stage as keyof typeof values])
 const next=available[available.indexOf(active)+1]
 const go=(stage:Stage)=>{setActive(stage);setReview(false)}
 return <section className={`${theme.theme} ${styles.board}`} aria-label={interactive?'Interactive worked problem':'Worked problem'}>
   {interactive?<nav className={styles.steps} aria-label="Worked example stages">{available.map(stage=><button key={stage} type="button" aria-current={!review&&active===stage?'step':undefined} onClick={()=>go(stage)}>{stage}</button>)}<button type="button" className={styles.review} aria-pressed={review} onClick={()=>setReview(value=>!value)}>Review example</button></nav>:<div className={styles.steps}>{available.map(stage=><span key={stage} className="text-sm italic">{stage}</span>)}</div>}
   <div className={styles.layout} data-example={interactive}>
     <div><header className={styles.band}><h3>Problem</h3><MathMarkdown content={block.prompt}/></header>
       {interactive&&!review&&active==='Problem'&&<p className={styles.intro}>Read the problem and identify what you need to find. Predict the next step, then reveal the example’s reasoning. Afterward, try the same kind of problem with new numbers.</p>}
       {Object.entries(values).filter(([stage,value])=>value&&(!interactive||review||stage===active)).map(([stage,value])=><section key={stage} className={styles.field}><h4>{stage}</h4>{interactive&&!review&&!revealed.includes(stage as Stage)?<div className={styles.predict}><p>{guidance[stage as Stage]} Pause and think through your approach before revealing the example.</p><button type="button" onClick={()=>setRevealed(previous=>[...previous,stage as Stage])}>Reveal {stage.toLowerCase()}</button></div>:<div className={`${stage==='Answer'?styles.answer:styles.staticText} ${interactive?styles.handwritten:''}`}><MathMarkdown content={value!}/></div>}</section>)}
       {interactive&&!review&&<div className={styles.advance}><button type="button" onClick={()=>next?go(next):setReview(true)}>{next?`Continue to ${next}`:'Review example'}</button><span>This example is a learning support. Save your own reasoning in the next problem.</span></div>}
     </div>
     {block.sei?.visual&&<aside className={styles.reference}><figure className={styles.figure}><SeiVisual visual={block.sei.visual}/><figcaption>Use the model to connect each step to the situation.</figcaption></figure></aside>}
   </div>
 </section>
}
