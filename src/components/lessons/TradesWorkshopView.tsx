'use client'

import type { ReactNode } from 'react'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import { isBlockComplete, type LessonPage } from '@/data/content-blocks'
import { useAssignedTrade } from './TradeContext'
import { LanguageDial } from './LanguageProfileProvider'
import styles from './TradesWorkshop.module.css'

interface Props {
  preview?: boolean
  exitHref?: string
  title: string
  pages: LessonPage[]
  current: number
  responses: BlockResponseMap
  staff: boolean
  locked: boolean
  done: number
  total: number
  toolbar: ReactNode
  follow: ReactNode
  submit: ReactNode
  scene: ReactNode
  task: ReactNode
  onGo: (index: number) => void
  isLocked: (index: number) => boolean
}

export default function TradesWorkshopView({ preview,exitHref,title,pages,current,responses,staff,locked,done,total,toolbar,follow,submit,scene,task,onGo,isLocked }: Props) {
  const trade = useAssignedTrade()
  const page = pages[current]
  const opener = page?.blocks.find(b=>b.teachingTool)
  const info = opener?.workshop
  const capture = page?.captureBlocks[0]
  const connection = trade && opener?.vocational?.[trade]
  const practicalStages = pages.some(p=>p.blocks.some(b=>b.workshop?.pageBreakBefore))
  const showBenchDirections = practicalStages && Boolean(info?.steps?.length)
  return <main className={`${styles.workshop} ${practicalStages ? styles.projectWorkshop : ''}`}>
    <header className={styles.masthead}>
      <div><span className={styles.brand}>Class workshop</span><h1>{title}</h1></div>
      <div className={styles.progress}>{staff ? toolbar : <span>{done} of {total} useful responses saved</span>}{follow}</div>
    </header>
    <nav className={`${styles.steps} ${pages.length>4?styles.manySteps:''}`} style={pages.length<=4?{gridTemplateColumns:`repeat(${pages.length},minmax(0,1fr))`}:undefined} aria-label="Workshop moments">
      {pages.map((p,i)=>{const w=p.blocks.find(b=>b.teachingTool)?.workshop;const finished=p.hasCapture&&p.captureBlocks.every(b=>responses[b.id]&&!responses[b.id].draft&&isBlockComplete(b,responses[b.id].response));return <button type="button" key={p.blocks[0]?.id??i} aria-current={current===i?'step':undefined} disabled={isLocked(i)} onClick={()=>onGo(i)}><span className={styles.stepNumber}>{finished?'✓':i+1}</span><span>{w?.stage??`Moment ${i+1}`}<small>{w?.minutes} min · {staff?'lead together':!p.hasCapture?'notebook / practical':finished?'saved':'try, then save'}</small></span></button>})}
    </nav>
    <section aria-labelledby="workshop-title">
      <div className={styles.stageHeader}><div><span className={styles.eyebrow}>{staff?'Lead the room':'Look • try • do'}</span><h2 id="workshop-title">{info?.title}</h2><p>{info?.lead}</p>{info?.target&&<p className={styles.targetLine}>{info.target}</p>}</div></div>
      {scene}
      {showBenchDirections && <section className={styles.benchDirections} aria-labelledby="bench-directions-title">
        <h3 id="bench-directions-title">{info?.stage === 'Make' ? 'Build it · follow these steps' : 'What to do · step by step'}</h3>
        <ol>{info?.steps?.map((step,index)=><li key={index}>{step}</li>)}</ol>
      </section>}
      <div className={`${styles.taskGrid} ${capture?.type==='sketch'?styles.workbenchLayout:''}`}>
        <div className={styles.task}>
          <div className={styles.taskTitle}><h3>{capture?.workshop?.taskLabel??'In your pocket notebook'}</h3><span>{!capture?'Practical work':locked?'Previously submitted':staff?'Student response':`Response ${pages.slice(0,current).reduce((n,p)=>n+p.captureBlocks.length,0)+1} of ${total}`}</span></div>
          {info?.notebook && <p>{info.notebook}</p>}
          {capture ? task : <p>Record the specified measurements, drawing or test results on paper. Move to the next stage with your teacher.</p>}
        </div>
        <aside className={styles.support}>
          {staff && opener?.note && <div className={styles.teacherCue}><h3>Lead this moment</h3><p>{opener.note}</p></div>}
          {(capture?.workshop?.purpose || info?.purpose) && <div><h3>{staff?'What this tells you':capture?'Why save this?':'What you are practicing'}</h3><p>{capture?.workshop?.purpose ?? info?.purpose}</p></div>}
          {!showBenchDirections && <details open><summary>At the bench</summary><ol>{info?.steps?.map((s,i)=><li key={i}>{s}</li>)}</ol></details>}
          {connection && <details><summary>In your trade</summary>{connection.directions.map((d,i)=><p key={i}>{d}</p>)}</details>}
          <details><summary>Missed class or need a hand?</summary>{info?.catchUp?.map((s,i)=><p key={i}>{s}</p>)}</details>
          <details><summary>Language support</summary><LanguageDial /></details>
        </aside>
      </div>
    </section>
    {submit && <section className={styles.submit}>{submit}</section>}
    <footer className={styles.footer}>
      <button type="button" disabled={current===0} onClick={()=>onGo(current-1)}>← Back</button>
      <span>{staff?'Use the live-class controls to move student screens together.':'During class, move on with your teacher. You can revisit practice anytime.'}</span>
      {current<pages.length-1 ? <button type="button" className={styles.primary} disabled={isLocked(current+1)} onClick={()=>onGo(current+1)}>Next moment →</button> : <a href={preview?exitHref:"/home"}>{preview?'Exit preview':'Back to home'}</a>}
    </footer>
  </main>
}
