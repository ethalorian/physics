'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, CheckCheck, Info } from 'lucide-react'
import { MASTERY_WORK_XP } from '@/lib/assigned-mastery-xp'
import { studentGradeSummary } from '@/lib/student-grade-summary'
import { useStudentProgress } from './StudentProgressContext'
import MasteryXpProgress from './MasteryXpProgress'
import AttendanceProgress from './AttendanceProgress'
import s from './StudentGradeBreakdown.module.css'

function UnitXpHelp({ label, weight }: { label: string; weight: number }) {
  const [mode, setMode] = useState<'preview' | 'pinned' | null>(null)
  const help = useRef<HTMLSpanElement>(null)
  const id = useId()
  const open = mode !== null

  useEffect(() => {
    if (!open) return
    function dismissOutside(event: PointerEvent) {
      if (!help.current?.contains(event.target as Node)) setMode(null)
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMode(null)
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [open])

  return <span ref={help} className={s.xpHelp}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setMode(previous => previous ?? 'preview') }}
    onPointerLeave={() => { if (mode === 'preview' && !help.current?.querySelector(':focus-visible')) setMode(null) }}>
    <button type="button" className={s.xpTrigger} aria-expanded={open} aria-describedby={open ? id : undefined}
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setMode('preview') }}
      onBlur={() => setMode(null)} onClick={() => setMode(previous => previous === 'pinned' ? null : 'pinned')}>
      {label}<Info size={15} aria-hidden="true"/>
    </button>
    {open && <span id={id} role="tooltip" className={s.xpTooltip}>
      <span>XP means experience points. You earn {MASTERY_WORK_XP} XP the first time you submit an assigned mastery activity, whatever your rating. Quizzes, labs, and transfer tasks are graded separately.</span>
      <span>Submit at least 80% of eligible activities (4 of 5) to meet a unit’s floor. Your XP grade is the share of posted units where you met the floor. It’s worth {weight}% of your overall grade. You keep that credit when you spend XP.</span>
    </span>}
  </span>
}

export default function StudentGradeBreakdown() {
  const { data, loading, error, termId, onTerm, refresh, now } = useStudentProgress()
  const { categories, average, syllabus, work, homework, workUnavailable, unavailable } = studentGradeSummary(data, termId, new Date(now))
  const liveAttendance = data?.attendance?.posted.some(grade => grade.live && (termId === 'all' || grade.term_id === termId))
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
      <dt>{category.id === 'xp' ? <UnitXpHelp label={category.label} weight={category.weight}/> : <span>{category.label}</span>}{syllabus && <small>{category.weight}% of grade</small>}</dt>
      <dd><strong>{loading || error || category.percent === null ? '—' : category.percent.toFixed(1) + '%'}</strong><span>{loading ? 'Loading…' : error || category.status === 'unavailable' ? 'Could not load' : category.status === 'empty' ? category.id === 'homework' ? 'No activities past due' : category.id === 'attendance' ? (liveAttendance ? 'No counted meetings yet' : 'Term grade unposted') : category.id === 'xp' ? 'No unit floor posted in this term' : 'No released grades' : category.id === 'homework' ? `${homework.completed} of ${homework.assigned} past-due activities completed` : category.description}</span>
        {category.id === 'attendance' ? <a href="#attendance-progress">See my term progress <ArrowRight size={13}/></a> : category.id === 'xp' ? <a href="#mastery-xp">See my eligible work <ArrowRight size={13}/></a> : category.id === 'transfer' ? <Link href={href({tab:'transfer'})}>View Transfer Brief scores <ArrowRight size={13} aria-hidden="true"/></Link> : category.id === 'labs' ? <Link href={href({tab:'labs'})}>View lab scores <ArrowRight size={13} aria-hidden="true"/></Link> : category.id === 'quizzes' ? <Link href={href({kind:'quiz'})}>View quizzes <ArrowRight size={13} aria-hidden="true"/></Link> : category.id === 'homework' ? <Link href={href({work:'past_due'})}>View counted activities <ArrowRight size={13} aria-hidden="true"/></Link> : null}
      </dd>
    </div>)}</dl>
    {syllabus && <p className={s.note}>{error || unavailable ? 'The overall average is unavailable until the grade sources load.' : average.percent === null ? 'Your overall average will appear when category grades or past-due activities are available.' : 'Your current overall average uses the categories with grades, weighted proportionally. Categories without grades are excluded, not counted as zero.'}</p>}
    {(error || unavailable) && <button className={s.retry} type="button" onClick={refresh}>Retry grade sources</button>}
    <div className={s.completion} aria-label="Assignment completion"><div><h4><CheckCheck size={16} aria-hidden="true"/>Assigned work{!loading && !error && !workUnavailable && work.percent !== null && ` · ${work.percent.toFixed(1)}% complete`}</h4><p>{loading ? 'Loading assigned work…' : error || workUnavailable ? 'Completion unavailable' : work.assigned ? <><Link href={href({work:'assigned',status:'completed_work'})} aria-label={`View ${work.completed} completed assignments`}>{work.completed} completed</Link><span aria-hidden="true"> · </span><Link href={href({work:'assigned',status:'not_completed'})} aria-label={`View ${work.notCompleted} not completed assignments`}>{work.notCompleted} not completed</Link></> : 'No assigned work in this term'}</p></div><Link href={href({work:'assigned'})}>View assigned work <ArrowRight size={14} aria-hidden="true"/></Link></div>
    {syllabus && <MasteryXpProgress report={data?.masteryXp} units={data?.units ?? []} loading={loading} failed={!!error || !!data?.warnings.some(w => w.source === 'Unit XP floor')} />}
    {syllabus && !loading && !error && !data?.warnings.some(w=>w.source==='Meaningful attendance') &&
      <AttendanceProgress report={data?.attendance} terms={data?.settings.terms ?? []} termId={termId}/>}
    <details className={s.explanation}><summary>How the average is calculated</summary>
      {syllabus && <p><strong>Meaningful attendance:</strong> each term has one attendance grade, worth 5%. Once posted for daily updates, your grade uses counted meetings through today. All terms shows the mean of posted term grades.</p>}
      {syllabus && <><p><strong>Overall average:</strong> multiply each available category average by its syllabus weight, add the results, then divide by the sum of those available weights. For example, labs at 90% and quizzes at 80%, each weighted 20%, give (90 × 20 + 80 × 20) ÷ 40 = 85%. Categories without grades are excluded.</p><p><strong>Transfer Task:</strong> the mean of the latest released grade for each Transfer Brief. Each grade uses the lowest of Science, Reasoning, Communication, and Transfer with the same conversion below. Previous attempts stay in history; a revision replaces that brief’s contribution. Private suggestions do not count.</p><p><strong>Labs:</strong> each released entry uses the lowest of Science, Reasoning, Communication, and Transfer: 4 → 96%, 3 → 89%, 2 → 85%, 1 → 75%, 0 → 50%. The lab average is the mean of those entry percentages. A released revision counts alongside the original; correcting a grade updates that entry. Earlier question-point grades remain visible in lab history and are excluded.</p></>}
      <p><strong>Quiz score:</strong> total earned points ÷ total possible points from released quizzes in the selected term. Missing and unreleased quizzes are not zeros.</p>
      <p><strong>Homework:</strong> completed activities whose deadlines have passed ÷ all activities whose deadlines have passed × 100, for the selected term. Future activities enter both counts only after their deadlines. Date-only deadlines end at midnight Eastern time. Submitted work awaiting feedback counts as complete; work returned for revision needs completion. Excused, archived, and unassigned work are excluded.{syllabus && ' This percentage supplies the 10% Homework category in your overall average.'}</p>
      {syllabus && <p><strong>Unit XP floor:</strong> submit at least 80% of your eligible mastery assignments to meet a unit’s floor. Your grade is floors met divided by units posted in the selected term. A unit with no eligible work does not count. Spending XP does not change this grade.</p>}
      <p>Term dates and teacher placement apply. Mastery ratings and lifetime XP remain separate from grades.</p>
    </details>
  </section>
}
