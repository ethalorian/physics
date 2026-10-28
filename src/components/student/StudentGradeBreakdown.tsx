'use client'

import Link from 'next/link'
import { ArrowRight, CheckCheck } from 'lucide-react'
import { studentGradeSummary } from '@/lib/student-grade-summary'
import { useStudentProgress } from './StudentProgressContext'
import s from './StudentGradeBreakdown.module.css'

export default function StudentGradeBreakdown() {
  const { data, loading, error, termId, onTerm, refresh } = useStudentProgress()
  const { categories, average, syllabus, work, workUnavailable, unavailable } = studentGradeSummary(data, termId)
  const href = (filters: Record<string, string>) => '/home/gradebook?' + new URLSearchParams({
    ...(data?.courseId ? { class: data.courseId } : {}),
    ...(data?.staff && data.student ? { student: data.student.id } : {}), term: termId, ...filters,
  })
  return <section id="grade-breakdown" tabIndex={-1} className={s.breakdown} aria-label="Grade breakdown" aria-busy={loading}>
    <header className={s.heading}>
      <div><h3>Grade breakdown</h3><p>{syllabus ? 'Your category scores and syllabus weights.' : 'Your released quiz score and assigned work.'}</p></div>
      <label>Grading term<select aria-label="Breakdown grading term" value={termId} onChange={event => onTerm(event.target.value)} disabled={loading || data?.warnings.some(warning => warning.source === 'Grading terms')}><option value="all">All terms</option>{data?.settings.terms.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}<option value="unassigned">No matching term</option></select></label>
    </header>
    <dl className={s.categories}>{categories.map(category => <div key={category.id} className={s.category}>
      <dt><span>{category.label}</span>{syllabus && <small>{category.weight}% of grade</small>}</dt>
      <dd><strong>{loading || error || category.percent === null ? '—' : category.percent.toFixed(1) + '%'}</strong><span>{loading ? 'Loading…' : error || category.status === 'unavailable' ? 'Could not load' : category.status === 'not_connected' ? 'Not connected yet' : category.status === 'empty' ? category.id === 'homework' ? 'No assigned work' : 'No released grades' : category.id === 'homework' ? `${work.completed} of ${work.assigned} assigned completed` : category.description}</span>
        {category.id === 'transfer' ? <Link href={href({tab:'transfer'})}>View Transfer Brief scores <ArrowRight size={13} aria-hidden="true"/></Link> : category.id === 'labs' ? <Link href={href({tab:'labs'})}>View lab scores <ArrowRight size={13} aria-hidden="true"/></Link> : category.id === 'quizzes' ? <Link href={href({kind:'quiz'})}>View quizzes <ArrowRight size={13} aria-hidden="true"/></Link> : category.id === 'homework' ? <Link href={href({work:'assigned'})}>View assignments <ArrowRight size={13} aria-hidden="true"/></Link> : null}
      </dd>
    </div>)}</dl>
    {syllabus && <p className={s.note}>{error || unavailable ? 'The overall average is unavailable until the grade sources load.' : average.percent === null ? 'Your overall average will appear when grades or assigned work are available.' : 'Your current overall average uses the categories with grades, weighted proportionally. Categories without grades are excluded, not counted as zero.'}</p>}
    {(error || unavailable) && <button className={s.retry} type="button" onClick={refresh}>Retry grade sources</button>}
    <div className={s.completion} aria-label="Assignment completion"><div><h4><CheckCheck size={16} aria-hidden="true"/>Assigned work{!loading && !error && !workUnavailable && work.percent !== null && ` · ${work.percent.toFixed(1)}% complete`}</h4><p>{loading ? 'Loading assigned work…' : error || workUnavailable ? 'Completion unavailable' : work.assigned ? <><Link href={href({work:'assigned',status:'completed_work'})} aria-label={`View ${work.completed} completed assignments`}>{work.completed} completed</Link><span aria-hidden="true"> · </span><Link href={href({work:'assigned',status:'not_completed'})} aria-label={`View ${work.notCompleted} not completed assignments`}>{work.notCompleted} not completed</Link></> : 'No assigned work in this term'}</p></div><Link href={href({work:'assigned'})}>View assigned work <ArrowRight size={14} aria-hidden="true"/></Link></div>
    <details className={s.explanation}><summary>How the average is calculated</summary>
      {syllabus && <><p><strong>Overall average:</strong> multiply each available category average by its syllabus weight, add the results, then divide by the sum of those available weights. For example, labs at 90% and quizzes at 80%, each weighted 20%, give (90 × 20 + 80 × 20) ÷ 40 = 85%. Categories without grades are excluded.</p><p><strong>Transfer Task:</strong> the mean of the latest released grade for each Transfer Brief. Each grade uses the lowest of Science, Reasoning, Communication, and Transfer with the same conversion below. Previous attempts stay in history; a revision replaces that brief’s contribution. Private suggestions do not count.</p><p><strong>Labs:</strong> each released entry uses the lowest of Science, Reasoning, Communication, and Transfer: 4 → 96%, 3 → 89%, 2 → 85%, 1 → 75%, 0 → 50%. The lab average is the mean of those entry percentages. A released revision counts alongside the original; correcting a grade updates that entry. Earlier question-point grades remain visible in lab history and are excluded.</p></>}
      <p><strong>Quiz score:</strong> total earned points ÷ total possible points from released quizzes in the selected term. Missing and unreleased quizzes are not zeros.</p>
      <p><strong>Homework:</strong> completed assignments ÷ total assigned assignments × 100, for the selected term. All assignment types count, including work with future deadlines. Submitted work awaiting feedback counts as complete; work returned for revision needs completion. Excused, archived, and unassigned work are excluded.{syllabus && ' This percentage supplies the 10% Homework category in your overall average.'}</p>
      <p>Term dates and teacher placement apply. Mastery ratings and lifetime XP remain separate from grades.</p>
    </details>
  </section>
}
