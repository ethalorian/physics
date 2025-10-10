'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MathMarkdown from '@/components/MathMarkdown'
import { ArrowLeft, Play, RotateCcw, Mountain, Droplets, Timer, Calculator, AlertCircle, Plus, Settings, FileText } from 'lucide-react'
import Link from 'next/link'
import { SimulationWrapper } from '@/components/simulations/SimulationWrapper'
import SimulationAssignment from '@/components/simulations/SimulationAssignment'
import SimulationAssignmentEditor from '@/components/simulations/SimulationAssignmentEditor'

interface PositionTrace {
  y: number
  time: number
}

interface Trial {
  fallTime: number
  calculatedHeight: number
  traces: PositionTrace[]
}

// Internal component with simulation logic
function FreefallCliffLabContent({
  onInteraction,
  onComplete
}: {
  onInteraction: (action: string, data: Record<string, any>) => void
  onComplete: (data: Record<string, any>, score?: number) => void
}) {
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)
  const isAdmin = userRole === 'admin' || userRole === 'teacher'
  const totalSimulationTime = useRef(0)
  
  const [isDropping, setIsDropping] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [stonePosition, setStonePosition] = useState(0)
  const [traces, setTraces] = useState<PositionTrace[]>([])
  const [trials, setTrials] = useState<Trial[]>([])
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [isExampleMode, setIsExampleMode] = useState(true) // Start with example
  const [cliffHeight, setCliffHeight] = useState(45) // Example: 45m
  const [simulationCompleted, setSimulationCompleted] = useState(false)
  
  // Assignment state
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number>(0)
  const lastTraceRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const stoneElementRef = useRef<HTMLDivElement>(null)
  
  // Load assignments for admin
  useEffect(() => {
    if (isAdmin) {
      loadAssignments()
    }
  }, [isAdmin])
  
  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/simulations/assignments?simulation_slug=freefall-cliff')
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

  const g = 9.8 // m/s²
  const pixelsPerMeter = 6 // Visual scaling

  const reset = useCallback(() => {
    setIsDropping(false)
    setCurrentTime(0)
    setStonePosition(0)
    setTraces([])
    lastTimeRef.current = 0
    lastTraceRef.current = 0
    startTimeRef.current = 0
    
    if (stoneElementRef.current) {
      stoneElementRef.current.style.top = '0px'
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const startRandomMode = useCallback(() => {
    const newHeight = Math.floor(Math.random() * 30 + 40) // Random 40-70m
    setIsExampleMode(false)
    setCliffHeight(newHeight)
    setTrials([])
    setShowAnalysis(false)
    reset()
    
    // Track starting random mode
    onInteraction('start-random-mode', {
      cliffHeight: newHeight
    })
  }, [reset, onInteraction])

  const dropStone = useCallback(() => {
    if (isDropping) return
    
    reset()
    setIsDropping(true)
    setTraces([{ y: 0, time: 0 }]) // Initial position
    
    // Track stone drop
    onInteraction('drop-stone', {
      cliffHeight,
      isExampleMode,
      trialNumber: trials.length + 1
    })
  }, [isDropping, reset, onInteraction, cliffHeight, isExampleMode, trials.length])

  const calculateHeight = useCallback((time: number) => {
    // h = (1/2) * g * t²
    return 0.5 * g * time * time
  }, [])

  // Animation loop
  useEffect(() => {
    if (!isDropping) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const animate = (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp
        lastTimeRef.current = timestamp
        lastTraceRef.current = timestamp
      }

      lastTimeRef.current = timestamp

      const elapsedTime = (timestamp - startTimeRef.current) / 1000
      const newPosition = calculateHeight(elapsedTime)

      setCurrentTime(elapsedTime)
      setStonePosition(newPosition)

      // Update stone position via DOM
      if (stoneElementRef.current) {
        stoneElementRef.current.style.top = `${newPosition * pixelsPerMeter}px`
      }

      // Add trace every 0.25 seconds
      if (timestamp - lastTraceRef.current >= 250) {
        setTraces(prev => [...prev, { y: newPosition, time: elapsedTime }])
        lastTraceRef.current = timestamp
      }

      // Check if stone hit water
      if (newPosition >= cliffHeight) {
        const finalTime = Math.sqrt((2 * cliffHeight) / g) // Accurate time when hitting water
        
        const newTrial = {
          fallTime: finalTime,
          calculatedHeight: calculateHeight(finalTime),
          traces: [...traces, { y: cliffHeight, time: finalTime }]
        }
        
        setTrials(prev => [...prev, newTrial])
        
        // Track trial completion
        onInteraction('trial-completed', {
          cliffHeight,
          fallTime: finalTime,
          calculatedHeight: newTrial.calculatedHeight,
          trialNumber: trials.length + 1,
          isExampleMode
        })
        
        setIsDropping(false)
        setCurrentTime(finalTime)
        setStonePosition(cliffHeight)
        
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
  }, [isDropping, cliffHeight, calculateHeight, traces, trials, onInteraction, isExampleMode])

  const averageFallTime = trials.length > 0
    ? trials.reduce((sum, t) => sum + t.fallTime, 0) / trials.length
    : 0

  const averageCalculatedHeight = trials.length > 0
    ? trials.reduce((sum, t) => sum + t.calculatedHeight, 0) / trials.length
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-50 p-4 md:p-8">
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
              <h1 className="text-3xl font-bold text-gray-900">Freefall Cliff Lab</h1>
              <p className="text-gray-600 mt-1">Use physics to measure cliff height by dropping a stone</p>
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

        <Tabs defaultValue="lab" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lab">Lab Simulation</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="theory">Theory</TabsTrigger>
          </TabsList>

          {/* Lab Tab */}
          <TabsContent value="lab" className="space-y-6">
            {/* Scenario */}
            <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mountain className="h-5 w-5 text-orange-600" />
                  The Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">
                  A traveler needs to jump from a cliff into the water below, but doesn&apos;t know how high the cliff is. 
                  Your mission: <strong>Use physics to determine the cliff height by dropping a stone and timing its fall!</strong>
                </p>
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Hint: Objects in freefall accelerate at g = 9.8 m/s². Use the equation: h = ½gt²
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example Problem */}
            {isExampleMode && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    Worked Example
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-gray-700 mb-3">
                      Let&apos;s work through an example together. This cliff is <strong className="text-blue-700">45 meters</strong> high.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">Step-by-Step Solution:</h4>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-semibold text-gray-900">Step 1: Drop the stone and measure fall time</div>
                        <p className="text-gray-600 ml-4">The stone takes <strong>3.03 seconds</strong> to hit the water</p>
                      </div>

                      <div>
                        <div className="font-semibold text-gray-900">Step 2: Use the freefall equation</div>
                        <div className="ml-4 bg-blue-50 p-3 rounded mt-2">
                          <MathMarkdown content="\\[ h = \\frac{1}{2}gt^2 \\]" />
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold text-gray-900">Step 3: Plug in the values</div>
                        <div className="ml-4 space-y-1 text-gray-700 mt-2">
                          <div>• g = 9.8 m/s² (gravity)</div>
                          <div>• t = 3.03 s (measured fall time)</div>
                          <div className="mt-2 bg-blue-50 p-3 rounded">
                            <MathMarkdown content="\\[ h = \\frac{1}{2}(9.8)(3.03)^2 \\]" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold text-gray-900">Step 4: Calculate</div>
                        <div className="ml-4 space-y-1 text-gray-700 mt-2">
                          <div>h = 0.5 × 9.8 × 9.18</div>
                          <div>h = 4.9 × 9.18</div>
                          <div className="font-bold text-green-700 text-base">h = 45.0 m ✓</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-900">
                        <strong>Key Insight:</strong> By measuring just the fall time, we can calculate the height! 
                        Now try it yourself with a random cliff height below.
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={startRandomMode}
                    className="w-full"
                    size="lg"
                  >
                    Start Lab with Random Cliff Height
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Simulation Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mountain className="h-5 w-5" />
                      Cliff Scene
                    </span>
                    <div className="flex items-center gap-2">
                      {isExampleMode && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          Example: 45m
                        </Badge>
                      )}
                      {!isExampleMode && !showAnalysis && (
                        <Badge variant="secondary">Trial {trials.length + 1}</Badge>
                      )}
                      {!isExampleMode && showAnalysis && (
                        <Badge variant="default" className="bg-green-600">
                          Height: {cliffHeight}m
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full bg-gradient-to-b from-sky-200 to-blue-300 rounded-lg overflow-hidden border-4 border-gray-400"
                    style={{ height: `${cliffHeight * pixelsPerMeter + 100}px` }}>
                    
                    {/* Sky background with clouds */}
                    <div className="absolute inset-0">
                      <div className="absolute top-10 left-20 w-16 h-8 bg-white opacity-70 rounded-full blur-sm" />
                      <div className="absolute top-20 right-16 w-20 h-10 bg-white opacity-60 rounded-full blur-sm" />
                      <div className="absolute top-40 left-1/3 w-12 h-6 bg-white opacity-50 rounded-full blur-sm" />
                    </div>

                    {/* Cliff */}
                    <div className="absolute left-0 top-0 bottom-20 w-32 bg-gradient-to-r from-gray-600 to-gray-500 border-r-4 border-gray-700">
                      {/* Cliff texture */}
                      <div className="absolute inset-0 opacity-20">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} 
                            className="absolute w-full h-px bg-gray-800"
                            style={{ top: `${i * 10}%` }}
                          />
                        ))}
                      </div>
                      
                      {/* Cliff edge indicator */}
                      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-r from-transparent to-gray-800 opacity-50" />
                    </div>

                    {/* Traveler on cliff */}
                    <div className="absolute left-20 top-2">
                      <div className="relative">
                        {/* Person */}
                        <div className="w-8 h-12 flex flex-col items-center">
                          {/* Head */}
                          <div className="w-6 h-6 bg-yellow-600 rounded-full border-2 border-yellow-700" />
                          {/* Body */}
                          <div className="w-4 h-6 bg-blue-600 rounded-sm" />
                        </div>
                        {/* Speech bubble */}
                        <div className="absolute -right-28 -top-2 bg-white p-2 rounded-lg shadow-lg text-xs whitespace-nowrap border border-gray-300">
                          How high is this?
                          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-white border-l border-b border-gray-300 rotate-45" />
                        </div>
                      </div>
                    </div>

                    {/* Position traces */}
                    {traces.map((trace, idx) => (
                      <div
                        key={idx}
                        className="absolute left-24"
                        style={{ top: `${trace.y * pixelsPerMeter}px` }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full shadow-lg" />
                          <div className="text-xs font-semibold text-red-700 bg-white px-1.5 py-0.5 rounded shadow-sm ml-2">
                            t={trace.time.toFixed(2)}s
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Falling stone */}
                    {isDropping && (
                      <div
                        ref={stoneElementRef}
                        className="absolute left-24 will-change-transform"
                        style={{ top: '0px' }}
                      >
                        <div className="w-4 h-4 bg-gray-700 rounded-full shadow-lg border-2 border-gray-800" />
                      </div>
                    )}

                    {/* Water */}
                    <div 
                      className="absolute left-0 right-0 bottom-0 h-20 bg-gradient-to-b from-blue-400 to-blue-600"
                    >
                      {/* Wave effect */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-300" />
                      <div className="absolute inset-0 opacity-30">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i}
                            className="absolute w-full h-px bg-white"
                            style={{ 
                              top: `${20 + i * 15}%`,
                              animation: `wave ${2 + i * 0.5}s ease-in-out infinite`
                            }}
                          />
                        ))}
                      </div>
                      {/* Splash if just landed */}
                      {!isDropping && trials.length > 0 && trials.length === trials.length && (
                        <div className="absolute top-0 left-24 transform -translate-y-4">
                          <Droplets className="h-8 w-8 text-blue-200 animate-bounce" />
                        </div>
                      )}
                    </div>

                    {/* Height scale */}
                    <div className="absolute right-2 top-0 bottom-20 flex flex-col justify-between text-xs text-gray-700 font-semibold">
                      {[...Array(Math.ceil(cliffHeight / 10) + 1)].map((_, i) => (
                        <div key={i} className="bg-white px-1 rounded shadow-sm">
                          {i * 10}m
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={dropStone}
                        disabled={isDropping}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Drop Stone
                      </Button>
                      <Button
                        onClick={reset}
                        variant="outline"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>

                    {/* Timer Display */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-1">
                          <Timer className="h-4 w-4" />
                          Fall Time
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {currentTime.toFixed(3)} s
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-green-600 font-medium mb-1">
                          Distance Fallen
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          {stonePosition.toFixed(1)} m
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Collection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Trial Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trials.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Mountain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Drop the stone to collect data</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {trials.map((trial, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">Trial {idx + 1}</span>
                              <Badge variant="outline">
                                {trial.fallTime.toFixed(3)}s
                              </Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Fall Time:</span>
                                <span className="font-mono">{trial.fallTime.toFixed(3)} s</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Calculated Height:</span>
                                <span className="font-mono">{trial.calculatedHeight.toFixed(2)} m</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Average Results */}
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Average Results ({trials.length} trials)</h4>
                        <div className="space-y-2">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm text-blue-700 mb-1">Average Fall Time</div>
                            <div className="text-xl font-bold text-blue-900">
                              {averageFallTime.toFixed(3)} s
                            </div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="text-sm text-purple-700 mb-1">
                              Calculated Cliff Height
                            </div>
                            <div className="text-xl font-bold text-purple-900">
                              {averageCalculatedHeight.toFixed(2)} m
                            </div>
                            <div className="text-xs text-purple-600 mt-1">
                              Using h = ½gt² with g = 9.8 m/s²
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => {
                          setShowAnalysis(true)
                          
                          // Track answer check
                          const errorPercent = Math.abs(averageCalculatedHeight - cliffHeight) / cliffHeight * 100
                          const score = Math.max(0, 100 - errorPercent * 2) // Score based on accuracy
                          
                          onInteraction('check-answer', {
                            cliffHeight,
                            averageCalculatedHeight,
                            averageFallTime,
                            trials: trials.length,
                            errorPercent,
                            score
                          })
                          
                          // Mark as complete if they did at least 3 trials
                          if (trials.length >= 3) {
                            onComplete({
                              cliffHeight,
                              calculatedHeight: averageCalculatedHeight,
                              trials: trials.length,
                              averageError: Math.abs(averageCalculatedHeight - cliffHeight)
                            }, Math.round(score))
                          }
                        }}
                        className="w-full"
                        variant="default"
                      >
                        Check Your Answer
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Answer Reveal */}
            {showAnalysis && (
              <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-green-900">Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-sm text-gray-600 mb-1">Actual Cliff Height</div>
                      <div className="text-3xl font-bold text-green-700">
                        {cliffHeight.toFixed(1)} m
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <div className="text-sm text-gray-600 mb-1">Your Calculation</div>
                      <div className="text-3xl font-bold text-purple-700">
                        {averageCalculatedHeight.toFixed(2)} m
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="font-semibold mb-2">Error Analysis</div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Absolute Error:</span>
                        <span className="font-mono">
                          {Math.abs(averageCalculatedHeight - cliffHeight).toFixed(2)} m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Percent Error:</span>
                        <span className="font-mono">
                          {(Math.abs(averageCalculatedHeight - cliffHeight) / cliffHeight * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Great work!</strong> You used the freefall equation h = ½gt² to determine the cliff height. 
                      Small differences from the actual value are normal due to the timing precision of your measurements.
                    </p>
                  </div>

                  <Button 
                    onClick={() => {
                      setCliffHeight(Math.floor(Math.random() * 30 + 40)) // New random height
                      setTrials([])
                      setShowAnalysis(false)
                      reset()
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    Try New Random Cliff Height
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyzing Freefall Motion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Position Traces</h3>
                  <p className="text-gray-700 mb-3">
                    The red dots show the stone&apos;s position every 0.25 seconds. Notice how they get farther apart as the stone falls!
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-900">
                        <strong>Key Observation:</strong> The increasing spacing between traces shows that the stone is accelerating. 
                        In freefall, all objects accelerate downward at g = 9.8 m/s², regardless of their mass!
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Distance vs Time Pattern</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <MathMarkdown content="In freefall, distance increases with the **square of time**: \\( h = \\frac{1}{2}gt^2 \\)" />
                    <p className="text-sm text-gray-700 mt-3">
                      This means if you double the time, the distance increases by a factor of 4!
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-700 mb-1">1s</div>
                    <div className="text-sm text-blue-600">Falls 4.9 m</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-700 mb-1">2s</div>
                    <div className="text-sm text-green-600">Falls 19.6 m (4×)</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-700 mb-1">3s</div>
                    <div className="text-sm text-purple-600">Falls 44.1 m (9×)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theory Tab */}
          <TabsContent value="theory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Freefall Physics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">The Freefall Equation</h3>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <MathMarkdown content="\\[ h = \\frac{1}{2}gt^2 \\]" />
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-blue-900 w-8">h =</span>
                        <span className="text-gray-700">Height (distance fallen) in meters</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-blue-900 w-8">g =</span>
                        <span className="text-gray-700">Acceleration due to gravity = 9.8 m/s²</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-blue-900 w-8">t =</span>
                        <span className="text-gray-700">Time in seconds</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Why Does This Work?</h3>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      When you drop an object, it starts from rest (v₀ = 0) and accelerates downward due to gravity. 
                      The general kinematic equation is:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <MathMarkdown content="\\[ h = v_0 t + \\frac{1}{2}at^2 \\]" />
                    </div>
                    <p>
                      Since v₀ = 0 and a = g, this simplifies to:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <MathMarkdown content="\\[ h = \\frac{1}{2}gt^2 \\]" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Solving for Height</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-3">
                      <strong>Given:</strong> You measure the fall time (t)
                    </p>
                    <p className="text-gray-700 mb-3">
                      <strong>Find:</strong> Cliff height (h)
                    </p>
                    <p className="text-gray-700">
                      <strong>Solution:</strong> Plug the time into the equation: h = ½(9.8)t²
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Important Assumptions</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <p className="text-gray-700">
                        <strong>No air resistance:</strong> We assume the stone falls in a vacuum (good approximation for dense objects)
                      </p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <div className="mt-1 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                      <p className="text-gray-700">
                        <strong>Dropped from rest:</strong> Initial velocity v₀ = 0 (not thrown downward)
                      </p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <div className="mt-1 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                      <p className="text-gray-700">
                        <strong>Constant gravity:</strong> g = 9.8 m/s² throughout the fall (valid for small heights)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Real-World Applications</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="font-semibold text-orange-900 mb-1">Cliff Diving</div>
                      <div className="text-sm text-orange-800">
                        Divers calculate safe jump heights based on fall time to water
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="font-semibold text-blue-900 mb-1">Well Depth</div>
                      <div className="text-sm text-blue-800">
                        Drop a stone and listen for the splash to estimate depth
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="font-semibold text-green-900 mb-1">Skydiving</div>
                      <div className="text-sm text-green-800">
                        Understanding freefall helps skydivers plan their jumps
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="font-semibold text-purple-900 mb-1">Safety Engineering</div>
                      <div className="text-sm text-purple-800">
                        Calculate impact forces for fall protection systems
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assignment Components */}
        {!isAdmin && (
          <SimulationAssignment
            simulationSlug="freefall-cliff"
            simulationTime={totalSimulationTime.current}
            simulationCompleted={simulationCompleted}
            simulationData={{
              trials,
              averageFallTime,
              averageCalculatedHeight,
              cliffHeight,
              isExampleMode
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
            simulationSlug="freefall-cliff"
            assignment={editingAssignment}
            onSave={(assignment) => {
              loadAssignments()
              setShowAssignmentEditor(false)
              setEditingAssignment(null)
            }}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}

// Wrapped export with tracking
export default function FreefallCliffLab() {
  return (
    <SimulationWrapper
      simulationSlug="freefall-cliff"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <FreefallCliffLabContent {...props} />}
    </SimulationWrapper>
  )
}
