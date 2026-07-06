"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Play, Search, Clock, FlaskConical, CheckCircle2, MapPin,
  Activity, Gauge, Orbit, Waves, Zap, Magnet, Atom, Rocket, Ruler, Move,
} from 'lucide-react'

interface Simulation {
  id: string
  title: string
  description: string
  slug: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  unit: string
  topic: string
  sortOrder: number
  estimatedTime: number
  published: boolean
}

type Difficulty = Simulation['difficulty']

// Canonical unit names (short). Sims carry the unit id; we resolve a friendly label.
const UNIT_NAMES: Record<string, string> = {
  'unit-1': 'Unit 1 · Motion & Forces',
  'unit-2': 'Unit 2 · Gravitation & Fields',
  'unit-3': 'Unit 3 · Momentum & Collisions',
  'unit-4': 'Unit 4 · Energy & Work',
  'unit-5': 'Unit 5 · Thermal Physics',
  'unit-6': 'Unit 6 · Waves, Sound & Light',
  'unit-7': 'Unit 7 · Electricity & Magnetism',
}
const UNIT_ORDER = ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7']

// Difficulty vocabulary matches the SimLab shell's level tints (Intro / Core /
// Challenge) so the tag reads the same on the card and inside the lab.
const DIFFICULTY_ORDER: Difficulty[] = ['beginner', 'intermediate', 'advanced']
const DIFFICULTY_META: Record<Difficulty, { label: string; tint: string }> = {
  beginner: { label: 'Intro', tint: 'var(--success)' },
  intermediate: { label: 'Core', tint: 'var(--primary)' },
  advanced: { label: 'Challenge', tint: 'var(--reward)' },
}

// localStorage set of visited sim slugs — written by the SimLab shell on open;
// the fallback "tried" signal when the server activity record isn't reachable.
const VISITED_KEY = 'physics:sim-visited'

// Deterministic tokenized preview tile: hash the topic to pick an icon + a soft
// token gradient, so every card in a topic shares one schematic. No images, no hex.
const TILE_ICONS = [Activity, Gauge, Orbit, Waves, Zap, Magnet, Atom, Rocket, Ruler, Move]
const TILE_MIXES: [string, string][] = [
  ['var(--primary)', 'var(--secondary)'],
  ['var(--primary)', 'var(--reward)'],
  ['var(--reward)', 'var(--secondary)'],
]
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Calm bordered hover (no drifting shadows); entrance-free, ≤300ms, stilled
// under prefers-reduced-motion.
const PAGE_CSS = `
  .sim-card { transition: border-color 200ms cubic-bezier(0.16, 1, 0.3, 1); }
  .sim-card:hover { border-color: color-mix(in oklch, var(--primary) 45%, var(--border)); }
  .sim-chip { transition: background-color 200ms cubic-bezier(0.16, 1, 0.3, 1), color 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1); }
  @media (prefers-reduced-motion: reduce) { .sim-card, .sim-chip { transition: none; } }
`

function SimTile({ topic, difficulty, tried }: { topic: string; difficulty: Difficulty; tried: boolean }) {
  const h = hashStr(topic)
  const Icon = TILE_ICONS[h % TILE_ICONS.length]
  const [a, b] = TILE_MIXES[h % TILE_MIXES.length]
  const meta = DIFFICULTY_META[difficulty]
  return (
    <div
      className="relative flex h-24 items-center justify-center"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklch, ${a} 14%, var(--card)), color-mix(in oklch, ${b} 26%, var(--card)))`,
        borderBottom: '0.5px solid var(--border)',
      }}
    >
      <Icon aria-hidden="true" className="h-9 w-9" strokeWidth={1.5} style={{ color: `color-mix(in oklch, ${a} 55%, var(--foreground))` }} />
      <span
        className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ background: `color-mix(in oklch, ${meta.tint} 16%, var(--card))`, color: `color-mix(in oklch, ${meta.tint} 60%, var(--foreground))` }}
      >
        {meta.label}
      </span>
      {tried && (
        <span
          className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: 'color-mix(in oklch, var(--success) 14%, var(--card))', color: 'var(--success)' }}
        >
          <CheckCircle2 className="h-3 w-3" /> Tried
        </span>
      )}
    </div>
  )
}

export default function SimulationsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all')
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [visitedSlugs, setVisitedSlugs] = useState<Set<string>>(new Set())
  const [triedIds, setTriedIds] = useState<Set<string>>(new Set())
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/simulations?published=true')
      .then((r) => (r.ok ? r.json() : { simulations: [] }))
      .then((data) => {
        const mapped: Simulation[] = (data.simulations || []).map((s: Record<string, unknown>) => ({
          id: String(s.id), title: String(s.title), description: String(s.description || ''), slug: String(s.slug),
          difficulty: (s.difficulty as Simulation['difficulty']) || 'intermediate',
          unit: String(s.unit || 'unit-1'), topic: String(s.topic || 'Other'),
          sortOrder: typeof s.sort_order === 'number' ? s.sort_order : 999,
          estimatedTime: typeof s.estimated_time === 'number' ? s.estimated_time : 20,
          published: Boolean(s.published),
        }))
        setSimulations(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Tried state: prefer the server-side activity record; the SimLab-written
  // localStorage set covers signed-out sessions or a failed fetch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISITED_KEY)
      if (raw) setVisitedSlugs(new Set(JSON.parse(raw) as string[]))
    } catch { /* storage unavailable — server record still applies */ }
    fetch('/api/simulations/activity')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const activities = (d?.activities ?? []) as { simulation_id?: string }[]
        if (activities.length === 0) return
        setTriedIds(new Set(activities.map((a) => String(a.simulation_id)).filter((id) => id && id !== 'undefined')))
      })
      .catch(() => {})
    // "Jump to your unit" anchor: the student's current unit from the home feed.
    fetch('/api/home')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const id = d?.continue?.unitId
        if (typeof id === 'string' && id) setCurrentUnitId(id)
      })
      .catch(() => {})
  }, [])

  const isTried = useCallback(
    (sim: Simulation) => triedIds.has(sim.id) || visitedSlugs.has(sim.slug),
    [triedIds, visitedSlugs],
  )

  // unit → ordered list of { topic, sims } where sims are sorted by sortOrder.
  const grouped = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const filtered = simulations.filter((s) =>
      s.published &&
      (difficultyFilter === 'all' || s.difficulty === difficultyFilter) &&
      (!q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.topic.toLowerCase().includes(q)),
    )
    const byUnit = new Map<string, Simulation[]>()
    for (const s of filtered) {
      if (!byUnit.has(s.unit)) byUnit.set(s.unit, [])
      byUnit.get(s.unit)!.push(s)
    }
    const units = [...byUnit.keys()].sort((a, b) => {
      const ia = UNIT_ORDER.indexOf(a), ib = UNIT_ORDER.indexOf(b)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
    return units.map((unit) => {
      const sims = byUnit.get(unit)!.sort((a, b) => a.sortOrder - b.sortOrder)
      const topics: { topic: string; sims: Simulation[] }[] = []
      for (const s of sims) {
        const last = topics[topics.length - 1]
        if (last && last.topic === s.topic) last.sims.push(s)
        else topics.push({ topic: s.topic, sims: [s] })
      }
      return { unit, topics }
    })
  }, [simulations, searchQuery, difficultyFilter])

  // Student's current unit if it has visible labs, else the first group.
  const jumpTargetUnit = useMemo(() => {
    if (currentUnitId && grouped.some((g) => g.unit === currentUnitId)) return currentUnitId
    return grouped[0]?.unit ?? null
  }, [currentUnitId, grouped])

  const jumpToUnit = useCallback(() => {
    if (!jumpTargetUnit) return
    const el = document.getElementById(`unit-${jumpTargetUnit}`)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [jumpTargetUnit])

  const openLab = useCallback((sim: Simulation) => {
    try {
      const raw = localStorage.getItem(VISITED_KEY)
      const arr: string[] = raw ? (JSON.parse(raw) as string[]) : []
      if (!arr.includes(sim.slug)) localStorage.setItem(VISITED_KEY, JSON.stringify([...arr, sim.slug]))
    } catch { /* non-fatal */ }
    router.push(`/simulations/${sim.slug}`)
  }, [router])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <style>{PAGE_CSS}</style>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Physics simulations</h1>
        <p className="text-muted-foreground">Interactive labs, grouped by unit and topic in teaching order.</p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search simulations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <div className="flex items-center gap-1.5" role="group" aria-label="Filter by difficulty">
          {(['all', ...DIFFICULTY_ORDER] as const).map((d) => {
            const active = difficultyFilter === d
            const label = d === 'all' ? 'All levels' : DIFFICULTY_META[d].label
            const tint = d === 'all' ? 'var(--primary)' : DIFFICULTY_META[d].tint
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => setDifficultyFilter(d)}
                className="sim-chip rounded-full px-3 py-1.5 text-xs font-semibold"
                style={active
                  ? { background: `color-mix(in oklch, ${tint} 16%, var(--card))`, color: `color-mix(in oklch, ${tint} 60%, var(--foreground))`, border: `1px solid color-mix(in oklch, ${tint} 45%, var(--border))` }
                  : { background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {jumpTargetUnit && (
          <Button variant="outline" size="sm" onClick={jumpToUnit}>
            <MapPin className="h-4 w-4 mr-1.5" /> Jump to your unit
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : grouped.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No simulations match your filters.</CardContent></Card>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ unit, topics }) => (
            <section key={unit} id={`unit-${unit}`} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: '2px solid color-mix(in oklch, var(--primary) 30%, var(--border))' }}>
                <FlaskConical className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                <h2 className="text-xl font-semibold">{UNIT_NAMES[unit] ?? unit}</h2>
                <Badge variant="outline" className="ml-1">{topics.reduce((n, t) => n + t.sims.length, 0)} labs</Badge>
                {unit === currentUnitId && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: 'color-mix(in oklch, var(--reward) 16%, var(--card))', color: 'color-mix(in oklch, var(--reward) 60%, var(--foreground))' }}
                  >
                    <MapPin className="h-3 w-3" /> Your unit
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {topics.map(({ topic, sims }) => (
                  <div key={topic}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)' }}>{topic}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sims.map((sim) => (
                        <Card key={sim.id} className="sim-card pt-0 gap-4 overflow-hidden flex flex-col">
                          <SimTile topic={sim.topic} difficulty={sim.difficulty} tried={isTried(sim)} />
                          <CardHeader className="pb-0">
                            <CardTitle className="text-base">{sim.title}</CardTitle>
                            <CardDescription className="line-clamp-2 text-xs">{sim.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="mt-auto space-y-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" /> {sim.estimatedTime} min
                            </div>
                            <Button className="w-full" size="sm" onClick={() => openLab(sim)}>
                              <Play className="h-4 w-4 mr-2" /> {isTried(sim) ? 'Open again' : 'Open lab'}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
