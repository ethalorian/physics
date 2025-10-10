"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SimulationWrapper } from '@/components/simulations/SimulationWrapper'
import SimulationAssignment from '@/components/simulations/SimulationAssignment'
import SimulationAssignmentEditor from '@/components/simulations/SimulationAssignmentEditor'
import { 
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  BarChart3,
  Table as TableIcon,
  Info,
  ChevronLeft,
  ChevronRight,
  Square,
  FileText,
  Plus,
  Settings
} from 'lucide-react'

interface DataPoint {
  time: number
  position: number
  velocity: number
}

type Direction = 'forward' | 'backward' | 'stopped'

// Internal component with simulation logic
function ConstantVelocityLabContent({
  onInteraction,
  onComplete
}: {
  onInteraction: (action: string, data: Record<string, any>) => void
  onComplete: (data: Record<string, any>, score?: number) => void
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)
  const isAdmin = userRole === 'admin' || userRole === 'teacher'

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [direction, setDirection] = useState<Direction>('stopped')
  const [speed, setSpeed] = useState(1) // m/s
  const [position, setPosition] = useState(0) // meters from origin
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [simulationCompleted, setSimulationCompleted] = useState(false)
  
  // Assignment state
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  
  const dataIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const totalSimulationTime = useRef(0)

  // Load assignments for admin
  useEffect(() => {
    if (isAdmin) {
      loadAssignments()
    }
  }, [isAdmin])

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/simulations/assignments?simulation_slug=constant-velocity')
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
      if (isRunning) {
        totalSimulationTime.current += 1
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isRunning])

  // Collect data every second
  useEffect(() => {
    if (!isRunning) {
      if (dataIntervalRef.current) clearInterval(dataIntervalRef.current)
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current)
      return
    }

    // Add initial data point when starting
    if (dataPoints.length === 0 || dataPoints[dataPoints.length - 1].time !== currentTime) {
      const velocity = direction === 'forward' ? speed : direction === 'backward' ? -speed : 0
      setDataPoints(prev => [...prev, {
        time: currentTime,
        position: position,
        velocity: velocity
      }])
    }

    // Data collection every 1 second
    dataIntervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1
        return newTime
      })
    }, 1000)

    // Smooth animation updates (60 fps)
    animationIntervalRef.current = setInterval(() => {
      setPosition(prev => {
        const velocity = direction === 'forward' ? speed : direction === 'backward' ? -speed : 0
        return prev + velocity * (1/60) // 60 fps
      })
    }, 1000/60)

    return () => {
      if (dataIntervalRef.current) clearInterval(dataIntervalRef.current)
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current)
    }
  }, [isRunning, direction, speed])

  // Log data point every second
  useEffect(() => {
    if (isRunning && currentTime > 0) {
      const velocity = direction === 'forward' ? speed : direction === 'backward' ? -speed : 0
      setDataPoints(prev => [...prev, {
        time: currentTime,
        position: position,
        velocity: velocity
      }])
    }
  }, [currentTime])

  const handleStart = () => {
    setIsRunning(true)
    onInteraction('start', { speed, direction, position })
  }

  const handlePause = () => {
    setIsRunning(false)
    onInteraction('pause', { currentTime, position, dataPoints: dataPoints.length })
    
    // Mark as complete if they collected 10+ data points
    if (dataPoints.length >= 10) {
      setSimulationCompleted(true)
      onComplete({
        totalTime: currentTime,
        totalDataPoints: dataPoints.length,
        finalPosition: position,
        averageSpeed: speed
      }, 100)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setDirection('stopped')
    setPosition(0)
    setCurrentTime(0)
    setDataPoints([])
    onInteraction('reset', {})
  }

  const handleDirection = (dir: Direction) => {
    setDirection(dir)
    onInteraction('change-direction', { direction: dir, speed })
  }

  const handleExportData = () => {
    const csv = [
      'Time (s),Position (m),Velocity (m/s)',
      ...dataPoints.map(d => 
        `${d.time.toFixed(1)},${d.position.toFixed(2)},${d.velocity.toFixed(2)}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `constant-velocity-data-${Date.now()}.csv`
    a.click()
  }

  // Calculate walker position on screen (centered at origin)
  const walkerScreenX = 50 + (position / 10) * 50 // Scale: 10m = 50% of screen

  // Find min and max positions for graph scaling
  const positions = dataPoints.map(d => d.position)
  const minPos = Math.min(...positions, -5, position)
  const maxPos = Math.max(...positions, 5, position)
  const posRange = maxPos - minPos || 10

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/simulations')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Simulations
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Constant Velocity Motion Lab</h1>
            <p className="text-muted-foreground">
              Control a walker&apos;s motion and collect position data. Observe constant velocity in 1D motion.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">Beginner</Badge>
            {isAdmin && (
              <div className="flex gap-2">
                {assignments.length > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <FileText className="h-3 w-3 mr-1" />
                    {assignments.length} Assignment{assignments.length > 1 ? 's' : ''}
                  </Badge>
                )}
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
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overhead View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overhead View</CardTitle>
              <CardDescription>Watch the walker move along a straight line</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden p-8">
                {/* Scale markers */}
                <div className="absolute top-4 left-0 right-0 flex justify-between px-8 text-xs text-muted-foreground">
                  <span>-10m</span>
                  <span>-5m</span>
                  <span className="font-bold text-primary">0m (origin)</span>
                  <span>+5m</span>
                  <span>+10m</span>
                </div>

                {/* Walking path with grid */}
                <div className="relative h-48 mt-8">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex justify-around items-center">
                    {[-10, -5, 0, 5, 10].map((pos) => (
                      <div 
                        key={pos}
                        className={`h-full border-l ${pos === 0 ? 'border-primary border-2' : 'border-muted'}`}
                      />
                    ))}
                  </div>

                  {/* Center line (walking path) */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 via-primary to-blue-300 transform -translate-y-1/2" />

                  {/* Origin marker */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 bg-primary rounded-full shadow-lg" />
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-primary whitespace-nowrap">
                      Origin
                    </div>
                  </div>

                  {/* Walker (person icon) */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-100"
                    style={{
                      left: `${Math.max(5, Math.min(95, walkerScreenX))}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {/* Person icon - flip by default since emoji faces left, only normal when going backward */}
                    <div className={`text-7xl transition-transform ${direction === 'backward' ? '' : 'scale-x-[-1]'}`}>
                      🚶
                    </div>
                    {/* Direction indicator */}
                    {direction !== 'stopped' && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                        {direction === 'forward' ? (
                          <ChevronRight className="h-8 w-8 text-green-500 animate-pulse" />
                        ) : (
                          <ChevronLeft className="h-8 w-8 text-blue-500 animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Position readout */}
                <div className="mt-8 grid grid-cols-3 gap-4 p-4 bg-card/80 backdrop-blur rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground">Time</div>
                    <div className="text-2xl font-bold">{currentTime.toFixed(0)}s</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Position</div>
                    <div className="text-2xl font-bold">{position.toFixed(2)}m</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Velocity</div>
                    <div className={`text-2xl font-bold ${
                      direction === 'forward' ? 'text-green-600' : 
                      direction === 'backward' ? 'text-blue-600' : 
                      'text-gray-600'
                    }`}>
                      {direction === 'forward' ? `+${speed.toFixed(1)}` : 
                       direction === 'backward' ? `-${speed.toFixed(1)}` : 
                       '0.0'}m/s
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Tabs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="graph" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="graph">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Graph
                  </TabsTrigger>
                  <TabsTrigger value="table">
                    <TableIcon className="h-4 w-4 mr-2" />
                    Data Table
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="graph" className="space-y-4">
                  <div className="h-80 flex items-center justify-center bg-muted rounded-lg p-4">
                    {dataPoints.length === 0 ? (
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start simulation to generate graph</p>
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        {/* Y-axis label */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-muted-foreground">
                          Position (m)
                        </div>
                        {/* X-axis label */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground">
                          Time (s)
                        </div>
                        
                        {/* Graph area */}
                        <svg className="w-full h-full pl-8 pb-6">
                          {/* Grid lines */}
                          <g className="stroke-muted-foreground/20">
                            {[0, 25, 50, 75, 100].map(y => (
                              <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} strokeWidth="1" />
                            ))}
                            {[0, 25, 50, 75, 100].map(x => (
                              <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" strokeWidth="1" />
                            ))}
                          </g>

                          {/* Zero line */}
                          <line 
                            x1="0" 
                            y1={`${50}%`}
                            x2="100%" 
                            y2={`${50}%`}
                            stroke="hsl(var(--primary))" 
                            strokeWidth="1" 
                            strokeDasharray="4 2"
                            opacity="0.5"
                          />

                          {/* Data line */}
                          <polyline
                            points={dataPoints.map((d) => {
                              const x = (d.time / Math.max(...dataPoints.map(p => p.time), 1)) * 100
                              const y = 50 - ((d.position - minPos) / posRange - 0.5) * 90
                              return `${x},${y}`
                            }).join(' ')}
                            stroke="hsl(var(--primary))"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Data points */}
                          {dataPoints.map((d, i) => {
                            const x = (d.time / Math.max(...dataPoints.map(p => p.time), 1)) * 100
                            const y = 50 - ((d.position - minPos) / posRange - 0.5) * 90
                            return (
                              <circle
                                key={i}
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r="4"
                                fill="hsl(var(--primary))"
                              />
                            )
                          })}
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Position vs Time Graph
                  </div>
                </TabsContent>

                <TabsContent value="table" className="space-y-4">
                  <div className="max-h-80 overflow-y-auto border rounded-lg">
                    {dataPoints.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <TableIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start simulation to collect data</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-3 text-left">Time (s)</th>
                            <th className="p-3 text-left">Position (m)</th>
                            <th className="p-3 text-left">Velocity (m/s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataPoints.map((d, i) => (
                            <tr key={i} className="border-t hover:bg-muted/50">
                              <td className="p-3">{d.time.toFixed(1)}</td>
                              <td className="p-3 font-mono">{d.position.toFixed(2)}</td>
                              <td className="p-3 font-mono">
                                <span className={
                                  d.velocity > 0 ? 'text-green-600' : 
                                  d.velocity < 0 ? 'text-blue-600' : 
                                  'text-gray-600'
                                }>
                                  {d.velocity > 0 ? '+' : ''}{d.velocity.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {dataPoints.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {dataPoints.length} data points collected (every 1 second)
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Motion Controls</CardTitle>
              <CardDescription>Control the walker&apos;s movement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Speed Control */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Walking Speed</label>
                  <span className="text-sm text-muted-foreground">{speed.toFixed(1)} m/s</span>
                </div>
                <Slider
                  value={[speed]}
                  onValueChange={([value]) => {
                    setSpeed(value)
                    onInteraction('change-speed', { speed: value })
                  }}
                  min={0.5}
                  max={3}
                  step={0.1}
                  disabled={isRunning}
                />
              </div>

              {/* Direction Controls */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Direction</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={direction === 'backward' ? 'default' : 'outline'}
                    onClick={() => handleDirection('backward')}
                    disabled={!isRunning}
                    className="flex flex-col h-auto py-3"
                  >
                    <ChevronLeft className="h-6 w-6 mb-1" />
                    <span className="text-xs">Backward</span>
                  </Button>
                  <Button
                    variant={direction === 'stopped' ? 'default' : 'outline'}
                    onClick={() => handleDirection('stopped')}
                    disabled={!isRunning}
                    className="flex flex-col h-auto py-3"
                  >
                    <Square className="h-6 w-6 mb-1" />
                    <span className="text-xs">Stop</span>
                  </Button>
                  <Button
                    variant={direction === 'forward' ? 'default' : 'outline'}
                    onClick={() => handleDirection('forward')}
                    disabled={!isRunning}
                    className="flex flex-col h-auto py-3"
                  >
                    <ChevronRight className="h-6 w-6 mb-1" />
                    <span className="text-xs">Forward</span>
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <Button 
                  onClick={isRunning ? handlePause : handleStart}
                  className="w-full"
                  variant={isRunning ? "secondary" : "default"}
                >
                  {isRunning ? (
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
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full"
                  disabled={dataPoints.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                About This Lab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Learning Objectives:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Understand constant velocity motion</li>
                  <li>Collect position data over time</li>
                  <li>Analyze position-time graphs</li>
                  <li>Identify the slope as velocity</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Key Concepts:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Constant velocity = straight line on position-time graph</li>
                  <li>Positive slope = forward motion</li>
                  <li>Negative slope = backward motion</li>
                  <li>Horizontal line = stopped (zero velocity)</li>
                  <li>Slope = velocity (rise over run)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Try This:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Walk forward for 5 seconds, then stop</li>
                  <li>Change direction and compare slopes</li>
                  <li>Calculate velocity from graph data</li>
                  <li>Export data to analyze in spreadsheet</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="constant-velocity"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={simulationCompleted}
          simulationData={{
            dataPoints: dataPoints,
            finalPosition: position,
            totalTime: currentTime,
            averageSpeed: speed
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
          simulationSlug="constant-velocity"
          assignment={editingAssignment}
          onSave={(assignment) => {
            loadAssignments()
            setShowAssignmentEditor(false)
            setEditingAssignment(null)
          }}
        />
      )}
    </div>
  )
}

// Wrapped export with tracking
export default function ConstantVelocityLab() {
  return (
    <SimulationWrapper
      simulationSlug="constant-velocity"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <ConstantVelocityLabContent {...props} />}
    </SimulationWrapper>
  )
}
