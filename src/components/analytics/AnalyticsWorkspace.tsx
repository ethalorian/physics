'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Activity, BarChart3, BookOpen, Eye, GraduationCap, Layers, RefreshCw, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { BLOOMS } from '@/lib/assessment-demand'
import { scopeAnalytics } from '@/lib/analytics/model'
import type { AnalyticsDataset, AnalyticsFilter, AnalyticsView, StudentFocus } from '@/lib/analytics/types'
import { Blooms, Engagement, Guide } from './BloomsEngagement'
import { QuestionsTable, SkillsTable, StudentTable } from './LearningTables'
import { Classes, Overview } from './OverviewClasses'
import { StudentDetail } from './StudentDetail'
import { LearningImpact } from './LearningImpact'
import { date, type Navigate } from './Shared'
import s from './analytics.module.css'

const VIEWS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 }, { id: 'impact', label: 'Learning impact', icon: TrendingUp }, { id: 'classes', label: 'Classes', icon: Users },
  { id: 'students', label: 'Students', icon: GraduationCap }, { id: 'skills', label: 'Skills & questions', icon: Layers },
  { id: 'blooms', label: 'Bloom’s tasks', icon: BookOpen }, { id: 'engagement', label: 'Engagement', icon: Activity },
  { id: 'guide', label: 'How to read this', icon: Eye },
] as const

export default function AnalyticsWorkspace() {
  const params = useSearchParams(), router = useRouter(), pathname = usePathname(), body = useRef<HTMLElement>(null)
  const [data, setData] = useState<AnalyticsDataset | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0)
  const program = ['physics', 'trades', 'projects'].includes(params.get('program') ?? '') ? params.get('program')! : 'physics'
  const days = [7, 30, 90, 365].includes(Number(params.get('days'))) ? Number(params.get('days')) : 90
  const view = (VIEWS.some(v => v.id === params.get('view')) ? params.get('view') : 'overview') as AnalyticsView
  const studentId = params.get('student') ?? '', question = params.get('question') ?? undefined
  const focus = (['all', 'improving', 'attention', 'missing'].includes(params.get('focus') ?? '') ? params.get('focus') : 'all') as StudentFocus
  const filter: AnalyticsFilter = { classId: params.get('class') || undefined, teacher: params.get('teacher') || undefined, unitId: params.get('unit') || undefined, targetId: params.get('skill') || undefined }
  const bloom = BLOOMS.find(b => b === params.get('bloom')) ?? ''
  const navigate: Navigate = changes => {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key) }
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setError(''); setData(null)
    fetch(`/api/analytics/workspace?program=${program}&days=${days}`, { signal: abort.signal, cache: 'no-store' }).then(async response => {
      if (!response.ok) { const payload = await response.json().catch(() => null); throw Error(payload?.error ?? 'Analytics could not load. Please retry.') }
      return response.json() as Promise<AnalyticsDataset>
    }).then(result => { if (!abort.signal.aborted) setData(result) }).catch(cause => { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'Analytics could not load.') }).finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [program, days, revision])
  useEffect(() => { body.current?.focus({ preventScroll: true }) }, [view, studentId])
  const filtered = useMemo(() => data ? scopeAnalytics(data, { classId: filter.classId, teacher: filter.teacher, unitId: filter.unitId, targetId: filter.targetId }) : null, [data, filter.classId, filter.teacher, filter.unitId, filter.targetId])
  const studentData = useMemo(() => filtered && studentId ? scopeAnalytics(filtered, { studentId }) : null, [filtered, studentId])
  const learningData = studentData && (view === 'skills' || view === 'blooms') ? studentData : filtered
  const teachers = [...new Set(data?.classes.map(c => c.teacher).filter((t): t is string => !!t) ?? [])].sort()
  const classes = data?.classes.filter(c => !filter.teacher || c.teacher === filter.teacher) ?? []
  const skill = data?.targets.find(t => t.id === filter.targetId)
  const invalidClass = !!data && !!filter.classId && !classes.some(c => c.id === filter.classId)
  const invalidScope = invalidClass || !!data && !!filter.teacher && !teachers.includes(filter.teacher) || !!data && !!filter.unitId && !data.units.some(u => u.id === filter.unitId) || !!data && !!filter.targetId && (!skill || !!filter.unitId && skill.unitId !== filter.unitId)
  return <div className={s.workspace}>
    <header className={s.hero}><div><p className={s.eyebrow}>Learning observatory</p><h1 className="text-title-1">See the learning behind the numbers.</h1><p className={s.muted}>Find who is improving, where understanding is getting stuck, and what happens after feedback and practice.</p></div><div className={s.stack}><span className={s.badge}><Eye size={14} aria-hidden />Full analytics · read-only</span><Button variant="outline" onClick={() => setRevision(r => r + 1)} disabled={loading}><RefreshCw size={15} aria-hidden />Refresh data</Button></div></header>
    <div className={s.filters} aria-label="Analytics filters"><label className={s.field}><span>Program</span><select className={s.select} value={program} onChange={e => navigate({ program: e.target.value, class: null, teacher: null, unit: null, skill: null, student: null, question: null, bloom: null })}><option value="physics">Physics</option><option value="trades">Trades</option><option value="projects">Projects</option></select></label><label className={s.field}><span>Period</span><select className={s.select} value={days} onChange={e => navigate({ days: e.target.value, question: null })}>{[7, 30, 90, 365].map(day => <option value={day} key={day}>Last {day} days</option>)}</select></label><label className={s.field}><span>Teacher</span><select className={s.select} value={filter.teacher ?? ''} onChange={e => navigate({ teacher: e.target.value, class: null, student: null, question: null })}><option value="">All teachers</option>{teachers.map(t => <option key={t} value={t}>{t}</option>)}</select></label><label className={s.field}><span>Class</span><select className={s.select} value={filter.classId ?? ''} onChange={e => navigate({ class: e.target.value, student: null, question: null })}><option value="">All classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</option>)}</select></label><label className={s.field}><span>Unit</span><select className={s.select} value={filter.unitId ?? ''} onChange={e => navigate({ unit: e.target.value, skill: null, question: null })}><option value="">All units</option>{data?.units.map(u => <option value={u.id} key={u.id}>{u.name}</option>)}</select></label></div>
    {data && <div className={`${s.between} mt-3`}><p className={s.muted}>{date(data.from)}–{date(data.asOf)} · {filtered?.students.length} students in scope · current enrollments</p><div className={s.chips}>{bloom && (view === 'skills' || view === 'blooms') && <Button variant="secondary" onClick={() => navigate({ bloom: null, question: null })}>Bloom’s: {bloom} · Clear</Button>}{skill && <Button variant="secondary" onClick={() => navigate({ skill: null, question: null })}>Skill: {skill.slug} · Clear</Button>}{studentId && view !== 'students' && <><Button variant="outline" onClick={() => navigate({ view: 'students' })}>Return to {data.students.find(p => p.id === studentId)?.name ?? 'student'}</Button>{(view === 'skills' || view === 'blooms') && <Button variant="secondary" onClick={() => navigate({ student: null, question: null })}>Student filter · Clear</Button>}</>}{(filter.teacher || filter.classId || filter.unitId || filter.targetId) && <Button variant="ghost" onClick={() => navigate({ class: null, teacher: null, unit: null, skill: null, question: null })}>Clear filters</Button>}</div></div>}
    <nav className={s.nav} aria-label="Analytics views">{VIEWS.map(v => <button type="button" key={v.id} aria-current={view === v.id ? 'page' : undefined} onClick={() => navigate({ view: v.id, question: null, student: v.id === 'students' ? studentId : null })}><v.icon size={16} aria-hidden />{v.label}</button>)}</nav>
    <section ref={body} tabIndex={-1} className={s.body} aria-label={VIEWS.find(v => v.id === view)?.label} aria-busy={loading}>
      {view === 'guide' ? <Guide /> : loading ? <div className="flex min-h-72 items-center justify-center gap-3"><Spinner aria-label="Loading analytics" /><p className={s.muted}>Loading ratings, question evidence, and activity…</p></div> : error ? <div role="alert" className={s.error}><p>{error}</p><Button variant="outline" className="mt-3" onClick={() => setRevision(r => r + 1)}>Retry analytics</Button></div> : data && filtered ? invalidScope ? <div role="alert" className={s.notice}>A saved filter is no longer available in this program.<Button variant="outline" className="ml-3" onClick={() => navigate({ class: null, teacher: null, unit: null, skill: null, student: null, question: null })}>Reset filters</Button></div> : <>
        {view === 'overview' && <Overview data={filtered} focus={focus} navigate={navigate} />}
        {view === 'impact' && <LearningImpact data={filtered} days={[7, 14, 30].includes(Number(params.get('followup'))) ? Number(params.get('followup')) : 14} grouping={params.get('impactGroup') === 'bloom' ? 'bloom' : params.get('impactGroup') === 'dok' ? 'dok' : 'format'} selected={params.get('impactItem') ?? ''} selectedKind={params.get('impactKind') ?? 'assignment'} navigate={navigate} />}
        {view === 'classes' && <Classes allData={data} filter={filter} tab={params.get('classTab') === 'blooms' ? 'blooms' : 'learning'} navigate={navigate} />}
        {view === 'students' && (studentId && studentData ? <StudentDetail data={studentData} studentId={studentId} tab={['growth', 'blooms', 'feedback'].includes(params.get('studentTab') ?? '') ? params.get('studentTab')! : 'growth'} navigate={navigate} question={question} bloom={bloom} /> : <StudentTable data={filtered} navigate={navigate} />)}
        {view === 'skills' && learningData && <div className={s.stack}><SkillsTable data={learningData} navigate={navigate} />{skill && <StudentTable data={learningData} navigate={navigate} title={`Students · ${skill.slug}`} />}<QuestionsTable data={bloom ? scopeAnalytics(learningData, { bloom }) : learningData} navigate={navigate} selected={question} />{bloom && <Button variant="outline" onClick={() => navigate({ bloom: null, question: null })}>Clear Bloom’s filter: {bloom}</Button>}</div>}
        {view === 'blooms' && learningData && <Blooms data={learningData} bloom={bloom} navigate={navigate} question={question} />}
        {view === 'engagement' && <Engagement data={filtered} />}
      </> : null}
    </section>
  </div>
}
