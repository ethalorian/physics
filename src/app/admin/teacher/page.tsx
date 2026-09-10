"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, Check, Compass, Eye, GraduationCap, MonitorPlay, Settings2, ClipboardCheck, Gift, DoorOpen } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import XpGoalSettings from '@/components/admin/XpGoalSettings'
import { setStudentView } from '@/lib/view-as-shared'
import styles from './teacher.module.css'

type StepKey = 'classroom' | 'curriculum' | 'pacing' | 'tour'
interface Status { steps: Record<StepKey, boolean>; doneCount: number; total: number; complete: boolean }
interface Course { id: string; name: string; section: string | null; track: string | null; program?: string | null }
const TYPES = [
  { id: 'cpa', label: 'CPA Physics', description: 'Core concepts, investigations, and practice.', track: 'cpa', program: 'physics' },
  { id: 'honors', label: 'Honors Physics', description: 'The core curriculum with deeper quantitative work.', track: 'honors', program: 'physics' },
  { id: 'trades', label: 'Trades Physics', description: 'Measurement, structures, energy, and practical applications.', track: 'cpa', program: 'trades' },
  { id: 'projects', label: 'Project Physics', description: 'Build-based learning with bilingual project packets.', track: 'cpa', program: 'projects' },
]
const TOUR = [
  { title: 'Start with your class.', body: 'Open a class to find its roster, lesson access, and student progress. Your workspace brings together the classes you imported from Google Classroom.', href: '/admin/classes', link: 'Explore your classes', Icon: GraduationCap },
  { title: 'A plan you can teach from.', body: 'Lesson plans organize each unit day by day. Use Pacing to place lessons on your calendar, then choose which lessons students can open.', href: '/admin/teacher/plans', link: 'Browse lesson plans', Icon: BookOpen },
  { title: 'Keep your attention in the room.', body: 'The iPad Command Center runs your projected lesson, polls, and timers. Classroom observations lets you record feedback and mastery evidence as you walk.', href: '/admin/command-center', link: 'Open Command Center', Icon: MonitorPlay },
  { title: 'Evidence for your next decision.', body: 'The Control Room brings student work and mastery ratings together. Use that evidence to decide what to revisit and whom to support. Final grades remain your professional judgment.', href: '/admin/control-room', link: 'Open Control Room', Icon: ClipboardCheck },
]
const SETUP: { key: StepKey; title: string; body: string; href?: string }[] = [
  { key: 'classroom', title: 'Bring in your classes', body: 'Connect Google Classroom and import a roster.', href: '/admin/roster' },
  { key: 'curriculum', title: 'Choose a curriculum', body: 'Match each class to the course you teach.' },
  { key: 'pacing', title: 'Make the calendar yours', body: 'Set your rotation and lesson schedule.', href: '/admin/pacing' },
  { key: 'tour', title: 'Find your way around', body: 'A short introduction to your teaching tools.' },
]
function typeFor(course: Course) {
  return TYPES.find(type => type.program === (course.program ?? 'physics') && type.track === course.track)
}
async function request<T>(url: string, body?: object): Promise<T> {
  const response = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined)
  const data = await response.json()
  if (!response.ok || data.error) throw new Error(data.error || 'The request could not be completed. Please try again.')
  return data as T
}

export default function TeacherDashboard() {
  const [status, setStatus] = useState<Status | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [dialog, setDialog] = useState<'types' | 'tour' | 'goals' | null>(null)
  const [tourIndex, setTourIndex] = useState(0)
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [nextStatus, nextCourses] = await Promise.all([request<Status>('/api/teacher/onboarding'), request<{ courses: Course[] }>('/api/teacher/courses')])
      setStatus(nextStatus); setCourses(nextCourses.courses)
    } catch (e) { setError(e instanceof Error ? e.message : 'Your workspace could not load.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const openDialog = (value: 'types' | 'tour' | 'goals') => { setSaveError(''); setNotice(''); setTourIndex(0); setDialog(value) }
  const save = async (url: string, body: object, message: string, close = false) => {
    setSaving(true); setSaveError(''); setNotice('')
    try {
      await request(url, body)
      setNotice(message)
      if (close) setDialog(null)
      await load()
    } catch (e) { setSaveError(e instanceof Error ? e.message : 'Your changes could not be saved.') }
    finally { setSaving(false) }
  }
  const ready = !loading && !error && status
  const tour = TOUR[tourIndex]
  const TourIcon = tour.Icon

  return (
    <div className={styles.workspace}>
      <header className={styles.heading}>
        <div><p className={styles.eyebrow}>Antocci Physics / Teacher workspace</p><h1>A good day to teach.</h1><p>Your classes, your next lesson, and the evidence that moves learning forward.</p></div>
        <button className={styles.quietButton} onClick={() => openDialog('tour')}><Compass size={17} /> Quick tour</button>
      </header>

      <section className={styles.hero} aria-labelledby="lesson-heading">
        <div className={styles.heroCopy}><p className={styles.eyebrow}>From preparation to participation</p><h2 id="lesson-heading">Bring physics<br />into the room.</h2><p>Start with a lesson plan. Make space for investigation, conversation, and the moment an idea clicks.</p><Link className={styles.primaryButton} href="/admin/teacher/plans">Find your next lesson <ArrowRight size={17} /></Link></div>
        <div className={styles.lessonPath} aria-label="Teaching workflow">
          <span className={styles.pathLabel}>Your teaching rhythm</span>
          {[{ number: '01', title: 'Prepare with purpose', body: 'Day-by-day plans, ready to make your own.', Icon: BookOpen }, { number: '02', title: 'Make thinking visible', body: 'Live questions, investigations, and discussion.', Icon: MonitorPlay }, { number: '03', title: 'Know what comes next', body: 'Student work and observations in one place.', Icon: ClipboardCheck }].map(({ number, title, body, Icon }) => <div className={styles.pathStep} key={number}><span>{number}</span><div><h3><Icon size={17} />{title}</h3><p>{body}</p></div></div>)}
        </div>
      </section>

      {error && <div role="alert" className={styles.error}><div><strong>We couldn’t load your workspace.</strong><p>{error}</p></div><button className={styles.quietButton} onClick={() => void load()}>Try again</button></div>}
      {notice && <p role="status" className={styles.notice}><Check size={16} />{notice}</p>}
      {!dialog && saveError && <p role="alert" className={styles.error}>{saveError}</p>}

      <div className={styles.workspaceGrid}>
        <section className={styles.classes} aria-labelledby="classes-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Your starting point</p><h2 id="classes-heading">Your classes{ready && courses.length > 0 && <span className={styles.count}>{courses.length}</span>}</h2></div><Link className={styles.textLink} href="/admin/roster">Manage classes <ArrowRight size={15} /></Link></div>
          {loading ? <div className={styles.empty} role="status">Loading your classes…</div> : error ? <div className={styles.empty}>Your classes will appear when the connection is restored.</div> : courses.length === 0 ? <div className={styles.empty}><GraduationCap size={32} /><h3>One class is all you need to begin.</h3><p>Import a Google Classroom roster, choose its curriculum, and start planning for your students.</p><Link className={styles.darkButton} href="/admin/roster">Connect Google Classroom <ArrowRight size={16} /></Link><small>You can explore lesson plans before connecting.</small></div> : <div className={styles.classList}>{courses.map((course, i) => <Link className={styles.classRow} key={course.id} href={`/admin/classes/${course.id}`}><span className={styles.classNumber}>{String(i + 1).padStart(2, '0')}</span><div><h3>{course.name}</h3><p>{course.section ? `${course.section} · ` : ''}{typeFor(course)?.label ?? (course.track === 'ap' ? 'AP Physics' : 'Choose a curriculum')}</p></div><ArrowRight size={18} /></Link>)}</div>}
        </section>

        <aside className={styles.setup} aria-labelledby="setup-heading"><div className={styles.sectionHeading}><h2 id="setup-heading">{ready && status.complete ? 'Make it yours' : 'A confident start'}</h2><Settings2 size={18} /></div>
          {loading ? <p role="status">Checking your setup…</p> : error ? <p>Setup status is unavailable. Try loading the workspace again.</p> : status && <><p>{status.complete ? 'Your setup is complete. Adjust it whenever your classes change.' : `${status.doneCount} of ${status.total} setup steps complete`}</p><progress aria-label="Setup progress" max={status.total} value={status.doneCount} />
            <ol className={styles.setupList}>{SETUP.map((step, i) => { const done = status.steps[step.key]; const needsClass = step.key === 'curriculum' && courses.length === 0; return <li key={step.key}><span className={done ? styles.stepDone : styles.stepNumber}>{done ? <Check size={14} aria-label="Complete" /> : i + 1}</span><div>{step.href ? <Link href={step.href}>{step.title}<ArrowRight size={13} /></Link> : <button disabled={needsClass} onClick={() => openDialog(step.key === 'tour' ? 'tour' : 'types')}>{step.title}<ArrowRight size={13} /></button>}<p>{needsClass ? 'Import a class first to choose its curriculum.' : step.body}</p>{step.key === 'pacing' && !done && <button className={styles.confirmPacing} disabled={saving} onClick={() => void save('/api/teacher/onboarding', { step: 'pacing', done: true }, 'Calendar setup marked complete.')}>{saving ? 'Saving…' : 'I’ve set my calendar'}</button>}</div></li> })}</ol></>}
        </aside>
      </div>

      <section aria-labelledby="workflow-heading"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Built around your day</p><h2 id="workflow-heading">Prepare. Teach. Understand.</h2></div></div>
        <div className={styles.workflows}>
          <article className={styles.workflow}><span className={styles.workflowIcon}><CalendarDays size={23} /></span><h3>Before the bell</h3><p>Know where you’re headed and give students a clear place to begin.</p><Link href="/admin/teacher/plans">Lesson plans <ArrowRight size={16} /></Link><Link href="/admin/pacing">Pacing & calendar <ArrowRight size={16} /></Link><Link href="/admin/lesson-access">Open lessons for a class <DoorOpen size={16} /></Link></article>
          <article className={styles.workflow}><span className={styles.workflowIcon}><MonitorPlay size={23} /></span><h3>In the classroom</h3><p>Lead the lesson, listen to students, and capture thinking as it happens.</p><Link href="/admin/command-center">iPad Command Center <ArrowRight size={16} /></Link><Link href="/admin/observe">Classroom observations <ArrowRight size={16} /></Link><Link href="/admin/lobby">Group activities <ArrowRight size={16} /></Link></article>
          <article className={styles.workflow}><span className={styles.workflowIcon}><ClipboardCheck size={23} /></span><h3>See the learning</h3><p>Look at the evidence. Find the next question, conversation, or small-group lesson.</p><Link href="/admin/control-room">Review student work <ArrowRight size={16} /></Link><Link href="/admin/classes">Class progress <ArrowRight size={16} /></Link><Link href="/admin/vocabulary/tasks">Vocabulary practice <ArrowRight size={16} /></Link></article>
        </div>
      </section>
      <footer className={styles.footer}><div><h2>The details that support your day.</h2><p>Fine-tune motivation or take a look from the student’s side.</p></div><div className={styles.footerActions}><button onClick={() => openDialog('goals')}><Settings2 size={16} /> XP goals</button><Link href="/admin/store"><Gift size={16} /> Rewards</Link><button onClick={() => { setStudentView(); window.location.assign('/home') }}><Eye size={16} /> Preview student view</button></div></footer>

      <Dialog open={dialog !== null} onOpenChange={open => { if (!open && !saving) setDialog(null) }}><DialogContent className={styles.dialog}>
        <DialogTitle>{dialog === 'types' ? 'Choose each class’s curriculum' : dialog === 'goals' ? 'Daily XP goals' : 'Your teaching workspace'}</DialogTitle>
        <DialogDescription>{dialog === 'types' ? 'Changes apply to the selected class. Choose the curriculum that matches what you teach.' : dialog === 'goals' ? 'Set goals and bonuses for your students.' : `Quick tour · ${tourIndex + 1} of ${TOUR.length}`}</DialogDescription>
        {saveError && <p role="alert" className={styles.error}>{saveError}</p>}
        {notice && dialog === 'types' && <p role="status" className={styles.notice}>{notice}</p>}
        {dialog === 'types' && <div className={styles.typeList}>{courses.length === 0 ? <Link href="/admin/roster">Connect Google Classroom to import your first class.</Link> : courses.map(course => <label key={course.id}><strong>{course.name}{course.section ? ` · ${course.section}` : ''}</strong><select disabled={saving} value={typeFor(course)?.id ?? ''} onChange={event => { const type = TYPES.find(item => item.id === event.target.value); if (type) void save('/api/teacher/courses', { course_id: course.id, track: type.track, program: type.program }, `Curriculum saved for ${course.name}.`) }}><option value="" disabled>Choose a curriculum</option>{TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select><small>{typeFor(course)?.description ?? 'Choose the course this class will follow.'}</small></label>)}</div>}
        {dialog === 'tour' && <div className={styles.tour}><TourIcon size={36} /><h3>{tour.title}</h3><p>{tour.body}</p><Link className={styles.textLink} href={tour.href}>{tour.link}<ArrowRight size={15} /></Link><div className={styles.tourActions}><button className={styles.quietButton} disabled={tourIndex === 0 || saving} onClick={() => setTourIndex(i => i - 1)}>Back</button>{tourIndex < TOUR.length - 1 ? <button className={styles.darkButton} onClick={() => setTourIndex(i => i + 1)}>Next <ArrowRight size={15} /></button> : <button className={styles.darkButton} disabled={saving} onClick={() => void save('/api/teacher/onboarding', { step: 'tour', done: true }, 'Tour complete. Your workspace is ready to explore.', true)}>{saving ? 'Saving…' : 'Finish tour'}<Check size={15} /></button>}</div></div>}
        {dialog === 'goals' && <XpGoalSettings />}
      </DialogContent></Dialog>
    </div>
  )
}
