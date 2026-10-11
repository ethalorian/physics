'use client'

import Link from 'next/link'
import { BookOpen, ClipboardCheck, GraduationCap, Calculator, Languages, PlayCircle, Table2, CalendarDays, ChevronDown } from 'lucide-react'
import { assessmentCenterHref, type AssessmentView } from '@/lib/assessment-center'
import styles from '@/app/admin/control-room/student-work.module.css'

const views = [
  { id: 'mastery', label: 'Gradebook', icon: Table2, description: 'See class mastery at a glance, then open any student’s evidence.' },
  { id: 'assignments', label: 'Assigned work', icon: CalendarDays, description: 'Manage what this class is working on, when it is due, and when students can access it.' },
  { id: 'lessons', label: 'Lesson inbox', icon: ClipboardCheck, description: 'Review submitted lessons, record mastery, and return feedback without losing your place.' },
  { id: 'quizzes', label: 'Quizzes', icon: GraduationCap, description: 'Review quiz grades, manage assessments, and check what students understand.' },
  { id: 'readings', label: 'Readings', icon: BookOpen, description: 'Review reading responses and manage assignments for this class.' },
  { id: 'vocabulary', label: 'Vocabulary', icon: Languages, description: 'Check vocabulary mastery and review evidence for this unit.' },
  { id: 'math', label: 'Math', icon: Calculator, description: 'Review math skills and warm-up work across this class.' },
  { id: 'videos', label: 'Video progress', icon: PlayCircle, description: 'Check viewing progress across this class’s video lessons.' },
] as const

type Course = { id: string; label: string; teacher: string | null; program: string }
type Unit = { id: string; name: string; program?: string }
interface Props {
  view: AssessmentView; search: string; classId: string | null; classLabel: string | null;
  classes: Course[]; teachers: string[]; teacher: string; onTeacherChange: (id: string) => void;
  unitId: string; units: Unit[]; program: string | null;
  onClassChange: (id: string) => void; onUnitChange: (id: string) => void; onNavigate: () => void;
}

export default function StudentWorkHeader({ view, search, classId, classLabel, classes, teachers, teacher, onTeacherChange, unitId, units, program, onClassChange, onUnitChange, onNavigate }: Props) {
  const current = views.find(item => item.id === view)!
  const usesUnit = view === 'mastery' || view === 'lessons' || view === 'vocabulary'
  const visibleUnits = program ? units.filter(unit => !unit.program || unit.program === program) : units
  const visibleClasses = teacher ? classes.filter(course => course.teacher === teacher) : classes
  const context = new URLSearchParams({ ...(classId ? { class: classId } : {}), ...(unitId !== 'auto' ? { unit: unitId } : {}) })
  return <header className={styles.header}>
    <div className={styles.workspaceTop}><div className={styles.titleRow}>
      <div><p className={styles.eyebrow}>TEACHER WORKSPACE</p><h1>Student work</h1></div>

    </div>
    <div className={styles.scope} aria-label="Student work scope">
      <label>Class<select aria-label="Student work class" value={classId ?? ''} onChange={e => onClassChange(e.target.value)}>
        <option value="">All my classes</option>
        {classId && !visibleClasses.some(course => course.id === classId) && <option value={classId}>{classLabel || 'Selected class'}</option>}
        {visibleClasses.map(course => <option key={course.id} value={course.id}>{course.label}</option>)}
      </select></label>
      {usesUnit && <label>Unit<select aria-label="Assessment unit" value={unitId} onChange={e => onUnitChange(e.target.value)}>
        {!visibleUnits.some(unit => unit.id === unitId) && <option value={unitId}>{unitId === 'auto' ? 'Current unit' : unitId}</option>}
        {visibleUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
      </select></label>}
      {teachers.length > 1 && <label>Teacher<select aria-label="Teacher scope" value={teacher} onChange={e => onTeacherChange(e.target.value)}>
        <option value="">All teachers</option>{teachers.map(email => <option key={email} value={email}>{email.split('@')[0].replace(/[._]/g, ' ')}</option>)}
      </select></label>}
      {!usesUnit && <p>All units</p>}
    </div>
      <details className={styles.tools}><summary>Tools <ChevronDown size={15} /></summary><div>
        <Link href={classId ? `/admin/classes/${encodeURIComponent(classId)}?${context}` : '/admin/classes'}>Open class</Link>
        <Link href={`/admin/observe?${context}`}>Classroom observations</Link>
        <Link href={`/admin/xp-terms?${context}`}>Term XP requirements</Link>
      </div></details>
    </div>
    <nav className={styles.navigation} aria-label="Student work navigation">
      {views.map(({ id, label, icon: Icon }) => <Link key={id} data-quiz-leave data-reading-leave aria-current={view === id ? 'page' : undefined}
        href={assessmentCenterHref(id, null, classId, search)} scroll={false} onClick={onNavigate}>
        <Icon size={17} aria-hidden="true" /><span>{label}</span>
      </Link>)}
    </nav>
    {view !== 'mastery' && view !== 'assignments' && <p className={styles.orientation}>{new URLSearchParams(search).get('fromWork')==='1'&&<><Link href={assessmentCenterHref('assignments',null,classId,search)} className="underline">← Assigned work</Link><span aria-hidden="true"> / </span></>}<strong>{current.label}</strong><span aria-hidden="true"> / </span>{current.description}</p>}
  </header>
}
