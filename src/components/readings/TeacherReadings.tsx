'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { assessmentCenterHref } from '@/lib/assessment-center'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Plus, ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { textbookChapter } from '@/data/textbook'
import type { ReadingAssignment, ReadingDetail, ReadingList } from '@/lib/textbook-assignments'
import ReadingComposer, { type ReadingCatalog } from './ReadingComposer'
import ReadingAssignmentActions from './ReadingAssignmentActions'
import ReadingDueDateEditor from './ReadingDueDateEditor'
import ReadingReview from './ReadingReview'
import ReadingAssignmentResources, { ReadingQuestionText } from './ReadingAssignmentResources'
import { interactiveChapterForAssignment } from './interactive/registry'
import { readingDashboardHref } from '@/lib/reading-dashboard'
import { honorsReadingUrl } from '@/lib/openstax-physics'
import { dueLabel, readingFetch } from './ReadingShared'
import styles from './readings.module.css'

export default function TeacherReadings({ embedded = false, classId, onClassChange, dashboardHref, onChanged }: { onChanged?: () => void; embedded?: boolean; classId?: string | null; onClassChange?: (id: string) => void; dashboardHref?: (id?: string) => string } = {}) {
  const params = useSearchParams(), router = useRouter(), id = params.get('id'), lessonId=params.get('lesson_id'), blockId=params.get('block_id')
  const [linkedCourses,setLinkedCourses]=useState<ReadingList['courses']|null>(null)
  const [list, setList] = useState<ReadingList | null>(null), [catalog, setCatalog] = useState<ReadingCatalog | null>(null), [detail, setDetail] = useState<ReadingDetail | null>(null)
  const [draft, setDraft] = useState<ReadingAssignment | null>(null), [localCourse, setLocalCourse] = useState('all'), [error, setError] = useState(''), [loading, setLoading] = useState(true), [showArchived, setShowArchived] = useState(false)
  const [editingDue,setEditingDue]=useState(false),[showSource,setShowSource]=useState(false)
  const course = (embedded || dashboardHref) ? (classId || 'all') : localCourse
  const setCourse = (id: string) => embedded ? onClassChange?.(id === 'all' ? '' : id) : setLocalCourse(id)
  const href = (id?: string) => dashboardHref ? dashboardHref(id) : embedded ? assessmentCenterHref('readings', id, classId, params.toString()) : id ? `/admin/readings?id=${encodeURIComponent(id)}` : '/admin/readings'
  const load = useCallback(async () => {
    const [l, c] = await Promise.all([readingFetch<ReadingList>('/api/readings'), readingFetch<ReadingCatalog>('/api/readings/catalog')])
    setList(l); setCatalog(c)
  }, [])
  useEffect(() => { let active = true; setLoading(true); load().catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [load])
  const loadDetail = useCallback(async () => { if (!id) return; const d = await readingFetch<ReadingDetail>(`/api/readings/${id}`); setDetail(d) }, [id])
  useEffect(() => { const controller = new AbortController(); setDetail(null); setEditingDue(false); setShowSource(false); setError(''); if (id) readingFetch<ReadingDetail>(`/api/readings/${id}`, { signal: controller.signal }).then(setDetail).catch(e => { if (!controller.signal.aborted) setError(e.message) }); return () => controller.abort() }, [id])
  useEffect(()=>{
    if(!lessonId||!blockId)return
    const c=new AbortController()
    readingFetch<{assignment:ReadingAssignment;courses:ReadingList['courses']}>(`/api/readings/from-lesson?lesson_id=${encodeURIComponent(lessonId)}&block_id=${encodeURIComponent(blockId)}`,{signal:c.signal}).then(r=>{setDraft(r.assignment);setLinkedCourses(r.courses)}).catch(e=>{if(!c.signal.aborted)setError(e.message)})
    return()=>c.abort()
  },[lessonId,blockId])
  function create(source?: ReadingAssignment) {
    if (!catalog?.courses.length) return
    const ch = Number(params.get('ch')), chapter = textbookChapter(ch) ? ch : 4
    setDraft(source ? { ...source, id: crypto.randomUUID(), title: `${source.title} (copy)`, status: 'draft', version: 0, questions: source.questions.map(q => ({ ...q, id: crypto.randomUUID() })) } : { id: crypto.randomUUID(), course_id: course !== 'all' ? course : catalog.courses[0].id, chapter, title: '', reading: `Chapter ${chapter}`, section_ids: [], instructions: '', due_at: null, questions: [], version: 0, status: 'draft', created_at: new Date().toISOString() })
  }
  const interactive = detail ? interactiveChapterForAssignment(detail.assignment) : null
  const created = useRef(false)
  useEffect(() => {
    if (dashboardHref && !id && !lessonId && (params.get('create') === '1' || params.has('ch')) && catalog && !created.current) { created.current = true; create() }
  })
  return <div className={styles.page}>
    {!dashboardHref && !draft && <header className={styles.hero}><div className={`${styles.row} ${styles.spread}`}><div><p className="text-overline text-primary">Read · Respond · Demonstrate</p>{embedded ? <h2 className="text-title-1 mt-2">Textbook readings</h2> : <h1 className="text-display mt-2">Textbook readings</h1>}<p className="mt-3 text-muted-foreground">A short path from assigned pages to evidence of understanding.</p></div><BookOpen size={44} className="text-primary" aria-hidden="true" /></div></header>}
    {!dashboardHref && !draft && !id && <Card className="p-5 gap-3 mb-5"><h2 className="text-title-2">Build understanding in sequence</h2><p className="text-muted-foreground">Plan a reading syllabus with connected vocabulary practice, reading quizzes, and vocabulary quizzes. Honors includes OpenStax AP Physics 2e.</p><Button asChild className="self-start"><Link href={classId ? `/admin/readings/syllabus?class=${encodeURIComponent(classId)}` : '/admin/readings/syllabus'}>Open reading syllabus & assignment tree</Link></Button></Card>}
    {error && <div className={`${styles.error} mb-4`} role="alert">{error}<Button variant="outline" className="ml-3" onClick={() => { setError(''); void (id ? loadDetail() : load()).catch(e => setError(e.message)) }}>Retry</Button></div>}
    {loading ? <Spinner /> : catalog?.readOnly ? <p className={styles.error}>Switch back to your own account to assign and review reading.</p> : draft && catalog ? <ReadingComposer key={draft.id} initial={draft} catalog={linkedCourses&&draft.origin_key?{...catalog,courses:linkedCourses}:catalog} onCancel={() => {setDraft(null);setLinkedCourses(null);router.replace(href())}} onSaved={a => { setDraft(null); void load().catch(e => setError(e.message)); if (a.id === id) void loadDetail().catch(e => setError(e.message)); else router.push(href(a.id)) }} /> : id ? detail ? <div className={styles.stack}>
      <div className={styles.actions}><Button data-reading-leave variant="ghost" onClick={() => router.push(href())}><ArrowLeft />All readings</Button><Button asChild variant="outline"><Link href={interactive ? `/readings/${detail.assignment.id}?reader=interactive` : detail.assignment.honors_reading ? honorsReadingUrl(detail.assignment.honors_reading) : `/textbook?ch=${detail.assignment.chapter}`} target="_blank">{interactive ? 'Open interactive assignment' : 'Open textbook'}<ExternalLink size={16} /></Link></Button><Button data-reading-leave variant="outline" onClick={() => create(detail.assignment)}>Duplicate reading</Button>{detail.assignment.status === 'draft' && <Button onClick={() => setDraft(detail.assignment)}>Edit draft</Button>}{detail.assignment.status === 'published' && <Button variant="outline" onClick={() => setEditingDue(true)}>Edit due date</Button>}<ReadingAssignmentActions assignment={detail.assignment} onChanged={async () => { await loadDetail(); await load(); onChanged?.() }} /></div>
      <Card className="p-6 gap-3"><div className={styles.row}><span className={styles.badge}>{detail.assignment.status === 'archived' ? 'Unassigned' : detail.assignment.status}</span><span className={styles.muted}>{dueLabel(detail.assignment.due_at)}</span></div><h2 className="text-title-1">{detail.assignment.title}</h2><p>{detail.assignment.reading}</p>{detail.assignment.instructions && <p className="whitespace-pre-wrap text-muted-foreground">{detail.assignment.instructions}</p>}</Card>
      {detail.assignment.status === 'archived' && <p role="status" className={styles.muted}>This reading is unassigned from the class. Saved work and feedback are preserved. Reassign it to accept new answers.</p>}
      {editingDue && <ReadingDueDateEditor key={detail.assignment.id} assignment={detail.assignment} onSaved={async()=>{await loadDetail();await load()}} onCancel={()=>setEditingDue(false)}/>}
      {interactive ? <>
        <Card className="p-6 gap-4"><p className="text-overline text-primary">Interactive reading assignment</p><h3 className="text-title-2">{interactive.bookTitle} · {interactive.title}</h3><p>Students read, explore the illustrations, practice vocabulary, and answer this assignment inside the interactive reader. Submitted explanations earn reading XP; your review supplies mastery evidence.</p><Button asChild className="self-start"><Link href={'/readings/'+detail.assignment.id+'?reader=interactive'} target="_blank">Preview interactive assignment <ExternalLink size={16}/></Link></Button></Card>
        <section className={styles.stack} aria-label="Assigned reading responses"><h3 className="text-title-3">Assigned responses ({detail.assignment.questions.length})</h3>{detail.assignment.questions.map((question,index)=><div className={styles.question} key={question.id}><h4 className="font-semibold">{index+1}. {question.reference}</h4><ReadingQuestionText chapter={detail.assignment.chapter} question={question}/></div>)}</section>
        <details className={styles.question} onToggle={event=>setShowSource(event.currentTarget.open)}><summary className="cursor-pointer font-semibold py-3">Original textbook pages & translations</summary>{showSource&&<ReadingAssignmentResources key={'resources:'+detail.assignment.id} assignment={detail.assignment} showInteractiveLink={false}/>}</details>
      </> : <ReadingAssignmentResources key={'resources:'+detail.assignment.id} assignment={detail.assignment} showQuestions />}
      {detail.assignment.status === 'draft' ? <p className={styles.muted}>This draft is only visible to you. For connected readings, return to the syllabus step to assign the reading, vocabulary practice, and reading quiz together. Use “Edit draft” to adjust individual reading questions.</p> : <ReadingReview key={detail.assignment.id} detail={detail} onRefresh={async () => { await loadDetail(); onChanged?.() }} />}
    </div> : !error && <Spinner /> : <div className={styles.stack}>
      <div className={`${styles.row} ${styles.spread}`}>{!embedded && <label className={styles.field}>Class<select value={course} onChange={e => setCourse(e.target.value)}><option value="all">All my classes</option>{catalog?.courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</option>)}</select></label>}<Button asChild disabled={!catalog?.courses.length}><Link href={readingDashboardHref({view:'assignments',courseId:course,resource:'reading',create:true})}><Plus />New interactive reading</Link></Button></div>
      {!catalog?.courses.length && <Card className="p-6"><h2 className="text-title-3">Connect a class first</h2><p className={styles.muted}>Readings use your existing class roster.</p><Button asChild><Link href="/admin/classes">Open classes</Link></Button></Card>}
      <label className={styles.check}><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />Include unassigned readings</label>
      <div className={styles.grid}>{list?.assignments.filter(a => (course === 'all' || a.course_id === course) && (showArchived || a.status !== 'archived')).map(a => <Card key={a.id} className="p-6 gap-3"><div className={`${styles.row} ${styles.spread}`}><span className={styles.badge}>{a.status === 'archived' ? 'Unassigned' : a.status}</span><span className={styles.muted}>{a.honors_reading?'OpenStax AP Physics 2e':a.passage?'Course reading':`Chapter ${a.chapter}`}</span></div><h2 className="text-title-3">{a.title}</h2><p className={styles.muted}>{list.courses.find(c => c.id === a.course_id)?.name} · {a.reading}</p><p className={styles.muted}>{a.questions.length} questions · {dueLabel(a.due_at)}</p>{(list.review_counts?.[a.id]??0)>0&&<p className="font-semibold text-primary">{list.review_counts?.[a.id]} submissions ready to review</p>}<Button asChild variant={a.status === 'published' ? 'default' : 'outline'}><Link href={href(a.id)}>{a.status === 'draft' ? 'Open draft' : 'View roster & review'}</Link></Button></Card>)}</div>
      {list && !list.assignments.some(a => (course === 'all' || a.course_id === course) && (showArchived || a.status !== 'archived')) && <Card className="p-7"><h2 className="text-title-3">Your next reading starts here</h2><p className={styles.muted}>Choose a chapter, add questions such as 1–5 or the section concept checks, and publish to your class.</p></Card>}
    </div>}
  </div>
}
