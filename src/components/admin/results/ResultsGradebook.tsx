'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Download, RefreshCw, ChevronRight } from 'lucide-react'
import { useLearningResource } from '@/app/home/useLearningWeek'
import { assessmentCenterHref, assessmentResultHref } from '@/lib/assessment-center'
import { filterResults } from '@/lib/assessment-results/model'
import { RESULT_KINDS, type ResultsData } from '@/lib/assessment-results/types'
import { quizCsv } from '@/lib/quizzes/insights'
import ResultEvidencePanel, { type LessonEvidenceReview } from './ResultEvidencePanel'
import s from './ResultsGradebook.module.css'

const AI_LABELS = { queued: 'Claude queued', processing: 'Claude analyzing', ready: 'Claude ready', error: 'Claude retry needed', none: '' }

export default function ResultsGradebook({ classId, unitId, targets, onReviewLesson, onSaved }: { classId: string | null; unitId: string; targets: { id: string; statement: string }[]; onReviewLesson: LessonEvidenceReview; onSaved: () => void }) {
  if (!classId) return <section className={s.empty}><h2>Choose a class to see its results</h2><p>The same class selection carries into every assignment and the mastery overview.</p></section>
  if (unitId === 'auto') return <p role="status">Finding this class’s current unit…</p>
  return <ClassResults key={classId + ':' + unitId} classId={classId} unitId={unitId} targets={targets} onReviewLesson={onReviewLesson} onSaved={onSaved} />
}

function ClassResults({ classId, unitId, targets, onReviewLesson, onSaved }: { classId: string; unitId: string; targets: { id: string; statement: string }[]; onReviewLesson: LessonEvidenceReview; onSaved: () => void }) {
  const params = useSearchParams(), router = useRouter(), search = params.toString()
  const { data, loading, error, refresh } = useLearningResource<ResultsData>('/api/assessment-results?' + new URLSearchParams({ class: classId, unit: unitId }))
  const [evidence, setEvidence] = useState<{ key: string; student?: string } | null>(null)
  const openEvidence = (event: React.MouseEvent, activity: ResultsData['activities'][number], student?: string) => { if (['vocabulary', 'math', 'video', 'reflection', 'choice'].includes(activity.kind)) { event.preventDefault(); setEvidence({ key: activity.key, student }) } }
  const selectedActivity = data?.activities.find(a => a.key === evidence?.key)
  const kind = params.get('resultKind') || 'all', needsReview = params.get('resultReview') === '1', query = params.get('resultQuery') || '', student = params.get('resultStudent') || '', archived = params.get('resultArchived') === '1'
  const update = (name: string, value: string) => { const next = new URLSearchParams(search); if (value) next.set(name, value); else next.delete(name); router.replace('?' + next, { scroll: false }) }
  const visible = useMemo(() => filterResults(data?.activities ?? [], data?.students ?? [], { kind, needsReview, query, student, archived }), [data, kind, needsReview, query, student, archived])
  const pendingAi = data?.activities.some(a => Object.values(a.cells).some(c => c.assessment === 'queued' || c.assessment === 'processing'))
  useEffect(() => { if (!pendingAi) return; const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 15000); return () => clearInterval(timer) }, [pendingAi, refresh])
  const positionKey = 'assessment-results-scroll:' + new URLSearchParams({ class: classId, unit: unitId, kind, needsReview: String(needsReview), student, query, archived: String(archived) })
  const scroll = useRef<HTMLDivElement>(null)
  useEffect(() => { try { const value = JSON.parse(sessionStorage.getItem(positionKey) || 'null'); if (scroll.current && value && Number.isFinite(value.left) && Number.isFinite(value.top)) { scroll.current.scrollLeft = value.left; scroll.current.scrollTop = value.top } } catch { /* Storage is optional. */ } }, [positionKey, data])
  const remember = () => { try { if (scroll.current) sessionStorage.setItem(positionKey, JSON.stringify({ left: scroll.current.scrollLeft, top: scroll.current.scrollTop })) } catch { /* Storage is optional. */ } }
  const resultHref = (activity: ResultsData['activities'][number], learner?: string) => assessmentResultHref(activity.kind, activity.sourceId, classId, search, learner)
  const selected = data?.students.find(s => s.id === student)
  const mappingSearch = new URLSearchParams(search)
  for (const key of ['resultKind', 'resultReview', 'resultStudent', 'resultQuery']) mappingSearch.delete(key)
  mappingSearch.set('unit', unitId === 'unmapped' ? 'all' : 'unmapped')
  mappingSearch.set('resultArchived', '1')
  function download() {
    const rows = [['Student', ...visible.activities.map(a => a.title)], ...visible.students.map(st => [st.name, ...visible.activities.map(a => a.cells[st.id]?.label ?? 'Not assigned')])]
    const url = URL.createObjectURL(new Blob([quizCsv(rows)], { type: 'text/csv;charset=utf-8;' })), link = document.createElement('a')
    link.href = url; link.download = 'assignment-results.csv'; link.click(); URL.revokeObjectURL(url)
  }
  return <section className={s.results} aria-label="Assignment gradebook">
    <div className={s.toolbar}>
      <label className={s.search}>Find a student<input type="search" value={query} onChange={e => update('resultQuery', e.target.value)} placeholder="Student name…" /></label>
      <label>Activity type<select value={kind} onChange={e => update('resultKind', e.target.value)}><option value="all">All connected activities</option>{Object.entries(RESULT_KINDS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <button type="button" aria-pressed={needsReview} onClick={() => update('resultReview', needsReview ? '' : '1')}>Needs review <strong>{!data ? loading ? '…' : '—' : visible.pending}{data?.warnings.length || error && data ? '+' : ''}</strong></button>
      <button type="button" onClick={refresh} disabled={loading} aria-label="Refresh assignment results"><RefreshCw size={16} /></button>
      <button type="button" disabled={!visible.activities.length || !visible.students.length || error || !!data?.warnings.length} onClick={download}><Download size={16} /> Export</button>
    </div>
    {error && <p role="alert" className={s.alert}>Results could not refresh. {data ? 'Previously loaded results remain below.' : 'No results have loaded.'} <button onClick={refresh}>Try again</button></p>}
    {data?.warnings.map(w => <p role="alert" className={s.alert} key={w.source}><strong>{w.source}:</strong> {w.message}</p>)}
    <header className={s.heading}><div><h2>{selected ? selected.name + ' · Assignment results' : 'Gradebook'}</h2><p>{visible.students.length} {visible.students.length === 1 ? 'student' : 'students'} · {visible.activities.length} {visible.activities.length === 1 ? 'activity' : 'activities'}{loading ? ' · Refreshing…' : ''}</p></div>{selected && <button onClick={() => update('resultStudent', '')}>All students</button>}</header>
    {student && !selected && data && <p className={s.alert}>This student is not in the current class roster. <button onClick={() => update('resultStudent', '')}>Show class</button></p>}
    {data && data.unmapped > 0 && <p className={s.note}>{data.unmapped} {data.unmapped === 1 ? 'activity needs' : 'activities need'} a unit mapping. <Link href={assessmentCenterHref('results', null, classId, mappingSearch.toString())}>{unitId === 'unmapped' ? 'Show all units' : 'Inspect unmapped activities'}</Link></p>}
    {loading && !data ? <p role="status">Loading assignment results…</p> : !data ? null : !visible.activities.length ? <div className={s.empty}><h3>{data.warnings.length ? 'Some results are unavailable' : needsReview ? 'No work needs review in this selection' : 'No connected assignments match this selection'}</h3><p>Try another unit or activity type. Math competencies span the school year; other activities follow their linked unit.</p></div> : <div ref={scroll} onScroll={remember} className={s.tableWrap} tabIndex={0} role="region" aria-label="Scrollable assignment results">
      <table><caption className="sr-only">Select an activity title for its dashboard, a student for their cross-activity results, or a cell for the original work. Unmet choice requirements receive one zero per missing choice after the deadline.</caption><thead><tr><th scope="col">Student</th>{visible.activities.map(a => <th scope="col" key={a.key}><small>{RESULT_KINDS[a.kind]}{a.archived ? ' · Archived' : ''}</small><Link data-quiz-leave data-reading-leave href={resultHref(a)} onClick={e => { remember(); openEvidence(e, a) }}>{a.title}</Link><span>{a.crossUnit ? 'Year-long evidence' : a.dueAt ? new Date(a.dateOnly ? a.dueAt + 'T12:00:00' : a.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date'}</span></th>)}</tr></thead><tbody>{visible.students.map(st => <tr key={st.id}><th scope="row"><button type="button" onClick={() => { remember(); update('resultStudent', st.id) }}>{st.name}<ChevronRight size={14} /></button></th>{visible.activities.map(a => { const cell = a.cells[st.id]; return <td key={a.key} data-state={cell?.state} data-review={cell?.needsReview || undefined}>{cell ? <Link href={resultHref(a, st.id)} onClick={e => { remember(); openEvidence(e, a, st.id) }} aria-label={`${st.name}, ${a.title}: ${cell.label}`}><strong>{cell.label}</strong>{cell.detail && <small>{cell.detail}</small>}{cell.assessment && AI_LABELS[cell.assessment] && <small>{AI_LABELS[cell.assessment]}</small>}</Link> : <span aria-label="Not assigned">—</span>}</td> })}</tr>)}</tbody></table>
      {!visible.students.length && <p className={s.empty}>No students match these filters.</p>}
    </div>}
    <footer className={s.footer}><span>Activity grades keep their own scales. Mastery uses your recorded target decisions.</span><label><input type="checkbox" checked={archived} onChange={e => update('resultArchived', e.target.checked ? '1' : '')} /> Include archived assignments</label></footer>
    <p className={s.coverage}>Connected: interactive lessons, simulations, quizzes, readings, reviews, vocabulary, math, videos, reflections, chapter responses, and student choices. Viewing percentages measure participation; mastery uses teacher decisions.</p>
    {selectedActivity && evidence && data && <ResultEvidencePanel key={evidence.key + evidence.student} activity={selectedActivity} students={data.students} studentId={evidence.student} classId={classId} unitId={unitId} targets={data.targets ?? targets} onClose={() => setEvidence(null)} onSaved={() => { refresh(); onSaved() }} onReviewLesson={onReviewLesson} />}
  </section>
}
