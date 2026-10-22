'use client'

import { useRef, useState, type PointerEvent } from 'react'
import { BookOpen, Check, ChevronLeft, ChevronRight, ClipboardCheck, GripVertical, Play, Sigma, SpellCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { assignmentDueLabel, type StudentAssignment } from '@/lib/student-dashboard'
import { dateLabel, deadlineDay, LEARNING_LABELS, type LearningActivity } from '@/lib/learning-week'
import { quizScheduleError } from '@/lib/quiz-schedule'
import { isMathWarmupDate } from '@/lib/math-warmup-schedule'
import { workKinds, type ClassWorkItem } from '@/lib/class-work'
import s from './LearningWeek.module.css'

export type CalendarAssignment = StudentAssignment & { classWork?: ClassWorkItem }
export type CalendarActivity = LearningActivity & { classWork?: ClassWorkItem }
export type CalendarLane = 'math' | 'quizzes' | 'assignments'
const ICONS = { math: Sigma, video: Play, reading: BookOpen, quiz: ClipboardCheck, vocabulary: SpellCheck }
export const activityLabel = (item: CalendarActivity) => item.quizSchedule === 'vocabulary' ? 'Vocabulary quiz' : item.kind === 'math' ? 'Math warm-up' : item.classWork ? workKinds[item.classWork.kind] : LEARNING_LABELS[item.kind]
export const calendarLane = (item: CalendarActivity): CalendarLane => item.kind === 'math' ? 'math' : item.quizSchedule || item.kind === 'quiz' ? 'quizzes' : 'assignments'

export function ActivityCard({ item, selected, onSelect, onPointerDown, editable = false }: { item: CalendarActivity; selected: boolean; onSelect: (item: CalendarActivity) => void; onPointerDown?: (e: PointerEvent<HTMLButtonElement>) => void; editable?: boolean }) {
  const Icon = ICONS[item.kind]
  return <button type="button" className={s.activity} data-kind={item.quizSchedule === 'vocabulary' ? 'vocabulary-quiz' : item.kind} data-complete={item.complete} data-editable={editable} aria-pressed={selected} onClick={() => onSelect(item)} onPointerDown={onPointerDown}>
    <span className={s.activityKind}><Icon size={14} aria-hidden="true" />{activityLabel(item)}{item.complete && <Check size={14} aria-label="Complete" />}{editable && <GripVertical size={15} data-drag-handle className={s.dragHandle} aria-label="Drag to change due date" />}</span>
    <strong>{item.title}</strong><span>{item.status}</span>
  </button>
}

interface Props {
  dates: string[]; today: string; day: string; offset: number; items: CalendarAssignment[]; selectedId?: string | null;
  mathForDay: (date: string) => LearningActivity | null; noSchoolDates: string[]; mathLoading: boolean; mathError: boolean;
  editable: boolean; saving: boolean; onSelect: (item: CalendarActivity) => void; onDay: (date: string) => void;
  onWeek: (offset: number) => void; onToday: () => void; onMore: (date: string, lane: CalendarLane) => void;
  onUnscheduled: () => void; onScheduleIssues: () => void; onMove: (item: CalendarActivity, day: string) => void;
}

export default function LearningCalendar(p: Props) {
  const [drag, setDrag] = useState<{ item: CalendarActivity; x: number; y: number; day: string | null; lane: string | null } | null>(null)
  const [notice, setNotice] = useState('')
  const pointer = useRef<{ item: CalendarActivity; x: number; y: number; moved: boolean } | null>(null)
  const suppressClick = useRef(0)
  const issues = p.items.filter(item => item.quizSchedule && quizScheduleError(item.due, item.quizSchedule))
  const unscheduled = p.items.filter(item => !item.complete && !item.due)
  const validDrop = (item: CalendarActivity, day: string, lane: string | null) => lane && lane !== calendarLane(item) ? 'Keep this activity in its calendar row.' : item.quizSchedule ? quizScheduleError(day, item.quizSchedule) : null
  const select = (item: CalendarActivity) => { if (Date.now() > suppressClick.current) p.onSelect(item) }
  function down(e: PointerEvent<HTMLButtonElement>, item: CalendarActivity) {
    if (!p.editable || !item.classWork?.canEditDue || p.saving || e.button !== 0 || (e.pointerType === 'touch' && !(e.target as Element).closest('[data-drag-handle]'))) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointer.current = { item, x: e.clientX, y: e.clientY, moved: false }
  }
  function move(e: PointerEvent<HTMLElement>) {
    const start = pointer.current
    if (!start) return
    if (!start.moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 7) return
    start.moved = true
    const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-calendar-date]')
    setDrag({ item: start.item, x: e.clientX, y: e.clientY, day: cell?.dataset.calendarDate ?? null, lane: cell?.dataset.lane ?? null })
  }
  function up(e: PointerEvent<HTMLElement>) {
    const start = pointer.current
    pointer.current = null; setDrag(null)
    if (!start?.moved) return
    suppressClick.current = Date.now() + 450
    const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-calendar-date]'), day = cell?.dataset.calendarDate
    if (!day) return
    const error = validDrop(start.item, day, cell?.dataset.lane ?? null)
    setNotice(error ?? '')
    if (!error) p.onMove(start.item, day)
  }
  return <section className={s.weekPanel} aria-label="Weekly learning calendar" onPointerMove={move} onPointerUp={up} onPointerCancel={() => { pointer.current = null; setDrag(null) }}>
    <div className={s.weekHeading}><div><h3>{dateLabel(p.dates[0])}–{dateLabel(p.dates[6])}</h3><p className={s.muted}>{p.editable ? 'Drag a card to change its due date, or select it to choose a date.' : 'Your classes, at a glance.'}</p></div><div className={s.weekButtons}><Button variant="outline" size="icon" aria-label="Previous week" disabled={p.offset <= -52 || p.saving} onClick={() => p.onWeek(p.offset - 1)}><ChevronLeft /></Button><Button variant="outline" onClick={p.onToday}>This week</Button><Button variant="outline" size="icon" aria-label="Next week" disabled={p.offset >= 52 || p.saving} onClick={() => p.onWeek(p.offset + 1)}><ChevronRight /></Button></div></div>
    <div className={s.mobileDays} role="group" aria-label="Choose a day">{p.dates.map(date => <button type="button" key={date} data-calendar-date={date} aria-label={dateLabel(date, true)} aria-pressed={p.day === date} onClick={() => p.onDay(date)}><span>{new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</span><strong>{Number(date.slice(-2))}</strong>{date === p.today && <span>Today</span>}</button>)}</div>
    <table className={s.weekTable}><caption className="sr-only">Math warm-ups, quizzes, and assignment due dates for all seven days</caption><thead><tr><th scope="col">Learning rhythm</th>{p.dates.map(date => <th scope="col" key={date} data-today={date === p.today}>{dateLabel(date, true)}{date === p.today && <span>Today</span>}</th>)}</tr></thead><tbody>
      {(['math', 'quizzes', 'assignments'] as const).map(lane => <tr key={lane}><th scope="row"><strong>{lane === 'math' ? 'Math warm-up' : lane === 'quizzes' ? 'Quizzes' : 'Assignments, lessons & practice'}</strong><span>{lane === 'math' ? 'Tue · Thu' : lane === 'quizzes' ? 'Quizzes · Mon, Wed, Fri\nVocabulary · Tue, Thu' : 'Due any day'}</span></th>{p.dates.map(date => {
        const math = lane === 'math' ? p.mathForDay(date) : null
        const items = lane === 'math' ? math ? [math] : [] : p.items.filter(item => calendarLane(item) === lane && deadlineDay(item.due) === date && !issues.includes(item))
        const target = drag?.day === date && drag.lane === lane, allowed = drag && !validDrop(drag.item, date, lane)
        return <td key={date} data-visible={date === p.day} data-today={date === p.today} data-calendar-date={date} data-lane={lane} data-drop={target ? allowed ? 'allowed' : 'blocked' : undefined}>
          {items.slice(0, 2).map(item => <ActivityCard key={item.id} item={item} selected={p.selectedId === item.id} onSelect={select} editable={p.editable && !!('classWork' in item && (item as CalendarActivity).classWork?.canEditDue) && !p.saving} onPointerDown={e => down(e, item)} />)}
          {items.length > 2 && <button className={s.more} type="button" onClick={() => p.onMore(date, lane)}>View all {items.length}</button>}
          {!items.length && <p className={s.cellEmpty}>{lane === 'math' ? p.noSchoolDates.includes(date) ? 'No school' : !isMathWarmupDate(date) ? '—' : date === p.today && p.mathLoading ? 'Loading…' : date === p.today && p.mathError ? 'Unavailable' : 'No warm-up' : lane === 'quizzes' ? [0, 6].includes(new Date(date + 'T12:00:00Z').getUTCDay()) ? 'No quizzes' : '—' : '—'}</p>}
        </td>
      })}</tr>)}
    </tbody></table>
    {!!(unscheduled.length || issues.length) && <footer className={s.calendarFooter}>
      {!!unscheduled.length && <button className={s.more} type="button" onClick={p.onUnscheduled}>{unscheduled.length} assignments without a due date <ChevronRight size={15} /></button>}
      {!!issues.length && <button className={s.more} type="button" onClick={p.onScheduleIssues}>{issues.length} quiz date{issues.length === 1 ? '' : 's'} to review <ChevronRight size={15} /></button>}
    </footer>}
    {notice && <p role="alert" className={s.attentionText}>{notice}</p>}
    {drag && <div className={s.dragGhost} style={{ left: drag.x + 12, top: drag.y + 12 }} aria-hidden="true"><strong>{drag.item.title}</strong><span>{drag.day ? validDrop(drag.item, drag.day, drag.lane) ?? `Due ${dateLabel(drag.day)}` : assignmentDueLabel(drag.item.due)}</span></div>}
  </section>
}
