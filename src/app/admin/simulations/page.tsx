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
  Plus
} from 'lucide-react'

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

  // Mock simulations data - in production this would come from database
  const [simulations] = useState<Simulation[]>([
    {
      id: '1',
      title: 'Constant Velocity Motion Lab',
      description: 'Control a walker\'s motion and collect position data. Observe constant velocity in 1D motion.',
      slug: 'constant-velocity',
      difficulty: 'beginner',
      unit: 'Unit 1: Motion',
      published: true,
      totalPlays: 156
    },
    {
      id: '2',
      title: 'Projectile Motion Lab',
      description: 'Launch projectiles and analyze 2D motion under gravity. Explore range, height, and trajectory.',
      slug: 'projectile-motion',
      difficulty: 'intermediate',
      unit: 'Unit 1: Motion',
      published: true,
      totalPlays: 89
    }
  ])

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

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render content if not authenticated or authorized
  if (!session || (userRole !== 'admin' && userRole !== 'teacher')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Simulation
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
              {Math.round(
                simulations.reduce((sum, s) => sum + (s.totalPlays || 0), 0) / 
                simulations.length
              )}
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
              <h3 className="text-lg font-semibold mb-2">No simulations yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first interactive physics simulation
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Simulation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulations.map((simulation) => (
              <Card key={simulation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant={simulation.published ? "default" : "secondary"}
                      className="mb-2"
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
                  <CardTitle className="text-lg">{simulation.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {simulation.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {simulation.unit}
                    </div>

                    {simulation.totalPlays !== undefined && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Play className="h-4 w-4 mr-1" />
                        <span>{simulation.totalPlays} plays</span>
                      </div>
                    )}

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
                        className="flex-1"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
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