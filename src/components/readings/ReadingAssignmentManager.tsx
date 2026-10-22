'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AssignmentDueInput from '@/components/ui/assignment-due-input'
import { dueDateDraft, dueDateValue } from '@/lib/assignment-due-input'
import { filterReadingAssignments, readingDashboardHref, readingResourceStatus, type ReadingAssignmentFilter, type ReadingDashboardGroup, type ReadingDashboardResource } from '@/lib/reading-dashboard'
import { isInteractiveReading } from '@/lib/reading-availability'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
import type { QuizDetail } from '@/lib/quizzes/types'
import { readingFetch } from './ReadingShared'
import styles from './ReadingDashboard.module.css'

const filters = [['published', 'Assigned'], ['draft', 'Drafts'], ['archived', 'Unassigned'], ['all', 'All']] as const
type EditMode = 'date' | 'assign' | 'unassign' | 'reassign' | 'sequence'
const resourceHref = (group: ReadingDashboardGroup, resource: ReadingDashboardResource) => readingDashboardHref({ view: 'assignments', courseId: group.courseId, stepId: group.step?.id, resource: resource.kind, id: resource.id })
function dateLabel(resource: ReadingDashboardResource) {
  const value = resource.due_at ?? (resource.due_on ? `${resource.due_on}T12:00:00` : null)
  return value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', ...(resource.kind !== 'practice' ? { hour: 'numeric', minute: '2-digit' } as const : {}) }) : 'No due date'
}

export default function ReadingAssignmentManager({ groups, readings, courseId, className, readOnly, loading, onChanged, onFilterChange, initialFilter = 'published' }: {
  groups: ReadingDashboardGroup[]; readings: ReadingAssignment[]; className: (id: string) => string
  courseId: string
  readOnly: boolean; loading: boolean; onChanged: () => void; initialFilter?: ReadingAssignmentFilter
  onFilterChange?: (filter: ReadingAssignmentFilter) => void
}) {
  const [filter, updateFilter] = useState<ReadingAssignmentFilter>(initialFilter)
  function setFilter(next: ReadingAssignmentFilter) { updateFilter(next); onFilterChange?.(next) }
  const [search, setSearch] = useState(''), [kind, setKind] = useState('all')
  const [editing, setEditing] = useState<{ group: ReadingDashboardGroup; resource: ReadingDashboardResource; mode: EditMode } | null>(null)
  const [notice, setNotice] = useState(''), [busy, setBusy] = useState(false)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const savedNotice = useRef<HTMLDivElement>(null)
  useEffect(() => { if (notice) savedNotice.current?.focus() }, [notice])
  const shown = filterReadingAssignments(groups, filter, search, kind)
  const all = groups.flatMap(group => group.resources).filter(resource => resource.id)
  const count = shown.reduce((total, group) => total + group.resources.length, 0)
  function edit(group: ReadingDashboardGroup, resource: ReadingDashboardResource, mode: EditMode, button: HTMLButtonElement) {
    trigger.current = button; setNotice(''); setEditing({ group, resource: { ...resource }, mode })
  }
  function close() { setEditing(null); trigger.current?.focus() }
  return <section className={styles.section} aria-label="Reading assignments">
    <div className={styles.row}><div><h2 className="text-title-2">Manage assignments</h2><p className="text-muted-foreground mt-1">Set dates, assign work, or remove it from a class.</p></div><Button asChild variant="outline"><Link href={readingDashboardHref({ view: 'syllabus', courseId })}>Choose from syllabus</Link></Button></div>
    <div className={styles.assignmentToolbar}>
      <div className={styles.statusFilters} role="group" aria-label="Assignment status">{filters.map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} disabled={busy} onClick={() => { setFilter(value); setEditing(null) }}>{label}<span>{all.filter(resource => value === 'all' || resource.status === value).length}</span></button>)}</div>
      <div className={styles.filters}><div className={styles.search}><Search size={17} aria-hidden="true" /><Input aria-label="Search reading assignments" placeholder="Find a topic or reading…" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setEditing(null) }} /></div><label className={styles.field}><span className="sr-only">Assignment type</span><select aria-label="Assignment type" disabled={busy} value={kind} onChange={event => { setKind(event.target.value); setEditing(null) }}>{[['all', 'All types'], ['reading', 'Readings'], ['practice', 'Vocabulary practice'], ['readingQuiz', 'Reading quizzes'], ['vocabularyQuiz', 'Vocabulary quizzes']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    </div>
    {notice && <div className={styles.savedNotice} role="status" ref={savedNotice} tabIndex={-1}><Check size={18} aria-hidden="true" />{notice}</div>}
    <p className="text-caption text-muted-foreground" aria-live="polite">{count} {filter === 'published' ? 'assigned ' : ''}{count === 1 ? 'item' : 'items'} across {shown.length} {shown.length === 1 ? 'topic' : 'topics'}{filter === 'published' ? ' · Drafts appear in their own tab.' : ''}</p>
    <div className={styles.assignmentList}>{shown.map(group => {
      const original = groups.find(item => item.id === group.id)!
      return <section key={group.id} className={styles.assignmentGroup} aria-label={`${group.title} · ${className(group.courseId)}`}>
        <header className={styles.assignmentHeading}><div><p className={styles.classLabel}>{className(group.courseId)}</p><h3 className="text-title-3">{group.title}</h3><p className="text-caption text-muted-foreground">{group.source}</p></div></header>
        {group.resources.map(resource => {
          const active = editing?.resource.id === resource.id
          const reading = readings.find(item => item.id === (resource.kind === 'reading' ? resource.id : original.resources.find(r => r.kind === 'reading')?.id))
          const readerAvailable = !!reading && isInteractiveReading(reading)
          const canAssign = resource.kind === 'reading' || resource.kind === 'practice' && resource.status === 'draft' ? readerAvailable : true
          const canEdit = !readOnly && !!resource.id && (resource.kind === 'practice' || !!resource.version)
          const mode: EditMode = resource.status === 'published' ? 'unassign' : resource.status === 'archived' ? 'reassign' : resource.kind === 'practice' ? 'sequence' : 'assign'
          const action = mode === 'sequence' ? 'Assign sequence' : mode === 'unassign' ? 'Unassign' : mode === 'reassign' ? 'Reassign' : 'Assign'
          const canDate = (resource.status === 'published' || canAssign) && (resource.status !== 'archived' || resource.kind === 'reading' || resource.kind === 'practice')
          return <div key={resource.id} className={styles.assignmentItem}>
            <div className={styles.assignmentRow}>
              <div className={styles.itemName}><strong>{resource.label}</strong><span className={styles.statusPill} data-status={resource.status}>{readingResourceStatus(resource)}</span>{(resource.pending ?? 0) > 0 && <small>{resource.pending} to review</small>}{resource.kind === 'readingQuiz' && resource.status === 'published' && original.resources[0]?.status === 'published' && <small>Opens after the reading is submitted</small>}</div>
              <button type="button" className={styles.dateButton} disabled={!canEdit || !canDate || busy || loading} aria-label={`${resource.due_at || resource.due_on ? 'Change' : 'Add'} due date for ${resource.label.toLowerCase()}: ${group.title}`} aria-expanded={active && editing?.mode === 'date'} onClick={event => edit(original, resource, 'date', event.currentTarget)}><CalendarDays size={17} aria-hidden="true" /><span>{dateLabel(resource)}<small>{canDate ? resource.due_at || resource.due_on ? 'Change date' : 'Add date' : 'Reassign to change date'}</small></span></button>
              <div className={styles.itemActions}><Button asChild variant="ghost"><Link href={resourceHref(group, resource)}>{resource.status === 'draft' ? 'Preview & edit' : resource.kind === 'reading' ? 'Students & work' : (resource.pending ?? 0) > 0 ? `Review (${resource.pending})` : 'Open'}</Link></Button>{canEdit && (mode === 'unassign' || canAssign) && <Button variant={resource.status === 'draft' ? 'default' : 'outline'} disabled={busy || loading} aria-label={`${action} ${resource.kind === 'practice' && resource.status === 'draft' ? '' : resource.label.toLowerCase() + ': '}${group.title}`} aria-expanded={active && editing?.mode !== 'date'} onClick={event => edit(original, resource, mode, event.currentTarget)}>{action}</Button>}</div>
            </div>
            {active && editing && <AssignmentEditor key={`${resource.id}:${editing.mode}`} group={editing.group} resource={editing.resource} mode={editing.mode} assignment={readings.find(item => item.id === resource.id)} classLabel={className(group.courseId)} onBusy={setBusy} onCancel={close} onSaved={message => { setNotice(message); setEditing(null); onChanged() }} />}
          </div>
        })}
      </section>
    })}</div>
    {!shown.length && <div className={styles.emptyAssignments}><h3 className="text-title-3">{search || kind !== 'all' ? 'No matching assignments' : filter === 'published' ? 'No work assigned here' : filter === 'draft' ? 'No drafts here' : filter === 'archived' ? 'No unassigned work here' : 'No assignments here yet'}</h3><p className="text-muted-foreground">{search || kind !== 'all' ? 'Try another search or choose All types.' : filter === 'published' ? 'Open Drafts to assign a prepared reading, or choose a new one from the syllabus.' : filter === 'archived' ? 'Work you unassign will appear here so you can reassign it later.' : 'Choose a reading from the syllabus to get started.'}</p>{filter === 'published' && !search && kind === 'all' && <Button variant="outline" onClick={() => setFilter('draft')}>Open drafts</Button>}</div>}
  </section>
}

function AssignmentEditor({ group, resource, mode, assignment, classLabel, onBusy, onCancel, onSaved }: {
  group: ReadingDashboardGroup; resource: ReadingDashboardResource; mode: EditMode; assignment?: ReadingAssignment; classLabel: string
  onBusy: (busy: boolean) => void; onCancel: () => void; onSaved: (message: string) => void
}) {
  const [due, setDue] = useState(() => mode === 'sequence' ? dueDateDraft(group.resources[0]?.due_at) : resource.kind === 'practice' ? { date: resource.due_on ?? '', time: '23:59' } : dueDateDraft(resource.due_at))
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const sequenceAvailable = !!group.step && group.resources[0]?.status !== 'archived' && group.resources.some(item => item.kind === 'practice' && item.status === 'draft') && group.resources.some(item => item.kind === 'readingQuiz' && ['draft', 'published'].includes(item.status))
  const [sequence, setSequence] = useState(mode === 'sequence')
  const isSequence = mode === 'sequence' || mode === 'assign' && sequence
  const hasDate = mode === 'date' || mode === 'assign' || mode === 'sequence'
  const title = mode === 'date' ? `Due date · ${resource.label}` : mode === 'unassign' ? `Unassign ${resource.label.toLowerCase()}?` : mode === 'reassign' ? `Reassign ${resource.label.toLowerCase()}?` : isSequence ? 'Assign reading sequence' : `Assign ${resource.label.toLowerCase()}`
  useEffect(() => { heading.current?.focus() }, [])
  async function save() {
    setBusy(true); onBusy(true); setError('')
    try {
      const body = (data: unknown) => ({ method: 'POST', body: JSON.stringify(data) })
      if (isSequence) {
        if (!sequenceAvailable) throw Error('Open the syllabus to check this sequence before assigning it.')
        await readingFetch('/api/reading-syllabus', body({ action: 'release', course_id: group.courseId, step_id: group.step!.id, version: group.resources[0].version, due_at: dueDateValue(due) }))
      } else if (resource.kind === 'practice') {
        await readingFetch('/api/vocab/tasks', { method: 'PATCH', body: JSON.stringify({ id: resource.id, ...(mode === 'date' ? { due_on: due.date || null } : { active: mode === 'reassign' }) }) })
      } else if (mode === 'assign' || mode === 'date' && resource.status === 'draft') {
        if (resource.kind === 'reading') {
          if (!assignment || assignment.version !== resource.version) throw Error('This reading changed. Refresh before saving.')
          await readingFetch('/api/readings', body({ ...assignment, status: mode === 'assign' ? 'published' : 'draft', due_at: dueDateValue(due) }))
        } else {
          const detail = await readingFetch<QuizDetail>(`/api/quizzes/${resource.id}`)
          if (detail.quiz.version !== resource.version || detail.quiz.status !== 'draft') throw Error('This quiz changed. Refresh before saving.')
          await readingFetch('/api/quizzes', body({ ...detail.quiz, status: mode === 'assign' ? 'published' : 'draft', due_at: dueDateValue(due) }))
        }
      } else {
        const path = resource.kind === 'reading' ? `/api/readings/${resource.id}` : `/api/quizzes/${resource.id}${mode === 'date' ? '/due-date' : ''}`
        await readingFetch(path, body(mode === 'date' ? { ...(resource.kind === 'reading' ? { action: 'due-date' } : {}), version: resource.version, due_at: dueDateValue(due) } : { action: mode === 'unassign' ? 'archive' : 'reopen', version: resource.version }))
      }
      onSaved(`${isSequence ? 'Reading sequence' : resource.label} ${mode === 'date' ? 'due date updated' : mode === 'unassign' ? 'unassigned' : mode === 'reassign' ? 'reassigned' : 'assigned'} · ${group.title} · ${classLabel}`)
    } catch (e) { setError((e as Error).message) } finally { setBusy(false); onBusy(false) }
  }
  return <form className={styles.assignmentEditor} aria-label={title} onSubmit={event => { event.preventDefault(); void save() }}>
    <h4 className="text-title-3" tabIndex={-1} ref={heading}>{title}</h4>
    <p className="text-caption text-muted-foreground">{group.title} · {classLabel}</p>
    {mode === 'assign' && resource.kind === 'reading' && sequenceAvailable && <label className={styles.sequenceChoice}><input type="checkbox" checked={sequence} disabled={busy} onChange={event => setSequence(event.target.checked)} />Also assign vocabulary practice and the reading quiz</label>}
    {isSequence && <p>Assigns the reading, vocabulary practice, and reading quiz. The reading and practice use this date; a quiz with its own date keeps it. The vocabulary quiz stays as it is.</p>}
    {isSequence && !sequenceAvailable && <p role="alert">Reassign the reading and reading quiz first, or <Link className="underline" href={readingDashboardHref({ view: 'syllabus', courseId: group.courseId, stepId: group.step?.id })}>open this syllabus step</Link> to check its assignments.</p>}
    {hasDate && (resource.kind === 'practice' && !isSequence ? <label className={styles.field}>Due date (optional)<Input aria-label="Practice due date" type="date" value={due.date} disabled={busy} onChange={event => setDue({ ...due, date: event.target.value })} /></label> : <AssignmentDueInput value={due} onChange={setDue} disabled={busy} />)}
    {hasDate && due.date && <button type="button" className={styles.clearDate} disabled={busy} onClick={() => setDue({ ...due, date: '' })}>Remove due date</button>}
    {mode === 'date' && <p className="text-caption text-muted-foreground">{resource.kind === 'reading' ? 'Linked reading quizzes, vocabulary practice, and vocabulary quizzes move to this due date too.' : `Changes only this ${resource.label.toLowerCase()}. Other linked assignments keep their dates.`} {resource.status === 'draft' && 'It stays a draft until you assign it.'}</p>}
    {mode === 'assign' && !isSequence && <p>Assigns this {resource.label.toLowerCase()} to its students in {classLabel}. Other linked work stays as it is.</p>}
    {mode === 'unassign' && <p>Removes this {resource.label.toLowerCase()} from students’ assigned work in {classLabel}. Saved work is kept. Other linked assignments stay assigned.</p>}
    {mode === 'reassign' && <p>Restores this {resource.label.toLowerCase()} with its saved work and existing due date ({dateLabel(resource)}).{resource.kind === 'reading' ? ' Students individually unassigned from this reading remain unassigned.' : ''}</p>}
    {mode === 'unassign' && resource.kind === 'reading' && <p className="text-caption text-muted-foreground">For one student, use <Link href={resourceHref(group, resource)} className="underline">Students & work</Link> instead.</p>}
    {error && <p className="text-destructive" role="alert">{error} <Link className="underline" href={resourceHref(group, resource)}>Open assignment</Link></p>}
    <div className={styles.actions}><Button type="submit" disabled={busy || isSequence && !sequenceAvailable}>{busy ? 'Saving…' : mode === 'date' ? 'Save date' : mode === 'unassign' ? 'Unassign from class' : mode === 'reassign' ? 'Reassign' : isSequence ? 'Assign sequence' : `Assign ${resource.label.toLowerCase()}`}</Button><Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button></div>
  </form>
}
