'use client'

import { useEffect, useState } from 'react'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
import ChapterTwoReader from './ChapterTwoReader'
import { LearningPathOverview } from './LearningPathOverview'
import styles from './chapter-two.module.css'

export const PREVIEW_ASSIGNMENT: ReadingAssignment = {
  id: '00000000-0000-4000-8000-000000000002', course_id: '00000000-0000-4000-8000-000000000001',
  title: 'Why doesn’t the book fall?', chapter: 2,
  reading: 'Read sections 2.1–2.3 · Forces, equilibrium, and support', section_ids: ['2.1', '2.2', '2.3'],
  instructions: 'Use the explorations to test your ideas. Then explain your reasoning in the three assigned responses.',
  due_at: null, status: 'published', version: 1, created_at: '2026-10-12T12:00:00Z',
  questions: [
    { id: '00000000-0000-4000-8000-000000000011', reference: 'Section 2.1 · Concept check', target_id: 'identify-forces', prompt: 'A book stays at rest on a table. Identify each force acting on the book, who or what exerts it, and its direction. Why is “no forces act” an incomplete explanation?' },
    { id: '00000000-0000-4000-8000-000000000012', reference: 'Section 2.2 · Explain the balance', target_id: 'equilibrium', prompt: 'Two vertical cables support a 500 N sign at rest. One cable has a tension of 180 N. Find the other tension. Write an equation and explain why your answer makes sense.' },
    { id: '00000000-0000-4000-8000-000000000013', reference: 'Section 2.3 · Make a claim with evidence', target_id: 'support', prompt: 'Use the support-force exploration. Describe what happens when you press down on the book. Which force changes, which force stays the same, and how does the book remain in equilibrium?' },
  ],
}
const KEY = 'antocci:interactive-reader:sample-assignment:v1'
type Sample = { answers: Record<string, string>; state: 'in_progress' | 'submitted' | 'returned' | 'rated'; note: string; submissions: number; ratings: Record<string, string> }
const empty = (): Sample => ({ answers: {}, state: 'in_progress', note: '', submissions: 0, ratings: {} })
const targets = ['Identify the forces acting on an object.', 'Use net force to explain equilibrium.', 'Explain how a support force responds.']

/** An explicit local-only demonstration. Live assignments use ReadingStudentWork and its API. */
export default function ChapterTwoPreview() {
  const [sample, setSample] = useState<Sample>(empty), [ready, setReady] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState(false)
  const [review, setReview] = useState(false), [decision, setDecision] = useState('returned'), [note, setNote] = useState(''), [ratings, setRatings] = useState<Record<string, string>>({})
  useEffect(() => {
    try {
      const x = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (x && ['in_progress', 'submitted', 'returned', 'rated'].includes(x.state)) {
        const answers: Record<string, string> = {}, levels: Record<string, string> = {}
        for (const q of PREVIEW_ASSIGNMENT.questions) { if (typeof x.answers?.[q.id] === 'string') answers[q.id] = x.answers[q.id].slice(0, 10000); if (['1', '2', '3'].includes(x.ratings?.[q.target_id])) levels[q.target_id] = x.ratings[q.target_id] }
        setSample({ answers, ratings: levels, state: x.state, note: typeof x.note === 'string' ? x.note.slice(0, 4000) : '', submissions: Number.isSafeInteger(x.submissions) && x.submissions > 0 ? x.submissions : 0 })
      }
    } catch { setError(true) }
    setReady(true)
  }, [])
  useEffect(() => { if (!ready) return; setSaved(false); const timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(sample)); setSaved(true); setError(false) } catch { setError(true) } }, 350); return () => clearTimeout(timer) }, [sample, ready])
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (ready && !saved) { e.preventDefault(); e.returnValue = '' } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn) }, [ready, saved])
  const editable = sample.state === 'in_progress' || sample.state === 'returned'
  const answered = PREVIEW_ASSIGNMENT.questions.filter(q => sample.answers[q.id]?.trim()).length
  return <ChapterTwoReader preview storageKey="antocci:interactive-reader:preview:hewitt:2:en:pilot-1" assignment={PREVIEW_ASSIGNMENT} answered={answered}
    renderQuestion={(q, i) => <article className={styles.demoQuestion}><h3>{q.reference}</h3><p>{q.prompt}</p><p className={styles.demoTarget}>LEARNING TARGET · {targets[i]}</p>{editable ? <label>Assigned response {i + 1}<textarea rows={5} maxLength={10000} disabled={!ready} value={sample.answers[q.id] || ''} onChange={e => { setSaved(false); setSample(s => ({ ...s, answers: { ...s.answers, [q.id]: e.target.value } })) }} placeholder="Explain your thinking. Include evidence, calculations, and units when needed." /></label> : <p className={styles.demoAnswer}>{sample.answers[q.id]}</p>}<small aria-live="polite">{error ? 'Device storage unavailable — copy your work before leaving.' : !ready ? 'Loading sample work…' : saved ? 'Sample work saved on this device' : 'Saving sample work…'}</small></article>}
    assignmentNotice={<LearningPathOverview sample items={[
      { title: 'Read & explain', status: sample.state === 'rated' ? 'Sample review recorded' : sample.state === 'submitted' ? 'Sample submitted' : sample.state === 'returned' ? 'Revise sample responses' : 'Work beside the reading', description: 'Submit your explanations for feedback on the assigned learning targets.' },
      { title: 'Vocabulary practice', status: 'Prepared with the class reading', description: 'Practice force, equilibrium, support, and other words chosen for the assignment.' },
      { title: 'Reading quiz', status: sample.submissions ? 'Would unlock in your class' : 'Unlocks after reading submission', description: 'Apply the ideas to new situations and revisit earlier learning.' },
      { title: 'Vocabulary quiz', status: 'Teacher chooses when to publish', description: 'Explain the words and use them in a physically correct example.' },
    ]} />}
    assignmentFeedback={sample.note ? <section className={styles.demoFeedback} aria-label="Sample teacher feedback"><p className={styles.eyebrow}>SAMPLE TEACHER FEEDBACK</p><h2>{sample.state === 'returned' ? 'Your next step' : 'Your mastery feedback'}</h2><p>{sample.note}</p>{Object.entries(sample.ratings).map(([id, level]) => <p key={id}><strong>{['Not yet', 'Almost', 'Got it'][Number(level) - 1]}</strong> · {targets[PREVIEW_ASSIGNMENT.questions.findIndex(q => q.target_id === id)]}</p>)}{sample.state === 'returned' ? <p>Revise your explanations beside the reading, then resubmit below.</p> : null}</section> : null}
    assignmentFooter={<div className={styles.demoFooter}>
      <div className={styles.demoSaveRow}><div aria-live="polite"><b>{sample.state === 'submitted' ? 'Submitted for sample review' : sample.state === 'rated' ? 'Sample review complete' : error ? 'Unable to save on this device' : saved ? 'Sample answers saved' : 'Saving sample answers…'}</b><p>{answered} of 3 responses written · {sample.submissions} sample submission{sample.submissions === 1 ? '' : 's'}</p></div>{editable ? <button className={styles.primaryButton} disabled={!ready || answered !== 3} onClick={() => { setSaved(false); setSample(s => ({ ...s, state: 'submitted', submissions: s.submissions + 1, note: '', ratings: {} })) }}>{sample.state === 'returned' ? 'Resubmit sample work' : 'Submit sample work'}</button> : null}</div>
      {!editable ? <div className={styles.demoSubmitted}><p>Your explanations are locked for review. This demonstration does not create student records or award mastery.</p><button className={styles.secondaryButton} onClick={() => setReview(!review)} aria-expanded={review}>Try the teacher review</button></div> : <p>Complete all three responses to submit. Practice checks are optional and do not count toward a rating.</p>}
      {review && !editable ? <section className={styles.demoReview} aria-label="Sample teacher review"><p className={styles.eyebrow}>TEACHER REVIEW · LOCAL DEMONSTRATION</p><h3>Respond to the evidence.</h3><p>Review the explanations, identify a useful next step, and return the work or rate each learning target.</p>{PREVIEW_ASSIGNMENT.questions.map((q, i) => <div key={q.id}><strong>Response {i + 1} · {targets[i]}</strong><p className={styles.demoAnswer}>{sample.answers[q.id]}</p></div>)}<label>Review decision<select value={decision} onChange={e => setDecision(e.target.value)}><option value="returned">Return for revision</option><option value="rated">Rate learning targets</option></select></label>{decision === 'rated' ? PREVIEW_ASSIGNMENT.questions.map((q, i) => <label key={q.id}>{targets[i]}<select value={ratings[q.target_id] || ''} onChange={e => setRatings(r => ({ ...r, [q.target_id]: e.target.value }))}><option value="">Choose a rating</option><option value="1">1 · Not yet</option><option value="2">2 · Almost</option><option value="3">3 · Got it</option></select></label>) : null}<label>Specific feedback<textarea rows={4} maxLength={4000} value={note} onChange={e => setNote(e.target.value)} placeholder="Name the evidence you noticed and one concrete next step." /></label><button className={styles.primaryButton} disabled={!note.trim() || (decision === 'rated' && PREVIEW_ASSIGNMENT.questions.some(q => !ratings[q.target_id]))} onClick={() => { setSample(s => ({ ...s, state: decision === 'rated' ? 'rated' : 'returned', note, ratings: decision === 'rated' ? ratings : {} })); setSaved(false); setReview(false) }}>Save sample feedback</button></section> : null}
      <button className={`${styles.textButton} ${styles.demoReset}`} onClick={() => { setSample(empty()); setSaved(false); setReview(false); setNote(''); setRatings({}) }}>Reset sample assignment</button>
    </div>}
  />
}
