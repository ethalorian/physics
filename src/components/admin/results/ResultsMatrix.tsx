'use client'

import { memo, useCallback, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import type { ResultActivity, ResultStudent } from '@/lib/assessment-results/types'
import { gradeBand, gradebookStatus, releasedGrade } from '@/lib/assessment-results/gradebook'
import { GradeBadge } from './GradeDisplay'
import AssignmentIdentity from '@/components/AssignmentIdentity'
import type { GradebookSummaries } from '@/lib/assessment-results/render-summaries'
import s from './ResultsWorkspace.module.css'

type Props = {
  activities: ResultActivity[]
  students: ResultStudent[]
  summaries: GradebookSummaries
  display: 'percent' | 'points'
  classId: string
  termId: string
  onOpen: (activity: ResultActivity, student?: string) => void
  onEnter: (activity: ResultActivity) => void
}

// Highlight only the old and new columns. The existing CSS and keyboard focus
// behavior are unchanged; pointer movement does not recalculate grades or rows.
export default memo(function ResultsMatrix({ activities, students, summaries, display, classId, termId, onOpen, onEnter }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const columns = useRef(new Map<string, HTMLElement[]>())
  const active = useRef('')
  const highlight = useCallback((key: string) => {
    if (active.current === key) return
    for (const cell of columns.current.get(active.current) ?? []) cell.dataset.column = 'false'
    for (const cell of columns.current.get(key) ?? []) cell.dataset.column = 'true'
    active.current = key
  }, [])
  useLayoutEffect(() => {
    const rows = Array.from(root.current?.querySelectorAll('tr') ?? [])
    const next = new Map<string, HTMLElement[]>()
    for (const [index, activity] of activities.entries()) {
      const cells = rows.map(row => row.children[index + 3] as HTMLElement).filter(Boolean)
      next.set(activity.key, cells)
      for (const cell of cells) {
        const value = String(active.current === activity.key)
        if (cell.dataset.column !== value) cell.dataset.column = value
      }
    }
    columns.current = next
    if (!next.has(active.current)) active.current = ''
  }, [activities, students])
  return (<div className={s.scroll} tabIndex={0} role="region" aria-label="Gradebook with frozen student, completion and quiz total columns" ref={root} onMouseLeave={() => highlight('')}><table className={s.matrix}><thead><tr><th>Student</th><th>All unit<br/>work<small>Done / assigned</small></th><th>Term<br/>quiz %<small>All units · Released</small></th>{activities.map(a => { const stats = summaries.activities.get(a.key)!; return <th key={a.key} data-tone={gradeBand(stats.average)} data-column={false}><button className={s.assignment} onClick={() => ['worksheet','student_choice'].includes(a.kind)?onOpen(a):onEnter(a)}><AssignmentIdentity source={a} compact/></button><small>{summaries.activities.get(a.key)!.due}</small><GradeBadge percent={stats.average}/></th> })}</tr></thead><tbody>{students.map(st => {
          const { total, done } = summaries.students.get(st.id)!
          return <tr key={st.id} data-tone={gradeBand(total.percent)}><th><Link className={s.student} href={'/home/gradebook?'+new URLSearchParams({class:classId,student:st.id,term:termId})}>{st.name}</Link></th><td><strong>{done.completed} / {done.assigned}</strong></td><td><GradeBadge percent={total.percent}/><small>{total.count} graded</small></td>{activities.map(a => { const c = a.cells[st.id], g = releasedGrade(c); return <td key={a.key} data-column={false} onMouseEnter={() => highlight(a.key)} onFocus={() => highlight(a.key)}><button className={s.cell} disabled={!c} onClick={() => onOpen(a,st.id)} aria-label={`${st.name}, ${a.title}: ${g ? g.percent.toFixed(1) + '% ' + g.letter + ', ' + gradebookStatus(c) : gradebookStatus(c)}`}>{c?.manualLetter && c.state !== 'excused' ? <strong>{c.manualLetter}</strong> : g ? <><span className={s.grade} data-tone={gradeBand(g.percent)}><strong>{display === 'percent' ? g.percent.toFixed(1) + '%' : g.earned + '/' + g.possible}</strong><span>{g.letter}</span></span>{c?.needsReview ? <small className={s.pending}>Mastery review</small> : c?.state === 'reviewed' ? <small>{gradebookStatus(c)}</small> : null}</> : <span className={c?.needsReview ? s.pending : s.muted}>{c ? gradebookStatus(c) : '—'}</span>}</button></td> })}</tr>
        })}</tbody></table>{!students.length && <p className={s.empty}>No students match this selection.</p>}</div>)
})
