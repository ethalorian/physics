'use client'

import Link from 'next/link'
import { CalendarDays, ChevronDown, Table2, ArrowLeft, BookOpen, ListOrdered, MonitorPlay } from 'lucide-react'
import { assessmentCenterHref, type AssessmentView } from '@/lib/assessment-center'
import styles from '@/app/admin/control-room/student-work.module.css'
import { studentLessonHref } from '@/lib/teaching-navigation'
import { canChangeAssessmentScope } from './useAssessmentReviewGuard'

const evidenceViews = [
  ['lessons', 'Classroom & lesson evidence'],
  ['quizzes', 'Quiz tools'], ['readings', 'Reading tools'], ['interactive', 'Interactive assignments'], ['reviews', 'Review insights'],
] as const
const labels: Partial<Record<AssessmentView, string>> = Object.fromEntries(evidenceViews)
type Course = { id: string; label: string; teacher: string | null; program: string }
type Unit = { id: string; name: string; program?: string }
interface Props {
  view: AssessmentView; search: string; classId: string | null; classLabel: string | null;
  classes: Course[]; teachers: string[]; teacher: string; onTeacherChange: (id: string) => void;
  unitId: string; units: Unit[]; program: string | null;
  onClassChange: (id: string) => void; onUnitChange: (id: string) => void; onNavigate: () => void;
}

export default function StudentWorkHeader({ view, search, classId, classLabel, classes, teachers, teacher, onTeacherChange, unitId, units, program, onClassChange, onUnitChange, onNavigate }: Props) {
  const resultsHome = view === 'results' || view === 'mastery'
  const sourceDetail = new URLSearchParams(search).get('fromResults') === '1'
  const plan = ['plan', 'choices', 'guide', 'access', 'tasks'].includes(view)
  const calendar = ['calendar', 'assignments', 'pacing'].includes(view)
  const planning = plan || calendar
  const live = view === 'live'
  const usesUnit = ['plan', 'choices', 'guide', 'calendar', 'live', 'results', 'mastery', 'lessons', 'vocabulary'].includes(view) || sourceDetail
  const visibleUnits = program ? units.filter(unit => !unit.program || unit.program === program) : units
  const visibleClasses = teacher ? classes.filter(course => course.teacher === teacher) : classes
  const context = new URLSearchParams({ ...(classId ? { class: classId } : {}), ...(unitId !== 'auto' ? { unit: unitId } : {}) })
  const href = (destination: AssessmentView) => assessmentCenterHref(destination, null, classId, search)
  return <header className={styles.header}>
    <div className={styles.workspaceTop}>
      <div className={styles.titleRow}><div><p className={styles.eyebrow}>TEACHING</p><h1>{plan ? 'Plan' : calendar ? 'Calendar' : live ? 'Live classroom' : 'Results'}</h1></div></div>
      <div className={styles.scope} aria-label="Teaching scope">
        <label>Class<select aria-label="Teaching class" value={classId ?? ''} onChange={e => { if (canChangeAssessmentScope()) onClassChange(e.target.value) }}>
          <option value="">{planning || live || view === 'results' || view === 'interactive' || view === 'reviews' ? 'Choose a class' : 'All my classes'}</option>
          {classId && !visibleClasses.some(course => course.id === classId) && <option value={classId}>{classLabel || 'Selected class'}</option>}
          {visibleClasses.map(course => <option key={course.id} value={course.id}>{course.label}</option>)}
        </select></label>
        {usesUnit && <label>Unit<select aria-label="Assessment unit" value={unitId} onChange={e => { if (canChangeAssessmentScope()) onUnitChange(e.target.value) }}>
          {view === 'results' && <><option value="all">All units</option><option value="unmapped">Unit mapping needed</option></>}
          {!visibleUnits.some(unit => unit.id === unitId) && !(view === 'results' && ['all', 'unmapped'].includes(unitId)) && <option value={unitId}>{unitId === 'auto' ? 'Current unit' : unitId}</option>}
          {visibleUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
        </select></label>}
        {teachers.length > 1 && <label>Teacher<select aria-label="Teacher scope" value={teacher} onChange={e => { if (canChangeAssessmentScope()) onTeacherChange(e.target.value) }}>
          <option value="">All teachers</option>{teachers.map(email => <option key={email} value={email}>{email.split('@')[0].replace(/[._]/g, ' ')}</option>)}
        </select></label>}
        {!usesUnit && <p>All units</p>}
      </div>
      <details className={styles.tools}><summary>Tools <ChevronDown size={15} /></summary><div>
        <Link href={href('guide')}><BookOpen size={15} /> Course guide</Link>
        <Link href={`/admin/quizzes?${context}`}>Create or manage quizzes</Link>
        <Link href={`/admin/readings?view=syllabus&course_id=${classId ?? ''}`}>Reading plans & linked activities</Link>
        <Link href={`/admin/interactive-assignments?${context}`}>Interactive assignment settings</Link>
        <Link href={`/admin/review-modules?${context}`}>Review assignment settings</Link>
        <Link href={`/admin/students?view=roster&class=${classId ?? ''}`}>Student roster</Link>
        <Link href={href('live')}>Live classroom tools</Link>
        <Link href={`/admin/xp-terms?${context}`}>Term XP requirements</Link>
      </div></details>
    </div>
    <nav className={styles.navigation} aria-label="Teaching navigation">
      <Link data-quiz-leave data-reading-leave href={href('plan')} aria-current={plan ? 'page' : undefined} scroll={false} onClick={onNavigate}><ListOrdered size={17} /> Plan</Link>
      <Link data-quiz-leave data-reading-leave href={href('calendar')} aria-current={calendar ? 'page' : undefined} scroll={false} onClick={onNavigate}><CalendarDays size={17} /> Calendar</Link>
      <Link data-quiz-leave data-reading-leave href={href('live')} aria-current={live ? 'page' : undefined} scroll={false} onClick={onNavigate}><MonitorPlay size={17} /> Live classroom</Link>
      <Link data-quiz-leave data-reading-leave href={href('results')} aria-current={!planning && !live && view !== 'assignments' ? 'page' : undefined} scroll={false} onClick={onNavigate}><Table2 size={17} /> Results</Link>
    </nav>
    {(plan) && <nav className={styles.planNavigation} aria-label="Plan view"><Link href={href('plan')} aria-current={view === 'plan' ? 'page' : undefined} onClick={onNavigate}>Unit sequence</Link>{(program === 'physics' || view === 'choices') && <Link href={href('choices')} aria-current={view === 'choices' ? 'page' : undefined} onClick={onNavigate}>Student choice</Link>}<Link href={href('guide')} aria-current={view === 'guide' ? 'page' : undefined} onClick={onNavigate}><BookOpen size={16} /> Course guide</Link><Link href={href('access')} aria-current={view === 'access' ? 'page' : undefined} onClick={onNavigate}>Student access</Link><Link href={href('tasks')} aria-current={view === 'tasks' ? 'page' : undefined} onClick={onNavigate}>Vocabulary tasks</Link></nav>}
    {calendar && <nav className={styles.planNavigation} aria-label="Calendar view"><Link href={href('calendar')} aria-current={view === 'calendar' ? 'page' : undefined}>Teaching schedule</Link><Link href={href('pacing')} aria-current={view === 'pacing' ? 'page' : undefined}>Pacing &amp; meeting pattern</Link><Link href={href('assignments')} aria-current={view === 'assignments' ? 'page' : undefined}>Assigned work &amp; deadlines</Link></nav>}
    {!planning && !live && view !== 'assignments' && <div className={styles.resultsNavigation}>
      {resultsHome ? <nav aria-label="Results view"><Link data-quiz-leave data-reading-leave href={href('results')} aria-current={view === 'results' ? 'page' : undefined} scroll={false} onClick={onNavigate}>Gradebook</Link><Link data-quiz-leave data-reading-leave href={href('mastery')} aria-current={view === 'mastery' ? 'page' : undefined} scroll={false} onClick={onNavigate}>Mastery</Link></nav> : <div className={styles.resultsTrail}><Link data-quiz-leave data-reading-leave href={href('results')} scroll={false} onClick={onNavigate}><ArrowLeft size={15} /> Gradebook</Link><span>{labels[view]}</span><Link data-quiz-leave data-reading-leave href={href('mastery')} scroll={false} onClick={onNavigate}>Mastery</Link></div>}
      <div className="flex flex-wrap items-center gap-3">{classId && <Link className="inline-flex min-h-11 items-center text-sm text-primary" href={studentLessonHref(classId, new URLSearchParams(search).get('resultStudent') ?? '', '', unitId)}>View student lesson</Link>}<details className={styles.tools}><summary>Activity tools <ChevronDown size={15} /></summary><div>{evidenceViews.map(([id, label]) => <Link key={id} data-quiz-leave data-reading-leave href={href(id)} scroll={false} onClick={onNavigate}>{label}</Link>)}</div></details></div>
    </div>}
  </header>
}
