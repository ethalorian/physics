'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { EngagementPractice } from '@/lib/student-engagement'
import styles from './engagement.module.css'

const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
export default function PracticeTracker({ task, latestCompleteDay, onStudent, onFilter, onUpdated }: {
  task: EngagementPractice; latestCompleteDay: string; onStudent: (id: string) => void
  onFilter: (label: string, ids: string[]) => void; onUpdated: (id: string, dueOn: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [due, setDue] = useState(task.dueOn ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const groups = [
    { label: 'Not started', students: task.students.filter(student => !student.started), tone: 'var(--muted-foreground)' },
    { label: 'In progress', students: task.students.filter(student => student.started > 0 && !student.complete), tone: 'var(--primary)' },
    { label: 'Complete', students: task.students.filter(student => student.complete), tone: 'var(--success)' },
  ]
  const unfinished = task.students.filter(student => !student.complete)
  const overdue = Boolean(task.dueOn && task.dueOn <= latestCompleteDay && unfinished.length)
  async function saveDueDate() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const response = await fetch('/api/vocab/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, due_on: due || null }) })
      if (!response.ok) throw new Error('The due date could not be saved. Try again.')
      onUpdated(task.id, due || null); setEditing(false); setSaved(true)
    } catch (error) { setError(error instanceof Error ? error.message : 'The due date could not be saved.') }
    finally { setSaving(false) }
  }
  return <div className="mt-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{task.students.length} assigned{task.dueOn ? ` · Due ${dateLabel(task.dueOn)}` : ' · No due date'}</p><Button variant="ghost" onClick={() => { setDue(task.dueOn ?? ''); setEditing(!editing); setError(''); setSaved(false) }} disabled={saving}>Edit due date</Button></div>
    {overdue && <p className="mb-2 text-xs text-destructive">{unfinished.length} unfinished past the due date</p>}
    {editing && <form onSubmit={event => { event.preventDefault(); void saveDueDate() }} className="mb-4 rounded-xl border p-3"><label className={styles.field}>New due date (blank removes it)<input type="date" aria-label="New practice due date" value={due} onChange={event => setDue(event.target.value)} disabled={saving} /></label><div className="mt-2 flex gap-2"><Button type="submit" disabled={saving || due === (task.dueOn ?? '')}>{saving ? 'Saving…' : 'Save due date'}</Button><Button type="button" variant="ghost" disabled={saving} onClick={() => { setEditing(false); setError('') }}>Cancel</Button></div></form>}
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    {saved && <p role="status" className="mb-3 text-xs text-primary">Due date saved.</p>}
    <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${groups[2].students.length} complete, ${groups[1].students.length} started, ${groups[0].students.length} not started`}>
      {[groups[2], groups[1]].map(group => <span key={group.label} className={styles.progressFill} style={{ background: group.tone, width: `${100 * group.students.length / Math.max(1, task.students.length)}%` }} />)}
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2" aria-label="Practice follow-up groups">{groups.map(group => <button key={group.label} className={styles.groupAction} disabled={!group.students.length} onClick={() => onFilter(`${task.title}: ${group.label.toLowerCase()}`, group.students.map(student => student.studentId))} aria-label={`Show ${group.students.length} ${group.label.toLowerCase()} students`}><strong style={{ color: group.tone }}>{group.students.length}</strong><span>{group.label}</span></button>)}</div>
    <Button variant="outline" className="mt-3 w-full" disabled={!unfinished.length} onClick={() => onFilter(`${task.title}: unfinished`, unfinished.map(student => student.studentId))}>Show unfinished students</Button>
    <p className="mt-2 text-xs text-muted-foreground">Choose a group to find those students in the roster.</p>
    <ul className="mt-4 max-h-80 divide-y overflow-y-auto">{task.students.map(student => <li key={student.studentId} className="py-3"><div className="flex items-center justify-between gap-2"><button className="min-h-11 text-left text-sm font-semibold hover:underline" onClick={() => onStudent(student.studentId)}>{student.name}</button><span className="text-[11px] text-muted-foreground">{student.complete ? 'Complete' : student.started ? 'In progress' : 'Not started'}</span></div><div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{student.activeDays} active days · {student.checks} completed checks</span><span>{student.ready}/{student.total} words ready</span></div><p className="mt-1 text-xs text-muted-foreground">{student.started ? `${student.started} checks started${student.lastAt ? ` · Last check activity ${new Date(student.lastAt).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' })}` : ''}` : 'No check activity yet'}</p></li>)}</ul>
  </div>
}
