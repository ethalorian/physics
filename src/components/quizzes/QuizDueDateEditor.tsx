'use client'

import {quizScheduleError, QUIZ_SCHEDULE_LABELS} from '@/lib/quiz-schedule'
import { useSequenceDateConfirmation } from '@/components/admin/useSequenceDateConfirmation'
import { DateChangeCancelled } from '@/lib/sequence-date-change'
import {useState} from 'react'
import type {Quiz} from '@/lib/quizzes/types'
import AssignmentDueInput from '@/components/ui/assignment-due-input'
import {dueDateDraft,dueDateValue} from '@/lib/assignment-due-input'
import { quizDueDateChange, type QuizDueDateChange} from '@/lib/quizzes/due-date'
import {dueLabel, quizFetch} from './shared'
import s from './Quiz.module.css'

export default function QuizDueDateEditor({quiz, onSaved, onCancel}: {
  quiz: Pick<Quiz,'id'|'due_at'|'version'|'kind'|'daily_sequence_key'>; onSaved: (change: QuizDueDateChange) => void; onCancel: () => void;
}) {
  const dateRequest = useSequenceDateConfirmation()
  const schedule = quiz.daily_sequence_key ? 'daily' : quiz.kind === 'vocabulary' ? 'vocabulary' : 'regular'
  const [value, setValue] = useState(() => dueDateDraft(quiz.due_at))
  const [version, setVersion] = useState(quiz.version)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  async function save() {
    if (busy) return
    setError(''); setNotice('')
    try {
      const change = quizDueDateChange({due_at: dueDateValue(value), version})
      const scheduleError = quizScheduleError(change.due_at, schedule)
      if (scheduleError) throw Error(scheduleError)
      setBusy(true)
      const result = await dateRequest.send<QuizDueDateChange>(`/api/quizzes/${quiz.id}/due-date`, change)
      onSaved(result)
    } catch (e) { if (!(e instanceof DateChangeCancelled)) setError((e as Error).message) }
    finally { setBusy(false) }
  }
  async function reloadDate() {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await quizFetch<{quiz: Quiz}>(`/api/quizzes/${quiz.id}`)
      if (!['published','archived'].includes(result.quiz.status)) throw Error('This quiz is no longer published. Close this editor and refresh the quiz.')
      setValue(dueDateDraft(result.quiz.due_at)); setVersion(result.quiz.version)
      setNotice(`Current setting loaded: ${dueLabel(result.quiz.due_at)}. Make your change, then save.`)
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return <section className={`${s.card} ${s.stack} mb-4`} aria-label="Edit quiz due date">
    {dateRequest.confirmation}<h2>Edit due date</h2>
    <p>Choose a calendar date to assign this quiz. {quiz.daily_sequence_key ? 'You will review the linked dates before confirming an override.' : 'Clearing the date unassigns it.'} Questions, saved answers, submissions, and grades stay intact.</p>
    <form onSubmit={e => {e.preventDefault(); void save()}} className={s.stack}>
      <p className={s.muted}>{QUIZ_SCHEDULE_LABELS[schedule]} Dates follow Eastern time.</p>
      <AssignmentDueInput value={value} onChange={setValue} disabled={busy}/>
      <p className={s.muted}>Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}. {quiz.daily_sequence_key ? 'Use Remove from calendar on its discussion or review to unassign the group.' : 'Leave blank to unassign the quiz.'} Passing the due date marks work late; it does not close the quiz.</p>
      {error && <div role="alert" className={s.error}><p>{error}</p><button type="button" className={s.secondary} disabled={busy} onClick={() => void reloadDate()}>Reload current date</button></div>}
      {notice && <p role="status" className={s.notice}>{notice}</p>}
      <div className={s.actions}>
        <button type="submit" className={s.button} disabled={busy}>{busy ? 'Saving…' : 'Save due date'}</button>
        {!quiz.daily_sequence_key && <button type="button" className={s.secondary} disabled={busy || !value.date} onClick={() => setValue(dueDateDraft(null))}>Clear date</button>}
        <button type="button" className={s.secondary} disabled={busy} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  </section>
}
