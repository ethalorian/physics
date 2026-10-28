'use client'

import { ASSIGNMENT_METADATA } from '@/lib/interactive-assignments/metadata'
import { ACTIVITY_PROFILES, activityTypeFor, assignmentPresentation, assignmentStatus } from '@/lib/assignment-presentation'

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays, ChartNoAxesCombined, Check, ListChecks, RefreshCw, X } from 'lucide-react'
import EnrollmentGate from '@/components/EnrollmentGate'
import { Button } from '@/components/ui/button'
import { useClassWork, saveClassWork } from '@/components/admin/useClassWork'
import { workAccessLabels } from '@/lib/class-work'
import StudentCheckIn from './StudentCheckIn'
import LearningJourney from './LearningJourney'
import LearningCalendar, { ActivityCard, calendarLane, type CalendarActivity, type CalendarAssignment, type CalendarLane } from './LearningCalendar'
import { useLearningResource, useLearningWeek } from './useLearningWeek'
import ChoiceCalendar from '@/components/choices/ChoiceCalendar'
import type { ChoiceCalendarContent } from '@/components/choices/ChoiceStudentPlanner'
import type { ChoiceSnapshot } from '@/lib/choice-calendar-server'
import { sourceKey } from '@/lib/choice-calendar'
import { assignmentCalendarDate, assignmentDeadline, assignmentTimingLabel, assignmentInView, prioritizeAssignments, type AssignmentView } from '@/lib/student-dashboard'
import { dateLabel, deadlineDay, weekDates, type LearningActivity } from '@/lib/learning-week'
import { moveDeadline, quizScheduleError, QUIZ_SCHEDULE_LABELS } from '@/lib/quiz-schedule'
import { schoolDayKey } from '@/lib/school-day'
import { nextStudentHomeTask } from '@/lib/student-home-banner'
import homeStyles from './home.module.css'
import s from './LearningWeek.module.css'
import StudentProgress from '@/components/student/StudentProgress'
import StudentHomework from '@/components/student/StudentHomework'
import StudentBannerProgress from '@/components/student/StudentBannerProgress'
import { StudentProgressProvider, useStudentProgress } from '@/components/student/StudentProgressContext'
import { studentAssignmentPastDue } from '@/lib/student-gradebook'

type View = 'week' | 'today' | 'growth' | 'all' | 'progress'
type Filter = AssignmentView | 'all' | 'unscheduled' | 'schedule-issues'
const TABS = [{ id: 'week', label: 'My week', icon: CalendarDays }, { id: 'today', label: 'Today', icon: Check }, { id: 'progress', label: 'My progress', icon: ChartNoAxesCombined }, { id: 'all', label: 'All assignments', icon: ListChecks }] as const

type DashboardProps = { children?: ReactNode; classId?: string; studentId?: string; initialTerm?: string }
export default function StudentDashboard(props: DashboardProps) {
  return <StudentProgressProvider classId={props.classId} studentId={props.studentId} initialTerm={props.initialTerm ?? (props.children ? 'all' : undefined)}><DashboardContent {...props}/></StudentProgressProvider>
}

function DashboardContent({ children }: DashboardProps) {
  const progress = useStudentProgress()
  const data = useLearningWeek(), { data: session } = useSession()
  const router = useRouter()
  const staff = !!data.readings.data?.staff
  const courses = staff ? data.readings.data?.courses ?? [] : []
  const chosenClass = progress.classId, setChosenClass = progress.onClass
  useEffect(() => { const next = new URLSearchParams(location.search).get('view'); if (next === 'week' || next === 'today' || next === 'progress') setView(next) }, [])
  const classId = courses.some(c => c.id === chosenClass) ? chosenClass : courses[0]?.id ?? null
  const classWork = useClassWork(staff ? classId : null)
  const choiceClassId = staff ? courses.find(c => c.id === classId && (c.program ?? 'physics') === 'physics')?.id ?? null : null
  const choices = useLearningResource<ChoiceSnapshot>('/api/choice-calendar' + (choiceClassId ? '?class=' + choiceClassId : ''))
  const warmupCalendar = useLearningResource<{courseId?:string;days:string[]}>(`/api/calendar/warmups${staff && classId ? '?class='+encodeURIComponent(classId) : ''}`)
  const editable = staff && !!classWork.data && !classWork.data.readOnly && !session?.experience
  const [today, setToday] = useState(() => schoolDayKey()), [view, setView] = useState<View>('week'), [weekOffset, setWeekOffset] = useState(0), [day, setDay] = useState(today)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('todo'), [kind, setKind] = useState('all'), [search, setSearch] = useState(''), [page, setPage] = useState(0)
  const [scope, setScope] = useState<{ date: string; lane: CalendarLane } | null>(null)
  const [dueDate, setDueDate] = useState(''), [saving, setSaving] = useState(false), [saveMessage, setSaveMessage] = useState(''), [saveError, setSaveError] = useState(false)
  const savingRef = useRef(false), detail = useRef<HTMLElement>(null), viewPanel = useRef<HTMLElement>(null)
  const [navigationRequest, setNavigationRequest] = useState(0)
  const navigationTarget = useRef<'view' | 'feedback'>('view')
  const openView = (next: View, target: 'view' | 'feedback' = 'view') => { navigationTarget.current = target; setView(next); setNavigationRequest(n => n + 1) }
  useLayoutEffect(() => {
    if (!navigationRequest) return
    const target = navigationTarget.current === 'feedback' ? viewPanel.current?.querySelector<HTMLElement>('#teacher-feedback') ?? viewPanel.current : viewPanel.current
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [navigationRequest])

  const dates = weekDates(today, weekOffset), mobileDay = dates.includes(day) ? day : dates[0]
  const now = Date.now(), home = data.home.data
  const scheduledWarmups = warmupCalendar.error || staff && warmupCalendar.data?.courseId!==classId ? [] : warmupCalendar.data?.days ?? []
  const dailyItem = scheduledWarmups.includes(today) && data.math.data?.warmupScheduled ? data.math.data.item : null
  const mathToday: LearningActivity | null = dailyItem && !data.math.error ? { id: 'math:' + today, kind: 'math', title: dailyItem.competencyStatement, href: '/dashboard/math-spine/warmup', due: null, complete: !!data.math.data?.alreadySubmitted, status: data.math.data?.alreadySubmitted ? 'Submitted' : 'Ready to start', action: data.math.data?.alreadySubmitted ? 'View warm-up' : 'Start math warm-up', day: today } : null
  const mathForDay = (date: string): LearningActivity | null => {
    if (!scheduledWarmups.includes(date)) return null
    if (date === today && !staff) return mathToday
    const prior = data.pace.data?.warmups.filter(w => schoolDayKey(new Date(w.submitted_at)) === date).at(-1)
    if (prior) return { id: 'math:' + date, kind: 'math', title: data.growth.data?.competencies.find(c => c.id === prior.competency_id)?.statement ?? 'Math warm-up', href: '/dashboard/math-spine', due: null, complete: true, status: prior.status === 'reviewed' ? 'Reviewed' : 'Submitted', action: 'See my math work', day: date }
    if (date < today || data.pace.data?.noSchoolDates.includes(date)) return null
    return { id: 'math:' + date, kind: 'math', title: 'Math warm-up', href: '/dashboard/math-spine/warmup', due: null, complete: false, available: false, status: 'Available that day', action: 'Available that day', day: date }
  }
  const teacherItems: CalendarAssignment[] = (classWork.data?.items ?? []).filter(w => (w.access === 'open' || w.access === 'scheduled') && deadlineDay(assignmentCalendarDate({due:w.dueAt,closesAt:w.closesAt})) !== null).map(w => ({
    id: w.id, kind: w.kind === 'worksheet' ? 'worksheet' : w.kind === 'quiz' ? 'quiz' : w.kind === 'vocabulary' || w.kind === 'vocabulary-set' ? 'vocabulary' : w.kind === 'homework' ? 'video' : w.kind === 'review' ? 'review' : 'reading',
    activityType: w.activityType ?? (w.kind === 'interactive' ? ASSIGNMENT_METADATA.find(m=>m.title===w.title)?.activityType ?? 'daily-review' : w.kind === 'simulation' ? 'simulation-lab' : w.kind === 'review' ? 'unit-review' : w.kind === 'lesson' ? 'lesson' : undefined), quizSchedule: w.quizSchedule, title: w.title, href: w.href, due: w.dueAt, closesAt:w.closesAt, complete: false, status: workAccessLabels[w.access], action: 'Open assignment', context: w.audience, classWork: w,
  }))
  const choiceUser = choices.data?.roster[0]?.id ?? ''
  const choiceSourceStates = new Map((choices.data?.sections ?? []).filter(section => section.published || section.published_at).flatMap(section => section.options.flatMap(option => {
    const progress = choices.data?.progress[choiceUser]?.[section.id]?.options.find(o => o.option.id === option.id)
    return option.steps.map(step => [sourceKey(step), { chosen: !!progress?.selected, followUp: step.followUp }] as const)
  })))
  const workKey = (id: string) => id.replace(/^video:/, 'lesson:').replace(/^vocab:/, 'vocabulary:')
  const ordered = prioritizeAssignments<CalendarAssignment>((staff ? teacherItems : data.items).filter(item => staff || !choiceSourceStates.has(workKey(item.id)) || choiceSourceStates.get(workKey(item.id))?.chosen).map(item => !staff && !item.complete && studentAssignmentPastDue(assignmentCalendarDate(item), new Date(now)) ? { ...item, status: item.prerequisiteText || item.status === 'Complete reading first' ? item.status : 'Homework · Not completed' } : item), now)
  const requiredCalendarItems = ordered.filter(item => !choiceSourceStates.has(workKey(item.id)) || choiceSourceStates.get(workKey(item.id))?.followUp)
  const allItems: CalendarActivity[] = [...(mathToday ? [mathToday] : []), ...ordered]
  const selected: CalendarActivity | null = allItems.find(item => item.id === selectedId) ?? dates.map(mathForDay).find(item => item?.id === selectedId) ?? null
  const selectedPresentation = selected ? assignmentPresentation(selected) : null
  const selectedDue = selected?.due ?? null
  useEffect(() => { setDueDate(deadlineDay(selectedDue) ?? '') }, [selectedId, selectedDue])
  const checking = staff ? classWork.loading : data.sources.some(source => source.loading)
  const failed = data.sources.filter(source => source.error)
  const overdue = ordered.filter(item => assignmentInView(item, 'overdue', now)), pending = ordered.filter(item => !item.complete)
  const todayWork = allItems.filter(item => item.kind === 'math' || (!item.complete && (deadlineDay(assignmentCalendarDate(item)) === today || assignmentDeadline(item.due) < now)))
  const matches = ordered.filter(item => (filter === 'all' || (filter === 'unscheduled' ? !item.complete && !item.due : filter === 'schedule-issues' ? !!item.quizSchedule && !!quizScheduleError(item.due, item.quizSchedule) : assignmentInView(item, filter, now))) && (kind === 'all' || activityTypeFor(item) === kind) && `${item.title} ${assignmentPresentation(item).label} ${assignmentPresentation(item).thinking} ${item.context ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()) && (!scope || deadlineDay(assignmentCalendarDate(item)) === scope.date && calendarLane(item) === scope.lane))
  const pages = Math.max(1, Math.ceil(matches.length / 5)), currentPage = Math.min(page, pages - 1)
  const select = (item: CalendarActivity) => { setSelectedId(item.id); setSaveMessage(''); requestAnimationFrame(() => detail.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' })) }
  const manage = (status: Filter = 'todo', nextScope: typeof scope = null) => { if (!staff && !nextScope && !['unscheduled', 'schedule-issues'].includes(status)) { router.push('/home/gradebook' + (status === 'overdue' ? '?work=homework&term=all' : '')); return } openView('all'); setFilter(status); setKind('all'); setSearch(''); setPage(0); setScope(nextScope) }
  const moveWeek = (offset: number) => { setWeekOffset(offset); setDay(weekDates(today, offset)[0]); setSelectedId(null) }
  const showWeek = () => { openView('week'); setWeekOffset(0); setDay(today) }
  const refresh = () => { data.refresh(); progress.refresh(); choices.refresh(); warmupCalendar.refresh(); if (staff) void classWork.load() }
  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh })
  useEffect(() => {
    const checkDay = () => { const next = schoolDayKey(); if (next !== today) { setToday(next); setDay(next); setWeekOffset(0); refreshRef.current() } }
    const onVisible = () => { if (document.visibilityState === 'visible') checkDay() }
    const timer = setInterval(checkDay, 60000)
    window.addEventListener('focus', checkDay)
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); window.removeEventListener('focus', checkDay); document.removeEventListener('visibilitychange', onVisible) }
  }, [today])

  async function schedule(item: CalendarActivity, nextDay: string) {
    if (!editable || !classId || !item.classWork?.canEditDue || savingRef.current) return
    setSaveMessage(''); setSaveError(false)
    try {
      const due = nextDay ? moveDeadline(item.due, nextDay, item.classWork.dateOnly) : null
      const error = item.quizSchedule ? quizScheduleError(due, item.quizSchedule) : null
      if (error) throw Error(error)
      savingRef.current = true; setSaving(true)
      await saveClassWork(item.classWork, classId, 'due', { due_at: due })
      await classWork.load()
      setSaveMessage(`${item.title}: ${nextDay ? 'due ' + dateLabel(nextDay, true) : 'unassigned'}. Saved for the class.`)
      setDueDate(nextDay)
    } catch (e) { setSaveError(true); setSaveMessage((e as Error).message) }
    finally { savingRef.current = false; setSaving(false) }
  }
  async function setWarmupDate(date: string, assigned: boolean) {
    if (!editable || !classId || savingRef.current) return
    savingRef.current=true; setSaving(true); setSaveMessage(''); setSaveError(false)
    try {
      const response=await fetch('/api/calendar/warmups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({course_id:classId,day:date,assigned})})
      const result=await response.json()
      if(!response.ok)throw Error(result.error??'Could not update the calendar.')
      warmupCalendar.refresh(); data.math.refresh()
      setSaveMessage(assigned?'Math warm-up assigned for '+dateLabel(date,true)+'.':'Math warm-up unassigned. Saved work is preserved.')
    } catch(error) {setSaveError(true);setSaveMessage((error as Error).message)}
    finally {savingRef.current=false;setSaving(false)}
  }
  const bannerTask = nextStudentHomeTask({ items: ordered, math: mathToday, today, now: new Date(now), loading: checking || data.math.loading || warmupCalendar.loading || ((!staff || !!choiceClassId) && choices.loading), incomplete: ((!staff || !!choiceClassId) && choices.error) || warmupCalendar.error || failed.length > 0 || data.math.error || !!classWork.error || !!classWork.data?.warnings.length })

  const calendar = (choicePlanning?: ChoiceCalendarContent) => <LearningCalendar dates={dates} today={today} day={mobileDay} offset={weekOffset} items={requiredCalendarItems} selectedId={selectedId} mathForDay={mathForDay} scheduledWarmups={scheduledWarmups} onWarmup={(date,assigned)=>void setWarmupDate(date,assigned)} noSchoolDates={data.pace.data?.noSchoolDates ?? []} mathLoading={data.math.loading} mathError={data.math.error} editable={editable} saving={saving} onSelect={select} onDay={setDay} onWeek={moveWeek} onToday={showWeek} onMore={(date, lane) => manage('all', { date, lane })} onUnscheduled={() => manage('unscheduled')} onScheduleIssues={() => manage('schedule-issues')} onMove={(item, date) => void schedule(item, date)} choices={choicePlanning} />

  const progressHref = '/home?' + new URLSearchParams({ view: 'progress', ...(progress.data?.courseId ? { class: progress.data.courseId } : {}), ...(progress.data?.staff && progress.studentId ? { student: progress.studentId } : {}), term: progress.termId })
  const banner = <StudentCheckIn name={home?.student.name} streak={!data.home.error ? home?.streak.current : undefined} points={!data.home.loading && !data.home.error ? home?.points : undefined} loading={data.home.loading} today={today} task={bannerTask} onGrowth={children ? undefined : () => openView('progress')} onFeedback={children ? undefined : () => openView('progress', 'feedback')} growthActive={!children && view === 'progress'} progressHref={children ? progressHref : undefined} feedbackHref={children ? progressHref + '#teacher-feedback' : undefined} progressSummary={<StudentBannerProgress/>}/>

  if (children) return <EnrollmentGate><div className={`${homeStyles.home} ${s.dashboard}`}>{banner}{children}</div></EnrollmentGate>

  return <EnrollmentGate><div className={`${homeStyles.home} ${s.dashboard}`}>
    {banner}
    <div className={s.toolbar}><nav className={s.tabs} aria-label="Learning dashboard views">{TABS.filter(tab => staff || tab.id !== 'all').map(tab => <button type="button" key={tab.id} aria-controls="learning-dashboard-content" aria-current={view === tab.id ? 'page' : undefined} onClick={() => tab.id === 'all' ? manage() : openView(tab.id)}><tab.icon size={17} aria-hidden="true" />{tab.label}</button>)}</nav>{view !== 'progress' && <Button variant="ghost" onClick={refresh} disabled={saving} aria-label="Refresh dashboard"><RefreshCw size={17} /><span className={s.refreshLabel}>Refresh</span></Button>}</div>
    {staff && <div className={s.teacherControls}><label>Class calendar<select aria-label="Class calendar" value={classId ?? ''} disabled={saving} onChange={e => { setChosenClass(e.target.value); setSelectedId(null); setSaveMessage('') }}>{courses.map(c => <option key={c.id} value={c.id}>{[c.name, c.section].filter(Boolean).join(' · ')}</option>)}</select></label><p>{editable ? 'Teacher editing · changes apply to this class' : 'View only'}</p></div>}
    <section id="learning-dashboard-content" ref={viewPanel} className={s.viewPanel} tabIndex={-1} aria-label={TABS.find(tab => tab.id === view)?.label}>
      {view !== 'progress' && failed.length > 0 && <div role="alert" className={s.loadError}><p>Some assignments couldn’t load. The list and counts may be incomplete.</p>{failed.map(source => <Button key={source.name} variant="outline" onClick={source.refresh}>Retry {source.name}</Button>)}</div>}
      {view !== 'progress' && staff && (classWork.error || classWork.data?.warnings.length) ? <div role="alert" className={s.loadError}><p>{classWork.error || classWork.data?.warnings.join(' ')}</p><Button variant="outline" onClick={classWork.load}>Retry class calendar</Button></div> : null}
      {view !== 'progress' && data.math.error && <div role="alert" className={s.loadError}>Today’s math practice couldn’t load.<Button variant="outline" onClick={data.math.refresh}>Retry warm-up</Button></div>}
      {saveMessage && <p role={saveError ? 'alert' : 'status'} className={saveError ? s.loadError : s.scheduleNotice}>{saveMessage}</p>}
      {view === 'progress' ? <StudentProgress/> : view === 'growth' ? <LearningJourney {...data.growth} daily={data.math.data} home={home} onRetry={data.growth.refresh} onWeek={showWeek} /> : <>
        <header className={s.heading}><h2>{view === 'week' ? 'Your Learning Week' : view === 'today' ? 'Today’s learning' : 'All assignments'}</h2><span className={s.tag}>{checking ? 'Checking assignments…' : staff ? `${ordered.length} assigned` : `${pending.length} to do · ${ordered.filter(item => item.complete).length} done`}</span></header>
        {overdue.length > 0 && view === 'today' && <div className={s.attention}><p><strong>{overdue.length} {staff ? `assignment${overdue.length === 1 ? '' : 's'} past due` : `homework ${overdue.length === 1 ? 'item' : 'items'} to finish`}</strong></p><Button variant="ghost" onClick={() => manage('overdue')}>Review work<ArrowRight size={15} /></Button></div>}
        {view === 'week' && (staff ? <>{calendar()}{choiceClassId && <ChoiceCalendar key={classId} {...choices} data={choices.data?.courseId !== classId ? null : choices.data} refresh={refresh} dates={dates} courseId={classId} authoringHref={'/admin/control-room?view=choices&class=' + encodeURIComponent(classId!)} />}</> : <ChoiceCalendar {...choices} refresh={refresh} dates={dates} courseId={null} renderCalendar={calendar} onPlanDay={setDay} />)}
        {view === 'week' && <StudentHomework/>}
        {view === 'today' && <section className={s.todayGrid} aria-label="Today’s activities">{todayWork.slice(0, 5).map(item => <ActivityCard key={item.id} item={item} selected={selectedId === item.id} onSelect={select} />)}{!todayWork.length && <div className={s.panel}><h3>{checking ? 'Checking today’s work…' : 'You’re caught up for today'}</h3><Button onClick={() => manage()}>Browse assignments</Button></div>}{todayWork.length > 5 && <Button variant="outline" onClick={() => manage()}>See all {todayWork.length} activities needing attention</Button>}</section>}
        {view === 'all' && <section className={s.manager} aria-label="Assignment manager">
          <div className={s.filters}><label>Status<select value={filter} onChange={e => { setFilter(e.target.value as Filter); setPage(0) }}><option value="all">All work</option><option value="todo">To do</option><option value="unscheduled">No due date</option><option value="schedule-issues">Quiz dates to review</option><option value="overdue">Past due</option><option value="upcoming">Next 7 days</option><option value="submitted">Submitted / done</option></select></label><label>Assignment type<select value={kind} onChange={e => { setKind(e.target.value); setPage(0) }}><option value="all">All types</option>{Object.entries(ACTIVITY_PROFILES).filter(([id]) => id !== 'math').map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}</select></label><label>Search assignments<input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="Title or class" /></label></div>
          {scope && <p className={s.muted}>Due {dateLabel(scope.date)} <button type="button" className={s.more} onClick={() => setScope(null)}>Clear day filter</button></p>}
          {filter === 'schedule-issues' && <p className={s.muted}>These existing dates need a teacher’s review. Their saved deadlines stay in effect until the teacher changes them.</p>}
          <div className={s.assignmentList}>{matches.slice(currentPage * 5, currentPage * 5 + 5).map(item => <article key={item.id}><ActivityCard item={item} selected={selectedId === item.id} onSelect={select} /><div><p>{assignmentTimingLabel(item)}</p>{item.quizSchedule && quizScheduleError(item.due, item.quizSchedule) && <p className={s.attentionText}>{QUIZ_SCHEDULE_LABELS[item.quizSchedule]}</p>}</div><Button asChild variant="outline"><Link href={item.href}>{item.action}<ArrowRight size={16} /></Link></Button></article>)}{!matches.length && <p className={s.empty}>{checking ? 'Checking assignments…' : failed.length ? 'No matching work in the assignments that loaded.' : 'No assignments match these filters.'}</p>}</div>
          <div className={s.pagination}><p role="status">{matches.length ? `${currentPage * 5 + 1}–${Math.min(matches.length, currentPage * 5 + 5)} of ${matches.length}` : '0 assignments'}</p><div><Button variant="outline" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button variant="outline" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
        </section>}
        {selected && selectedPresentation && <section ref={detail} className={s.detail} aria-labelledby="activity-detail-heading">
          <Button variant="ghost" size="icon" className={s.closeDetail} aria-label="Close activity details" onClick={() => setSelectedId(null)}><X size={18} /></Button>
          <div><p className={s.eyebrow}>{selectedPresentation.label}{selectedPresentation.day ? ' · Course day '+selectedPresentation.day : ''} · {assignmentStatus(selected)}</p><h3 id="activity-detail-heading">{selectedPresentation.title}</h3><p className={s.thinkingFocus}><strong>Thinking focus</strong>{selectedPresentation.thinking}</p>{selectedPresentation.question && <p className={s.focusQuestion}>{selectedPresentation.question}</p>}<p><strong>What you’ll do: </strong>{selectedPresentation.directions}</p>{selected.prerequisiteText && <p className={s.prerequisiteNotice}><strong>Before you start: </strong>{selected.prerequisiteText}</p>}{selected.context && !selected.prerequisiteText && !selected.context.startsWith('Unit 1 · Course day') && <p className={s.muted}>{selected.context}</p>}<p>{selected.kind === 'math' ? `Math warm-up${selected.day ? ' · ' + dateLabel(selected.day) : ''}` : assignmentTimingLabel(selected)}</p>{selected.quizSchedule && <p className={s.muted}>{QUIZ_SCHEDULE_LABELS[selected.quizSchedule]}</p>}{selected.returned && <p className={s.attentionText}>Your teacher has asked for a revision.</p>}{selected.available === false ? <p className={s.tag}>This activity opens on its day.</p> : <Button asChild><Link href={selected.href}>{selected.action}<ArrowRight size={16} /></Link></Button>}{selected.kind === 'math' && <button type="button" className={s.more} onClick={() => openView('growth')}>See my math growth →</button>}</div>
          {editable && selected.classWork?.canEditDue && <form className={s.dueEditor} onSubmit={e => { e.preventDefault(); void schedule(selected, dueDate) }}><h4>Assignment due date</h4><p className={s.muted}>Choose the date for this class. Clearing the date unassigns the work and preserves saved answers. Dates use Eastern time.</p>{selected.classWork.kind === 'reading' && <p className={s.muted}>For a linked reading sequence, practice follows the reading date. Its quizzes move to their next permitted weekdays.</p>}<label>Due date<input type="date" value={dueDate} disabled={saving} onChange={e => setDueDate(e.target.value)} /></label><div className={s.dueActions}><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save due date'}</Button><Button type="button" variant="ghost" disabled={saving} onClick={() => setDueDate('')}>Clear date</Button></div></form>}
        </section>}
      </>}
    </section>
  </div></EnrollmentGate>
}
