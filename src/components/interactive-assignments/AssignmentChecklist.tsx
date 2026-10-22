'use client'

import {useEffect, useState} from 'react'
import type {LessonAssignment} from '@/lib/interactive-assignments/catalog'
import s from './assignment.module.css'

export default function AssignmentChecklist({lesson, answers, submitted, compact = false, onVisit}: {
  lesson: LessonAssignment
  answers: Record<string, string>
  submitted: boolean
  compact?: boolean
  onVisit?: (id: string) => void
}) {
  const [active, setActive] = useState('assignment-part-1')
  const [expanded, setExpanded] = useState(false)
  const answered = lesson.questions.filter(q => answers[q.id]?.trim()).length

  useEffect(() => {
    const ids = [...lesson.sections.map((_, i) => `assignment-part-${i + 1}`), 'assignment-submit']
    let frame = 0
    function update() {
      frame = 0
      let current = ids[0]
      for (const id of ids) {
        const element = document.getElementById(id)
        if (element?.getClientRects().length && element.getBoundingClientRect().top <= parseFloat(getComputedStyle(element).scrollMarginTop) + 8) current = id
      }
      const submit = document.getElementById('assignment-submit')
      if (window.scrollY > 0 && submit?.getClientRects().length && submit.getBoundingClientRect().bottom <= window.innerHeight + 2) current = 'assignment-submit'
      setActive(current)
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, {passive: true})
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [lesson])

  function visit(id: string) {
    setActive(id)
    setExpanded(false)
    if (onVisit) {onVisit(id); return}
    requestAnimationFrame(() => {
      const target = document.getElementById(id)
      target?.scrollIntoView({block: 'start'})
      target?.focus({preventScroll: true})
    })
  }

  return <aside className={`${s.checklist} ${compact ? s.checklistCompact : ''}`} aria-label="Assignment progress">
    <div className={s.checklistHeading}>
      <h2>Assignment checklist</h2>
      <button type="button" className={s.checklistToggle} aria-expanded={expanded} aria-controls="assignment-checklist-parts" onClick={() => setExpanded(value => !value)}>
        <span>{expanded ? 'Hide parts' : 'Show parts'}</span> <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
    </div>
    <p className={s.checklistCount}><span translate="no">{answered}</span><span> of </span><span translate="no">{lesson.questions.length}</span><span> responses entered</span></p>
    <progress className={s.checklistProgress} value={answered} max={lesson.questions.length} aria-label="Responses entered"/>
    <div id="assignment-checklist-parts" className={s.checklistParts} data-expanded={expanded}>
      <nav aria-label="Assignment parts">
        <ol className={s.checklistList}>
          {lesson.sections.map((section, i) => {
            const count = section.questions.filter(q => answers[q.id]?.trim()).length
            const done = count === section.questions.length
            const id = `assignment-part-${i + 1}`
            return <li key={id}>
              <a href={`#${id}`} onClick={event => {event.preventDefault(); visit(id)}} aria-current={active === id ? 'location' : undefined} data-complete={done}>
                <span className={s.checklistMark} aria-hidden="true">{done ? '✓' : i + 1}</span>
                <span><strong>{section.title}</strong><small><span translate="no">{count}</span><span> of </span><span translate="no">{section.questions.length}</span><span> answered</span><span>{done ? ' · Complete' : ''}</span></small></span>
              </a>
            </li>
          })}
          <li className={s.checklistSubmit}>
            <a href="#assignment-submit" onClick={event => {event.preventDefault(); visit('assignment-submit')}} aria-current={active === 'assignment-submit' ? 'location' : undefined} data-complete={submitted}>
              <span className={s.checklistMark} aria-hidden="true">{submitted ? '✓' : '→'}</span>
              <span><strong>{submitted ? 'Submitted' : 'Turn it in'}</strong><small>{submitted ? 'Sent to your teacher' : 'Review and submit'}</small></span>
            </a>
          </li>
        </ol>
      </nav>
      <p className={s.checklistNote}>Checkmarks mean you entered every response in a part. Your teacher reviews your thinking.</p>
    </div>
  </aside>
}
