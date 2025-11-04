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
  FileText
} from 'lucide-react'

interface KinematicsData {
  time: number
  positionX: number
  positionY: number
  velocityX: number
  velocityY: number
  accelerationX: number
  accelerationY: number
  speed: number
  forceX: number
  forceY: number
  forceMagnitude: number
}

interface Vector2D {
  x: number
  y: number
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

const ASTRONAUT_MASS = 100 // kg (astronaut + spacesuit)

class AstronautPhysicsEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private position: Vector2D = { x: 250, y: 250 } // pixels
  private velocity: Vector2D = { x: 0, y: 0 } // m/s
  private acceleration: Vector2D = { x: 0, y: 0 } // m/s²
  private thrustForce: Vector2D = { x: 0, y: 0 } // N
  private animationId: number | null = null
  private lastTime: number = 0
  private isRunning: boolean = false
  private time: number = 0
  private pixelsPerMeter: number = 20 // Scale for rendering
  
  private onUpdate: (data: {
    position: Vector2D
    velocity: Vector2D
    acceleration: Vector2D
    force: Vector2D
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
      this.canvas.width = Math.min(container.clientWidth, 700)
      this.canvas.height = 500
    }
  }

  public setThrustForce(fx: number, fy: number) {
    this.thrustForce = { x: fx, y: fy }
    
    // Calculate acceleration from F = ma
    this.acceleration = {
      x: fx / ASTRONAUT_MASS,
      y: fy / ASTRONAUT_MASS
    }
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
    this.position = { x: this.canvas.width / 2, y: this.canvas.height / 2 }
    this.velocity = { x: 0, y: 0 }
    this.acceleration = { x: 0, y: 0 }
    this.thrustForce = { x: 0, y: 0 }
    this.time = 0
    this.render()
    this.sendUpdate()
  }

  public setInitialVelocity(vx: number, vy: number) {
    this.velocity = { x: vx, y: vy }
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

    // Update physics (Newton's Second Law: F = ma)
    // Acceleration is already set from thrust force
    
    // Update velocity: v = v₀ + at
    this.velocity.x += this.acceleration.x * dt
    this.velocity.y += this.acceleration.y * dt

    // Update position: x = x₀ + vt
    this.position.x += this.velocity.x * this.pixelsPerMeter * dt
    this.position.y += this.velocity.y * this.pixelsPerMeter * dt

    // Keep within bounds (bounce off edges)
    if (this.position.x < 30) {
      this.position.x = 30
      this.velocity.x = Math.abs(this.velocity.x) * 0.8
    }
    if (this.position.x > this.canvas.width - 30) {
      this.position.x = this.canvas.width - 30
      this.velocity.x = -Math.abs(this.velocity.x) * 0.8
    }
    if (this.position.y < 30) {
      this.position.y = 30
      this.velocity.y = Math.abs(this.velocity.y) * 0.8
    }
    if (this.position.y > this.canvas.height - 30) {
      this.position.y = this.canvas.height - 30
      this.velocity.y = -Math.abs(this.velocity.y) * 0.8
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
      position: {
        x: this.position.x / this.pixelsPerMeter,
        y: this.position.y / this.pixelsPerMeter
      },
      velocity: this.velocity,
      acceleration: this.acceleration,
      force: this.thrustForce,
      time: this.time
    })
  }

  private render() {
    const ctx = this.ctx

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw space background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw stars
    ctx.fillStyle = '#fff'
    for (let i = 0; i < 100; i++) {
      const x = (i * 73) % this.canvas.width
      const y = (i * 127) % this.canvas.height
      const size = (i % 3) + 1
      ctx.fillRect(x, y, size, size)
    }

    // Draw grid for reference
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    const gridSpacing = 50 // pixels
    for (let x = 0; x < this.canvas.width; x += gridSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, this.canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < this.canvas.height; y += gridSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(this.canvas.width, y)
      ctx.stroke()
    }

    // Draw velocity vector (cyan)
    const velMag = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2)
    if (velMag > 0.1) {
      const velScale = 30
      ctx.strokeStyle = '#06b6d4'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(this.position.x, this.position.y)
      ctx.lineTo(
        this.position.x + this.velocity.x * velScale,
        this.position.y + this.velocity.y * velScale
      )
      ctx.stroke()
      
      // Velocity arrow
      this.drawArrow(
        ctx,
        this.position.x + this.velocity.x * velScale,
        this.position.y + this.velocity.y * velScale,
        Math.atan2(this.velocity.y, this.velocity.x),
        '#06b6d4'
      )
      
      // Velocity label
      ctx.fillStyle = '#06b6d4'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `v = ${velMag.toFixed(1)} m/s`,
        this.position.x + this.velocity.x * velScale / 2,
        this.position.y + this.velocity.y * velScale / 2 - 10
      )
    }

    // Draw thrust force vector (orange)
    const forceMag = Math.sqrt(this.thrustForce.x ** 2 + this.thrustForce.y ** 2)
    if (forceMag > 0.1) {
      const forceScale = 0.5
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(this.position.x, this.position.y)
      ctx.lineTo(
        this.position.x + this.thrustForce.x * forceScale,
        this.position.y + this.thrustForce.y * forceScale
      )
      ctx.stroke()
      
      // Force arrow
      this.drawArrow(
        ctx,
        this.position.x + this.thrustForce.x * forceScale,
        this.position.y + this.thrustForce.y * forceScale,
        Math.atan2(this.thrustForce.y, this.thrustForce.x),
        '#f97316'
      )
      
      // Force label
      ctx.fillStyle = '#f97316'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `F = ${forceMag.toFixed(0)} N`,
        this.position.x + this.thrustForce.x * forceScale / 2,
        this.position.y + this.thrustForce.y * forceScale / 2 + 20
      )
    }

    // Draw astronaut
    ctx.font = '40px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🧑‍🚀', this.position.x, this.position.y)

    // Draw mechanical equilibrium indicator
    if (forceMag < 0.1) {
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(this.position.x, this.position.y, 35, 0, 2 * Math.PI)
      ctx.stroke()
      
      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 10px sans-serif'
      ctx.fillText('EQUILIBRIUM', this.position.x, this.position.y - 50)
    }
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

function AstronautThrustContent({
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
  const [thrustMagnitude, setThrustMagnitude] = useState(0) // N
  const [thrustAngle, setThrustAngle] = useState(0) // degrees
  const [initialVelocity, setInitialVelocity] = useState(0) // m/s
  const [velocityAngle, setVelocityAngle] = useState(0) // degrees
  const [kinematicsData, setKinematicsData] = useState<KinematicsData[]>([])
  const [currentData, setCurrentData] = useState<KinematicsData>({
    time: 0,
    positionX: 0,
    positionY: 0,
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
    speed: 0,
    forceX: 0,
    forceY: 0,
    forceMagnitude: 0
  })
  // Use standardized completion tracking
  const completionConfig = getSimulationCriteria('astronaut-thrust')
  const actionLabelsMap = getActionLabels('astronaut-thrust')
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
  const engineRef = useRef<AstronautPhysicsEngine | null>(null)
  const dataCollectionInterval = useRef<NodeJS.Timeout | null>(null)
  const totalSimulationTime = useRef(0)
  const currentValuesRef = useRef({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    force: { x: 0, y: 0 },
    time: 0
  })

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new AstronautPhysicsEngine(
        canvasRef.current,
        (data) => {
          const speed = Math.sqrt(data.velocity.x ** 2 + data.velocity.y ** 2)
          const forceMag = Math.sqrt(data.force.x ** 2 + data.force.y ** 2)
          
          const newData = {
            time: data.time,
            positionX: data.position.x,
            positionY: data.position.y,
            velocityX: data.velocity.x,
            velocityY: data.velocity.y,
            accelerationX: data.acceleration.x,
            accelerationY: data.acceleration.y,
            speed: speed,
            forceX: data.force.x,
            forceY: data.force.y,
            forceMagnitude: forceMag
          }
          
          setCurrentData(newData)
          
          // Update ref for data collection
          currentValuesRef.current = {
            position: data.position,
            velocity: data.velocity,
            acceleration: data.acceleration,
            force: data.force,
            time: data.time
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=astronaut-thrust')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  // Data collection every 0.5 seconds
  useEffect(() => {
    if (isRunning) {
      dataCollectionInterval.current = setInterval(() => {
        const current = currentValuesRef.current
        const speed = Math.sqrt(current.velocity.x ** 2 + current.velocity.y ** 2)
        const forceMag = Math.sqrt(current.force.x ** 2 + current.force.y ** 2)
        
        const newDataPoint: KinematicsData = {
          time: parseFloat(current.time.toFixed(2)),
          positionX: parseFloat(current.position.x.toFixed(2)),
          positionY: parseFloat(current.position.y.toFixed(2)),
          velocityX: parseFloat(current.velocity.x.toFixed(2)),
          velocityY: parseFloat(current.velocity.y.toFixed(2)),
          accelerationX: parseFloat(current.acceleration.x.toFixed(2)),
          accelerationY: parseFloat(current.acceleration.y.toFixed(2)),
          speed: parseFloat(speed.toFixed(2)),
          forceX: parseFloat(current.force.x.toFixed(2)),
          forceY: parseFloat(current.force.y.toFixed(2)),
          forceMagnitude: parseFloat(forceMag.toFixed(2))
        }

        setKinematicsData(prev => [...prev, newDataPoint])
      }, 500) // Collect every 0.5 seconds
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
    handleInteraction(action, data)
    
    // Track with standardized system
    trackInteraction(action, data)
  }, [onInteraction, trackInteraction])
  
    const handleStart = () => {
    if (engineRef.current) {
      // Set initial velocity if specified
      const vx = initialVelocity * Math.cos(velocityAngle * Math.PI / 180)
      const vy = initialVelocity * Math.sin(velocityAngle * Math.PI / 180)
      engineRef.current.setInitialVelocity(vx, vy)
      
      // Set thrust force
      const fx = thrustMagnitude * Math.cos(thrustAngle * Math.PI / 180)
      const fy = thrustMagnitude * Math.sin(thrustAngle * Math.PI / 180)
      engineRef.current.setThrustForce(fx, fy)
      
      engineRef.current.start()
      setIsRunning(true)
      handleInteraction('start', { thrustMagnitude, thrustAngle, initialVelocity, velocityAngle })
    }
  }

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause()
      setIsRunning(false)
      handleInteraction('pause', { time: currentData.time, dataPoints: kinematicsData.length })
      
      // Mark as complete if they collected 10+ data points
      if (kinematicsData.length >= 10) {
        markComplete({}, 100)
        onComplete({
          totalTime: currentData.time,
          dataPoints: kinematicsData.length,
          finalVelocity: currentData.speed,
          maxAcceleration: Math.max(...kinematicsData.map(d => Math.sqrt(d.accelerationX ** 2 + d.accelerationY ** 2)))
        }, 100)
      }
    }
  }

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      setIsRunning(false)
      setKinematicsData([])
      setCurrentData({
        time: 0,
        positionX: 0,
        positionY: 0,
        velocityX: 0,
        velocityY: 0,
        accelerationX: 0,
        accelerationY: 0,
        speed: 0,
        forceX: 0,
        forceY: 0,
        forceMagnitude: 0
      })
      handleInteraction('reset', {})
    }
  }

  const handleExportData = () => {
    const csv = [
      'Time (s),Pos X (m),Pos Y (m),Vel X (m/s),Vel Y (m/s),Speed (m/s),Acc X (m/s²),Acc Y (m/s²),Force X (N),Force Y (N),Force Mag (N)',
      ...kinematicsData.map(d => 
        `${d.time.toFixed(2)},${d.positionX.toFixed(2)},${d.positionY.toFixed(2)},${d.velocityX.toFixed(2)},${d.velocityY.toFixed(2)},${d.speed.toFixed(2)},${d.accelerationX.toFixed(2)},${d.accelerationY.toFixed(2)},${d.forceX.toFixed(2)},${d.forceY.toFixed(2)},${d.forceMagnitude.toFixed(2)}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `astronaut-kinematics-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyForDesmos = () => {
    const speedData = kinematicsData.map(d => `(${d.time.toFixed(2)},${d.speed.toFixed(2)})`).join(',')
    const accelData = kinematicsData.map(d => {
      const aMag = Math.sqrt(d.accelerationX ** 2 + d.accelerationY ** 2)
      return `(${d.time.toFixed(2)},${aMag.toFixed(2)})`
    }).join(',')
    
    const desmosText = `Speed vs Time:\n${speedData}\n\nAcceleration vs Time:\n${accelData}`
    
    navigator.clipboard.writeText(desmosText).then(() => {
      alert('Data copied! Paste into Desmos:\n\n1. Create table for Speed\n2. Create table for Acceleration')
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
            <h1 className="text-3xl font-bold mb-2">Astronaut Thrust: Newton&apos;s Laws in Space</h1>
            <p className="text-muted-foreground">
              Apply thrust vectors to an astronaut and observe Newton&apos;s First and Second Laws
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
        {/* Left Column: Space View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Space Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Space Environment</CardTitle>
              <CardDescription>Watch the astronaut float through space - no friction, no gravity</CardDescription>
            </CardHeader>
            <CardContent>
              <canvas 
                ref={canvasRef}
                className="w-full border-2 border-border rounded-lg"
              />

              {/* Real-time Indicators */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700 font-medium mb-1">Time</div>
                  <div className="text-xl font-bold text-blue-900">{currentData.time.toFixed(1)}s</div>
                </div>
                
                <div className="p-3 bg-cyan-50 rounded-lg">
                  <div className="text-xs text-cyan-700 font-medium mb-1">Speed</div>
                  <div className="text-xl font-bold text-cyan-900">{currentData.speed.toFixed(2)} m/s</div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-700 font-medium mb-1">Acceleration</div>
                  <div className="text-xl font-bold text-purple-900">
                    {Math.sqrt(currentData.accelerationX ** 2 + currentData.accelerationY ** 2).toFixed(2)} m/s²
                  </div>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-700 font-medium mb-1">Force</div>
                  <div className="text-xl font-bold text-orange-900">{currentData.forceMagnitude.toFixed(0)} N</div>
                </div>
              </div>

              {/* Equilibrium Status */}
              <div className="mt-4">
                {currentData.forceMagnitude < 0.1 && !isRunning ? (
                  <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                    <div className="text-sm font-semibold text-green-900">
                      ✓ Mechanical Equilibrium: No net force applied
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      {currentData.speed < 0.1 
                        ? "At rest (Newton's 1st Law: Object at rest stays at rest)"
                        : `Moving at constant velocity (Newton's 1st Law: Object in motion stays in motion)`
                      }
                    </div>
                  </div>
                ) : isRunning && currentData.forceMagnitude > 0 ? (
                  <div className="p-3 bg-orange-50 border-2 border-orange-200 rounded-lg text-center">
                    <div className="text-sm font-semibold text-orange-900">
                      ⚡ Force Applied: Acceleration Active
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      Newton&apos;s 2nd Law: F = ma → a = F/m = {currentData.forceMagnitude.toFixed(0)}/100 = {(currentData.forceMagnitude/100).toFixed(2)} m/s²
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Kinematics Graphs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="velocity" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="velocity">Velocity</TabsTrigger>
                  <TabsTrigger value="acceleration">Acceleration</TabsTrigger>
                  <TabsTrigger value="table">Data Table</TabsTrigger>
                </TabsList>

                {/* Velocity Graph */}
                <TabsContent value="velocity" className="space-y-2">
                  <h4 className="font-semibold text-sm">Speed vs. Time</h4>
                  <div className="h-60 bg-white border rounded-lg p-4 relative">
                    {kinematicsData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Start simulation to generate graph</p>
                        </div>
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
                        <polyline
                          points={kinematicsData.map((d, i) => {
                            const x = (i / Math.max(kinematicsData.length - 1, 1)) * 100
                            const maxSpeed = Math.max(...kinematicsData.map(p => p.speed), 1)
                            const y = 100 - (d.speed / maxSpeed) * 90
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#06b6d4"
                          strokeWidth="1"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                        {kinematicsData.map((d, i) => {
                          const x = (i / Math.max(kinematicsData.length - 1, 1)) * 100
                          const maxSpeed = Math.max(...kinematicsData.map(p => p.speed), 1)
                          const y = 100 - (d.speed / maxSpeed) * 90
                          return <circle key={i} cx={x} cy={y} r="0.8" fill="#06b6d4" vectorEffect="non-scaling-stroke" />
                        })}
                      </svg>
                    )}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
                      Time (s)
                    </div>
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium">
                      Speed (m/s)
                    </div>
                  </div>
                  {kinematicsData.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Max: {Math.max(...kinematicsData.map(d => d.speed)).toFixed(2)} m/s
                    </p>
                  )}
                </TabsContent>

                {/* Acceleration Graph */}
                <TabsContent value="acceleration" className="space-y-2">
                  <h4 className="font-semibold text-sm">Acceleration Magnitude vs. Time</h4>
                  <div className="h-60 bg-white border rounded-lg p-4 relative">
                    {kinematicsData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Start simulation to generate graph</p>
                        </div>
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
                        <polyline
                          points={kinematicsData.map((d, i) => {
                            const x = (i / Math.max(kinematicsData.length - 1, 1)) * 100
                            const aMag = Math.sqrt(d.accelerationX ** 2 + d.accelerationY ** 2)
                            const maxAccel = Math.max(...kinematicsData.map(p => Math.sqrt(p.accelerationX ** 2 + p.accelerationY ** 2)), 1)
                            const y = 100 - (aMag / maxAccel) * 90
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#a855f7"
                          strokeWidth="1"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                        {kinematicsData.map((d, i) => {
                          const x = (i / Math.max(kinematicsData.length - 1, 1)) * 100
                          const aMag = Math.sqrt(d.accelerationX ** 2 + d.accelerationY ** 2)
                          const maxAccel = Math.max(...kinematicsData.map(p => Math.sqrt(p.accelerationX ** 2 + p.accelerationY ** 2)), 1)
                          const y = 100 - (aMag / maxAccel) * 90
                          return <circle key={i} cx={x} cy={y} r="0.8" fill="#a855f7" vectorEffect="non-scaling-stroke" />
                        })}
                      </svg>
                    )}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
                      Time (s)
                    </div>
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium">
                      Acceleration (m/s²)
                    </div>
                  </div>
                  {kinematicsData.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Average: {(kinematicsData.reduce((sum, d) => sum + Math.sqrt(d.accelerationX ** 2 + d.accelerationY ** 2), 0) / kinematicsData.length).toFixed(2)} m/s²
                    </p>
                  )}
                </TabsContent>

                {/* Data Table */}
                <TabsContent value="table" className="space-y-4">
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {kinematicsData.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <TableIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start simulation to collect data</p>
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Time (s)</th>
                            <th className="p-2 text-left">Speed (m/s)</th>
                            <th className="p-2 text-left">Accel (m/s²)</th>
                            <th className="p-2 text-left">Force (N)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kinematicsData.map((d, i) => {
                            const aMag = Math.sqrt(d.accelerationX ** 2 + d.accelerationY ** 2)
                            return (
                              <tr key={i} className="border-t hover:bg-muted/50">
                                <td className="p-2">{d.time.toFixed(2)}</td>
                                <td className="p-2 font-mono text-cyan-700">{d.speed.toFixed(2)}</td>
                                <td className="p-2 font-mono text-purple-700">{aMag.toFixed(2)}</td>
                                <td className="p-2 font-mono text-orange-700">{d.forceMagnitude.toFixed(0)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {kinematicsData.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {kinematicsData.length} data points collected (every 0.5 seconds)
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

        {/* Right Column: Controls */}
        <div className="space-y-6">
          {/* Initial Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Initial Conditions</CardTitle>
              <CardDescription>Set before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Initial Velocity */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Initial Velocity</label>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Magnitude</span>
                    <span className="text-xs font-mono">{initialVelocity.toFixed(1)} m/s</span>
                  </div>
                  <Slider
                    value={[initialVelocity]}
                    onValueChange={([value]) => setInitialVelocity(value)}
                    min={0}
                    max={10}
                    step={0.5}
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Direction</span>
                    <span className="text-xs font-mono">{velocityAngle.toFixed(0)}°</span>
                  </div>
                  <Slider
                    value={[velocityAngle]}
                    onValueChange={([value]) => setVelocityAngle(value)}
                    min={0}
                    max={360}
                    step={15}
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Thrust Force */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Thrust Force</label>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Magnitude</span>
                    <span className="text-xs font-mono">{thrustMagnitude.toFixed(0)} N</span>
                  </div>
                  <Slider
                    value={[thrustMagnitude]}
                    onValueChange={([value]) => {
                      setThrustMagnitude(value)
                      if (isRunning && engineRef.current) {
                        const fx = value * Math.cos(thrustAngle * Math.PI / 180)
                        const fy = value * Math.sin(thrustAngle * Math.PI / 180)
                        engineRef.current.setThrustForce(fx, fy)
                        handleInteraction('adjust-thrust', { magnitude: value, angle: thrustAngle })
                      }
                    }}
                    min={0}
                    max={500}
                    step={10}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Direction</span>
                    <span className="text-xs font-mono">{thrustAngle.toFixed(0)}°</span>
                  </div>
                  <Slider
                    value={[thrustAngle]}
                    onValueChange={([value]) => {
                      setThrustAngle(value)
                      if (isRunning && engineRef.current) {
                        const fx = thrustMagnitude * Math.cos(value * Math.PI / 180)
                        const fy = thrustMagnitude * Math.sin(value * Math.PI / 180)
                        engineRef.current.setThrustForce(fx, fy)
                        handleInteraction('adjust-angle', { magnitude: thrustMagnitude, angle: value })
                      }
                    }}
                    min={0}
                    max={360}
                    step={15}
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
                      Start Simulation
                    </>
                  )}
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

          {/* Newton's Laws */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">⚖️ Newton&apos;s Laws</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded-lg border-2 border-green-200">
                <div className="font-semibold text-green-900 mb-1">First Law (Inertia)</div>
                <p className="text-xs text-green-800">
                  An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by a net force.
                </p>
                <div className="mt-2 text-xs text-green-700 font-mono bg-green-50 p-2 rounded">
                  If F<sub>net</sub> = 0 → v = constant
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-orange-200">
                <div className="font-semibold text-orange-900 mb-1">Second Law (F = ma)</div>
                <p className="text-xs text-orange-800">
                  The acceleration of an object is directly proportional to the net force and inversely proportional to its mass.
                </p>
                <div className="mt-2 text-xs text-orange-700 font-mono bg-orange-50 p-2 rounded text-center">
                  F = ma → a = F/m
                </div>
                {thrustMagnitude > 0 && (
                  <div className="mt-1 text-xs text-orange-700 text-center">
                    a = {thrustMagnitude.toFixed(0)}N / 100kg = {(thrustMagnitude/100).toFixed(2)} m/s²
                  </div>
                )}
              </div>

              <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900">
                <strong>💡 Space Physics:</strong> No friction or gravity means forces cause permanent acceleration!
              </div>
            </CardContent>
          </Card>

          {/* Learning Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Learning Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-1">🎯 Try This:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside text-xs">
                  <li>Zero thrust: Watch equilibrium (constant velocity)</li>
                  <li>Apply 200N thrust: See acceleration begin</li>
                  <li>Change angle while running: Observe curved path</li>
                  <li>Compare speed graph with/without thrust</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">📊 Observations:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside text-xs">
                  <li>No thrust (F=0) → acceleration = 0 → velocity constant</li>
                  <li>Constant thrust → constant acceleration</li>
                  <li>Speed increases linearly with constant force</li>
                  <li>Changing thrust direction curves the path</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="astronaut-thrust"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={completionState.isCompleted}
          simulationData={{
            dataPoints: kinematicsData,
            maxSpeed: Math.max(...kinematicsData.map(d => d.speed), 0),
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
          simulationSlug="astronaut-thrust"
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
export default function AstronautThrustSimulation() {
  return (
    <SimulationWrapper
      simulationSlug="astronaut-thrust"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <AstronautThrustContent {...props} />}
    </SimulationWrapper>
  )
}

