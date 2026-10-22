'use client'

import { useMemo, useRef, useState, type PointerEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, GripVertical, Search, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { isInteractiveReading, isInteractiveSyllabusStep } from '@/lib/reading-availability'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
import { SYLLABUS_UNITS, type SyllabusCatalog } from '@/lib/reading-syllabus'
import { calendarDays, plannerDateLabel, plannerDay, plannerReadings, readingWindow, shiftDay, type PlannerReading } from '@/lib/reading-planner'
import { readingFetch } from './ReadingShared'
import styles from './ReadingPlanner.module.css'

type Undo = { saved: ReadingAssignment; before: ReadingAssignment; assigned: boolean }
type Props = { syllabus: SyllabusCatalog; readings: ReadingAssignment[]; courseId: string; onChanged: () => void; readOnly?: boolean }
const dateLabel = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' })

export default function ReadingPlanner({ syllabus, readings, courseId, onChanged, readOnly = false }: Props) {
  const today = plannerDay(new Date())
  const [month, setMonth] = useState(today.slice(0, 7) + '-01')
  const [search, setSearch] = useState(''), [unit, setUnit] = useState('')
  const [source, setSource] = useState('sequence')
  const [selected, setSelected] = useState<string | null>(null), [date, setDate] = useState('')
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 })
  const [over, setOver] = useState<string | null>(null), [dragging, setDragging] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, ReadingAssignment>>({})
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [undo, setUndo] = useState<Undo | null>(null)
  const busyRef = useRef(false), dragRef = useRef<string | null>(null)
  const plannerRef = useRef<HTMLElement | null>(null)
  const pointerRef = useRef<{ key: string; x: number; y: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const items = useMemo(() => {
    const seen = new Set<string>()
    return plannerReadings(syllabus, readings, courseId).map(item => {
      const saved = overrides[item.key]
      return saved && (!item.assignment || saved.version > item.assignment.version) ? { ...item, assignment: saved } : item
    }).filter(item => { if (!item.assignment) return true; if (seen.has(item.assignment.id)) return false; seen.add(item.assignment.id); return true })
  }, [syllabus, readings, courseId, overrides])
  const current = items.find(item => item.key === selected)
  const assigned = items.filter(item => item.assignment?.status === 'published')
  const unscheduled = assigned.filter(item => !item.assignment?.due_at)
  const library = items.filter(item => (item.assignment ? isInteractiveReading(item.assignment) : !!item.step && isInteractiveSyllabusStep(item.step, syllabus.courses.find(c => c.id === courseId)?.track)) && item.assignment?.status !== 'published' && (!unit || item.unit === unit) && (source === 'all' || !!item.step && !item.step.sourceBook) && (!search || `${item.title} ${item.assignment?.reading ?? ''}`.toLowerCase().includes(search.toLowerCase())))
  const days = calendarDays(month)
  const byDay = new Map<string, PlannerReading[]>(), openings = new Map<string, PlannerReading[]>()
  for (const item of assigned) {
    const a = item.assignment!
    if (a.due_at) { const day = plannerDay(a.due_at); byDay.set(day, [...(byDay.get(day) ?? []), item]) }
    if (a.opens_at) { const day = plannerDay(a.opens_at); openings.set(day, [...(openings.get(day) ?? []), item]) }
  }
  const disabled = readOnly || busy
  const stepHref = (item?: PlannerReading) => '/admin/readings?' + new URLSearchParams({ view: 'syllabus', course_id: courseId, ...(item?.step ? { step_id: item.step.id } : { details: '1' }) })
  const select = (item: PlannerReading) => { setSelected(item.key); setDate(item.assignment?.due_at ? plannerDay(item.assignment.due_at) : ''); setError('') }
  const saveLocal = (key: string, assignment: ReadingAssignment) => setOverrides(value => ({ ...value, [key]: assignment }))
  async function change(key: string, day: string | null, restoring?: Undo) {
    if (disabled || busyRef.current) return
    const item = items.find(i => i.key === key)
    if (!item || !day && !restoring && item.assignment?.status !== 'published') return
    busyRef.current = true; setBusy(true); setError(''); setNotice('')
    let prepared = false
    try {
      let before = restoring?.saved ?? item.assignment
      if (!before) {
        if (!item.step || item.step.selectionRequired) throw Error('Open Reading details to set up this reading first.')
        const created = await readingFetch<{ bundle: { reading_id: string } }>('/api/reading-syllabus', { method: 'POST', body: JSON.stringify({ action: 'prepare', course_id: courseId, step_id: item.step.id }) })
        prepared = true
        const detail = await readingFetch<{ assignment: ReadingAssignment }>('/api/readings/' + created.bundle.reading_id)
        before = detail.assignment
        saveLocal(key, before)
      }
      const body = restoring ? restoring.assigned
        ? { action: 'undo-sequence-assignment', version: before.version }
        : restoring.before.status === 'published'
        ? { action: 'restore-schedule', version: before.version, due_at: restoring.before.due_at, opens_at: restoring.before.opens_at ?? null }
        : { action: 'unassign-sequence', version: before.version }
        : day ? { action: 'schedule', version: before.version, day } : { action: 'unassign-sequence', version: before.version }
      const result = await readingFetch<{ assignment: ReadingAssignment }>('/api/readings/' + before.id, { method: 'POST', body: JSON.stringify(body) })
      if (!result.assignment?.id) throw Error('The change could not be confirmed. Refresh before trying again.')
      saveLocal(key, result.assignment)
      setUndo(restoring ? null : { before, saved: result.assignment, assigned: !!day })
      setSelected(null); setDate('')
      const weekend = day ? readingWindow(day).weekend : false
      setNotice(restoring ? 'Change undone.' : day ? `${item.title} ${before.status === 'published' ? 'moved' : 'assigned'}. Due ${plannerDateLabel(result.assignment.due_at!, true)}.${weekend ? ' Saturday deadline moved to Sunday.' : ''}` : `${item.title} and its linked quizzes and vocabulary practice are unassigned. Student work is saved.`)
      if (result.assignment.status === 'published' && result.assignment.due_at) setMonth(plannerDay(result.assignment.due_at).slice(0, 7) + '-01')
      onChanged()
    } catch (e) { setError((e as Error).message); if (prepared) onChanged() }
    finally { busyRef.current = false; setBusy(false) }
  }
  const dragEnd = () => { dragRef.current = null; pointerRef.current = null; setDragging(false); setOver(null) }
  const targetAt = (event: PointerEvent<HTMLButtonElement>) => document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-planner-drop]')?.dataset.plannerDrop ?? null
  const pointerStart = (event: PointerEvent<HTMLButtonElement>, item: PlannerReading) => {
    if (disabled || event.button !== 0 || event.pointerType === 'touch' && !(event.target as Element).closest('[data-drag-handle]')) return
    suppressClick.current = false
    pointerRef.current = { key: item.key, x: event.clientX, y: event.clientY, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const pointer = pointerRef.current
    if (!pointer || disabled) return
    if (!pointer.moved && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 7) return
    event.preventDefault()
    if (!pointer.moved) { pointer.moved = true; dragRef.current = pointer.key; setDragging(true); setSelected(pointer.key) }
    const rect = plannerRef.current?.getBoundingClientRect()
    setDragPoint({ x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) })
    const target = targetAt(event)
    setOver(target === 'unassigned' && items.find(i => i.key === pointer.key)?.assignment?.status !== 'published' ? null : target)
  }
  const pointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const pointer = pointerRef.current, target = targetAt(event)
    const moved = pointer?.moved
    dragEnd()
    if (moved && pointer) { suppressClick.current = true; if (target) void change(pointer.key, target === 'unassigned' ? null : target) }
  }
  const card = (item: PlannerReading, calendar = false) => <button type="button" key={item.key} draggable={false} data-drag-handle={calendar || undefined} disabled={disabled} onPointerDown={event => pointerStart(event, item)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={dragEnd} onLostPointerCapture={dragEnd} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } select(item) }} className={calendar ? styles.dueCard : styles.readingCard} aria-pressed={selected === item.key} aria-label={`${calendar ? 'Due reading' : 'Plan reading'}: ${item.title}`}>
    <GripVertical size={14} aria-hidden="true" data-drag-handle /><span><strong>{item.title}</strong>{calendar ? <><small>Due {plannerDateLabel(item.assignment!.due_at!, true)}</small><small>{item.assignment?.opens_at ? `Opens ${plannerDateLabel(item.assignment.opens_at, true)}` : 'Available now'}</small></> : <small>{item.assignment?.status === 'archived' ? 'Unassigned · work saved' : item.step ? SYLLABUS_UNITS.find(([id]) => id === item.unit)?.[1] ?? 'Course reading' : item.assignment?.reading}</small>}</span>
  </button>

  return <section ref={plannerRef} className={styles.planner} aria-label="Visual reading planner" aria-busy={busy} onKeyDown={event => { if (event.key === 'Escape') { setSelected(null); dragEnd() } }}>
    {dragging && current && <div className={styles.dragPreview} style={{ left: dragPoint.x + 14, top: dragPoint.y + 14 }} aria-hidden="true"><GripVertical size={15} />{current.title}</div>}
    <div className={styles.heading}><div><p className="text-overline text-primary">Plan your course</p><h2 className="text-title-1">Reading calendar</h2><p className="text-muted-foreground">Drag a reading onto its due date to assign it, both quizzes, and vocabulary practice together.</p></div><Button asChild variant="outline"><Link href={stepHref()}><BookOpen size={16} />Reading details</Link></Button><Button asChild variant="outline"><Link href={'/admin/interactive-assignments?class=' + courseId}><CalendarDays size={16} />Interactive assignments</Link></Button></div>
    <div className={styles.rules}><CalendarDays size={19} aria-hidden="true" /><span><strong>Due at 11:59 PM · opens 24 hours earlier</strong><small>Saturday deadlines move to Sunday, keeping Friday’s opening. All times Eastern.</small><small>Reading Quiz: next Mon/Wed/Fri, after reading completion · Vocabulary Quiz: next Tue/Thu after practice.</small></span><span className={styles.saveLabel}>{busy ? <><Spinner size="sm" />Saving…</> : 'Changes save automatically'}</span></div>
    {error && <div className={styles.error} role="alert">{error}<Button variant="ghost" onClick={onChanged}>Refresh readings</Button></div>}
    {(notice || undo) && <div className={styles.notice} role="status"><span>{notice}</span>{undo && <Button disabled={disabled} variant="ghost" onClick={() => { const item = items.find(i => i.assignment?.id === undo.saved.id); if (item) void change(item.key, null, undo) }}><Undo2 size={16} />Undo</Button>}</div>}
    <div className={styles.workspace}>
      <aside className={styles.shelf} aria-label="Reading library">
        <div className={styles.shelfHeading}><h3 className="text-title-3">Reading shelf</h3><span>{library.length}</span></div>
        <p className={styles.hint}>Drag to the calendar, or select a reading and then a day.</p>
        <div className={styles.unassign} data-over={over === 'unassigned'} data-active={dragging} data-planner-drop="unassigned">
          <Undo2 size={21} aria-hidden="true" /><strong>Drop here to unassign</strong><p>Unassign the reading, its quizzes, and vocabulary practice together. Student work stays saved.</p>
          {!dragging && current?.assignment?.status === 'published' && <Button variant="outline" disabled={disabled} onClick={() => void change(current.key, null)}>Unassign reading & linked work</Button>}
        </div>
        <label className={styles.search}><Search size={16} aria-hidden="true" /><input aria-label="Search reading shelf" placeholder="Find a reading…" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <select aria-label="Reading collection" value={source} onChange={event => setSource(event.target.value)}><option value="sequence">Course sequence</option><option value="all">All available readings</option></select>
        <select aria-label="Filter reading unit" value={unit} onChange={event => setUnit(event.target.value)}><option value="">All units</option>{SYLLABUS_UNITS.map(([id, name], i) => <option key={id} value={id}>{i + 1}. {name}</option>)}</select>
        <div className={styles.library}>{library.map(item => card(item))}{!library.length && <p className={styles.empty}>No unassigned readings match. Try another collection or unit.</p>}</div>
        <Link className={styles.detailsLink} href={stepHref()}>Browse textbooks & reading details <ArrowRight size={14} /></Link>
      </aside>
      <div className={styles.calendarPane}>
        <div className={styles.toolbar}><h3 className="text-title-2">{new Date(month + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h3><div><Button variant="ghost" aria-label="Previous month" onClick={() => setMonth(shiftDay(month, -1).slice(0, 7) + '-01')}><ArrowLeft size={17} /></Button><Button variant="outline" onClick={() => setMonth(today.slice(0, 7) + '-01')}>Today</Button><Button variant="ghost" aria-label="Next month" onClick={() => setMonth(shiftDay(month, 32).slice(0, 7) + '-01')}><ArrowRight size={17} /></Button></div></div>
        {current && !dragging && <div className={styles.selection} role="region" aria-label="Selected reading"><div><strong>{current.title}</strong><p>Choose the reading and practice due date. The Vocabulary Quiz follows on the next Tuesday or Thursday.</p></div><div className={styles.selectionActions}><input type="date" aria-label="Selected reading due date" value={date} min="2000-01-01" max="2100-12-30" disabled={disabled} onChange={event => setDate(event.target.value)} /><Button disabled={disabled || !date} onClick={() => void change(current.key, date)}>{busy ? 'Saving…' : current.assignment?.status === 'published' ? 'Move reading' : 'Assign reading'}</Button>{current.assignment ? <Link href={`/admin/readings?view=assignments&course_id=${courseId}&id=${current.assignment.id}`}>Students & work</Link> : <Link href={stepHref(current)}>Preview</Link>}<Button variant="ghost" aria-label="Cancel reading selection" disabled={busy} onClick={() => setSelected(null)}><X size={17} /></Button></div></div>}
        <div className={styles.legend}><span><i />Due date</span><span><i data-opening />Opens to students</span><small>{assigned.length} assigned in this class</small></div>
        <div className={styles.calendarScroll} tabIndex={0} aria-label="Reading month calendar"><div className={styles.calendar}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className={styles.weekday}>{day}</div>)}
          {days.map(day => <div key={day} className={styles.day} data-outside={!day.startsWith(month.slice(0, 7))} data-over={over === day} data-today={day === today} data-selecting={!!current && !disabled} data-planner-drop={day}>
            <button className={styles.dayNumber} type="button" disabled={!current || disabled} onClick={() => current && void change(current.key, day)} aria-label={`${current ? 'Set due date to' : 'Calendar day'} ${dateLabel(day)}`}><span>{Number(day.slice(8))}</span>{day === today && <small>Today</small>}</button>
            {byDay.get(day)?.map(item => card(item, true))}
            {openings.get(day)?.map(item => <button key={item.key} type="button" className={styles.opening} onClick={() => select(item)} disabled={disabled} title={`Opens ${plannerDateLabel(item.assignment!.opens_at!, true)}`}><span>Opens</span>{item.title}</button>)}
            {over === day && <span className={styles.dropHint}>{new Date(day + 'T12:00:00Z').getUTCDay() === 6 ? 'Due Sunday · opens Friday' : 'Drop to set due date'}</span>}
          </div>)}
        </div></div>
        <p className={styles.hint}>Drag due cards to move them. Opening dates follow automatically. To unassign, drag a card back to the drop area.</p>
        {unscheduled.length > 0 && <div className={styles.noDate}><h3 className="text-title-3">Assigned without a due date <span>{unscheduled.length}</span></h3><p>These readings are already available. Drag one to set its schedule.</p><div>{unscheduled.map(item => card(item))}</div></div>}
        <p className={styles.hint}>The Reading Quiz unlocks after the reading is submitted. Vocabulary Practice is due with the reading; its quiz is due on the next Tuesday or Thursday at 11:59 PM. Moving or unassigning a reading includes all four pieces.</p>
      </div>
    </div>
  </section>
}
