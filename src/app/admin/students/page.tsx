'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, Activity, Gift, Settings, ArrowUpRight } from 'lucide-react'
import { useClassScope } from '@/lib/use-class-scope'
import { useViewAs } from '@/lib/use-view-as'
import { studentsHref, studentsView, teachingHref } from '@/lib/teaching-navigation'
import styles from './students.module.css'
import GradingTermSettings from '@/components/admin/GradingTermSettings'
import { canChangeAssessmentScope } from '@/components/admin/useAssessmentReviewGuard'

const loading = () => <p role="status" className="py-8 text-muted-foreground">Loading student tools…</p>
const RosterManager = dynamic(() => import('@/components/admin/students/RosterManager'), { loading })
const StudentActivity = dynamic(() => import('@/components/admin/students/StudentActivity'), { loading })
const TeacherActivity = dynamic(() => import('@/components/admin/students/TeacherActivity'), { loading })
const ChallengesManager = dynamic(() => import('@/components/admin/students/ChallengesManager'), { loading })
const RewardsManager = dynamic(() => import('@/components/admin/students/RewardsManager'), { loading })
const views = [
  { id: 'roster', label: 'Roster', icon: Users, description: 'Know your students and manage the supports they use.' },
  { id: 'activity', label: 'Activity', icon: Activity, description: 'See participation and practice habits, then choose who needs a follow-up.' },
  { id: 'rewards', label: 'XP & rewards', icon: Gift, description: 'Set challenges, celebrate practice, and manage reward requests.' },
  { id: 'settings', label: 'Class settings', icon: Settings, description: 'Connect your classes, sync rosters, and choose the curriculum each class uses.' },
] as const
type Course = { id: string; name: string; section: string | null }
const label = (course: Course) => [course.name, course.section].filter(Boolean).join(' · ')

function StudentsWorkspace() {
  const params = useSearchParams(), router = useRouter()
  const { role } = useViewAs()
  const { classId: storedClass, ready, setClassScope } = useClassScope()
  const classId = params.has('class') ? params.get('class') ?? '' : storedClass ?? ''
  const view = studentsView(params.get('view'))
  const current = views.find(item => item.id === view)!
  const section = params.get('section') === 'store' ? 'store' : 'challenges'
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoadingClasses(true); setError('')
    fetch('/api/teaching-plans?view=classes', { signal: controller.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw Error(data.error || 'Your classes could not load.')
      setCourses((data.courses ?? []).sort((a: Course, b: Course) => label(a).localeCompare(label(b))))
    }).catch(e => { if (!controller.signal.aborted) setError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoadingClasses(false) })
    return () => controller.abort()
  }, [revision])
  useEffect(() => {
    if (ready && params.has('class')) setClassScope(classId || null, courses.find(c => c.id === classId) ? label(courses.find(c => c.id === classId)!) : null)
  }, [ready, params, classId, courses, setClassScope])
  const selectClass = (id: string) => {
    if (!canChangeAssessmentScope()) return
    setClassScope(id || null, courses.find(c => c.id === id) ? label(courses.find(c => c.id === id)!) : null)
    router.push(studentsHref(view, id, view === 'rewards' ? section : view === 'settings' && params.get('section') === 'grading-terms' ? 'grading-terms' : undefined), { scroll: false })
  }
  const needsClass = view === 'roster' || view === 'activity'
  const unavailableClass = !!classId && !loadingClasses && !error && !courses.some(course => course.id === classId)
  return <div className={styles.page}>
    <header className={styles.header}>
      <div className={styles.top}>
        <div><p className={styles.eyebrow}>Students</p><h1>{current.label}</h1></div>
        <label className={styles.classPicker}>{view === 'rewards' ? 'Class for new challenges' : 'Class'}<select aria-label="Students class" value={classId} disabled={loadingClasses} onChange={event => selectClass(event.target.value)}>
          <option value="">{loadingClasses ? 'Loading classes…' : 'Choose a class'}</option>
          {classId && !courses.some(course => course.id === classId) && <option value={classId}>Selected class</option>}
          {courses.map(course => <option key={course.id} value={course.id}>{label(course)}</option>)}
        </select></label>
        <Link className={styles.teachingLink} href={teachingHref('plan', classId)}>Open Teaching <ArrowUpRight size={17} /></Link>
      </div>
      <p className={styles.description}>{current.description}</p>
      <nav className={styles.mobileNav} aria-label="Students navigation">{views.map(item => <Link key={item.id} href={studentsHref(item.id, classId)} aria-current={view === item.id ? 'page' : undefined}><item.icon size={17} />{item.label}</Link>)}</nav>
      {view === 'rewards' && <nav className={styles.subnav} aria-label="XP and rewards tools"><Link href={studentsHref('rewards', classId, 'challenges')} aria-current={section === 'challenges' ? 'page' : undefined}>XP challenges</Link><Link href={studentsHref('rewards', classId, 'store')} aria-current={section === 'store' ? 'page' : undefined}>Rewards &amp; requests</Link></nav>}
    </header>
    {error && <p role="alert">{error} <button className="underline" onClick={() => setRevision(n => n + 1)}>Retry</button></p>}
    {unavailableClass && <p role="alert">This class is unavailable to your account. Choose another class above.</p>}
    {!ready || loadingClasses ? <p role="status">Loading your class…</p> : !error && !unavailableClass && <>
      {needsClass && !classId ? <div className={styles.empty}><Users size={28} /><h2>Choose a class to see its students</h2><p>Use the class selector above. Your selection carries between Teaching and Students.</p><Link href={studentsHref('settings')}>Connect or sync a class →</Link></div> : <>
        {view === 'roster' && <RosterManager key={classId + view} classId={classId} mode="roster" />}
        {view === 'activity' && (role === 'admin' ? <StudentActivity key={classId + params.get('student')} classId={classId} initialStudentId={params.get('student') ?? ''} /> : <TeacherActivity key={classId + params.get('student')} classId={classId} initialStudentId={params.get('student') ?? ''} />)}
      </>}
      {view === 'rewards' && <><p className={styles.scopeNote}>{section === 'challenges' ? 'The challenge board includes your classes. New challenges start with the class selected above; you can choose additional classes or individual students.' : 'Manage rewards across your classes. Each reward shows which classes can use it; redemption requests keep their existing account-wide scope.'}</p>{section === 'challenges' ? <ChallengesManager key={classId} classId={classId} /> : <RewardsManager />}</>}
      {view === 'settings' && (params.get('section') === 'grading-terms' ? <GradingTermSettings classId={classId || null}/> : <><div className={styles.settingsLinks}><Link href={studentsHref('settings', classId, 'grading-terms')}>Grading terms &amp; assignment placement <ArrowUpRight size={16}/></Link><Link href={teachingHref('pacing', classId)}>Pacing &amp; meeting pattern <ArrowUpRight size={16} /></Link><Link href="/admin/teacher">Teacher setup &amp; XP goals <ArrowUpRight size={16} /></Link></div><p className={styles.scopeNote}>Google Classroom connections and synced classes are managed across your account.</p><RosterManager key={classId + view} classId={classId} mode="settings" /></>)}
    </>}
  </div>
}
export default function StudentsPage() { return <Suspense fallback={loading()}><StudentsWorkspace /></Suspense> }
