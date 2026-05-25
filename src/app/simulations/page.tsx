"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Play, Search, Clock, FlaskConical } from 'lucide-react'

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

export default function SimulationsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)

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

  // unit → ordered list of { topic, sims } where sims are sorted by sortOrder.
  const grouped = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const filtered = simulations.filter((s) =>
      s.published && (!q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.topic.toLowerCase().includes(q)),
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
  }, [simulations, searchQuery])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Physics simulations</h1>
        <p className="text-muted-foreground">Interactive labs, grouped by unit and topic in teaching order.</p>
      </div>

      <div className="mb-8 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search simulations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : grouped.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No simulations match your search.</CardContent></Card>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ unit, topics }) => (
            <section key={unit}>
              <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: '2px solid color-mix(in oklch, var(--primary) 30%, var(--border))' }}>
                <FlaskConical className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                <h2 className="text-xl font-semibold">{UNIT_NAMES[unit] ?? unit}</h2>
                <Badge variant="outline" className="ml-1">{topics.reduce((n, t) => n + t.sims.length, 0)} labs</Badge>
              </div>

              <div className="space-y-6">
                {topics.map(({ topic, sims }) => (
                  <div key={topic}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)' }}>{topic}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sims.map((sim) => (
                        <Card key={sim.id} className="hover:shadow-md transition-shadow flex flex-col">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{sim.title}</CardTitle>
                            <CardDescription className="line-clamp-2 text-xs">{sim.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="mt-auto space-y-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" /> {sim.estimatedTime} min
                            </div>
                            <Button className="w-full" size="sm" onClick={() => router.push(`/simulations/${sim.slug}`)}>
                              <Play className="h-4 w-4 mr-2" /> Open lab
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
