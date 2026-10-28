'use client'

import { useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, RefreshCw } from 'lucide-react'
import { StudentProgressContext, StudentProgressProvider, useStudentProgress } from './StudentProgressContext'
import { GradeBadge, GradeScale } from '@/components/admin/results/GradeDisplay'
import { RESULT_KINDS } from '@/lib/assessment-results/types'
import { termDateLabel } from '@/lib/grading-terms'
import { STUDENT_STATUS_LABELS, isAssignedStudentWork, isStudentHomework, studentWorkComplete, studentDueLabel, studentRowOrder, type StudentGradebookRow, type StudentProgressData } from '@/lib/student-gradebook'
import s from './StudentProgress.module.css'
import StudentLabHistory from './StudentLabHistory'
import StudentGradeBreakdown from './StudentGradeBreakdown'

type Props = { mode?: 'summary' | 'gradebook'; classId?: string | null; studentId?: string; initialTerm?: string; initialStatus?: string; initialKind?: string; initialTab?: string; initialWork?: string }
export default function StudentProgress(props: Props) {
  const shared = useContext(StudentProgressContext)
  return shared ? <ProgressContent key={shared.classId + ':' + shared.studentId} {...props}/>
    : <StudentProgressProvider classId={props.classId} studentId={props.studentId} initialTerm={props.initialTerm ?? (props.mode === 'gradebook' ? 'all' : undefined)}><ProgressContent {...props}/></StudentProgressProvider>
}
function ProgressContent({ mode = 'summary', initialStatus, initialKind, initialTab, initialWork }: Props) {
  const { data, loading, error, refresh, studentId, onClass, onStudent, termId, onTerm: setTerm, now } = useStudentProgress()
  const [work, setWork] = useState(initialWork === 'homework' || initialWork === 'assigned' ? initialWork : 'all')
  const [unit, setUnit] = useState('all'), [kind, setKind] = useState(initialKind ?? 'all'), [status, setStatus] = useState(initialStatus ?? 'all')
  const [points, setPoints] = useState(false), [tab, setTab] = useState(initialTab === 'history' || initialTab === 'labs' || initialTab === 'transfer' ? initialTab : 'gradebook'), [page, setPage] = useState(0)
  const feedbackFocused = useRef(false)
  useEffect(() => {
    if (loading || error || !data || feedbackFocused.current) return
    const target = location.hash === '#grade-breakdown' ? 'grade-breakdown' : mode === 'summary' && location.hash === '#teacher-feedback' ? 'teacher-feedback' : null
    if (!target) return
    const feedback = document.getElementById(target)
    if (!feedback) return
    feedbackFocused.current = true
    feedback.focus({ preventScroll: true })
    feedback.scrollIntoView({ behavior: 'instant', block: 'center' })
  }, [mode, loading, error, data])
  const terms = data?.settings.terms ?? []
  const term = terms.find(t => t.id === termId), rows = data?.rows ?? []
  const recent = rows.filter(r => r.grade || r.feedback).sort((a, b) => (b.releasedAt ?? b.submittedAt ?? '').localeCompare(a.releasedAt ?? a.submittedAt ?? '')).slice(0, 5)
  const filtered = rows.filter(r => (termId === 'all' || (termId === 'unassigned' ? !r.termId : r.termId === termId)) && (unit === 'all' || r.unitIds.includes(unit)) && (kind === 'all' || r.kind === kind) && (work === 'all' || (work === 'assigned' ? isAssignedStudentWork(r) : isStudentHomework(r, new Date(now)))) && (status === 'all' || (status === 'completed_work' ? isAssignedStudentWork(r) && studentWorkComplete(r) : status === 'not_completed' ? isAssignedStudentWork(r) && !studentWorkComplete(r) : r.status === status))).sort(studentRowOrder)
  const pageCount = Math.max(1, Math.ceil(filtered.length / 25)), currentPage = Math.min(page, pageCount - 1)
  const course = data?.courses.find(c => c.id === data.courseId)
  const gradebookHref = (filters: Record<string, string> = {}) => '/home/gradebook?' + new URLSearchParams({ ...(data?.courseId ? { class: data.courseId } : {}), ...(data?.staff && data.student ? { student: data.student.id } : {}), ...filters })
  const scope = <div className={s.scope}>
    {(data?.courses.length ?? 0) > 1 ? <label>Class<select value={data?.courseId ?? ''} onChange={e => onClass(e.target.value)}>{data?.courses.map(c => <option key={c.id} value={c.id}>{[c.name, c.section].filter(Boolean).join(' · ')}</option>)}</select></label> : course ? <div><small>Class</small><span>{[course.name, course.section].filter(Boolean).join(' · ')}</span></div> : null}
    {data?.staff ? <label>Student preview<select value={studentId ?? ''} onChange={e => onStudent(e.target.value)}><option value="">Choose a student</option>{data.roster.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}</select></label> : data?.student && <div><small>Student</small><span>{data.student.name}</span></div>}
  </div>
  const termSelect = (label = 'Grading term') => <label>{label}<select value={termId} onChange={e => { setTerm(e.target.value); setPage(0) }}><option value="all">All terms</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}{mode === 'gradebook' && <option value="unassigned">No matching term</option>}</select></label>
  const displayToggle = <div className={s.toggle} role="group" aria-label="Score display"><button type="button" aria-pressed={!points} onClick={() => setPoints(false)}>Percentages</button><button type="button" aria-pressed={points} onClick={() => setPoints(true)}>Points</button></div>
  return <section className={s.workspace} aria-label={mode === 'summary' ? 'My progress' : 'My gradebook'}>
    {mode === 'gradebook' && <Link className={s.back} href={'/home?' + new URLSearchParams({view:'progress', ...(data?.courseId ? {class:data.courseId} : {}), ...(data?.staff && studentId ? {student:studentId} : {}), term:termId})}><ArrowLeft size={16}/> Back to My progress</Link>}
    <header className={s.heading}><div><p className={s.eyebrow}>MY LEARNING</p><h2>{mode === 'summary' ? 'My progress' : 'My gradebook'}</h2><p>{mode === 'summary' ? 'Your scores, feedback, and learning history.' : 'Your assignment record, released scores, and learning history.'}</p></div>{scope}<button className={s.refresh} onClick={refresh} disabled={loading} aria-label="Refresh progress"><RefreshCw size={17}/></button></header>
    {error && <p className={s.alert} role="alert">Your progress could not refresh. {data ? 'Previously loaded information remains below.' : ''} <button onClick={refresh}>Try again</button></p>}
    {data?.warnings.map(w => <p className={s.alert} role="alert" key={w.source}><strong>{w.source}:</strong> {w.message} <button onClick={refresh}>Retry</button></p>)}
    {loading && !data ? <p className={s.empty} role="status">Loading your progress…</p> : data && !data.student ? <p className={s.empty}>{data.staff ? 'Choose a student to preview their progress.' : 'Your gradebook will appear when you are enrolled in a class.'}</p> : data?.student && <>
      <StudentGradeBreakdown/>
      {mode === 'summary' ? <>
        {!terms.length && !data.warnings.some(w => w.source === 'Grading terms') && <p className={s.note}>Your teacher hasn’t set grading terms yet. Showing grades across all terms.</p>}
        <div className={s.columns}><section><header className={s.sectionHead}><h3>Recent results</h3><Link href={gradebookHref()}>Full gradebook <ArrowRight size={16}/></Link></header><Records rows={recent} points={points} data={data}/>{!recent.length && <p className={s.empty}>Released scores and feedback will appear here.</p>}</section><aside id="teacher-feedback" tabIndex={-1}><h3>Recent teacher feedback</h3>{recent.filter(r => r.feedback).slice(0, 2).map(r => <article className={s.feedback} key={r.key}><p>{r.feedback}</p><small>{r.title} · {studentDueLabel(r.releasedAt)}</small><Link href={r.href}>View feedback <ArrowUpRight size={15}/></Link></article>)}{!recent.some(r => r.feedback) && (data.feedback.length ? data.feedback.slice(0, 2).map(f => <article className={s.feedback} key={f.id}><p>{f.message}</p><small>{studentDueLabel(f.at)}</small></article>) : <p className={s.note}>Your teacher’s released feedback will appear here.</p>)}<Link className={s.historyLink} href={gradebookHref({ tab: 'history' })}>Learning over time <ArrowRight size={16}/></Link><p className={s.note}>Year-long targets · Teacher observations</p></aside></div>
      </> : <>
        <nav className={s.tabs} aria-label="Student records"><button type="button" aria-current={tab === 'gradebook' ? 'page' : undefined} onClick={() => setTab('gradebook')}>Gradebook</button><button type="button" aria-current={tab === 'history' ? 'page' : undefined} onClick={() => setTab('history')}>Learning history</button>{data.syllabusCategories&&<button type="button" aria-current={tab==='transfer'?'page':undefined} onClick={()=>setTab('transfer')}>Transfer Task grades</button>}{data.syllabusCategories&&<button type="button" aria-current={tab==='labs'?'page':undefined} onClick={()=>setTab('labs')}>Lab grades</button>}</nav>
        {tab === 'labs' || tab === 'transfer' ? <>{termSelect()}<StudentLabHistory category={tab}/ ></> : tab === 'history' ? <><p className={s.note}>Targets develop over time. These ratings describe your learning and stay separate from assignment grades.</p>{data.targets.map(target => <details className={s.target} key={target.id}><summary><span><strong>{target.statement}</strong><small>{target.observations.length ? `${target.observations.length} teacher observations` : 'Not yet assessed'}</small></span><span className={s.rating}>{target.value == null ? '—' : target.value.toFixed(1) + ' / 3'}</span></summary>{target.observations.length ? [...target.observations].reverse().map(o => <div className={s.observation} key={o.id}><time>{new Date(o.at).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' })}</time><span>{o.source}</span><strong>{o.level} / 3</strong></div>) : <p className={s.note}>No rating means no recorded assessment yet; it does not mean a zero.</p>}</details>)}{!data.targets.length && <p className={s.empty}>No learning history is available yet.</p>}</> : <>
          <div className={s.filters}>{termSelect()}<label>Work<select value={work} onChange={e => { setWork(e.target.value); setPage(0) }}><option value="all">Full record</option><option value="assigned">Assigned work</option><option value="homework">Homework to finish</option></select></label><label>Unit<select value={unit} onChange={e => { setUnit(e.target.value); setPage(0) }}><option value="all">All units</option>{data.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label>Assignment type<select value={kind} onChange={e => { setKind(e.target.value); setPage(0) }}><option value="all">All types</option>{Object.entries(RESULT_KINDS).filter(([id]) => rows.some(r => r.kind === id)).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Status<select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}><option value="all">All statuses</option><option value="completed_work">Completed work</option><option value="not_completed">Not completed</option>{Object.entries(STUDENT_STATUS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>{displayToggle}<GradeScale/></div>
          <p className={s.note} role="status">{filtered.length} assignments shown{term ? ' · ' + termDateLabel(term.start) + ' – ' + termDateLabel(term.end) : ''}</p><Records rows={filtered.slice(currentPage * 25, currentPage * 25 + 25)} points={points} data={data}/>
          {!filtered.length && <div className={s.empty}><p>No assignments match these filters.</p><button className={s.link} onClick={() => { setTerm('all'); setWork('all'); setUnit('all'); setKind('all'); setStatus('all'); setPage(0) }}>Clear filters</button></div>}
          {pageCount > 1 && <div className={s.pagination}><button disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage + 1} of {pageCount}</span><button disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>Next</button></div>}
        </>}
      </>}
      <footer className={s.footer}><span>Quiz and lab scores appear after release. Homework reflects assignment completion.</span>{mode === 'summary' && <Link href={gradebookHref()}>Open full gradebook <ArrowRight size={15}/></Link>}</footer>
    </>}
  </section>
}
function Records({ rows, points, data }: { rows: StudentGradebookRow[]; points: boolean; data: StudentProgressData }) {
  const { now } = useStudentProgress()
  return <div className={s.records}>{rows.map(row => <details className={s.record} key={row.key}><summary><span className={s.assignment}><strong>{row.title}</strong><small>{isStudentHomework(row, new Date(now)) && <strong className={s.homeworkLabel}>Homework · </strong>}{row.assignmentLabel ?? (row.kind === 'worksheet' ? 'Paper worksheet' : row.pairedKey && row.kind === 'quiz' ? 'Paired quiz' : RESULT_KINDS[row.kind])} · Due {studentDueLabel(row.dueAt)}{row.archived ? ' · Archived' : ''}</small></span><span className={s.status} data-status={row.status}>{row.statusLabel}</span><span className={s.score}>{row.grade ? points ? <span className={s.pointScore}><strong>{row.grade.earned} / {row.grade.possible}</strong><small>{row.grade.letter}</small></span> : <GradeBadge percent={row.grade.percent} letter={row.grade.letter}/> : <span>—</span>}</span><span className={s.detailsLabel}>Details</span></summary><div className={s.recordDetail}><div><strong>{row.feedback ? 'Teacher feedback' : row.status === 'missing' ? 'What to do next' : 'Assignment status'}</strong><p>{row.feedback || (row.status === 'missing' ? row.kind === 'worksheet' ? 'Hand in the paper worksheet. If you already handed it in, ask your teacher to check the receipt.' : 'Open the assignment to finish and submit your work.' : row.status === 'pending' ? 'Your work is submitted. Feedback will appear after your teacher releases it.' : row.status === 'revise' ? 'Open your work to review your teacher’s instructions.' : row.statusLabel + '. Open the assignment to see your work.')}</p><Link href={row.href}>Open assignment <ArrowUpRight size={16}/></Link>{row.pairedKey && data.rows.find(r => r.key === row.pairedKey) && <Link href={data.rows.find(r => r.key === row.pairedKey)!.href}>{row.kind === 'worksheet' ? 'View paired quiz' : 'View paper worksheet'} <ArrowRight size={15}/></Link>}</div><div><small>Grading term</small><p>{data.settings.terms.find(t => t.id === row.termId)?.name ?? 'No matching term'}{row.manualTerm ? ' · Teacher placement' : ''}</p>{row.grade && <p>{row.grade.earned} / {row.grade.possible} points · {row.grade.percent.toFixed(1)}%</p>}{row.releasedAt && <p>Released {studentDueLabel(row.releasedAt)}</p>}</div></div></details>)}</div>
}
