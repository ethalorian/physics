'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import AssignmentDueInput from '@/components/ui/assignment-due-input'
import { dueDateDraft, dueDateValue } from '@/lib/assignment-due-input'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
import { readingFetch } from './ReadingShared'

export default function ReadingDueDateEditor({ assignment, onSaved, onCancel }: {
  assignment: ReadingAssignment; onSaved: () => Promise<void>; onCancel: () => void
}) {
  const [due, setDue] = useState(() => dueDateDraft(assignment.due_at))
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function save() {
    setBusy(true); setError('')
    try {
      await readingFetch(`/api/readings/${assignment.id}`, { method: 'POST', body: JSON.stringify({ action: 'due-date', version: assignment.version, due_at: dueDateValue(due) }) })
      await onSaved(); onCancel()
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <form className="rounded-lg border p-5 flex flex-col gap-4" aria-label="Edit reading due date" onSubmit={e => { e.preventDefault(); void save() }}>
    <h3 className="text-title-3">Edit reading due date</h3>
    <AssignmentDueInput value={due} onChange={setDue} disabled={busy}/>
    <p className="text-caption text-muted-foreground">This changes the reading deadline. Use the syllabus to update reading and vocabulary practice together.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save due date'}</Button><Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button></div>
  </form>
}
