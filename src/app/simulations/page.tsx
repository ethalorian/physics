"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Play,
  Search,
  TrendingUp,
  Clock,
  BookOpen,
  Database,
  AlertCircle
} from 'lucide-react'

interface Simulation {
  id: string
  title: string
  description: string
  slug: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  unit: string
  estimatedTime: number // minutes
  published: boolean
  isFeatured?: boolean
}

// Mock data as fallback (for backward compatibility)
const MOCK_SIMULATIONS: Simulation[] = [
    {
      id: '1',
      title: 'Measurement, Precision & Accuracy',
      description: 'Learn to measure with proper precision and understand the difference between accuracy and precision. Practice reading measurements from various instruments.',
      slug: 'measurement-precision',
      difficulty: 'beginner',
      unit: 'Lab Skills',
      estimatedTime: 20,
      published: true,
      isFeatured: true
    },
    {
      id: '2',
      title: 'Constant Velocity Motion Lab',
      description: 'Control a walker\'s motion and collect position data. Observe constant velocity in 1D motion and analyze position-time graphs.',
      slug: 'constant-velocity',
      difficulty: 'beginner',
      unit: 'Unit 1: Motion',
      estimatedTime: 15,
      published: true,
      isFeatured: true
    },
    {
      id: '3',
      title: 'Freefall Cliff Lab',
      description: 'Help a traveler measure cliff height by dropping a stone! Watch position traces every 0.25 seconds and use the freefall equation h = ½gt² to calculate the height.',
      slug: 'freefall-cliff',
      difficulty: 'intermediate',
      unit: 'Unit 1: Motion',
      estimatedTime: 20,
      published: true,
      isFeatured: false
    },
    {
      id: '4',
      title: 'Uniformly Accelerated Motion',
      description: 'Watch a car drop oil spots every second to visualize constant acceleration. Explore all four kinematic equations and see how spacing patterns reveal acceleration.',
      slug: 'uniformly-accelerated-motion',
      difficulty: 'intermediate',
      unit: 'Unit 1: Motion',
      estimatedTime: 25,
      published: true,
      isFeatured: false
    },
    {
      id: '5',
      title: 'Projectile Motion Lab',
      description: 'Launch projectiles and analyze 2D motion under gravity. Explore range, height, and trajectory with interactive controls.',
      slug: 'projectile-motion',
      difficulty: 'intermediate',
      unit: 'Unit 1: Motion',
      estimatedTime: 20,
      published: true,
      isFeatured: false
    }
]

export default function SimulationsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [simulations, setSimulations] = useState<Simulation[]>(MOCK_SIMULATIONS)
  const [isUsingDatabase, setIsUsingDatabase] = useState(false)
  const [loading, setLoading] = useState(true)

  // Try to load from database, fallback to mock data
  useEffect(() => {
    async function loadSimulations() {
      try {
        const response = await fetch('/api/simulations?published=true')
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.simulations && data.simulations.length > 0) {
            // Map database format to display format
            const mappedSims = data.simulations.map((sim: any) => ({
              id: sim.id,
              title: sim.title,
              description: sim.description || '',
              slug: sim.slug,
              difficulty: sim.difficulty || 'intermediate',
              unit: sim.unit,
              estimatedTime: sim.estimated_time || 20,
              published: sim.published,
              // Feature beginner labs, lab-skills, or high-viewed sims
              isFeatured: sim.difficulty === 'beginner' || sim.category === 'lab-skills' || sim.view_count > 10
            }))
            
            setSimulations(mappedSims)
            setIsUsingDatabase(true)
            console.log('✓ Loaded simulations from database')
          } else {
            console.log('ℹ️ Using mock data (no simulations in database yet)')
          }
        } else {
          console.log('ℹ️ Using mock data (database not available)')
        }
      } catch (error) {
        console.log('ℹ️ Using mock data (error loading from database):', error)
      } finally {
        setLoading(false)
      }
    }

    loadSimulations()
  }, [])

  const filteredSimulations = simulations.filter(sim => 
    sim.published && (
      sim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.unit.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
      case 'advanced':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Physics Simulations</h1>
            <p className="text-muted-foreground">
              Interactive labs and experiments to explore physics concepts
            </p>
          </div>
          {isUsingDatabase && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <Database className="h-3 w-3 mr-1" />
              Database Active
            </Badge>
          )}
          {!isUsingDatabase && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Mock Data
            </Badge>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search simulations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Featured Simulations */}
      {simulations.some(s => s.isFeatured && s.published) && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Featured</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {simulations
              .filter(sim => sim.isFeatured && sim.published)
              .map((simulation) => (
                <Card 
                  key={simulation.id} 
                  className="hover:shadow-lg transition-shadow border-2 border-primary/20"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant="outline" 
                        className={getDifficultyColor(simulation.difficulty)}
                      >
                        {simulation.difficulty}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{simulation.title}</CardTitle>
                    <CardDescription>
                      {simulation.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{simulation.unit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{simulation.estimatedTime} min</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full"
                        onClick={() => router.push(`/simulations/${simulation.slug}`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Simulation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* All Simulations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Simulations</h2>
        
        {filteredSimulations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No simulations found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms
                  </p>
                </>
              ) : (
                <>
                  <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No simulations available yet</h3>
                  <p className="text-muted-foreground">
                    Check back soon for interactive physics labs
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSimulations
              .filter(sim => !sim.isFeatured)
              .map((simulation) => (
                <Card 
                  key={simulation.id} 
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{simulation.unit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{simulation.estimatedTime} min</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full"
                        variant="outline"
                        onClick={() => router.push(`/simulations/${simulation.slug}`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Coming Soon Section */}
      <Card className="mt-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5 text-blue-500" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            More interactive simulations are in development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
              <div>
                <div className="font-medium">Accelerated Motion Lab</div>
                <div className="text-muted-foreground text-xs">Explore changing velocity</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-purple-500" />
              <div>
                <div className="font-medium">Free Fall Simulator</div>
                <div className="text-muted-foreground text-xs">Study gravity</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
              <div>
                <div className="font-medium">Projectile Motion</div>
                <div className="text-muted-foreground text-xs">2D trajectories</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-orange-500" />
              <div>
                <div className="font-medium">Force and Motion</div>
                <div className="text-muted-foreground text-xs">Newton&apos;s Laws</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-yellow-500" />
              <div>
                <div className="font-medium">Energy Conservation</div>
                <div className="text-muted-foreground text-xs">Energy transformations</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500" />
              <div>
                <div className="font-medium">Collision Lab</div>
                <div className="text-muted-foreground text-xs">Momentum & energy</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}