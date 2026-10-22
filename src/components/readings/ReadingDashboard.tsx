'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, ClipboardCheck, Layers3, ListTree, GitBranch, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import type { ReadingList } from '@/lib/textbook-assignments'
import type { QuizList } from '@/lib/quizzes/types'
import { nextSyllabusStep, SYLLABUS_UNITS, type SyllabusCatalog } from '@/lib/reading-syllabus'
import { readingDashboardGroups, readingDashboardHref, readingResourceStatus, type ReadingDashboardGroup, type ReadingDashboardResource, type ReadingDashboardView } from '@/lib/reading-dashboard'
import { dueLabel, readingFetch } from './ReadingShared'
import ReadingAssignmentManager from './ReadingAssignmentManager'
import styles from './ReadingDashboard.module.css'

const ReadingPlanner = dynamic(() => import('./ReadingPlanner'), { loading: () => <Spinner /> })
const ReadingMindMap = dynamic(() => import('./ReadingMindMap'), { loading: () => <Spinner /> })
const ReadingSyllabus = dynamic(() => import('./ReadingSyllabus'), { loading: () => <Spinner /> })
const TeacherReadings = dynamic(() => import('./TeacherReadings'), { loading: () => <Spinner /> })
const QuizTeacher = dynamic(() => import('@/components/quizzes/QuizTeacher'), { loading: () => <Spinner /> })
const VocabularyTask = dynamic(() => import('@/components/vocabulary/VocabLearningBoard'), { loading: () => <Spinner /> })
const views = [
  ['overview', 'Overview', Layers3], ['syllabus', 'Syllabus & sequence', ListTree], ['map', 'Mind map', GitBranch],
  ['assignments', 'Assignments', BookOpen], ['review', 'Review queue', ClipboardCheck], ['textbooks', 'Textbooks', BookOpen],
] as const
type DashboardSyllabus = SyllabusCatalog & { staff?: boolean }
type Source = 'syllabus' | 'readings' | 'quizzes'
const resourceDue = (resource: ReadingDashboardResource) => resource.due_at ?? (resource.due_on ? `${resource.due_on}T23:59:59` : null)
const resourceDueLabel = (resource: ReadingDashboardResource) => resource.due_on ? `Due ${new Date(`${resource.due_on}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : dueLabel(resource.due_at ?? null)
const sourceLabels: Record<Source, string> = { syllabus: 'Syllabus', readings: 'Readings', quizzes: 'Quiz review counts' }

export default function ReadingDashboard({ initialView = 'assignments' }: { initialView?: ReadingDashboardView }) {
  const params = useSearchParams(), router = useRouter(), query = params.toString()
  const requestedView = params.get('view')
  const view: ReadingDashboardView = views.some(([id]) => id === requestedView) ? requestedView as ReadingDashboardView : initialView
  const [syllabus, setSyllabus] = useState<DashboardSyllabus | null>(null)
  const [readings, setReadings] = useState<ReadingList | null>(null)
  const [quizzes, setQuizzes] = useState<QuizList | null>(null)
  const [errors, setErrors] = useState<Partial<Record<Source, string>>>({})
  const [loading, setLoading] = useState(true), [revision, setRevision] = useState(0), [updated, setUpdated] = useState<Date | null>(null)
  const [assignmentFilter, setAssignmentFilter] = useState<'published' | 'draft' | 'archived' | 'all'>('published')
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const fetchSource = async <T,>(source: Source, url: string, save: (data: T | null) => void) => {
      try {
        const data = await readingFetch<T>(url, { signal: controller.signal })
        if (!controller.signal.aborted) { save(data); setErrors(current => ({ ...current, [source]: undefined })) }
      } catch (error) {
        if (!controller.signal.aborted) { save(null); setErrors(current => ({ ...current, [source]: (error as Error).message })) }
      }
    }
    void Promise.all([
      fetchSource('syllabus', '/api/reading-syllabus', setSyllabus),
      fetchSource('readings', '/api/readings', setReadings),
      fetchSource('quizzes', '/api/quizzes', setQuizzes),
    ]).then(() => { if (!controller.signal.aborted) { setLoading(false); setUpdated(new Date()) } })
    return () => controller.abort()
  }, [query, revision])
  useEffect(() => {
    const focus = () => refresh()
    window.addEventListener('focus', focus)
    return () => window.removeEventListener('focus', focus)
  }, [refresh])

  const courses = [...new Map([...(readings?.courses ?? []), ...(syllabus?.courses ?? [])].map(course => [course.id, course])).values()]
  const groups = readingDashboardGroups(syllabus, readings, quizzes)
  const resourceKind = params.get('resource'), resourceId = params.get('task_id') ?? params.get('id')
  const creating = !resourceId && !params.get('lesson_id') && (params.get('create') === '1' || params.has('ch'))
  const detail = !!resourceId || params.get('create') === '1' || !!params.get('lesson_id') || !!params.get('ch')
  const currentGroup = groups.find(group => group.resources.some(resource => resource.id === resourceId))
  const courseId = currentGroup?.courseId ?? params.get('course_id') ?? (view === 'syllabus' || creating ? syllabus?.courses[0]?.id ?? '' : '')
  const scoped = groups.filter(group => !courseId || group.courseId === courseId)
  const resources = scoped.flatMap(group => group.resources.map(resource => ({ group, resource })))
  const pending = resources.filter(({ resource }) => (resource.pending ?? 0) > 0)
  const pendingCount = pending.reduce((total, { resource }) => total + (resource.pending ?? 0), 0)
  const drafts = resources.filter(({ resource }) => resource.status === 'draft')
  const assigned = scoped.filter(group => group.resources[0]?.status === 'published').length
  const upcoming = resources.filter(({ resource }) => resource.status === 'published' && resourceDue(resource) && new Date(resourceDue(resource)!).getTime() >= Date.now())
    .sort((a, b) => Date.parse(resourceDue(a.resource)!) - Date.parse(resourceDue(b.resource)!)).slice(0, 6)
  const className = (id: string) => { const item = courses.find(c => c.id === id); return item ? `${item.name}${item.section ? ` · ${item.section}` : ''}` : 'Class unavailable' }
  const href = (nextView: ReadingDashboardView, overrides: Parameters<typeof readingDashboardHref>[0] = {}) => readingDashboardHref({ view: nextView, courseId, ...overrides })
  const resourceHref = (group: ReadingDashboardGroup, resource: ReadingDashboardResource) => readingDashboardHref({ view: 'assignments', courseId: group.courseId, stepId: group.step?.id, resource: resource.kind, id: resource.id })
  const backHref = href('assignments')
  const resourceCards = (group: ReadingDashboardGroup, compact = false) => <div className={styles.resources} data-compact={compact}>
    {group.resources.map(resource => !resource.id ? <div key={resource.kind} className={styles.resource}><span className="text-caption text-muted-foreground">{resource.label}</span><strong>Unavailable</strong><span className="text-caption text-muted-foreground">This assignment is no longer available.</span></div> : <Link key={resource.kind} href={resourceHref(group, resource)} aria-current={resource.id === resourceId ? 'page' : undefined} className={styles.resource}>
      <span className="text-caption text-muted-foreground">{resource.label}</span>
      <strong>{readingResourceStatus(resource)}</strong>
      {!compact && <span className="text-caption text-muted-foreground">{resourceDue(resource) ? resourceDueLabel(resource) : resource.status === 'draft' ? 'Review before assigning' : 'No due date'}</span>}
      {(resource.pending ?? 0) > 0 && <span className={styles.reviewBadge}>{resource.pending} to review</span>}
      <span className={styles.open}>Open <ArrowRight size={15} aria-hidden="true" /></span>
    </Link>)}
  </div>
  if (readings?.staff === false || syllabus?.staff === false || quizzes?.staff === false) return <Card className="p-6">This dashboard is for teachers. <Link className="underline" href="/readings">Open your reading assignments</Link></Card>

  return <div className={styles.dashboard} data-planning={view === 'syllabus' && !detail && !params.has('step_id') && params.get('details') !== '1'}>
    <header className={styles.header}>
      <div><p className="text-overline text-primary">Teaching workspace</p><h1 className="text-display mt-2">Reading assignments</h1><p className="text-muted-foreground mt-2">Manage what your students need to do and when it is due.</p></div>
      <Button asChild><Link href={href('assignments', { resource: 'reading', create: true })}><Plus size={18} />Add reading</Link></Button>
    </header>
    <div className={styles.scope}>
      <label className={styles.field}>Class<select aria-label="Class" value={courseId} disabled={detail && !creating} onChange={event => router.push(readingDashboardHref({ view, courseId: event.target.value, ...(creating ? { create: true, resource: 'reading', stepId: params.get('step_id') ?? undefined } : {}) }))}>
        <option value="" disabled={creating}>{view === 'syllabus' || creating ? 'Choose a class' : 'All my classes'}</option>{courses.filter(item => !creating || syllabus?.courses.some(available => available.id === item.id)).map(item => <option key={item.id} value={item.id}>{className(item.id)}</option>)}
      </select></label>
      <div className={styles.sync}><span className="text-caption text-muted-foreground">{detail && !creating ? 'Class follows this assignment' : updated ? `Updated ${updated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Loading your workspace'}</span><Button variant="ghost" disabled={loading} onClick={refresh} aria-label="Refresh reading dashboard">{loading ? <Spinner size="sm" /> : <RefreshCw size={16} />}</Button></div>
    </div>
    <nav className={styles.tabs} aria-label="Reading dashboard views">{views.filter(([id]) => ['assignments', 'review', 'syllabus'].includes(id)).sort((a, b) => ['assignments', 'review', 'syllabus'].indexOf(a[0]) - ['assignments', 'review', 'syllabus'].indexOf(b[0])).map(([id, label, Icon]) => <Link key={id} href={href(id)} aria-current={(detail ? 'assignments' : view) === id ? 'page' : undefined}><Icon size={18} aria-hidden="true" />{id === 'syllabus' ? 'Plan readings' : id === 'review' ? 'Review work' : label}{id === 'review' && pendingCount > 0 && <span>{pendingCount}</span>}</Link>)}<details className={styles.moreViews} key={view}><summary>{['overview', 'map', 'textbooks'].includes(view) && !detail ? views.find(([id]) => id === view)?.[1] : 'More tools'}</summary><div>{views.filter(([id]) => ['overview', 'map', 'textbooks'].includes(id)).map(([id, label]) => <Link key={id} href={href(id)} aria-current={!detail && view === id ? 'page' : undefined}>{label}</Link>)}</div></details></nav>
    {Object.entries(errors).filter(([, error]) => error).map(([source, error]) => <div key={source} className={styles.error} role="alert"><p><strong>{sourceLabels[source as Source]} unavailable.</strong> {error}</p><Button variant="outline" onClick={refresh}>Retry</Button></div>)}
    {syllabus?.readOnly && <p className={styles.notice}>You are viewing another account. Return to your own account to assign or review work.</p>}
    {!updated && loading ? <Spinner /> : detail ? <section className={styles.detail} aria-label="Assignment workspace">
      <Button asChild variant="ghost" className="self-start"><Link href={backHref}><ArrowLeft size={17} />Back to assignments</Link></Button>
      {currentGroup && <div className={styles.connection}><div className={styles.row}><div><p className="text-overline text-primary">{currentGroup.step ? `Connected sequence · ${className(currentGroup.courseId)}` : className(currentGroup.courseId)}</p><h2 className="text-title-2 mt-1">{currentGroup.title}</h2></div>{currentGroup.step && <div className={styles.actions}>{!currentGroup.step.sourceBook && <Button asChild variant="outline"><Link href={href('map', { courseId: currentGroup.courseId, stepId: currentGroup.step.id })}>View connections</Link></Button>}<Button asChild variant="outline"><Link href={href('syllabus', { courseId: currentGroup.courseId, stepId: currentGroup.step.id })}>View syllabus step</Link></Button></div>}</div>{resourceCards(currentGroup, true)}</div>}
      {creating ? syllabus && <ReadingSyllabus key={courseId} embedded creating courseId={courseId} onChanged={refresh} /> : resourceKind === 'practice' && resourceId ? syllabus?.readOnly ? <p>Return to your own account to manage vocabulary practice.</p> : <VocabularyTask key={resourceId} focusedTaskId={resourceId} /> : (resourceKind === 'readingQuiz' || resourceKind === 'vocabularyQuiz') && resourceId ? <QuizTeacher key={resourceId} classId={courseId} dashboardHref={(id, destination) => id ? readingDashboardHref({ view: 'assignments', courseId: destination || courseId, resource: resourceKind, id }) : backHref} /> : <TeacherReadings onChanged={refresh} key={resourceId ?? query} classId={courseId} dashboardHref={id => id ? href('assignments', { resource: 'reading', id }) : backHref} />}
    </section> : view === 'map' ? syllabus && <ReadingMindMap key={courseId} syllabus={syllabus} groups={groups} courseId={courseId} /> : view === 'syllabus' ? <section aria-label="Syllabus workspace">{syllabus && (courseId && syllabus.courses.some(c => c.id === courseId) ? params.has('step_id') || params.get('details') === '1' ? <div className={styles.section}><Button asChild variant="outline" className="self-start"><Link href={href('syllabus')}><CalendarDays size={17} />Back to reading calendar</Link></Button><ReadingSyllabus embedded courseId={courseId} onChanged={refresh} /></div> : readings && <ReadingPlanner key={courseId} courseId={courseId} syllabus={syllabus} readings={readings.assignments} readOnly={syllabus.readOnly} onChanged={refresh} /> : <Card className="p-6 gap-3"><h2 className="text-title-2">Choose a Physics class</h2><p className="text-muted-foreground">Each class has its own release schedule, with a shared foundation for CPA and Honors.</p>{syllabus.courses.map(item => <Button key={item.id} asChild variant="outline"><Link href={href('syllabus', { courseId: item.id })}>{className(item.id)}</Link></Button>)}{!syllabus.courses.length && <Link href="/admin/classes" className="underline">Connect a Physics class</Link>}</Card>)}</section> : view === 'assignments' ? <ReadingAssignmentManager key={courseId} courseId={courseId} groups={scoped} readings={readings?.assignments ?? []} className={className} readOnly={!!syllabus?.readOnly || !!quizzes?.readOnly} loading={loading} initialFilter={assignmentFilter} onFilterChange={setAssignmentFilter} onChanged={refresh} /> : view === 'review' ? <section className={styles.section} aria-label="Reading review queue"><div><h2 className="text-title-1">Ready for your review</h2><p className="text-muted-foreground">Submitted reading responses and connected quizzes, grouped by assignment.</p></div>{pending.map(({ group, resource }) => <Card key={resource.id} className={styles.queueItem}><div><p className="text-caption text-muted-foreground">{className(group.courseId)} · {resource.label}</p><h3 className="text-title-3">{group.title}</h3></div><div className={styles.actions}><span className={styles.reviewBadge}>{resource.pending} submitted</span><Button asChild><Link href={resourceHref(group, resource)}>Review {resource.label.toLowerCase()} <ArrowRight size={16} /></Link></Button></div></Card>)}{!pending.length && !errors.readings && !errors.quizzes && !errors.syllabus && <Card className="p-6 gap-2"><h3 className="text-title-3">No submissions waiting for review</h3><p className="text-muted-foreground">New reading and quiz submissions will appear here. Open vocabulary practice from Assignments to inspect word progress.</p></Card>}</section> : view === 'textbooks' ? <section className={styles.section}><div><h2 className="text-title-1">Course textbooks</h2><p className="text-muted-foreground">Both readers connect back to this dashboard and the same teaching sequence.</p></div><div className={styles.twoColumns}>{[
      { title: 'Conceptual Physics', author: 'Hewitt', label: 'Shared foundation & CPA', description: 'Concepts, examples, and chapter readings for building physical intuition.', url: '/textbook/interactive/hewitt/2', book: 'hewitt' as const, pdf: '/textbook' },
      { title: 'College Physics for AP® Courses 2e', author: 'OpenStax', label: 'Honors', description: 'A comprehensive text with mathematical models, worked examples, and AP extensions.', url: '/textbook/interactive/openstax/1', book: 'openstax' as const, pdf: '/textbook/honors' },
    ].map(book => <Card key={book.url} className={styles.book}><BookOpen size={32} className="text-primary" aria-hidden="true" /><p className="text-overline text-primary">{book.label}</p><h3 className="text-title-1">{book.title}</h3><p className="font-semibold">{book.author}</p><p className="text-muted-foreground">{book.description}</p><Button asChild><Link href={book.url} target="_blank">Open interactive textbook <ArrowRight size={16} /></Link></Button><Button asChild variant="outline"><Link href={href('assignments', { resource: 'reading', create: true, book: book.book })}>Create connected reading</Link></Button><Link className="text-caption underline" href={book.pdf} target="_blank">Original textbook PDF & translations</Link></Card>)}</div><Button asChild variant="outline" className="self-start"><Link href={href('syllabus')}>See readings mapped to the syllabus</Link></Button></section> : <>
      <div className={styles.metrics}>{[
        { label: 'Readings assigned', value: readings ? assigned : '—', description: 'Currently published', destination: 'assignments' as const },
        { label: 'Draft assignments', value: syllabus && readings ? drafts.length : '—', description: 'Across readings, practice & quizzes', destination: 'assignments' as const },
        { label: 'Submissions to review', value: readings && quizzes && syllabus ? pendingCount : '—', description: 'Reading responses & linked quizzes', destination: 'review' as const },
      ].map(metric => <Link key={metric.label} href={href(metric.destination)} className={styles.metric} onClick={() => { if (metric.label === 'Draft assignments') setAssignmentFilter('draft'); else if (metric.destination === 'assignments') setAssignmentFilter('published') }}><span className="text-caption text-muted-foreground">{metric.label}</span><strong className="text-display">{metric.value}</strong><span className="text-caption text-muted-foreground">{metric.description}</span></Link>)}</div>
      <section className={styles.section}><div className={styles.row}><div><h2 className="text-title-1">Continue the sequence</h2><p className="text-muted-foreground">Your next step for each class. You control when students receive it.</p></div><Button asChild variant="outline"><Link href={href('syllabus')}>Open syllabus <ArrowRight size={16} /></Link></Button></div>
        <div className={styles.twoColumns}>{syllabus?.courses.filter(item => !courseId || item.id === courseId).map(item => {
          const bundles = syllabus.bundles.filter(bundle => bundle.course_id === item.id), next = nextSyllabusStep(syllabus.steps, bundles), step = syllabus.steps.find(item => item.id === next)
          const prepared = bundles.some(bundle => bundle.step_id === next), released = bundles.filter(bundle => bundle.reading.status !== 'draft' && bundle.reading.status !== 'missing').length
          return <Card key={item.id} className={styles.sequenceCard}><div className={styles.row}><p className="font-semibold">{className(item.id)}</p><span className={styles.badge}>{item.track === 'honors' ? 'Honors · OpenStax' : 'CPA · Hewitt'}</span></div><div className={styles.progress} role="progressbar" aria-label={`${className(item.id)} sequence assigned`} aria-valuemin={0} aria-valuemax={syllabus.steps.length} aria-valuenow={released}><span style={{ width: `${syllabus.steps.length ? released / syllabus.steps.length * 100 : 0}%` }} /></div><p className="text-caption text-muted-foreground">{released} of {syllabus.steps.length} steps released · assignment progress</p><div><p className="text-overline text-primary">{step ? `${prepared ? 'Drafts ready' : 'Next suggested'} · Step ${syllabus.steps.indexOf(step) + 1}` : 'Sequence fully released'}</p><h3 className="text-title-2 mt-2">{step?.title ?? 'All reading steps have been assigned'}</h3><p className="text-muted-foreground mt-2">{step?.focus ?? 'Review student evidence and return to earlier ideas as needed.'}</p></div><Button asChild className="self-start"><Link href={href('syllabus', { courseId: item.id, stepId: step?.id })}>{prepared ? 'Review & assign next step' : 'Plan next reading'} <ArrowRight size={16} /></Link></Button></Card>
        })}</div>{syllabus && !syllabus.courses.length && <Card className="p-6 gap-3"><h3 className="text-title-3">Connect your first Physics class</h3><Button asChild className="self-start"><Link href="/admin/classes">Open classes</Link></Button></Card>}
      </section>
      <div className={styles.twoColumns}><Card className={styles.panel}><div className={styles.row}><h2 className="text-title-2">Ready to review</h2><ClipboardCheck size={22} className="text-primary" /></div>{pending.slice(0, 4).map(({ group, resource }) => <Link className={styles.listLink} href={resourceHref(group, resource)} key={resource.id}><span><strong>{group.title}</strong><small>{className(group.courseId)} · {resource.label}</small></span><span className={styles.reviewBadge}>{resource.pending}</span></Link>)}{!pending.length && <p className="text-muted-foreground">{errors.quizzes || errors.readings || errors.syllabus ? 'Review counts are incomplete. Retry the unavailable source above.' : 'No reading or linked quiz submissions waiting.'}</p>}<Button asChild variant="outline" className="self-start"><Link href={href('review')}>Open review queue</Link></Button></Card>
        <Card className={styles.panel}><div className={styles.row}><h2 className="text-title-2">Upcoming due dates</h2><CalendarDays size={22} className="text-primary" /></div>{upcoming.map(({ group, resource }) => <Link className={styles.listLink} href={resourceHref(group, resource)} key={resource.id}><span><strong>{group.title}</strong><small>{className(group.courseId)} · {resource.label}</small><small>{resourceDueLabel(resource)}</small></span><ArrowRight size={18} /></Link>)}{!upcoming.length && <p className="text-muted-foreground">No upcoming due dates on loaded assignments. Set dates when releasing a sequence or managing its assignments.</p>}</Card></div>
      <Card className={styles.workflow}><div className={styles.row}><Button asChild variant="outline"><Link href={href('map')}><GitBranch size={18} />Explore the reading mind map</Link></Button></div><div><h2 className="text-title-2">One reading, four connected assignments</h2><p className="text-muted-foreground mt-2">Plan the idea, preview its words, assign the reading, and revisit understanding.</p></div><ol>{['Reading & response', 'Vocabulary practice', 'Reading quiz', 'Vocabulary quiz'].map((label, index) => <li key={label}><span>{index + 1}</span>{label}</li>)}</ol><p className="text-caption text-muted-foreground">The reading quiz unlocks after the student submits the reading. Students can do it later; it remains marked “Needs completion.” Vocabulary quizzes stay in draft until you publish them.</p></Card>
      <p className="text-caption text-muted-foreground">{SYLLABUS_UNITS.length} units · {syllabus?.steps.length ?? '—'} foundational reading steps · Shared CPA & Honors foundation</p>
    </>}
  </div>
}
