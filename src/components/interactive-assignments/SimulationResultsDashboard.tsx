'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {ArrowLeft, ArrowUpRight, CalendarDays, ClipboardCheck, FlaskConical, RefreshCw, Search} from 'lucide-react'
import {useLearningResource} from '@/app/home/useLearningWeek'
import {assignmentBySlug} from '@/lib/interactive-assignments/catalog'
import type {ResultRow, SimulationResults} from '@/lib/interactive-assignments/results'
import s from './SimulationResultsDashboard.module.css'

const AssignmentTeacher = dynamic(() => import('./AssignmentTeacher'), {loading: () => <p role="status">Loading answers and trial evidence…</p>})
type Data = SimulationResults & {courseId: string | null; courses: {id: string; name: string; section: string}[]; claudeConfigured: boolean; claudeModel: string; readOnly: boolean}
const statusLabels: Record<ResultRow['status'], string> = {'not-started': 'Not started', draft: 'In progress / revision', review: 'Awaiting teacher', rated: 'Teacher rated'}
const aiLabels: Record<ResultRow['analysis'], string> = {none: '—', queued: 'Queued', processing: 'Analyzing', ready: 'Ready', error: 'Retry needed'}

export default function SimulationResultsDashboard() {
  const [course, setCourse] = useState(''), [search, setSearch] = useState(''), [filter, setFilter] = useState('all')
  const [activity, setActivity] = useState(''), [student, setStudent] = useState(''), [question, setQuestion] = useState('')
  const detail = useRef<HTMLDivElement>(null), jump = useRef(false)
  const {data, loading, error, refresh} = useLearningResource<Data>('/api/interactive-assignments/results' + (course ? '?class=' + encodeURIComponent(course) : ''))
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    setCourse(query.get('class') ?? '')
    if (assignmentBySlug(query.get('activity') ?? '')?.simulation) setActivity(query.get('activity')!)
    jump.current = !!query.get('activity'); setStudent(query.get('student') ?? ''); setQuestion(query.get('question') ?? '')
  }, [])
  useEffect(() => { if (!course && data?.courses.length === 1) setCourse(data.courses[0].id) }, [course, data?.courses])
  const pending = data?.rows.some(r => r.analysis === 'queued' || r.analysis === 'processing') ?? false
  useEffect(() => { if (!pending) return; const timer = setInterval(refresh, 10000); return () => clearInterval(timer) }, [pending, refresh])
  function updateLocation(classId: string, slug = '', studentId = '', questionId = '') {
    const url = new URL(window.location.href)
    for (const [key, value] of Object.entries({class: classId, activity: slug, student: studentId, question: questionId})) {
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key)
    }
    window.history.replaceState(null, '', url)
  }
  function open(slug: string, studentId = '', questionId = '') {
    jump.current = true; setActivity(slug); setStudent(studentId); setQuestion(questionId)
    updateLocation(course, slug, studentId, questionId)
  }
  const reviewReady = useCallback(() => {
    if (!jump.current) return
    jump.current = false
    requestAnimationFrame(() => (document.getElementById(student ? 'student-review' : question ? 'question-comparison' : 'simulation-review') ?? detail.current)?.scrollIntoView({block: 'start'}))
  }, [student, question])
  const activities = data?.activities ?? [], rows = data?.rows ?? []
  const submitted = rows.filter(r => r.status === 'review' || r.status === 'rated')
  const awaiting = rows.filter(r => r.status === 'review'), ready = awaiting.filter(r => r.analysis === 'ready')
  const gaps = activities.flatMap(a => a.questions.filter(q => q.needsReview > 0).map(q => ({...q, slug: a.assignment.slug, title: a.title.split(' · ')[0]}))).sort((a, b) => b.needsReview - a.needsReview || b.needsReview / b.assessed - a.needsReview / a.assessed)
  const visible = rows.filter(r => (filter === 'all' || r.status === filter || filter === 'error' && r.analysis === 'error') && (r.name + ' ' + assignmentBySlug(r.slug)?.title).toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug))
  const className = data?.courses.find(c => c.id === course)?.name
  const selected = !!assignmentBySlug(activity)?.simulation
  const levels = activities.reduce((sum, a) => sum.map((n, i) => n + a.teacherLevels[i]), [0, 0, 0])
  return <main className={s.page}>
    <header className={s.header}>
      <div><p className={s.eyebrow}><FlaskConical size={16} aria-hidden="true"/> Simulation assignments · Unit 1</p><h1>Student results</h1><p>See the evidence. Find the next teaching move.</p></div>
      <nav className={s.links} aria-label="Simulation assignment navigation"><Link href={'/admin/interactive-assignments' + (course ? '?class=' + course : '')}><CalendarDays size={17}/> Assignment calendar</Link><Link href="/admin/interactive-assignments/investigations">Browse investigations <ArrowUpRight size={16}/></Link></nav>
    </header>
    <div className={s.toolbar}><label htmlFor="results-class">Class<select id="results-class" value={course} onChange={e => {setCourse(e.target.value); setActivity(''); setStudent(''); setQuestion(''); updateLocation(e.target.value)}}><option value="">Choose a class</option>{data?.courses.map(c => <option value={c.id} key={c.id}>{c.name}{c.section ? ' · ' + c.section : ''}</option>)}</select></label><button onClick={refresh} disabled={loading}><RefreshCw size={16}/> Refresh results</button></div>
    <div className={s.workflow}><span><b>1</b> Students submit answers & trials</span><span><b>2</b> Claude checks reasoning</span><span><b>3</b> You award mastery</span></div>
    <p className={s.note}>Claude uses your existing API connection to analyze new submissions automatically. Its feedback and suggested ratings stay in teacher review. Only a rating you explicitly save enters mastery.</p>
    {loading && <p role="status">Loading simulation results…</p>}
    {error && <p className={s.alert} role="alert">Results could not be loaded. <button onClick={refresh}>Try again</button></p>}
    {data?.claudeConfigured === false && <p className={s.alert}>The Claude API connection needs configuration. Saved answers and teacher review remain available.</p>}
    {!loading && !error && !course && <section className={s.empty}><FlaskConical size={32}/><h2>Choose a class to see its investigations</h2><p>Results include only students currently enrolled in that class.</p></section>}
    {!error && course && data?.courseId === course && <>
      {selected ? <div ref={detail} id="simulation-review" className={s.detail}>
        <button className={s.back} onClick={() => {setActivity(''); setStudent(''); setQuestion(''); updateLocation(course)}}><ArrowLeft size={16}/> All simulation results</button>
        <AssignmentTeacher key={course + activity + student + question} courseId={course} initialSlug={activity} initialStudent={student} initialQuestion={question} simulationsOnly onReady={reviewReady} onSlugChange={slug => open(slug)} onChanged={refresh}/>
      </div> : <>
        <section className={s.stats} aria-label="Class submission summary">
          <div><span>Assigned investigations</span><strong>{activities.length}</strong><small>{className ?? 'Selected class'}</small></div>
          <div><span>Submitted work</span><strong>{submitted.length}<small> / {rows.length}</small></strong><small>Student–assignment pairs</small></div>
          <div><span>Awaiting your rating</span><strong>{awaiting.length}</strong><small>{ready.length} with Claude feedback ready</small></div>
          <div><span>Teacher reviewed</span><strong>{rows.filter(r => r.status === 'rated').length}</strong><small>All targets rated for this submission</small></div>
        </section>
        {!activities.length ? <section className={s.empty}><CalendarDays size={32}/><h2>No simulation assignments in this class yet</h2><p>Assign an investigation on the calendar. Student results and Claude feedback will appear here as work is submitted.</p><Link href={'/admin/interactive-assignments?class=' + course}>Open assignment calendar <ArrowUpRight size={16}/></Link></section> : <>
          <div className={s.insightGrid}>
            <section className={s.panel}><div className={s.sectionHeading}><div><p className={s.eyebrow}>Plan your next conversation</p><h2>Questions to revisit</h2></div><ClipboardCheck size={22} aria-hidden="true"/></div><p className={s.note}>Ranked by students with an incorrect, partial, or unclear response. Pending analysis and predictions are excluded. Open a question to compare answers.</p>
              {gaps.length ? <ol className={s.gaps}>{gaps.slice(0, 6).map(g => <li key={g.slug + g.id}><button onClick={() => open(g.slug, '', g.id)}><span className={s.gapCount}><b>{g.needsReview}</b><small>of {g.assessed}</small></span><span><small>{g.title} · {g.id}</small><strong>{g.prompt}</strong></span><ArrowUpRight size={17}/></button></li>)}</ol> : <p className={s.emptyText}>{submitted.length ? 'No gaps flagged in the responses assessed so far. Open an investigation to inspect the evidence.' : 'Question patterns appear after students submit.'}</p>}
            </section>
            <section className={s.panel}><p className={s.eyebrow}>Your decisions</p><h2>Mastery you have recorded</h2><p className={s.note}>Teacher ratings on current submissions, counted by target. Claude suggestions are not included.</p><div className={s.levels}>{['1 · Not yet', '2 · Almost', '3 · Got it'].map((label, i) => <div key={label}><span>{label}</span><strong>{levels[i]}</strong><progress aria-label={label + ' teacher ratings'} max={Math.max(1, levels.reduce((a, b) => a + b, 0))} value={levels[i]}/></div>)}</div><div className={s.evidenceNote}><strong>{activities.reduce((n, a) => n + a.noTrials, 0)} submissions without recorded trials</strong><p>Check the written evidence before deciding whether more investigation work is needed. A missing trial table is not an automatic mastery score.</p></div></section>
          </div>
          <section className={s.panel}><div className={s.sectionHeading}><div><p className={s.eyebrow}>Open an investigation</p><h2>Assignment results</h2></div><span className={s.note}>{activities.length} assigned</span></div><div className={s.tableWrap} tabIndex={0} role="region" aria-label="Simulation assignment results"><table><thead><tr><th>Investigation</th><th>Submitted</th><th>In progress</th><th>Awaiting you</th><th>Claude ready</th><th>Teacher rated</th><th>Review</th></tr></thead><tbody>{activities.map(a => <tr key={a.assignment.id}><th scope="row"><button className={s.titleButton} onClick={() => open(a.assignment.slug)}>{a.title.split(' · ')[0]}</button><small>{a.group}{a.assignment.due_on ? ' · Due ' + new Date(a.assignment.due_on + 'T12:00:00').toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : ' · Unscheduled'}</small></th><td>{a.submitted} / {a.roster}</td><td>{a.drafts}</td><td>{a.awaiting}</td><td>{a.aiReady}{a.aiErrors > 0 && <small>{a.aiErrors} need retry</small>}</td><td>{a.rated}</td><td><button onClick={() => open(a.assignment.slug)} aria-label={'Review ' + a.title}>Open <ArrowUpRight size={15}/></button></td></tr>)}</tbody></table></div></section>
          <section className={s.panel}><p className={s.eyebrow}>Follow the evidence</p><h2>Student work</h2><div className={s.filters}><label htmlFor="results-search"><Search size={16} aria-hidden="true"/><input id="results-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a student or investigation"/></label><label htmlFor="results-status">Status<select id="results-status" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All work</option><option value="review">Awaiting teacher</option><option value="rated">Teacher rated</option><option value="draft">In progress / revision</option><option value="not-started">Not started</option><option value="error">Claude retry needed</option></select></label></div><p className={s.note}>Counts below describe submitted evidence, not mastery levels. Drafts and returned work do not contribute to class answer patterns.</p><div className={s.tableWrap} tabIndex={0} role="region" aria-label="Student simulation results"><table><thead><tr><th>Student / investigation</th><th>Status</th><th>Claude</th><th>Responses to review</th><th>Recorded trials</th><th>Teacher targets</th><th>Evidence</th></tr></thead><tbody>{visible.map(r => <tr key={r.assignmentId + r.studentId}><th scope="row"><button className={s.titleButton} onClick={() => open(r.slug, r.studentId)}>{r.name}</button><small>{assignmentBySlug(r.slug)?.title.split(' · ')[0]}</small></th><td><span className={s.status} data-status={r.status}>{statusLabels[r.status]}</span></td><td>{aiLabels[r.analysis]}</td><td>{r.trials === null ? '—' : r.responsesToReview}{r.pendingResponses > 0 && <small>{r.pendingResponses} awaiting assessment</small>}</td><td>{r.trials ?? '—'}</td><td>{r.ratedTargets} / {r.totalTargets}</td><td><button onClick={() => open(r.slug, r.studentId)} aria-label={'Open work for ' + r.name}>Open <ArrowUpRight size={15}/></button></td></tr>)}</tbody></table>{!visible.length && <p>No work matches these filters.</p>}</div></section>
        </>}
      </>}
    </>}
  </main>
}
