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
  Plus,
  Settings,
  FileText,
  Target,
  Crosshair
} from 'lucide-react'

interface TrajectoryData {
  time: number
  dartX: number
  dartY: number
  monkeyX: number
  monkeyY: number
  dartVx: number
  dartVy: number
  monkeyVy: number
}

interface Vector2D {
  x: number
  y: number
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

const GRAVITY = 9.8 // m/s²

class MonkeyHunterEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  // Monkey initial position (hanging from tree)
  private monkeyX0: number = 15 // meters from left
  private monkeyY0: number = 12 // meters from ground
  
  // Hunter position (on ground)
  private hunterX: number = 2 // meters from left
  private hunterY: number = 0 // meters (ground level)
  
  // Dart state
  private dartX: number = 2
  private dartY: number = 0
  private dartVx: number = 0
  private dartVy: number = 0
  
  // Monkey state
  private monkeyX: number = 15
  private monkeyY: number = 12
  private monkeyVy: number = 0 // Falls when dart is fired
  
  // Dart launch parameters
  private launchSpeed: number = 20 // m/s
  private aimAtMonkey: boolean = true // Aim directly at monkey or above
  
  private animationId: number | null = null
  private lastTime: number = 0
  private isRunning: boolean = false
  private time: number = 0
  private pixelsPerMeter: number = 30
  private hasHit: boolean = false
  private hitTime: number = 0
  private trajectory: Vector2D[] = []
  
  private onUpdate: (data: {
    dartX: number
    dartY: number
    monkeyX: number
    monkeyY: number
    time: number
    hit: boolean
    hitTime: number
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
      this.canvas.height = 450
      this.pixelsPerMeter = Math.min(this.canvas.width / 20, this.canvas.height / 15)
    }
  }

  public setMonkeyPosition(x: number, y: number) {
    this.monkeyX0 = x
    this.monkeyY0 = y
    this.monkeyX = x
    this.monkeyY = y
  }

  public setLaunchSpeed(speed: number) {
    this.launchSpeed = speed
  }

  public setAimMode(aimAtMonkey: boolean) {
    this.aimAtMonkey = aimAtMonkey
  }

  public start() {
    if (!this.isRunning) {
      // Calculate launch angle and velocity components
      const dx = this.monkeyX0 - this.hunterX
      const dy = this.monkeyY0 - this.hunterY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)
      
      // Launch velocity components
      this.dartVx = this.launchSpeed * Math.cos(angle)
      this.dartVy = this.launchSpeed * Math.sin(angle)
      
      // If aiming above monkey (to compensate for drop), add extra vertical velocity
      if (!this.aimAtMonkey) {
        // Calculate extra angle needed
        const timeToTarget = dx / this.dartVx
        const dropDuringFlight = 0.5 * GRAVITY * timeToTarget * timeToTarget
        this.dartVy += (dropDuringFlight + dy) / timeToTarget - this.dartVy
      }
      
      // Reset positions
      this.dartX = this.hunterX
      this.dartY = this.hunterY
      this.monkeyX = this.monkeyX0
      this.monkeyY = this.monkeyY0
      this.monkeyVy = 0
      
      this.trajectory = []
      this.hasHit = false
      this.hitTime = 0
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
    this.dartX = this.hunterX
    this.dartY = this.hunterY
    this.monkeyX = this.monkeyX0
    this.monkeyY = this.monkeyY0
    this.monkeyVy = 0
    this.time = 0
    this.hasHit = false
    this.trajectory = []
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
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.02)
    this.lastTime = currentTime

    if (!this.hasHit) {
      // Update dart position (projectile motion)
      this.dartVy -= GRAVITY * dt // Gravity affects vertical component
      this.dartX += this.dartVx * dt
      this.dartY += this.dartVy * dt
      
      // Update monkey position (free fall - drops when dart is fired!)
      this.monkeyVy += GRAVITY * dt // Gravity pulls monkey down
      this.monkeyY -= this.monkeyVy * dt // Negative because y increases upward
      
      // Record trajectory
      if (this.time % 0.05 < dt) {
        this.trajectory.push({ x: this.dartX, y: this.dartY })
      }
      
      // Check for hit (collision detection)
      const distance = Math.sqrt(
        Math.pow(this.dartX - this.monkeyX, 2) + 
        Math.pow(this.dartY - this.monkeyY, 2)
      )
      
      if (distance < 0.3) {
        this.hasHit = true
        this.hitTime = this.time
        this.pause()
      }
      
      // Check if dart hit ground
      if (this.dartY < 0) {
        this.pause()
      }
      
      // Check if monkey hit ground
      if (this.monkeyY < 0) {
        this.monkeyY = 0
        this.monkeyVy = 0
      }
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
      dartX: this.dartX,
      dartY: this.dartY,
      monkeyX: this.monkeyX,
      monkeyY: this.monkeyY,
      time: this.time,
      hit: this.hasHit,
      hitTime: this.hitTime
    })
  }

  private render() {
    const ctx = this.ctx

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw classroom background
    ctx.fillStyle = '#f5f5f0'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw coordinate grid system
    const originX = 80 // Origin x position in pixels
    const originY = this.canvas.height - 80 // Origin y position (bottom with margin)
    
    // Grid lines
    ctx.strokeStyle = '#e5e5e0'
    ctx.lineWidth = 1
    
    // Vertical grid lines (every meter)
    for (let x = 0; x <= 20; x++) {
      const screenX = originX + x * this.pixelsPerMeter
      if (screenX <= this.canvas.width) {
        ctx.beginPath()
        ctx.moveTo(screenX, 20)
        ctx.lineTo(screenX, originY)
        ctx.stroke()
      }
    }
    
    // Horizontal grid lines (every meter)
    for (let y = 0; y <= 15; y++) {
      const screenY = originY - y * this.pixelsPerMeter
      if (screenY >= 20) {
        ctx.beginPath()
        ctx.moveTo(originX, screenY)
        ctx.lineTo(this.canvas.width - 20, screenY)
        ctx.stroke()
      }
    }

    // Draw coordinate axes (thicker)
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 3
    
    // X-axis
    ctx.beginPath()
    ctx.moveTo(originX, originY)
    ctx.lineTo(this.canvas.width - 20, originY)
    ctx.stroke()
    
    // X-axis arrow
    ctx.fillStyle = '#374151'
    ctx.beginPath()
    ctx.moveTo(this.canvas.width - 20, originY)
    ctx.lineTo(this.canvas.width - 30, originY - 5)
    ctx.lineTo(this.canvas.width - 30, originY + 5)
    ctx.closePath()
    ctx.fill()
    
    // Y-axis
    ctx.beginPath()
    ctx.moveTo(originX, originY)
    ctx.lineTo(originX, 20)
    ctx.stroke()
    
    // Y-axis arrow
    ctx.beginPath()
    ctx.moveTo(originX, 20)
    ctx.lineTo(originX - 5, 30)
    ctx.lineTo(originX + 5, 30)
    ctx.closePath()
    ctx.fill()

    // Axis labels
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('x (meters)', this.canvas.width - 50, originY + 25)
    ctx.textAlign = 'right'
    ctx.fillText('y (meters)', originX - 10, 15)

    // Draw axis tick marks and labels
    ctx.font = '11px sans-serif'
    ctx.fillStyle = '#6b7280'
    
    // X-axis ticks
    for (let x = 0; x <= 20; x += 2) {
      const screenX = originX + x * this.pixelsPerMeter
      if (screenX <= this.canvas.width - 30) {
        ctx.beginPath()
        ctx.moveTo(screenX, originY)
        ctx.lineTo(screenX, originY + 6)
        ctx.stroke()
        ctx.textAlign = 'center'
        ctx.fillText(x.toString(), screenX, originY + 18)
      }
    }
    
    // Y-axis ticks
    for (let y = 0; y <= 14; y += 2) {
      const screenY = originY - y * this.pixelsPerMeter
      if (screenY >= 30) {
        ctx.beginPath()
        ctx.moveTo(originX, screenY)
        ctx.lineTo(originX - 6, screenY)
        ctx.stroke()
        ctx.textAlign = 'right'
        ctx.fillText(y.toString(), originX - 10, screenY + 4)
      }
    }

    // Draw ceiling (where monkey hangs from)
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(0, 0, this.canvas.width, 20)
    ctx.fillStyle = '#9ca3af'
    ctx.fillRect(0, 18, this.canvas.width, 4)

    // Draw desk (where hunter stands)
    const deskHeight = 30
    ctx.fillStyle = '#92400e'
    ctx.fillRect(originX - 40, originY - deskHeight, 80, deskHeight)
    
    // Desk top highlight
    ctx.fillStyle = '#b45309'
    ctx.fillRect(originX - 40, originY - deskHeight, 80, 3)

    // Convert physics coordinates to screen coordinates (using originX and originY already defined above)
    const monkeyScreenX = originX + this.monkeyX * this.pixelsPerMeter
    const monkeyScreenY = originY - this.monkeyY * this.pixelsPerMeter
    
    const dartScreenX = originX + this.dartX * this.pixelsPerMeter
    const dartScreenY = originY - this.dartY * this.pixelsPerMeter
    
    const hunterScreenX = originX + this.hunterX * this.pixelsPerMeter
    const hunterScreenY = originY - this.hunterY * this.pixelsPerMeter

    // Draw monkey hanging from ceiling
    ctx.font = '35px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🐵', monkeyScreenX, monkeyScreenY)
    
    // Draw string from ceiling if monkey hasn't started falling
    if (this.time === 0 || !this.isRunning) {
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 2
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(monkeyScreenX, 20)
      ctx.lineTo(monkeyScreenX, monkeyScreenY - 18)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw aiming line (before shot)
    if (!this.isRunning && this.time === 0) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(hunterScreenX, hunterScreenY)
      ctx.lineTo(monkeyScreenX, monkeyScreenY)
      ctx.stroke()
      ctx.setLineDash([])
      
      // Crosshair on monkey
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(monkeyScreenX, monkeyScreenY, 22, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(monkeyScreenX - 25, monkeyScreenY)
      ctx.lineTo(monkeyScreenX + 25, monkeyScreenY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(monkeyScreenX, monkeyScreenY - 25)
      ctx.lineTo(monkeyScreenX, monkeyScreenY + 25)
      ctx.stroke()
      
      // Aim line label
      const midX = (hunterScreenX + monkeyScreenX) / 2
      const midY = (hunterScreenY + monkeyScreenY) / 2
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText('AIM LINE', midX, midY - 8)
    }

    // Draw dart trajectory path (using originX and originY already defined)
    if (this.trajectory.length > 1) {
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(
        originX + this.trajectory[0].x * this.pixelsPerMeter,
        originY - this.trajectory[0].y * this.pixelsPerMeter
      )
      for (let i = 1; i < this.trajectory.length; i++) {
        ctx.lineTo(
          originX + this.trajectory[i].x * this.pixelsPerMeter,
          originY - this.trajectory[i].y * this.pixelsPerMeter
        )
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw dart
    if (this.isRunning || this.time > 0) {
      ctx.save()
      ctx.translate(dartScreenX, dartScreenY)
      
      // Rotate dart to face direction of motion
      const dartAngle = Math.atan2(-this.dartVy, this.dartVx)
      ctx.rotate(dartAngle)
      
      // Dart shape (larger, more visible)
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.moveTo(15, 0)
      ctx.lineTo(-12, -4)
      ctx.lineTo(-12, 4)
      ctx.closePath()
      ctx.fill()
      
      // Dart tip
      ctx.fillStyle = '#7c2d12'
      ctx.beginPath()
      ctx.moveTo(15, 0)
      ctx.lineTo(18, -3)
      ctx.lineTo(18, 3)
      ctx.closePath()
      ctx.fill()
      
      // Dart fins
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(-12, -4)
      ctx.lineTo(-16, -6)
      ctx.lineTo(-12, -2)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(-12, 4)
      ctx.lineTo(-16, 6)
      ctx.lineTo(-12, 2)
      ctx.closePath()
      ctx.fill()
      
      ctx.restore()
    }

    // Draw hunter on desk (scientist/teacher with dart gun)
    ctx.font = '40px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🧑‍🔬', hunterScreenX, hunterScreenY - 35)
    
    // Draw dart gun (before firing)
    if (!this.isRunning && this.time === 0) {
      ctx.save()
      ctx.translate(hunterScreenX + 15, hunterScreenY - 25)
      const gunAngle = Math.atan2(this.monkeyY0, this.monkeyX0 - this.hunterX)
      ctx.rotate(gunAngle)
      
      ctx.fillStyle = '#475569'
      ctx.fillRect(0, -3, 25, 6)
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(25, -2, 5, 4)
      
      ctx.restore()
    }

    // Draw position labels for dart and monkey (on grid)
    if (this.isRunning || this.time > 0) {
      // Dart position coordinates
      ctx.fillStyle = '#f97316'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(
        `Dart: (${this.dartX.toFixed(1)}, ${this.dartY.toFixed(1)})`,
        dartScreenX + 20,
        dartScreenY - 10
      )
      
      // Monkey position coordinates
      ctx.fillStyle = '#8b5cf6'
      ctx.textAlign = 'left'
      ctx.fillText(
        `Monkey: (${this.monkeyX.toFixed(1)}, ${this.monkeyY.toFixed(1)})`,
        monkeyScreenX + 20,
        monkeyScreenY + 5
      )
    }

    // Draw hit indicator
    if (this.hasHit) {
      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🎯 DIRECT HIT!', this.canvas.width / 2, 50)
      ctx.font = '14px sans-serif'
      ctx.fillText(`Collision at t = ${this.hitTime.toFixed(2)}s`, this.canvas.width / 2, 80)
      
      // Explosion effect at collision point
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)'
      ctx.beginPath()
      ctx.arc(monkeyScreenX, monkeyScreenY, 35, 0, 2 * Math.PI)
      ctx.fill()
      
      // Star burst
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(
          monkeyScreenX + Math.cos(angle) * 40,
          monkeyScreenY + Math.sin(angle) * 40,
          4,
          0,
          2 * Math.PI
        )
        ctx.fill()
      }
    }

    // Draw coordinate labels at collision point
    if (this.hasHit) {
      const hitX = this.dartX
      const hitY = this.dartY
      
      ctx.fillStyle = '#8b5cf6'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `Hit: (${hitX.toFixed(1)}m, ${hitY.toFixed(1)}m)`,
        monkeyScreenX,
        monkeyScreenY - 35
      )
    }
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function MonkeyHunterContent({
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
  const [monkeyHeight, setMonkeyHeight] = useState(12) // meters
  const [monkeyDistance, setMonkeyDistance] = useState(13) // meters from hunter
  const [dartSpeed, setDartSpeed] = useState(20) // m/s
  const [aimAtMonkey, setAimAtMonkey] = useState(true) // true = direct aim, false = compensate
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryData[]>([])
  const [currentData, setCurrentData] = useState({
    time: 0,
    dartX: 2,
    dartY: 0,
    monkeyX: 15,
    monkeyY: 12,
    hit: false,
    hitTime: 0
  })
  const [simulationCompleted, setSimulationCompleted] = useState(false)

  // Assignment state
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [editingAssignment, setEditingAssignment] = useState<any>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<MonkeyHunterEngine | null>(null)
  const dataCollectionInterval = useRef<NodeJS.Timeout | null>(null)
  const totalSimulationTime = useRef(0)
  const currentValuesRef = useRef({
    time: 0,
    dartX: 0,
    dartY: 0,
    dartVx: 0,
    dartVy: 0,
    monkeyX: 0,
    monkeyY: 0,
    monkeyVy: 0
  })

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new MonkeyHunterEngine(
        canvasRef.current,
        (data) => {
          setCurrentData(data)
          
          if (data.hit && !simulationCompleted) {
            setSimulationCompleted(true)
            onComplete({
              hit: true,
              hitTime: data.hitTime,
              aimMode: aimAtMonkey ? 'direct' : 'compensated',
              dataPoints: trajectoryData.length
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=monkey-hunter')
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

  const handleStart = () => {
    if (engineRef.current) {
      engineRef.current.setMonkeyPosition(2 + monkeyDistance, monkeyHeight)
      engineRef.current.setLaunchSpeed(dartSpeed)
      engineRef.current.setAimMode(aimAtMonkey)
      engineRef.current.start()
      setIsRunning(true)
      onInteraction('fire', { monkeyHeight, monkeyDistance, dartSpeed, aimMode: aimAtMonkey })
    }
  }

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause()
      setIsRunning(false)
      onInteraction('pause', { time: currentData.time })
    }
  }

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      setIsRunning(false)
      setTrajectoryData([])
      setSimulationCompleted(false)
      onInteraction('reset', {})
    }
  }

  // Calculate theoretical hit time
  const calculateHitTime = () => {
    const dx = monkeyDistance
    const dy = monkeyHeight
    const angle = Math.atan2(dy, dx)
    const vx = dartSpeed * Math.cos(angle)
    
    if (vx > 0) {
      return dx / vx
    }
    return null
  }

  const predictedHitTime = calculateHitTime()

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
            <h1 className="text-3xl font-bold mb-2">Monkey Hunter: Projectile Motion</h1>
            <p className="text-muted-foreground">
              A classroom demonstration on a coordinate grid - watch projectile motion and free fall interact!
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scene */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Scene */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">The Monkey Hunter Problem</CardTitle>
              <CardDescription>
                A monkey hangs from the classroom ceiling. Aim your dart gun and fire - the monkey drops at that instant!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas 
                ref={canvasRef}
                className="w-full border-2 border-border rounded-lg"
              />

              {/* Status Display */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700 font-medium mb-1">Time</div>
                  <div className="text-xl font-bold text-blue-900">{currentData.time.toFixed(2)}s</div>
                </div>
                
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-700 font-medium mb-1">Dart Height</div>
                  <div className="text-lg font-mono text-orange-900">{currentData.dartY.toFixed(1)}m</div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-700 font-medium mb-1">Monkey Height</div>
                  <div className="text-lg font-mono text-green-900">{currentData.monkeyY.toFixed(1)}m</div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-700 font-medium mb-1">Status</div>
                  <div className="text-sm font-bold text-purple-900">
                    {currentData.hit ? '🎯 HIT!' : isRunning ? '🏹 Flying...' : 'Ready'}
                  </div>
                </div>
              </div>

              {/* Hit Message */}
              {currentData.hit && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="text-lg font-bold text-green-900 mb-2">
                    🎯 Direct Hit!
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                    <div><strong>Hit Time:</strong> {currentData.hitTime.toFixed(2)}s</div>
                    <div><strong>Predicted:</strong> {predictedHitTime?.toFixed(2)}s</div>
                  </div>
                  <div className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded">
                    <strong>Why it works:</strong> Both dart and monkey fall at the same rate (g = 9.8 m/s²), so gravity "cancels out" and the dart follows the original aim line!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* The Physics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔬 The Physics Explained</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Why Does the Dart Hit?</h4>
                <p className="text-xs text-blue-800 mb-2">
                  Both the dart and monkey are affected by gravity equally!
                </p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li><strong>Dart:</strong> Horizontal motion (constant) + vertical fall (accelerated)</li>
                  <li><strong>Monkey:</strong> No horizontal motion + vertical fall (accelerated)</li>
                  <li><strong>Key:</strong> Both fall at g = 9.8 m/s² - the same rate!</li>
                  <li><strong>Result:</strong> Dart drops same amount as monkey, so aim is still true</li>
                </ul>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">The Equations</h4>
                <div className="text-xs space-y-2">
                  <div>
                    <strong>Dart (Projectile Motion):</strong>
                    <div className="font-mono bg-purple-100 p-2 rounded mt-1">
                      x<sub>dart</sub> = x₀ + v<sub>x</sub>t<br/>
                      y<sub>dart</sub> = y₀ + v<sub>y</sub>t - ½gt²
                    </div>
                  </div>
                  <div>
                    <strong>Monkey (Free Fall):</strong>
                    <div className="font-mono bg-purple-100 p-2 rounded mt-1">
                      x<sub>monkey</sub> = x₀ (no horizontal motion)<br/>
                      y<sub>monkey</sub> = y₀ - ½gt²
                    </div>
                  </div>
                  <div className="text-purple-800 font-semibold">
                    Notice: Both have the same "-½gt²" term!
                  </div>
                </div>
              </div>

              <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900">
                <strong>💡 Fun Fact:</strong> This works no matter what speed you fire - as long as you aim directly at the monkey!
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          {/* Setup Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setup</CardTitle>
              <CardDescription>Adjust before firing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Monkey Height */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Monkey Height</label>
                  <span className="text-sm text-muted-foreground">{monkeyHeight.toFixed(1)} m</span>
                </div>
                <Slider
                  value={[monkeyHeight]}
                  onValueChange={([value]) => setMonkeyHeight(value)}
                  min={5}
                  max={14}
                  step={0.5}
                  disabled={isRunning}
                />
              </div>

              {/* Horizontal Distance */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Horizontal Distance</label>
                  <span className="text-sm text-muted-foreground">{monkeyDistance.toFixed(1)} m</span>
                </div>
                <Slider
                  value={[monkeyDistance]}
                  onValueChange={([value]) => setMonkeyDistance(value)}
                  min={8}
                  max={18}
                  step={0.5}
                  disabled={isRunning}
                />
              </div>

              {/* Dart Speed */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Dart Launch Speed</label>
                  <span className="text-sm text-muted-foreground">{dartSpeed.toFixed(0)} m/s</span>
                </div>
                <Slider
                  value={[dartSpeed]}
                  onValueChange={([value]) => setDartSpeed(value)}
                  min={10}
                  max={30}
                  step={1}
                  disabled={isRunning}
                />
              </div>

              {/* Aim Mode */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Aiming Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={aimAtMonkey ? "default" : "outline"}
                    onClick={() => setAimAtMonkey(true)}
                    disabled={isRunning}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    At Monkey
                  </Button>
                  <Button
                    size="sm"
                    variant={!aimAtMonkey ? "default" : "outline"}
                    onClick={() => setAimAtMonkey(false)}
                    disabled={isRunning}
                  >
                    <Crosshair className="h-3 w-3 mr-1" />
                    Above (Compensate)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {aimAtMonkey 
                    ? "Aim directly at monkey (will still hit!)"
                    : "Aim above to compensate for drop (will miss!)"
                  }
                </p>
              </div>

              {/* Control Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <Button 
                  onClick={handleStart}
                  className="w-full"
                  disabled={isRunning}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Fire Dart
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

          {/* Predictions */}
          {predictedHitTime && (
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-lg text-green-900">📐 Predictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 bg-white rounded-lg">
                  <div className="text-xs text-green-700 mb-1">Predicted Hit Time</div>
                  <div className="text-2xl font-bold text-green-900">
                    {predictedHitTime.toFixed(2)}s
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Time = distance / horizontal velocity
                  </div>
                </div>

                <div className="p-2 bg-blue-50 rounded text-xs text-blue-800">
                  <strong>Calculate:</strong> t = {monkeyDistance.toFixed(1)}m / ({dartSpeed} × cos(θ)) ≈ {predictedHitTime.toFixed(2)}s
                </div>
              </CardContent>
            </Card>
          )}

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
                <li><strong>Aim at monkey:</strong> Watch it drop - dart still hits!</li>
                <li><strong>Vary height:</strong> Try different monkey heights - still hits</li>
                <li><strong>Vary distance:</strong> Change horizontal distance - still hits</li>
                <li><strong>Vary speed:</strong> Faster or slower dart - still hits!</li>
                <li><strong>Aim above:</strong> Try compensating for drop - you'll miss!</li>
                <li><strong>Why?</strong> Both fall at g = 9.8 m/s² - gravity affects both equally!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="monkey-hunter"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={simulationCompleted}
          simulationData={{
            hit: currentData.hit,
            hitTime: currentData.hitTime,
            aimMode: aimAtMonkey
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
          simulationSlug="monkey-hunter"
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
export default function MonkeyHunterSimulation() {
  return (
    <SimulationWrapper
      simulationSlug="monkey-hunter"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <MonkeyHunterContent {...props} />}
    </SimulationWrapper>
  )
}

