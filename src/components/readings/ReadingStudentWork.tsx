'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import AssignmentChapterReader from './interactive/AssignmentChapterReader'
import ReadingLearningPath from './interactive/ReadingLearningPath'
import ReadingXpReceipt from './ReadingXpReceipt'
import { useSession } from 'next-auth/react'
import { useTextbookLanguage } from './TextbookLanguageToggle'
import { interactiveChapterForAssignment } from './interactive/registry'
import type { ReadingQuestion } from '@/lib/textbook-assignments'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { readingOverdue, type ReadingDetail, type ReadingWork } from '@/lib/textbook-assignments'
import { dueLabel, readingFetch, ReadingStatus, RATING_LABELS } from './ReadingShared'
import ReadingAssignmentResources, { ReadingQuestionText } from './ReadingAssignmentResources'
import styles from './readings.module.css'
import {WrittenResponse} from '@/components/interactive-assignments/QuestionResponse'
import ReadingCompanion from '@/components/avatar/ReadingCompanion'

export default function ReadingStudentWork({ id, initialInteractive = true }: { id: string; initialInteractive?: boolean }) {
  const { data: session } = useSession()
  const [language] = useTextbookLanguage()
  const [data, setData] = useState<ReadingDetail | null>(null), [error, setError] = useState('')
  const load = useCallback(async (signal?: AbortSignal) => { setError(''); try { setData(await readingFetch<ReadingDetail>(`/api/readings/${id}`, { signal })) } catch (e) { if (!signal?.aborted) setError((e as Error).message) } }, [id])
  useEffect(() => { const c = new AbortController(); void load(c.signal); return () => c.abort() }, [load])
  if (error) return <div className={styles.page}><p className={styles.error} role="alert">{error}</p><Button className="mt-4" onClick={() => void load()}>Retry</Button><Button asChild variant="ghost"><Link href="/readings">All readings</Link></Button></div>
  if (!data) return <div className={styles.page}><Spinner /></div>
  const chapter = interactiveChapterForAssignment(data.assignment, language)
  if (data.staff && initialInteractive && chapter && session?.user?.id) return <AssignmentChapterReader definition={chapter} teacher assignment={data.assignment} assignmentNotice={<ReadingXpReceipt teacher />} storageKey={`antocci:reader:${session.user.id}:${chapter.book}:${chapter.chapter}:${chapter.language}:${chapter.contentVersion}`} backLink={<Link href={`/admin/readings?id=${id}`}>← Class review</Link>} renderQuestion={(q, i) => <article className={styles.question}><h3>Response {i + 1} · {q.reference}</h3><ReadingQuestionText chapter={data.assignment.chapter} question={q} /><p>{data.targets.find(t => t.id === q.target_id)?.statement}</p></article>} assignmentFooter={<Button asChild><Link href={`/admin/readings?id=${id}`}>Open class roster & review</Link></Button>} />
  if (data.staff) return <div className={styles.page}><Button asChild><Link href={`/admin/readings?id=${id}`}>Open class roster & review</Link></Button></div>
  return <AnswerWorkspace key={id} detail={data} initialInteractive={initialInteractive} userId={session?.user?.id} />
}
function AnswerWorkspace({ detail, initialInteractive, userId }: { detail: ReadingDetail; initialInteractive: boolean; userId?: string }) {
  const [interactive, setInteractive] = useState(initialInteractive)
  const [language] = useTextbookLanguage()
  const chapter = interactiveChapterForAssignment(detail.assignment, language)
  const router = useRouter()
  const a = detail.assignment
  const [readingQuiz,setReadingQuiz] = useState(detail.readingQuiz ?? null)
  const [xp, setXp] = useState(detail.xp ?? null)
  const origin=detail.lesson_slug
  const [work, setWork] = useState(detail.work[0] ?? null), [answers, setAnswers] = useState<Record<string, string>>(detail.work[0]?.answers ?? {})
  const [savedAnswers, setSavedAnswers] = useState(JSON.stringify(detail.work[0]?.answers ?? {})), [busy, setBusy] = useState(false), [submitting, setSubmitting] = useState(false), [error, setError] = useState(''), [blocked, setBlocked] = useState(false)
  const version = useRef(work?.version ?? 0), locked = useRef(work?.state === 'submitted' || work?.state === 'rated'), currentAnswers = useRef(answers), queue = useRef<Promise<void>>(Promise.resolve()), submitRequest = useRef<{ key: string; id: string } | null>(null)
  const editable = a.status === 'published' && (!work || ['in_progress', 'returned'].includes(work.state))
  const savedSnapshot = useRef(savedAnswers)
  const dirty = savedAnswers !== JSON.stringify(answers)
  const review = detail.reviews.find(r => r.submission_id === work?.submission_id)
  const answered = a.questions.filter(q => answers[q.id]?.trim()).length
  useEffect(() => { currentAnswers.current = answers }, [answers])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (JSON.stringify(currentAnswers.current) !== savedSnapshot.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn)
  }, [])
  const persist = useCallback((action: 'save' | 'submit') => {
    // Requests run in order; a late autosave can never overwrite a submission.
    const task = queue.current.catch(() => {}).then(async () => {
      if (action === 'save' && locked.current) return
      setBusy(true); setError('')
      const snapshot = { ...currentAnswers.current }, key = JSON.stringify(snapshot)
      if (action === 'submit' && submitRequest.current?.key !== key) submitRequest.current = { key, id: crypto.randomUUID() }
      try {
        const result = await readingFetch<{ work: ReadingWork; readingQuiz?: ReadingDetail["readingQuiz"]; xp?: ReadingDetail["xp"] }>(`/api/readings/${a.id}`, { method: 'POST', body: JSON.stringify({ action, answers: snapshot, version: version.current, request_id: action === 'submit' ? submitRequest.current!.id : crypto.randomUUID() }) })
        if (action === 'submit') {
          setReadingQuiz(result.readingQuiz ?? null); setXp(result.xp ?? null)
          window.dispatchEvent(new CustomEvent('xp-updated'))
        }
        version.current = result.work.version; locked.current = result.work.state === 'submitted' || result.work.state === 'rated'; setWork(result.work); savedSnapshot.current = key; setSavedAnswers(key)
      } catch (e) { setError((e as Error).message); setBlocked(true); throw e } finally { setBusy(false) }
    })
    queue.current = task
    return task
  }, [a.id])
  useEffect(() => {
    if (!editable || !dirty || submitting || blocked) return
    const timer = setTimeout(() => { void persist('save').catch(() => {}) }, 1000)
    return () => clearTimeout(timer)
  }, [answers, dirty, editable, submitting, blocked, persist])
  async function submit() {
    setSubmitting(true)
    try { await persist('submit') } catch {} finally { setSubmitting(false) }
  }
  function copyDownload() {
    const text = a.questions.map((q, i) => `${i + 1}. ${q.reference}\n${q.prompt}\n\n${answers[q.id] ?? ''}`).join('\n\n---\n\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })), link = document.createElement('a'); link.href = url; link.download = 'reading-answers.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const backButton = <Button variant="ghost" className="mb-4" disabled={submitting} onClick={async () => { try { if (editable && dirty) await persist('save'); router.push(origin?`/lessons/${origin}`:'/readings') } catch {} }}><ArrowLeft />{origin?'Back to lesson':'All readings'}</Button>
  const quizNotice = <>{readingQuiz && <section className={styles.question} aria-label="Reading quiz"><h2 className="text-title-3">{readingQuiz.locked?'Your reading quiz':readingQuiz.needsCompletion?'Reading quiz · Needs completion':readingQuiz.state==='graded'?'Reading quiz complete':'Reading quiz submitted'}</h2><p className={styles.muted}>{readingQuiz.locked?'Complete and submit all reading responses to unlock your quiz.':readingQuiz.needsCompletion?'Your quiz is unlocked. Complete it now or return later from your outstanding quizzes. It stays marked Needs completion until you submit it.':'Your quiz submission is saved. You can return to see your work and feedback.'}</p>{readingQuiz.id && <Button asChild className="mt-3"><Link href={`/quizzes/${readingQuiz.id}`}>{readingQuiz.needsCompletion?(readingQuiz.state==='not_started'?'Start reading quiz':'Continue reading quiz'):'View reading quiz'}</Link></Button>}{readingQuiz.needsCompletion&&<Button asChild variant="outline" className="mt-3 ml-2"><Link href="/readings">Do quiz later</Link></Button>}</section>}</>
  async function openConnectedActivity(href: string) {
    if (submitting || busy) return
    try { if (editable && dirty) await persist('save'); router.push(href) } catch { /* Save error keeps the answers visible. */ }
  }
  const learningPath = <ReadingLearningPath assignmentId={a.id} courseId={a.course_id} readingState={work?.state ?? 'not_started'} readingQuiz={readingQuiz} onOpen={href => void openConnectedActivity(href)} disabled={submitting || busy}>{quizNotice}</ReadingLearningPath>
  const archiveNotice = <>{a.status === 'archived' && <p className={styles.question}>This reading is archived. Your saved answers and feedback remain available.</p>}</>
  const reviewFeedback = <>{review && <section className={styles.question} aria-label="Teacher feedback"><h2 className="text-title-2">{review.decision === 'returned' ? 'Your next step' : 'Your mastery feedback'}</h2>{review.note && <p className="whitespace-pre-wrap">{review.note}</p>}{Object.entries(review.ratings).map(([id, level]) => <p key={id}><strong>{level} · {RATING_LABELS[level - 1]}</strong> — {detail.targets.find(t => t.id === id)?.statement}</p>)}{review.decision === 'returned' && <p className={styles.muted}>Revise your answers below, then submit again. Your earlier attempt is kept.</p>}</section>}</>
  const xpReceipt = <ReadingXpReceipt xp={xp} archived={a.status === 'archived'} onOpen={href => void openConnectedActivity(href)} disabled={submitting || busy} />
  const submittedNotice = <>{work?.state === 'submitted' && <div className={`${styles.question} border-success`} role="status"><div className={styles.row}><CheckCircle2 className="text-success" /><h2 className="text-title-3">Submitted for mastery review</h2></div><p>Your teacher will review your explanations. Check here for feedback and your rating.</p></div>}</>
  const saveError = <>{error && <div role="alert" className={styles.error}><p>{error}</p><p className="mt-2">Your answers are still on this screen. Download a copy before reloading.</p><Button variant="outline" className="mt-3" onClick={copyDownload}>Download my answers</Button></div>}</>
  const saveFooter = <>{editable && <div className={styles.footer}><div aria-live="polite"><p className="text-sm font-semibold">{busy ? 'Saving…' : dirty ? 'Unsaved changes' : work ? 'All answers saved' : 'Answers save as you type'}</p><p className={styles.muted}>Submitting locks this attempt for your teacher to review.</p></div><div className={styles.actions}><Button variant="outline" disabled={busy || submitting} onClick={() => { setBlocked(false); void persist('save').catch(() => {}) }}>Save draft</Button><Button disabled={submitting || busy || answered !== a.questions.length} onClick={() => void submit()}>{submitting ? 'Submitting…' : work?.state === 'returned' ? 'Resubmit for review' : 'Submit for mastery review'}</Button></div></div>}</>
  const submissionHistory = <>{!!detail.submissions.length && <details className={styles.question}><summary className="cursor-pointer font-semibold">Submission history ({detail.submissions.length})</summary>{detail.submissions.map(s => <div key={s.id} className={styles.stack}><p className={styles.muted}>Submitted {new Date(s.submitted_at).toLocaleString()}</p>{s.snapshot.questions.map(q => <div key={q.id}><p className="font-semibold">{q.reference || q.prompt}</p><p className={styles.answer}>{s.answers[q.id]}</p></div>)}{detail.reviews.find(r => r.submission_id === s.id)?.note && <p className="whitespace-pre-wrap">Feedback: {detail.reviews.find(r => r.submission_id === s.id)?.note}</p>}</div>)}</details>}</>
  const renderQuestion = (q: ReadingQuestion, i: number) => <article key={q.id} className={styles.question}><div className={styles.row}><span className={styles.number}>{i + 1}</span><h3 className="text-title-3">{q.reference || `Question ${i + 1}`}</h3></div><ReadingQuestionText chapter={a.chapter} question={q} /><p className="text-sm text-primary">{detail.targets.find(t => t.id === q.target_id)?.statement}</p>{editable ? <div><WrittenResponse id={'reading-'+q.id} label={`Your reasoning · question ${i+1}`} maxLength={10000} value={answers[q.id]??''} disabled={submitting} onChange={value=>{const next={...answers,[q.id]:value};currentAnswers.current=next;setAnswers(next)}} help="Use evidence from the reading, calculations, and units where appropriate."/><small aria-live="polite">{error ? 'Saving needs attention. Your answer is still on this screen.' : busy ? 'Saving…' : dirty ? 'Unsaved changes' : work ? 'All answers saved' : 'Answers save as you type'}</small></div> : <div className={styles.answer}>{answers[q.id] || 'No answer saved'}</div>}</article>
  if (interactive && chapter && userId) return <AssignmentChapterReader definition={chapter} assignment={a} answered={answered}
    storageKey={`antocci:reader:${userId}:${chapter.book}:${chapter.chapter}:${chapter.language}:${chapter.contentVersion}`}
    backLink={<div>{backButton}<button type="button" className="mt-3 text-sm underline" onClick={() => setInteractive(false)}>Use the PDF workspace</button></div>}
    renderQuestion={renderQuestion}
    assignmentNotice={<div className={styles.stack}>{learningPath}{xpReceipt}{archiveNotice}<div className={styles.row}><ReadingStatus work={work} /><span aria-live="polite">{error ? 'Saving needs attention — review your work below.' : busy ? 'Saving…' : dirty ? 'Unsaved changes' : work ? 'All answers saved' : 'Answers save as you type'}</span></div>{readingOverdue(a, work) ? <p>Overdue; you can still submit.</p> : null}</div>}
    assignmentFeedback={<div className={styles.stack}>{reviewFeedback}{submittedNotice}</div>}
    assignmentFooter={<div className={styles.stack}>{saveError}{saveFooter}{submissionHistory}</div>}
  />
  return <div className={styles.page}>
    {backButton}
    {learningPath}
    {xpReceipt}
    <header className={styles.hero}><div className={`${styles.row} ${styles.spread}`}><p className="text-overline text-primary">{a.honors_reading?'OpenStax AP Physics 2e':a.passage?'Course reading':`Hewitt · Chapter ${a.chapter}`} · Reading assignment</p><ReadingStatus work={work} /></div><h1 className="text-display mt-3">{a.title}</h1><p className="mt-3 text-title-3">{a.reading}</p><p className={`mt-3 ${readingOverdue(a, work) ? 'text-sm text-destructive' : styles.muted}`}>{dueLabel(a.due_at)}{readingOverdue(a, work) ? ' · Overdue; you can still submit.' : ''}</p>{a.instructions && <p className="mt-4 whitespace-pre-wrap">{a.instructions}</p>}</header>
    <div className={styles.stack}>
      {chapter && userId ? <Button variant="outline" onClick={() => setInteractive(true)}>Open interactive chapter · read & answer together</Button> : null}
      <ReadingCompanion title={a.title} focus={a.questions.find(q=>!answers[q.id]?.trim())?.prompt??a.questions[0]?.prompt??a.reading}><ReadingAssignmentResources assignment={a} showInteractiveLink={false} /></ReadingCompanion>
      {archiveNotice}
      {reviewFeedback}
      {submittedNotice}
      <div className={`${styles.row} ${styles.spread}`}><h2 className="text-title-2">Your answers</h2><p className={styles.muted}>{answered} of {a.questions.length} answered</p></div>
      {a.questions.map(renderQuestion)}
      {saveError}
      {saveFooter}
      {submissionHistory}
    </div>
  </div>
}
