'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import MathMarkdown from '@/components/MathMarkdown'
import { ArrowLeft, Play, Pause, RotateCcw, Car, Zap, Gauge, Plus, Settings, FileText } from 'lucide-react'
import Link from 'next/link'
import { SimulationWrapper } from '@/components/simulations/SimulationWrapper'
import SimulationAssignment from '@/components/simulations/SimulationAssignment'
import SimulationAssignmentEditor from '@/components/simulations/SimulationAssignmentEditor'
import { useSimulationCompletion } from '@/hooks/useSimulationCompletion'
import SimulationProgress from '@/components/simulations/SimulationProgress'
import { getSimulationCriteria, getActionLabels } from '@/config/simulationCompletionCriteria'

interface OilSpot {
  x: number
  y: number
  time: number
  velocity: number
  position: number
}

interface SimulationState {
  isRunning: boolean
  time: number
  position: number
  velocity: number
  oilSpots: OilSpot[]
}

// Internal component with simulation logic
function UniformlyAcceleratedMotionContent({
  onInteraction,
  onComplete,
  requestAIHint
}: {
  onInteraction: (action: string, data: Record<string, any>) => void
  onComplete: (data: Record<string, any>, score?: number) => void
  requestAIHint: (question: string) => Promise<string>
}) {
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)
  const isAdmin = userRole === 'admin' || userRole === 'teacher'
  const totalSimulationTime = useRef(0)
  
  const [initialVelocity, setInitialVelocity] = useState([5])
  const [acceleration, setAcceleration] = useState([2])
  const [selectedFormula, setSelectedFormula] = useState<number | null>(null)
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    time: 0,
    position: 0,
    velocity: initialVelocity[0],
    oilSpots: []
  })
  // Use standardized completion tracking
  const completionConfig = getSimulationCriteria('uniformly-accelerated-motion')
  const actionLabelsMap = getActionLabels('uniformly-accelerated-motion')
  const {
    state: completionState,
    trackInteraction,
    markComplete,
    reset: resetCompletion
  } = useSimulationCompletion(completionConfig, onComplete)
  
  // Assignment state
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [editingAssignment, setEditingAssignment] = useState<any>(null)

  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const lastOilDropRef = useRef<number>(0)
  const lastDisplayUpdateRef = useRef<number>(0)
  
  // Use refs for real-time animation values to avoid re-renders
  const currentTimeRef = useRef<number>(0)
  const currentPositionRef = useRef<number>(0)
  const currentVelocityRef = useRef<number>(0)
  const oilSpotsRef = useRef<OilSpot[]>([])
  const carElementRef = useRef<HTMLDivElement>(null)
  const velocityArrowRef = useRef<HTMLDivElement>(null)
  
  // Load assignments for admin
  useEffect(() => {
    if (isAdmin) {
      loadAssignments()
    }
  }, [isAdmin])
  
  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/simulations/assignments?simulation_slug=uniformly-accelerated-motion')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }
  
  // Track total simulation time
  useEffect(() => {
    const interval = setInterval(() => {
      totalSimulationTime.current += 1
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const v0 = initialVelocity[0]
  const a = acceleration[0]

  // Kinematic equations
  const equations = [
    {
      id: 1,
      name: 'Velocity from Time',
      formula: 'v = v_0 + at',
      description: 'Find velocity when you know initial velocity, acceleration, and time',
      solves: 'Final Velocity (v)',
      given: 'v₀, a, t',
      example: `If v₀ = ${v0} m/s, a = ${a} m/s², and t = 3 s, then v = ${v0} + (${a})(3) = ${v0 + a * 3} m/s`
    },
    {
      id: 2,
      name: 'Position from Time',
      formula: 'x = x_0 + v_0 t + \\frac{1}{2}at^2',
      description: 'Find position when you know initial position, velocity, acceleration, and time',
      solves: 'Final Position (x)',
      given: 'x₀, v₀, a, t',
      example: `If x₀ = 0 m, v₀ = ${v0} m/s, a = ${a} m/s², and t = 3 s, then x = 0 + ${v0}(3) + ½(${a})(3²) = ${v0 * 3 + 0.5 * a * 9} m`
    },
    {
      id: 3,
      name: 'Velocity from Position',
      formula: 'v^2 = v_0^2 + 2a(x - x_0)',
      description: 'Find velocity when you know initial velocity, acceleration, and displacement (no time needed!)',
      solves: 'Final Velocity (v)',
      given: 'v₀, a, Δx',
      example: `If v₀ = ${v0} m/s, a = ${a} m/s², and Δx = 10 m, then v² = ${v0}² + 2(${a})(10) = ${v0 * v0 + 2 * a * 10}, so v = ${Math.sqrt(v0 * v0 + 2 * a * 10).toFixed(2)} m/s`
    },
    {
      id: 4,
      name: 'Average Velocity',
      formula: 'x = x_0 + \\frac{1}{2}(v_0 + v)t',
      description: 'Find position using average velocity (useful when you know both initial and final velocity)',
      solves: 'Final Position (x)',
      given: 'x₀, v₀, v, t',
      example: `If x₀ = 0 m, v₀ = ${v0} m/s, v = ${v0 + a * 3} m/s, and t = 3 s, then x = 0 + ½(${v0} + ${v0 + a * 3})(3) = ${0.5 * (v0 + v0 + a * 3) * 3} m`
    }
  ]

  const reset = useCallback(() => {
    currentTimeRef.current = 0
    currentPositionRef.current = 0
    currentVelocityRef.current = v0
    oilSpotsRef.current = []
    
    setSimulationState({
      isRunning: false,
      time: 0,
      position: 0,
      velocity: v0,
      oilSpots: []
    })
    
    lastTimeRef.current = 0
    lastOilDropRef.current = 0
    lastDisplayUpdateRef.current = 0
    
    // Reset car position immediately
    if (carElementRef.current) {
      carElementRef.current.style.transform = 'translate(-50%, -50%)'
      carElementRef.current.style.left = '0%'
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    resetCompletion() // Reset completion tracking
  }, [v0, resetCompletion])

  // Enhanced interaction tracking wrapper
  const handleInteraction = useCallback((action: string, data: Record<string, any>) => {
    // Call the original onInteraction from SimulationWrapper
    onInteraction(action, data)
    
    // Track with standardized system
    trackInteraction(action, data)
  }, [onInteraction, trackInteraction])
  
  const toggleSimulation = useCallback(() => {
    setSimulationState(prev => {
      const newState = {
        ...prev,
        isRunning: !prev.isRunning
      }
      
      // Track start/pause
      handleInteraction(newState.isRunning ? 'start' : 'pause', {
        initialVelocity: v0,
        acceleration: a,
        currentTime: prev.time,
        currentPosition: prev.position,
        oilSpots: prev.oilSpots.length
      })
      
      return newState
    })
  }, [handleInteraction, v0, a])

  // Animation loop - optimized for smooth 60fps
  useEffect(() => {
    if (!simulationState.isRunning) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
        lastOilDropRef.current = timestamp
        lastDisplayUpdateRef.current = timestamp
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000 // Convert to seconds
      lastTimeRef.current = timestamp

      // Update animation values using refs (no re-render)
      currentTimeRef.current += deltaTime
      const newTime = currentTimeRef.current
      const newVelocity = v0 + a * newTime
      const newPosition = v0 * newTime + 0.5 * a * newTime * newTime

      currentVelocityRef.current = newVelocity
      currentPositionRef.current = newPosition

      // Update car position directly via DOM (smooth, no re-render)
      if (carElementRef.current) {
        const leftPercent = Math.min((newPosition / 400) * 100, 98)
        carElementRef.current.style.left = `${leftPercent}%`
      }

      // Update velocity arrow size
      if (velocityArrowRef.current && newVelocity > 0) {
        velocityArrowRef.current.style.width = `${Math.abs(newVelocity) * 3}px`
        velocityArrowRef.current.style.display = 'flex'
      } else if (velocityArrowRef.current) {
        velocityArrowRef.current.style.display = 'none'
      }

      // Drop oil spot every second
      if (timestamp - lastOilDropRef.current >= 1000) {
        oilSpotsRef.current = [...oilSpotsRef.current, {
          x: newPosition,
          y: 250,
          time: newTime,
          velocity: newVelocity,
          position: newPosition
        }]
        lastOilDropRef.current = timestamp
      }

      // Update display state only every 50ms (20 times per second is enough for numbers)
      if (timestamp - lastDisplayUpdateRef.current >= 50) {
        setSimulationState(prev => ({
          ...prev,
          time: newTime,
          position: newPosition,
          velocity: newVelocity,
          oilSpots: [...oilSpotsRef.current]
        }))
        lastDisplayUpdateRef.current = timestamp
      }

      // Stop if car goes off screen or time exceeds 15 seconds
      if (newPosition > 400 || newTime > 15) {
        setSimulationState(prev => ({
          ...prev,
          isRunning: false,
          time: newTime,
          position: newPosition,
          velocity: newVelocity,
          oilSpots: [...oilSpotsRef.current]
        }))
        
        // Track completion on first full run
        if (!hasCompletedRun) {
          setHasCompletedRun(true)
          markComplete({
            initialVelocity: v0,
            acceleration: a,
            finalTime: newTime,
            finalPosition: newPosition,
            finalVelocity: newVelocity,
            oilSpots: oilSpotsRef.current.length
          }, 100) // Full completion score
        }
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        return
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [simulationState.isRunning, v0, a])

  // Reset when parameters change
  useEffect(() => {
    reset()
  }, [initialVelocity, acceleration, reset])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/simulations">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Uniformly Accelerated Motion</h1>
              <p className="text-gray-600 mt-1">Visualize constant acceleration with oil spot patterns</p>
            </div>
            <Badge variant="default">Intermediate</Badge>
            {isAdmin && assignments.length > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <FileText className="h-3 w-3 mr-1" />
                {assignments.length} Assignment{assignments.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingAssignment(null)
                    setShowAssignmentEditor(true)
                  }}
                  className="bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Assignment
                </Button>
                {assignments.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingAssignment(assignments[0])
                      setShowAssignmentEditor(true)
                    }}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Progress Indicator (for students) */}
        {!isAdmin && (
          <SimulationProgress 
            state={completionState}
            actionLabels={actionLabelsMap}
            hideWhenComplete={false}
          />
        )}

        <Tabs defaultValue="simulation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simulation">Interactive Simulation</TabsTrigger>
            <TabsTrigger value="equations">Kinematic Equations</TabsTrigger>
          </TabsList>

          {/* Simulation Tab */}
          <TabsContent value="simulation" className="space-y-6">
            {/* Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Simulation Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Initial Velocity Control */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Initial Velocity (v₀)
                      </label>
                      <Badge variant="secondary">{v0} m/s</Badge>
                    </div>
                    <Slider
                      value={initialVelocity}
                      onValueChange={(val) => {
                        setInitialVelocity(val)
                        handleInteraction('initial_velocity_changed', { value: val[0] })
                      }}
                      min={0}
                      max={20}
                      step={1}
                      disabled={simulationState.isRunning}
                    />
                    <p className="text-xs text-muted-foreground">
                      Starting speed of the car
                    </p>
                  </div>

                  {/* Acceleration Control */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Acceleration (a)
                      </label>
                      <Badge variant="secondary">{a} m/s²</Badge>
                    </div>
                    <Slider
                      value={acceleration}
                      onValueChange={(val) => {
                        setAcceleration(val)
                        handleInteraction('acceleration_changed', { value: val[0] })
                      }}
                      min={-5}
                      max={5}
                      step={0.5}
                      disabled={simulationState.isRunning}
                    />
                    <p className="text-xs text-muted-foreground">
                      Rate of velocity change (negative = slowing down)
                    </p>
                  </div>
                </div>

                {/* Simulation Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={toggleSimulation}
                    className="flex-1"
                    variant={simulationState.isRunning ? 'destructive' : 'default'}
                  >
                    {simulationState.isRunning ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button onClick={reset} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Simulation Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Bird&apos;s Eye View
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  The car drops an oil spot every second. Watch the pattern!
                </p>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-[500px] bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg overflow-hidden border-4 border-gray-400">
                  {/* Road markings */}
                  <div className="absolute inset-0">
                    {/* Lane dividers */}
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute bg-yellow-300 h-1"
                        style={{
                          top: '50%',
                          left: `${i * 5}%`,
                          width: '3%',
                          transform: 'translateY(-50%)'
                        }}
                      />
                    ))}
                  </div>

                  {/* Distance markers */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-around text-xs font-semibold text-gray-700">
                    {[0, 50, 100, 150, 200, 250, 300, 350, 400].map(dist => (
                      <div key={dist}>{dist}m</div>
                    ))}
                  </div>

                  {/* Oil spots */}
                  {simulationState.oilSpots.map((spot, idx) => (
                    <div
                      key={idx}
                      className="absolute"
                      style={{
                        left: `${(spot.x / 400) * 100}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="relative">
                        {/* Oil spot */}
                        <div className="w-4 h-4 bg-black rounded-full opacity-70" />
                        {/* Time label */}
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600 whitespace-nowrap">
                          t={spot.time.toFixed(0)}s
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Car */}
                  <div
                    ref={carElementRef}
                    className="absolute will-change-transform"
                    style={{
                      left: '0%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="relative">
                      {/* Car body */}
                      <div className="w-12 h-8 bg-red-600 rounded-lg shadow-lg border-2 border-red-800">
                        <div className="absolute inset-1 bg-gradient-to-b from-red-500 to-red-700 rounded" />
                        {/* Windshield */}
                        <div className="absolute top-1 right-1 w-4 h-3 bg-blue-200 rounded opacity-70" />
                      </div>
                      {/* Velocity arrow */}
                      <div 
                        ref={velocityArrowRef}
                        className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 items-center"
                        style={{ width: '0px', display: 'none' }}
                      >
                        <div className="h-0.5 bg-green-500 flex-1" />
                        <div className="w-0 h-0 border-l-4 border-l-green-500 border-t-2 border-t-transparent border-b-2 border-b-transparent" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time data */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium mb-1">Time</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {simulationState.time.toFixed(2)} s
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-600 font-medium mb-1">Position</div>
                    <div className="text-2xl font-bold text-green-900">
                      {simulationState.position.toFixed(1)} m
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium mb-1">Velocity</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {simulationState.velocity.toFixed(1)} m/s
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Observations */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg">🔍 Key Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-yellow-600 flex-shrink-0" />
                    <div>
                      <strong>Positive Acceleration:</strong> Oil spots get farther apart as time increases (car is speeding up)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-orange-600 flex-shrink-0" />
                    <div>
                      <strong>Negative Acceleration:</strong> Oil spots get closer together (car is slowing down)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-red-600 flex-shrink-0" />
                    <div>
                      <strong>Zero Acceleration:</strong> Oil spots are evenly spaced (constant velocity)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                    <div>
                      <strong>Pattern:</strong> The spacing between consecutive spots increases by a constant amount each second (this is what &quot;uniform acceleration&quot; means!)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equations Tab */}
          <TabsContent value="equations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>The Four Kinematic Equations</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  These equations describe motion with constant acceleration. Each solves for a different variable.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {equations.map((eq) => (
                    <Card
                      key={eq.id}
                      className={`cursor-pointer transition-all ${
                        selectedFormula === eq.id
                          ? 'ring-2 ring-primary shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedFormula(selectedFormula === eq.id ? null : eq.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{eq.name}</span>
                          <Badge variant="outline">Equation {eq.id}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <MathMarkdown content={`\\[ ${eq.formula} \\]`} />
                        </div>
                        <p className="text-sm text-gray-700">{eq.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-green-50 p-2 rounded">
                            <div className="font-semibold text-green-800">Solves For:</div>
                            <div className="text-green-700">{eq.solves}</div>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <div className="font-semibold text-purple-800">Given:</div>
                            <div className="text-purple-700">{eq.given}</div>
                          </div>
                        </div>

                        {selectedFormula === eq.id && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="font-semibold text-sm mb-2">Example with current values:</div>
                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {eq.example}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* When to use which equation */}
            <Card>
              <CardHeader>
                <CardTitle>Choosing the Right Equation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Step 1: Identify what you know</h4>
                    <p className="text-sm text-blue-800">
                      List the given variables: x₀, v₀, x, v, a, t
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Step 2: Identify what you want to find</h4>
                    <p className="text-sm text-green-800">
                      What is the unknown variable you&apos;re solving for?
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Step 3: Choose the equation</h4>
                    <p className="text-sm text-purple-800 mb-3">
                      Pick the equation that contains your unknown variable and all your known variables (and doesn&apos;t include variables you don&apos;t know).
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2 rounded border border-purple-200">
                        <strong>No time?</strong> Use v² = v₀² + 2aΔx
                      </div>
                      <div className="bg-white p-2 rounded border border-purple-200">
                        <strong>No final velocity?</strong> Use x = x₀ + v₀t + ½at²
                      </div>
                      <div className="bg-white p-2 rounded border border-purple-200">
                        <strong>No acceleration?</strong> Use x = x₀ + vt (constant velocity!)
                      </div>
                      <div className="bg-white p-2 rounded border border-purple-200">
                        <strong>No displacement?</strong> Use v = v₀ + at
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variable reference */}
            <Card>
              <CardHeader>
                <CardTitle>Variable Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { symbol: 'x', name: 'Final Position', unit: 'meters (m)' },
                    { symbol: 'x₀', name: 'Initial Position', unit: 'meters (m)' },
                    { symbol: 'v', name: 'Final Velocity', unit: 'meters/second (m/s)' },
                    { symbol: 'v₀', name: 'Initial Velocity', unit: 'meters/second (m/s)' },
                    { symbol: 'a', name: 'Acceleration', unit: 'meters/second² (m/s²)' },
                    { symbol: 't', name: 'Time', unit: 'seconds (s)' }
                  ].map((variable) => (
                    <div key={variable.symbol} className="bg-gray-50 p-3 rounded-lg border">
                      <div className="font-bold text-lg text-gray-900">{variable.symbol}</div>
                      <div className="text-sm text-gray-700">{variable.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{variable.unit}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assignment Components */}
        {!isAdmin && (
          <SimulationAssignment
            simulationSlug="uniformly-accelerated-motion"
            simulationTime={totalSimulationTime.current}
            simulationCompleted={completionState.isCompleted}
            simulationData={{
              initialVelocity: v0,
              acceleration: a,
              finalPosition: simulationState.position,
              finalVelocity: simulationState.velocity,
              oilSpots: simulationState.oilSpots.length,
              time: simulationState.time
            }}
          />
        )}

        {isAdmin && showAssignmentEditor && (
          <SimulationAssignmentEditor
            isOpen={showAssignmentEditor}
            onClose={() => {
              setShowAssignmentEditor(false)
              setEditingAssignment(null)
            }}
            simulationSlug="uniformly-accelerated-motion"
            assignment={editingAssignment}
            onSave={(assignment) => {
              loadAssignments()
              setShowAssignmentEditor(false)
              setEditingAssignment(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

// Wrapped export with tracking
export default function UniformlyAcceleratedMotion() {
  return (
    <SimulationWrapper
      simulationSlug="uniformly-accelerated-motion"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <UniformlyAcceleratedMotionContent {...props} />}
    </SimulationWrapper>
  )
}
