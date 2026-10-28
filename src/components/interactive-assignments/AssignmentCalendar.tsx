'use client'
import AssignmentIdentity from '@/components/AssignmentIdentity'
import { sourceTitle } from '@/lib/assignment-source-presentation'
import { classDayTool } from '@/lib/class-day-tools'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { useSequenceDateConfirmation } from '@/components/admin/useSequenceDateConfirmation'
import { DateChangeCancelled } from '@/lib/sequence-date-change'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, ArrowRight, CalendarDays, GripVertical, Search, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLearningResource } from '@/app/home/useLearningWeek'
import { ALL_ASSIGNMENTS, assignmentByDay, assignmentBySlug, type LessonAssignment } from '@/lib/interactive-assignments/catalog'
import type { Assignment } from '@/lib/interactive-assignments/server'
import { calendarDays, plannerDay, shiftDay } from '@/lib/reading-planner'
import styles from '@/components/readings/ReadingPlanner.module.css'
import layout from './AssignmentCalendar.module.css'

type CalendarData = { courses: { id: string; name: string; section: string }[]; assignments: Assignment[]; readOnly: boolean }
type Item = { lesson: LessonAssignment; assignment?: Assignment }
const AssignmentTeacher = dynamic(() => import('./AssignmentTeacher'), { loading: () => <p role="status">Loading student work…</p> })
const dateLabel = (day: string, short = false) => new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: short ? 'short' : 'long', day: 'numeric', ...(!short ? { weekday: 'long' as const, year: 'numeric' as const } : {}) })

export default function AssignmentCalendar() {
  const [course, setCourse] = useState(''), [busy, setBusy] = useState(false)
  const [toolSlug, setToolSlug] = useState('day-3-velocity'), [reviewSlug, setReviewSlug] = useState('day-3-velocity'), [reviewOpen, setReviewOpen] = useState(false)
  const [reviewLoaded, setReviewLoaded] = useState(false), [reviewRevision, setReviewRevision] = useState(0)
  const [plannedSlug,setPlannedSlug]=useState('')
  const reviewRef = useRef<HTMLDetailsElement>(null)
  const reviewJump = useRef(false)
  const { data, loading, error, refresh, setData } = useLearningResource<CalendarData>('/api/interactive-assignments?view=calendar')
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    let remembered = ''
    try { remembered = localStorage.getItem('interactive-assignment-class') ?? '' } catch {}
    setCourse(params.get('class') ?? remembered)
    const day = Number(params.get('day'))
    const requested = assignmentBySlug(params.get('activity') ?? '') ?? assignmentByDay(day)
    if (requested) {
      if(params.get('plan')==='1'){setPlannedSlug(requested.slug);setToolSlug(requested.slug);return}
      setToolSlug(requested.slug); setReviewSlug(requested.slug); setReviewOpen(true); setReviewLoaded(true)
      reviewJump.current = true
    }
  }, [])
  useEffect(() => { if (!course && data?.courses.length === 1) setCourse(data.courses[0].id) }, [course, data?.courses])
  const selectedCourse = data?.courses.find(c => c.id === course)
  const reviewReady = useCallback(() => {
    if (!reviewJump.current) return
    reviewJump.current = false
    requestAnimationFrame(() => reviewRef.current?.scrollIntoView({ block: 'start' }))
  }, [])
  function selectCourse(value: string) {
    setCourse(value)
    try { localStorage.setItem('interactive-assignment-class', value) } catch {}
    const url = new URL(window.location.href)
    if (value) url.searchParams.set('class', value); else url.searchParams.delete('class')
    window.history.replaceState(null, '', url)
  }
  function openReview(slug: string) {
    reviewJump.current = !reviewLoaded || reviewSlug !== slug
    setReviewSlug(slug); setToolSlug(slug); setReviewOpen(true); setReviewLoaded(true)
    requestAnimationFrame(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const toolLesson = assignmentBySlug(toolSlug)!
  return <main className={layout.page}>
    <div className={styles.heading}><div><p className="text-overline text-primary">Course assignments & simulation investigations</p><h1 className="text-title-1">Interactive assignments</h1><p className="text-muted-foreground">Drag an activity onto its due date. It appears on your students’ Teacher deadlines calendar.</p></div></div>
    <nav className={layout.resultsLinks} aria-label="Assignment resources"><Link href={'/admin/interactive-assignments/results'+(course?'?class='+course:'')}>Simulation results & mastery <ArrowRight size={16}/></Link><Link href="/admin/interactive-assignments/investigations">Browse all investigations <ArrowRight size={16}/></Link></nav>
    <div className={layout.course}><label htmlFor="calendar-class">Class<select id="calendar-class" value={course} disabled={busy || loading} onChange={event => selectCourse(event.target.value)}><option value="">Choose a class</option>{data?.courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' · ' + c.section : ''}</option>)}</select></label></div>
    {error && <div className={styles.error} role="alert">Could not load the assignment calendar. <Button variant="outline" onClick={refresh}>Retry</Button></div>}
    {loading && <p role="status">Loading assignment dates…</p>}
    {data?.readOnly && <p className={styles.notice}>Calendar preview. Use your own teacher account to change assignment dates.</p>}
    {selectedCourse && data && <Planner key={course+plannedSlug} initialSlug={plannedSlug} courseId={course} assignments={data.assignments.filter(a => a.course_id === course)} disabled={loading || error || data.readOnly} onBusy={setBusy} onRefresh={refresh} onReview={openReview} onSaved={saved => { setData(current => current ? { ...current, assignments: [...current.assignments.filter(a => !saved.some(b=>b.id===a.id)), ...saved] } : current); setReviewRevision(value => value + 1) }} />}
    {!loading && !error && !selectedCourse && <p className={styles.empty}>Choose a class to plan its interactive assignments.</p>}
    <details className={layout.disclosure}>
      <summary><span>Teaching tools & links<small>Course plans, student previews, teaching tools, and readings</small></span></summary>
      <div className={layout.tools}>
        <label htmlFor="assignment-tools-day">Activity<select id="assignment-tools-day" value={toolSlug} onChange={event => setToolSlug(event.target.value)}>{ALL_ASSIGNMENTS.map(lesson => <option key={lesson.slug} value={lesson.slug}>{lesson.title}</option>)}</select></label>
        <div className={layout.links}>
          <Link href={'/interactive-assignments/' + toolLesson.slug}>Preview student assignment <ArrowRight size={15} /></Link>
          <Link href={toolLesson.foundation || toolLesson.simulation || !classDayTool(toolLesson.unit,toolLesson.day) ? toolLesson.toolHref : '/admin/teacher/tools/' + toolLesson.day + '?unit=' + toolLesson.unit + (course ? '&class=' + course : '')}>{toolLesson.foundation ? 'Open slides' : toolLesson.simulation ? 'Open simulation' : 'Open teaching tool'} <ArrowRight size={15} /></Link>
          <Link href={'/admin/teacher/plans?unit=' + toolLesson.unit + '&day=' + toolLesson.day + (course ? '&class=' + course : '')}>Day {toolLesson.day} course plan <ArrowRight size={15} /></Link>
          <Link href={'/admin/readings?view=syllabus' + (course ? '&course_id=' + course : '')}>Reading calendar <ArrowRight size={15} /></Link>
        </div>
      </div>
    </details>
    <details ref={reviewRef} id="assignment-review" className={layout.disclosure} open={reviewOpen} onToggle={event => { setReviewOpen(event.currentTarget.open); if (event.currentTarget.open) setReviewLoaded(true) }}>
      <summary><span>Student work & feedback<small>Answer patterns, submissions, mastery ratings, and assignment settings</small></span></summary>
      {reviewLoaded && selectedCourse ? <AssignmentTeacher key={course} courseId={course} initialSlug={reviewSlug} scheduleRevision={reviewRevision} onReady={reviewReady} onChanged={refresh} onSlugChange={slug => { setReviewSlug(slug); setToolSlug(slug) }} /> : reviewOpen && <p className={layout.empty}>Choose a class above to review student work.</p>}
    </details>
  </main>
}

function Planner({ initialSlug='',courseId, assignments, disabled, onBusy, onSaved, onRefresh, onReview }: {initialSlug?:string; courseId: string; assignments: Assignment[]; disabled: boolean; onBusy: (busy: boolean) => void; onSaved: (assignments: Assignment[]) => void; onRefresh: () => void; onReview: (slug: string) => void }) {
  const dateRequest = useSequenceDateConfirmation()
  const today = plannerDay(new Date())
  const [month, setMonth] = useState(today.slice(0, 7) + '-01'), [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(initialSlug||null), [date, setDate] = useState(assignments.find(a=>a.slug===initialSlug)?.due_on??'')
  const [kind,setKind]=useState(initialSlug.startsWith('simulation-')?'simulations':'all'),[topic,setTopic]=useState('all')
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [over, setOver] = useState<string | null>(null), [dragging, setDragging] = useState(false), [point, setPoint] = useState({ x: 0, y: 0 })
  const [undo, setUndo] = useState<{ slug: string; due: string | null } | null>(null)
  const plannerRef = useRef<HTMLElement>(null), busyRef = useRef(false), suppressClick = useRef(false)
  const pointerRef = useRef<{ slug: string; x: number; y: number; moved: boolean } | null>(null)
  const items: Item[] = ALL_ASSIGNMENTS.map(lesson => ({ lesson, assignment: assignments.find(a => a.slug === lesson.slug) }))
  const current = items.find(i => i.lesson.slug === selected), locked = disabled || busy
  const shelf = items.filter(i => !i.assignment?.due_on && (kind==='all'||kind==='simulations'&&i.lesson.simulation||kind==='lessons'&&!i.lesson.simulation) && (topic==='all'||i.lesson.investigationGroup===topic) && `${i.lesson.title} ${i.lesson.investigationGroup??''}`.toLowerCase().includes(search.toLowerCase()))
  const dated = items.filter(i => i.assignment?.due_on)
  const select = (item: Item) => { setSelected(item.lesson.slug); setDate(item.assignment?.due_on ?? ''); setError('') }
  const endDrag = () => { pointerRef.current = null; setDragging(false); setOver(null) }
  async function change(slug: string, day: string | null, restoring = false) {
    if (locked || busyRef.current) return
    const item = items.find(i => i.lesson.slug === slug)
    if (!item || !day && !item.assignment || item.assignment && item.assignment.due_on === day) return
    busyRef.current = true; setBusy(true); onBusy(true); setError(''); setNotice('')
    try {
      const result = await dateRequest.send<{assignment:Assignment;linkedAssignments?:Assignment[];sequence?:{foundationDue:string|null;reviewDue:string|null;quizDue:string|null}}>('/api/interactive-assignments', { action: 'calendar', course_id: courseId, slug, due_on: day })
      if (!result.assignment?.id || result.assignment.course_id !== courseId || result.assignment.slug !== slug || result.assignment.due_on !== day) throw Error('The date could not be confirmed. Refresh the calendar before trying again.')
      onSaved(result.linkedAssignments?.length ? result.linkedAssignments : [result.assignment])
      setUndo(restoring ? null : { slug, due: item.assignment?.due_on ?? null })
      setSelected(null); setDate('')
      setNotice(result.sequence ? day ? `Foundation: ${result.sequence.foundationDue ? dateLabel(result.sequence.foundationDue,true) : 'Unassigned'}. Review: ${result.sequence.reviewDue ? dateLabel(result.sequence.reviewDue,true) : 'Unassigned'}. Quiz: ${result.sequence.quizDue ? dateLabel(result.sequence.quizDue) : 'Unassigned'}. The review unlocks after the foundation; the quiz after both.` : 'Foundation, review and quiz are unassigned. All student work and feedback stay saved.' : day ? `${item.lesson.title} scheduled for ${dateLabel(day,true)}.` : `${item.lesson.title} is unassigned. Student work stays saved.`)

      if (day) setMonth(day.slice(0, 7) + '-01')
    } catch (e) { if (!(e instanceof DateChangeCancelled)) setError((e as Error).message) }
    finally { busyRef.current = false; setBusy(false); onBusy(false) }
  }
  const targetAt = (event: PointerEvent<HTMLButtonElement>) => {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-assignment-drop]')
    return target && plannerRef.current?.contains(target) ? target.dataset.assignmentDrop ?? null : null
  }
  const pointerStart = (event: PointerEvent<HTMLButtonElement>, item: Item) => {
    if (locked || event.button !== 0 || event.pointerType === 'touch' && !(event.target as Element).closest('[data-drag-handle]')) return
    suppressClick.current = false
    pointerRef.current = { slug: item.lesson.slug, x: event.clientX, y: event.clientY, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const pointer = pointerRef.current
    if (!pointer || locked || !pointer.moved && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 7) return
    event.preventDefault()
    if (!pointer.moved) { pointer.moved = true; setDragging(true); setSelected(pointer.slug) }
    const rect = plannerRef.current?.getBoundingClientRect()
    setPoint({ x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) })
    const target = targetAt(event)
    setOver(target === 'unscheduled' && !items.find(i => i.lesson.slug === pointer.slug)?.assignment?.due_on ? null : target)
  }
  const pointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const pointer = pointerRef.current, target = targetAt(event)
    endDrag()
    if (pointer?.moved) { suppressClick.current = true; if (target && (target !== 'unscheduled' || items.find(i => i.lesson.slug === pointer.slug)?.assignment?.due_on)) void change(pointer.slug, target === 'unscheduled' ? null : target) }
  }
  const card = (item: Item, calendar = false) => <button key={item.lesson.slug} type="button" draggable={false} data-drag-handle={calendar || undefined} disabled={locked} onPointerDown={event => pointerStart(event, item)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } select(item) }} className={calendar ? styles.dueCard : styles.readingCard} aria-label={`${calendar ? 'Due assignment' : 'Plan assignment'}: ${item.lesson.title}`} aria-pressed={selected === item.lesson.slug}>
    <GripVertical size={15} aria-hidden="true" data-drag-handle /><span><AssignmentIdentity source={{kind:'interactive',sourceId:item.lesson.slug,title:item.lesson.title}} compact={calendar}/>{item.lesson.simulation&&<small>{item.lesson.investigationGroup==='Extension'?'Optional extension':item.lesson.investigationGroup} · {item.lesson.minutes??25} min · {item.lesson.questions.length} questions</small>}<small>{item.assignment?.due_on ? `Due ${dateLabel(item.assignment.due_on, true)}` : 'Not assigned'}</small></span>
  </button>
  return <section ref={plannerRef} className={styles.planner} aria-label="Interactive assignment planner" aria-busy={busy} onKeyDown={event => { if (event.key === 'Escape') { setSelected(null); endDrag() } }}>
    {dateRequest.confirmation}
    {dragging && current && <div className={styles.dragPreview} style={{ left: point.x + 14, top: point.y + 14 }} aria-hidden="true"><GripVertical size={15} />{sourceTitle({kind:'interactive',sourceId:current.lesson.slug,title:current.lesson.title})}</div>}
    <div className={styles.rules}><CalendarDays size={20} aria-hidden="true" /><span><strong>Assign by dropping onto a due date</strong><small>Foundations schedule their review and quiz three school days later. Placing a review schedules its foundation three school days earlier.</small><small>Spacing skips weekends and saved no-school dates. Moving either lesson moves the group; student work and feedback stay saved.</small></span><span className={styles.saveLabel} role="status">{busy ? 'Saving…' : 'Changes save automatically'}</span></div>
    {error && <div className={styles.error} role="alert">{error}<Button disabled={busy} variant="ghost" onClick={onRefresh}>Refresh calendar</Button></div>}
    {notice && <div className={styles.notice} role="status"><span>{notice}</span>{undo && <Button disabled={locked} variant="ghost" onClick={() => void change(undo.slug, undo.due, true)}><Undo2 size={16} />Undo date</Button>}</div>}
    <div className={styles.workspace}>
      <aside className={`${styles.shelf} ${layout.shelf}`} aria-label="Interactive assignment shelf">
        <div className={styles.shelfHeading}><h2 className="text-title-3">Assignment shelf</h2><span>{shelf.length}</span></div>
        <p className={styles.hint}>Drag an activity to a day, or select it and then choose a date.</p>
        <div className={styles.unassign} data-assignment-drop="unscheduled" data-over={over === 'unscheduled'} data-active={dragging}><Undo2 size={20} aria-hidden="true" /><strong>Drop here to unassign</strong><p>Linked foundation, review and quiz are removed together. Student work stays saved.</p>{current?.assignment?.due_on && !dragging && <Button disabled={locked} variant="outline" onClick={() => void change(current.lesson.slug, null)}>Unassign activity</Button>}</div>
        <label className={styles.search}><Search size={16} aria-hidden="true" /><input aria-label="Search assignment shelf" placeholder="Find a day or topic…" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <div className={layout.filters}><label>Activity type<select value={kind} onChange={e=>{setKind(e.target.value);setTopic('all')}}><option value="all">All activities</option><option value="lessons">Lessons &amp; daily reviews</option><option value="simulations">Simulation labs</option></select></label>{kind!=='lessons'&&<label>Investigation topic<select value={topic} onChange={e=>{setTopic(e.target.value);if(e.target.value!=='all')setKind('simulations')}}><option value="all">All topics</option>{['Measurement','Motion','Vectors','Forces','Mission','Extension'].map(t=><option key={t} value={t}>{t==='Extension'?'Optional extensions':t}</option>)}</select></label>}</div>
        <Link href="/admin/interactive-assignments/investigations" className={layout.browse}>Browse the Unit 1 investigation guide →</Link>
        <div className={styles.library}>{shelf.map(item => card(item))}{!shelf.length && <p className={styles.empty}>No unscheduled assignments match.</p>}</div>
      </aside>
      <div className={styles.calendarPane}>
        <div className={styles.toolbar}><h2 className="text-title-2">{new Date(month + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h2><div><Button variant="ghost" aria-label="Previous month" onClick={() => setMonth(shiftDay(month, -1).slice(0, 7) + '-01')}><ArrowLeft size={17} /></Button><Button variant="outline" onClick={() => setMonth(today.slice(0, 7) + '-01')}>Today</Button><Button variant="ghost" aria-label="Next month" onClick={() => setMonth(shiftDay(month, 32).slice(0, 7) + '-01')}><ArrowRight size={17} /></Button></div></div>
        {current && !dragging && <div className={styles.selection} role="region" aria-label="Selected assignment"><div><AssignmentIdentity source={{kind:'interactive',sourceId:current.lesson.slug,title:current.lesson.title}}/><p>Select a calendar day or enter a due date.</p></div><div className={styles.selectionActions}><input type="date" aria-label="Selected assignment due date" value={date} min="2000-01-01" max="2100-12-31" disabled={locked} onChange={event => setDate(event.target.value)} /><Button disabled={locked || !date} onClick={() => void change(current.lesson.slug, date)}>{current.assignment?.due_on ? 'Save due date' : 'Assign activity'}</Button><Link href={'/interactive-assignments/' + (current.assignment?.id ?? current.lesson.slug)}>Preview activity</Link>{current.assignment && <Button variant="ghost" onClick={() => onReview(current.lesson.slug)}>Students & work</Button>}<Button variant="ghost" aria-label="Cancel assignment selection" disabled={busy} onClick={() => setSelected(null)}><X size={17} /></Button></div></div>}
        <div className={styles.legend}><span><i />Student deadline</span><small>{dated.length} assigned on the calendar</small></div>
        <div className={styles.calendarScroll} tabIndex={0} aria-label="Assignment month calendar"><div className={styles.calendar}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className={styles.weekday}>{day}</div>)}
          {calendarDays(month).map(day => <div key={day} className={styles.day} data-assignment-drop={day} data-outside={!day.startsWith(month.slice(0, 7))} data-over={over === day} data-today={day === today} data-selecting={!!current && !locked}>
            <button type="button" className={styles.dayNumber} disabled={!current || locked} aria-label={`${current ? 'Set due date to' : 'Calendar day'} ${dateLabel(day)}`} onClick={() => current && void change(current.lesson.slug, day)}><span>{Number(day.slice(8))}</span>{day === today && <small>Today</small>}</button>
            {dated.filter(item => item.assignment!.due_on === day).map(item => card(item, true))}
            {over === day && <span className={styles.dropHint}>Drop to set due date</span>}
          </div>)}
        </div></div>
        <p className={styles.hint}>Drag a scheduled card to another day to move its deadline. To unassign it, drag it back to the drop area. Saved answers and feedback are preserved.</p>
      </div>
    </div>
  </section>
}
