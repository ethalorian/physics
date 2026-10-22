'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import CheckpointTeacher from '@/components/vocabulary/checkpoint/CheckpointTeacher'
import VocabQuizReview from '@/components/vocabulary/VocabQuizReview'
import VocabAssignmentSettings from '@/components/vocabulary/VocabAssignmentSettings'
import VocabClassOverview from './VocabClassOverview'
import type { VocabMasteryData, VocabMasteryReview, VocabStudentProgress } from '@/lib/vocab-mastery'
import { vocabResponseText } from '@/lib/vocab-navigation'
import styles from './VocabControlRoom.module.css'

const labels = ['Not yet', 'Almost', 'Got it']
const statusLabel = (s: VocabStudentProgress) => s.status === 'rated' ? `Rated ${s.review!.level} · ${labels[s.review!.level - 1]}` : s.status === 'quiz-review' ? 'Review quiz answers' : s.status === 'pending' ? 'Ready to rate' : 'No completed checks'

export default function VocabControlRoom({ classId, unitId, teacher, nameFilter, onSaved }: {
  classId: string | null; unitId: string; teacher: string; nameFilter: string; onSaved: () => void
}) {
  const [data, setData] = useState<VocabMasteryData | null>(null)
  const [view, setView] = useState<'overview' | 'review' | 'checkpoints'>('overview')
  const reviewHeading = useRef<HTMLHeadingElement>(null)
  const [taskId, setTaskId] = useState(''), [studentId, setStudentId] = useState('')
  const [pendingOnly, setPendingOnly] = useState(false), [archived, setArchived] = useState(false)
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [note, setNote] = useState(''), [rerating, setRerating] = useState(false), [next, setNext] = useState(true)
  const saving = useRef(false), version = useRef(0)
  const retry = useRef<{ key: string; id: string } | null>(null)
  const load = useCallback(async () => {
    const current = ++version.current
    setLoading(true)
    try {
      const params = new URLSearchParams({ unit_id: unitId, archived: String(archived) })
      if (classId) params.set('class', classId)
      if (teacher) params.set('teacher', teacher)
      const response = await fetch(`/api/vocab/mastery?${params}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not load vocabulary evidence.')
      if (current === version.current) setData(result)
    } catch (e) {
      if (current === version.current) setError(e instanceof Error ? e.message : 'Could not load vocabulary.')
    } finally { if (current === version.current) setLoading(false) }
  }, [classId, unitId, teacher, archived])
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('task_id') ?? ''
    setTaskId(id)
    if (id) setView('review')
    if(new URLSearchParams(location.search).get('workspace')==='checkpoints')setView('checkpoints')
  }, [])
  useEffect(() => {
    void load()
    // This ref is a request generation counter, not a DOM node. Invalidate pending reads on cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { version.current++ }
  }, [load])
  const task = data?.tasks.find(t => t.id === taskId) ?? data?.tasks[0]
  const students = task?.progress.filter(s => s.name.toLowerCase().includes(nameFilter.toLowerCase()) && (!pendingOnly || s.status === 'pending' || s.status === 'quiz-review')) ?? []
  const student = students.find(s => s.studentId === studentId) ?? students[0]
  const target = data?.targets.find(t => t.id === task?.target_id)
  const pending = task?.progress.filter(s => s.status === 'pending' || s.status === 'quiz-review').length ?? 0
  const rated = task?.progress.filter(s => s.status === 'rated').length ?? 0
  useEffect(() => { setNote(''); setRerating(false); retry.current = null }, [task?.id, student?.studentId])
  useEffect(() => { if (view === 'review') reviewHeading.current?.focus() }, [view, task?.id, student?.studentId])

  function openReview(assignmentId: string, learnerId: string) {
    setTaskId(assignmentId); setStudentId(learnerId); setPendingOnly(false)
    setError(''); setNotice(''); setView('review')
  }

  async function linkTarget(targetId: string) {
    if (!task || !targetId || saving.current) return
    saving.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/vocab/mastery', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: task.id, target_id: targetId }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not link the target.')
      setNotice('Knowledge target linked for this assignment.'); setRerating(false); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not link the target.') }
    finally { saving.current = false; setBusy(false) }
  }

  async function rate(level: number) {
    if (!task || !student || !target || saving.current || !['pending', 'rated'].includes(student.status)) return
    saving.current = true; setBusy(true); setError(''); setNotice('')
    const key = JSON.stringify([task.id, student.studentId, target.id, student.evidenceKey, student.review?.id, level, note])
    if (retry.current?.key !== key) retry.current = { key, id: crypto.randomUUID() }
    try {
      const response = await fetch('/api/mastery/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        user_id: student.studentId, target_id: target.id, level,
        vocabulary: { task_id: task.id, request_id: retry.current.id, evidence_key: student.evidenceKey, previous_review_id: student.review?.id ?? null, note },
      }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not save. Your note is still here; retry when ready.')
      const review = result as VocabMasteryReview
      setData(d => d && ({ ...d, tasks: d.tasks.map(t => t.id === task.id ? { ...t, progress: t.progress.map(s => s.studentId === student.studentId ? { ...s, status: 'rated', review } : s) } : t) }))
      setNotice(`Saved ${level} · ${labels[level - 1]} for ${student.name}.`)
      setNote(''); setRerating(false); retry.current = null
      if (next) {
        const index = students.findIndex(s => s.studentId === student.studentId)
        const upcoming = [...students.slice(index + 1), ...students.slice(0, index)].find(s => s.status === 'pending')
        if (upcoming) setStudentId(upcoming.studentId)
      }
      onSaved()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the rating.') }
    finally { saving.current = false; setBusy(false) }
  }

  return <section className={styles.panel} aria-label="Vocabulary mastery">
    {view!=='checkpoints'&&<header className={styles.heading}>
      <div><p className={styles.eyebrow}>Knowledge domain</p><h2>Vocabulary dashboard</h2><p>See class progress. Open a student’s evidence to review & rate.</p></div>
      <Link className={styles.button} href={`/admin/vocabulary/assign${classId ? `?class=${encodeURIComponent(classId)}` : ''}`}>Assign & manage vocabulary ↗</Link>
    </header>}
    <div className={styles.controlsBar}><div className={styles.viewSwitch} role="group" aria-label="Vocabulary workspace">
      <button className={styles.button} disabled={busy} aria-pressed={view === 'overview'} onClick={() => setView('overview')}>Class overview</button>
      <Link className={styles.button} href={`/admin/control-room?view=quizzes${classId ? '&class='+encodeURIComponent(classId) : ''}`}>Vocabulary quizzes</Link>{!!data?.tasks.some(t=>t.quiz_format==='checkpoint')&&<button className={styles.button} disabled={busy} aria-pressed={view === 'checkpoints'} onClick={() => setView('checkpoints')}>Earlier checkpoint records</button>}
      <button className={styles.button} disabled={busy || !task} aria-pressed={view === 'review'} onClick={() => setView('review')}>Review & rate</button>
    </div>
    <div className={styles.toolbar}>
      {view !== 'checkpoints' && <label className={styles.assignment}>Vocabulary assignment<select aria-label="Vocabulary assignment" disabled={busy || !data?.tasks.length} value={task?.id ?? ''} onChange={e => { setTaskId(e.target.value); setStudentId(''); setError(''); setNotice('') }}>
        {!data?.tasks.length && <option value="">No assignments in this view</option>}
        {data?.tasks.map(t => <option key={t.id} value={t.id}>{t.title} · {t.courseLabel}{!t.target_id ? ' · Link target' : ''}{!t.active ? ' · Archived' : ''}</option>)}
      </select></label>}
      <label className={styles.toggle}><input type="checkbox" checked={archived} disabled={busy} onChange={e => setArchived(e.target.checked)} /> Include archived</label>
      {view!=='checkpoints'&&<button className={styles.button} disabled={busy || loading} onClick={() => { setError(''); void load() }}>Refresh</button>}
    </div></div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <p role="status" className={styles.notice}>{notice || (loading ? 'Loading vocabulary evidence…' : '')}</p>
    {!loading && !task && <div className={styles.empty}>No vocabulary assignments for your own classes in this unit. Unlinked assignments appear here too. Choose another class or unit, or use “Assign & manage vocabulary” to get started.</div>}
    {task && view !== 'checkpoints' && <VocabAssignmentSettings key={task.id} task={task} onSaved={load} disabled={busy || loading}/>}
    {data && !!data.tasks.length && <div hidden={view !== 'overview'}><VocabClassOverview data={data} nameFilter={nameFilter} taskId={task?.id ?? ''} disabled={busy || loading} onTaskChange={setTaskId} onOpen={openReview}/></div>}
    {view === 'checkpoints' && <CheckpointTeacher tasks={data?.tasks.filter(t=>t.quiz_format==='checkpoint')??[]} classId={classId} unitId={unitId} nameFilter={nameFilter} initialTaskId={taskId} onSaved={load} onMastery={openReview}/>}
    {task && view === 'review' && <>
      <div className={styles.summary}><span><strong>{pending}</strong> to review</span><span><strong>{rated} / {task.progress.length}</strong> rated</span><span><strong>{task.term_ids.length}</strong> words</span><span>{task.task_kind === 'quiz' ? 'Quiz' : `${task.check_mode === 'recall' ? 'Recall' : 'Recognition'} checks`}</span></div>
      <div className={styles.target}>
        <label>Knowledge target<select aria-label="Vocabulary Knowledge target" disabled={busy || loading} value={target?.id ?? ''} onChange={e => void linkTarget(e.target.value)}>
          <option value="">Choose a target to enable mastery grading…</option>
          {data?.targets.filter(t => (t.program ?? 'physics') === task.program).map(t => <option key={t.id} value={t.id}>{t.statement}</option>)}
        </select></label>
        <p>{target ? target.statement : 'Setup needed: choose the Knowledge target for this assignment. Existing checks are saved and ready to review.'}</p>
      </div>
      <div className={styles.workspace}>
        <aside className={styles.roster} aria-label="Vocabulary students">
          <div className={styles.rosterHeading}><strong>Find a student</strong><span>{students.length}</span></div>
          <label className={styles.toggle}><input type="checkbox" checked={pendingOnly} disabled={busy} onChange={e => setPendingOnly(e.target.checked)} /> Only needs review</label>
          <div className={styles.studentList}>{students.map(s => <button key={s.studentId} className={styles.student} aria-pressed={student?.studentId === s.studentId} disabled={busy || loading} onClick={() => { setStudentId(s.studentId); setError('') }}><strong>{s.name}</strong><span>{statusLabel(s)}</span></button>)}</div>
          {!students.length && <p className={styles.empty}>{pendingOnly ? 'No students need review in this view.' : 'No matching assigned students. Check the student filter above.'}</p>}
        </aside>
        {student && <article className={styles.review}>
          <div className={styles.studentHeading}><div><p className={styles.eyebrow}>Reviewing vocabulary</p><h3 ref={reviewHeading} tabIndex={-1}>{student.name}</h3><p>{statusLabel(student)}</p></div><label className={styles.toggle}><input type="checkbox" checked={next} disabled={busy} onChange={e => setNext(e.target.checked)} /> Next after rating</label></div>
          <div className={styles.metrics}><span><b>{task.quiz_format==='checkpoint'?(student.quiz?.score==null?'Pending':`${student.quiz.score}%`):student.accuracy == null ? '—' : `${student.accuracy}%`}</b> {task.quiz_format==='checkpoint'?'quiz grade':'check accuracy'}</span><span><b>{student.ready} / {student.total}</b> words at practice goal</span><span><b>{student.checks.length}</b> completed checks</span></div>
          <div className={styles.ratingBox}>
            <div className={styles.ratingHeading}><strong>Rate Knowledge mastery</strong><span>Tap a rating to save</span></div>
            {student.status === 'rated' && !rerating ? <div className={styles.saved}><p>Rated <strong>{student.review!.level} · {labels[student.review!.level - 1]}</strong> on {new Date(student.review!.created_at).toLocaleDateString()}{student.review!.note && ` — ${student.review!.note}`}</p><button className={styles.button} disabled={busy} onClick={() => setRerating(true)}>Record a new rating</button></div> : <>
              <div className={styles.ratings}>{labels.map((label, i) => <button key={label} className={styles.rating} data-level={i + 1} disabled={busy || loading || !target || !['pending', 'rated'].includes(student.status)} onClick={() => void rate(i + 1)}><b>{i + 1}</b><span>{label}</span></button>)}</div>
              <details className={styles.note}><summary>Teacher note (optional)</summary><textarea aria-label="Vocabulary teacher note" value={note} disabled={busy} maxLength={2000} onChange={e => setNote(e.target.value)} placeholder="Evidence or a next step…" /></details>
            </>}
            <p className={styles.help}>{!target ? 'Choose a Knowledge target above to enable rating.' : student.status === 'no-evidence' ? 'Waiting for a completed vocabulary check.' : student.status === 'quiz-review' ? 'Review the quiz answers below before rating Knowledge mastery.' : 'Your judgment updates Knowledge mastery. Check scores and game activity never assign a mastery grade.'}</p>
          </div>
          {task.quiz_format==='checkpoint'&&<button className={styles.button} onClick={()=>setView('checkpoints')}>Grade & release checkpoint →</button>}
          {student.quiz?.submitted && ['definition', 'sentence'].includes(task.quiz_format ?? '') && <VocabQuizReview key={`${task.id}:${student.studentId}:${student.quiz.reviewVersion}`} task={{ ...task, progress: [{ ...student, quiz: student.quiz }] }} onSaved={load} />}
          <div className={styles.words}><table><caption>Word evidence <span>Practice goal: {task.threshold}% across {task.min_checks} checks · latest 5 per word</span></caption><thead><tr><th>Word</th><th>Checks</th><th>Accuracy</th><th>Evidence</th></tr></thead><tbody>{task.words.map(word => {
            const w = student.words.find(w => w.id === word.id)
            return <tr key={word.id}><th scope="row"><details><summary>{word.term}</summary><p>{word.definition}</p></details></th><td>{w?.attempts ?? 0}</td><td>{w?.accuracy == null ? '—' : `${w.accuracy}%`}</td><td>{!w?.attempts ? 'No scored checks' : w.reviewDue ? 'Review due' : w.ready ? 'Practice goal met' : 'Building'}{Boolean(w?.supports.length) && <small>Supports: {w!.supports.join(', ')}</small>}</td></tr>
          })}</tbody></table></div>
          {!!student.checks.length && <details className={styles.responses}><summary>Student responses & check history ({student.checks.length})</summary>{student.checks.map(check => <section key={check.id}><h4>{new Date(check.completed_at!).toLocaleString()}</h4>{check.result?.map(r => <div key={r.question_id??r.term_id}><strong>{r.term ?? task.words.find(w => w.id === r.term_id)?.term}</strong><p>{vocabResponseText(r,task.words)}</p><small>{r.correct === null ? 'Awaiting teacher review' : r.correct ? 'Correct' : 'Needs correction'}{r.supports?.length ? ` · Supports: ${r.supports.join(', ')}` : ''}</small>{r.feedback && <p>Feedback: {r.feedback}</p>}</div>)}</section>)}</details>}
        </article>}
      </div>
    </>}
  </section>
}
