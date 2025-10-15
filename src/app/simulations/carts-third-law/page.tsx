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
  ArrowLeftRight
} from 'lucide-react'

interface KinematicsData {
  time: number
  positionA: number
  positionB: number
  velocityA: number
  velocityB: number
  momentumA: number
  momentumB: number
  totalMomentum: number
  forceOnA: number
  forceOnB: number
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

class CartPhysicsEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  // Cart A (left, usually heavier)
  private massA: number = 2.0 // kg
  private positionA: number = 200 // pixels from left
  private velocityA: number = 0 // m/s
  
  // Cart B (right, usually lighter)
  private massB: number = 1.0 // kg
  private positionB: number = 400 // pixels from left
  private velocityB: number = 0 // m/s
  
  // Interaction
  private interactionForce: number = 0 // N (magnitude of force between carts)
  private interactionTime: number = 0.5 // seconds (how long force is applied)
  private elapsedInteractionTime: number = 0
  
  private animationId: number | null = null
  private lastTime: number = 0
  private isRunning: boolean = false
  private time: number = 0
  private pixelsPerMeter: number = 50
  
  private onUpdate: (data: {
    positionA: number
    positionB: number
    velocityA: number
    velocityB: number
    forceOnA: number
    forceOnB: number
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
      this.canvas.height = 300
    }
  }

  public setMasses(massA: number, massB: number) {
    this.massA = massA
    this.massB = massB
  }

  public setInteractionForce(force: number) {
    this.interactionForce = force
  }

  public start() {
    if (!this.isRunning) {
      this.isRunning = true
      this.lastTime = performance.now()
      this.elapsedInteractionTime = 0
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
    this.positionA = this.canvas.width * 0.3
    this.positionB = this.canvas.width * 0.7
    this.velocityA = 0
    this.velocityB = 0
    this.time = 0
    this.elapsedInteractionTime = 0
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

    // Apply interaction force for limited time (like a spring release)
    let forceOnA = 0
    let forceOnB = 0
    
    if (this.elapsedInteractionTime < this.interactionTime) {
      // Newton's Third Law: Forces are equal and opposite
      forceOnA = this.interactionForce  // Force ON cart A (pushing right)
      forceOnB = -this.interactionForce // Force ON cart B (pushing left)
      
      this.elapsedInteractionTime += dt
    }

    // Calculate accelerations: F = ma → a = F/m
    const accelerationA = forceOnA / this.massA
    const accelerationB = forceOnB / this.massB

    // Update velocities: v = v₀ + at
    this.velocityA += accelerationA * dt
    this.velocityB += accelerationB * dt

    // Update positions: x = x₀ + vt
    this.positionA += this.velocityA * this.pixelsPerMeter * dt
    this.positionB += this.velocityB * this.pixelsPerMeter * dt

    // Bounce off walls
    if (this.positionA < 50) {
      this.positionA = 50
      this.velocityA = -this.velocityA * 0.7
    }
    if (this.positionA > this.canvas.width - 50) {
      this.positionA = this.canvas.width - 50
      this.velocityA = -this.velocityA * 0.7
    }
    if (this.positionB < 50) {
      this.positionB = 50
      this.velocityB = -this.velocityB * 0.7
    }
    if (this.positionB > this.canvas.width - 50) {
      this.positionB = this.canvas.width - 50
      this.velocityB = -this.velocityB * 0.7
    }

    this.time += dt

    this.render()
    this.sendUpdate()

    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.animate())
    }
  }

  private sendUpdate() {
    // Determine current forces
    let forceOnA = 0
    let forceOnB = 0
    if (this.elapsedInteractionTime < this.interactionTime) {
      forceOnA = this.interactionForce
      forceOnB = -this.interactionForce
    }

    this.onUpdate({
      positionA: this.positionA / this.pixelsPerMeter,
      positionB: this.positionB / this.pixelsPerMeter,
      velocityA: this.velocityA,
      velocityB: this.velocityB,
      forceOnA: forceOnA,
      forceOnB: forceOnB,
      time: this.time
    })
  }

  private render() {
    const ctx = this.ctx

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw background
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw floor/track
    const floorY = this.canvas.height - 80
    ctx.fillStyle = '#9ca3af'
    ctx.fillRect(0, floorY, this.canvas.width, 5)

    // Draw center line
    ctx.strokeStyle = '#6b7280'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(this.canvas.width / 2, 0)
    ctx.lineTo(this.canvas.width / 2, this.canvas.height)
    ctx.stroke()
    ctx.setLineDash([])

    // Determine if forces are active
    const forcesActive = this.elapsedInteractionTime < this.interactionTime

    // Draw Cart A (left)
    const cartAY = floorY - 60
    const cartAWidth = 60 + this.massA * 15
    const cartAHeight = 40

    // Cart A body
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(
      this.positionA - cartAWidth / 2,
      cartAY,
      cartAWidth,
      cartAHeight
    )
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 3
    ctx.strokeRect(
      this.positionA - cartAWidth / 2,
      cartAY,
      cartAWidth,
      cartAHeight
    )

    // Cart A mass label
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${this.massA.toFixed(1)} kg`, this.positionA, cartAY + cartAHeight / 2)

    // Cart A wheels
    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.arc(this.positionA - cartAWidth / 3, cartAY + cartAHeight, 8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.positionA + cartAWidth / 3, cartAY + cartAHeight, 8, 0, 2 * Math.PI)
    ctx.fill()

    // Draw Cart B (right)
    const cartBY = floorY - 60
    const cartBWidth = 60 + this.massB * 15
    const cartBHeight = 40

    // Cart B body
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(
      this.positionB - cartBWidth / 2,
      cartBY,
      cartBWidth,
      cartBHeight
    )
    ctx.strokeStyle = '#991b1b'
    ctx.lineWidth = 3
    ctx.strokeRect(
      this.positionB - cartBWidth / 2,
      cartBY,
      cartBWidth,
      cartBHeight
    )

    // Cart B mass label
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${this.massB.toFixed(1)} kg`, this.positionB, cartBY + cartBHeight / 2)

    // Cart B wheels
    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.arc(this.positionB - cartBWidth / 3, cartBY + cartBHeight, 8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(this.positionB + cartBWidth / 3, cartBY + cartBHeight, 8, 0, 2 * Math.PI)
    ctx.fill()

    // Draw interaction force arrows (during interaction only)
    if (forcesActive && this.interactionForce > 0) {
      const forceScale = 0.8
      const arrowY = cartAY + cartAHeight / 2

      // Force on Cart A (pushing right, positive)
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(this.positionA, arrowY)
      ctx.lineTo(this.positionA + this.interactionForce * forceScale, arrowY)
      ctx.stroke()
      this.drawArrow(ctx, this.positionA + this.interactionForce * forceScale, arrowY, 0, '#10b981')
      
      // Force label on A
      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `F = ${this.interactionForce.toFixed(0)}N`,
        this.positionA + this.interactionForce * forceScale / 2,
        arrowY - 15
      )

      // Force on Cart B (pushing left, negative)
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(this.positionB, arrowY)
      ctx.lineTo(this.positionB - this.interactionForce * forceScale, arrowY)
      ctx.stroke()
      this.drawArrow(ctx, this.positionB - this.interactionForce * forceScale, arrowY, Math.PI, '#8b5cf6')
      
      // Force label on B
      ctx.fillStyle = '#8b5cf6'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `F = ${this.interactionForce.toFixed(0)}N`,
        this.positionB - this.interactionForce * forceScale / 2,
        arrowY - 15
      )

      // Action-Reaction label
      ctx.fillStyle = '#f59e0b'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        'ACTION ⟷ REACTION',
        this.canvas.width / 2,
        arrowY - 40
      )
    }

    // Draw velocity vectors
    if (Math.abs(this.velocityA) > 0.1) {
      const velScale = 40
      const velY = cartAY - 20
      ctx.strokeStyle = '#0891b2'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(this.positionA, velY)
      ctx.lineTo(this.positionA + this.velocityA * velScale, velY)
      ctx.stroke()
      this.drawArrow(
        ctx,
        this.positionA + this.velocityA * velScale,
        velY,
        this.velocityA > 0 ? 0 : Math.PI,
        '#0891b2'
      )
      
      ctx.fillStyle = '#0891b2'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`v = ${this.velocityA.toFixed(1)} m/s`, this.positionA, velY - 12)
    }

    if (Math.abs(this.velocityB) > 0.1) {
      const velScale = 40
      const velY = cartBY - 20
      ctx.strokeStyle = '#0891b2'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(this.positionB, velY)
      ctx.lineTo(this.positionB + this.velocityB * velScale, velY)
      ctx.stroke()
      this.drawArrow(
        ctx,
        this.positionB + this.velocityB * velScale,
        velY,
        this.velocityB > 0 ? 0 : Math.PI,
        '#0891b2'
      )
      
      ctx.fillStyle = '#0891b2'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`v = ${this.velocityB.toFixed(1)} m/s`, this.positionB, velY - 12)
    }

    // Draw cart labels
    ctx.fillStyle = '#1e40af'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Cart A', this.positionA, cartAY + cartAHeight + 25)

    ctx.fillStyle = '#991b1b'
    ctx.fillText('Cart B', this.positionB, cartBY + cartBHeight + 25)
  }

  private drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
    const arrowSize = 12
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

function CartsThirdLawContent({
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
  const [massA, setMassA] = useState(2.0) // kg
  const [massB, setMassB] = useState(1.0) // kg
  const [interactionForce, setInteractionForce] = useState(100) // N
  const [kinematicsData, setKinematicsData] = useState<KinematicsData[]>([])
  const [currentData, setCurrentData] = useState({
    positionA: 0,
    positionB: 0,
    velocityA: 0,
    velocityB: 0,
    forceOnA: 0,
    forceOnB: 0,
    time: 0
  })
  const [simulationCompleted, setSimulationCompleted] = useState(false)

  // Assignment state
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [editingAssignment, setEditingAssignment] = useState<any>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<CartPhysicsEngine | null>(null)
  const dataCollectionInterval = useRef<NodeJS.Timeout | null>(null)
  const totalSimulationTime = useRef(0)
  const currentValuesRef = useRef({
    positionA: 0,
    positionB: 0,
    velocityA: 0,
    velocityB: 0,
    forceOnA: 0,
    forceOnB: 0,
    time: 0
  })

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new CartPhysicsEngine(
        canvasRef.current,
        (data) => {
          setCurrentData(data)
          currentValuesRef.current = data
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=carts-third-law')
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
        
        const momentumA = massA * current.velocityA
        const momentumB = massB * current.velocityB
        const totalMomentum = momentumA + momentumB

        const newDataPoint: KinematicsData = {
          time: parseFloat(current.time.toFixed(2)),
          positionA: parseFloat(current.positionA.toFixed(2)),
          positionB: parseFloat(current.positionB.toFixed(2)),
          velocityA: parseFloat(current.velocityA.toFixed(2)),
          velocityB: parseFloat(current.velocityB.toFixed(2)),
          momentumA: parseFloat(momentumA.toFixed(2)),
          momentumB: parseFloat(momentumB.toFixed(2)),
          totalMomentum: parseFloat(totalMomentum.toFixed(2)),
          forceOnA: parseFloat(current.forceOnA.toFixed(2)),
          forceOnB: parseFloat(current.forceOnB.toFixed(2))
        }

        setKinematicsData(prev => [...prev, newDataPoint])
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
  }, [isRunning, massA, massB])

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
      engineRef.current.setMasses(massA, massB)
      engineRef.current.setInteractionForce(interactionForce)
      engineRef.current.start()
      setIsRunning(true)
      onInteraction('start', { massA, massB, interactionForce })
    }
  }

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause()
      setIsRunning(false)
      onInteraction('pause', { time: currentData.time, dataPoints: kinematicsData.length })
      
      if (kinematicsData.length >= 10) {
        setSimulationCompleted(true)
        const totalMomentum = massA * currentData.velocityA + massB * currentData.velocityB
        onComplete({
          totalTime: currentData.time,
          dataPoints: kinematicsData.length,
          finalMomentum: totalMomentum,
          momentumConserved: Math.abs(totalMomentum) < 0.5
        }, 100)
      }
    }
  }

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      setIsRunning(false)
      setKinematicsData([])
      onInteraction('reset', {})
    }
  }

  const handleExportData = () => {
    const csv = [
      'Time (s),Pos A (m),Pos B (m),Vel A (m/s),Vel B (m/s),Mom A (kg·m/s),Mom B (kg·m/s),Total Mom (kg·m/s),Force on A (N),Force on B (N)',
      ...kinematicsData.map(d => 
        `${d.time},${d.positionA},${d.positionB},${d.velocityA},${d.velocityB},${d.momentumA},${d.momentumB},${d.totalMomentum},${d.forceOnA},${d.forceOnB}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carts-third-law-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyForDesmos = () => {
    const velAData = kinematicsData.map(d => `(${d.time},${d.velocityA})`).join(',')
    const velBData = kinematicsData.map(d => `(${d.time},${d.velocityB})`).join(',')
    const momentumData = kinematicsData.map(d => `(${d.time},${d.totalMomentum})`).join(',')
    
    const desmosText = `Cart A Velocity:\n${velAData}\n\nCart B Velocity:\n${velBData}\n\nTotal Momentum:\n${momentumData}`
    
    navigator.clipboard.writeText(desmosText).then(() => {
      alert('Data copied! Paste into Desmos to see:\n1. Velocity of both carts\n2. Total momentum (should be ~0!)')
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  // Calculate current momentum
  const momentumA = massA * currentData.velocityA
  const momentumB = massB * currentData.velocityB
  const totalMomentum = momentumA + momentumB

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
            <h1 className="text-3xl font-bold mb-2">Carts & Springs: Newton&apos;s Third Law</h1>
            <p className="text-muted-foreground">
              Watch two carts push apart and discover action-reaction pairs and momentum conservation
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
        {/* Left Column: Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cart Interaction</CardTitle>
              <CardDescription>
                Two carts with a compressed spring between them - when released, they push apart!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas 
                ref={canvasRef}
                className="w-full border-2 border-border rounded-lg bg-white"
              />

              {/* Real-time Metrics */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700 font-medium mb-1">Time</div>
                  <div className="text-xl font-bold text-blue-900">{currentData.time.toFixed(2)}s</div>
                </div>
                
                <div className="p-3 bg-cyan-50 rounded-lg">
                  <div className="text-xs text-cyan-700 font-medium mb-1">Cart A Velocity</div>
                  <div className="text-xl font-bold text-cyan-900">{currentData.velocityA.toFixed(2)} m/s</div>
                </div>

                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-xs text-red-700 font-medium mb-1">Cart B Velocity</div>
                  <div className="text-xl font-bold text-red-900">{currentData.velocityB.toFixed(2)} m/s</div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-700 font-medium mb-1">Total Momentum</div>
                  <div className="text-xl font-bold text-purple-900">{totalMomentum.toFixed(2)}</div>
                  <div className="text-xs text-purple-600">kg·m/s</div>
                </div>
              </div>

              {/* Newton's Third Law Status */}
              <div className="mt-4">
                {Math.abs(currentData.forceOnA) > 0.1 ? (
                  <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="text-sm font-semibold text-green-900 mb-1">
                      ⚡ Newton&apos;s 3rd Law in Action!
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                      <div>
                        <strong>Force ON Cart A:</strong> +{currentData.forceOnA.toFixed(0)} N (→)
                      </div>
                      <div>
                        <strong>Force ON Cart B:</strong> {currentData.forceOnB.toFixed(0)} N (←)
                      </div>
                    </div>
                    <div className="text-xs text-green-700 mt-2 text-center font-semibold">
                      Forces are equal in magnitude, opposite in direction!
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
                    <div className="text-sm font-semibold text-blue-900">
                      💨 Forces released - carts now in free motion
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Total momentum = {totalMomentum.toFixed(3)} kg·m/s (should be ≈0!)
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Graphs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="velocity" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="velocity">Velocities</TabsTrigger>
                  <TabsTrigger value="momentum">Momentum</TabsTrigger>
                  <TabsTrigger value="table">Data Table</TabsTrigger>
                </TabsList>

                {/* Velocity Graph */}
                <TabsContent value="velocity" className="space-y-2">
                  <h4 className="font-semibold text-sm">Velocity vs. Time (Both Carts)</h4>
                  <div className="h-64 bg-white border rounded-lg p-4 relative">
                    {kinematicsData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 opacity-50" />
                      </div>
                    ) : (
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <g stroke="#e5e7eb" strokeWidth="0.2">
                          {[0, 25, 50, 75, 100].map(y => (
                            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} />
                          ))}
                          <line x1="0" y1="50" x2="100" y2="50" stroke="#000" strokeWidth="0.3" />
                        </g>
                        
                        {/* Cart A velocity (blue) */}
                        <polyline
                          points={kinematicsData.map((d, i) => {
                            const x = (i / Math.max(kinematicsData.length - 1, 1)) * 100
                            const maxV = Math.max(...kinematicsData.map(p => Math.max(Math.abs(p.velocityA), Math.abs(p.velocityB))), 1)
                            const y = 50 - (d.velocityA / maxV) * 45
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                        
                        {/* Cart B velocity (red) */}
                        <polyline
                          points={kinematicsData.map((d, i) => {
                            const x = (i / Math.max(kinematicsData.length - 1, 1)) * 100
                            const maxV = Math.max(...kinematicsData.map(p => Math.max(Math.abs(p.velocityA), Math.abs(p.velocityB))), 1)
                            const y = 50 - (d.velocityB / maxV) * 45
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    )}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                      Time (s)
                    </div>
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">
                      Velocity (m/s)
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs justify-center">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Cart A</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Cart B</span>
                    </div>
                  </div>
                </TabsContent>

                {/* Momentum Graph */}
                <TabsContent value="momentum" className="space-y-2">
                  <h4 className="font-semibold text-sm">Total Momentum vs. Time</h4>
                  <div className="h-64 bg-white border rounded-lg p-4 relative">
                    {kinematicsData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 opacity-50" />
                      </div>
                    ) : (
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <g stroke="#e5e7eb" strokeWidth="0.2">
                          {[0, 25, 50, 75, 100].map(y => (
                            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} />
                          ))}
                          <line x1="0" y1="50" x2="100" y2="50" stroke="#000" strokeWidth="0.5" />
                        </g>
                        
                        <polyline
                          points={kinematicsData.map((d, i) => {
                            const x = (i / Math.max(kinematicsData.length - 1, 1)) * 100
                            const maxMom = Math.max(...kinematicsData.map(p => Math.abs(p.totalMomentum)), 1)
                            const y = 50 - (d.totalMomentum / maxMom) * 45
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#8b5cf6"
                          strokeWidth="2"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                        
                        {kinematicsData.map((d, i) => {
                          const x = (i / Math.max(kinematicsData.length - 1, 1)) * 100
                          const maxMom = Math.max(...kinematicsData.map(p => Math.abs(p.totalMomentum)), 1)
                          const y = 50 - (d.totalMomentum / maxMom) * 45
                          return <circle key={i} cx={x} cy={y} r="1" fill="#8b5cf6" vectorEffect="non-scaling-stroke" />
                        })}
                      </svg>
                    )}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                      Time (s)
                    </div>
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">
                      Total Momentum (kg·m/s)
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Conservation: Momentum should stay near zero (horizontal line)
                  </p>
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
                            <th className="p-2 text-left">Time</th>
                            <th className="p-2 text-left">v<sub>A</sub></th>
                            <th className="p-2 text-left">v<sub>B</sub></th>
                            <th className="p-2 text-left">p<sub>A</sub></th>
                            <th className="p-2 text-left">p<sub>B</sub></th>
                            <th className="p-2 text-left">p<sub>total</sub></th>
                          </tr>
                        </thead>
                        <tbody>
                          {kinematicsData.map((d, i) => (
                            <tr key={i} className="border-t hover:bg-muted/50">
                              <td className="p-2">{d.time}s</td>
                              <td className="p-2 font-mono text-blue-700">{d.velocityA.toFixed(2)}</td>
                              <td className="p-2 font-mono text-red-700">{d.velocityB.toFixed(2)}</td>
                              <td className="p-2 font-mono text-blue-600">{d.momentumA.toFixed(2)}</td>
                              <td className="p-2 font-mono text-red-600">{d.momentumB.toFixed(2)}</td>
                              <td className="p-2 font-mono font-bold text-purple-700">{d.totalMomentum.toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {kinematicsData.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {kinematicsData.length} data points (every 0.2s)
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

        {/* Right Column: Controls & Learning */}
        <div className="space-y-6">
          {/* Setup Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setup</CardTitle>
              <CardDescription>Configure before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mass A */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Cart A Mass</label>
                  <span className="text-sm text-muted-foreground">{massA.toFixed(1)} kg</span>
                </div>
                <Slider
                  value={[massA]}
                  onValueChange={([value]) => setMassA(value)}
                  min={0.5}
                  max={5}
                  step={0.5}
                  disabled={isRunning}
                />
              </div>

              {/* Mass B */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Cart B Mass</label>
                  <span className="text-sm text-muted-foreground">{massB.toFixed(1)} kg</span>
                </div>
                <Slider
                  value={[massB]}
                  onValueChange={([value]) => setMassB(value)}
                  min={0.5}
                  max={5}
                  step={0.5}
                  disabled={isRunning}
                />
              </div>

              {/* Interaction Force */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Spring Force</label>
                  <span className="text-sm text-muted-foreground">{interactionForce.toFixed(0)} N</span>
                </div>
                <Slider
                  value={[interactionForce]}
                  onValueChange={([value]) => setInteractionForce(value)}
                  min={10}
                  max={300}
                  step={10}
                  disabled={isRunning}
                />
                <p className="text-xs text-muted-foreground">
                  Force applied for 0.5 seconds when carts are released
                </p>
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
                      Release Spring
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

          {/* Newton's Third Law */}
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-green-900">⚖️ Newton&apos;s 3rd Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded-lg border-2 border-green-200">
                <div className="font-semibold text-green-900 mb-2">Action-Reaction Pairs</div>
                <p className="text-xs text-green-800 mb-2">
                  For every action force, there is an equal and opposite reaction force.
                </p>
                <div className="text-xs text-green-700 font-mono bg-green-50 p-2 rounded text-center">
                  F<sub>A→B</sub> = -F<sub>B→A</sub>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
                <div className="font-semibold text-purple-900 mb-2">Momentum Conservation</div>
                <p className="text-xs text-purple-800 mb-2">
                  When no external forces act, total momentum stays constant.
                </p>
                <div className="text-xs text-purple-700 font-mono bg-purple-50 p-2 rounded text-center">
                  p<sub>total</sub> = m<sub>A</sub>v<sub>A</sub> + m<sub>B</sub>v<sub>B</sub> = 0
                </div>
                {kinematicsData.length > 0 && (
                  <div className="mt-2 text-xs text-purple-700 text-center">
                    Current: {totalMomentum.toFixed(3)} kg·m/s
                  </div>
                )}
              </div>

              <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900">
                <strong>💡 Key Insight:</strong> Same force, different masses → different accelerations!
              </div>
            </CardContent>
          </Card>

          {/* Learning Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Try This
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>Equal masses: Watch carts move at same speed (opposite directions)</li>
                <li>Different masses: See lighter cart move faster!</li>
                <li>Vary spring force: Observe how it affects final velocities</li>
                <li>Check momentum graph: Should stay at zero (conserved!)</li>
                <li>Calculate: If m<sub>A</sub>=2kg moves at 1m/s left, how fast does m<sub>B</sub>=1kg move?</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="carts-third-law"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={simulationCompleted}
          simulationData={{
            dataPoints: kinematicsData,
            totalMomentum: totalMomentum,
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
          simulationSlug="carts-third-law"
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
export default function CartsThirdLawSimulation() {
  return (
    <SimulationWrapper
      simulationSlug="carts-third-law"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <CartsThirdLawContent {...props} />}
    </SimulationWrapper>
  )
}

