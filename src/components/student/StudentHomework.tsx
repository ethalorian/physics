'use client'

import Link from 'next/link'
import {ArrowRight, CircleAlert} from 'lucide-react'
import {RESULT_KINDS} from '@/lib/assessment-results/types'
import {isStudentHomework, studentDueLabel, studentRowOrder} from '@/lib/student-gradebook'
import {useStudentProgress} from './StudentProgressContext'
import s from './StudentProgress.module.css'

export default function StudentHomework() {
  const {data, loading, error, refresh, studentId, onClass, onStudent, now} = useStudentProgress()
  const missing = (data?.rows ?? []).filter(row => isStudentHomework(row, new Date(now))).sort(studentRowOrder)
  const href = '/home/gradebook?' + new URLSearchParams({work: 'homework', term: 'all',
    ...(data?.courseId ? {class: data.courseId} : {}),
    ...(data?.staff && data.student ? {student: data.student.id} : {}),
  })
  return <section className={`${s.workspace} ${s.missing}`} aria-label="Homework to finish">
    <header><h3><CircleAlert size={18} aria-hidden="true"/> Homework to finish {data?.student && <span className={s.count}>{missing.length}</span>}</h3><span>Past due · Not completed · Across all terms</span>
      {data && <div className={s.scope}>
        {!data.staff && data.courses.length > 1 && <label>Class<select value={data.courseId ?? ''} onChange={event => onClass(event.target.value)}>{data.courses.map(course => <option key={course.id} value={course.id}>{[course.name, course.section].filter(Boolean).join(' · ')}</option>)}</select></label>}
        {data.staff && <label>Student preview<select value={studentId} onChange={event => onStudent(event.target.value)}><option value="">Choose a student</option>{data.roster.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>}
      </div>}
    </header>
    {error && <p className={s.alert} role="alert">Homework could not refresh. {data ? 'Previously loaded information remains below.' : ''} <button onClick={refresh}>Try again</button></p>}
    {data?.warnings.map(warning => <p className={s.alert} role="alert" key={warning.source}><strong>{warning.source}:</strong> {warning.message} <button onClick={refresh}>Retry</button></p>)}
    {loading && !data ? <p className={s.empty} role="status">Loading your homework…</p> : data && !data.student ? <p className={s.empty}>{data.staff ? 'Choose a student to preview their homework.' : 'Your homework will appear when you are enrolled in a class.'}</p> : data?.student && <>
      {missing.slice(0, 3).map(row => <article className={s.missingRow} key={row.key}><div><strong>{row.title}</strong><p>{row.kind === 'worksheet' ? 'Paper worksheet · Hand-in not recorded' : RESULT_KINDS[row.kind] + (row.status === 'revise' ? ' · Revision needed' : ' · Not completed')}</p></div><span>Due {studentDueLabel(row.dueAt)}</span><Link href={row.href}>View work <ArrowRight size={16}/></Link></article>)}
      {!missing.length && <p className={s.empty}>{error || data.warnings.length ? 'No homework to finish in the work that loaded.' : 'No overdue homework to finish. You’re caught up.'}</p>}
      {missing.length > 0 && <footer><span>Showing {Math.min(3, missing.length)} of {missing.length} homework items</span><Link href={href}>View all {missing.length} homework items <ArrowRight size={16}/></Link></footer>}
    </>}
  </section>
}
