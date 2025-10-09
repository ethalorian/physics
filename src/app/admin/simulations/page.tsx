"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Play,
  Settings,
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
  published: boolean
  totalPlays?: number
}

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
          unit: sim.unit,
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

      {/* Simulations List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Simulations</h2>
        
        {simulations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No simulations available</h3>
              <p className="text-muted-foreground">
                Physics simulations will appear here once they are added to the system
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {simulations.map((simulation) => (
              <Card key={simulation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <Badge 
                        variant={simulation.published ? "default" : "secondary"}
                      >
                        {simulation.published ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={getDifficultyColor(simulation.difficulty)}
                      >
                        {simulation.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{simulation.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {simulation.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {simulation.unit}
                    </div>

                    {simulation.totalPlays !== undefined && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Play className="h-4 w-4 mr-1" />
                        <span>{simulation.totalPlays} views</span>
                      </div>
                    )}

                    {/* Published Toggle */}
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Label htmlFor={`published-${simulation.id}`} className="text-sm font-medium cursor-pointer">
                        Published
                      </Label>
                      <Switch
                        id={`published-${simulation.id}`}
                        checked={simulation.published}
                        onCheckedChange={() => togglePublished(simulation.id, simulation.published)}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/simulations/${simulation.slug}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/admin/simulations/analytics`)}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Coming Soon Notice */}
      <Card className="mt-8 bg-blue-500/5 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5 text-blue-500" />
            More Simulations Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Accelerated Motion Lab - Explore changing velocity</li>
            <li>• Free Fall Simulator - Study gravitational acceleration</li>
            <li>• Projectile Motion - Analyze 2D motion trajectories</li>
            <li>• Force and Motion - Newton&apos;s Laws interactive</li>
            <li>• Energy Conservation - Track energy transformations</li>
            <li>• Collision Lab - Momentum and energy in collisions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}