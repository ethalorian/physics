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
  Flag,
  Zap
} from 'lucide-react'

interface RaceData {
  time: number
  positionA: number
  positionB: number
  velocityA: number
  velocityB: number
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

class CarRaceEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  // Car A (usually slower, starts first)
  private positionA: number = 0 // meters
  private velocityA: number = 20 // m/s
  private startDelayA: number = 0 // seconds
  private colorA: string = '#3b82f6' // blue
  
  // Car B (usually faster, starts later)
  private positionB: number = 0 // meters
  private velocityB: number = 25 // m/s
  private startDelayB: number = 0 // seconds
  private colorB: string = '#ef4444' // red
  
  private raceDistance: number = 1000 // meters
  private animationId: number | null = null
  private lastTime: number = 0
  private isRunning: boolean = false
  private time: number = 0
  private pixelsPerMeter: number = 0.5
  private overtakeDetected: boolean = false
  private overtakeTime: number = 0
  private overtakePosition: number = 0
  
  private onUpdate: (data: {
    time: number
    positionA: number
    positionB: number
    velocityA: number
    velocityB: number
    overtaken: boolean
    overtakeTime: number
    overtakePosition: number
    finishedA: boolean
    finishedB: boolean
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
      this.canvas.width = Math.min(container.clientWidth, 900)
      this.canvas.height = 300
    }
  }

  public setCarA(velocity: number, startDelay: number) {
    this.velocityA = velocity
    this.startDelayA = startDelay
  }

  public setCarB(velocity: number, startDelay: number) {
    this.velocityB = velocity
    this.startDelayB = startDelay
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
    this.positionA = 0
    this.positionB = 0
    this.time = 0
    this.overtakeDetected = false
    this.overtakeTime = 0
    this.overtakePosition = 0
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
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1)
    this.lastTime = currentTime

    // Update positions based on start delays
    const effectiveTimeA = Math.max(0, this.time - this.startDelayA)
    const effectiveTimeB = Math.max(0, this.time - this.startDelayB)
    
    this.positionA = this.velocityA * effectiveTimeA
    this.positionB = this.velocityB * effectiveTimeB

    // Detect overtake (B passes A)
    if (!this.overtakeDetected && this.positionB > this.positionA && effectiveTimeB > 0 && effectiveTimeA > 0) {
      this.overtakeDetected = true
      this.overtakeTime = this.time
      this.overtakePosition = this.positionB
    }

    // Check if race is over
    const finishedA = this.positionA >= this.raceDistance
    const finishedB = this.positionB >= this.raceDistance
    
    if (finishedA && finishedB) {
      this.pause()
    }

    this.time += dt

    this.render()
    this.sendUpdate()

    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.animate())
    }
  }

  private sendUpdate() {
    this.onUpdate({
      time: this.time,
      positionA: this.positionA,
      positionB: this.positionB,
      velocityA: this.velocityA,
      velocityB: this.velocityB,
      overtaken: this.overtakeDetected,
      overtakeTime: this.overtakeTime,
      overtakePosition: this.overtakePosition,
      finishedA: this.positionA >= this.raceDistance,
      finishedB: this.positionB >= this.raceDistance
    })
  }

  private render() {
    const ctx = this.ctx

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw background
    ctx.fillStyle = '#86efac'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw road
    const roadY = 80
    const roadHeight = 140
    const laneHeight = roadHeight / 2

    // Road base
    ctx.fillStyle = '#374151'
    ctx.fillRect(0, roadY, this.canvas.width, roadHeight)

    // Lane divider
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 4
    ctx.setLineDash([20, 15])
    ctx.beginPath()
    ctx.moveTo(0, roadY + laneHeight)
    ctx.lineTo(this.canvas.width, roadY + laneHeight)
    ctx.stroke()
    ctx.setLineDash([])

    // Road edges
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(0, roadY)
    ctx.lineTo(this.canvas.width, roadY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, roadY + roadHeight)
    ctx.lineTo(this.canvas.width, roadY + roadHeight)
    ctx.stroke()

    // Draw distance markers
    ctx.fillStyle = '#fff'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    for (let d = 0; d <= this.raceDistance; d += 200) {
      const x = (d / this.raceDistance) * this.canvas.width
      ctx.fillText(`${d}m`, x, roadY - 5)
    }

    // Draw finish line
    const finishX = this.canvas.width - 30
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(finishX, roadY)
    ctx.lineTo(finishX, roadY + roadHeight)
    ctx.stroke()
    ctx.setLineDash([])
    
    ctx.fillStyle = '#000'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('FINISH', finishX, roadY - 15)

    // Calculate car screen positions
    const effectiveTimeA = Math.max(0, this.time - this.startDelayA)
    const effectiveTimeB = Math.max(0, this.time - this.startDelayB)
    
    const carAX = Math.min((this.positionA / this.raceDistance) * (this.canvas.width - 60), this.canvas.width - 60)
    const carAY = roadY + laneHeight / 2

    const carBX = Math.min((this.positionB / this.raceDistance) * (this.canvas.width - 60), this.canvas.width - 60)
    const carBY = roadY + laneHeight + laneHeight / 2

    // Draw Car A (blue) - only if started
    if (effectiveTimeA > 0) {
      // Car body
      ctx.fillStyle = this.colorA
      ctx.fillRect(carAX - 25, carAY - 12, 50, 24)
      
      // Windshield
      ctx.fillStyle = '#93c5fd'
      ctx.fillRect(carAX + 5, carAY - 10, 18, 20)
      
      // Wheels
      ctx.fillStyle = '#1f2937'
      ctx.beginPath()
      ctx.arc(carAX - 15, carAY + 12, 5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(carAX + 15, carAY + 12, 5, 0, 2 * Math.PI)
      ctx.fill()
      
      // Car label
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('A', carAX, carAY + 2)
    } else {
      // Waiting indicator
      ctx.fillStyle = this.colorA
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Car A starts in ${(this.startDelayA - this.time).toFixed(1)}s`, 100, carAY)
    }

    // Draw Car B (red) - only if started
    if (effectiveTimeB > 0) {
      // Car body
      ctx.fillStyle = this.colorB
      ctx.fillRect(carBX - 25, carBY - 12, 50, 24)
      
      // Windshield
      ctx.fillStyle = '#fca5a5'
      ctx.fillRect(carBX + 5, carBY - 10, 18, 20)
      
      // Wheels
      ctx.fillStyle = '#1f2937'
      ctx.beginPath()
      ctx.arc(carBX - 15, carBY + 12, 5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(carBX + 15, carBY + 12, 5, 0, 2 * Math.PI)
      ctx.fill()
      
      // Car label
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('B', carBX, carBY + 2)
    } else {
      // Waiting indicator
      ctx.fillStyle = this.colorB
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Car B starts in ${(this.startDelayB - this.time).toFixed(1)}s`, 100, carBY)
    }

    // Draw overtake indicator
    if (this.overtakeDetected) {
      const overtakeX = (this.overtakePosition / this.raceDistance) * (this.canvas.width - 60)
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(overtakeX, roadY)
      ctx.lineTo(overtakeX, roadY + roadHeight)
      ctx.stroke()
      ctx.setLineDash([])
      
      ctx.fillStyle = '#8b5cf6'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('OVERTAKE!', overtakeX, roadY + roadHeight + 20)
      ctx.font = '10px sans-serif'
      ctx.fillText(`${this.overtakePosition.toFixed(0)}m at ${this.overtakeTime.toFixed(1)}s`, overtakeX, roadY + roadHeight + 35)
    }

    // Draw current positions
    ctx.fillStyle = '#1e293b'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    if (effectiveTimeA > 0) {
      ctx.fillText(`${this.positionA.toFixed(0)}m`, carAX, carAY - 20)
    }
    if (effectiveTimeB > 0) {
      ctx.fillText(`${this.positionB.toFixed(0)}m`, carBX, carBY - 20)
    }
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function CarRaceContent({
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
  const [velocityA, setVelocityA] = useState(20) // m/s
  const [velocityB, setVelocityB] = useState(25) // m/s
  const [startDelayA, setStartDelayA] = useState(0) // seconds
  const [startDelayB, setStartDelayB] = useState(5) // seconds
  const [raceData, setRaceData] = useState<RaceData[]>([])
  const [currentData, setCurrentData] = useState({
    time: 0,
    positionA: 0,
    positionB: 0,
    velocityA: 20,
    velocityB: 25,
    overtaken: false,
    overtakeTime: 0,
    overtakePosition: 0,
    finishedA: false,
    finishedB: false
  })
  // Use standardized completion tracking
  const completionConfig = getSimulationCriteria('car-race')
  const actionLabelsMap = getActionLabels('car-race')
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
  const engineRef = useRef<CarRaceEngine | null>(null)
  const dataCollectionInterval = useRef<NodeJS.Timeout | null>(null)
  const totalSimulationTime = useRef(0)
  const currentValuesRef = useRef({
    time: 0,
    positionA: 0,
    positionB: 0,
    velocityA: 20,
    velocityB: 25
  })

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new CarRaceEngine(
        canvasRef.current,
        (data) => {
          setCurrentData(data)
          currentValuesRef.current = {
            time: data.time,
            positionA: data.positionA,
            positionB: data.positionB,
            velocityA: data.velocityA,
            velocityB: data.velocityB
          }

          if ((data.finishedA || data.finishedB) && !completionState.isCompleted) {
            markComplete({
              winner: data.finishedB && (!data.finishedA || data.positionB > data.positionA) ? 'B' : 'A',
              overtaken: data.overtaken,
              overtakeTime: data.overtakeTime,
              dataPoints: raceData.length
            }, 100)
          }
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=car-race')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  // Data collection every 0.2 seconds
  useEffect(() => {
    if (isRunning) {
      dataCollectionInterval.current = setInterval(() => {
        const current = currentValuesRef.current
        
        const newDataPoint: RaceData = {
          time: parseFloat(current.time.toFixed(2)),
          positionA: parseFloat(current.positionA.toFixed(2)),
          positionB: parseFloat(current.positionB.toFixed(2)),
          velocityA: parseFloat(current.velocityA.toFixed(2)),
          velocityB: parseFloat(current.velocityB.toFixed(2))
        }

        setRaceData(prev => [...prev, newDataPoint])
      }, 200)
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
      engineRef.current.setCarA(velocityA, startDelayA)
      engineRef.current.setCarB(velocityB, startDelayB)
      engineRef.current.start()
      setIsRunning(true)
      handleInteraction('start', { velocityA, velocityB, startDelayA, startDelayB })
    }
  }

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause()
      setIsRunning(false)
      handleInteraction('pause', { time: currentData.time, dataPoints: raceData.length })
    }
  }

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      setIsRunning(false)
      setRaceData([])
      handleInteraction('reset', {})
      resetCompletion() // Reset completion tracking
    }
  }

  const handleExportData = () => {
    const csv = [
      'Time (s),Position A (m),Position B (m),Velocity A (m/s),Velocity B (m/s)',
      ...raceData.map(d => 
        `${d.time},${d.positionA},${d.positionB},${d.velocityA},${d.velocityB}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `car-race-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyForDesmos = () => {
    const carAData = raceData.map(d => `(${d.time},${d.positionA})`).join(',')
    const carBData = raceData.map(d => `(${d.time},${d.positionB})`).join(',')
    
    const desmosText = `Car A Position:\n${carAData}\n\nCar B Position:\n${carBData}`
    
    navigator.clipboard.writeText(desmosText).then(() => {
      alert('Data copied! Paste into Desmos to see the intersection point!')
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  // Calculate when Car B overtakes Car A algebraically
  const calculateOvertakeTime = () => {
    // Equation: x_A = v_A(t - d_A) and x_B = v_B(t - d_B)
    // When they meet: v_A(t - d_A) = v_B(t - d_B)
    // Solve for t: v_A*t - v_A*d_A = v_B*t - v_B*d_B
    //              t(v_A - v_B) = v_A*d_A - v_B*d_B
    //              t = (v_A*d_A - v_B*d_B) / (v_A - v_B)
    
    const numerator = velocityA * startDelayA - velocityB * startDelayB
    const denominator = velocityA - velocityB
    
    if (Math.abs(denominator) < 0.001) {
      return null // Same velocity - never overtake (or always equal)
    }
    
    const t = numerator / denominator
    
    // Check if overtake happens (positive time, after both started)
    if (t > Math.max(startDelayA, startDelayB)) {
      const position = velocityA * (t - startDelayA)
      return { time: t, position }
    }
    
    return null
  }

  const predictedOvertake = calculateOvertakeTime()

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
            <h1 className="text-3xl font-bold mb-2">Car Race: Relative Motion & Kinematics</h1>
            <p className="text-muted-foreground">
              Two cars with constant velocities and different start times - use kinematics to predict the overtake!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">Intermediate</Badge>
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
        {/* Left Column: Race View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Race Track */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Race Track (1000 meters)</CardTitle>
              <CardDescription>Watch the race unfold in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <canvas 
                ref={canvasRef}
                className="w-full border-2 border-border rounded-lg"
              />

              {/* Real-time Status */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700 font-medium mb-1">Time</div>
                  <div className="text-xl font-bold text-blue-900">{currentData.time.toFixed(1)}s</div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <div className="text-xs text-blue-700 font-medium mb-1">Car A Position</div>
                  <div className="text-lg font-bold text-blue-900">{currentData.positionA.toFixed(0)}m</div>
                  <div className="text-xs text-blue-600">{velocityA} m/s</div>
                </div>

                <div className="p-3 bg-red-50 rounded-lg border-2 border-red-300">
                  <div className="text-xs text-red-700 font-medium mb-1">Car B Position</div>
                  <div className="text-lg font-bold text-red-900">{currentData.positionB.toFixed(0)}m</div>
                  <div className="text-xs text-red-600">{velocityB} m/s</div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-700 font-medium mb-1">Gap</div>
                  <div className="text-lg font-bold text-purple-900">
                    {Math.abs(currentData.positionB - currentData.positionA).toFixed(0)}m
                  </div>
                  <div className="text-xs text-purple-600">
                    {currentData.positionB > currentData.positionA ? 'B ahead' : 'A ahead'}
                  </div>
                </div>
              </div>

              {/* Overtake Status */}
              {currentData.overtaken && (
                <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <div className="text-lg font-bold text-purple-900 mb-1">
                    🏁 Car B Overtook Car A!
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
                    <div><strong>Time:</strong> {currentData.overtakeTime.toFixed(2)}s</div>
                    <div><strong>Position:</strong> {currentData.overtakePosition.toFixed(0)}m</div>
                  </div>
                  {predictedOvertake && (
                    <div className="mt-2 text-xs text-purple-700 bg-purple-100 p-2 rounded">
                      <strong>Predicted:</strong> {predictedOvertake.time.toFixed(2)}s at {predictedOvertake.position.toFixed(0)}m
                      {Math.abs(predictedOvertake.time - currentData.overtakeTime) < 0.1 && ' ✓ Matches!'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Graphs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="position" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="position">Position Graph</TabsTrigger>
                  <TabsTrigger value="table">Data Table</TabsTrigger>
                </TabsList>

                {/* Position vs Time Graph */}
                <TabsContent value="position" className="space-y-2">
                  <h4 className="font-semibold text-sm">Position vs. Time (Finding the Intersection!)</h4>
                  <div className="h-72 bg-white border rounded-lg p-4 relative">
                    {raceData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 opacity-50" />
                      </div>
                    ) : (
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <g stroke="#e5e7eb" strokeWidth="0.2">
                          {[0, 25, 50, 75, 100].map(y => (
                            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} />
                          ))}
                          {[0, 25, 50, 75, 100].map(x => (
                            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" />
                          ))}
                        </g>
                        
                        {/* Car A line (blue) */}
                        <polyline
                          points={raceData.map((d, i) => {
                            const x = (i / Math.max(raceData.length - 1, 1)) * 100
                            const maxPos = Math.max(...raceData.map(p => Math.max(p.positionA, p.positionB)), 100)
                            const y = 100 - (d.positionA / maxPos) * 90
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#3b82f6"
                          strokeWidth="2"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                        
                        {/* Car B line (red) */}
                        <polyline
                          points={raceData.map((d, i) => {
                            const x = (i / Math.max(raceData.length - 1, 1)) * 100
                            const maxPos = Math.max(...raceData.map(p => Math.max(p.positionA, p.positionB)), 100)
                            const y = 100 - (d.positionB / maxPos) * 90
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#ef4444"
                          strokeWidth="2"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                        
                        {/* Intersection point marker */}
                        {currentData.overtaken && predictedOvertake && (
                          <circle
                            cx={(currentData.overtakeTime / Math.max(...raceData.map(d => d.time))) * 100}
                            cy={100 - (currentData.overtakePosition / Math.max(...raceData.map(p => Math.max(p.positionA, p.positionB)), 100)) * 90}
                            r="2"
                            fill="#8b5cf6"
                            stroke="#fff"
                            strokeWidth="0.5"
                          />
                        )}
                      </svg>
                    )}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                      Time (s)
                    </div>
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">
                      Position (m)
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs justify-center">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Car A (slower)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Car B (faster, delayed)</span>
                    </div>
                    {currentData.overtaken && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Intersection</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    The intersection point is where Car B catches up to Car A!
                  </p>
                </TabsContent>

                {/* Data Table */}
                <TabsContent value="table" className="space-y-4">
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {raceData.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <TableIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start race to collect data</p>
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Time (s)</th>
                            <th className="p-2 text-left">Pos A (m)</th>
                            <th className="p-2 text-left">Pos B (m)</th>
                            <th className="p-2 text-left">Leader</th>
                          </tr>
                        </thead>
                        <tbody>
                          {raceData.map((d, i) => {
                            const leader = d.positionB > d.positionA ? 'B' : d.positionA > d.positionB ? 'A' : 'Tie'
                            const isOvertake = i > 0 && raceData[i-1].positionA > raceData[i-1].positionB && d.positionB >= d.positionA
                            return (
                              <tr key={i} className={`border-t hover:bg-muted/50 ${isOvertake ? 'bg-purple-50' : ''}`}>
                                <td className="p-2">{d.time}s</td>
                                <td className="p-2 font-mono text-blue-700">{d.positionA.toFixed(1)}</td>
                                <td className="p-2 font-mono text-red-700">{d.positionB.toFixed(1)}</td>
                                <td className="p-2 font-semibold">{leader}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {raceData.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {raceData.length} data points (every 0.2s)
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleExportData} className="flex-1">
                          <Download className="h-3 w-3 mr-1" />CSV
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCopyForDesmos} className="flex-1 bg-blue-50">
                          <BarChart3 className="h-3 w-3 mr-1" />Desmos
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls & Math */}
        <div className="space-y-6">
          {/* Setup Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Race Setup</CardTitle>
              <CardDescription>Configure before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Car A Settings */}
              <div className="p-3 bg-blue-50 rounded-lg space-y-3">
                <div className="font-semibold text-blue-900">🚗 Car A (Blue)</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs">Speed</span>
                    <span className="text-xs font-mono">{velocityA} m/s</span>
                  </div>
                  <Slider
                    value={[velocityA]}
                    onValueChange={([value]) => {
                      setVelocityA(value)
                      handleInteraction('speed_changed_a', { speed: value })
                    }}
                    min={5}
                    max={40}
                    step={5}
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs">Start Delay</span>
                    <span className="text-xs font-mono">{startDelayA.toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[startDelayA]}
                    onValueChange={([value]) => setStartDelayA(value)}
                    min={0}
                    max={10}
                    step={0.5}
                    disabled={isRunning}
                  />
                </div>
              </div>

              {/* Car B Settings */}
              <div className="p-3 bg-red-50 rounded-lg space-y-3">
                <div className="font-semibold text-red-900">🚗 Car B (Red)</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs">Speed</span>
                    <span className="text-xs font-mono">{velocityB} m/s</span>
                  </div>
                  <Slider
                    value={[velocityB]}
                    onValueChange={([value]) => {
                      setVelocityB(value)
                      handleInteraction('speed_changed_b', { speed: value })
                    }}
                    min={5}
                    max={40}
                    step={5}
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs">Start Delay</span>
                    <span className="text-xs font-mono">{startDelayB.toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[startDelayB]}
                    onValueChange={([value]) => setStartDelayB(value)}
                    min={0}
                    max={10}
                    step={0.5}
                    disabled={isRunning}
                  />
                </div>
              </div>

              {/* Control Buttons */}
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
              </div>
            </CardContent>
          </Card>

          {/* Kinematics Analysis */}
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-green-900">🔬 Kinematics Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded-lg border-2 border-blue-200">
                <div className="font-semibold text-blue-900 mb-2">Position Equations (Constant Velocity)</div>
                <div className="space-y-1 text-xs font-mono bg-blue-50 p-2 rounded">
                  <div>x<sub>A</sub> = {velocityA}(t - {startDelayA}) meters</div>
                  <div>x<sub>B</sub> = {velocityB}(t - {startDelayB}) meters</div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  <strong>Kinematics:</strong> x = v(t - t<sub>start</sub>)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Slope on graph = velocity
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-cyan-200">
                <div className="font-semibold text-cyan-900 mb-2">Relative Motion Analysis</div>
                <div className="text-xs space-y-1 bg-cyan-50 p-2 rounded">
                  <div><strong>Relative velocity:</strong> v<sub>rel</sub> = {velocityB} - {velocityA} = {velocityB - velocityA} m/s</div>
                  {startDelayB > startDelayA && (
                    <div><strong>Head start:</strong> A gains {(velocityA * (startDelayB - startDelayA)).toFixed(0)}m before B starts</div>
                  )}
                  {predictedOvertake && (velocityB - velocityA) > 0 && (
                    <div><strong>Gap closes at:</strong> {(velocityB - velocityA).toFixed(1)} m/s</div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
                <div className="font-semibold text-purple-900 mb-2">Overtake Prediction</div>
                <div className="text-xs space-y-1">
                  <div>Set positions equal: x<sub>A</sub> = x<sub>B</sub></div>
                  <div className="font-mono bg-purple-50 p-2 rounded my-1">
                    {velocityA}(t - {startDelayA}) = {velocityB}(t - {startDelayB})
                  </div>
                  {predictedOvertake ? (
                    <>
                      <div className="font-semibold mt-2">When & Where:</div>
                      <div className="bg-purple-100 p-2 rounded">
                        <div>⏱️ Time: <strong>{predictedOvertake.time.toFixed(2)} seconds</strong></div>
                        <div>📍 Position: <strong>{predictedOvertake.position.toFixed(0)} meters</strong></div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-purple-700 bg-purple-100 p-2 rounded mt-2">
                      {velocityA === velocityB 
                        ? "Same velocity → parallel motion (gap stays constant)"
                        : "B won't catch A (slower or insufficient advantage)"
                      }
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900">
                <strong>💡 Physics:</strong> Graph intersection = same position at same time = overtake moment!
              </div>
            </CardContent>
          </Card>

          {/* Learning Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Physics Investigations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li><strong>Predict overtake:</strong> Use kinematics to calculate when B catches A</li>
                <li><strong>Graph slopes:</strong> Observe that slope = velocity on position-time graph</li>
                <li><strong>Relative velocity:</strong> Calculate closing speed (v<sub>B</sub> - v<sub>A</sub>)</li>
                <li><strong>Head start advantage:</strong> How far does A get before B starts?</li>
                <li><strong>Equal velocities:</strong> Parallel lines = constant gap = no overtake</li>
                <li><strong>Reference frames:</strong> View motion from Car A's perspective</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="car-race"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={completionState.isCompleted}
          simulationData={{
            dataPoints: raceData,
            overtaken: currentData.overtaken,
            totalTime: currentData.time
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
          simulationSlug="car-race"
          assignment={editingAssignment}
          onSave={() => {
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
export default function CarRaceSimulation() {
  return (
    <SimulationWrapper
      simulationSlug="car-race"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <CarRaceContent {...props} />}
    </SimulationWrapper>
  )
}

