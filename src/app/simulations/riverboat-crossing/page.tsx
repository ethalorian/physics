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
import { useSimulationCompletion } from '@/hooks/useSimulationCompletion'
import SimulationProgress from '@/components/simulations/SimulationProgress'
import { getSimulationCriteria, getActionLabels } from '@/config/simulationCompletionCriteria'
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
  Plus,
  Settings,
  FileText,
  Navigation,
  Waves
} from 'lucide-react'

interface CrossingData {
  time: number
  boatX: number
  boatY: number
  velocityBoatX: number
  velocityBoatY: number
  velocityCurrentX: number
  velocityResultantX: number
  velocityResultantY: number
  drift: number
}

interface Vector2D {
  x: number
  y: number
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

class RiverboatEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  // River dimensions
  private riverWidth: number = 100 // meters (shore to shore)
  private riverLength: number = 150 // meters (visible section)
  
  // Boat state
  private boatX: number = 0 // meters (across river)
  private boatY: number = 50 // meters (downstream position, starts at middle)
  private boatSpeed: number = 5 // m/s (speed through water)
  private boatAngle: number = 90 // degrees (0 = right, 90 = straight across, 180 = left)
  
  // River current
  private currentSpeed: number = 2 // m/s (downstream)
  
  // Target
  private targetY: number = 50 // meters (where we want to land)
  
  private animationId: number | null = null
  private lastTime: number = 0
  private isRunning: boolean = false
  private time: number = 0
  private pixelsPerMeter: number = 5
  private path: Vector2D[] = []
  private hasReachedOtherSide: boolean = false
  
  private onUpdate: (data: {
    boatX: number
    boatY: number
    boatVelocity: Vector2D
    currentVelocity: Vector2D
    resultantVelocity: Vector2D
    drift: number
    crossingTime: number
    completed: boolean
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
      this.canvas.width = Math.min(container.clientWidth, 700)
      this.canvas.height = 500
      this.pixelsPerMeter = Math.min(this.canvas.width / this.riverLength, this.canvas.height / this.riverWidth)
    }
  }

  public setBoatParameters(speed: number, angle: number) {
    this.boatSpeed = speed
    this.boatAngle = angle
  }

  public setCurrentSpeed(speed: number) {
    this.currentSpeed = speed
  }

  public setTargetY(y: number) {
    this.targetY = y
  }

  public start() {
    if (!this.isRunning) {
      this.boatX = 0
      this.boatY = 50
      this.path = [{ x: 0, y: 50 }]
      this.hasReachedOtherSide = false
      this.time = 0
      
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
    this.boatX = 0
    this.boatY = 50
    this.path = []
    this.time = 0
    this.hasReachedOtherSide = false
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

    if (!this.hasReachedOtherSide) {
      // Calculate velocity components
      const angleRad = this.boatAngle * Math.PI / 180
      const boatVx = this.boatSpeed * Math.cos(angleRad) // Across river
      const boatVy = this.boatSpeed * Math.sin(angleRad) // Along river (boat's motion)
      
      // Current only affects downstream motion (y-direction in our coordinate system)
      const currentVy = this.currentSpeed
      
      // Resultant velocity (vector addition)
      const resultantVx = boatVx // Across river (not affected by current)
      const resultantVy = boatVy + currentVy // Along river (boat + current)
      
      // Update position
      this.boatX += resultantVx * dt
      this.boatY += resultantVy * dt
      
      // Record path
      if (this.path.length === 0 || this.time % 0.2 < dt) {
        this.path.push({ x: this.boatX, y: this.boatY })
      }
      
      // Check if reached other side
      if (this.boatX >= this.riverWidth) {
        this.boatX = this.riverWidth
        this.hasReachedOtherSide = true
        this.pause()
      }
      
      // Keep within river bounds (vertically)
      if (this.boatY < 0) this.boatY = 0
      if (this.boatY > this.riverLength) this.boatY = this.riverLength
    }

    this.time += dt

    this.render()
    this.sendUpdate()

    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.animate())
    }
  }

  private sendUpdate() {
    const angleRad = this.boatAngle * Math.PI / 180
    const boatVx = this.boatSpeed * Math.cos(angleRad)
    const boatVy = this.boatSpeed * Math.sin(angleRad)
    
    const resultantVx = boatVx
    const resultantVy = boatVy + this.currentSpeed
    
    const drift = this.boatY - this.targetY

    this.onUpdate({
      boatX: this.boatX,
      boatY: this.boatY,
      boatVelocity: { x: boatVx, y: boatVy },
      currentVelocity: { x: 0, y: this.currentSpeed },
      resultantVelocity: { x: resultantVx, y: resultantVy },
      drift: drift,
      crossingTime: this.time,
      completed: this.hasReachedOtherSide
    })
  }

  private render() {
    const ctx = this.ctx

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // River background
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, '#3b82f6')
    gradient.addColorStop(0.5, '#2563eb')
    gradient.addColorStop(1, '#1e40af')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Current flow lines (animated)
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.3)'
    ctx.lineWidth = 2
    const flowOffset = (this.time * this.currentSpeed * this.pixelsPerMeter) % 40
    for (let i = 0; i < 15; i++) {
      const y = i * 40 - flowOffset
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(this.canvas.width, y)
      ctx.stroke()
    }

    // Near shore (starting side - left)
    ctx.fillStyle = '#86efac'
    ctx.fillRect(0, 0, 30, this.canvas.height)
    
    // Far shore (destination - right)
    ctx.fillStyle = '#86efac'
    ctx.fillRect(this.canvas.width - 30, 0, 30, this.canvas.height)

    // Shore edges
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(30, 0)
    ctx.lineTo(30, this.canvas.height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(this.canvas.width - 30, 0)
    ctx.lineTo(this.canvas.width - 30, this.canvas.height)
    ctx.stroke()

    // Convert to screen coordinates
    const boatScreenX = 30 + this.boatX * this.pixelsPerMeter
    const boatScreenY = this.boatY * this.pixelsPerMeter
    
    const startScreenY = this.targetY * this.pixelsPerMeter
    const targetScreenY = this.targetY * this.pixelsPerMeter

    // Draw starting dock
    ctx.fillStyle = '#92400e'
    ctx.fillRect(10, startScreenY - 15, 20, 30)

    // Draw target dock (destination)
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(this.canvas.width - 30, targetScreenY - 15, 20, 30)
    
    // Target flag
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(this.canvas.width - 15, targetScreenY - 15)
    ctx.lineTo(this.canvas.width - 15, targetScreenY - 40)
    ctx.lineTo(this.canvas.width - 35, targetScreenY - 30)
    ctx.closePath()
    ctx.fill()
    
    ctx.strokeStyle = '#7c2d12'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.canvas.width - 15, targetScreenY - 15)
    ctx.lineTo(this.canvas.width - 15, targetScreenY - 40)
    ctx.stroke()

    // Draw boat path (trace)
    if (this.path.length > 1) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(30 + this.path[0].x * this.pixelsPerMeter, this.path[0].y * this.pixelsPerMeter)
      for (let i = 1; i < this.path.length; i++) {
        ctx.lineTo(30 + this.path[i].x * this.pixelsPerMeter, this.path[i].y * this.pixelsPerMeter)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw straight-across reference line (where boat would go with no current)
    if (this.isRunning || this.time > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 10])
      ctx.beginPath()
      ctx.moveTo(30, startScreenY)
      ctx.lineTo(this.canvas.width - 30, targetScreenY)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw boat
    ctx.save()
    ctx.translate(boatScreenX, boatScreenY)
    
    // Rotate boat to face direction of travel (resultant velocity)
    if (this.isRunning || this.time > 0) {
      const angleRad = this.boatAngle * Math.PI / 180
      const boatVy = this.boatSpeed * Math.sin(angleRad)
      const resultantVy = boatVy + this.currentSpeed
      const boatVx = this.boatSpeed * Math.cos(angleRad)
      const resultantAngle = Math.atan2(resultantVy, boatVx)
      ctx.rotate(resultantAngle)
    } else {
      ctx.rotate((this.boatAngle - 90) * Math.PI / 180)
    }
    
    // Boat shape
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(15, 0) // Front
    ctx.lineTo(-10, -8) // Back left
    ctx.lineTo(-10, 8) // Back right
    ctx.closePath()
    ctx.fill()
    
    // Boat details
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(-10, -3, 20, 6) // Center cabin
    
    ctx.restore()

    // Draw velocity vectors (from boat position)
    const vectorScale = 15 // pixels per m/s
    
    // Boat velocity vector (green) - velocity relative to water
    const angleRad = this.boatAngle * Math.PI / 180
    const boatVx = this.boatSpeed * Math.cos(angleRad)
    const boatVy = this.boatSpeed * Math.sin(angleRad)
    
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(boatScreenX, boatScreenY)
    ctx.lineTo(boatScreenX + boatVx * vectorScale, boatScreenY + boatVy * vectorScale)
    ctx.stroke()
    this.drawArrow(ctx, boatScreenX + boatVx * vectorScale, boatScreenY + boatVy * vectorScale, Math.atan2(boatVy, boatVx), '#10b981')
    
    ctx.fillStyle = '#10b981'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`v_boat = ${this.boatSpeed.toFixed(1)} m/s`, boatScreenX + boatVx * vectorScale / 2 + 10, boatScreenY + boatVy * vectorScale / 2)

    // Current velocity vector (cyan) - always downstream
    ctx.strokeStyle = '#06b6d4'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(boatScreenX, boatScreenY)
    ctx.lineTo(boatScreenX, boatScreenY + this.currentSpeed * vectorScale)
    ctx.stroke()
    this.drawArrow(ctx, boatScreenX, boatScreenY + this.currentSpeed * vectorScale, Math.PI / 2, '#06b6d4')
    
    ctx.fillStyle = '#06b6d4'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`v_current = ${this.currentSpeed.toFixed(1)} m/s`, boatScreenX - 10, boatScreenY + this.currentSpeed * vectorScale / 2)

    // Resultant velocity vector (purple) - actual path
    const resultantVx = boatVx
    const resultantVy = boatVy + this.currentSpeed
    
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(boatScreenX, boatScreenY)
    ctx.lineTo(boatScreenX + resultantVx * vectorScale, boatScreenY + resultantVy * vectorScale)
    ctx.stroke()
    this.drawArrow(ctx, boatScreenX + resultantVx * vectorScale, boatScreenY + resultantVy * vectorScale, Math.atan2(resultantVy, resultantVx), '#8b5cf6')
    
    const resultantSpeed = Math.sqrt(resultantVx * resultantVx + resultantVy * resultantVy)
    ctx.fillStyle = '#8b5cf6'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`v_resultant = ${resultantSpeed.toFixed(1)} m/s`, boatScreenX + resultantVx * vectorScale / 2, boatScreenY + resultantVy * vectorScale / 2 - 10)

    // Draw drift indicator if completed
    if (this.hasReachedOtherSide) {
      const drift = this.boatY - this.targetY
      const driftScreenY = this.boatY * this.pixelsPerMeter
      
      // Drift line
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(this.canvas.width - 30, targetScreenY)
      ctx.lineTo(this.canvas.width - 30, driftScreenY)
      ctx.stroke()
      ctx.setLineDash([])
      
      // Drift label
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`Drift: ${Math.abs(drift).toFixed(1)}m ${drift > 0 ? '⬇' : '⬆'}`, this.canvas.width - 40, (targetScreenY + driftScreenY) / 2)
    }

    // Draw labels
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('START', 15, startScreenY)
    
    ctx.fillStyle = '#ef4444'
    ctx.fillText('TARGET', this.canvas.width - 15, targetScreenY + 50)
    
    // Current indicator
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`← Current: ${this.currentSpeed} m/s`, 50, 30)
  }

  private drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
    const arrowSize = 10
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(
      x - arrowSize * Math.cos(angle - Math.PI / 6),
      y - arrowSize * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      x - arrowSize * Math.cos(angle + Math.PI / 6),
      y - arrowSize * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function RiverboatCrossingContent({
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
  const [boatSpeed, setBoatSpeed] = useState(5) // m/s
  const [boatAngle, setBoatAngle] = useState(90) // degrees
  const [currentSpeed, setCurrentSpeed] = useState(2) // m/s
  const [crossingData, setCrossingData] = useState<CrossingData[]>([])
  const [currentData, setCurrentData] = useState({
    boatX: 0,
    boatY: 50,
    boatVelocity: { x: 0, y: 0 },
    currentVelocity: { x: 0, y: 2 },
    resultantVelocity: { x: 0, y: 0 },
    drift: 0,
    crossingTime: 0,
    completed: false
  })
  // Use standardized completion tracking
  const completionConfig = getSimulationCriteria('riverboat-crossing')
  const actionLabelsMap = getActionLabels('riverboat-crossing')
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
  const engineRef = useRef<RiverboatEngine | null>(null)
  const totalSimulationTime = useRef(0)

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new RiverboatEngine(
        canvasRef.current,
        (data) => {
          setCurrentData(data)

          if (data.completed && !completionState.isCompleted) {
            markComplete({}, 100)
            onComplete({
              drift: data.drift,
              crossingTime: data.crossingTime,
              boatAngle: boatAngle,
              currentSpeed: currentSpeed
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=riverboat-crossing')
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

  // Enhanced interaction tracking wrapper
  const handleInteraction = useCallback((action: string, data: Record<string, any>) => {
    // Call the original onInteraction from SimulationWrapper
    handleInteraction(action, data)
    
    // Track with standardized system
    trackInteraction(action, data)
  }, [onInteraction, trackInteraction])
  
    const handleStart = () => {
    if (engineRef.current) {
      engineRef.current.setBoatParameters(boatSpeed, boatAngle)
      engineRef.current.setCurrentSpeed(currentSpeed)
      engineRef.current.start()
      setIsRunning(true)
      handleInteraction('start', { boatSpeed, boatAngle, currentSpeed })
    }
  }

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause()
      setIsRunning(false)
      handleInteraction('pause', { time: currentData.crossingTime })
    }
  }

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      setIsRunning(false)
      setCrossingData([])
      // Completion reset handled by resetCompletion()
      handleInteraction('reset', {})
    }
  }

  // Calculate theoretical drift
  const calculateDrift = () => {
    const angleRad = boatAngle * Math.PI / 180
    const boatVx = boatSpeed * Math.cos(angleRad)
    
    if (boatVx > 0) {
      const crossingTime = 100 / boatVx
      const drift = currentSpeed * crossingTime
      return { crossingTime, drift }
    }
    return null
  }

  const predicted = calculateDrift()

  // Calculate angle needed to go straight across (compensate for current)
  const calculateCompensationAngle = () => {
    // To go straight: boatVy + current = 0
    // boatSpeed * sin(θ) + current = 0
    // sin(θ) = -current / boatSpeed
    const sinTheta = -currentSpeed / boatSpeed
    
    if (Math.abs(sinTheta) <= 1) {
      const theta = Math.asin(sinTheta) * 180 / Math.PI
      return 90 + theta // Adjust from our coordinate system
    }
    return null // Current too strong!
  }

  const compensationAngle = calculateCompensationAngle()

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
            <h1 className="text-3xl font-bold mb-2">Riverboat Crossing: Vector Addition</h1>
            <p className="text-muted-foreground">
              Navigate a boat across a river with current - see how velocities add as vectors!
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
        {/* Left Column: River Scene */}
        <div className="lg:col-span-2 space-y-6">
          {/* River View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">River Crossing (Top View)</CardTitle>
              <CardDescription>
                Watch the boat cross the 100-meter wide river - current flows downward!
              </CardDescription>
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
                  <div className="text-xl font-bold text-blue-900">{currentData.crossingTime.toFixed(1)}s</div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-700 font-medium mb-1">Distance Across</div>
                  <div className="text-lg font-mono text-green-900">{currentData.boatX.toFixed(1)}m</div>
                  <div className="text-xs text-green-600">/ 100m</div>
                </div>

                <div className="p-3 bg-cyan-50 rounded-lg">
                  <div className="text-xs text-cyan-700 font-medium mb-1">Downstream Drift</div>
                  <div className="text-lg font-mono text-cyan-900">{currentData.drift.toFixed(1)}m</div>
                  <div className="text-xs text-cyan-600">{currentData.drift > 0 ? 'Below' : 'Above'} target</div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-700 font-medium mb-1">Resultant Speed</div>
                  <div className="text-lg font-bold text-purple-900">
                    {Math.sqrt(currentData.resultantVelocity.x ** 2 + currentData.resultantVelocity.y ** 2).toFixed(1)} m/s
                  </div>
                </div>
              </div>

              {/* Completion Status */}
              {currentData.completed && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="text-lg font-bold text-green-900 mb-2">
                    🚤 Reached Other Side!
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-green-700"><strong>Crossing Time:</strong></div>
                      <div className="text-green-900 font-mono">{currentData.crossingTime.toFixed(2)}s</div>
                      {predicted && (
                        <div className="text-xs text-green-600">Predicted: {predicted.crossingTime.toFixed(2)}s ✓</div>
                      )}
                    </div>
                    <div>
                      <div className="text-green-700"><strong>Drift Distance:</strong></div>
                      <div className="text-green-900 font-mono">{Math.abs(currentData.drift).toFixed(1)}m downstream</div>
                      {predicted && (
                        <div className="text-xs text-green-600">Predicted: {predicted.drift.toFixed(1)}m ✓</div>
                      )}
                    </div>
                  </div>
                  {Math.abs(currentData.drift) < 2 && (
                    <div className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded text-center">
                      🎯 Excellent! You compensated well for the current!
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          {/* Setup Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Boat Setup</CardTitle>
              <CardDescription>Configure before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Boat Speed */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Boat Speed (through water)</label>
                  <span className="text-sm text-muted-foreground">{boatSpeed.toFixed(1)} m/s</span>
                </div>
                <Slider
                  value={[boatSpeed]}
                  onValueChange={([value]) => setBoatSpeed(value)}
                  min={2}
                  max={10}
                  step={0.5}
                  disabled={isRunning}
                />
              </div>

              {/* Boat Angle */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Boat Heading Angle</label>
                  <span className="text-sm text-muted-foreground">{boatAngle.toFixed(0)}°</span>
                </div>
                <Slider
                  value={[boatAngle]}
                  onValueChange={([value]) => setBoatAngle(value)}
                  min={60}
                  max={120}
                  step={5}
                  disabled={isRunning}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>← Upstream</span>
                  <span>Straight →</span>
                  <span>Downstream →</span>
                </div>
                {compensationAngle && (
                  <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                    <strong>Tip:</strong> To go straight across, aim at {compensationAngle.toFixed(1)}° (upstream)
                  </div>
                )}
              </div>

              {/* River Current */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">River Current Speed</label>
                  <span className="text-sm text-muted-foreground">{currentSpeed.toFixed(1)} m/s</span>
                </div>
                <Slider
                  value={[currentSpeed]}
                  onValueChange={([value]) => setCurrentSpeed(value)}
                  min={0}
                  max={5}
                  step={0.5}
                  disabled={isRunning}
                />
              </div>

              {/* Control Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <Button 
                  onClick={handleStart}
                  className="w-full"
                  disabled={isRunning}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Crossing
                </Button>
                <Button 
                  onClick={() => {
                    handleReset()
                    resetCompletion() // Reset completion tracking
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Vector Analysis */}
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-green-900">📐 Vector Addition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded-lg border-2 border-green-200">
                <div className="font-semibold text-green-900 mb-2">Boat Velocity (Green)</div>
                <div className="text-xs font-mono bg-green-50 p-2 rounded">
                  v⃗<sub>boat</sub> = {boatSpeed.toFixed(1)} m/s at {boatAngle}°
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Velocity relative to the water
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-cyan-200">
                <div className="font-semibold text-cyan-900 mb-2">Current Velocity (Cyan)</div>
                <div className="text-xs font-mono bg-cyan-50 p-2 rounded">
                  v⃗<sub>current</sub> = {currentSpeed.toFixed(1)} m/s downstream
                </div>
                <p className="text-xs text-cyan-700 mt-1">
                  Water flow velocity
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
                <div className="font-semibold text-purple-900 mb-2">Resultant Velocity (Purple)</div>
                <div className="text-xs font-mono bg-purple-50 p-2 rounded text-center">
                  v⃗<sub>resultant</sub> = v⃗<sub>boat</sub> + v⃗<sub>current</sub>
                </div>
                <p className="text-xs text-purple-700 mt-1">
                  Actual path over ground (vector sum)
                </p>
              </div>

              {predicted && (
                <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900">
                  <strong>Predicted Drift:</strong> {predicted.drift.toFixed(1)}m in {predicted.crossingTime.toFixed(1)}s
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Try This!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li><strong>90° heading:</strong> See how much you drift downstream</li>
                <li><strong>Aim upstream:</strong> Reduce drift by angling against current</li>
                <li><strong>Zero drift:</strong> Find the exact angle to go straight across</li>
                <li><strong>No current:</strong> Set to 0 m/s - boat goes where it aims</li>
                <li><strong>Strong current:</strong> Increase to 4 m/s - big drift!</li>
                <li><strong>Calculate drift:</strong> Use time × current speed</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="riverboat-crossing"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={completionState.isCompleted}
          simulationData={{
            drift: currentData.drift,
            crossingTime: currentData.crossingTime
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
          simulationSlug="riverboat-crossing"
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
export default function RiverboatCrossingSimulation() {
  return (
    <SimulationWrapper
      simulationSlug="riverboat-crossing"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <RiverboatCrossingContent {...props} />}
    </SimulationWrapper>
  )
}

