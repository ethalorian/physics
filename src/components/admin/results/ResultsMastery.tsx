'use client'

import { useState } from 'react'
import Link from 'next/link'
import { studentLessonHref } from '@/lib/teaching-navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { useSearchParams } from 'next/navigation'
import { useLearningResource } from '@/app/home/useLearningWeek'
import { assessmentResultHref } from '@/lib/assessment-center'
import { RESULT_KINDS, type ResultsData, type ResultActivity, type ResultStudent } from '@/lib/assessment-results/types'
import ResultEvidencePanel, { type LessonEvidenceReview } from './ResultEvidencePanel'
import { levelWord } from '@/components/mastery/mastery-display'
import s from './ResultsGradebook.module.css'
import TargetDescription from './TargetDescription'

type Target = { id: string; statement: string; domain: string }
type Cell = { value: number | null; count: number }
export default function ResultsMastery({ classId, unitId, students, targets, cells, pending, onReviewLesson, onSaved }: {
  classId: string; unitId: string; students: ResultStudent[]; targets: Target[]; cells: Record<string, Record<string, Cell>>;
  pending: { studentId: string; targetId: string }[]; onReviewLesson: LessonEvidenceReview; onSaved: () => void;
}) {
  const params = useSearchParams()
  const { data, loading, error, refresh } = useLearningResource<ResultsData>('/api/assessment-results?' + new URLSearchParams({ class: classId, unit: unitId }))
  const mathOnly = params.get('masteryKind') === 'math'
  const [domain, setDomain] = useState('all'), [selected, setSelected] = useState<{ student: string; target: string } | null>(null)
  const [evidence, setEvidence] = useState<{ activity: ResultActivity; student: string } | null>(null)
  const [reviewedOnly, setReviewedOnly] = useState(false)
  const math = data?.activities.filter(a => a.kind === 'math') ?? []
  const columns = [...targets.map(t => ({ ...t, kind: 'target' as const, code: `T${targets.indexOf(t) + 1}` })), ...math.map(a => ({ id: a.sourceId, statement: a.code && a.title.startsWith(a.code + ' · ') ? a.title.slice(a.code.length + 3) : a.title, domain: 'math', code: a.code ?? 'Math', kind: 'math' as const }))].filter(t => mathOnly ? t.kind === 'math' : t.kind === 'target' && (domain === 'all' || domain === t.domain))
  const activitiesFor = (student: string, target: string) => (data?.activities ?? []).filter(a => a.cells[student] && (a.targetIds?.includes(target) || a.kind === 'math' && a.sourceId === target))
  const waiting = (student: string, target: string) => pending.some(p => p.studentId === student && p.targetId === target) || activitiesFor(student, target).some(a => a.cells[student].needsReview)
  const visibleStudents = reviewedOnly ? students.filter(st => columns.some(t => waiting(st.id, t.id))) : students
  const open = (activity: ResultActivity, student: string) => { setSelected(null); setEvidence({ activity, student }) }
  const saved = () => { refresh(); onSaved() }
  return <section className={s.results} aria-label={mathOnly ? "Math Spine mastery" : "Learning target mastery"}>
    <div className={s.toolbar}>{!mathOnly && <label>Target domain<select value={domain} onChange={e => setDomain(e.target.value)}><option value="all">All learning targets</option>{[...new Set(targets.map(t => t.domain))].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}</select></label>}<button aria-pressed={reviewedOnly} onClick={() => setReviewedOnly(!reviewedOnly)}>Only students needing review</button><button onClick={refresh} disabled={loading}>Refresh evidence</button></div>
    <p className={s.note}>Assignment responses and lab artifacts feed their linked learning targets. Math shows year-long competency mastery. All values use recorded teacher decisions on a 1–3 scale.</p>
    <ul className={s.masteryLegend} aria-label="Mastery rating colors">
      <li data-band="low" title="Averages below 1.5">1 · Not yet</li>
      <li data-band="mid" title="Averages from 1.5 to below 2.5">2 · Almost</li>
      <li data-band="high" title="Averages from 2.5 to 3">3 · Got it</li>
      <li data-band="none">— · Not rated</li>
    </ul>
    {error && <p role="alert" className={s.alert}>Activity evidence could not refresh. <button onClick={refresh}>Retry</button></p>}
    {data?.warnings.map(w => <p role="alert" key={w.source} className={s.alert}>{w.source}: {w.message}</p>)}
    {loading && !data && <p role="status">Loading assignment evidence…</p>}
    <div className={`${s.tableWrap} ${s.masteryTable}`} tabIndex={0} role="region" aria-label={mathOnly ? "Math Spine standards" : "Learning targets"}><table><caption className="sr-only">Teacher mastery by student. Select a cell to inspect all connected evidence. A review label identifies pending evidence.</caption><thead><tr><th scope="col">Student</th>{columns.map(t => <th key={t.id} scope="col"><small>{t.domain === 'math' ? 'Math · year-long' : t.domain}</small><TargetDescription code={t.code} statement={t.statement}/></th>)}</tr></thead><tbody>{visibleStudents.map(st => <tr key={st.id}><th scope="row">{st.name}</th>{columns.map(t => {
      const activity = math.find(a => a.sourceId === t.id), m = activity?.cells[st.id]
      const value = t.kind === 'math' ? m?.masteryValue : cells[st.id]?.[t.id]?.value, count = t.kind === 'math' ? m?.masteryCount ?? 0 : cells[st.id]?.[t.id]?.count ?? 0
      const needs = waiting(st.id, t.id)
      return <td key={t.id} data-review={needs || undefined}><button className={s.masteryValue} data-band={value == null ? 'none' : value >= 2.5 ? 'high' : value >= 1.5 ? 'mid' : 'low'} aria-label={`${st.name}, ${t.statement}: ${value == null ? 'not rated' : value.toFixed(2) + ' out of 3, ' + levelWord(value)}${needs ? ', needs review' : ''}`} onClick={() => t.kind === 'math' && activity ? open(activity, st.id) : setSelected({ student: st.id, target: t.id })}><strong>{value == null ? '—' : value.toFixed(2)}</strong><small>{needs ? '● Review evidence' : count ? `${count} observations` : 'Not rated'}</small></button></td>
    })}</tr>)}</tbody></table>{!visibleStudents.length && <p className={s.empty}>No students match this selection.</p>}</div>
    {selected && <Dialog.Root open onOpenChange={open => { if (!open) setSelected(null) }}><Dialog.Portal><Dialog.Overlay className={s.scrim}/><Dialog.Content className={s.targetPanel}><Dialog.Title>{students.find(st => st.id === selected.student)?.name} · Target evidence</Dialog.Title><Dialog.Description>{targets.find(t => t.id === selected.target)?.statement}</Dialog.Description><button onClick={() => setSelected(null)}>Close</button><div className={s.evidenceList}>
      {activitiesFor(selected.student, selected.target).map(a => <article key={a.key}><div><small>{RESULT_KINDS[a.kind]}</small><strong>{a.title}</strong><p>{a.cells[selected.student].label} · {a.cells[selected.student].detail}</p></div>{['vocabulary', 'video', 'math', 'reflection', 'choice', 'lesson', 'presentation'].includes(a.kind) ? <button onClick={() => open(a, selected.student)}>Review evidence</button> : <Link href={assessmentResultHref(a.kind, a.sourceId, classId, params.toString(), selected.student)}>Review evidence</Link>}</article>)}
      <Link href={studentLessonHref(classId, selected.student, '', unitId)}>View student lesson →</Link>
      <button onClick={() => { setSelected(null); onReviewLesson(selected.student, selected.target) }}>Classroom answers & rating history</button>
    </div></Dialog.Content></Dialog.Portal></Dialog.Root>}
    {evidence && <ResultEvidencePanel key={evidence.activity.key + evidence.student} activity={data?.activities.find(a => a.key === evidence.activity.key) ?? evidence.activity} students={students} studentId={evidence.student} classId={classId} unitId={unitId} targets={targets} onClose={() => setEvidence(null)} onSaved={saved} onReviewLesson={onReviewLesson} />}
  </section>
}
