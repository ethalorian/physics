"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
import { QuickAssignButton } from '@/components/simulations/QuickAssignButton'
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
  FileText
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface DataPoint {
  time: number
  x: number
  y: number
  vx: number
  vy: number
  speed: number
}

interface SimulationState {
  x: number
  y: number
  vx: number
  vy: number
  time: number
  isFlying: boolean
}

interface Target {
  x: number
  y: number
  width: number
  height: number
  hit: boolean
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

const GRAVITY = 9.8 // m/s²

class ProjectileSimulation {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private state: SimulationState
  private trajectory: { x: number; y: number }[]
  private dataPoints: DataPoint[]
  private isRunning: boolean
  private animationId: number | null = null
  private lastTime: number = 0
  private lastDataTime: number = 0
  private lastTrajectoryTime: number = 0
  private launchAngle: number = 45
  private launchHeight: number = 0
  private targets: Target[] = []
  private draggingTarget: number | null = null
  private hits: number = 0
  private misses: number = 0
  private onUpdate: (state: SimulationState, data: DataPoint[], trajectory: { x: number; y: number }[], hits: number, misses: number) => void

  constructor(canvas: HTMLCanvasElement, onUpdate: (state: SimulationState, data: DataPoint[], trajectory: { x: number; y: number }[], hits: number, misses: number) => void) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.onUpdate = onUpdate
    this.state = { x: 0, y: 0, vx: 0, vy: 0, time: 0, isFlying: false }
    this.trajectory = []
    this.dataPoints = []
    this.isRunning = false
    
    // Initialize targets
    this.targets = [
      { x: 30, y: 0, width: 3, height: 6, hit: false },
      { x: 50, y: 0, width: 3, height: 8, hit: false },
      { x: 70, y: 0, width: 3, height: 10, hit: false }
    ]
    
    this.resizeCanvas()
    this.setupMouseEvents()
    window.addEventListener('resize', () => this.resizeCanvas())
  }

  private setupMouseEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e))
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp())
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp())
  }

  private getMousePos(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  private worldToScreen(x: number, y: number) {
    const w = this.canvas.width / window.devicePixelRatio
    const h = this.canvas.height / window.devicePixelRatio
    const maxX = Math.max(...this.trajectory.map(p => p.x), this.state.x, ...this.targets.map(t => t.x + t.width), 50, 1)
    const maxY = Math.max(...this.trajectory.map(p => p.y), this.state.y, ...this.targets.map(t => t.height), 20, 1)
    const scaleX = (w * 0.9) / maxX
    const scaleY = (h * 0.9) / maxY
    const offsetX = w * 0.05
    const offsetY = h * 0.05
    return {
      x: offsetX + x * scaleX,
      y: h - offsetY - y * scaleY,
      scaleX,
      scaleY
    }
  }

  private screenToWorld(screenX: number, screenY: number) {
    const w = this.canvas.width / window.devicePixelRatio
    const h = this.canvas.height / window.devicePixelRatio
    const maxX = Math.max(...this.trajectory.map(p => p.x), this.state.x, ...this.targets.map(t => t.x + t.width), 50, 1)
    const maxY = Math.max(...this.trajectory.map(p => p.y), this.state.y, ...this.targets.map(t => t.height), 20, 1)
    const scaleX = (w * 0.9) / maxX
    const scaleY = (h * 0.9) / maxY
    const offsetX = w * 0.05
    const offsetY = h * 0.05
    return {
      x: (screenX - offsetX) / scaleX,
      y: (h - offsetY - screenY) / scaleY
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.isRunning) return
    
    const pos = this.getMousePos(e)
    const world = this.screenToWorld(pos.x, pos.y)
    
    // Check if clicking on a target
    this.targets.forEach((target, i) => {
      if (world.x >= target.x && world.x <= target.x + target.width &&
          world.y >= 0 && world.y <= target.height) {
        this.draggingTarget = i
      }
    })
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.draggingTarget === null || this.isRunning) return
    
    const pos = this.getMousePos(e)
    const world = this.screenToWorld(pos.x, pos.y)
    
    // Update target position
    this.targets[this.draggingTarget].x = Math.max(10, Math.min(world.x, 100))
    this.targets[this.draggingTarget].hit = false
    this.render()
  }

  private handleMouseUp() {
    this.draggingTarget = null
  }

  private resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * window.devicePixelRatio
    this.canvas.height = rect.height * window.devicePixelRatio
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    this.render()
  }

  launch(speed: number, angle: number, height: number) {
    const angleRad = (angle * Math.PI) / 180
    this.launchAngle = angle
    this.launchHeight = height
    this.state = {
      x: 0,
      y: height,
      vx: speed * Math.cos(angleRad),
      vy: speed * Math.sin(angleRad),
      time: 0,
      isFlying: true
    }
    this.trajectory = [{ x: 0, y: height }]
    this.dataPoints = [{
      time: 0,
      x: 0,
      y: height,
      vx: this.state.vx,
      vy: this.state.vy,
      speed: speed
    }]
    this.lastTime = performance.now()
    this.lastDataTime = 0
    this.lastTrajectoryTime = 0
    
    // Reset target hit states
    this.targets.forEach(t => t.hit = false)
    
    this.isRunning = true
    this.animate()
  }

  pause() {
    this.isRunning = false
  }

  resume() {
    if (this.state.isFlying && !this.isRunning) {
      this.isRunning = true
      this.lastTime = performance.now()
      this.animate()
    }
  }

  reset() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.state = { x: 0, y: 0, vx: 0, vy: 0, time: 0, isFlying: false }
    this.trajectory = []
    this.dataPoints = []
    this.targets.forEach(t => t.hit = false)
    this.render()
    this.onUpdate(this.state, this.dataPoints, this.trajectory, this.hits, this.misses)
  }

  resetScore() {
    this.hits = 0
    this.misses = 0
  }

  private animate() {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) // Cap at 0.1s
    this.lastTime = currentTime

    if (this.state.isFlying) {
      // Update physics
      this.state.vy -= GRAVITY * deltaTime
      this.state.x += this.state.vx * deltaTime
      this.state.y += this.state.vy * deltaTime
      this.state.time += deltaTime

      // Check target collisions
      this.targets.forEach(target => {
        if (!target.hit &&
            this.state.x >= target.x && 
            this.state.x <= target.x + target.width &&
            this.state.y <= target.height && 
            this.state.y >= 0) {
          target.hit = true
          this.hits++
        }
      })

      // Check landing
      if (this.state.y <= 0) {
        this.state.y = 0
        this.state.vy = 0
        this.state.isFlying = false
        this.isRunning = false
        this.trajectory.push({ x: this.state.x, y: 0 })
        
        // Check if missed all targets
        if (!this.targets.some(t => t.hit)) {
          this.misses++
        }
      }

      // Record trajectory
      if (this.state.isFlying && this.state.time - this.lastTrajectoryTime >= 0.05) {
        this.trajectory.push({ x: this.state.x, y: this.state.y })
        this.lastTrajectoryTime = this.state.time
      }

      // Record data
      if (this.state.time - this.lastDataTime >= 0.1) {
        const speed = Math.sqrt(this.state.vx ** 2 + this.state.vy ** 2)
        this.dataPoints.push({
          time: this.state.time,
          x: this.state.x,
          y: this.state.y,
          vx: this.state.vx,
          vy: this.state.vy,
          speed: speed
        })
        this.lastDataTime = this.state.time
      }

      this.onUpdate(this.state, this.dataPoints, this.trajectory, this.hits, this.misses)
    }

    this.render()

    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.animate())
    }
  }

  private render() {
    const w = this.canvas.width / window.devicePixelRatio
    const h = this.canvas.height / window.devicePixelRatio
    
    // Clear
    this.ctx.clearRect(0, 0, w, h)

    // Calculate scale
    const maxX = Math.max(...this.trajectory.map(p => p.x), this.state.x, ...this.targets.map(t => t.x + t.width), 50, 1)
    const maxY = Math.max(...this.trajectory.map(p => p.y), this.state.y, ...this.targets.map(t => t.height), 20, 1)
    const scaleX = (w * 0.9) / maxX
    const scaleY = (h * 0.9) / maxY
    const offsetX = w * 0.05
    const offsetY = h * 0.05

    // Background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, '#e0f2fe')
    gradient.addColorStop(1, '#dcfce7')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, w, h)

    // Grid
    this.ctx.strokeStyle = '#e5e7eb'
    this.ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = offsetX + (w * 0.9 * i / 10)
      const y = offsetY + (h * 0.9 * i / 10)
      this.ctx.beginPath()
      this.ctx.moveTo(x, offsetY)
      this.ctx.lineTo(x, h - offsetY)
      this.ctx.stroke()
      this.ctx.beginPath()
      this.ctx.moveTo(offsetX, y)
      this.ctx.lineTo(w - offsetX, y)
      this.ctx.stroke()
    }

    // Ground
    this.ctx.fillStyle = '#16a34a'
    this.ctx.fillRect(0, h - offsetY, w, offsetY)

    // Targets
    this.targets.forEach(target => {
      const tx = offsetX + target.x * scaleX
      const ty = h - offsetY - target.height * scaleY
      const tw = target.width * scaleX
      const th = target.height * scaleY
      
      // Target bullseye
      if (target.hit) {
        this.ctx.fillStyle = '#22c55e'
        this.ctx.strokeStyle = '#15803d'
      } else {
        this.ctx.fillStyle = '#ef4444'
        this.ctx.strokeStyle = '#991b1b'
      }
      
      // Outer ring
      this.ctx.fillRect(tx, ty, tw, th)
      this.ctx.strokeRect(tx, ty, tw, th)
      
      // White inner ring
      this.ctx.fillStyle = '#ffffff'
      this.ctx.fillRect(tx + tw * 0.2, ty + th * 0.2, tw * 0.6, th * 0.6)
      
      // Center
      if (target.hit) {
        this.ctx.fillStyle = '#22c55e'
      } else {
        this.ctx.fillStyle = '#ef4444'
      }
      this.ctx.fillRect(tx + tw * 0.4, ty + th * 0.4, tw * 0.2, th * 0.2)
      
      // Drag hint when not running
      if (!this.isRunning) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)'
        this.ctx.font = '10px sans-serif'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('Drag', tx + tw/2, h - offsetY + 15)
      }
    })

    // Cannon
    const cannonX = offsetX
    const cannonY = h - offsetY - this.launchHeight * scaleY
    const cannonLength = 30
    const angleRad = (this.launchAngle * Math.PI) / 180
    
    // Cannon base
    this.ctx.fillStyle = '#1f2937'
    this.ctx.strokeStyle = '#111827'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(cannonX, cannonY, 15, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.stroke()
    
    // Cannon barrel
    this.ctx.fillStyle = '#374151'
    this.ctx.strokeStyle = '#111827'
    this.ctx.lineWidth = 2
    this.ctx.save()
    this.ctx.translate(cannonX, cannonY)
    this.ctx.rotate(-angleRad)
    this.ctx.fillRect(0, -8, cannonLength, 16)
    this.ctx.strokeRect(0, -8, cannonLength, 16)
    this.ctx.restore()
    
    // Cannon wheels
    this.ctx.fillStyle = '#1f2937'
    this.ctx.beginPath()
    this.ctx.arc(cannonX - 10, cannonY + 15, 8, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.stroke()
    this.ctx.beginPath()
    this.ctx.arc(cannonX + 10, cannonY + 15, 8, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.stroke()

    // Trajectory path
    if (this.trajectory.length > 1) {
      this.ctx.strokeStyle = '#8b5cf6'
      this.ctx.lineWidth = 2
      this.ctx.globalAlpha = 0.6
      this.ctx.setLineDash([5, 5])
      this.ctx.beginPath()
      this.trajectory.forEach((point, i) => {
        const x = offsetX + point.x * scaleX
        const y = h - offsetY - point.y * scaleY
        if (i === 0) this.ctx.moveTo(x, y)
        else this.ctx.lineTo(x, y)
      })
      this.ctx.stroke()
      this.ctx.setLineDash([])
      this.ctx.globalAlpha = 1
    }

    // Cannonball
    if (this.state.isFlying || this.state.time > 0) {
      const x = offsetX + this.state.x * scaleX
      const y = h - offsetY - this.state.y * scaleY

      // Cannonball (dark sphere with highlight)
      const ballGradient = this.ctx.createRadialGradient(x - 3, y - 3, 2, x, y, 10)
      ballGradient.addColorStop(0, '#6b7280')
      ballGradient.addColorStop(1, '#1f2937')
      this.ctx.fillStyle = ballGradient
      this.ctx.strokeStyle = '#111827'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(x, y, 10, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.stroke()
      
      // Highlight
      this.ctx.fillStyle = 'rgba(255,255,255,0.3)'
      this.ctx.beginPath()
      this.ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2)
      this.ctx.fill()

      // Velocity vector
      if (this.state.isFlying) {
        const vScale = 5
        const vx = this.state.vx * vScale
        const vy = -this.state.vy * vScale
        this.ctx.strokeStyle = '#3b82f6'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.moveTo(x, y)
        this.ctx.lineTo(x + vx, y + vy)
        this.ctx.stroke()
        
        // Arrow head
        const angle = Math.atan2(vy, vx)
        this.ctx.beginPath()
        this.ctx.moveTo(x + vx, y + vy)
        this.ctx.lineTo(x + vx - 8 * Math.cos(angle - Math.PI / 6), y + vy - 8 * Math.sin(angle - Math.PI / 6))
        this.ctx.moveTo(x + vx, y + vy)
        this.ctx.lineTo(x + vx - 8 * Math.cos(angle + Math.PI / 6), y + vy - 8 * Math.sin(angle + Math.PI / 6))
        this.ctx.stroke()
      }
    }

    // Score display
    this.ctx.fillStyle = '#1f2937'
    this.ctx.font = 'bold 14px sans-serif'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`Hits: ${this.hits} | Misses: ${this.misses}`, 10, 25)
    
    // Scale indicator
    this.ctx.fillStyle = '#6b7280'
    this.ctx.font = '12px sans-serif'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`Max Range: ${maxX.toFixed(1)}m | Max Height: ${maxY.toFixed(1)}m`, 10, h - 10)
  }

  getState() {
    return { ...this.state }
  }

  getDataPoints() {
    return [...this.dataPoints]
  }

  getTrajectory() {
    return [...this.trajectory]
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    window.removeEventListener('resize', () => this.resizeCanvas())
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ProjectileMotionLabContent({
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simulationRef = useRef<ProjectileSimulation | null>(null)
  const totalSimulationTime = useRef(0)

  // Launch parameters
  const [initialSpeed, setInitialSpeed] = useState(20)
  const [launchAngle, setLaunchAngle] = useState(45)
  const [initialHeight, setInitialHeight] = useState(0)

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [currentState, setCurrentState] = useState<SimulationState>({
    x: 0, y: 0, vx: 0, vy: 0, time: 0, isFlying: false
  })
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [trajectory, setTrajectory] = useState<{ x: number; y: number }[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  // Use standardized completion tracking
  const completionConfig = getSimulationCriteria('projectile-motion')
  const actionLabelsMap = getActionLabels('projectile-motion')
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
  
  // Load assignments for admin
  useEffect(() => {
    if (isAdmin) {
      loadAssignments()
    }
  }, [isAdmin])
  
  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/simulations/assignments?simulation_slug=projectile-motion')
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

  // Initialize simulation
  useEffect(() => {
    if (canvasRef.current && !simulationRef.current) {
      simulationRef.current = new ProjectileSimulation(
        canvasRef.current,
        (state, data, traj, hitCount, missCount) => {
          setCurrentState(state)
          setDataPoints(data)
          setTrajectory(traj)
          setHits(hitCount)
          setMisses(missCount)
          setIsRunning(state.isFlying)
        }
      )
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.destroy()
        simulationRef.current = null
      }
    }
  }, [])

  // Enhanced interaction tracking wrapper
  const handleInteraction = useCallback((action: string, data: Record<string, any>) => {
    // Call the original onInteraction from SimulationWrapper
    onInteraction(action, data)
    
    // Track with standardized system
    trackInteraction(action, data)
  }, [onInteraction, trackInteraction])
  
  const handleLaunch = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.launch(initialSpeed, launchAngle, initialHeight)
      handleInteraction('launch', { initialSpeed, launchAngle, initialHeight })
    }
  }, [initialSpeed, launchAngle, initialHeight, handleInteraction])

  const handlePause = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.pause()
      handleInteraction('pause', { time: currentState.time })
    }
  }, [currentState.time, handleInteraction])

  const handleResume = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.resume()
      handleInteraction('resume', { time: currentState.time })
    }
  }, [currentState.time, handleInteraction])

  const handleReset = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.reset()
      handleInteraction('reset', {})
      resetCompletion() // Reset completion tracking
    }
  }, [handleInteraction, resetCompletion])

  const handleResetScore = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.resetScore()
      setHits(0)
      setMisses(0)
      handleInteraction('reset_score', {})
    }
  }, [handleInteraction])

  const handleExportData = useCallback(() => {
    const csv = [
      'Time (s),X Position (m),Y Position (m),X Velocity (m/s),Y Velocity (m/s),Speed (m/s)',
      ...dataPoints.map(d => 
        `${d.time.toFixed(2)},${d.x.toFixed(2)},${d.y.toFixed(2)},${d.vx.toFixed(2)},${d.vy.toFixed(2)},${d.speed.toFixed(2)}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `projectile-motion-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [dataPoints])

  // Predictions
  const predictions = useMemo(() => {
    const angleRad = (launchAngle * Math.PI) / 180
    const vx = initialSpeed * Math.cos(angleRad)
    const vy = initialSpeed * Math.sin(angleRad)
    
    const discriminant = vy * vy + 2 * GRAVITY * initialHeight
    const timeOfFlight = discriminant >= 0 ? (vy + Math.sqrt(discriminant)) / GRAVITY : 0
    const range = vx * timeOfFlight
    const maxHeight = initialHeight + (vy * vy) / (2 * GRAVITY)

    return { range, maxHeight, timeOfFlight, vx, vy }
  }, [initialSpeed, launchAngle, initialHeight])

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
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold mb-2">Projectile Motion Lab</h1>
              <p className="text-muted-foreground">
                Launch projectiles and analyze 2D motion under gravity. HTML5 Canvas simulation.
              </p>
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
                <QuickAssignButton
                  simulationTitle="Projectile Motion Lab"
                  simulationSlug="projectile-motion"
                />
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
          {/* Canvas View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trajectory View</CardTitle>
              <CardDescription>Watch the projectile&apos;s path through the air</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex gap-6">
                    <div>
                      <div className="text-xs text-muted-foreground">Hits</div>
                      <div className="text-2xl font-bold text-green-600">{hits}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Misses</div>
                      <div className="text-2xl font-bold text-red-600">{misses}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleResetScore}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset Score
                  </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  💡 Drag targets to different positions • Adjust angle and speed to hit them!
                </div>
              </div>
              <canvas 
                ref={canvasRef}
                className="w-full rounded-lg border-2 border-muted cursor-move"
                style={{ height: '400px' }}
              />

              {/* Live readout */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-card/80 backdrop-blur rounded-lg border">
                <div>
                  <div className="text-xs text-muted-foreground">Time</div>
                  <div className="text-lg font-bold">{currentState.time.toFixed(2)}s</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">X Position</div>
                  <div className="text-lg font-bold">{currentState.x.toFixed(1)}m</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Y Position</div>
                  <div className="text-lg font-bold">{currentState.y.toFixed(1)}m</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">X Velocity</div>
                  <div className="text-lg font-bold text-blue-600">{currentState.vx.toFixed(1)}m/s</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Y Velocity</div>
                  <div className="text-lg font-bold text-green-600">{currentState.vy.toFixed(1)}m/s</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Visualization */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="trajectory" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="trajectory">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Trajectory
                  </TabsTrigger>
                  <TabsTrigger value="table">
                    <TableIcon className="h-4 w-4 mr-2" />
                    Data Table
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trajectory" className="space-y-4">
                  <div className="h-80 flex items-center justify-center bg-muted rounded-lg p-4">
                    {dataPoints.length < 2 ? (
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Launch projectile to generate trajectory data</p>
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-muted-foreground">
                          Y Position (m)
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground">
                          X Position (m)
                        </div>
                        
                        <svg className="w-full h-full pl-8 pb-6">
                          <g className="stroke-muted-foreground/20">
                            {[0, 25, 50, 75, 100].map(y => (
                              <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} strokeWidth="1" />
                            ))}
                            {[0, 25, 50, 75, 100].map(x => (
                              <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" strokeWidth="1" />
                            ))}
                          </g>

                          {(() => {
                            const maxX = Math.max(...dataPoints.map(p => p.x), 1)
                            const maxY = Math.max(...dataPoints.map(p => p.y), 1)
                            
                            const points = dataPoints
                              .map(d => {
                                const x = (d.x / maxX) * 100
                                const y = 100 - (d.y / maxY) * 100
                                return isFinite(x) && isFinite(y) ? `${x},${y}` : null
                              })
                              .filter(p => p !== null)
                              .join(' ')
                            
                            return points ? (
                              <>
                                <polyline
                                  points={points}
                                  stroke="hsl(var(--primary))"
                                  strokeWidth="3"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {dataPoints.filter((_, i) => i % 5 === 0).map((d, i) => {
                                  const x = (d.x / maxX) * 100
                                  const y = 100 - (d.y / maxY) * 100
                                  if (!isFinite(x) || !isFinite(y)) return null
                                  return (
                                    <circle
                                      key={i}
                                      cx={`${x}%`}
                                      cy={`${y}%`}
                                      r="3"
                                      fill="hsl(var(--primary))"
                                    />
                                  )
                                })}
                              </>
                            ) : null
                          })()}
                        </svg>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="table">
                  <div className="max-h-80 overflow-y-auto border rounded-lg">
                    {dataPoints.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <TableIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Launch projectile to collect data</p>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Time (s)</th>
                            <th className="p-2 text-left">X (m)</th>
                            <th className="p-2 text-left">Y (m)</th>
                            <th className="p-2 text-left">Vx (m/s)</th>
                            <th className="p-2 text-left">Vy (m/s)</th>
                            <th className="p-2 text-left">Speed (m/s)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataPoints.map((d, i) => (
                            <tr key={i} className="border-t hover:bg-muted/50">
                              <td className="p-2 font-mono">{d.time.toFixed(2)}</td>
                              <td className="p-2 font-mono">{d.x.toFixed(2)}</td>
                              <td className="p-2 font-mono">{d.y.toFixed(2)}</td>
                              <td className="p-2 font-mono text-blue-600">{d.vx.toFixed(2)}</td>
                              <td className="p-2 font-mono text-green-600">{d.vy.toFixed(2)}</td>
                              <td className="p-2 font-mono">{d.speed.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {dataPoints.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {dataPoints.length} data points collected
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Launch Parameters</CardTitle>
              <CardDescription>Set initial conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Initial Speed</label>
                  <span className="text-sm text-muted-foreground">{initialSpeed} m/s</span>
                </div>
                <Slider
                  value={[initialSpeed]}
                  onValueChange={([value]) => {
                    setInitialSpeed(value)
                    handleInteraction('velocity_changed', { velocity: value })
                  }}
                  min={5}
                  max={50}
                  step={1}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Launch Angle</label>
                  <span className="text-sm text-muted-foreground">{launchAngle}°</span>
                </div>
                <Slider
                  value={[launchAngle]}
                  onValueChange={([value]) => {
                    setLaunchAngle(value)
                    handleInteraction('angle_changed', { angle: value })
                  }}
                  min={0}
                  max={90}
                  step={1}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Initial Height</label>
                  <span className="text-sm text-muted-foreground">{initialHeight} m</span>
                </div>
                <Slider
                  value={[initialHeight]}
                  onValueChange={([value]) => setInitialHeight(value)}
                  min={0}
                  max={20}
                  step={0.5}
                  disabled={isRunning}
                />
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="text-sm font-medium mb-2">Predictions:</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Range:</span>
                    <span className="font-mono">{predictions.range.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Height:</span>
                    <span className="font-mono">{predictions.maxHeight.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flight Time:</span>
                    <span className="font-mono">{predictions.timeOfFlight.toFixed(2)} s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vx:</span>
                    <span className="font-mono text-blue-600">{predictions.vx.toFixed(2)} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vy:</span>
                    <span className="font-mono text-green-600">{predictions.vy.toFixed(2)} m/s</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                {!currentState.isFlying ? (
                  <Button 
                    onClick={handleLaunch}
                    className="w-full"
                    disabled={isRunning}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Launch
                  </Button>
                ) : (
                  <Button 
                    onClick={isRunning ? handlePause : handleResume}
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
                        Resume
                      </>
                    )}
                  </Button>
                )}
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
                  <li>Analyze 2D projectile motion</li>
                  <li>Understand velocity components</li>
                  <li>Calculate range and maximum height</li>
                  <li>Explore the effect of launch angle</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Key Concepts:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Horizontal velocity remains constant</li>
                  <li>Vertical motion follows free fall</li>
                  <li>Optimal angle for range is 45°</li>
                  <li>Trajectory forms a parabola</li>
                  <li>Time up equals time down (from same height)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Try This:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Find the angle for maximum range</li>
                  <li>Compare 30° and 60° launches</li>
                  <li>Test different initial heights</li>
                  <li>Calculate landing speed vs launch speed</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="projectile-motion"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={completionState.isCompleted}
          simulationData={{
            dataPoints,
            hits,
            misses,
            accuracy: hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0,
            currentState,
            predictions
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
          simulationSlug="projectile-motion"
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

export default function ProjectileMotionLab() {
  return (
    <SimulationWrapper
      simulationSlug="projectile-motion"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <ProjectileMotionLabContent {...props} />}
    </SimulationWrapper>
  )
}