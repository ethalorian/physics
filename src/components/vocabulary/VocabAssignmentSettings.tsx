'use client'
import { useAssignmentLeaveGuard } from '@/hooks/useAssignmentLeaveGuard'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Archive, ArchiveRestore, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VocabTask } from '@/lib/vocab-learning'

const field = 'min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2'

export default function VocabAssignmentSettings({ task, onSaved, disabled = false }: {
  task: VocabTask; onSaved: () => Promise<unknown>; disabled?: boolean
}) {
  const [editing, setEditing] = useState(false), [busy, setBusy] = useState(false)
  const [title, setTitle] = useState(task.title), [note, setNote] = useState(task.note)
  const [due, setDue] = useState(task.due_on ?? '')
  const [checks, setChecks] = useState(task.min_checks), [accuracy, setAccuracy] = useState(task.threshold)
  const [error, setError] = useState(''), [notice, setNotice] = useState('')
  const saving = useRef(false)
  const practice = task.task_kind !== 'quiz'
  const patch: Record<string, string | number | null> = {}
  if (title.trim() !== task.title) patch.title = title.trim()
  if (note !== task.note) patch.note = note
  if ((due || null) !== task.due_on) patch.due_on = due || null
  if (practice && checks !== task.min_checks) patch.min_checks = checks
  if (practice && accuracy !== task.threshold) patch.threshold = accuracy
  const dirty = Object.keys(patch).length > 0
  useAssignmentLeaveGuard(editing && dirty)

  function open() {
    setTitle(task.title); setNote(task.note); setDue(task.due_on ?? '')
    setChecks(task.min_checks); setAccuracy(task.threshold); setError(''); setNotice(''); setEditing(true)
  }
  async function save() {
    if (saving.current || !dirty) return
    saving.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/vocab/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, ...patch }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not save assignment settings.')
      await onSaved()
      setEditing(false)
      setNotice(practice ? `Saved · ${checks} ${checks === 1 ? 'check' : 'checks'} per word at ${accuracy}%. Completed checks are kept and progress is recalculated.` : 'Assignment details saved.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save. Your changes are still here.') }
    finally { saving.current = false; setBusy(false) }
  }

  async function setActive() {
    if (saving.current) return
    saving.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/vocab/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, active: !task.active }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not update the assignment.')
      await onSaved()
      setNotice(task.active ? 'Removed from student to-dos. Saved work and ratings are kept.' : 'Restored to student to-dos.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update the assignment.') }
    finally { saving.current = false; setBusy(false) }
  }

  return <section aria-label="Assignment settings" className="border-y border-border py-4 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Assignment settings</h3><p className="text-sm text-muted-foreground">{task.title}{practice ? ` · ${task.min_checks} ${task.min_checks === 1 ? 'check' : 'checks'} per word · ${task.threshold}% accuracy` : ' · Quiz'}</p></div>
      {!editing && <div className="flex flex-wrap gap-2"><Button size="lg" variant="outline" disabled={disabled || busy} onClick={open}><Pencil size={16} aria-hidden="true" />Edit assignment</Button>{!task.syllabus_draft && <Button size="lg" variant="outline" disabled={disabled || busy} onClick={() => void setActive()}>{task.active ? <Archive size={16} aria-hidden="true" /> : <ArchiveRestore size={16} aria-hidden="true" />}{busy ? 'Saving…' : task.active ? 'Remove from student to-dos' : 'Restore to student to-dos'}</Button>}</div>}
    </div>
    {task.syllabus_draft && <p className="text-sm text-muted-foreground">Draft · Ready to review. <Link className="underline" href={`/admin/readings/syllabus?course_id=${task.course_id}&step_id=${task.syllabus_step_id}`}>Assign with its reading from the syllabus.</Link></p>}
    {!task.active && !task.syllabus_draft && <p className="text-sm text-muted-foreground">Archived · Removed from student to-dos. Saved work and ratings are kept.</p>}
    {notice && <p role="status" className="text-sm text-success">{notice}</p>}
    {!editing && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {editing && <form onSubmit={e => { e.preventDefault(); void save() }} className="space-y-4">
      <fieldset disabled={busy || disabled} className="space-y-4">
        {practice && <><fieldset><legend className="font-medium mb-2">Required checks per word</legend><div className="grid grid-cols-5 max-w-sm gap-2" role="group" aria-label="Required checks per word">{[1, 2, 3, 4, 5].map(n => <Button key={n} type="button" size="lg" className="min-w-0 px-2" aria-pressed={checks === n} aria-label={`${n} ${n === 1 ? 'check' : 'checks'} per word`} variant={checks === n ? 'default' : 'outline'} onClick={() => setChecks(n)}>{n}</Button>)}</div></fieldset>
          <p className="text-sm text-muted-foreground">Applies to everyone on this assignment. Completed checks count toward the updated requirement.</p>
        </>}
        <details open={!practice || undefined}><summary className="min-h-11 cursor-pointer py-2 font-medium">{practice ? 'More settings · accuracy, title, due date & directions' : 'Assignment details'}</summary><div className="space-y-4 pt-2">
        {practice && <label className="block space-y-1"><span>Recent accuracy required (%)</span><input type="number" min={50} max={100} step={1} required className={`${field} max-w-32 block`} value={accuracy} onChange={e => setAccuracy(Number(e.target.value))} /></label>}
        <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1"><span>Assignment title</span><input required maxLength={200} className={field} value={title} onChange={e => setTitle(e.target.value)} /></label><label className="block space-y-1"><span>Due date (optional)</span><input type="date" className={field} value={due} onChange={e => setDue(e.target.value)} /></label></div>
        <label className="block space-y-1"><span>Student directions</span><textarea rows={3} maxLength={2000} className={field} value={note} onChange={e => setNote(e.target.value)} /></label>
        </div></details>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2"><Button type="submit" size="lg" disabled={!dirty || !title.trim()}>{busy ? 'Saving…' : 'Save changes'}</Button><Button type="button" size="lg" variant="outline" onClick={() => { setEditing(false); setError('') }}>Cancel</Button></div>
      </fieldset>
    </form>}
  </section>
}
