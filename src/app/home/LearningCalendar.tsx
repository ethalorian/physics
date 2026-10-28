'use client'

import { useRef, useState, type PointerEvent } from 'react'
import { BookOpen, Check, ChevronLeft, ChevronRight, ClipboardCheck, GripVertical, Play, Sigma, SpellCheck, FlaskConical, FileText, Lightbulb, PenLine, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { assignmentCalendarDate, assignmentDueLabel, type StudentAssignment } from '@/lib/student-dashboard'
import { dateLabel, deadlineDay, type LearningActivity } from '@/lib/learning-week'
import { quizScheduleError } from '@/lib/quiz-schedule'
import { isMathWarmupDate } from '@/lib/math-warmup-schedule'
import { type ClassWorkItem } from '@/lib/class-work'
import type { ChoiceCalendarContent } from '@/components/choices/ChoiceStudentPlanner'
import { assignmentPresentation, assignmentStatus, type ActivityType, type LearningLane } from '@/lib/assignment-presentation'
import s from './LearningWeek.module.css'

export type CalendarAssignment = StudentAssignment & { classWork?: ClassWorkItem }
export type CalendarActivity = LearningActivity & { classWork?: ClassWorkItem }
export type CalendarLane = LearningLane
const ICONS = { math: Sigma, learn: BookOpen, assignments: PenLine, investigate: FlaskConical, quizzes: ClipboardCheck }
const TYPE_ICONS: Partial<Record<ActivityType, typeof BookOpen>> = { foundation: Lightbulb, worksheet: FileText, video: Play, vocabulary: SpellCheck, 'vocabulary-quiz': SpellCheck }
const LANES: { id: CalendarLane; title: string; thinking: string }[] = [
  { id: 'math', title: 'Math warm-ups', thinking: 'Recall · Calculate' },
  { id: 'learn', title: 'Learn the ideas', thinking: 'Read · Discuss · Explain' },
  { id: 'assignments', title: 'Practice & respond', thinking: 'Apply · Show reasoning' },
  { id: 'investigate', title: 'Labs & investigations', thinking: 'Predict · Test · Explain' },
  { id: 'quizzes', title: 'Check understanding', thinking: 'Recall · Solve · Justify' },
]
export const activityLabel = (item: CalendarActivity) => assignmentPresentation(item).label
export const calendarLane = (item: CalendarActivity): CalendarLane => assignmentPresentation(item).lane

export function ActivityCard({ item, selected, onSelect, onPointerDown, editable = false }: { item: CalendarActivity; selected: boolean; onSelect: (item: CalendarActivity) => void; onPointerDown?: (e: PointerEvent<HTMLButtonElement>) => void; editable?: boolean }) {
  const presentation = assignmentPresentation(item), Icon = TYPE_ICONS[presentation.type] ?? ICONS[presentation.lane]
  const locked = !!item.prerequisiteText || /Locked|Complete .+ first/.test(item.status)
  return <button type="button" className={s.activity} data-kind={presentation.type} data-lane={presentation.lane} data-complete={item.complete && !locked} data-editable={editable} aria-pressed={selected} onClick={() => onSelect(item)} onPointerDown={onPointerDown}>
    <span className={s.activityKind}><Icon size={15} aria-hidden="true" />{presentation.label}{editable && <GripVertical size={15} data-drag-handle className={s.dragHandle} aria-label="Drag to change due date" />}</span>
    {presentation.day && <span className={s.activityDay}>Course day {presentation.day}</span>}
    <strong>{presentation.title}</strong>
    <span className={s.activityThinking}>{presentation.thinking}</span>
    <span className={s.activityStatus} data-locked={locked}>{locked ? <LockKeyhole size={13} aria-hidden="true" /> : item.complete ? <Check size={13} aria-hidden="true" /> : null}{assignmentStatus(item)}</span>
  </button>
}

interface Props {
  dates: string[]; today: string; day: string; offset: number; items: CalendarAssignment[]; selectedId?: string | null;
  scheduledWarmups?: string[]; onWarmup?: (date:string,assigned:boolean)=>void;
  mathForDay: (date: string) => LearningActivity | null; noSchoolDates: string[]; mathLoading: boolean; mathError: boolean;
  editable: boolean; saving: boolean; onSelect: (item: CalendarActivity) => void; onDay: (date: string) => void;
  onWeek: (offset: number) => void; onToday: () => void; onMore: (date: string, lane: CalendarLane) => void;
  onUnscheduled: () => void; onScheduleIssues: () => void; onMove: (item: CalendarActivity, day: string) => void;
  choices?: ChoiceCalendarContent;
}

export default function LearningCalendar(p: Props) {
  const [drag, setDrag] = useState<{ item: CalendarActivity; x: number; y: number; day: string | null; lane: string | null } | null>(null)
  const [notice, setNotice] = useState('')
  const [showWeekend, setShowWeekend] = useState(false)
  const weekendHasWork = p.dates.slice(5).some(date => p.items.some(item => deadlineDay(assignmentCalendarDate(item)) === date) || p.choices?.hasDay(date) || p.mathForDay(date))
  const visibleDates = showWeekend || weekendHasWork ? p.dates : p.dates.slice(0, 5)
  const visibleDay = visibleDates.includes(p.day) ? p.day : visibleDates[0]
  const lanes = LANES.filter(lane => p.editable || lane.id === 'math' || lane.id === 'assignments' && p.choices || p.items.some(item => calendarLane(item) === lane.id && p.dates.includes(deadlineDay(assignmentCalendarDate(item)) ?? ''))) 
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
    <div className={s.weekHeading}><div><h3>{dateLabel(p.dates[0])}–{dateLabel(p.dates[6])}</h3><p className={s.muted}>{p.editable ? 'Drag a card to change its due date, or select it to choose a date.' : 'Each card shows the work, the thinking and your next step. Dates are due dates.'}</p></div><div className={s.weekButtons}><Button variant="outline" size="icon" aria-label="Previous week" disabled={p.offset <= -52 || p.saving} onClick={() => p.onWeek(p.offset - 1)}><ChevronLeft /></Button><Button variant="outline" onClick={p.onToday}>This week</Button><Button variant="outline" size="icon" aria-label="Next week" disabled={p.offset >= 52 || p.saving} onClick={() => p.onWeek(p.offset + 1)}><ChevronRight /></Button></div></div>
    <div className={s.calendarGuide}><p>Read the type label first. Select a card for directions and required work.</p>{!weekendHasWork && <button type="button" className={s.more} aria-pressed={showWeekend} onClick={() => setShowWeekend(value => !value)}>{showWeekend ? 'Hide weekend' : 'Show weekend'}</button>}</div>
    <div className={s.mobileDays} role="group" aria-label="Choose a day">{visibleDates.map(date => <button type="button" key={date} data-calendar-date={date} data-choice-drop={p.choices ? date : undefined} data-choice-over={p.choices?.over === date} aria-label={dateLabel(date, true)} aria-pressed={visibleDay === date} onClick={() => p.onDay(date)}><span>{new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</span><strong>{Number(date.slice(-2))}</strong>{date === p.today && <span>Today</span>}</button>)}</div>
    <table className={s.weekTable}><caption className="sr-only">Weekly due dates grouped by learning purpose and assignment type</caption><thead><tr><th scope="col">Work & thinking</th>{visibleDates.map(date => <th scope="col" key={date} data-choice-drop={p.choices ? date : undefined} data-choice-over={p.choices?.over === date} data-today={date === p.today}>{dateLabel(date, true)}{date === p.today && <span>Today</span>}</th>)}</tr></thead><tbody>
      {lanes.map(({id:lane,title,thinking}) => <tr key={lane} data-purpose={lane}><th scope="row"><strong>{title}</strong><span>{thinking}</span></th>{visibleDates.map(date => {
        const math = lane === 'math' ? p.mathForDay(date) : null
        const items = lane === 'math' ? math ? [math] : [] : p.items.filter(item => calendarLane(item) === lane && deadlineDay(assignmentCalendarDate(item)) === date && !issues.includes(item))
        const target = drag?.day === date && drag.lane === lane, allowed = drag && !validDrop(drag.item, date, lane)
        const hasChoices = lane === 'assignments' && p.choices?.hasDay(date)
        return <td key={date} data-visible={date === visibleDay} data-today={date === p.today} data-calendar-date={date} data-choice-drop={p.choices ? date : undefined} data-choice-over={p.choices?.over === date && lane === 'assignments'} data-lane={lane} data-drop={target ? allowed ? 'allowed' : 'blocked' : undefined}>
          {items.slice(0, 2).map(item => <ActivityCard key={item.id} item={item} selected={p.selectedId === item.id} onSelect={select} editable={p.editable && !!('classWork' in item && (item as CalendarActivity).classWork?.canEditDue) && !p.saving} onPointerDown={e => down(e, item)} />)}
          {lane === 'math' && p.editable && p.onWarmup && isMathWarmupDate(date) && !p.noSchoolDates.includes(date) && <Button variant="ghost" size="sm" disabled={p.saving} aria-label={`${p.scheduledWarmups?.includes(date)?'Unassign':'Assign'} math warm-up ${dateLabel(date,true)}`} onClick={()=>p.onWarmup?.(date,!p.scheduledWarmups?.includes(date))}>{p.scheduledWarmups?.includes(date)?'Unassign warm-up':'Assign warm-up'}</Button>}
          {items.length > 2 && <button className={s.more} type="button" onClick={() => p.onMore(date, lane)} aria-label={'Show all '+items.length+' '+title.toLowerCase()+' activities due '+dateLabel(date,true)}>Show all {items.length}</button>}
          {lane === 'assignments' && p.choices?.renderDay(date)}
          {p.choices?.dragging && p.choices.over === date && lane === 'assignments' && <p className={s.cellEmpty}>Drop to plan here</p>}
          {!items.length && !hasChoices && <p className={s.cellEmpty}>{lane === 'math' ? p.noSchoolDates.includes(date) ? 'No school' : !isMathWarmupDate(date) ? '—' : date === p.today && p.mathLoading ? 'Loading…' : date === p.today && p.mathError ? 'Unavailable' : 'No warm-up' : lane === 'quizzes' ? [0, 6].includes(new Date(date + 'T12:00:00Z').getUTCDay()) ? 'No quizzes' : '—' : '—'}</p>}
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
