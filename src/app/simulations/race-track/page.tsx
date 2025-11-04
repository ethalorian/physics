"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
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
import { useSimulationCompletion } from '@/hooks/useSimulationCompletion'
import SimulationProgress from '@/components/simulations/SimulationProgress'
import { getSimulationCriteria, getActionLabels } from '@/config/simulationCompletionCriteria'
import { 
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  BarChart3,
  Table as TableIcon,
  Info,
  Plus,
  Settings,
  FileText,
  ArrowRight,
  Route,
  Navigation
} from 'lucide-react'

interface DataPoint {
  time: number
  distance: number // Total path traveled (scalar)
  displacement: number // Straight-line distance from start (scalar magnitude)
  displacementX: number // X component of displacement
  displacementY: number // Y component of displacement
  speed: number // Rate of distance change (scalar)
  velocity: number // Rate of displacement change (scalar magnitude)
  laps: number // Number of complete laps
}

interface CarPosition {
  x: number // meters
  y: number // meters
  angle: number // radians
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

class RaceTrackEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number | null = null
  private lastTime: number = 0
  private trackRadius: number = 100 // meters (radius of circular track)
  private trackWidth: number = 10 // meters
  private pixelsPerMeter: number = 3 // scale for rendering
  
  // Car state
  private angularPosition: number = 0 // radians from start
  private speed: number = 0 // m/s
  private distance: number = 0 // total distance traveled
  private time: number = 0
  private isRunning: boolean = false
  
  // Start position (12 o'clock position)
  private startAngle: number = -Math.PI / 2
  
  private onUpdate: (data: {
    position: CarPosition
    distance: number
    displacement: number
    displacementX: number
    displacementY: number
    speed: number
    laps: number
    time: number
  }) => void

  constructor(
    canvas: HTMLCanvasElement,
    onUpdate: (data: any) => void
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.onUpdate = onUpdate
    this.resizeCanvas()
    this.render()
    
    window.addEventListener('resize', () => this.resizeCanvas())
  }

  private resizeCanvas() {
    const container = this.canvas.parentElement
    if (container) {
      this.canvas.width = container.clientWidth
      this.canvas.height = Math.min(container.clientWidth, 500)
      this.pixelsPerMeter = (Math.min(this.canvas.width, this.canvas.height) * 0.35) / this.trackRadius
    }
  }

  public setSpeed(speed: number) {
    this.speed = speed
  }

  public start() {
    if (!this.isRunning) {
      this.isRunning = true
      this.lastTime = performance.now()
      this.animate()
    }
  }

  public pause() {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  public reset() {
    this.pause()
    this.angularPosition = 0
    this.distance = 0
    this.time = 0
    this.render()
    this.sendUpdate()
  }

  public destroy() {
    this.pause()
    window.removeEventListener('resize', () => this.resizeCanvas())
  }

  private animate() {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1) // Cap at 0.1s
    this.lastTime = currentTime

    // Update physics
    const angularSpeed = this.speed / this.trackRadius // radians per second
    this.angularPosition += angularSpeed * dt
    this.distance += this.speed * dt
    this.time += dt

    this.render()
    this.sendUpdate()

    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.animate())
    }
  }

  private sendUpdate() {
    const position = this.getCarPosition()
    const displacement = this.getDisplacement()
    
    this.onUpdate({
      position,
      distance: this.distance,
      displacement: displacement.magnitude,
      displacementX: displacement.x,
      displacementY: displacement.y,
      speed: this.speed,
      laps: Math.floor(this.angularPosition / (2 * Math.PI)),
      time: this.time
    })
  }

  private getCarPosition(): CarPosition {
    const actualAngle = this.startAngle + this.angularPosition
    return {
      x: this.trackRadius * Math.cos(actualAngle),
      y: this.trackRadius * Math.sin(actualAngle),
      angle: actualAngle
    }
  }

  private getDisplacement(): { x: number; y: number; magnitude: number } {
    const position = this.getCarPosition()
    const x = position.x - 0 // Start is at (0, -trackRadius) but we measure from origin
    const y = position.y - (-this.trackRadius)
    const magnitude = Math.sqrt(x * x + y * y)
    return { x, y, magnitude }
  }

  private render() {
    const ctx = this.ctx
    const width = this.canvas.width
    const height = this.canvas.height
    const centerX = width / 2
    const centerY = height / 2

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, width, height)

    // Draw grass around track
    const outerRadius = (this.trackRadius + this.trackWidth) * this.pixelsPerMeter
    ctx.fillStyle = '#4ade80'
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius + 50, 0, 2 * Math.PI)
    ctx.fill()

    // Draw track (outer edge)
    ctx.fillStyle = '#374151'
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
    ctx.fill()

    // Draw track (inner grass)
    const innerRadius = (this.trackRadius - this.trackWidth) * this.pixelsPerMeter
    ctx.fillStyle = '#4ade80'
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.fill()

    // Draw track centerline
    const centerRadius = this.trackRadius * this.pixelsPerMeter
    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw start/finish line (at 12 o'clock)
    const startX = centerX
    const startY = centerY - centerRadius
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(startX - 15, startY)
    ctx.lineTo(startX + 15, startY)
    ctx.stroke()

    // Draw "START/FINISH" text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('START', startX, startY - 20)
    ctx.fillText('FINISH', startX, startY - 6)

    // Draw origin marker (center of track)
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('Origin', centerX, centerY + 25)

    // Draw displacement vector (from origin to car)
    const carPos = this.getCarPosition()
    const carScreenX = centerX + carPos.x * this.pixelsPerMeter
    const carScreenY = centerY + carPos.y * this.pixelsPerMeter

    if (this.distance > 0) {
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(carScreenX, carScreenY)
      ctx.stroke()

      // Arrow head for displacement
      const arrowSize = 10
      const angle = Math.atan2(carScreenY - centerY, carScreenX - centerX)
      ctx.fillStyle = '#8b5cf6'
      ctx.beginPath()
      ctx.moveTo(carScreenX, carScreenY)
      ctx.lineTo(
        carScreenX - arrowSize * Math.cos(angle - Math.PI / 6),
        carScreenY - arrowSize * Math.sin(angle - Math.PI / 6)
      )
      ctx.lineTo(
        carScreenX - arrowSize * Math.cos(angle + Math.PI / 6),
        carScreenY - arrowSize * Math.sin(angle + Math.PI / 6)
      )
      ctx.closePath()
      ctx.fill()

      // Displacement label
      ctx.fillStyle = '#8b5cf6'
      ctx.font = 'bold 11px sans-serif'
      const displacement = this.getDisplacement()
      const labelX = centerX + (carPos.x * this.pixelsPerMeter) / 2
      const labelY = centerY + (carPos.y * this.pixelsPerMeter) / 2
      ctx.fillText(
        `Displacement: ${displacement.magnitude.toFixed(1)}m`,
        labelX,
        labelY - 5
      )
    }

    // Draw race car
    ctx.save()
    ctx.translate(carScreenX, carScreenY)
    // Car should face along the track (tangent to circle), not toward center
    // The angle is the position on the circle, so we rotate 90° more to face forward
    ctx.rotate(carPos.angle + Math.PI)
    
    // Car body (main rectangle)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(-8, -12, 16, 24)
    
    // Windshield (front of car)
    ctx.fillStyle = '#93c5fd'
    ctx.fillRect(-6, -8, 12, 8)
    
    // Wheels (on sides)
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(-10, -8, 3, 6)
    ctx.fillRect(7, -8, 3, 6)
    ctx.fillRect(-10, 2, 3, 6)
    ctx.fillRect(7, 2, 3, 6)
    
    ctx.restore()
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function RaceTrackSimulationContent({
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
  const [speed, setSpeed] = useState(20) // m/s (starting speed)
  const [distance, setDistance] = useState(0)
  const [displacement, setDisplacement] = useState(0)
  const [displacementX, setDisplacementX] = useState(0)
  const [displacementY, setDisplacementY] = useState(0)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [currentVelocity, setCurrentVelocity] = useState(0) // Rate of displacement change
  const [laps, setLaps] = useState(0)
  const [time, setTime] = useState(0)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  // Use standardized completion tracking
  const completionConfig = getSimulationCriteria('race-track')
  const actionLabelsMap = getActionLabels('race-track')
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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<RaceTrackEngine | null>(null)
  const dataCollectionInterval = useRef<NodeJS.Timeout | null>(null)
  const totalSimulationTime = useRef(0)
  const previousDisplacement = useRef(0)
  const previousTime = useRef(0)
  const currentValuesRef = useRef({
    time: 0,
    distance: 0,
    displacement: 0,
    displacementX: 0,
    displacementY: 0,
    speed: 0,
    laps: 0
  })

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      let lastDisplacement = 0
      let lastTime = 0
      
      engineRef.current = new RaceTrackEngine(
        canvasRef.current,
        (data) => {
          setDistance(data.distance)
          setDisplacement(data.displacement)
          setDisplacementX(data.displacementX)
          setDisplacementY(data.displacementY)
          setCurrentSpeed(data.speed)
          setLaps(data.laps)
          setTime(data.time)
          
          // Calculate instantaneous velocity (rate of displacement change)
          if (lastTime > 0) {
            const deltaDisplacement = data.displacement - lastDisplacement
            const deltaTime = data.time - lastTime
            const velocity = deltaTime > 0 ? Math.abs(deltaDisplacement / deltaTime) : 0
            setCurrentVelocity(velocity)
          }
          
          lastDisplacement = data.displacement
          lastTime = data.time
        }
      )
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [])

  // Load assignments
  useEffect(() => {
    if (isAdmin) {
      loadAssignments()
    }
  }, [isAdmin])

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/simulations/assignments?simulation_slug=race-track')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  // Update ref whenever values change (so interval can access fresh values)
  useEffect(() => {
    currentValuesRef.current = {
      time,
      distance,
      displacement,
      displacementX,
      displacementY,
      speed: currentSpeed,
      laps
    }
  }, [time, distance, displacement, displacementX, displacementY, currentSpeed, laps])

  // Data collection every second
  useEffect(() => {
    if (isRunning) {
      // Initialize tracking on start
      if (previousTime.current === 0) {
        previousDisplacement.current = displacement
        previousTime.current = time
      }
      
      dataCollectionInterval.current = setInterval(() => {
        // Get current values from ref (not closure)
        const current = currentValuesRef.current
        
        // Velocity is rate of displacement change over time
        const deltaDisplacement = current.displacement - previousDisplacement.current
        const deltaTime = current.time - previousTime.current
        const velocityMagnitude = deltaTime > 0 ? Math.abs(deltaDisplacement / deltaTime) : 0
        
        // Update refs for next calculation
        previousDisplacement.current = current.displacement
        previousTime.current = current.time

        const newDataPoint: DataPoint = {
          time: parseFloat(current.time.toFixed(2)),
          distance: parseFloat(current.distance.toFixed(2)),
          displacement: parseFloat(current.displacement.toFixed(2)),
          displacementX: parseFloat(current.displacementX.toFixed(2)),
          displacementY: parseFloat(current.displacementY.toFixed(2)),
          speed: parseFloat(current.speed.toFixed(2)),
          velocity: parseFloat(velocityMagnitude.toFixed(2)),
          laps: current.laps
        }

        setDataPoints(prev => {
          const updated = [...prev, newDataPoint]
          console.log('Data point added:', newDataPoint, 'Total points:', updated.length)
          return updated
        })
      }, 1000)
    } else {
      if (dataCollectionInterval.current) {
        clearInterval(dataCollectionInterval.current)
        dataCollectionInterval.current = null
      }
    }

    return () => {
      if (dataCollectionInterval.current) {
        clearInterval(dataCollectionInterval.current)
      }
    }
  }, [isRunning])

  // Track total simulation time
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        totalSimulationTime.current += 1
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isRunning])

  // Enhanced interaction tracking wrapper
  const handleInteraction = useCallback((action: string, data: Record<string, any>) => {
    // Call the original onInteraction from SimulationWrapper
    onInteraction(action, data)
    
    // Track with standardized system
    trackInteraction(action, data)
  }, [onInteraction, trackInteraction])
  
  const handleStart = () => {
    if (engineRef.current) {
      engineRef.current.setSpeed(speed)
      engineRef.current.start()
      setIsRunning(true)
      handleInteraction('start', { speed })
    }
  }

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause()
      setIsRunning(false)
      handleInteraction('pause', { time, distance, displacement, laps, dataPoints: dataPoints.length })
      
      // Mark as complete if they collected 10+ data points
      if (dataPoints.length >= 10 && !completionState.isCompleted) {
        markComplete({
          totalTime: time,
          totalDistance: distance,
          finalDisplacement: displacement,
          totalLaps: laps,
          dataPoints: dataPoints.length,
          averageSpeed: speed
        }, 100)
      }
    }
  }

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      setIsRunning(false)
      setDataPoints([])
      setDistance(0)
      setDisplacement(0)
      setDisplacementX(0)
      setDisplacementY(0)
      setCurrentVelocity(0)
      setLaps(0)
      setTime(0)
      previousDisplacement.current = 0
      previousTime.current = 0
      handleInteraction('reset', {})
      resetCompletion() // Reset completion tracking
    }
  }

  const handleSpeedChange = (value: number) => {
    setSpeed(value)
    if (engineRef.current) {
      engineRef.current.setSpeed(value)
    }
    handleInteraction('speed_changed', { speed: value })
  }

  const handleExportData = () => {
    // Format for Desmos and spreadsheet compatibility
    // Round to 2 decimal places for cleaner data
    const csv = [
      'Time (s),Distance (m),Displacement (m),Displacement X (m),Displacement Y (m),Speed (m/s),Velocity (m/s),Laps',
      ...dataPoints.map(d => 
        `${d.time.toFixed(2)},${d.distance.toFixed(2)},${d.displacement.toFixed(2)},${d.displacementX.toFixed(2)},${d.displacementY.toFixed(2)},${d.speed.toFixed(2)},${d.velocity.toFixed(2)},${d.laps}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `race-track-data-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyForDesmos = () => {
    // Create Desmos-friendly format: list of (x,y) points
    const desmosDistanceData = dataPoints.map(d => `(${d.time.toFixed(2)},${d.distance.toFixed(2)})`).join(',')
    const desmosDisplacementData = dataPoints.map(d => `(${d.time.toFixed(2)},${d.displacement.toFixed(2)})`).join(',')
    
    const desmosText = `Distance vs Time:\n${desmosDistanceData}\n\nDisplacement vs Time:\n${desmosDisplacementData}`
    
    navigator.clipboard.writeText(desmosText).then(() => {
      // Could add a toast notification here
      alert('Data copied to clipboard! Paste into Desmos as:\n\n1. Type "table" in Desmos\n2. Paste the first line for Distance\n3. Create another table and paste second line for Displacement')
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

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
            <h1 className="text-3xl font-bold mb-2">Race Track: Distance vs. Displacement</h1>
            <p className="text-muted-foreground">
              Watch a race car go around a track and explore the difference between distance (scalar) and displacement (vector)
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

      {/* Progress Indicator (for students) */}
      {!isAdmin && (
        <SimulationProgress 
          state={completionState}
          actionLabels={actionLabelsMap}
          hideWhenComplete={false}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Track Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Race Track View</CardTitle>
              <CardDescription>Watch the car race around the circular track</CardDescription>
            </CardHeader>
            <CardContent>
              <canvas 
                ref={canvasRef}
                className="w-full border rounded-lg bg-white"
              />

              {/* Real-time Readouts */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700 font-medium mb-1">HOW LONG</div>
                  <div className="text-2xl font-bold text-blue-900">{time.toFixed(1)}s</div>
                  <div className="text-xs text-blue-600 mt-1">Time</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-700 font-medium mb-1">HOW FAR (Scalar)</div>
                  <div className="text-2xl font-bold text-green-900">{distance.toFixed(1)}m</div>
                  <div className="text-xs text-green-600 mt-1">Distance Traveled</div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-700 font-medium mb-1 flex items-center gap-1">
                    HOW FAR (Vector) <Navigation className="h-3 w-3" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{displacement.toFixed(1)}m</div>
                  <div className="text-xs text-purple-600 mt-1">Displacement</div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-700 font-medium mb-1">Laps Completed</div>
                  <div className="text-2xl font-bold text-orange-900">{laps}</div>
                  <div className="text-xs text-orange-600 mt-1">Full Circles</div>
                </div>
              </div>

              {/* Speed indicators */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">HOW FAST (Scalar)</div>
                  <div className="text-xl font-bold">{currentSpeed.toFixed(1)} m/s</div>
                  <div className="text-xs text-gray-500">Speed (NO direction)</div>
                </div>
                
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="text-xs text-indigo-700 mb-1 flex items-center gap-1">
                    HOW FAST (Vector) <ArrowRight className="h-3 w-3" />
                  </div>
                  <div className="text-xl font-bold text-indigo-900">
                    {currentVelocity.toFixed(1)} m/s
                  </div>
                  <div className="text-xs text-indigo-600">Velocity (HAS direction)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Visualization */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="graph" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="graph">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Graphs
                  </TabsTrigger>
                  <TabsTrigger value="table">
                    <TableIcon className="h-4 w-4 mr-2" />
                    Data Table
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="graph" className="space-y-4">
                  {dataPoints.length === 0 ? (
                    <div className="h-80 flex items-center justify-center bg-muted rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start simulation to generate graphs</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Distance vs Time */}
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Distance vs. Time (Scalar - Always Increasing)</h4>
                        <div className="h-60 bg-white border rounded-lg p-4 relative">
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Grid lines */}
                            <g stroke="#e5e7eb" strokeWidth="0.2">
                              {[0, 25, 50, 75, 100].map(y => (
                                <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} />
                              ))}
                              {[0, 25, 50, 75, 100].map(x => (
                                <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" />
                              ))}
                            </g>
                            
                            {/* Data line */}
                            <polyline
                              points={dataPoints.map((d, i) => {
                                const x = (i / Math.max(dataPoints.length - 1, 1)) * 100
                                const maxDist = Math.max(...dataPoints.map(p => p.distance), 1)
                                const y = 100 - (d.distance / maxDist) * 90
                                return `${x},${y}`
                              }).join(' ')}
                              stroke="#10b981"
                              strokeWidth="1"
                              fill="none"
                              vectorEffect="non-scaling-stroke"
                            />
                            
                            {/* Data points */}
                            {dataPoints.map((d, i) => {
                              const x = (i / Math.max(dataPoints.length - 1, 1)) * 100
                              const maxDist = Math.max(...dataPoints.map(p => p.distance), 1)
                              const y = 100 - (d.distance / maxDist) * 90
                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={y}
                                  r="0.8"
                                  fill="#10b981"
                                  vectorEffect="non-scaling-stroke"
                                />
                              )
                            })}
                          </svg>
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
                            Time (s)
                          </div>
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium">
                            Distance (m)
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Max: {Math.max(...dataPoints.map(p => p.distance)).toFixed(1)}m at {Math.max(...dataPoints.map(p => p.time)).toFixed(1)}s
                        </p>
                      </div>

                      {/* Displacement vs Time */}
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Displacement vs. Time (Vector - Can Increase/Decrease)</h4>
                        <div className="h-60 bg-white border rounded-lg p-4 relative">
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Grid lines */}
                            <g stroke="#e5e7eb" strokeWidth="0.2">
                              {[0, 25, 50, 75, 100].map(y => (
                                <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} />
                              ))}
                              {[0, 25, 50, 75, 100].map(x => (
                                <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" />
                              ))}
                            </g>
                            
                            {/* Data line */}
                            <polyline
                              points={dataPoints.map((d, i) => {
                                const x = (i / Math.max(dataPoints.length - 1, 1)) * 100
                                const maxDisp = Math.max(...dataPoints.map(p => p.displacement), 1)
                                const y = 100 - (d.displacement / maxDisp) * 90
                                return `${x},${y}`
                              }).join(' ')}
                              stroke="#8b5cf6"
                              strokeWidth="1"
                              fill="none"
                              vectorEffect="non-scaling-stroke"
                            />
                            
                            {/* Data points */}
                            {dataPoints.map((d, i) => {
                              const x = (i / Math.max(dataPoints.length - 1, 1)) * 100
                              const maxDisp = Math.max(...dataPoints.map(p => p.displacement), 1)
                              const y = 100 - (d.displacement / maxDisp) * 90
                              return (
                                <circle
                                  key={i}
                                  cx={x}
                                  cy={y}
                                  r="0.8"
                                  fill="#8b5cf6"
                                  vectorEffect="non-scaling-stroke"
                                />
                              )
                            })}
                          </svg>
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
                            Time (s)
                          </div>
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium">
                            Displacement (m)
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Max: {Math.max(...dataPoints.map(p => p.displacement)).toFixed(1)}m | Current: {dataPoints[dataPoints.length - 1].displacement.toFixed(1)}m
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="table" className="space-y-4">
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
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
                            <th className="p-3 text-left">Distance (m)</th>
                            <th className="p-3 text-left">Displacement (m)</th>
                            <th className="p-3 text-left">Speed (m/s)</th>
                            <th className="p-3 text-left">Velocity (m/s)</th>
                            <th className="p-3 text-left">Laps</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataPoints.map((d, i) => (
                            <tr key={i} className="border-t hover:bg-muted/50">
                              <td className="p-3">{d.time}</td>
                              <td className="p-3 font-mono text-green-600">{d.distance.toFixed(1)}</td>
                              <td className="p-3 font-mono text-purple-600">{d.displacement.toFixed(1)}</td>
                              <td className="p-3 font-mono">{d.speed.toFixed(1)}</td>
                              <td className="p-3 font-mono text-indigo-600">{d.velocity.toFixed(1)}</td>
                              <td className="p-3">{d.laps}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {dataPoints.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {dataPoints.length} data points collected (every 1 second)
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={handleExportData}
                          className="flex-1"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          CSV
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={handleCopyForDesmos}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Desmos
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls and Learning */}
        <div className="space-y-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Race Car Controls</CardTitle>
              <CardDescription>Control the race car speed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Speed Control */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Car Speed</label>
                  <span className="text-sm text-muted-foreground">{speed.toFixed(0)} m/s</span>
                </div>
                <Slider
                  value={[speed]}
                  onValueChange={([value]) => handleSpeedChange(value)}
                  min={5}
                  max={40}
                  step={5}
                  disabled={isRunning}
                />
                <div className="text-xs text-muted-foreground">
                  Adjust before starting
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
                      Start Race
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
                  Download CSV
                </Button>
                <Button 
                  onClick={handleCopyForDesmos}
                  variant="outline"
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  disabled={dataPoints.length === 0}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Copy for Desmos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Formulas Card */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                📐 The Math
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-white rounded-lg border-2 border-green-200">
                <div className="font-semibold text-green-900 mb-2">Average Speed (Scalar)</div>
                <div className="text-lg font-mono bg-green-50 p-2 rounded text-center">
                  Speed = Distance ÷ Time
                </div>
                {time > 0 && (
                  <div className="mt-2 text-center text-sm text-green-700">
                    = {distance.toFixed(1)}m ÷ {time.toFixed(1)}s = <span className="font-bold">{(distance / time).toFixed(2)} m/s</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
                <div className="font-semibold text-purple-900 mb-2">Average Velocity (Vector)</div>
                <div className="text-lg font-mono bg-purple-50 p-2 rounded text-center">
                  Velocity = Displacement ÷ Time
                </div>
                {time > 0 && (
                  <div className="mt-2 text-center text-sm text-purple-700">
                    = {displacement.toFixed(1)}m ÷ {time.toFixed(1)}s = <span className="font-bold">{(displacement / time).toFixed(2)} m/s</span>
                  </div>
                )}
              </div>

              <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900">
                <strong>💡 Key Insight:</strong> After one complete lap, average velocity = 0 m/s (displacement = 0), but average speed ≠ 0!
              </div>
            </CardContent>
          </Card>

          {/* Learning Concepts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Key Concepts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-green-900">📏 Distance (Scalar)</h4>
                <ul className="text-green-800 space-y-1 list-disc list-inside">
                  <li><strong>HOW FAR:</strong> Total path length</li>
                  <li>Always increases (can't go backwards)</li>
                  <li>No direction - just a number</li>
                  <li>Example: "The car traveled 500m"</li>
                </ul>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-purple-900 flex items-center gap-1">
                  📐 Displacement (Vector) <Navigation className="h-4 w-4" />
                </h4>
                <ul className="text-purple-800 space-y-1 list-disc list-inside">
                  <li><strong>HOW FAR + WHICH WAY:</strong> Straight line from start</li>
                  <li>Can increase or decrease</li>
                  <li>Has direction (from origin to car)</li>
                  <li>Example: "100m at 45° from start"</li>
                </ul>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-900">⚡ Speed (Scalar)</h4>
                <ul className="text-gray-800 space-y-1 list-disc list-inside">
                  <li><strong>HOW FAST:</strong> Rate of distance change</li>
                  <li>Formula: <span className="font-mono bg-white px-1">Speed = Distance ÷ Time</span></li>
                  <li>Always positive</li>
                  <li>No direction</li>
                  <li>Example: "20 m/s"</li>
                </ul>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-indigo-900 flex items-center gap-1">
                  🎯 Velocity (Vector) <ArrowRight className="h-4 w-4" />
                </h4>
                <ul className="text-indigo-800 space-y-1 list-disc list-inside">
                  <li><strong>HOW FAST + WHICH WAY:</strong> Rate of displacement change</li>
                  <li>Formula: <span className="font-mono bg-white px-1">Velocity = Displacement ÷ Time</span></li>
                  <li>Can be positive or negative</li>
                  <li>Has direction</li>
                  <li>Example: "20 m/s North"</li>
                </ul>
              </div>

              <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <h4 className="font-semibold mb-2 text-yellow-900">💡 Key Insight</h4>
                <p className="text-yellow-800 text-sm">
                  After one complete lap:
                  <br/>• Distance = circumference (≈628m)
                  <br/>• Displacement = 0m (back at start!)
                  <br/>• Speed = constant
                  <br/>• Velocity direction = always changing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Try This */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className="h-5 w-5" />
                Try This!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">1.</span>
                  <span>Run the car for exactly one lap - compare distance and displacement</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">2.</span>
                  <span>Watch how displacement changes throughout the lap (increases then decreases)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">3.</span>
                  <span>Calculate: If speed is constant, why does velocity change?</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">4.</span>
                  <span>Use the formulas to calculate: After one lap, what's the average speed vs. average velocity?</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">5.</span>
                  <span>Watch "The Math" card - see how the calculations change in real-time!</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="race-track"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={completionState.isCompleted}
          simulationData={{
            dataPoints: dataPoints,
            finalDistance: distance,
            finalDisplacement: displacement,
            totalTime: time,
            laps: laps,
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
          simulationSlug="race-track"
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
export default function RaceTrackSimulation() {
  return (
    <SimulationWrapper
      simulationSlug="race-track"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <RaceTrackSimulationContent {...props} />}
    </SimulationWrapper>
  )
}

