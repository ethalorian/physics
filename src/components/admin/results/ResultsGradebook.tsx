'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Download, RefreshCw } from 'lucide-react'
import { useLearningResource } from '@/app/home/useLearningWeek'
import { assessmentResultHref } from '@/lib/assessment-center'
import { filterResults, submissionReviewQueue } from '@/lib/assessment-results/model'
import { RESULT_KINDS, type ResultActivity, type ResultsData } from '@/lib/assessment-results/types'
import { completion, entryChanged, gradeBand, gradebookStatus, quizTotal, releasedGrade, sortRoster, type EntryMark } from '@/lib/assessment-results/gradebook'
import { quizCsv } from '@/lib/quizzes/insights'
import type { LessonEvidenceReview } from './ResultEvidencePanel'
import dynamic from 'next/dynamic'
import {reviewableActivities} from '@/lib/review-desk/types'
const MeaningfulAttendance = dynamic(() => import('./MeaningfulAttendance'))
const AssignmentReviewDesk = dynamic(() => import('@/components/review-desk/AssignmentReviewDesk'))
import AspenEntry, { markKey, type EntryMarks } from './AspenEntry'
import AutomaticGradingStatus from './AutomaticGradingStatus'
import { GradeBadge, GradeScale } from './GradeDisplay'
import AssignmentIdentity from '@/components/AssignmentIdentity'
import { sourceTypeOptions, matchesSourceType } from '@/lib/assignment-source-presentation'
import s from './ResultsWorkspace.module.css'
import ResultsMatrix from './ResultsMatrix'
import { gradebookSummaries } from '@/lib/assessment-results/render-summaries'

const AI_LABELS = { queued: 'Antocci suggestions queued', processing: 'Antocci is reviewing', ready: 'Antocci suggests · Private', error: 'Antocci suggestions need a retry', none: 'Teacher review' }
export default function ResultsGradebook(props: { classId: string | null; physics?: boolean; unitId: string; targets: { id: string; statement: string }[]; onReviewLesson: LessonEvidenceReview; onSaved: () => void }) {
  const params = useSearchParams()
  if (!props.classId) return <section className={s.empty}><h2>Choose a class to see its results</h2></section>
  if (props.physics && params.get('resultView')==='attendance') {
    const back = new URLSearchParams(params.toString()); back.delete('resultView')
    return <MeaningfulAttendance key={props.classId} course={props.classId} initialTerm={params.get('resultTerm')} backHref={'?'+back}/>
  }
  if (props.unitId === 'auto') return <p role="status">Finding this class’s current unit…</p>
  return <ClassResults key={props.classId + ':' + props.unitId} {...props} classId={props.classId}/>
}
function ClassResults({ classId, unitId, physics, onSaved }: { classId: string; physics?: boolean; unitId: string; targets: { id: string; statement: string }[]; onReviewLesson: LessonEvidenceReview; onSaved: () => void }) {
  const params = useSearchParams(), router = useRouter(), search = params.toString(), { data: session } = useSession()
  const termId = params.get('resultTerm') || 'all'
  const resource = useLearningResource<ResultsData>('/api/assessment-results?' + new URLSearchParams({ class: classId, unit: unitId, term: termId }))
  const { loading, error, refresh } = resource
  const data = resource.data?.gradingTermId === termId || !resource.data?.gradingTermId && termId === 'all' ? resource.data : null
  const [evidence, setEvidence] = useState<{ key: string; student?: string; submission?:string } | null>(null)
  const [display, setDisplay] = useState<'percent' | 'points'>('percent'), [order, setOrder] = useState<'last' | 'first'>('last'), [assignmentOrder, setAssignmentOrder] = useState('due')
  const [marks, setMarks] = useState<EntryMarks>({}), [storageReady, setStorageReady] = useState(false), [storageError, setStorageError] = useState('')
  const storageKey = session?.user?.email ? `aspen-entry:v1:${session.user.email}:${classId}` : ''
  useEffect(() => {
    setStorageReady(false); setMarks({}); setStorageError('')
    if (!storageKey) return
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) setMarks(saved); setStorageReady(true) }
    catch { setStorageError('Entry checkmarks could not be loaded. Browser storage must be available to save your place.') }
  }, [storageKey])
  function saveMark(key: string, value?: EntryMark) {
    if (!storageKey || !storageReady) return false
    const next = { ...marks }; if (value) next[key] = value; else delete next[key]
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setMarks(next); setStorageError(''); return true }
    catch { setStorageError('Your entry checkmark was not saved. Browser storage is unavailable; keep track in Aspen before continuing.'); return false }
  }
  const view = params.get('resultView') || 'overview', kind = params.get('resultKind') || 'all', urlQuery = params.get('resultQuery') || '', archived = params.get('resultArchived') === '1'
  const [queryDraft, setQueryDraft] = useState({ search, value: urlQuery })
  const query = queryDraft.search === search ? queryDraft.value : urlQuery
  const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelQuery = useCallback(() => { if (queryTimer.current !== null) clearTimeout(queryTimer.current); queryTimer.current = null }, [])
  useEffect(() => { cancelQuery(); return cancelQuery }, [search, cancelQuery])
  const replaceFilters = useCallback((values: Record<string, string>) => {
    const next = new URL(window.location.href)
    Object.entries(values).forEach(([name, value]) => { if (value) next.searchParams.set(name, value); else next.searchParams.delete(name) })
    // These filters belong to this client workspace; keep deep links without a server navigation.
    window.history.replaceState(null, '', next.pathname + next.search + next.hash)
  }, [])
  const update = useCallback((values: Record<string, string>) => { cancelQuery(); replaceFilters({ resultQuery: query, ...values }) }, [cancelQuery, replaceFilters, query])
  const changeQuery = (value: string) => {
    cancelQuery(); setQueryDraft({ search, value })
    const location = window.location.pathname + window.location.search
    queryTimer.current = setTimeout(() => {
      queryTimer.current = null
      if (window.location.pathname + window.location.search === location) replaceFilters({ resultQuery: value })
    }, 200)
  }
  const assignments = useMemo(() => (data?.activities ?? []).filter(a => !a.crossUnit), [data])
  const visible = useMemo(() => filterResults(assignments.filter(a => matchesSourceType(a,kind)), data?.students ?? [], { kind: 'all', query, archived }), [assignments,data,kind,query,archived])
  const activities = useMemo(() => [...visible.activities].sort((a,b) => assignmentOrder === 'title' ? a.title.localeCompare(b.title) : (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999') || a.title.localeCompare(b.title)), [visible.activities, assignmentOrder])
  const students = useMemo(() => sortRoster(visible.students, order), [visible.students, order])
  const allCompletion = useMemo(() => completion(assignments), [assignments])
  const summaries = useMemo(() => gradebookSummaries(activities, assignments, view === 'gradebook' ? students : [], data), [activities, assignments, students, data, view])
  const totalFor = (id: string) => data?.termQuizTotals?.[id] ?? (data?.warnings.some(w => w.source === 'Grading terms') ? { earned: 0, possible: 0, percent: null, count: 0 } : quizTotal(assignments, id))
  const reviewActivities = useMemo(() => (data?.activities ?? []).filter(a => (archived || !a.archived) && matchesSourceType(a,kind)), [data, archived, kind])
  const pending = useMemo(() => submissionReviewQueue(reviewActivities,students), [reviewActivities, students])
  useEffect(()=>{if(!data)return;const count=submissionReviewQueue(data.activities.filter(a=>!a.archived),data.students).length;window.dispatchEvent(new CustomEvent('results-review-count',{detail:{classId,unitId,count}}))},[data,classId,unitId])
  const selectedActivity = useMemo(() => data && evidence ? reviewableActivities(data.activities).find(a => a.key === evidence.key) : null, [data, evidence])
  const pendingAi = useMemo(() => data?.activities.some(a => Object.values(a.cells).some(c => c.assessment === 'queued' || c.assessment === 'processing')), [data])
  useEffect(() => { if (!pendingAi) return; const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 15000); return () => clearInterval(timer) }, [pendingAi, refresh])
  const open = useCallback((a: ResultActivity, student?: string, submission?:string) => { if (a.kind === 'worksheet' || a.kind === 'student_choice') router.push(assessmentResultHref(a.kind, a.sourceId, classId, search, student), { scroll: false }); else {const child=a.evidenceActivities?.find(item=>student?item.cells[student]?.needsReview:Object.values(item.cells).some(c=>c.needsReview));setEvidence({ key: child?.key??a.key, student, submission:child?undefined:submission })} }, [classId, search, router])
  const enter = useCallback((a: ResultActivity) => update({ resultView: 'entry', resultAssignment: a.key }), [update])
  function download() {
    const rows = [['Student','Completed','Assigned','Term quiz percent (all units)',...activities.flatMap(a => [a.title + ' points',a.title + ' percent',a.title + ' letter',a.title + ' status'])], ...students.map(st => { const c = completion(assignments,st.id), total = totalFor(st.id); return [st.name,String(c.completed),String(c.assigned),total.percent?.toFixed(1) ?? '',...activities.flatMap(a => { const g = releasedGrade(a.cells[st.id]); return [g ? String(g.earned) : '',g?.percent.toFixed(1) ?? '',g?.letter ?? '',gradebookStatus(a.cells[st.id])] })] })]
    const url = URL.createObjectURL(new Blob([quizCsv(rows)],{type:'text/csv;charset=utf-8;'})), a = document.createElement('a'); a.href = url; a.download = 'assignment-gradebook.csv'; a.click(); URL.revokeObjectURL(url)
  }
  const stale = !!error || !!data?.warnings.length
  return <section className={s.workspace} aria-label="Results workspace"><AutomaticGradingStatus/>
    <div className={s.toolbar}>
      <label>Grading term<select value={termId} onChange={e => update({ resultTerm: e.target.value, resultAssignment: '', resultReviewAssignment: '' })}><option value="all">All terms</option>{data?.gradingSettings?.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}{termId !== 'all' && termId !== 'unassigned' && !data?.gradingSettings?.terms.some(t => t.id === termId) && <option value={termId}>Selected term</option>}<option value="unassigned">No matching term</option></select></label>
      <label>Activity type<select value={kind} onChange={e => update({resultKind:e.target.value})}><option value="all">All assignment types</option>{sourceTypeOptions((data?.activities ?? []).filter(a => !a.crossUnit || view === 'review')).map(([id,label]) => <option key={id} value={id}>{label}</option>)}{kind !== 'all' && !kind.startsWith('type:') && <option value={kind}>{RESULT_KINDS[kind as keyof typeof RESULT_KINDS] ?? kind} · all related types</option>}</select></label>
      {view !== 'overview' && <label>Find a student<input type="search" value={query} onChange={e => changeQuery(e.target.value)} placeholder="Student name…"/></label>}
      {view === 'overview' ? <label>Assignment order<select value={assignmentOrder} onChange={e => setAssignmentOrder(e.target.value)}><option value="due">Due date</option><option value="title">Title</option></select></label> : <label>Roster order<select value={order} onChange={e => setOrder(e.target.value as 'last'|'first')}><option value="last">Last name, first name</option><option value="first">First name</option></select></label>}
      <div className={s.completion}><strong>{allCompletion.completed} / {allCompletion.assigned}</strong><span>All unit work completed</span></div>
      {physics && <button type="button" className={s.button} onClick={()=>update({resultView:'attendance'})}>Meaningful attendance</button>}
      <Link className={s.textButton} href={'/admin/students?' + new URLSearchParams({ view: 'settings', section: 'grading-terms', class: classId })}>Manage grading terms</Link><button className={s.button} onClick={refresh} disabled={loading} aria-label="Refresh results"><RefreshCw size={15}/></button><button className={s.button} onClick={download} disabled={!data || stale}><Download size={15}/> Export</button>
    </div>
    {error && <p role="alert" className={s.alert}>Results could not refresh. {data ? 'Previously loaded results remain below.' : 'No results have loaded.'} <button onClick={refresh}>Try again</button></p>}
    {data?.warnings.map(w => <p role="alert" className={s.alert} key={w.source}><strong>{w.source}:</strong> {w.message}</p>)}
    {storageError && <p role="alert" className={s.alert}>{storageError}</p>}
    {data && data.unmapped > 0 && <p className={s.note}>{data.unmapped} activities need a unit mapping. <button onClick={() => update({unit: unitId === 'unmapped' ? 'all' : 'unmapped',resultKind:'all'})}>Inspect mappings</button></p>}
    {loading && !data ? <p role="status">Loading results…</p> : data && <>
      {view === 'entry' ? <AspenEntry activities={activities} students={students} assignment={params.get('resultAssignment') ?? ''} onAssignment={id => update({resultAssignment:id})} marks={marks} onMark={saveMark} disabled={stale || !storageReady} onBack={() => update({resultView:'gradebook'})} onReview={open}/> : <>
      <header className={s.heading}><div><h2>{view === 'overview' ? 'Assignment overview' : view === 'review' ? 'Review before release' : 'Gradebook'}</h2><p>{students.length} students · {activities.length} assignments · <span className={s.pending}>{pending.length} submissions need review</span>{loading ? ' · Refreshing…' : ''}</p></div>{view === 'gradebook' && <div className={s.toggle}><button aria-pressed={display === 'percent'} onClick={() => setDisplay('percent')}>Percentages</button><button aria-pressed={display === 'points'} onClick={() => setDisplay('points')}>Points</button></div>}<GradeScale/></header>
      {view === 'overview' && <div className={s.scroll} tabIndex={0} role="region" aria-label="Assignment overview"><table className={s.overview}><thead><tr><th>Assignment</th><th>Due</th><th>Completed / assigned</th><th>Class average</th><th title="Students who have received a final review, mastery result, or grade. Each student counts once.">Released / assigned</th><th>Review</th><th>Aspen entry</th></tr></thead><tbody>{activities.map(a => {
        const stats = summaries.activities.get(a.key)!, changed = students.filter(st => entryChanged(marks[markKey(a.key,st.id)],releasedGrade(a.cells[st.id]))).length
        return <tr key={a.key} data-tone={gradeBand(stats.average)}><th><button className={s.assignment} onClick={() => open(a)}><AssignmentIdentity source={a}/></button><small>{a.kind==='worksheet'?' · Completion only':''}{a.archived ? ' · Archived' : ''}</small>{a.pairedKey&&<button className={s.textButton} onClick={()=>{const paired=data.activities.find(p=>p.key===a.pairedKey);if(paired)open(paired)}}>{a.kind==='worksheet'?'Worksheet quiz':'Paper worksheet'} →</button>}</th><td>{summaries.activities.get(a.key)!.due}</td><td><strong>{stats.completed} / {stats.assigned}</strong><small>{stats.assigned ? Math.round(100*stats.completed/stats.assigned) : 0}% complete</small></td><td><GradeBadge percent={stats.average}/><small>{a.kind==='worksheet'?'Completion only':stats.scored ? 'Released grades' : 'No released score'}</small></td><td>{stats.released} / {stats.assigned}</td><td>{a.kind==='worksheet'?<button className={s.textButton} onClick={()=>open(a)}>Record paper →</button>:stats.pending ? <button className={s.pendingButton} onClick={() => open(a)}>{stats.pending} awaiting review →</button> : <span className={s.muted}>None waiting</span>}</td><td><button className={s.textButton} disabled={!stats.scored} onClick={() => enter(a)}>Enter {stats.scored} scores →</button>{changed > 0 && <small className={s.pending}>{changed} changed since entry</small>}</td></tr>
      })}</tbody></table>{!activities.length && <p className={s.empty}>No assignments match this selection.</p>}</div>}
      {view === 'gradebook' && <>
        <p className={s.note}>Quiz totals use released earned / possible points for the selected term across all units. Assignment columns follow the unit filter. Submitted work counts toward completion while awaiting review.</p>
        <ResultsMatrix activities={activities} students={students} summaries={summaries} display={display} classId={classId} termId={termId} onOpen={open} onEnter={enter}/>
        <p className={s.legend}><span data-tone="high">80–100%</span><span data-tone="mid">60–79.9%</span><span data-tone="low">Below 60%</span><span>— No released grade</span><span>Rows: overall quizzes · Columns: class average</span></p>
      </>}
      {view === 'review' && <>
        <div className={s.reviewNotice}><strong>Suggestions stay private until you release them.</strong><p>Check points, mastery ratings and feedback in each submission. Your decisions determine the released results.</p></div>
        {params.get('resultReviewAssignment') && <p className={s.note}>Showing one assignment. <button onClick={() => update({resultReviewAssignment:''})}>Show all pending work</button></p>}
        <div className={s.scroll} tabIndex={0} role="region" aria-label="Submission review queue"><table className={s.reviewTable}><thead><tr><th>Student</th><th>Assignment</th><th>Submitted</th><th>Suggestion status</th><th>Review</th></tr></thead><tbody>{pending.filter(p => !params.get('resultReviewAssignment') || p.activity.key === params.get('resultReviewAssignment')).map(({activity:a,student:st,cell:c,reviewId}) => <tr key={reviewId}><th><Link className={s.student} href={'/home/gradebook?'+new URLSearchParams({class:classId,student:st.id,term:termId})}>{st.name}</Link></th><td><AssignmentIdentity source={a}/></td><td>{c.submittedAt ? new Date(c.submittedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'}) : 'Submitted'}</td><td><span className={s.pending}>{AI_LABELS[c.assessment ?? 'none']}</span></td><td><button className={s.primary} onClick={() => open(a,st.id,c.submissionId)}>Review submission →</button></td></tr>)}</tbody></table>{!pending.filter(p => !params.get('resultReviewAssignment') || p.activity.key === params.get('resultReviewAssignment')).length && <p className={s.empty}>No submissions are waiting in this selection.</p>}</div>
      </>}
      </>}
    </>}
    <footer className={s.footer}><span>Completion and grades are separate. Excused work is excluded; ungraded work is never treated as zero.</span><label><input type="checkbox" checked={archived} onChange={e => update({resultArchived:e.target.checked ? '1' : ''})}/> Include archived assignments</label></footer>
    {selectedActivity && evidence && data && <AssignmentReviewDesk key={evidence.key + evidence.student} activities={reviewableActivities(data.activities)} students={data.students} initialActivity={selectedActivity.key} initialStudent={evidence.student} initialSubmission={evidence.submission} classId={classId} onClose={() => setEvidence(null)} onSaved={() => { refresh(); onSaved() }}/>}
  </section>
}
