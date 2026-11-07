'use client'

import { useRef, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, PencilRuler } from 'lucide-react'
import AssignmentWorkspace from '@/components/interactive-assignments/AssignmentWorkspace'
import MathMarkdown from '@/components/MathMarkdown'
import { isBlockComplete, type LessonPage } from '@/data/content-blocks'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import type { ResponseSnapshot } from '@/lib/lesson-response-store'
import { LanguageDial } from './LanguageProfileProvider'
import EtfStreetPlan from '@/components/readings/interactive/EtfStreetPlan'
import s from './EngineeringWorkshop.module.css'
import etfTheme from '@/components/readings/interactive/etf-edition.module.css'

const workspace = { sections: [], questions: [] }
const stageNames: Record<string, string> = { Brief: 'Start here', Measure: 'Measure', Plan: 'Plan & draw', Make: 'Build', Test: 'Test & revise', Explain: 'Turn in' }

export type EngineeringWorkshopProps = {
  title: string
  pages: LessonPage[]
  current: number
  responses: BlockResponseMap
  staff: boolean
  locked: boolean
  preview?: boolean
  exitHref?: string
  toolbar: ReactNode
  follow: ReactNode
  reference: ReactNode
  task: ReactNode
  submit: ReactNode
  draftState?: ResponseSnapshot['draftState']
  isLocked: (index: number) => boolean
  onGo: (index: number) => void
}

export default function EngineeringWorkshopView(props: EngineeringWorkshopProps) {
  const { title, pages, current, responses, staff, locked, preview, exitHref, toolbar, follow, reference, task, submit, draftState, isLocked, onGo } = props
  const heading = useRef<HTMLHeadingElement>(null)
  const page = pages[current]
  const opener = page.blocks.find(block => block.workshop?.pageBreakBefore)
  const info = opener?.workshop
  const record = page.captureBlocks[0]
  const saved = pages.filter(section => section.captureBlocks.length > 0 && section.captureBlocks.every(block => !responses[block.id]?.draft && isBlockComplete(block, responses[block.id]?.response))).length
  const final = current === pages.length - 1
  const hasDraft = page.captureBlocks.some(block => responses[block.id]?.draft)
  const complete = page.captureBlocks.length > 0 && page.captureBlocks.every(block => !responses[block.id]?.draft && isBlockComplete(block, responses[block.id]?.response))
  const directions = info?.steps ?? []
  const isBuildingBrief = opener?.id === 'etf-book-2-01-brief' || opener?.id === 'etf-book-2-01-plan'

  function move(index: number) {
    onGo(index)
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }))
  }

  return <main className={s.workshop}>
    <header className={s.header}>
      <div><p className={s.eyebrow}>Engineering the Future</p><h1>{title}</h1><p className={s.purpose}>{info?.purpose}</p></div>
      <div className={s.headerActions}>{info?.studentPacket && <a href={info.studentPacket} target="_blank" rel="noopener noreferrer"><Download size={17} aria-hidden="true"/>Print packet</a>}{toolbar}</div>
    </header>
    {follow}
    <nav className={s.stages} aria-label="Engineering stages">
      {pages.map((section, index) => {
        const meta = section.blocks.find(block => block.workshop?.pageBreakBefore)?.workshop
        const finished = section.captureBlocks.length > 0 && section.captureBlocks.every(block => !responses[block.id]?.draft && isBlockComplete(block, responses[block.id]?.response))
        return <button type="button" key={section.blocks[0].id} aria-current={current === index ? 'step' : undefined} disabled={isLocked(index)} onClick={() => move(index)}>
          <span className={s.number}>{finished ? <Check size={16} aria-label="Record saved"/> : String(index + 1).padStart(2, '0')}</span>
          <span>{stageNames[meta?.stage ?? ''] ?? meta?.stage ?? 'Work'}<small>{finished ? 'Record saved' : `${meta?.minutes ?? ''} min`}</small></span>
        </button>
      })}
    </nav>
    <div className={s.stageHeading}><div><p className={s.eyebrow}>Step {current + 1} of {pages.length} · {info?.minutes} min</p><h2 ref={heading} tabIndex={-1}>{info?.title}</h2></div><p>{locked ? 'Submitted work' : `${saved} of ${pages.filter(section => section.hasCapture).length} online records saved`}</p></div>
    {/* Both messages reserve the same grid row, even while hidden. Autosave
        must never move the paper underneath an active pencil or pointer. */}
    <div className={s.saveNotice}>
      <p role="status" aria-hidden={draftState !== 'saving'} style={{ visibility: draftState === 'saving' ? 'visible' : 'hidden' }}>Saving your draft…</p>
      <p role="alert" aria-hidden={draftState !== 'offline'} style={{ visibility: draftState === 'offline' ? 'visible' : 'hidden' }}>Your draft is kept on this device. Reconnect before saving or submitting.</p>
    </div>
    <AssignmentWorkspace lesson={workspace} answers={{}} submitted={locked} sampleStudent={preview || staff} resourceLabel="Brief" initialView="side" progress={<p className={s.viewHint}>Keep the directions beside your work.</p>} renderTool={() => <section className={s.brief} aria-label="Directions for this step">
      <p className={s.eyebrow}>Your task</p>
      {directions.map((direction, index) => <div className={s.direction} key={index}><MathMarkdown questionEmphasis content={direction}/></div>)}
      {isBuildingBrief && <div className={etfTheme.edition}><EtfStreetPlan/></div>}
      {reference && <div className={s.references}>{reference}</div>}
      {staff && opener?.note && <details><summary>Teacher notes</summary><MathMarkdown content={opener.note}/></details>}
      <details><summary>Help and language support</summary><LanguageDial/>{info?.catchUp?.map((text, index) => <p key={index}>{text}</p>)}</details>
    </section>}>
      <section id="assignment-part-1" className={s.record} aria-labelledby="engineering-record-title" tabIndex={-1}>
        <div className={s.recordHeader}><div><p className={s.eyebrow}><PencilRuler size={15} aria-hidden="true"/> Your work</p><h3 id="engineering-record-title">{record?.workshop?.taskLabel ?? (final ? 'Your explanation' : 'Keep a record')}</h3></div><span className={s.status} data-saved={complete} role="status">{locked ? 'Submitted' : hasDraft ? 'Draft · save when ready' : complete ? 'Saved' : 'Ready to start'}</span></div>
        {!final && <p className={s.paperNote}>Record your work here or on your printed packet. Save your final explanation online.</p>}
        {record ? task : <p>Use your printed packet to record the measurements and drawing for this step.</p>}
      </section>
      {submit && <section id="assignment-submit" className={s.submit} tabIndex={-1}><h3>Review and submit</h3>{submit}</section>}
    </AssignmentWorkspace>
    <footer className={s.footer}>
      <button type="button" disabled={current === 0} onClick={() => move(current - 1)}><ArrowLeft size={17} aria-hidden="true"/>Back</button>
      <span>{final ? 'Check your explanation, then submit above.' : `Next · ${stageNames[pages[current + 1]?.blocks.find(block => block.workshop?.pageBreakBefore)?.workshop?.stage ?? ''] ?? 'Continue'}`}</span>
      {final ? <a href={preview ? exitHref : '/home'}>{preview ? 'Exit preview' : 'My assignments'}</a> : <button type="button" className={s.next} disabled={isLocked(current + 1)} onClick={() => move(current + 1)}>Continue<ArrowRight size={17} aria-hidden="true"/></button>}
    </footer>
  </main>
}
