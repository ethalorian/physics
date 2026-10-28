'use client'

import {useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react'
import type {LessonAssignment} from '@/lib/interactive-assignments/catalog'
import AssignmentChecklist from './AssignmentChecklist'
import AssignmentTeachingTool from './AssignmentTeachingTool'
import { AssignmentAvatarProvider } from './AssignmentAvatar'
import s from './assignment.module.css'
import briefStyle from './TransferBriefWorkspace.module.css'

type View = 'watch' | 'work' | 'side'
type Place = {id: string; offset: number}

export default function AssignmentWorkspace({lesson, answers, submitted, children, renderTool, sampleStudent = false, resourceLabel}: {
  lesson: LessonAssignment
  answers: Record<string, string>
  submitted: boolean
  children: ReactNode
  renderTool?: (visible: boolean) => ReactNode
  sampleStudent?: boolean
  resourceLabel?: 'Read' | 'Slides' | 'Brief'
}) {
  const [choice, setChoice] = useState<View | null>(null)
  const [wide, setWide] = useState(false)
  const view = choice ?? (lesson.simulation ? 'side' : wide ? 'side' : 'watch')
  const controls = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const workPlace = useRef<Place | null>(null)
  const pending = useRef<{view: View; target?: string} | null>(null)

  useEffect(() => {
    // Default to focused reading on Chromebook-sized windows, including zoom.
    const query = window.matchMedia('(min-width: 1441px) and (min-height: 760px)')
    const update = () => setWide(query.matches)
    update()
    query.addEventListener('change', update)
    const target = window.location.hash.slice(1)
    if (/^assignment-(part-\d+|submit)$/.test(target)) {
      pending.current = {view: 'work', target}
      setChoice('work')
    }
    return () => query.removeEventListener('change', update)
  }, [])

  function rememberWork() {
    if (view === 'watch' || !content.current) return
    const top = (controls.current?.getBoundingClientRect().bottom ?? 140) + 16
    const candidates = Array.from(content.current.querySelectorAll<HTMLElement>('section[id], [id^="label-"], [id^="answer-"]'))
      .filter(element => element.getBoundingClientRect().bottom > top)
    const closest = candidates.sort((a, b) => Math.abs(a.getBoundingClientRect().top - top) - Math.abs(b.getBoundingClientRect().top - top))[0]
    if (closest) workPlace.current = {id: closest.id, offset: closest.getBoundingClientRect().top - top}
  }

  function restore(next: View, target?: string) {
    const place = next === 'watch' ? null : workPlace.current
    const element = target ? document.getElementById(target) : place ? document.getElementById(place.id) : document.getElementById(next === 'watch' ? 'assignment-teaching-tool' : 'assignment-work')
    if (!element || !controls.current) return
    const top = parseFloat(getComputedStyle(controls.current).top) + controls.current.offsetHeight + (next === 'watch' ? 0 : 16)
    window.scrollTo({top: Math.max(0, window.scrollY + element.getBoundingClientRect().top - top - (target ? 0 : place?.offset ?? 0)), behavior: 'instant'})
    if (target) element.focus({preventScroll: true})
  }

  function changeView(next: View, target?: string) {
    rememberWork()
    if (next === view) {restore(next, target); return}
    pending.current = {view: next, target}
    setChoice(next)
  }

  useLayoutEffect(() => {
    if (!pending.current || pending.current.view !== view) return
    const {target} = pending.current
    pending.current = null
    // Let the browser finish changing the page height before restoring its
    // scroll position (the film and the long assignment have different heights).
    const frame = requestAnimationFrame(() => restore(view, target))
    return () => cancelAnimationFrame(frame)
  }, [view])

  if (lesson.transferBrief) return <AssignmentAvatarProvider sample={sampleStudent} workVisible><div className={briefStyle.workspace}>
    <div id="assignment-watch" className={briefStyle.visual}>{renderTool?.(true)}</div>
    <div id="assignment-work" ref={content} tabIndex={-1} className={briefStyle.work}>{children}</div>
  </div></AssignmentAvatarProvider>

  return <AssignmentAvatarProvider sample={sampleStudent} workVisible={view === 'work' || view === 'side'}><div className={s.lessonWorkspace} data-view={view} data-simulation={!!lesson.simulation}>
    <div ref={controls} className={s.workspaceControls}>
      <div className={s.viewChoices} role="group" aria-label="Lesson view">
        <button type="button" aria-pressed={view === 'watch'} aria-controls="assignment-watch" onClick={() => changeView('watch')}>{resourceLabel ?? (lesson.simulation ? 'Explore' : 'Watch')}</button>
        <button type="button" aria-pressed={view === 'work'} aria-controls="assignment-work" onClick={() => changeView('work')}>Work</button>
        <button type="button" aria-pressed={view === 'side'} aria-controls="assignment-watch assignment-work" onClick={() => changeView('side')}>Side by side</button>
      </div>
      <AssignmentChecklist compact lesson={lesson} answers={answers} submitted={submitted} onVisit={id => changeView(view === 'side' ? 'side' : 'work', id)}/>
    </div>
    <div className={s.assignmentWorkspace}>
      <div id="assignment-watch" className={s.watchPane} hidden={view === 'work'}>
        {renderTool ? renderTool(view !== 'work') : <AssignmentTeachingTool lesson={lesson} visible={view !== 'work'}/>}
      </div>
      <div id="assignment-work" ref={content} tabIndex={-1} className={s.assignmentContent} hidden={view === 'watch'}>
        {children}
      </div>
    </div>
  </div></AssignmentAvatarProvider>
}
