'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import { CreateSimulationAssignmentForm } from '@/components/assignment-system/CreateSimulationAssignmentForm'
import { getUserRole } from '@/lib/permissions'

interface Simulation {
  id: string
  title: string
  slug: string
  description: string
  category: string
  difficulty: string
  estimated_time: number
  unit: string
}

export default function CreateSimulationAssignmentPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'select' | 'configure'>('select')

  // Check permissions
  const userRole = getUserRole(session?.user?.email)
  const canCreate = userRole === 'admin' || userRole === 'teacher'

  useEffect(() => {
    if (!canCreate) {
      router.push('/dashboard')
    }
  }, [canCreate, router])

  // Load simulations
  useEffect(() => {
    async function loadSimulations() {
      try {
        const response = await fetch('/api/simulations?published=true')
        if (response.ok) {
          const data = await response.json()
          setSimulations(data.simulations || [])
        }
      } catch (error) {
        console.error('Error loading simulations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSimulations()
  }, [])

  const handleSelectSimulation = (sim: Simulation) => {
    setSelectedSimulation(sim)
    setStep('configure')
  }

  const handleBack = () => {
    if (step === 'configure') {
      setStep('select')
      setSelectedSimulation(null)
    } else {
      router.push('/admin/assignments')
    }
  }

  const handleSuccess = () => {
    router.push('/admin/assignments')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-700 border-green-500/20'
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
      case 'advanced':
        return 'bg-red-500/10 text-red-700 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20'
    }
  }

  if (!canCreate) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 'select' ? 'Back to Assignments' : 'Back to Selection'}
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FlaskConical className="h-8 w-8 text-primary" />
              Create Simulation Assignment
            </h1>
            <p className="text-muted-foreground">
              {step === 'select' 
                ? 'Select a simulation to assign to your students'
                : 'Configure assignment details and select students'
              }
            </p>
          </div>
          {step === 'configure' && selectedSimulation && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              {selectedSimulation.title}
            </Badge>
          )}
        </div>
      </div>

      {/* Step 1: Select Simulation */}
      {step === 'select' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : simulations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Simulations Available</h3>
                <p className="text-muted-foreground">
                  No published simulations found. Please add simulations first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {simulations.map((sim) => (
                <Card 
                  key={sim.id}
                  className="hover:shadow-lg transition-all cursor-pointer hover:border-primary"
                  onClick={() => handleSelectSimulation(sim)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant="outline" 
                        className={getDifficultyColor(sim.difficulty)}
                      >
                        {sim.difficulty}
                      </Badge>
                      <Badge variant="secondary">
                        {sim.estimated_time} min
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{sim.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {sim.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{sim.unit}</span>
                      <Button variant="ghost" size="sm">
                        Select →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Configure Assignment */}
      {step === 'configure' && selectedSimulation && (
        <CreateSimulationAssignmentForm
          simulation={selectedSimulation}
          onSuccess={handleSuccess}
          onCancel={handleBack}
        />
      )}
    </div>
  )
}

