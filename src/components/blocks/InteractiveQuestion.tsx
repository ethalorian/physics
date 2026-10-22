'use client'

import { useId, useState } from 'react'
import { Check, ChevronRight, Lightbulb } from 'lucide-react'
import { ChoiceResponse, QuestionPrompt } from '@/components/interactive-assignments/QuestionResponse'
import ProblemStageInput, { ProblemStageDisplay } from './ProblemStageInput'
import { useDraft } from './useDraft'
import { interactiveComplete, partComplete, type InteractiveTask, type InteractiveAnswer } from '@/lib/interactive-question'
import { type ProblemStageResponse } from '@/lib/problem-response'
import s from './InteractiveQuestion.module.css'

const formats = { concept: 'Multiple choice', application: 'Interactive problem', transfer: 'Transfer challenge', design: 'Design challenge' }
export default function InteractiveQuestion({ task, value, readOnly, onDraft, onSave }: {
  task: InteractiveTask; value?: InteractiveAnswer; readOnly?: boolean
  onDraft: (value: InteractiveAnswer) => void; onSave: (value: InteractiveAnswer) => void | Promise<boolean>
}) {
  const uid = useId()
  const [answer, setAnswer] = useState<InteractiveAnswer>(() => value?.version === 1 ? value : { version: 1, answers: {} })
  const [active, setActive] = useState(0), [review, setReview] = useState(Boolean(readOnly))
  const [dirty, setDirty] = useState(false), [saving, setSaving] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState('')
  useDraft(onDraft, dirty ? answer : undefined)
  const complete = interactiveComplete(task, answer)
  const count = task.parts.filter(p => partComplete(p, answer.answers[p.id])).length
  function change(id: string, next: string | ProblemStageResponse) { setDirty(true); setSaved(false); setError(''); setAnswer(a => ({ version: 1, answers: { ...a.answers, [id]: next } })) }
  async function save() {
    setSaving(true); setError('')
    try { if (await onSave(answer) === false) setError('Your answer was not saved. Try again.'); else { setSaved(true); setDirty(false) } }
    catch { setError('Your answer was not saved. Try again.') }
    finally { setSaving(false) }
  }
  return <section className={s.board} aria-label={`${formats[task.format]}: ${task.title}`}>
    <div className={s.top}><span>{formats[task.format]}</span><span>{count}/{task.parts.length} {task.parts.length===1?'part':'parts'} ready</span></div>
    <QuestionPrompt>{task.prompt}</QuestionPrompt>
    {task.parts.length > 1 && <nav className={s.parts} aria-label="Question parts">{task.parts.map((part, i) => <button type="button" key={part.id} aria-current={!review && active === i ? 'step' : undefined} onClick={() => { setActive(i); setReview(false) }}><span>{partComplete(part, answer.answers[part.id]) ? <Check size={14} aria-hidden/> : String.fromCharCode(65+i)}</span>{part.label}</button>)}<button type="button" aria-pressed={review} onClick={() => setReview(true)}>Review</button></nav>}
    {task.parts.filter((_, i) => review || i === active).map(part => <section key={part.id} className={s.part}>
      <h3>{part.label}</h3>
      {part.kind === 'choice' ? <><ChoiceResponse label={part.prompt} options={part.options.map(o => ({ id: o.id, content: o.text }))} value={String(answer.answers[part.id] ?? '')} onChange={id => change(part.id, id)} disabled={readOnly || saving}/></>
        : part.kind === 'number' ? <><QuestionPrompt>{part.prompt}</QuestionPrompt><label className={s.number} htmlFor={`${uid}-${part.id}`}><span>{part.label}</span><div><input id={`${uid}-${part.id}`} type="text" inputMode="decimal" autoComplete="off" value={String(answer.answers[part.id] ?? '')} onChange={e => change(part.id, e.target.value)} disabled={readOnly || saving}/><strong>{part.unit}</strong></div></label></>
        : readOnly ? <><QuestionPrompt>{part.prompt}</QuestionPrompt><ProblemStageDisplay label={part.label} value={answer.answers[part.id] as ProblemStageResponse}/></>
        : <ProblemStageInput label={part.label} help={part.prompt} value={answer.answers[part.id] as ProblemStageResponse} onChange={v => change(part.id, v)} disabled={saving}/>}
      {part.hint && <details className={s.hint}><summary><Lightbulb size={16}/> Get a hint</summary><p>{part.hint}</p></details>}
      {!dirty && value?.checks?.[part.id] && <p role="status" className={s.feedback}>{value.checks[part.id] === 'match' ? '✓ This answer checks out.' : 'Revisit this part. Check the model, units, and signs.'}</p>}
    </section>)}
    {!readOnly && <footer className={s.footer}>{!review && active < task.parts.length-1 ? <button type="button" onClick={() => setActive(a => a+1)}>Next: {task.parts[active+1].label}<ChevronRight size={16}/></button> : <button type="button" disabled={!complete || saving} onClick={save}>{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save response'}</button>}<p>{complete ? 'Your teacher reviews the reasoning behind your answer.' : task.parts.length===1?'Choose an answer to save.':`Complete all ${task.parts.length} parts to save. You can return to any part.`}</p>{error && <p role="alert">{error}</p>}</footer>}
  </section>
}
