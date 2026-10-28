'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { letterGrade } from '@/lib/assessment-results/gradebook'
import { studentGradeSummary } from '@/lib/student-grade-summary'
import { useStudentProgress } from './StudentProgressContext'
import s from './StudentBannerProgress.module.css'

export default function StudentBannerProgress() {
  const { data, loading, error, refresh, termId, onTerm } = useStudentProgress()
  const { average, syllabus, unavailable } = studentGradeSummary(data, termId)
  const percent = loading || error ? null : average.percent
  const terms = data?.settings.terms ?? []
  const href = '/home/gradebook?' + new URLSearchParams({
    ...(data?.courseId ? { class: data.courseId } : {}),
    ...(data?.staff && data.student ? { student: data.student.id } : {}), term: termId,
  }) + '#grade-breakdown'
  const failed = error || (!!data?.student && unavailable)
  const status = loading ? 'Loading grade…' : failed ? 'Grade unavailable' : !data?.student ? data?.staff ? 'Choose a student below' : 'No assigned grades yet' : percent === null ? syllabus ? 'No grades or assigned work yet' : 'No released grades yet' : syllabus ? null : 'Released quizzes'
  return <section className={s.summary} aria-label={syllabus ? 'Overall average' : 'Quiz score'} aria-busy={loading}>
    <h2>{syllabus ? 'Overall average' : 'Quiz score'}</h2>
    {data?.staff && data.student && <p className={s.preview}>Preview: {data.student.name}</p>}
    <p className={s.value}>{percent === null ? <span aria-label="Grade unavailable">—</span> : <><strong>{percent.toFixed(1)}<span>%</span></strong><span className={s.letter}>{letterGrade(percent)}</span></>}</p>
    {status && <p className={s.status} role="status">{status}</p>}
    <label className={s.term}>Grading term<select aria-label="Banner grading term" value={termId} onChange={event => onTerm(event.target.value)} disabled={!data?.student || loading || data.warnings.some(warning => warning.source === 'Grading terms')}><option value="all">All terms</option>{terms.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}<option value="unassigned">No matching term</option></select></label>
    {failed && <button type="button" className={s.retry} onClick={refresh}>Try again</button>}
    <Link className={s.details} href={href}>Grade breakdown <ArrowRight size={14} aria-hidden="true"/></Link>
  </section>
}
