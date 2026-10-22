'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Columns2, LockKeyhole, PencilLine, Play, Send } from 'lucide-react'
import type { LessonPage } from '@/data/content-blocks'
import { deriveSectionTitle } from './lesson-sections'
import InstructionVideo from '@/components/blocks/InstructionVideo'
import LessonLearningScene from './LessonLearningScene'
import ReadingCompanion from '@/components/avatar/ReadingCompanion'
import { learningTaskFocus } from '@/lib/learning-task-focus'
import s from './VideoLessonWorkspace.module.css'

type View = 'watch' | 'work' | 'side'
export default function VideoLessonView({ title, focus, unit, exitHref, previewLabel, preview, staff, pages, current, done, total, draftStatus, workRequest, onGo, next, isLocked, isDone, checkpointNote, toolbar, mastery, follow, support, submit, children }: {
  title: string; focus: string; unit?: string; exitHref: string; previewLabel: string; preview: boolean; staff: boolean
  pages: LessonPage[]; current: number; done: number; total: number; draftStatus: string; workRequest: number
  onGo: (index: number) => void; next: () => void; isLocked: (index: number) => boolean; isDone: (index: number) => boolean
  checkpointNote: string | null; toolbar: ReactNode; mastery: ReactNode; follow: ReactNode; support: ReactNode; submit: ReactNode; children: ReactNode
}) {
  const [wide, setWide] = useState(false)
  const [choice, setChoice] = useState<{ view: View; page: number; request: number } | null>(null)
  const controls = useRef<HTMLDivElement>(null)
  const work = useRef<HTMLDivElement>(null)
  const hasVideo = pages.some(page => page.blocks.some(block => block.type === 'instruction_video'))
  // A teacher jump or "next response" must reveal its destination even from Watch.
  const view = choice?.view === 'side' ? 'side' : choice?.page === current && choice.request === workRequest ? choice.view
    : wide ? 'side' : current > 0 || workRequest > 0 ? 'work' : 'watch'
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1441px) and (min-height: 760px)')
    const update = () => setWide(query.matches)
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  function changeView(nextView: View) {
    setChoice({ view: nextView, page: current, request: workRequest })
    requestAnimationFrame(() => {
      const target = nextView === 'watch' ? controls.current : work.current
      target?.focus({ preventScroll: true })
      controls.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    })
  }
  function visit(index: number) {
    if (isLocked(index)) return
    onGo(index)
    setChoice({ view: view === 'side' ? 'side' : 'work', page: index, request: workRequest })
  }
  const titleFor = (index: number) => deriveSectionTitle(pages[index], index, pages.length)
  return <main className={s.page} data-video-lesson data-view={view}>
    <div className={s.topline}><Link href={exitHref}><ArrowLeft size={16}/>{preview || staff ? 'Back to lesson workspace' : 'All lessons'}</Link><span>{unit || 'Interactive lesson'}</span></div>
    <header className={s.intro}>
      <p className={s.eyebrow}>Interactive lesson · Learn, practice, explain</p>
      <h1>{title.replace(/^Day \d+\s*[—–:.-]\s*/, '')}</h1>
      {focus && <p className={s.focus}>{focus}</p>}
      <div className={s.meta}><span className={s.badge} role="status">{preview || staff ? previewLabel : draftStatus}</span><span>{done} of {total} responses saved</span></div>
    </header>
    <ol className={s.guide} aria-label="How to use this lesson">
      <li><Play aria-hidden/><div><strong>{hasVideo ? 'Watch' : 'Explore'}</strong><p>{hasVideo ? 'Pause, replay, and follow the key ideas.' : 'Notice, predict, and explore the key ideas.'}</p></div></li>
      <li><PencilLine aria-hidden/><div><strong>Work</strong><p>Try each check and explain your thinking.</p></div></li>
      <li><Send aria-hidden/><div><strong>Turn it in</strong><p>Submit your responses for teacher review.</p></div></li>
    </ol>
    {follow}
    <div ref={controls} tabIndex={-1} className={s.controls}>
      <div className={s.viewChoices} role="group" aria-label="Lesson view">
        {([['watch',hasVideo ? 'Watch' : 'Explore',Play],['work','Work',PencilLine],['side','Side by side',Columns2]] as const).map(([value,label,Icon]) => <button type="button" key={value} aria-pressed={view === value} aria-controls={value === 'side' ? 'video-lesson-watch video-lesson-work' : `video-lesson-${value}`} onClick={() => changeView(value)}><Icon size={16} aria-hidden/>{label}</button>)}
      </div>
      <div className={s.progress}><span>Response progress <strong>{done}/{total}</strong></span><progress aria-label="Saved responses" value={done} max={Math.max(1,total)}/></div>
    </div>
    <div className={s.workspace}>
      <section id="video-lesson-watch" aria-label={hasVideo ? 'Lesson video' : 'Explore the lesson'} className={s.watch} hidden={view === 'work'}>
        <div className={s.panelHeading}><p className={s.eyebrow}>{hasVideo ? 'Watch & understand' : 'Notice · predict · explain'}</p><h2>{hasVideo ? 'Your video lesson' : 'Your classroom scene'}</h2></div>
        <div className={s.videoContent}>{pages.flatMap((page, index) => page.blocks.filter(block => block.type === 'instruction_video').map(block => <div key={block.id} hidden={isLocked(index)}><InstructionVideo block={block} visible={view !== 'work' && !isLocked(index)}/></div>))}</div>
        <div className={s.videoContent}>{hasVideo ? <details><summary className="min-h-11 cursor-pointer content-center font-semibold">Learn with your avatar</summary><LessonLearningScene key={current} title={titleFor(current)} focus={learningTaskFocus(pages[current].blocks,focus || title)} preview={preview || staff}/></details> : <LessonLearningScene key={current} title={titleFor(current)} focus={learningTaskFocus(pages[current].blocks,focus || title)} preview={preview || staff}/>}</div>
        <div className={s.watchAction}><button type="button" className={s.primary} onClick={() => changeView(view === 'side' ? 'side' : 'work')}>Go to your work <ArrowRight size={16}/></button><span>{hasVideo ? 'Return to the video whenever you need.' : 'Return to the classroom scene whenever you need.'}</span></div>
      </section>
      <div id="video-lesson-work" ref={work} tabIndex={-1} className={s.work} hidden={view === 'watch'}>
        <section className={s.route} aria-label="Lesson steps"><div className={s.routeHeading}><h2>Your work</h2><span>Step {current+1} of {pages.length}</span></div>
          <details open={pages.length <= 7 ? true : undefined}><summary className="min-h-11 cursor-pointer content-center text-xs">Choose a step</summary><ol>{pages.map((page,index) => <li key={page.blocks[0]?.id ?? index}><button type="button" disabled={isLocked(index)} aria-current={current===index ? 'step' : undefined} onClick={() => visit(index)}><span className={s.stepNumber} data-done={isDone(index)}>{isLocked(index) ? <LockKeyhole size={13}/> : isDone(index) ? <Check size={14}/> : index+1}</span><span>{titleFor(index)}</span></button></li>)}</ol></details>
        </section>
        <section className={s.task} aria-label={titleFor(current)}>
          <header><p className={s.eyebrow}>Step {current+1} · {pages[current].hasCapture ? 'Your response' : 'Learn & explore'}</p><h2>{titleFor(current)}</h2></header>
          <ReadingCompanion key={current} title={titleFor(current)} focus={learningTaskFocus(pages[current].blocks,focus||title)} sample={preview||staff}>{children}</ReadingCompanion>
          {checkpointNote && <p className={s.checkpoint} role="status">{checkpointNote}</p>}
          <footer className={s.taskFooter}><button type="button" className={s.secondary} disabled={current===0} onClick={() => visit(current-1)}><ArrowLeft size={16}/>Back</button>{current<pages.length-1 ? <button type="button" className={s.primary} disabled={isLocked(current+1)} onClick={next}>Continue <ArrowRight size={16}/></button> : <button type="button" className={s.primary} onClick={() => {const panel=document.getElementById('lesson-submission');panel?.focus({preventScroll:true});panel?.scrollIntoView({block:'center',behavior:'instant'})}}>Review & submit <ArrowRight size={16}/></button>}</footer>
        </section>
      </div>
    </div>
    <details className={s.resources}><summary>Learning targets, vocabulary & language support</summary><div className={s.resourceContent}>{toolbar}{mastery}{support}</div></details>
    <div className={s.submission}><p className={s.eyebrow}>Turn it in</p>{submit}</div>
  </main>
}
