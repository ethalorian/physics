'use client'

import { Button } from '@/components/ui/button'
import { bloomSummaries, mean, scopeAnalytics, studentSummaries } from '@/lib/analytics/model'
import type { AnalyticsDataset, AnalyticsFilter, StudentFocus } from '@/lib/analytics/types'
import { Delta, Empty, Metric, Panel, ScoreTrend, number, score, type Navigate } from './Shared'
import { BloomTable, SkillsTable, StudentTable } from './LearningTables'
import s from './analytics.module.css'

export function Overview({ data, focus, navigate }: { data: AnalyticsDataset; focus: StudentFocus; navigate: Navigate }) {
  const rows = studentSummaries(data), paired = rows.filter(r => r.paired).length
  const metrics = [
    { id: 'improving' as const, label: 'Improving', value: rows.filter(r => r.improving).length, detail: `Of ${paired} students with repeated ratings on the same skills.`, tone: 'up' as const },
    { id: 'attention' as const, label: 'Still struggling', value: rows.filter(r => r.attention).length, detail: 'At least one skill below 2.45 at both first and latest observation.', tone: 'down' as const },
    { id: 'missing' as const, label: 'Needs fresh evidence', value: rows.filter(r => r.missing).length, detail: 'No teacher mastery ratings during the selected period.' },
    { id: 'all' as const, label: 'Students in scope', value: rows.length, detail: `${data.classes.length} active classes · current enrollments.` },
  ]
  return <div className={s.stack}><div><h2 className={s.sectionTitle}>Where is learning moving?</h2><p className={s.muted}>Start with a signal. Follow it into the students, skills, and work behind it.</p></div><div className={s.metrics}>{metrics.map(m => <Metric key={m.id} {...m} selected={focus === m.id} onClick={() => navigate({ focus: m.id })} />)}</div><p className={s.muted}>Groups can overlap: a student may improve overall while still needing help with a specific skill.</p><div className={s.two}><ScoreTrend data={data} /><SkillsTable data={data} navigate={navigate} compact /></div><StudentTable key={focus} data={data} navigate={navigate} focus={focus} title={focus === 'improving' ? 'Students showing improvement' : focus === 'attention' ? 'Students with persistent skill gaps' : focus === 'missing' ? 'Students needing fresh evidence' : 'Students at a glance'} /></div>
}

export function Classes({ allData, filter, navigate, tab }: { allData: AnalyticsDataset; filter: AnalyticsFilter; navigate: Navigate; tab: string }) {
  const universe = scopeAnalytics(allData, { ...filter, classId: undefined }), data = scopeAnalytics(allData, filter)
  const selected = allData.classes.find(c => c.id === filter.classId)
  const rows = universe.classes.map(course => {
    const scope = scopeAnalytics(universe, { classId: course.id }), students = studentSummaries(scope)
    return { course, students, paired: students.filter(s => s.paired).length, improving: students.filter(s => s.improving).length,
      attention: students.filter(s => s.attention).length, missing: students.filter(s => s.missing).length,
      current: mean(students.flatMap(s => s.current === null ? [] : [s.current])), delta: mean(students.flatMap(s => s.delta === null ? [] : [s.delta])), blooms: bloomSummaries(scope) }
  })
  return <div className={s.stack}><Panel title="Compare classes" description="Same program and reporting period. Growth is averaged equally across students with repeated ratings; class rosters and taught skills may differ.">
    {!rows.length ? <Empty>No active classes match this program and teacher.</Empty> : <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Class</th><th>Current mastery</th><th>Growth</th><th>Improving</th><th>Persistent gaps</th><th>No recent ratings</th></tr></thead><tbody>{rows.map(row => <tr key={row.course.id}><td><Button variant={selected?.id === row.course.id ? 'secondary' : 'link'} className="px-2" onClick={() => navigate({ class: row.course.id, classTab: 'learning', student: null })}>{row.course.name}{row.course.section ? ` · ${row.course.section}` : ''}</Button><small>{row.students.length} students · {row.course.teacher}</small></td><td>{number(row.current, 2)} / 3</td><td><Delta value={row.delta} /><small>{row.paired} matched students</small></td><td>{row.improving} / {row.paired}<small>With repeat evidence</small></td><td>{row.attention} / {row.students.length}<small>Current roster</small></td><td>{row.missing} / {row.students.length}</td></tr>)}</tbody></table></div>}
  </Panel><Panel title="Bloom’s performance across classes" description="Latest score per student and question, normalized to 100%. Click a cell to inspect that class and Bloom’s process."><div className={s.tableWrap}><table className={s.table}><thead><tr><th>Class</th>{['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(b => <th key={b}>{b}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.course.id}><td>{row.course.name}<small>{row.course.section}</small></td>{row.blooms.map(b => <td key={b.bloom}><Button variant="ghost" onClick={() => navigate({ view: 'blooms', class: row.course.id, bloom: b.bloom })} aria-label={`${row.course.name}, ${b.bloom}: ${score(b.score)}`}>{b.score === null ? '—' : score(b.score)}</Button><small>{b.students} students · {b.scored} pairs</small></td>)}</tr>)}</tbody></table></div></Panel>
    {selected ? <><div className={s.heading}><div><p className={s.eyebrow}>Class detail</p><h2 className={s.sectionTitle}>{selected.name}{selected.section ? ` · ${selected.section}` : ''}</h2><p className={s.muted}>{selected.teacher} · {data.students.length} students · filters carry into student and skill views.</p></div><Button variant="outline" onClick={() => navigate({ class: null })}>All classes</Button></div><nav className={s.nav} aria-label="Class detail views">{[['learning', 'Learning & skills'], ['blooms', 'Bloom’s task growth']].map(([id, label]) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => navigate({ classTab: id })}>{label}</button>)}</nav>{tab === 'blooms' ? <><BloomTable data={data} navigate={navigate} /><ScoreTrend data={data} /></> : <><div className={s.equal}><SkillsTable data={data} navigate={navigate} compact /><StudentTable data={data} navigate={navigate} focus="attention" compact title="Students with persistent gaps" /></div><StudentTable data={data} navigate={navigate} title="Class roster & learning" /></>}</> : <Empty>Select a class above to open its students, skills, and learning history.</Empty>}
  </div>
}
