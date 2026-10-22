'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
import { readingFetch } from './ReadingShared'
import styles from './readings.module.css'

export default function ReadingAssignmentActions({ assignment, onChanged }: {
  assignment: ReadingAssignment; onChanged: () => void | Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (assignment.status === 'draft') return null
  const removed = assignment.status === 'archived'
  async function change() {
    const message = removed
      ? `Reassign “${assignment.title}” to this class? The previous due date will still apply. Students individually unassigned will stay unassigned.`
      : `Unassign “${assignment.title}” from the whole class? It will leave students’ active reading lists. Saved work and feedback are kept. Connected vocabulary and quizzes stay assigned; manage those separately.`
    if (!window.confirm(message)) return
    setBusy(true); setError('')
    try {
      await readingFetch(`/api/readings/${assignment.id}`, { method: 'POST', body: JSON.stringify({ action: removed ? 'reopen' : 'archive', version: assignment.version }) })
      await onChanged()
    } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  return <div className={styles.stack}>
    <Button data-reading-leave className="self-start" variant="outline" disabled={busy} onClick={() => void change()}>{busy ? 'Saving…' : removed ? 'Reassign to class' : 'Unassign from class'}</Button>
    {error && <p className={styles.error} role="alert">{error}</p>}
  </div>
}
