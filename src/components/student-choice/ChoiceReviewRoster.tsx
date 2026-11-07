'use client'
import { useEffect, useRef, useState } from 'react'
import { useAssignmentLeaveGuard } from '@/hooks/useAssignmentLeaveGuard'
import { LETTER_GRADES, choiceReviewLabel, requiredChoiceCount, type StudentChoiceDetail, type StudentChoiceReview } from '@/lib/student-choice'
import { choiceFetch } from './shared'
import s from '@/components/quizzes/Quiz.module.css'
import c from './StudentChoice.module.css'

type ReviewDraft = Pick<StudentChoiceReview, 'state' | 'letter_grade' | 'feedback'>
type ReviewRowState = { saved?: StudentChoiceReview; draft: ReviewDraft; busy: boolean; error: string }
type SaveProgress = { total: number; done: number; saved: number; busy: boolean }

function reviewDraft(review?: StudentChoiceReview): ReviewDraft {
  return { state: review?.state ?? 'not_received', letter_grade: review?.letter_grade ?? null, feedback: review?.feedback ?? '' }
}
function newRow(saved?: StudentChoiceReview): ReviewRowState {
  return { saved, draft: reviewDraft(saved), busy: false, error: '' }
}
function isDirty(row: ReviewRowState) {
  const saved = reviewDraft(row.saved)
  return row.draft.state !== saved.state || row.draft.letter_grade !== saved.letter_grade || row.draft.feedback !== saved.feedback
}

export default function ChoiceReviewRoster({ data, reload }: { data: StudentChoiceDetail; reload: () => Promise<void> }) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Record<string, ReviewRowState>>(() => Object.fromEntries(data.students.map(student => [student.id, newRow(data.reviews.find(review => review.user_id === student.id))])))
  const [progress, setProgress] = useState<SaveProgress | null>(null)
  const pending = useRef(new Set<string>()), batchLock = useRef(false)
  const disabled = data.readOnly || data.assignment.status === 'archived'
  const students = [...data.students].sort((a, b) => a.name.localeCompare(b.name))
  const dirtyStudents = students.filter(student => rows[student.id] && isDirty(rows[student.id]))
  const busy = !!progress?.busy, savingRow = Object.values(rows).some(row => row.busy)
  useAssignmentLeaveGuard(dirtyStudents.length > 0)

  // Refresh untouched rows without replacing drafts or newer local save responses.
  useEffect(() => {
    setRows(current => {
      const next = { ...current }
      let changed = false
      for (const student of data.students) {
        const row = current[student.id], incoming = data.reviews.find(review => review.user_id === student.id)
        if (!row || ((incoming?.version ?? 0) > (row.saved?.version ?? 0) && !isDirty(row) && !row.busy)) {
          next[student.id] = newRow(incoming); changed = true
        }
      }
      return changed ? next : current
    })
  }, [data.students, data.reviews])

  function edit(userId: string, update: (draft: ReviewDraft) => ReviewDraft) {
    if (disabled || batchLock.current || pending.current.has(userId)) return
    setProgress(null)
    setRows(current => ({ ...current, [userId]: { ...current[userId], draft: update(current[userId].draft), error: '' } }))
  }

  async function persist(userId: string, snapshot: ReviewRowState): Promise<boolean> {
    if (pending.current.has(userId)) return false
    const incoming = data.reviews.find(review => review.user_id === userId)
    if ((incoming?.version ?? 0) > (snapshot.saved?.version ?? 0)) {
      setRows(current => ({ ...current, [userId]: { ...current[userId], error: 'A newer review is available. Resolve this row before saving.' } }))
      return false
    }
    pending.current.add(userId)
    setRows(current => ({ ...current, [userId]: { ...current[userId], busy: true, error: '' } }))
    try {
      const result = await choiceFetch<{ review: StudentChoiceReview }>(`/api/student-choice-assignments/${data.assignment.id}`, { action: 'review', user_id: userId, ...snapshot.draft, version: snapshot.saved?.version ?? 0 })
      setRows(current => ({ ...current, [userId]: newRow(result.review) }))
      return true
    } catch (error) {
      setRows(current => ({ ...current, [userId]: { ...current[userId], busy: false, error: (error as Error).message } }))
      return false
    } finally { pending.current.delete(userId) }
  }

  async function saveRow(userId: string) {
    const row = rows[userId]
    if (disabled || batchLock.current || !row || !isDirty(row) || pending.current.has(userId)) return
    setProgress(null)
    await persist(userId, row)
    await reload()
  }

  async function saveAll() {
    if (disabled || batchLock.current || pending.current.size || !dirtyStudents.length) return
    batchLock.current = true
    const work = dirtyStudents.map(student => ({ id: student.id, snapshot: rows[student.id] }))
    setProgress({ total: work.length, done: 0, saved: 0, busy: true })
    try {
      // Each review retains its own validation/version checks. Limit simultaneous requests.
      for (let start = 0; start < work.length; start += 3) {
        await Promise.all(work.slice(start, start + 3).map(async item => {
          const saved = await persist(item.id, item.snapshot)
          setProgress(current => current && ({ ...current, done: current.done + 1, saved: current.saved + Number(saved) }))
        }))
      }
      await reload()
    } finally {
      batchLock.current = false
      setProgress(current => current && ({ ...current, busy: false }))
    }
  }

  function discard(userId: string, review?: StudentChoiceReview) {
    if (busy || pending.current.has(userId)) return
    setProgress(null)
    setRows(current => ({ ...current, [userId]: newRow(review) }))
  }

  const matches = (name: string) => name.toLowerCase().includes(query.trim().toLowerCase())
  return <section className={`${s.card} ${s.stack} ${c.reviewRoster}`} aria-label="Class grading roster">
    <div><h2>Class grading roster</h2><p>Check paper received and choose each letter grade after your review. Save all changes to share the edited grades and feedback with your students.</p></div>
    <div className={s.row}><label className={s.field}>Find a student<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Student name" /></label><p className={s.muted}>{students.length} students · {dirtyStudents.length} unsaved {dirtyStudents.length === 1 ? 'row' : 'rows'}</p></div>
    <div className={s.actions}><button type="button" className={s.button} disabled={disabled || busy || savingRow || !dirtyStudents.length} onClick={() => void saveAll()}>{busy ? `Saving ${progress.done} of ${progress.total}…` : `Save all changes${dirtyStudents.length ? ` (${dirtyStudents.length})` : ''}`}</button><span className={s.muted}>Includes edited students hidden by your search.</span></div>
    {progress && <p role="status" className={progress.done > progress.saved && !busy ? s.error : s.muted}>{busy ? `${progress.done} of ${progress.total} rows processed. Keep this page open while saving.` : progress.saved === progress.total ? `All ${progress.saved} edited ${progress.saved === 1 ? 'review' : 'reviews'} saved.` : `${progress.saved} of ${progress.total} reviews saved. ${progress.total - progress.saved} still need attention; their edits are kept. Resolve any conflicts, then use Save all changes to retry.`}{!busy && progress.saved < progress.total && query && <> <button type="button" className={s.link} onClick={() => setQuery('')}>Show all students</button></>}</p>}
    {!students.length ? <p>No active students are enrolled in this class.</p> : <>
      {!students.some(student => matches(student.name)) && <p>No students match this search.</p>}
      <div className={c.rosterWrap}><table className={c.roster} aria-label="Student Choice paper receipt and letter grades">
        <thead><tr><th scope="col">Student</th><th scope="col">Paper received</th><th scope="col">Letter grade</th><th scope="col">Feedback</th><th scope="col">Save / status</th></tr></thead>
        <tbody>{students.map(student => {
          const incoming = data.reviews.find(review => review.user_id === student.id)
          const row = rows[student.id] ?? newRow(incoming)
          return <ReviewRow key={student.id} student={student} hidden={!matches(student.name)} row={row} review={incoming} choices={data.selections.find(selection => selection.user_id === student.id)?.option_numbers.map(n => `Option ${n}: ${data.packet.options[n - 1].title}`)} required={requiredChoiceCount(data.assignment)} disabled={disabled || busy} reload={reload} edit={update => edit(student.id, update)} save={() => saveRow(student.id)} discard={() => discard(student.id, incoming)} />
        })}</tbody>
      </table></div>
    </>}
  </section>
}

function ReviewRow({ student, hidden, row, review, choices, required, disabled, reload, edit, save, discard }: { student: { id: string; name: string }; hidden: boolean; row: ReviewRowState; review?: StudentChoiceReview; choices?: string[]; required: number; disabled: boolean; reload: () => Promise<void>; edit: (update: (draft: ReviewDraft) => ReviewDraft) => void; save: () => Promise<void>; discard: () => void }) {
  const { saved, draft, busy, error } = row, dirty = isDirty(row)
  const newerReview = (review?.version ?? 0) > (saved?.version ?? 0)
  return <tr hidden={hidden} data-dirty={dirty}>
    <th scope="row"><strong>{student.name}</strong><details className={c.rosterDetails}><summary>Choices &amp; more</summary>
      <p>{choices?.join(' · ') || 'No practice choices saved yet.'}</p>
      {choices && choices.length !== required && <p>{choices.length} saved; {required} required. Saved work and reviews are preserved.</p>}
      <label className={c.receiptCheck}><input type="checkbox" checked={draft.state === 'excused'} disabled={disabled || busy} onChange={event => { const checked = event.target.checked; edit(current => ({ ...current, state: checked ? 'excused' : 'not_received', letter_grade: null })) }} aria-label={`Excused for ${student.name}`} />Excused</label>
    </details></th>
    <td><label className={c.receiptCheck}><input type="checkbox" checked={draft.state === 'received'} disabled={disabled || busy || draft.state === 'excused'} onChange={event => { const checked = event.target.checked; edit(current => ({ ...current, state: checked ? 'received' : 'not_received', letter_grade: checked ? current.letter_grade : null })) }} aria-label={`Paper received for ${student.name}`} /><span className={c.mobileLabel}>Paper received</span></label>{draft.state === 'excused' && <span className={s.muted}>Excused</span>}</td>
    <td><label className={s.field}><span className={c.mobileLabel}>Letter grade</span><select aria-label={`Letter grade for ${student.name}`} disabled={disabled || busy || draft.state !== 'received'} value={draft.letter_grade ?? ''} onChange={event => { const letter = (event.target.value || null) as StudentChoiceReview['letter_grade']; edit(current => ({ ...current, letter_grade: letter })) }}><option value="">Not yet graded</option>{LETTER_GRADES.map(grade => <option key={grade}>{grade}</option>)}</select></label></td>
    <td><label className={s.field}><span className={c.mobileLabel}>Feedback</span><textarea rows={2} aria-label={`Feedback for ${student.name}`} value={draft.feedback} maxLength={3000} placeholder="Optional feedback" disabled={disabled || busy} onChange={event => { const feedback = event.target.value; edit(current => ({ ...current, feedback })) }} /></label></td>
    <td><div className={c.rowSave}><button type="button" className={s.button} disabled={disabled || busy || !dirty || newerReview} onClick={() => void save()} aria-label={`Save review for ${student.name}`}>{busy ? 'Saving…' : 'Save'}</button><span role="status" className={s.muted}>{dirty ? 'Unsaved changes' : choiceReviewLabel(saved)}</span>
      {saved && !dirty && <small className={s.muted}>Saved {new Date(saved.recorded_at).toLocaleString()}</small>}
      {saved?.letter_grade && draft.state !== 'received' && <small>Saving removes the previous grade.</small>}
      {error && <p role="alert" className={s.error}>{error} <button type="button" disabled={disabled || busy} onClick={() => void reload()} className={s.link}>Check saved review</button></p>}
      {newerReview && dirty && <><p role="alert">A newer review was saved elsewhere. Your edits are still here.</p><button type="button" className={s.link} disabled={disabled || busy} onClick={discard}>Discard edits and load saved review</button></>}
    </div></td>
  </tr>
}
