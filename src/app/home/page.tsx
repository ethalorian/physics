'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck, Gift, Joystick, ListChecks, Play, RefreshCw, Sigma, Sparkles, SpellCheck, Sprout, Users } from 'lucide-react'
import EnrollmentGate from '@/components/EnrollmentGate'
import { Button } from '@/components/ui/button'
import StudentCheckIn from './StudentCheckIn'
import AvatarSpotlight from './AvatarSpotlight'
import XpGoalRing from '@/components/gamification/XpGoalRing'
import ChallengeCard from '@/components/gamification/ChallengeCard'
import LearningPace from './LearningPace'
import LearningJourney from './LearningJourney'
import { useLearningWeek } from './useLearningWeek'
import { assignmentDeadline, assignmentDueLabel, assignmentInView, prioritizeAssignments, type AssignmentView } from '@/lib/student-dashboard'
import { dateLabel, deadlineDay, LEARNING_LABELS, weekDates, type LearningActivity } from '@/lib/learning-week'
import { schoolDayKey } from '@/lib/school-day'
import homeStyles from './home.module.css'
import s from './LearningWeek.module.css'

const ICONS = { math: Sigma, video: Play, reading: BookOpen, quiz: ClipboardCheck, vocabulary: SpellCheck }
type View = 'week' | 'today' | 'growth' | 'all'
const TABS = [{ id: 'week', label: 'My week', icon: CalendarDays }, { id: 'today', label: 'Today', icon: Check }, { id: 'growth', label: 'My growth', icon: Sprout }, { id: 'all', label: 'All assignments', icon: ListChecks }] as const

function ActivityCard({ item, selected, onSelect, deadline = false }: { item: LearningActivity; selected: boolean; onSelect: (item: LearningActivity) => void; deadline?: boolean }) {
 const Icon = ICONS[item.kind]
 return <button type="button" className={s.activity} data-kind={item.kind} data-complete={item.complete} aria-pressed={selected} onClick={() => onSelect(item)}><span className={s.activityKind}><Icon size={14} aria-hidden="true" />{LEARNING_LABELS[item.kind]}{item.complete && <Check size={14} aria-label="Complete" />}</span><strong>{item.title}</strong><span>{deadline ? assignmentDueLabel(item.due) : item.status}{deadline && item.status === 'Complete reading first' && <span> · Complete reading first</span>}</span></button>
}

export default function HomePage() {
 const data = useLearningWeek()
 const [today, setToday] = useState(() => schoolDayKey()), [view, setView] = useState<View>('week'), [weekOffset, setWeekOffset] = useState(0), [day, setDay] = useState(today)
 const [selectedId, setSelectedId] = useState<string | null>(null), [selectedFallback, setSelectedFallback] = useState<LearningActivity | null>(null)
 const [filter, setFilter] = useState<AssignmentView | 'all' | 'unscheduled'>('todo'), [kind, setKind] = useState('all'), [search, setSearch] = useState(''), [page, setPage] = useState(0), [scopedDay, setScopedDay] = useState<{ date: string; lane: 'plan' | 'due' } | null>(null)
 const [planDate, setPlanDate] = useState(''), [saving, setSaving] = useState(false), [planMessage, setPlanMessage] = useState(''), [planError, setPlanError] = useState(false), [extrasOpen, setExtrasOpen] = useState(false)
 const detail = useRef<HTMLElement>(null)
 const viewPanel = useRef<HTMLElement>(null)
 const [navigationRequest, setNavigationRequest] = useState(0)
 const openView = (next: View) => { setView(next); setNavigationRequest(n => n + 1) }
 // Reveal the requested view in the same paint, even while its data is loading.
 useLayoutEffect(() => {
  if (!navigationRequest) return
  viewPanel.current?.focus({ preventScroll: true })
  viewPanel.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
 }, [navigationRequest])
 const dates = weekDates(today, weekOffset), mobileDay = dates.includes(day) ? day : dates[0]
 const now = Date.now(), home = data.home.data, plans = data.plan.data?.plans ?? {}
 const dailyItem = data.math.data?.item
 const mathToday: LearningActivity | null = dailyItem && !data.math.error ? { id: 'math:' + today, kind: 'math', title: dailyItem.competencyStatement, href: '/dashboard/math-spine/warmup', due: null, complete: !!data.math.data?.alreadySubmitted, status: data.math.data?.alreadySubmitted ? 'Submitted' : 'Ready to start', action: data.math.data?.alreadySubmitted ? 'View warm-up' : 'Start math warm-up', day: today } : null
 const mathForDay = (date: string): LearningActivity | null => {
  if (date === today) return mathToday
  const submissions = data.pace.data?.warmups.filter(w => schoolDayKey(new Date(w.submitted_at)) === date) ?? []
  const prior = submissions.at(-1)
  if (prior) return { id: 'math:' + date, kind: 'math', title: data.growth.data?.competencies.find(c => c.id === prior.competency_id)?.statement ?? 'Daily math warm-up', href: '/dashboard/math-spine', due: null, complete: true, status: prior.status === 'reviewed' ? 'Reviewed' : 'Submitted', action: 'See my math work', day: date }
  if (date < today || data.pace.data?.noSchoolDates.includes(date) || !dailyItem) return null
  return { id: 'math:' + date, kind: 'math', title: 'Daily math practice', href: '/dashboard/math-spine/warmup', due: null, complete: false, available: false, status: 'Available that day', action: 'Available that day', day: date }
 }
 const ordered = prioritizeAssignments(data.items, now)
 const allItems = [...(mathToday ? [mathToday] : []), ...ordered]
 const selected: LearningActivity | null | undefined = allItems.find(item => item.id === selectedId) ?? dates.map(mathForDay).find(item => item?.id === selectedId) ?? (selectedId ? selectedFallback : mathToday ?? ordered.find(item => !item.complete) ?? ordered[0])
 const checking = data.sources.some(source => source.loading), failed = data.sources.filter(source => source.error)
 const overdue = ordered.filter(item => assignmentInView(item, 'overdue', now)), pending = ordered.filter(item => !item.complete)
 const plannedDay = (item: LearningActivity) => plans[item.id] ?? null
 const unplanned = pending.filter(item => !plannedDay(item))
 const unscheduled = unplanned.filter(item => !deadlineDay(item.due)).sort((a,b) => (Date.parse(b.assignedAt ?? '') || 0) - (Date.parse(a.assignedAt ?? '') || 0))
 const todayWork = allItems.filter(item => item.kind === 'math' || (!item.complete && (plannedDay(item) === today || deadlineDay(item.due) === today || assignmentDeadline(item.due) < now)))
 const matches = ordered.filter(item => (filter === 'all' || (filter === 'unscheduled' ? !item.complete && !plannedDay(item) && !deadlineDay(item.due) : assignmentInView(item, filter, now))) && (kind === 'all' || item.kind === kind) && `${item.title} ${item.context ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()) && (!scopedDay || (scopedDay.lane === 'plan' ? plannedDay(item) : deadlineDay(item.due)) === scopedDay.date))
 const pages = Math.max(1, Math.ceil(matches.length / 5)), currentPage = Math.min(page, pages - 1)
 const select = (item: LearningActivity) => { setSelectedId(item.id); setSelectedFallback(item); setPlanMessage(''); setPlanDate(plans[item.id] ?? ''); requestAnimationFrame(() => detail.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' })) }
 const manage = (status: AssignmentView | 'all' | 'unscheduled' = 'todo', scope: typeof scopedDay = null) => { openView('all'); setFilter(status); setKind('all'); setSearch(''); setPage(0); setScopedDay(scope) }
 const moveWeek = (offset: number) => { setWeekOffset(offset); setDay(weekDates(today, offset)[0]) }
 const refreshRef = useRef(data.refresh)
 useEffect(() => { refreshRef.current = data.refresh })
 useEffect(() => { const timer = setInterval(() => { const next = schoolDayKey(); if (next !== today) { setToday(next); setDay(next); setWeekOffset(0); refreshRef.current() } }, 60000); return () => clearInterval(timer) }, [today])
 const selectedPlan = selected ? plans[selected.id] ?? '' : ''
 useEffect(() => { setPlanDate(selectedPlan) }, [selected?.id, selectedPlan]) // Restore a saved plan when returning from an assignment.
 async function savePlan() {
  if (!selected || selected.kind === 'math' || saving) return
  setSaving(true); setPlanMessage(''); setPlanError(false)
  const key = selected.id, date = planDate || null
  try {
   const response = await fetch('/api/home/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignment_key: key, planned_on: date }) })
   if (!response.ok) throw Error('Could not save your plan. Try again.')
   data.plan.setData(previous => ({ plans: { ...(previous?.plans ?? {}), [key]: date } }))
   setPlanMessage(date ? `Plan saved for ${dateLabel(date)}. Your teacher’s deadline stays the same.` : 'Removed from your plan. The assignment remains in All assignments.')
  } catch { setPlanError(true); setPlanMessage('Your plan could not be saved. Please try again; your previous plan is unchanged.') }
  finally { setSaving(false) }
 }
 const showWeek = () => { openView('week'); setWeekOffset(0); setDay(today) }
 const startAction = mathToday && !mathToday.complete ? { href: mathToday.href, label: mathToday.action } : pending[0] ? { href: pending[0].href, label: pending[0].action } : home?.continue ? { href: '/lessons/' + home.continue.lesson.slug, label: 'Continue learning' } : { href: '/lessons', label: 'Explore lessons' }
 return <EnrollmentGate><div className={`${homeStyles.home} ${s.dashboard}`}>
  <StudentCheckIn name={home?.student.name} streak={!data.home.error ? home?.streak.current : undefined} points={!data.home.loading && !data.home.error ? home?.points : undefined} loading={data.home.loading} focus={mathToday && !mathToday.complete ? mathToday.title : pending[0]?.title ?? home?.continue?.lesson.title} action={startAction} onGrowth={() => openView('growth')} growthActive={view === 'growth'} />
  <LearningPace {...data.pace} onRetry={data.pace.refresh} onToday={() => openView('today')} />
  <div className={s.toolbar}><nav className={s.tabs} aria-label="Learning dashboard views">{TABS.map(tab => <button type="button" key={tab.id} aria-controls="learning-dashboard-content" aria-current={view === tab.id ? 'page' : undefined} onClick={() => tab.id === 'all' ? manage() : openView(tab.id)}><tab.icon size={17} aria-hidden="true" />{tab.label}</button>)}</nav><Button variant="ghost" onClick={data.refresh} aria-label="Refresh dashboard"><RefreshCw size={17} />Refresh</Button></div>
  <section id="learning-dashboard-content" ref={viewPanel} className={s.viewPanel} tabIndex={-1} aria-label={TABS.find(tab => tab.id === view)?.label}>
  {failed.length > 0 && <div role="alert" className={s.loadError}><p>Some assignments couldn’t load. The list and counts may be incomplete.</p>{failed.map(source => <Button key={source.name} variant="outline" onClick={source.refresh}>Retry {source.name}</Button>)}</div>}
  {data.math.error && <div role="alert" className={s.loadError}>Today’s math practice couldn’t load.<Button variant="outline" onClick={data.math.refresh}>Retry warm-up</Button></div>}
  {view === 'growth' ? <LearningJourney {...data.growth} daily={data.math.data} home={home} onRetry={data.growth.refresh} onWeek={showWeek} /> : <>
   <header className={s.heading}><div><p className={s.eyebrow}>Make room for your next discovery</p><h2>{view === 'week' ? 'Your Learning Week' : view === 'today' ? 'Today’s learning' : 'Manage your assignments'}</h2><p className={s.muted}>{view === 'week' ? 'Choose when to work. Keep teacher deadlines in sight.' : view === 'today' ? 'Your daily practice, planned work, and the assignments that need attention.' : 'Find your work, check due dates, and make a plan.'}</p></div><span className={s.tag}>{checking ? 'Checking assignments…' : `${pending.length} to do · ${ordered.filter(item => item.complete).length} submitted / done`}</span></header>
   {overdue.length > 0 && view !== 'all' && <div className={s.attention}><p><strong>{overdue.length} assignment{overdue.length === 1 ? '' : 's'} past due</strong> · Start with a manageable next step.</p><Button variant="outline" onClick={() => manage('overdue')}>Review past-due work</Button></div>}
   {view === 'week' && <section className={s.weekPanel} aria-label="Weekly learning plan">
    <div className={s.weekHeading}><div><h3>{dateLabel(dates[0])}–{dateLabel(dates[4])}</h3><p className={s.muted}>Daily practice · your plan · teacher deadlines</p></div><div className={s.weekButtons}><Button variant="outline" size="icon" aria-label="Previous week" disabled={weekOffset <= -4} onClick={() => moveWeek(weekOffset - 1)}><ChevronLeft /></Button><Button variant="outline" onClick={showWeek}>This week</Button><Button variant="outline" size="icon" aria-label="Next week" disabled={weekOffset >= 4} onClick={() => moveWeek(weekOffset + 1)}><ChevronRight /></Button></div></div>
    <div className={s.mobileDays} role="group" aria-label="Choose a day">{dates.map(date => <button type="button" key={date} aria-pressed={mobileDay === date} onClick={() => setDay(date)}>{dateLabel(date, true)}{date === today && <span>Today</span>}</button>)}</div>
    <table className={s.weekTable}><caption className="sr-only">Daily practice, personal work plans, and fixed teacher deadlines</caption><thead><tr><th scope="col">Learning rhythm</th>{dates.map(date => <th scope="col" key={date} data-today={date === today}>{dateLabel(date, true)}{date === today && <span>Today</span>}</th>)}</tr></thead><tbody>
     {(['math', 'plan', 'due'] as const).map(lane => <tr key={lane}><th scope="row"><strong>{lane === 'math' ? 'Daily practice' : lane === 'plan' ? 'My plan' : 'Teacher deadlines'}</strong><span>{lane === 'math' ? 'A little each day' : lane === 'plan' ? 'When I want to work' : 'When work is due'}</span></th>{dates.map(date => {
      const math = lane === 'math' ? mathForDay(date) : null
      const work = lane === 'math' ? math ? [math] : [] : ordered.filter(item => (lane === 'plan' ? plannedDay(item) : deadlineDay(item.due)) === date)
      const holiday = data.pace.data?.noSchoolDates.includes(date)
      return <td key={date} data-visible={date === mobileDay} data-today={date === today}>{work.slice(0, 2).map(item => <ActivityCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={select} deadline={lane === 'due'} />)}{work.length > 2 && <button className={s.more} type="button" onClick={() => manage('all', { date, lane: lane === 'math' ? 'plan' : lane })}>View all {work.length} assignments</button>}{!work.length && <p className={s.cellEmpty}>{lane === 'math' ? holiday ? 'No school' : date === today ? data.math.loading ? 'Checking practice…' : data.math.error ? 'Practice unavailable' : 'No warm-up assigned' : date < today ? data.pace.loading ? 'Checking history…' : data.pace.error ? 'History unavailable' : 'No saved warm-up' : 'Practice not assigned yet' : lane === 'due' ? 'No deadlines' : 'Room for your plan'}</p>}</td>
     })}</tr>)}
    </tbody></table>
    {!!unscheduled.length && <section className={s.unscheduled} aria-label="Unscheduled assignments"><div className={s.weekHeading}><div><h3>Unscheduled assignments <span className={s.tag}>{unscheduled.length}</span></h3><p className={s.muted}>Assigned to you with no due date. Choose a card to open it or plan a work day.</p></div><Button variant="outline" onClick={() => manage('unscheduled')}>View all unscheduled</Button></div><div className={s.unscheduledCards}>{unscheduled.slice(0,3).map(item => <ActivityCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={select}/>)}</div></section>}
    <footer className={s.unplanned}><div><strong>{unplanned.length} assignments without a work plan</strong><p className={s.muted}>They stay available until you choose a day.</p></div><Button variant="outline" onClick={() => manage()}>Plan my work<ArrowRight size={16} /></Button></footer>
   </section>}
   {view === 'today' && <section className={s.todayGrid} aria-label="Today’s activities">{todayWork.slice(0,5).map(item => <ActivityCard key={item.id} item={item} selected={selected?.id === item.id} onSelect={select} />)}{!todayWork.length && <div className={s.panel}><h3>{checking ? 'Checking today’s work…' : 'Make a plan for today'}</h3><p>Choose an assignment below, continue your lesson, or explore your growth.</p><Button onClick={() => manage()}>Choose an assignment</Button></div>}{todayWork.length > 5 && <Button variant="outline" onClick={() => manage()}>See all {todayWork.length} activities needing attention</Button>}</section>}
   {view === 'all' && <section className={s.manager} aria-label="Assignment manager"><div className={s.filters}><label>Status<select aria-label="Status" value={filter} onChange={e => { setFilter(e.target.value as AssignmentView | 'all' | 'unscheduled'); setPage(0) }}><option value="all">All work</option><option value="todo">To do</option><option value="unscheduled">Unscheduled</option><option value="overdue">Past due</option><option value="upcoming">Next 7 days</option><option value="submitted">Submitted / done</option></select></label><label>Assignment type<select aria-label="Assignment type" value={kind} onChange={e => { setKind(e.target.value); setPage(0) }}><option value="all">All types</option>{Object.entries(LEARNING_LABELS).filter(([id]) => id !== 'math').map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Search assignments<input aria-label="Search assignments" type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="Title or class" /></label></div>{scopedDay && <p className={s.muted}>{scopedDay.lane === 'plan' ? 'Planned' : 'Due'} {dateLabel(scopedDay.date)} <button type="button" className={s.more} onClick={() => setScopedDay(null)}>Clear day filter</button></p>}<div className={s.assignmentList}>{matches.slice(currentPage*5,currentPage*5+5).map(item => <article key={item.id}><ActivityCard item={item} selected={selected?.id === item.id} onSelect={select} /><div><p>{assignmentDueLabel(item.due)}</p><p className={s.muted}>{plannedDay(item) ? `My plan: ${dateLabel(plannedDay(item)!)}` : 'Not yet planned'}</p></div><Button asChild variant="outline"><Link href={item.href}>{item.action}<ArrowRight size={16}/></Link></Button></article>)}{!matches.length && <p className={s.empty}>{checking ? 'Checking assignments…' : failed.length ? 'No matching work in the assignments that loaded.' : 'No assignments match these filters.'}</p>}</div><div className={s.pagination}><p role="status">{matches.length ? `${currentPage*5+1}–${Math.min(matches.length,currentPage*5+5)} of ${matches.length}` : '0 assignments'}</p><div><Button variant="outline" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button variant="outline" disabled={currentPage >= pages-1} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div></section>}
   {selected && <section ref={detail} className={s.detail} aria-labelledby="activity-detail-heading"><div><p className={s.eyebrow}>{LEARNING_LABELS[selected.kind]} · {selected.status}</p><h3 id="activity-detail-heading">{selected.title}</h3>{selected.context && <p className={s.muted}>{selected.context}</p>}<p>{selected.kind === 'math' ? `Daily practice${selected.day ? ' · ' + dateLabel(selected.day) : ''} · work at your own pace` : assignmentDueLabel(selected.due)}</p>{selected.returned && <p className={s.attentionText}>Your teacher has asked for a revision.</p>}{selected.kind === 'reading' && <p className={s.muted}>After you submit the reading, its linked quiz becomes available in All assignments as “Needs completion.” You can take it later.</p>}{selected.available === false ? <p className={s.tag}>This activity opens on its day.</p> : <Button asChild><Link href={selected.href}>{selected.action}<ArrowRight size={16}/></Link></Button>}{selected.kind === 'math' && <button type="button" className={s.more} onClick={() => openView('growth')}>See how this math connects to my growth →</button>}</div>
    {selected.kind !== 'math' && <div className={s.planEditor}><h4>Make it part of my plan</h4><p className={s.muted}>Choose when you’ll work. Your teacher’s due date stays fixed.</p>{data.plan.error ? <div role="alert"><p>Saved plans couldn’t load.</p><Button variant="outline" onClick={data.plan.refresh}>Retry saved plans</Button></div> : <><label>My work date<input aria-label="My work date" type="date" value={planDate} disabled={saving || data.plan.loading} onChange={e => setPlanDate(e.target.value)} /></label><div className={s.planActions}><Button disabled={saving || data.plan.loading} onClick={savePlan}>{saving ? 'Saving…' : 'Save my plan'}</Button><Button variant="ghost" disabled={saving || data.plan.loading} onClick={() => setPlanDate('')}>Clear date</Button></div>{planDate && deadlineDay(selected.due) && planDate > deadlineDay(selected.due)! && <p className={s.attentionText}>This is after the teacher’s deadline. Your assignment would still be late.</p>}</>}{planMessage && <p role={planError ? 'alert' : 'status'}>{planMessage}</p>}</div>}
   </section>}
   <div className={s.growthColumns}><section className={s.panel}><p className={s.eyebrow}>Keep learning</p><h3>{data.home.loading ? 'Finding your next lesson…' : data.home.error ? 'Your lesson is unavailable' : home?.continue?.lesson.title ?? 'Explore your lessons'}</h3>{home?.continue && !data.home.error && <><p className={s.muted}>{home.continue.unitName}</p><progress max={Math.max(1,home.continue.total)} value={home.continue.completed} aria-label="Lessons completed in current unit"/><p className={s.muted}>{home.continue.completed} of {home.continue.total} lessons completed</p><Button asChild><Link href={'/lessons/'+home.continue.lesson.slug}>{home.continue.lesson.progress > 0 ? 'Resume lesson' : 'Start lesson'}<ArrowRight size={16}/></Link></Button></>}<Link className={s.more} href="/lessons">All lessons →</Link></section><section className={s.panel}><p className={s.eyebrow}>Practice becomes understanding</p><h3>See the connections you’re building</h3><div className={s.growthRoute}><span><Sigma size={22}/>Math</span><ArrowRight size={20}/><span><BookOpen size={22}/>Physics</span><ArrowRight size={20}/><span><Sprout size={22}/>Growth</span></div><p className={s.muted}>Follow your math into your course. See teacher observations, feedback, and your next learning step.</p><Button variant="outline" onClick={() => openView('growth')}>Explore my growth<ArrowRight size={16}/></Button></section></div>
  </>}
  </section>
  <section className={homeStyles.rewards} aria-label="Play and rewards"><div className={homeStyles.rewardsHeading}><h2 className="text-sm font-semibold">Make it yours.</h2><p className="mt-1 text-xs">Your character. Your rewards. Your next high score.</p></div><nav aria-label="Play and reward shortcuts" className={homeStyles.rewardLinks}><Button asChild variant="outline"><Link href="/arcade"><Joystick/>Arcade</Link></Button><Button asChild variant="outline"><Link href="/avatar/gallery"><Users/>Avatar gallery</Link></Button><Button asChild variant="outline"><Link href="/store"><Gift/>Store</Link></Button></nav></section>
  <details className={s.extras} onToggle={e => setExtrasOpen(e.currentTarget.open)}><summary><Sparkles size={17}/>Goals & classroom extras</summary>{extrasOpen && <div className={s.growthColumns}><div><XpGoalRing compact/><ChallengeCard compact/><Link href="/xp" className={s.more}>XP details & requirements →</Link></div><AvatarSpotlight/></div>}</details>
 </div></EnrollmentGate>
}
