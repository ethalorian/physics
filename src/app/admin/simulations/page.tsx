"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Play,
  BarChart3,
  Eye,
  Loader2
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface Simulation {
  id: string
  title: string
  description: string
  slug: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  unit: string
  topic: string
  sortOrder: number
  published: boolean
  totalPlays?: number
}

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

export default function AdminSimulationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userRole = getUserRole(session?.user?.email)

  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch simulations from database
  const loadSimulations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/simulations?published=all')
      
      if (response.ok) {
        const data = await response.json()
        const mappedSims = (data.simulations || []).map((sim: any) => ({
          id: sim.id,
          title: sim.title,
          description: sim.description || '',
          slug: sim.slug,
          difficulty: sim.difficulty || 'intermediate',
          unit: sim.unit || 'unit-1',
          topic: sim.topic || 'Other',
          sortOrder: typeof sim.sort_order === 'number' ? sim.sort_order : 999,
          published: sim.published,
          totalPlays: sim.view_count || 0
        }))
        setSimulations(mappedSims)
      } else {
        console.log('Could not load simulations from database')
      }
    } catch (error) {
      console.error('Error loading simulations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'loading') {
      loadSimulations()
    }
  }, [status])

  // Toggle published status
  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/simulations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          published: !currentStatus
        })
      })

      if (response.ok) {
        // Update local state
        setSimulations(prev => 
          prev.map(sim => 
            sim.id === id ? { ...sim, published: !currentStatus } : sim
          )
        )
        console.log('✓ Published status updated')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to update published status:', response.status, errorData)
        alert(`Failed to update: ${errorData.error || 'Unknown error'}\n\nMake sure you've run the database migration first.`)
      }
    } catch (error) {
      console.error('Error updating simulation:', error)
      alert('Error: Could not connect to database. Have you run the migration?')
    }
  }

  // Handle authentication redirect in useEffect
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (userRole !== 'admin' && userRole !== 'teacher') {
      router.push('/dashboard')
    }
  }, [session, status, userRole, router])

  // unit → ordered [{ topic, sims }] for the grouped management view
  const grouped = useMemo(() => {
    const byUnit = new Map<string, Simulation[]>()
    for (const s of simulations) {
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
  }, [simulations])

  // Show loading while checking auth or loading simulations
  if (status === 'loading' || (loading && simulations.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render content if not authenticated or authorized
  if (!session || (userRole !== 'admin' && userRole !== 'teacher')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      case 'advanced':
        return 'bg-red-500/10 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Physics Simulations Management</h1>
            <p className="text-muted-foreground">
              Manage interactive physics simulations and labs
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/admin/simulations/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </a>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Simulations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{simulations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {simulations.filter(s => s.published).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Plays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {simulations.reduce((sum, s) => sum + (s.totalPlays || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Plays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {simulations.length > 0 
                ? Math.round(
                    simulations.reduce((sum, s) => sum + (s.totalPlays || 0), 0) / 
                    simulations.length
                  )
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulations grouped by unit → topic, in teaching order */}
      {simulations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No simulations available</h3>
            <p className="text-muted-foreground">Physics simulations will appear here once they are added to the system</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ unit, topics }) => (
            <section key={unit}>
              <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: '2px solid color-mix(in oklch, var(--primary) 30%, var(--border))' }}>
                <h2 className="text-xl font-semibold">{UNIT_NAMES[unit] ?? unit}</h2>
                <Badge variant="outline">{topics.reduce((n, t) => n + t.sims.length, 0)} labs</Badge>
              </div>
              <div className="space-y-6">
                {topics.map(({ topic, sims }) => (
                  <div key={topic}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 text-muted-foreground">{topic}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sims.map((simulation) => (
                        <Card key={simulation.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between mb-1">
                              <Badge variant={simulation.published ? 'default' : 'secondary'}>
                                {simulation.published ? 'Published' : 'Draft'}
                              </Badge>
                              <Badge variant="outline" className={getDifficultyColor(simulation.difficulty)}>
                                {simulation.difficulty}
                              </Badge>
                            </div>
                            <CardTitle className="text-base">{simulation.title}</CardTitle>
                            <CardDescription className="line-clamp-2 text-xs">{simulation.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {simulation.totalPlays !== undefined && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Play className="h-3.5 w-3.5 mr-1" />{simulation.totalPlays} views
                              </div>
                            )}
                            <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'var(--muted)' }}>
                              <Label htmlFor={`published-${simulation.id}`} className="text-sm font-medium cursor-pointer">Published</Label>
                              <Switch id={`published-${simulation.id}`} checked={simulation.published} onCheckedChange={() => togglePublished(simulation.id, simulation.published)} />
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/simulations/${simulation.slug}`)}>
                                <Eye className="h-4 w-4 mr-2" />Preview
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => router.push(`/admin/simulations/analytics`)}>
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </div>
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