'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, BarChart3, Plus, RefreshCw, Search } from 'lucide-react'
import { useViewAs } from '@/lib/use-view-as'
import { recentEngagement, practiceFollowUp, weightedEngagement, type EngagementDay, type EngagementReport, type EngagementStudent } from '@/lib/student-engagement'
import { Button } from '@/components/ui/button'
import PracticeComposer from './PracticeComposer'
import PracticeTracker from './PracticeTracker'
import styles from './engagement.module.css'

const xpAverage = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const percent = (value: number | null) => value === null ? '—' : `${Math.round(value * 10) / 10}%`
const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
function dayClass(day: EngagementDay) { return `${styles.day} ${day.kind === 'excluded' ? styles.excluded : day.active ? day.kind === 'off' ? styles.offActive : styles.classActive : day.kind === 'class' ? styles.classMiss : ''}` }
function dayDescription(day: EngagementDay) { return `${shortDate(day.date)} · ${day.kind === 'excluded' ? 'Before enrollment / class start' : day.kind === 'unknown' ? 'Schedule unavailable' : day.kind === 'class' ? 'Class day' : 'Off day'} · ${day.active ? day.sources.join(', ') : 'No recorded activity'}` }
function Legend() { return <div className={styles.legend}><span><i className={styles.classActive} />Active class day</span><span><i className={styles.offActive} />Active off day</span><span><i className={`${styles.day} ${styles.classMiss}`} />No activity on class day</span><span><i className={styles.day} />Off day</span></div> }

export default function AdminHomePage() {
  const { role } = useViewAs()
  const router = useRouter()
  const [report, setReport] = useState<EngagementReport | null>(null)
  const [courseId, setCourseId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('engagement')
  const [multiplier, setMultiplier] = useState(1.5)
  const [selected, setSelected] = useState<string[]>([])
  const [studentId, setStudentId] = useState('')
  const [composer, setComposer] = useState(false)
  const [message, setMessage] = useState('')
  const [dayNote, setDayNote] = useState('')
  const [trendNote, setTrendNote] = useState('')
  const [taskId, setTaskId] = useState('')
  const [rosterFilter, setRosterFilter] = useState<{ label: string; ids: string[] } | null>(null)
  const [trendDate, setTrendDate] = useState('')
  const [detailDate, setDetailDate] = useState('')
  const detailHeading = useRef<HTMLHeadingElement>(null)
  const rosterHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (role === 'teacher') router.replace('/admin/teacher') }, [role, router])
  useEffect(() => {
    try { const saved = Number(localStorage.getItem('admin-engagement-off-day-multiplier')); if ([1, 1.5, 2, 3].includes(saved)) setMultiplier(saved) } catch { /* Browser storage is optional. */ }
  }, [])
  useEffect(() => {
    if (role !== 'admin') return
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    setLoading(true); setError('')
    const params = new URLSearchParams()
    if (courseId) params.set('course_id', courseId)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    fetch(`/api/admin/engagement?${params}`, { signal: controller.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Engagement could not load.')
      if (!Array.isArray(data.students) || !Array.isArray(data.courses)) throw new Error('Engagement could not load.')
      if (controller.signal.aborted) return
      setReport(data); setRosterFilter(null); setTrendDate(''); setTrendNote(''); setDayNote(''); setDetailDate(''); setSelected(previous => previous.filter(id => data.students.some((student: EngagementStudent) => student.id === id)))
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); else if (!disposed) setError('The report took too long to load. Try a shorter date range or retry.') })
      .finally(() => { clearTimeout(timeout); if (!disposed) setLoading(false) })
    let disposed = false
    return () => { disposed = true; clearTimeout(timeout); controller.abort() }
  }, [role, courseId, from, to, revision])
  const students = useMemo(() => {
    return (report?.students ?? []).filter(student => (!rosterFilter || rosterFilter.ids.includes(student.id)) && student.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'xp' ? (b.xp.averagePerDay ?? -Infinity) - (a.xp.averagePerDay ?? -Infinity) || a.name.localeCompare(b.name) : sort === 'bonus' ? b.activeOffDays - a.activeOffDays : (a.classPercent ?? Infinity) - (b.classPercent ?? Infinity) || a.name.localeCompare(b.name))
  }, [report, search, sort, rosterFilter])
  const current = report?.students.find(student => student.id === studentId) ?? students[0]
  const currentTask = report?.practice.find(task => task.id === taskId) ?? report?.practice[0]
  const eligible = report?.students.filter(student => student.classPercent !== null) ?? []
  const classDays = eligible.reduce((sum, student) => sum + student.classDays, 0)
  const activeDays = eligible.reduce((sum, student) => sum + student.activeClassDays, 0)
  const average = classDays ? 100 * activeDays / classDays : null
  const trendDates = report?.students[0]?.days.slice(-30).map(day => day.date) ?? []
  const trend = trendDates.map(date => {
    const days = report!.students.map(student => student.days.find(day => day.date === date)!).filter(day => day && day.kind !== 'excluded')
    return { date, total: days.length, active: days.filter(day => day.active).length, off: days.some(day => day.kind === 'off') }
  })
  const selectedStudents = report?.students.filter(student => selected.includes(student.id)) ?? []
  const unavailable = loading || !!error
  function chooseStudent(id: string) {
    setStudentId(id); setDayNote(''); setDetailDate('')
    requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 1100px)').matches) detailHeading.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      detailHeading.current?.focus({ preventScroll: true })
    })
  }
  function showStudents(label: string, ids: string[]) {
    setRosterFilter({ label, ids }); setSearch('')
    requestAnimationFrame(() => { rosterHeading.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); rosterHeading.current?.focus({ preventScroll: true }) })
  }
  const signals = useMemo(() => new Map((report?.students ?? []).map(student => [student.id, recentEngagement(student)])), [report])
  const quietStudents = report?.students.filter(student => (signals.get(student.id)?.consecutiveInactive ?? 0) >= 3).map(student => student.id) ?? []
  const followUp = report ? practiceFollowUp(report.practice, report.latestCompleteDay) : { notStarted: [], overdue: [] }
  const currentSignal = current ? signals.get(current.id) : null
  const trendStudents = (report?.students ?? []).filter(student => student.days.some(day => day.date === trendDate && day.kind !== 'excluded'))
  const trendActive = trendStudents.filter(student => student.days.some(day => day.date === trendDate && day.active)).map(student => student.id)
  const trendInactive = trendStudents.filter(student => !trendActive.includes(student.id)).map(student => student.id)
  if (role !== 'admin') return <p role="status" className="p-6">Opening your home…</p>

  return <div className={styles.page}>
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-overline text-primary">Admin home / student engagement</p><h1 className="mt-2 text-display">Who’s showing up to learn?</h1><p className="mt-2 text-sm text-muted-foreground">See the habit. Choose the student. Assign the next step.</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/admin/command-center">Run class<ArrowRight aria-hidden="true" /></Link></Button><Button disabled={!selected.length || unavailable} onClick={() => setComposer(true)}><Plus aria-hidden="true" />Assign practice{selected.length ? ` (${selected.length})` : ''}</Button></div></header>
    <div className={styles.toolbar}>
      <label className={`${styles.field} sm:min-w-64`}>Your class<select aria-label="Your class" disabled={loading} value={courseId || report?.courseId || ''} onChange={event => { setCourseId(event.target.value); setFrom(''); setTo(''); setReport(null); setSelected([]); setStudentId(''); setTaskId(''); setDayNote(''); setTrendNote(''); setTrendDate(''); setRosterFilter(null); setDetailDate(''); setMessage('') }}>{report?.courses.length ? report.courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>) : <option value="">{loading ? 'Loading classes…' : 'No connected classes'}</option>}</select></label>
      <label className={styles.field}>From<input aria-label="Engagement start date" type="date" value={from || report?.from || ''} onChange={event => setFrom(event.target.value)} max={to || report?.to} /></label>
      <label className={styles.field}>Through<input aria-label="Engagement end date" type="date" value={to || report?.to || ''} onChange={event => setTo(event.target.value)} max={report?.latestCompleteDay} /></label>
      <label className={styles.field}>Off-day multiplier<select aria-label="Off-day multiplier" value={multiplier} onChange={event => { const value = Number(event.target.value); setMultiplier(value); try { localStorage.setItem('admin-engagement-off-day-multiplier', String(value)) } catch { /* Optional preference. */ } }}>{[1, 1.5, 2, 3].map(value => <option key={value} value={value}>{value}×</option>)}</select></label>
      <Button variant="outline" aria-label="Refresh engagement" disabled={loading} onClick={() => setRevision(n => n + 1)}><RefreshCw size={16} aria-hidden="true" /></Button>
    </div>
    {message && <p role="status" className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">{message}</p>}
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 p-4"><p>{error}</p><Button variant="outline" onClick={() => setRevision(n => n + 1)}>Retry engagement</Button></div>}
    {loading && <p role="status" className="mb-4 text-sm text-muted-foreground">Loading recorded activity and class meeting dates…</p>}
    {!loading && !error && report && !report.courseId && <div className={styles.empty}>Connect your class to start tracking engagement. <Link href="/admin/roster" className="underline">Open roster imports</Link></div>}
    {report && !unavailable && report.courseId && <>
      {!report.scheduleReady && <p role="status" className="mb-4 rounded-xl border p-4 text-sm">{report.scheduleMessage} <Link href="/admin/pacing" className="underline">Open Pacing</Link></p>}
      <section className={styles.hero} aria-labelledby="engagement-overview">
        <div className={styles.score}><h2 id="engagement-overview" className="text-overline text-muted-foreground">Class-day engagement</h2><p className={styles.number}>{percent(average)}</p><p className="text-sm">{classDays ? `${activeDays} active student-days / ${classDays} possible` : 'No eligible class days in this range'}</p><p className="mt-4 text-xs leading-relaxed text-muted-foreground">{report.students.length} students · through {shortDate(report.to)}<br />Each student counts once per day, from enrollment onward. Today is excluded until the day is complete.</p><div className="mt-5 flex items-baseline gap-2 border-t pt-4"><strong className="text-xl">{report.scheduleReady ? report.students.reduce((sum, student) => sum + student.activeOffDays, 0) : '—'}</strong><span className="text-xs text-muted-foreground">active off-days · {multiplier}× bonus credit</span></div></div>
        <div className={styles.trend}><div className="flex items-start justify-between gap-3"><div><h2 className="text-title-3">Daily participation</h2><p className="mt-1 text-xs text-muted-foreground">Share of enrolled students with recorded activity · latest {trend.length} days in range</p></div><BarChart3 className="shrink-0 text-primary" aria-hidden="true" /></div><div className={styles.bars} role="group" aria-label="Daily participation chart">{trend.map(day => <button key={day.date} className={styles.barButton} aria-pressed={trendDate === day.date} aria-label={`${shortDate(day.date)}: ${day.active} of ${day.total} students active${day.off ? ', off day' : ''}`} title={`${shortDate(day.date)}: ${day.active}/${day.total}`} onClick={() => { setTrendDate(day.date); setTrendNote(`${shortDate(day.date)} · ${day.active} of ${day.total} students active${day.off ? ' on an off day' : ''}`) }}><span className={`${styles.barFill} ${day.off ? styles.offFill : ''}`} style={{ height: `${day.total ? day.active / day.total * 100 : 0}%`, opacity: day.active ? 1 : .18 }} /></button>)}</div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{trend[0] ? shortDate(trend[0].date) : 'No dates'}</span><span>0–100% of students</span><span>{trend.at(-1) ? shortDate(trend.at(-1)!.date) : ''}</span></div><p role="status" className="mt-4 min-h-5 text-xs text-muted-foreground">{trendNote || 'Select a bar to inspect a day. Gold marks bonus activity on an off day.'}</p>{trendDate && <div className="mt-2 flex flex-wrap gap-2"><Button variant="outline" disabled={!trendActive.length} onClick={() => showStudents(`${shortDate(trendDate)}: recorded activity`, trendActive)}>Show {trendActive.length} active students</Button><Button variant="outline" disabled={!trendInactive.length} onClick={() => showStudents(`${shortDate(trendDate)}: no recorded activity`, trendInactive)}>Show {trendInactive.length} without activity</Button></div>}</div>
      </section>
      <section className={styles.followUp} aria-label="Engagement follow-up">
        {[{ label: 'No use in 3+ class days', ids: quietStudents, detail: 'Consecutive class days in this range', filter: 'No recorded use in 3+ consecutive class days' }, { label: 'Practice not started', ids: followUp.notStarted, detail: 'At least one active assignment', filter: 'Practice not started' }, { label: 'Overdue practice', ids: followUp.overdue, detail: 'Unfinished after the due date', filter: 'Overdue practice' }].map(item => <button key={item.label} className={styles.followUpAction} disabled={!item.ids.length} onClick={() => showStudents(item.filter, item.ids)}><span><strong>{item.ids.length}</strong><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span></span><ArrowRight size={18} aria-hidden="true" /></button>)}
      </section>
      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="students-heading"><div className={styles.panelHeader}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="students-heading" ref={rosterHeading} tabIndex={-1} className="scroll-mt-24 text-title-3">Every student, individually</h2><p className="mt-1 text-xs text-muted-foreground">Select a name for their activity history. Check boxes to assign practice.</p></div><span className="text-xs text-muted-foreground">{selected.length} selected{selected.some(id => !students.some(student => student.id === id)) ? ` · ${selected.filter(id => !students.some(student => student.id === id)).length} outside view` : ''}</span></div><div className="mt-4 flex flex-wrap gap-2"><label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3"><Search size={16} aria-hidden="true" /><input aria-label="Find a student" placeholder="Find a student…" className="w-full min-w-0 bg-transparent text-sm" value={search} onChange={event => setSearch(event.target.value)} /></label><label className={styles.field}><span className="sr-only">Sort students</span><select aria-label="Sort students" value={sort} onChange={event => setSort(event.target.value)}><option value="engagement">Lowest class-day % first</option><option value="name">Student name</option><option value="bonus">Most off-day activity</option><option value="xp">Highest average XP/day</option></select></label></div><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" onClick={() => setSelected(students.map(student => student.id))} disabled={!students.length}>Select visible</Button><Button variant="outline" onClick={() => setSelected(students.filter(student => student.classPercent !== null && student.classPercent < 50).map(student => student.id))}>Select below 50%</Button>{!!selected.length && <><Button variant="ghost" onClick={() => setSelected([])}>Clear</Button><Button onClick={() => setComposer(true)}>Assign to selected ({selected.length})</Button></>}</div>{rosterFilter && <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/5 p-3 text-xs"><span>{rosterFilter.label} · {students.length} shown</span><Button variant="ghost" onClick={() => setRosterFilter(null)}>Show all students</Button></div>}</div>
          <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th><span className="sr-only">Select</span></th><th>Student</th><th>Class-day %</th><th>Off days</th><th>With bonus</th><th>Avg XP/day</th><th>Recent class days</th></tr></thead><tbody>{students.map(student => <tr key={student.id} className={student.id === current?.id ? styles.selected : ''}><td><label className="grid min-h-11 min-w-6 place-items-center"><input type="checkbox" aria-label={`Select ${student.name}`} checked={selected.includes(student.id)} onChange={event => setSelected(previous => event.target.checked ? [...previous, student.id] : previous.filter(id => id !== student.id))} /></label></td><td><button className={styles.studentButton} onClick={() => chooseStudent(student.id)} aria-pressed={current?.id === student.id}>{student.name}</button></td><td><strong>{percent(student.classPercent)}</strong><div className={styles.meter} role="img" aria-label={`${student.name}: ${student.activeClassDays} of ${student.classDays} class days active`}><span style={{ width: `${student.classPercent ?? 0}%` }} /></div><span className="mt-1 block text-[11px] text-muted-foreground">{student.activeClassDays}/{student.classDays} days</span></td><td>{report.scheduleReady ? student.activeOffDays : '—'}</td><td className="font-semibold">{percent(weightedEngagement(student, multiplier))}</td><td><strong>{xpAverage(student.xp.averagePerDay)}</strong><span className="mt-1 block whitespace-nowrap text-[11px] text-muted-foreground">{student.xp.earned.toLocaleString()} XP / {student.xp.days} days</span></td><td><div className={styles.miniDays} aria-label="Recent daily activity">{student.days.filter(day => day.kind === 'class').slice(-10).map(day => <span key={day.date} className={dayClass(day)} title={dayDescription(day)} />)}</div><span className="mt-1 block text-[11px] text-muted-foreground">{signals.get(student.id)?.total ? `${signals.get(student.id)!.active}/${signals.get(student.id)!.total} recent class days active` : 'No class days'}</span></td></tr>)}</tbody></table></div>{!students.length && <p className={styles.empty}>{report.students.length ? 'No students match this search.' : 'No active students are enrolled in this class.'}</p>}<div className="p-4"><Legend /></div>
        </section>
        <aside className="min-w-0 space-y-5" aria-label="Selected student and assigned practice">
          {current && <section key={current.id} className={`${styles.panel} ${styles.detailPanel}`} aria-labelledby="student-detail-heading"><div className={styles.panelHeader}><p className="text-overline text-primary">Student detail</p><h2 id="student-detail-heading" ref={detailHeading} tabIndex={-1} className="mt-2 scroll-mt-24 text-title-2">{current.name}</h2><div className="mt-4 grid grid-cols-3 gap-2"><div><strong className="text-xl">{percent(current.classPercent)}</strong><p className="mt-1 text-xs text-muted-foreground">Class-day use</p></div><div><strong className="text-xl">{report.scheduleReady ? current.activeOffDays : '—'}</strong><p className="mt-1 text-xs text-muted-foreground">Active off days</p></div><div><strong className="text-xl">{percent(weightedEngagement(current, multiplier))}</strong><p className="mt-1 text-xs text-muted-foreground">With {multiplier}× bonus</p></div></div><div className="mt-4 rounded-xl bg-primary/5 p-3"><div className="flex items-baseline justify-between gap-3"><span className="text-sm font-medium">Average XP per day</span><strong className="text-2xl tabular-nums">{xpAverage(current.xp.averagePerDay)}</strong></div><p className="mt-1 text-xs text-muted-foreground">{current.xp.earned.toLocaleString()} XP earned ÷ {current.xp.days} calendar days · includes days with zero XP</p></div>{currentSignal && <div className="mt-4 border-t pt-3 text-xs text-muted-foreground"><p><strong className="text-foreground">{currentSignal.active}/{currentSignal.total}</strong> most recent class days active{currentSignal.change !== null ? <span className="ml-2">· {currentSignal.change > 0 ? '+' : ''}{currentSignal.change} percentage points vs previous 5</span> : ' · Need 10 class days for a trend'}</p>{currentSignal.consecutiveInactive > 0 && <p className="mt-2">No recorded use on the last {currentSignal.consecutiveInactive} {currentSignal.consecutiveInactive === 1 ? 'class day' : 'class days'} in this range.</p>}</div>}</div><div className="p-5"><div className="mb-3 flex justify-between text-xs text-muted-foreground"><span>{shortDate(report.from)} – {shortDate(report.to)}</span><span>One square = one day</span></div><div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs text-muted-foreground">{['S','M','T','W','T','F','S'].map((day, index) => <span key={index}>{day}</span>)}</div><div className="max-h-64 overflow-y-auto"><div className={styles.calendar} role="group" aria-label={`${current.name} daily engagement calendar`}>{Array.from({ length: new Date(`${report.from}T12:00:00Z`).getUTCDay() }, (_, index) => <span key={`blank-${index}`} />)}{current.days.map(day => <button key={day.date} className={dayClass(day)} aria-pressed={detailDate === day.date} aria-label={dayDescription(day)} title={dayDescription(day)} onClick={() => { setDetailDate(day.date); setDayNote(dayDescription(day)) }}>{day.date.endsWith('-01') ? shortDate(day.date) : Number(day.date.slice(-2))}</button>)}</div></div><p role="status" className="mt-3 min-h-9 text-xs leading-relaxed text-muted-foreground">{dayNote || 'Select a day to see the recorded activity sources.'}</p><p className="mt-2 text-xs text-muted-foreground">Counted from {shortDate(current.eligibleFrom)} · {current.lastActive ? `Last activity in range: ${new Date(current.lastActive).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' })}` : 'No recorded activity in this range'}</p><Button className="mt-4 w-full" onClick={() => { setSelected([current.id]); setComposer(true) }}><Plus aria-hidden="true" />Assign practice to this student</Button></div></section>}
          <section className={styles.panel} aria-labelledby="practice-heading"><div className={styles.panelHeader}><h2 id="practice-heading" className="text-title-3">Assigned practice → engagement</h2><p className="mt-1 text-xs text-muted-foreground">Vocabulary check activity since each assignment was created. Independent of the date filter above.</p></div>{currentTask ? <div className="p-5"><label className={styles.field}>Assignment<select aria-label="Track practice assignment" value={currentTask.id} onChange={event => setTaskId(event.target.value)}>{report.practice.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><PracticeTracker key={currentTask.id} task={currentTask} latestCompleteDay={report.latestCompleteDay} onStudent={chooseStudent} onFilter={showStudents} onUpdated={(id, dueOn) => { setReport(previous => previous ? { ...previous, practice: previous.practice.map(task => task.id === id ? { ...task, dueOn } : task) } : previous); setRosterFilter(null) }} /></div> : <div className={styles.empty}><p>No active vocabulary practice assignments for this class yet.</p><p className="mt-2">Select students and choose Assign practice to start.</p></div>}</section>
        </aside>
      </div>
      <details className="mt-6 rounded-xl border bg-card p-4"><summary className="min-h-8 cursor-pointer text-sm font-semibold">How engagement and the off-day bonus are calculated</summary><div className="mt-3 max-w-4xl space-y-2 text-sm leading-relaxed text-muted-foreground"><p><strong>Class-day %</strong> = active class days ÷ elapsed class days × 100. The denominator uses this section’s rotation, off weeks, holidays, and enrollment date. A double-block day counts once. The report ends yesterday in Eastern time.</p><p><strong>With bonus</strong> = (active class days + active off days × {multiplier}) ÷ elapsed class days × 100. This can exceed 100%; the original class-day percentage stays visible. The multiplier is a dashboard preference saved on this browser; it does not award XP or change grades.</p><p><strong>Average XP/day</strong> = XP earned in the selected range ÷ eligible calendar days, starting at enrollment or class/report start, whichever is later. Includes off days and zero-XP days through yesterday. Uses the same earning ledger as the XP balance and rankings, by recorded award date. Spending does not reduce this metric, and the engagement multiplier does not increase it.</p><p><strong>Recorded activity</strong> includes lesson/site events, math warm-up submissions, opening a math practice problem, vocabulary practice and checks, and arcade sessions. Repeated activity on the same date counts once. These are recorded-use signals, not time-on-task or proof of learning. Historical page visits without a saved event cannot be reconstructed.</p><p><strong>Practice tracking</strong> shows actual vocabulary check starts and completions for the assigned students, with word progress from the existing checking system. A student may study the words before starting a check; that is not reported as a completed check.</p></div></details>
    </>}
    <nav aria-label="Other teaching tools" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-sm text-muted-foreground">{[['Classes','/admin/classes'],['Lesson plans','/admin/teacher/plans'],['Review student work','/admin/control-room'],['Vocabulary assignments','/admin/vocabulary/assign'],['Pacing & calendar','/admin/pacing'],['Manage access','/admin/collaborators']].map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center hover:text-foreground hover:underline">{label}</Link>)}</nav>
    {composer && report?.courseId && selectedStudents.length > 0 && <PracticeComposer courseId={report.courseId} students={selectedStudents} onClose={() => setComposer(false)} onAssigned={() => { setComposer(false); setMessage(`Practice assigned to ${selectedStudents.length} ${selectedStudents.length === 1 ? 'student' : 'students'}. It is available on student Home.`); setRevision(n => n + 1); setSelected([]); setTaskId('') }} />}
  </div>
}
