'use client'

import { useId, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AnalyticsDataset, StudentFocus } from '@/lib/analytics/types'
import { bloomSummaries, focusStudents, percent, questionSummaries, targetSummaries } from '@/lib/analytics/model'
import { Bar, Delta, Empty, Pages, Pair, Panel, date, number, score, type Navigate } from './Shared'
import s from './analytics.module.css'

export function StudentTable({ data, navigate, focus = 'all', title = 'Students', compact = false }: { data: AnalyticsDataset; navigate: Navigate; focus?: StudentFocus; title?: string; compact?: boolean }) {
  const [search, setSearch] = useState(''), searchId = useId()
  const rows = focusStudents(data, focus).filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
  return <Panel title={title} description="Growth uses repeated teacher ratings on the same skills within the selected period." action={<label className="sr-only" htmlFor={searchId}>Search {title.toLowerCase()}</label>}>
    <input id={searchId} className={s.search} placeholder="Find a student…" value={search} onChange={event => setSearch(event.target.value)} />
    {!rows.length ? <Empty>No students match this view. Try another focus or filter.</Empty> : <Pages key={`${search}:${focus}`} rows={rows} size={compact ? 6 : 12}>{page => <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Student</th><th>Current mastery</th><th>Growth</th><th>Needs attention</th></tr></thead><tbody>{page.map(row => <tr key={row.id}><td><Button variant="link" className="px-0" onClick={() => navigate({ view: 'students', student: row.id, studentTab: 'growth' })}>{row.name}<ArrowRight size={14} aria-hidden /></Button><small>{row.recent} ratings in period · {row.skills.length} rated skills</small></td><td>{number(row.current, 2)} / 3<small>{row.current === null ? 'No teacher ratings' : 'Recency-weighted'}</small></td><td><Delta value={row.delta} /><small>{row.paired} matched skills</small></td><td>{row.persistent ? <span className={s.down}>{row.persistent} persistent skill gaps</span> : row.missing ? 'No recent ratings' : 'No repeated gap flagged'}<small>{row.low} skills below 2.45 overall</small></td></tr>)}</tbody></table></div>}</Pages>}
  </Panel>
}

export function SkillsTable({ data, navigate, compact = false }: { data: AnalyticsDataset; navigate: Navigate; compact?: boolean }) {
  const rows = targetSummaries(data)
  return <Panel title={compact ? 'Skills needing attention' : 'Skill mastery & growth'} description="Teacher ratings · 1 Not yet / 2 Almost / 3 Got it. Open a skill to see its students and questions.">
    {!rows.length ? <Empty>No learning targets in this scope.</Empty> : <Pages rows={rows} size={compact ? 6 : 10}>{page => <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Skill</th><th>Current mastery</th><th>Repeated gaps</th>{!compact && <><th>Growth</th><th>Coverage</th></>}</tr></thead><tbody>{page.map(row => <tr key={row.id}><td><Button variant="link" className="px-0" onClick={() => navigate({ view: 'skills', skill: row.id, question: null })}>{row.statement}</Button><small>{row.slug}</small></td><td><div className={s.pair}><strong>{number(row.current, 2)} / 3</strong><Bar value={row.current} max={3} tone={row.current !== null && row.current < 2.45 ? 'down' : 'up'} /></div><small>{row.low} of {row.rated} rated students below 2.45</small></td><td><span className={row.persistent ? s.down : undefined}>{row.persistent} students</span></td>{!compact && <><td><Delta value={row.delta} /><small>{row.paired} matched students</small></td><td>{row.rated} / {data.students.length}<small>{row.missing} without a rating</small></td></>}</tr>)}</tbody></table></div>}</Pages>}
  </Panel>
}

export function BloomTable({ data, navigate }: { data: AnalyticsDataset; navigate: Navigate }) {
  return <Panel title="Growth across Bloom’s tasks" description="First and latest scores use matched student-question pairs. A different question or rubric is a separate comparison."><div className={s.tableWrap}><table className={s.table}><thead><tr><th>Bloom’s process</th><th>Latest scored work</th><th>Matched first → latest</th><th>Change & evidence</th></tr></thead><tbody>{bloomSummaries(data).map(row => <tr key={row.bloom}><td><Button variant="link" className="px-0" onClick={() => navigate({ view: 'blooms', bloom: row.bloom })}>{row.bloom}</Button><small>{row.students} students · {row.scored} scored pairs</small></td><td>{score(row.score)}<small>{row.unscored} submissions unscored</small></td><td className="min-w-44"><Pair first={row.first} latest={row.latest} /></td><td><Delta value={row.delta} percent /><small>{row.pairs} repeat pairs · {row.improved} improved</small></td></tr>)}</tbody></table></div></Panel>
}

export function QuestionsTable({ data, navigate, selected }: { data: AnalyticsDataset; navigate: Navigate; selected?: string }) {
  const rows = questionSummaries(data), question = data.questions.find(q => q.id === selected)
  const attempts = question ? data.questions.filter(q => q.questionKey === question.questionKey).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)) : []
  return <div className={s.stack}><Panel title="Question-level evidence" description="Ordered by lowest latest score. Unscored responses are shown separately from incorrect answers.">
    {!rows.length ? <Empty>No submitted quiz questions match these filters.</Empty> : <Pages rows={rows}>{page => <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Question</th><th>Bloom’s / DOK</th><th>Latest score</th><th>Repeated growth</th></tr></thead><tbody>{page.map(row => <tr key={row.key}><td><Button variant="link" className="px-0" onClick={() => navigate({ question: row.question.id })}>{row.question.prompt}</Button><small>{row.question.assessment}</small></td><td>{row.question.bloom ?? 'Not tagged'}<small>{row.question.dok ? `DOK ${row.question.dok}` : 'DOK not recorded'}</small></td><td>{score(row.score)}<small>{row.students} scored students · {row.unscored} unscored submissions</small></td><td><Delta value={row.delta} percent /><small>{row.pairs} repeat pairs</small></td></tr>)}</tbody></table></div>}</Pages>}
  </Panel>{selected && (!question ? <Empty>This question is outside the current filters. Clear the question selection or change your filters.</Empty> : <Panel title="Question & response history" description={question.assessment} action={<Button variant="outline" onClick={() => navigate({ question: null })}>Close question</Button>}>
    <p className={s.question}>{question.prompt}</p><div className={s.chips}><span className={s.chip}>{question.bloom ?? 'Bloom’s not tagged'}</span><span className={s.chip}>{question.possible} possible points</span><span className={s.chip}>{data.targets.find(t => t.id === question.targetId)?.slug ?? 'Skill not in growth inventory'}</span></div>
    <Pages rows={attempts} size={6}>{page => <div className={s.list}>{page.map(row => <article className={s.listItem} key={row.id}><div className={s.between}><Button variant="link" className="px-0" onClick={() => navigate({ view: 'students', student: row.studentId, studentTab: 'feedback' })}>{data.students.find(person => person.id === row.studentId)?.name ?? 'Student'}</Button><span className={s.muted}>Submitted {date(row.at)} · {score(percent(row))}</span></div><p className={s.quote}>{row.answer || 'No written answer recorded.'}</p>{row.feedback && <div className="mt-3"><p className={s.muted}>Teacher feedback · {date(row.reviewedAt)}</p><p className="whitespace-pre-wrap">{row.feedback}</p></div>}{row.score === null && <p className={s.muted}>Awaiting a recorded question score; excluded from score averages.</p>}</article>)}</div>}</Pages>
  </Panel>)}</div>
}
