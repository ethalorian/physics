"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import {
  ArrowLeft, BarChart3, Sparkles, Users, BookOpen, AlertTriangle,
  Lightbulb, GitCompare, ClipboardList, Loader2,
} from 'lucide-react'
import { decayingAverage } from '@/data/curriculum-types'

// ---------------------------------------------------------------------------
// Types (mirror /api/analytics/mastery)
// ---------------------------------------------------------------------------
interface Cell { value: number | null; count: number; last: string | null }
interface AStudent { id: string; name: string; teacher: string | null; classIds: string[] }
interface AClass { id: string; name: string; section: string | null; teacher: string | null; studentCount: number }
interface ATarget { id: string; statement: string; domain: string; unitId: string }
interface AUnit { id: string; name: string }
interface CompactRec { u: string; t: string; l: number; d: string }
interface Dataset {
  units: AUnit[]
  targets: ATarget[]
  teachers: string[]
  classes: AClass[]
  students: AStudent[]
  cells: Record<string, Record<string, Cell>>
  records: CompactRec[]
}
interface Insights { patterns: string[]; reteach: string[]; interventions: string[]; comparison: string[] }

const DOMAINS = [
  { key: 'knowledge', short: 'K', label: 'Knowledge' },
  { key: 'reasoning', short: 'R', label: 'Reasoning' },
  { key: 'skill', short: 'S', label: 'Skill' },
  { key: 'product', short: 'P', label: 'Product' },
]
const DOMAIN_LABEL: Record<string, string> = { knowledge: 'Knowledge', reasoning: 'Reasoning', skill: 'Skill', product: 'Product' }

function bandColor(v: number | null): string {
  if (v == null) return 'var(--muted-foreground)'
  if (v >= 2.45) return 'var(--success)'
  if (v >= 1.7) return 'var(--reward)'
  return 'var(--viz-down)'
}
function mean(xs: number[]): number | null {
  if (xs.length === 0) return null
  return xs.reduce((a, b) => a + b, 0) / xs.length
}
function fmt(v: number | null): string { return v == null ? '—' : v.toFixed(2) }
function weekStart(iso: string): string {
  const d = new Date(iso)
  const day = (d.getUTCDay() + 6) % 7 // Mon=0
  d.setUTCDate(d.getUTCDate() - day)
  return d.toISOString().slice(0, 10)
}
function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000))
}
const STALE_DAYS = 7
// Unique, name-free token for the API call (e.g. "MG", "MG2" on collision).
function initialsToken(name: string, used: Map<string, number>): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  let base = 'S'
  if (parts.length === 1) base = parts[0].slice(0, 2).toUpperCase()
  else if (parts.length >= 2) base = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  const n = (used.get(base) ?? 0) + 1
  used.set(base, n)
  return n === 1 ? base : `${base}${n}`
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Dataset | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [teacher, setTeacher] = useState('all')
  const [klass, setKlass] = useState('all')
  const [unit, setUnit] = useState('all')
  const [domain, setDomain] = useState('all')

  const [insights, setInsights] = useState<Insights | null>(null)
  const [insightErr, setInsightErr] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    fetch('/api/analytics/mastery')
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || 'Could not load analytics')
        return d as Dataset
      })
      .then(setData)
      .catch((e: Error) => setLoadErr(e.message))
  }, [])

  // classes available given the teacher filter
  const classOptions = useMemo(() => {
    if (!data) return []
    return data.classes.filter((c) => teacher === 'all' || c.teacher === teacher)
  }, [data, teacher])

  // reset class filter if it falls outside the teacher filter
  useEffect(() => {
    if (klass !== 'all' && !classOptions.some((c) => c.id === klass)) setKlass('all')
  }, [classOptions, klass])

  // ---- filtered slice -----------------------------------------------------
  const slice = useMemo(() => {
    if (!data) return null
    const fTargets = data.targets.filter(
      (t) => (unit === 'all' || t.unitId === unit) && (domain === 'all' || t.domain === domain),
    )
    const fTargetIds = new Set(fTargets.map((t) => t.id))
    const fStudents = data.students.filter(
      (s) => (teacher === 'all' || s.teacher === teacher) && (klass === 'all' || s.classIds.includes(klass)),
    )
    const fStudentIds = new Set(fStudents.map((s) => s.id))

    // overall + per-target
    const allVals: number[] = []
    const byTarget = fTargets.map((t) => {
      const vals: number[] = []
      let notYet = 0
      for (const s of fStudents) {
        const c = data.cells[s.id]?.[t.id]
        if (c?.value != null) { vals.push(c.value); allVals.push(c.value); if (c.value < 1.7) notYet++ }
      }
      return { id: t.id, statement: t.statement, domain: t.domain, avg: mean(vals), rated: vals.length, notYet }
    })

    // per-domain
    const byDomain = DOMAINS.map((dn) => {
      const vals: number[] = []
      for (const t of fTargets.filter((x) => x.domain === dn.key)) {
        for (const s of fStudents) {
          const c = data.cells[s.id]?.[t.id]
          if (c?.value != null) vals.push(c.value)
        }
      }
      return { key: dn.key, short: dn.short, label: dn.label, avg: mean(vals), rated: vals.length }
    }).filter((d) => d.rated > 0 || domain === 'all')

    // per-class (within teacher filter)
    const classesInView = (klass === 'all' ? classOptions : classOptions.filter((c) => c.id === klass))
    const byClass = classesInView.map((c) => {
      const memberIds = data.students.filter((s) => s.classIds.includes(c.id) && fStudentIds.has(s.id)).map((s) => s.id)
      const vals: number[] = []
      for (const sid of memberIds) for (const t of fTargets) {
        const v = data.cells[sid]?.[t.id]?.value
        if (v != null) vals.push(v)
      }
      return { id: c.id, name: c.name, section: c.section, teacher: c.teacher, avg: mean(vals), students: memberIds.length }
    })

    // per-student overall (for interventions)
    const studentOverall = fStudents.map((s) => {
      const vals: number[] = []
      let lastSeen: string | null = null
      const weak: string[] = []
      for (const t of fTargets) {
        const c = data.cells[s.id]?.[t.id]
        if (c?.value != null) {
          vals.push(c.value)
          if (c.value < 1.7) weak.push(t.statement)
        }
        if (c?.last && (!lastSeen || c.last > lastSeen)) lastSeen = c.last
      }
      return { id: s.id, name: s.name, teacher: s.teacher, overall: mean(vals), rated: vals.length, weak, stale: daysSince(lastSeen) }
    })
    const interventions = studentOverall
      .filter((s) => s.rated > 0 && ((s.overall != null && s.overall < 1.7) || s.weak.length > 0 || (s.stale != null && s.stale >= STALE_DAYS)))
      .sort((a, b) => (a.overall ?? 9) - (b.overall ?? 9))

    // weekly trend = rolled mastery "as of" each week: the decaying average of
    // every record logged up to that week's end, averaged across the slice.
    // Reads as a learning trajectory and matches how every other number here
    // is computed (rather than "what got graded this week").
    const recsByPair = new Map<string, { wk: string; l: number }[]>()
    const weekSet = new Set<string>()
    for (const r of data.records) {
      if (!fStudentIds.has(r.u) || !fTargetIds.has(r.t)) continue
      const wk = weekStart(r.d)
      weekSet.add(wk)
      const arr = recsByPair.get(`${r.u}|${r.t}`) ?? []
      arr.push({ wk, l: r.l }) // data.records arrives sorted by observed_at asc
      recsByPair.set(`${r.u}|${r.t}`, arr)
    }
    const trend = [...weekSet].sort().map((w) => {
      const vals: number[] = []
      for (const arr of recsByPair.values()) {
        const levels = arr.filter((x) => x.wk <= w).map((x) => x.l)
        if (levels.length === 0) continue
        const v = decayingAverage(levels)
        if (v != null) vals.push(v)
      }
      const a = mean(vals)
      return { week: w, avg: a == null ? null : Number(a.toFixed(2)), n: vals.length }
    })

    return {
      fStudents, fTargets, overall: mean(allVals),
      byTarget, byDomain, byClass, interventions, trend,
      studentsInView: fStudents.length, classesInView: byClass.length,
    }
  }, [data, teacher, klass, unit, domain, classOptions])

  const scopeLabel = useMemo(() => {
    const parts: string[] = []
    parts.push(teacher === 'all' ? 'All teachers' : teacher)
    if (klass !== 'all') { const c = data?.classes.find((x) => x.id === klass); if (c) parts.push(`${c.name}${c.section ? ' · ' + c.section : ''}`) }
    parts.push(unit === 'all' ? 'All units' : (data?.units.find((u) => u.id === unit)?.name ?? unit))
    if (domain !== 'all') parts.push(DOMAIN_LABEL[domain])
    return parts.join(' · ')
  }, [teacher, klass, unit, domain, data])

  const askClaude = useCallback(async () => {
    if (!slice) return
    setAsking(true); setInsightErr(null); setInsights(null)
    try {
      // Send initials-only tokens; keep a private map so we can translate
      // Claude's reply back to full names for display. Names never leave the browser.
      const used = new Map<string, number>()
      const tokenToName = new Map<string, string>()
      const interventions = slice.interventions.slice(0, 20).map((s) => {
        const token = initialsToken(s.name, used)
        tokenToName.set(token, s.name)
        return { name: token, teacher: s.teacher, overall: s.overall, weakTargets: s.weak.slice(0, 4), staleDays: s.stale }
      })
      const payload = {
        scopeLabel,
        studentsInView: slice.studentsInView,
        classesInView: slice.classesInView,
        overallAvg: slice.overall,
        byDomain: slice.byDomain.map((d) => ({ domain: d.label, avg: d.avg, rated: d.rated })),
        byTarget: slice.byTarget.map((t) => ({ id: t.id, statement: t.statement, domain: t.domain, avg: t.avg, rated: t.rated, notYet: t.notYet })),
        byClass: slice.byClass.map((c) => ({ name: c.name, section: c.section, teacher: c.teacher, avg: c.avg, students: c.students })),
        interventions,
        trend: slice.trend,
      }
      const res = await fetch('/api/analytics/insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'Could not generate insights')
      const raw = d as Insights
      // longest tokens first so "MG2" isn't clobbered by "MG"
      const tokens = [...tokenToName.keys()].sort((a, b) => b.length - a.length)
      const translate = (xs: string[]) =>
        (xs ?? []).map((line) => tokens.reduce((acc, tk) => acc.split(tk).join(tokenToName.get(tk) as string), line))
      setInsights({
        patterns: translate(raw.patterns),
        reteach: translate(raw.reteach),
        interventions: translate(raw.interventions),
        comparison: translate(raw.comparison),
      })
    } catch (e) {
      setInsightErr(e instanceof Error ? e.message : 'Could not generate insights')
    } finally {
      setAsking(false)
    }
  }, [slice, scopeLabel])

  const selStyle = { borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/home" className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Command center
      </Link>

      <div className="rounded-2xl p-6 mb-6" style={{
        border: '1px solid color-mix(in oklch, var(--primary) 30%, var(--border))',
        background: 'radial-gradient(90% 140% at 92% -20%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 55%), var(--card)',
      }}>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={16} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Mastery analytics</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Across every class, where learning stands</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Disaggregate the whole student body by teacher, class, domain, target, and time — then ask Claude what to make of it.
        </p>
      </div>

      {loadErr && (
        <div className="rounded-2xl border p-4 text-sm mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          {loadErr}
        </div>
      )}

      {/* filters */}
      <div className="rounded-2xl border p-4 mb-6 flex flex-wrap items-end gap-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Teacher</div>
          <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className="text-sm rounded-lg border px-2.5 py-1.5" style={selStyle}>
            <option value="all">All teachers</option>
            {data?.teachers.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Class / section</div>
          <select value={klass} onChange={(e) => setKlass(e.target.value)} className="text-sm rounded-lg border px-2.5 py-1.5" style={selStyle}>
            <option value="all">All classes</option>
            {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Unit</div>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="text-sm rounded-lg border px-2.5 py-1.5" style={selStyle}>
            <option value="all">All units</option>
            {data?.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Domain</div>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="text-sm rounded-lg border px-2.5 py-1.5" style={selStyle}>
            <option value="all">All domains</option>
            {DOMAINS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </label>
        <div className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>{scopeLabel}</div>
      </div>

      {/* summary tiles */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <Tile icon={<Users size={18} />} value={slice ? String(slice.studentsInView) : '—'} label="Students in view" accent="var(--primary)" />
        <Tile icon={<BookOpen size={18} />} value={slice ? String(slice.classesInView) : '—'} label="Classes in view" accent="var(--reward)" />
        <Tile icon={<BarChart3 size={18} />} value={fmt(slice?.overall ?? null)} label="Avg mastery (1–3)" accent={bandColor(slice?.overall ?? null)} />
        <Tile icon={<AlertTriangle size={18} />} value={slice ? String(slice.interventions.length) : '—'} label="Students to watch" accent="var(--viz-down)" />
      </div>

      {/* domain breakdown */}
      {slice && slice.byDomain.length > 0 && (
        <Section title="By domain of thinking (K / R / S / P)">
          <div className="space-y-2.5">
            {slice.byDomain.map((d) => (
              <div key={d.key} className="flex items-center gap-3">
                <div className="w-24 text-sm" style={{ color: 'var(--muted-foreground)' }}>{d.label}</div>
                <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: 'color-mix(in oklch, var(--muted-foreground) 12%, transparent)' }}>
                  <div className="h-full rounded-md" style={{ width: `${d.avg != null ? (d.avg / 3) * 100 : 0}%`, background: bandColor(d.avg) }} />
                </div>
                <div className="w-20 text-right text-sm font-medium" style={{ color: bandColor(d.avg) }}>{fmt(d.avg)}</div>
                <div className="w-16 text-right text-xs" style={{ color: 'var(--muted-foreground)' }}>{d.rated} rated</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* trend */}
      {mounted && slice && slice.trend.length > 1 && (
        <Section title="Trend over time (weekly average rating)">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={slice.trend} margin={{ top: 8, right: 16, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis domain={[1, 3]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="avg" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* per-class comparison */}
      {slice && slice.byClass.length > 0 && (
        <Section title="By class">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr>
                <th className="text-left font-medium py-2 pr-3" style={{ color: 'var(--muted-foreground)' }}>Class</th>
                <th className="text-left font-medium py-2 pr-3" style={{ color: 'var(--muted-foreground)' }}>Teacher</th>
                <th className="text-center font-medium py-2 px-2" style={{ color: 'var(--muted-foreground)' }}>Students</th>
                <th className="text-center font-medium py-2 px-2" style={{ color: 'var(--muted-foreground)' }}>Avg</th>
              </tr></thead>
              <tbody>
                {slice.byClass.map((c) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2 pr-3 font-medium">{c.name}{c.section ? <span style={{ color: 'var(--muted-foreground)' }}> · {c.section}</span> : null}</td>
                    <td className="py-2 pr-3" style={{ color: 'var(--muted-foreground)' }}>{c.teacher ?? '—'}</td>
                    <td className="py-2 px-2 text-center">{c.students}</td>
                    <td className="py-2 px-2 text-center font-bold" style={{ color: bandColor(c.avg) }}>{fmt(c.avg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* per-target */}
      {slice && slice.byTarget.length > 0 && (
        <Section title="By learning target">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr>
                <th className="text-left font-medium py-2 pr-3" style={{ color: 'var(--muted-foreground)' }}>Target</th>
                <th className="text-center font-medium py-2 px-2" style={{ color: 'var(--muted-foreground)' }}>Domain</th>
                <th className="text-center font-medium py-2 px-2" style={{ color: 'var(--muted-foreground)' }}>Avg</th>
                <th className="text-center font-medium py-2 px-2" style={{ color: 'var(--muted-foreground)' }}>Rated</th>
                <th className="text-center font-medium py-2 px-2" style={{ color: 'var(--muted-foreground)' }}>Not yet</th>
              </tr></thead>
              <tbody>
                {slice.byTarget.map((t) => (
                  <tr key={t.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2 pr-3">{t.statement}</td>
                    <td className="py-2 px-2 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>{DOMAIN_LABEL[t.domain] ?? t.domain}</td>
                    <td className="py-2 px-2 text-center font-bold" style={{ color: bandColor(t.avg) }}>{fmt(t.avg)}</td>
                    <td className="py-2 px-2 text-center" style={{ color: 'var(--muted-foreground)' }}>{t.rated}</td>
                    <td className="py-2 px-2 text-center" style={{ color: t.notYet > 0 ? 'var(--viz-down)' : 'var(--muted-foreground)' }}>{t.notYet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* interventions */}
      {slice && slice.interventions.length > 0 && (
        <Section title="Students to watch">
          <div className="space-y-2">
            {slice.interventions.slice(0, 24).map((s) => (
              <div key={s.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/admin/control-room?student=${encodeURIComponent(s.id)}`} className="font-medium hover:underline">{s.name}</Link>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {s.teacher && <span>{s.teacher}</span>}
                    {s.stale != null && s.stale >= STALE_DAYS && <span>{s.stale}d since last rating</span>}
                    <span className="font-bold" style={{ color: bandColor(s.overall) }}>{fmt(s.overall)}</span>
                  </div>
                </div>
                {s.weak.length > 0 && (
                  <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Weak: {s.weak.slice(0, 3).join('; ')}{s.weak.length > 3 ? '…' : ''}</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ask Claude */}
      <div className="rounded-2xl border p-5 mt-6" style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'var(--card)' }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <div className="font-bold" style={{ fontSize: 15 }}>Learn from this slice</div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Claude reads the numbers in view ({scopeLabel}) and reports patterns, reteach moves, who to watch, and class comparisons.</div>
            </div>
          </div>
          <button
            onClick={askClaude}
            disabled={asking || !slice || slice.studentsInView === 0}
            className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3.5 py-2 font-medium"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)', opacity: asking || !slice || slice.studentsInView === 0 ? 0.6 : 1 }}
          >
            {asking ? <><Loader2 size={15} className="animate-spin" /> Analyzing…</> : <><Sparkles size={15} /> Ask Claude</>}
          </button>
        </div>

        {insightErr && <div className="mt-4 text-sm" style={{ color: 'var(--viz-down)' }}>{insightErr}</div>}

        {insights && (
          <div className="mt-5 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <InsightCard icon={<Lightbulb size={15} />} title="Patterns & insights" items={insights.patterns} accent="var(--primary)" />
            <InsightCard icon={<ClipboardList size={15} />} title="Reteach recommendations" items={insights.reteach} accent="var(--success)" />
            <InsightCard icon={<AlertTriangle size={15} />} title="Intervention list" items={insights.interventions} accent="var(--viz-down)" />
            <InsightCard icon={<GitCompare size={15} />} title="Cross-class comparison" items={insights.comparison} accent="var(--reward)" />
          </div>
        )}
      </div>

      <p className="text-xs mt-4" style={{ color: 'var(--muted-foreground)' }}>
        Claude&apos;s read is a starting point grounded only in these rolled-up numbers — every instructional call stays yours.
      </p>
    </div>
  )
}

function Tile({ icon, value, label, accent }: { icon: React.ReactNode; value: string; label: string; accent: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight" style={{ color: accent }}>{value}</div>
        <span className="opacity-70">{icon}</span>
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
      <div style={{ height: 3, borderRadius: 2, marginTop: 8, background: accent, opacity: 0.85 }} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted-foreground)' }}>{title}</div>
      {children}
    </div>
  )
}

function InsightCard({ icon, title, items, accent }: { icon: React.ReactNode; title: string; items: string[]; accent: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-1.5 mb-2 font-medium" style={{ color: accent, fontSize: 13 }}>{icon}{title}</div>
      {items.length === 0 ? (
        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>—</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="text-sm flex gap-2">
              <span style={{ color: accent }}>•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
