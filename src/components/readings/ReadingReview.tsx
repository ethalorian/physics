'use client'
import { ASSESSMENT_SCOPE_CHANGE } from '@/components/admin/useAssessmentReviewGuard'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ReadingDetail, ReadingSubmission } from '@/lib/textbook-assignments'
import { readingOverdue } from '@/lib/textbook-assignments'
import { readingFetch, ReadingStatus, RATING_LABELS } from './ReadingShared'
import styles from './readings.module.css'
import SubmissionSuggestions from '@/components/admin/results/SubmissionSuggestions'

export default function ReadingReview({ detail, onRefresh, initialStudent }: { detail: ReadingDetail; onRefresh: () => Promise<void>; initialStudent?: string | null }) {
  const [studentId, setStudentId] = useState(initialStudent && detail.students.some(s => s.id === initialStudent) ? initialStudent : detail.work.find(w => w.state === 'submitted')?.user_id ?? detail.students[0]?.id ?? '')
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const excused = new Set(detail.excused_student_ids ?? [])
  const student = detail.students.find(s => s.id === studentId)
  const unassigned = excused.has(studentId)
  const studentState = (id: string) => excused.has(id) ? 'unassigned' : detail.work.find(w => w.user_id === id)?.state ?? 'not_started'
  async function changeAssignment() {
    if (!student || !window.confirm(unassigned
      ? `Reassign this reading to ${student.name}? Their saved work will be restored and the current due date will apply.`
      : `Unassign this reading from ${student.name}? Their saved work and feedback are kept. Connected vocabulary and quizzes stay assigned.`)) return
    setBusy(true); setError('')
    try {
      await readingFetch(`/api/readings/${detail.assignment.id}`, { method: 'POST', body: JSON.stringify({ action: unassigned ? 'restore-student' : 'excuse', student_id: studentId, version: detail.assignment.version }) })
      await onRefresh()
    } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  const work = detail.work.find(w => w.user_id === studentId)
  const submissions = detail.submissions.filter(s => s.user_id === studentId)
  const current = submissions.find(s => s.id === work?.submission_id)
  const reviewed = detail.reviews.find(r => r.submission_id === current?.id)
  const visible = detail.students.filter(s => filter === 'all' || studentState(s.id) === filter)
  const count = (state: string) => detail.students.filter(s => studentState(s.id) === state).length
  return <div className={styles.stack}>
    <div className={styles.row} aria-label="Class reading progress">{[['not_started', 'Not started'], ['in_progress', 'In progress'], ['submitted', 'Ready to review'], ['returned', 'Needs revision'], ['rated', 'Rated'], ['unassigned', 'Unassigned']].map(([state, label]) => <span className={styles.badge} key={state}>{count(state)} {label.toLowerCase()}</span>)}</div>
    {!detail.students.length ? <p className={styles.muted}>No active students are enrolled in this class yet.</p> : <div className={styles.workGrid}>
      <aside className={styles.stack}>
        <label className={styles.field}>Show students<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Everyone ({detail.students.length})</option>{[['not_started', 'Not started'], ['in_progress', 'In progress'], ['submitted', 'Ready to review'], ['returned', 'Needs revision'], ['rated', 'Rated'], ['unassigned', 'Unassigned']].map(([value, label]) => <option key={value} value={value}>{label} ({count(value)})</option>)}</select></label>
        <div className={styles.roster}>{visible.map(s => { const w = detail.work.find(x => x.user_id === s.id); return <button data-reading-leave key={s.id} className={styles.student} aria-pressed={s.id === studentId} disabled={busy} onClick={() => { setStudentId(s.id); setError('') }}><strong>{s.name}</strong><div className={styles.row}>{excused.has(s.id) ? <span className={styles.badge}>Unassigned</span> : <ReadingStatus work={w} />}{!excused.has(s.id) && readingOverdue(detail.assignment, w) && <span className="text-sm text-destructive">Overdue</span>}</div></button> })}{!visible.length && <p className={styles.muted}>No students in this group.</p>}</div>
      </aside>
      <section className={styles.stack} aria-label="Student reading review">
        <div className={`${styles.row} ${styles.spread}`}><h2 className="text-title-2">{detail.students.find(s => s.id === studentId)?.name}</h2>{unassigned ? <span className={styles.badge}>Unassigned</span> : <ReadingStatus work={work} />}</div>
        {student && detail.assignment.status === 'published' && <Button data-reading-leave className="self-start" variant="outline" disabled={busy} onClick={() => void changeAssignment()}>{busy ? 'Saving…' : unassigned ? 'Reassign to student' : 'Unassign from student'}</Button>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {unassigned && <p role="status" className={styles.muted}>This reading is unassigned for this student. Their saved work is preserved below.</p>}
        {!current ? <div className={styles.question}><p>{work ? 'This student is still working. Their draft is not ready for mastery review.' : 'This student has not saved any answers yet.'}</p>{work && <p className={styles.muted}>{Object.values(work.answers).filter(a => a.trim()).length} of {detail.assignment.questions.length} questions answered · Last saved {new Date(work.updated_at).toLocaleString()}</p>}</div> : <>
          <p className={styles.muted}>Submitted {new Date(current.submitted_at).toLocaleString()}{!unassigned && detail.assignment.status === 'published' && work?.state === 'returned' ? ' · The student can revise and resubmit.' : ''}</p>
          <SubmittedAnswers submission={current} />
          {reviewed && <div className={styles.question}><h3 className="text-title-3">{reviewed.decision === 'returned' ? 'Returned for revision' : 'Mastery recorded'}</h3>{Object.entries(reviewed.ratings).map(([id, level]) => <p key={id}><strong>{level} · {RATING_LABELS[level - 1]}</strong> — {detail.targets.find(t => t.id === id)?.statement}</p>)}{reviewed.note && <p className="whitespace-pre-wrap">{reviewed.note}</p>}</div>}
          {!unassigned && work?.state === 'submitted' && <ReviewForm key={current.id} detail={detail} submission={current} onSaved={async () => { await onRefresh(); const next = detail.work.find(w => w.state === 'submitted' && w.user_id !== studentId); if (next) setStudentId(next.user_id) }} />}
          {submissions.length > 1 && <details className={styles.question}><summary className="cursor-pointer text-sm font-semibold">Earlier attempts ({submissions.length - 1})</summary>{submissions.filter(s => s.id !== current.id).map(s => <div className={styles.stack} key={s.id}><p className={styles.muted}>{new Date(s.submitted_at).toLocaleString()}</p><SubmittedAnswers submission={s} /><p className="whitespace-pre-wrap">{detail.reviews.find(r => r.submission_id === s.id)?.note}</p></div>)}</details>}
        </>}
      </section>
    </div>}
  </div>
}
export function SubmittedAnswers({ submission }: { submission: ReadingSubmission }) {
  return <div className={styles.stack}>{submission.snapshot.questions.map((q, i) => <article className={styles.question} key={q.id}><div className={styles.row}><span className={styles.number}>{i + 1}</span><h3 className="font-semibold">{q.reference || `Question ${i + 1}`}</h3></div>{q.prompt && <p className="whitespace-pre-wrap">{q.prompt}</p>}<div className={styles.answer}>{submission.answers[q.id] || 'No response'}</div></article>)}</div>
}
function ReviewForm({ detail, submission, onSaved }: { detail: ReadingDetail; submission: ReadingSubmission; onSaved: () => Promise<void> }) {
  const [ratings, setRatings] = useState<Record<string, number>>({}), [note, setNote] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [requestId] = useState(() => crypto.randomUUID())
  const dirty = useRef(false)
  useEffect(() => {
    const scopeChange = (event: Event) => { if (dirty.current && !event.defaultPrevented && !window.confirm('You have unsaved reading review changes. Leave without saving them?')) event.preventDefault() }
    const unload = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = '' } }
    const leave = (event: MouseEvent) => {
      if (dirty.current && (event.target as Element).closest('a[href], [data-quiz-leave], [data-reading-leave]') && !window.confirm('You have unsaved reading review changes. Leave without saving them?')) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener(ASSESSMENT_SCOPE_CHANGE, scopeChange); window.addEventListener('beforeunload', unload); document.addEventListener('click', leave, true)
    return () => { window.removeEventListener(ASSESSMENT_SCOPE_CHANGE, scopeChange); window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true) }
  }, [])
  const targets = [...new Set(submission.snapshot.questions.map(q => q.target_id))]
  async function submit(decision: 'rated' | 'returned') {
    setError('')
    if (decision === 'returned' && !note.trim()) { setError('Add a specific next step before returning this work.'); return }
    if (decision === 'rated' && targets.some(t => !ratings[t])) { setError('Choose a rating for every target, or return for revision.'); return }
    setBusy(true)
    try { await readingFetch(`/api/readings/${detail.assignment.id}`, { method: 'POST', body: JSON.stringify({ action: 'review', submission_id: submission.id, request_id: requestId, decision, ratings: decision === 'rated' ? ratings : {}, note }) }); dirty.current = false; await onSaved() } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <div className={styles.question}>
    <SubmissionSuggestions source="reading" id={submission.id} disabled={busy} onRating={r=>{if(r.level!==null){dirty.current=true;setRatings(old=>({...old,[r.target_id]:r.level!}))}}} onFeedback={text=>{dirty.current=true;setNote(old=>old||text)}}/>
    <h3 className="text-title-3">Rate the understanding</h3><p className={styles.muted}>Use the quality of the explanation, not completion or word count. If there is not enough evidence, return it with a next step.</p>
    {targets.map(id => <fieldset key={id} disabled={busy} className={styles.stack}><legend className="mb-3 text-sm font-semibold">{detail.targets.find(t => t.id === id)?.statement ?? 'Mastery target'}</legend><div className={styles.ratings}>{RATING_LABELS.map((label, i) => <button key={label} type="button" aria-pressed={ratings[id] === i + 1} onClick={() => { dirty.current = true; setRatings(r => ({ ...r, [id]: i + 1 })) }}>{i + 1} · {label}</button>)}</div></fieldset>)}
    <label className={styles.field}>Feedback and next time<textarea value={note} maxLength={2000} rows={3} onChange={e => { dirty.current = true; setNote(e.target.value) }} disabled={busy} placeholder="What is working? What will help on a future assignment?" /></label>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.actions}><Button disabled={busy} onClick={() => void submit('rated')}>{busy ? 'Saving…' : 'Release mastery & feedback'}</Button><Button variant="outline" disabled={busy} onClick={() => void submit('returned')}>Return for revision</Button></div>
  </div>
}
