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
  Wind,
  Circle
} from 'lucide-react'

interface FallData {
  time: number
  featherPosition: number
  featherVelocity: number
  featherAcceleration: number
  ballPosition: number
  ballVelocity: number
  ballAcceleration: number
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

const GRAVITY = 9.8 // m/s²
const CHAMBER_HEIGHT = 10 // meters
const FEATHER_MASS = 0.005 // kg (5 grams)
const FEATHER_AREA = 0.01 // m² (cross-sectional area)
const FEATHER_DRAG_COEFFICIENT = 1.3
const BALL_MASS = 7.26 // kg (16 lb bowling ball)
const BALL_AREA = 0.0367 // m² (diameter ~21.6 cm)
const BALL_DRAG_COEFFICIENT = 0.47

class VacuumChamberEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  // Feather state
  private featherY: number = 0.5 // meters from top
  private featherVy: number = 0 // m/s (downward is positive)
  
  // Ball state
  private ballY: number = 0.5 // meters from top
  private ballVy: number = 0 // m/s
  
  // Environment
  private airDensity: number = 0 // kg/m³ (0 = vacuum, 1.225 = sea level)
  
  private animationId: number | null = null
  private lastTime: number = 0
  private isRunning: boolean = false
  private time: number = 0
  private pixelsPerMeter: number = 45
  private chamberHeight: number = CHAMBER_HEIGHT
  
  private onUpdate: (data: {
    featherY: number
    featherVy: number
    featherAy: number
    ballY: number
    ballVy: number
    ballAy: number
    time: number
    featherLanded: boolean
    ballLanded: boolean
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
      this.canvas.width = Math.min(container.clientWidth, 600)
      this.canvas.height = 500
      this.pixelsPerMeter = (this.canvas.height - 100) / this.chamberHeight
    }
  }

  public setAirDensity(density: number) {
    this.airDensity = density
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
    this.featherY = 0.5
    this.featherVy = 0
    this.ballY = 0.5
    this.ballVy = 0
    this.time = 0
    this.render()
    this.sendUpdate()
  }

  public destroy() {
    this.pause()
    window.removeEventListener('resize', () => this.resizeCanvas())
  }

  private calculateDragForce(velocity: number, area: number, dragCoeff: number): number {
    // Drag force: F_d = 0.5 × ρ × v² × C_d × A
    // This force opposes motion (negative if falling down)
    if (this.airDensity === 0) return 0
    return 0.5 * this.airDensity * velocity * Math.abs(velocity) * dragCoeff * area
  }

  private animate() {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.02) // Small time steps
    this.lastTime = currentTime

    // Calculate drag forces (oppose motion)
    const featherDrag = this.calculateDragForce(this.featherVy, FEATHER_AREA, FEATHER_DRAG_COEFFICIENT)
    const ballDrag = this.calculateDragForce(this.ballVy, BALL_AREA, BALL_DRAG_COEFFICIENT)

    // Net forces
    const featherNetForce = FEATHER_MASS * GRAVITY - featherDrag // Weight - drag
    const ballNetForce = BALL_MASS * GRAVITY - ballDrag

    // Accelerations: a = F_net / m
    const featherAy = featherNetForce / FEATHER_MASS
    const ballAy = ballNetForce / BALL_MASS

    // Update velocities if not landed
    // Floor is at chamberHeight - 0.8 (just above the platform)
    const floorPosition = this.chamberHeight - 0.8
    const featherLanded = this.featherY >= floorPosition
    const ballLanded = this.ballY >= floorPosition

    if (!featherLanded) {
      this.featherVy += featherAy * dt
      this.featherY += this.featherVy * dt
      
      // Clamp to floor exactly
      if (this.featherY >= floorPosition) {
        this.featherY = floorPosition
        this.featherVy = 0
      }
    }

    if (!ballLanded) {
      this.ballVy += ballAy * dt
      this.ballY += this.ballVy * dt
      
      // Clamp to floor exactly
      if (this.ballY >= floorPosition) {
        this.ballY = floorPosition
        this.ballVy = 0
      }
    }

    // Stop simulation if both landed
    if (featherLanded && ballLanded) {
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
    // Calculate current accelerations for display
    const featherDrag = this.calculateDragForce(this.featherVy, FEATHER_AREA, FEATHER_DRAG_COEFFICIENT)
    const ballDrag = this.calculateDragForce(this.ballVy, BALL_AREA, BALL_DRAG_COEFFICIENT)
    
    const featherAy = (FEATHER_MASS * GRAVITY - featherDrag) / FEATHER_MASS
    const ballAy = (BALL_MASS * GRAVITY - ballDrag) / BALL_MASS

    const floorPosition = this.chamberHeight - 0.8

    this.onUpdate({
      featherY: this.featherY,
      featherVy: this.featherVy,
      featherAy: featherAy,
      ballY: this.ballY,
      ballVy: this.ballVy,
      ballAy: ballAy,
      time: this.time,
      featherLanded: this.featherY >= floorPosition,
      ballLanded: this.ballY >= floorPosition
    })
  }

  private render() {
    const ctx = this.ctx

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Chamber dimensions
    const chamberX = 60
    const chamberY = 80
    const chamberWidth = this.canvas.width - 120
    const chamberHeight = this.canvas.height - 120

    // Draw chamber background gradient
    const airOpacity = this.airDensity / 1.225
    const gradient = ctx.createLinearGradient(chamberX, chamberY, chamberX, chamberY + chamberHeight)
    gradient.addColorStop(0, `rgba(200, 220, 255, ${airOpacity * 0.2})`)
    gradient.addColorStop(1, `rgba(135, 206, 235, ${airOpacity * 0.4})`)
    ctx.fillStyle = gradient
    ctx.fillRect(chamberX, chamberY, chamberWidth, chamberHeight)

    // Draw chamber walls (thick glass appearance)
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(chamberX - 10, chamberY - 10, chamberWidth + 20, 10) // Top
    ctx.fillRect(chamberX - 10, chamberY, 10, chamberHeight) // Left
    ctx.fillRect(chamberX + chamberWidth, chamberY, 10, chamberHeight) // Right
    ctx.fillRect(chamberX - 10, chamberY + chamberHeight, chamberWidth + 20, 10) // Bottom

    // Draw chamber inner border
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    ctx.strokeRect(chamberX, chamberY, chamberWidth, chamberHeight)

    // Draw measurement scale on left
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1
    ctx.font = '10px sans-serif'
    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 10; i++) {
      const y = chamberY + (i / 10) * (chamberHeight - 40)
      ctx.beginPath()
      ctx.moveTo(chamberX - 15, y)
      ctx.lineTo(chamberX - 5, y)
      ctx.stroke()
      ctx.fillText(`${i}m`, chamberX - 20, y + 3)
    }

    // Draw floor (platform at bottom) - positioned to match floorPosition calculation
    const floorY = chamberY + (this.chamberHeight - 0.8) * this.pixelsPerMeter
    ctx.fillStyle = '#475569'
    ctx.fillRect(chamberX, floorY, chamberWidth, chamberY + chamberHeight - floorY)
    
    // Floor top surface highlight
    ctx.fillStyle = '#64748b'
    ctx.fillRect(chamberX, floorY, chamberWidth, 3)
    
    // Draw floor support lines (visual detail)
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      const x = chamberX + (chamberWidth / 5) * i
      ctx.beginPath()
      ctx.moveTo(x, floorY + 3)
      ctx.lineTo(x, chamberY + chamberHeight)
      ctx.stroke()
    }

    // Calculate screen positions (objects fall within chamber)
    const featherScreenX = chamberX + chamberWidth * 0.35
    const featherScreenY = chamberY + 15 + this.featherY * this.pixelsPerMeter

    const ballScreenX = chamberX + chamberWidth * 0.65
    const ballScreenY = chamberY + 15 + this.ballY * this.pixelsPerMeter

    // Draw release mechanism at top (where objects start)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(featherScreenX - 20, chamberY + 5)
    ctx.lineTo(featherScreenX + 20, chamberY + 5)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(ballScreenX - 20, chamberY + 5)
    ctx.lineTo(ballScreenX + 20, chamberY + 5)
    ctx.stroke()

    // Draw feather with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.font = '45px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🪶', featherScreenX, featherScreenY)
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Draw bowling ball with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.font = '45px sans-serif'
    ctx.fillText('🎳', ballScreenX, ballScreenY)
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Draw object labels OUTSIDE chamber at top
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Feather', featherScreenX, chamberY - 50)
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#64748b'
    ctx.fillText('5g', featherScreenX, chamberY - 30)

    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('Bowling Ball', ballScreenX, chamberY - 50)
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#64748b'
    ctx.fillText('7.26kg', ballScreenX, chamberY - 30)

    // Draw height markers for each object (dotted lines)
    const floorPosition = this.chamberHeight - 0.8
    
    if (this.featherY > 0.1 && this.featherY < floorPosition) {
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(chamberX + 5, featherScreenY)
      ctx.lineTo(chamberX + chamberWidth * 0.25, featherScreenY)
      ctx.stroke()
      ctx.setLineDash([])
      
      ctx.fillStyle = '#a855f7'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${this.featherY.toFixed(1)}m`, chamberX + 10, featherScreenY - 5)
    }

    if (this.ballY > 0.1 && this.ballY < floorPosition) {
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(chamberX + chamberWidth * 0.75, ballScreenY)
      ctx.lineTo(chamberX + chamberWidth - 5, ballScreenY)
      ctx.stroke()
      ctx.setLineDash([])
      
      ctx.fillStyle = '#f97316'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${this.ballY.toFixed(1)}m`, chamberX + chamberWidth - 10, ballScreenY - 5)
    }
    
    // Draw "LANDED" indicators when objects hit floor
    if (this.featherY >= floorPosition) {
      ctx.fillStyle = '#a855f7'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('LANDED', featherScreenX, floorY - 50)
    }
    
    if (this.ballY >= floorPosition) {
      ctx.fillStyle = '#f97316'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('LANDED', ballScreenX, floorY - 50)
    }

    // Air density indicator OUTSIDE chamber at bottom
    const indicatorY = chamberY + chamberHeight + 25
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    if (this.airDensity === 0) {
      ctx.fillStyle = '#64748b'
      ctx.fillText('🌑 VACUUM (No Air)', this.canvas.width / 2, indicatorY)
    } else if (this.airDensity >= 1.2) {
      ctx.fillStyle = '#3b82f6'
      ctx.fillText('🌍 FULL AIR (Sea Level)', this.canvas.width / 2, indicatorY)
    } else {
      ctx.fillStyle = '#0891b2'
      ctx.fillText(`🌫️ PARTIAL AIR (${(airOpacity * 100).toFixed(0)}%)`, this.canvas.width / 2, indicatorY)
    }

    // Draw air particles if air present
    if (this.airDensity > 0) {
      ctx.fillStyle = `rgba(59, 130, 246, ${airOpacity * 0.4})`
      const numParticles = Math.floor(airOpacity * 30)
      for (let i = 0; i < numParticles; i++) {
        const x = chamberX + (i * 37) % chamberWidth
        const y = chamberY + (i * 53 + this.time * 20) % (chamberHeight - 40)
        ctx.fillRect(x, y, 2, 2)
      }
    }
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function VacuumChamberContent({
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
  const [airDensity, setAirDensity] = useState(0) // 0 = vacuum, 1.225 = sea level
  const [fallData, setFallData] = useState<FallData[]>([])
  const [currentData, setCurrentData] = useState({
    time: 0,
    featherY: 0.5,
    featherVy: 0,
    featherAy: 0,
    ballY: 0.5,
    ballVy: 0,
    ballAy: 0,
    featherLanded: false,
    ballLanded: false
  })
  const [simulationCompleted, setSimulationCompleted] = useState(false)

  // Assignment state
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [editingAssignment, setEditingAssignment] = useState<any>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<VacuumChamberEngine | null>(null)
  const dataCollectionInterval = useRef<NodeJS.Timeout | null>(null)
  const totalSimulationTime = useRef(0)
  const currentValuesRef = useRef({
    time: 0,
    featherY: 0,
    featherVy: 0,
    featherAy: 0,
    ballY: 0,
    ballVy: 0,
    ballAy: 0
  })

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new VacuumChamberEngine(
        canvasRef.current,
        (data) => {
          setCurrentData(data)
          currentValuesRef.current = {
            time: data.time,
            featherY: data.featherY,
            featherVy: data.featherVy,
            featherAy: data.featherAy,
            ballY: data.ballY,
            ballVy: data.ballVy,
            ballAy: data.ballAy
          }

          // Check if both landed
          if (data.featherLanded && data.ballLanded && !simulationCompleted) {
            setSimulationCompleted(true)
            onComplete({
              airDensity: airDensity,
              featherTime: data.time,
              ballTime: data.time,
              dataPoints: fallData.length
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=vacuum-chamber')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  // Data collection every 0.1 seconds
  useEffect(() => {
    if (isRunning) {
      dataCollectionInterval.current = setInterval(() => {
        const current = currentValuesRef.current
        
        const newDataPoint: FallData = {
          time: parseFloat(current.time.toFixed(3)),
          featherPosition: parseFloat(current.featherY.toFixed(3)),
          featherVelocity: parseFloat(current.featherVy.toFixed(3)),
          featherAcceleration: parseFloat(current.featherAy.toFixed(3)),
          ballPosition: parseFloat(current.ballY.toFixed(3)),
          ballVelocity: parseFloat(current.ballVy.toFixed(3)),
          ballAcceleration: parseFloat(current.ballAy.toFixed(3))
        }

        setFallData(prev => [...prev, newDataPoint])
      }, 100)
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

  const handleStart = () => {
    if (engineRef.current) {
      engineRef.current.setAirDensity(airDensity)
      engineRef.current.start()
      setIsRunning(true)
      onInteraction('start', { airDensity })
    }
  }

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause()
      setIsRunning(false)
      onInteraction('pause', { time: currentData.time, dataPoints: fallData.length })
    }
  }

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      setIsRunning(false)
      setFallData([])
      setSimulationCompleted(false)
      onInteraction('reset', {})
    }
  }

  const handleAirDensityChange = (value: number) => {
    setAirDensity(value)
    if (engineRef.current) {
      engineRef.current.setAirDensity(value)
    }
    onInteraction('change-air-density', { airDensity: value })
  }

  const handleExportData = () => {
    const csv = [
      'Time (s),Feather Pos (m),Feather Vel (m/s),Feather Acc (m/s²),Ball Pos (m),Ball Vel (m/s),Ball Acc (m/s²)',
      ...fallData.map(d => 
        `${d.time},${d.featherPosition},${d.featherVelocity},${d.featherAcceleration},${d.ballPosition},${d.ballVelocity},${d.ballAcceleration}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vacuum-chamber-${airDensity === 0 ? 'vacuum' : 'air'}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyForDesmos = () => {
    const featherPosData = fallData.map(d => `(${d.time},${d.featherPosition})`).join(',')
    const ballPosData = fallData.map(d => `(${d.time},${d.ballPosition})`).join(',')
    
    const desmosText = `Feather Position vs Time:\n${featherPosData}\n\nBall Position vs Time:\n${ballPosData}`
    
    navigator.clipboard.writeText(desmosText).then(() => {
      alert('Data copied! Paste into Desmos:\n\n1. Table for Feather\n2. Table for Ball\n\nCompare the curves!')
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  // Calculate air percentage for UI
  const airPercentage = (airDensity / 1.225) * 100

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
            <h1 className="text-3xl font-bold mb-2">Vacuum Chamber: Feather vs. Bowling Ball</h1>
            <p className="text-muted-foreground">
              Watch how air resistance affects falling objects - see what happens in a vacuum!
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
        {/* Left Column: Chamber */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vacuum Chamber */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vacuum Chamber</CardTitle>
              <CardDescription>
                Drop a feather and bowling ball - adjust air pressure to see the effect!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas 
                ref={canvasRef}
                className="w-full border-2 border-border rounded-lg bg-white"
              />

              {/* Real-time Metrics */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700 font-medium mb-1">Time</div>
                  <div className="text-2xl font-bold text-blue-900">{currentData.time.toFixed(2)}s</div>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-700 font-medium mb-1">Feather</div>
                  <div className="text-sm font-mono text-purple-900">
                    {currentData.featherY.toFixed(2)}m
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    {currentData.featherVy.toFixed(2)} m/s
                  </div>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-700 font-medium mb-1">Ball</div>
                  <div className="text-sm font-mono text-orange-900">
                    {currentData.ballY.toFixed(2)}m
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    {currentData.ballVy.toFixed(2)} m/s
                  </div>
                </div>
              </div>

              {/* Landing Status */}
              {(currentData.featherLanded || currentData.ballLanded) && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="text-sm font-semibold text-green-900 mb-2">Landing Results:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                    <div>
                      🪶 Feather: {currentData.featherLanded ? `✓ Landed` : 'Still falling...'}
                    </div>
                    <div>
                      🎳 Ball: {currentData.ballLanded ? `✓ Landed` : 'Still falling...'}
                    </div>
                  </div>
                  {currentData.featherLanded && currentData.ballLanded && (
                    <div className="mt-2 text-center text-sm font-bold text-green-900">
                      {airDensity === 0 
                        ? "✨ Both landed at the SAME TIME! (In vacuum, all objects fall equally)"
                        : "Bowling ball landed first (air resistance affected feather more)"
                      }
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="position">Position</TabsTrigger>
                  <TabsTrigger value="velocity">Velocity</TabsTrigger>
                  <TabsTrigger value="table">Data</TabsTrigger>
                </TabsList>

                {/* Position Graph */}
                <TabsContent value="position" className="space-y-2">
                  <h4 className="font-semibold text-sm">Position vs. Time</h4>
                  <div className="h-64 bg-white border rounded-lg p-4 relative">
                    {fallData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 opacity-50" />
                      </div>
                    ) : (
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <g stroke="#e5e7eb" strokeWidth="0.2">
                          {[0, 25, 50, 75, 100].map(y => (
                            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} />
                          ))}
                        </g>
                        
                        {/* Feather (purple) */}
                        <polyline
                          points={fallData.map((d, i) => {
                            const x = (i / Math.max(fallData.length - 1, 1)) * 100
                            const y = (d.featherPosition / 10) * 90
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#a855f7"
                          strokeWidth="1.5"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                        
                        {/* Ball (orange) */}
                        <polyline
                          points={fallData.map((d, i) => {
                            const x = (i / Math.max(fallData.length - 1, 1)) * 100
                            const y = (d.ballPosition / 10) * 90
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#f97316"
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
                      Position (m)
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs justify-center">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span>Feather</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>Ball</span>
                    </div>
                  </div>
                </TabsContent>

                {/* Velocity Graph */}
                <TabsContent value="velocity" className="space-y-2">
                  <h4 className="font-semibold text-sm">Velocity vs. Time</h4>
                  <div className="h-64 bg-white border rounded-lg p-4 relative">
                    {fallData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 opacity-50" />
                      </div>
                    ) : (
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <g stroke="#e5e7eb" strokeWidth="0.2">
                          {[0, 25, 50, 75, 100].map(y => (
                            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} />
                          ))}
                        </g>
                        
                        {/* Feather velocity */}
                        <polyline
                          points={fallData.map((d, i) => {
                            const x = (i / Math.max(fallData.length - 1, 1)) * 100
                            const maxV = Math.max(...fallData.map(p => Math.max(p.featherVelocity, p.ballVelocity)), 1)
                            const y = 100 - (d.featherVelocity / maxV) * 90
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#a855f7"
                          strokeWidth="1.5"
                          fill="none"
                          vectorEffect="non-scaling-stroke"
                        />
                        
                        {/* Ball velocity */}
                        <polyline
                          points={fallData.map((d, i) => {
                            const x = (i / Math.max(fallData.length - 1, 1)) * 100
                            const maxV = Math.max(...fallData.map(p => Math.max(p.featherVelocity, p.ballVelocity)), 1)
                            const y = 100 - (d.ballVelocity / maxV) * 90
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#f97316"
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
                  <p className="text-xs text-muted-foreground text-center">
                    {airDensity === 0 
                      ? "In vacuum: Both curves should overlap perfectly!"
                      : "With air: Feather curve flattens (reaches terminal velocity)"
                    }
                  </p>
                </TabsContent>

                {/* Data Table */}
                <TabsContent value="table" className="space-y-4">
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {fallData.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <TableIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start simulation to collect data</p>
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Time</th>
                            <th className="p-2 text-left">🪶 Pos</th>
                            <th className="p-2 text-left">🪶 Vel</th>
                            <th className="p-2 text-left">🎳 Pos</th>
                            <th className="p-2 text-left">🎳 Vel</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fallData.map((d, i) => (
                            <tr key={i} className="border-t hover:bg-muted/50">
                              <td className="p-2">{d.time}s</td>
                              <td className="p-2 font-mono text-purple-700">{d.featherPosition.toFixed(2)}</td>
                              <td className="p-2 font-mono text-purple-600">{d.featherVelocity.toFixed(2)}</td>
                              <td className="p-2 font-mono text-orange-700">{d.ballPosition.toFixed(2)}</td>
                              <td className="p-2 font-mono text-orange-600">{d.ballVelocity.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {fallData.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {fallData.length} data points (every 0.1s)
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

        {/* Right Column: Controls */}
        <div className="space-y-6">
          {/* Air Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Air Pressure Control</CardTitle>
              <CardDescription>Adjust before dropping</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Air Density Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Air Amount</label>
                  <Badge variant={airDensity === 0 ? "default" : "secondary"}>
                    {airDensity === 0 ? (
                      <><Circle className="h-3 w-3 mr-1" />Vacuum</>
                    ) : (
                      <><Wind className="h-3 w-3 mr-1" />{airPercentage.toFixed(0)}%</>
                    )}
                  </Badge>
                </div>
                <Slider
                  value={[airDensity]}
                  onValueChange={([value]) => handleAirDensityChange(value)}
                  min={0}
                  max={1.225}
                  step={0.1225}
                  disabled={isRunning}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>🌑 Vacuum</span>
                  <span>🌍 Sea Level</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={airDensity === 0 ? "default" : "outline"}
                  onClick={() => handleAirDensityChange(0)}
                  disabled={isRunning}
                  className="text-xs"
                >
                  <Circle className="h-3 w-3 mr-1" />
                  Vacuum
                </Button>
                <Button
                  size="sm"
                  variant={airDensity >= 1.2 ? "default" : "outline"}
                  onClick={() => handleAirDensityChange(1.225)}
                  disabled={isRunning}
                  className="text-xs"
                >
                  <Wind className="h-3 w-3 mr-1" />
                  Full Air
                </Button>
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
                      Drop Objects
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

          {/* Key Concepts */}
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-green-900">🔬 The Science</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded-lg border-2 border-blue-200">
                <div className="font-semibold text-blue-900 mb-1">In a Vacuum</div>
                <p className="text-xs text-blue-800 mb-2">
                  Without air resistance, ALL objects fall at the same rate regardless of mass!
                </p>
                <div className="text-xs text-blue-700 font-mono bg-blue-50 p-2 rounded text-center">
                  a = g = 9.8 m/s² (for all objects)
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-cyan-200">
                <div className="font-semibold text-cyan-900 mb-1">With Air Resistance</div>
                <p className="text-xs text-cyan-800 mb-2">
                  Drag force opposes motion and depends on speed, area, and shape.
                </p>
                <div className="text-xs text-cyan-700 font-mono bg-cyan-50 p-2 rounded text-center">
                  F<sub>drag</sub> = ½ρv²C<sub>d</sub>A
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-orange-200">
                <div className="font-semibold text-orange-900 mb-1">Why Different Rates?</div>
                <ul className="text-xs text-orange-800 space-y-1 list-disc list-inside">
                  <li>Feather: Large area, small mass</li>
                  <li>Ball: Small area, large mass</li>
                  <li>Drag/weight ratio very different!</li>
                  <li>Feather reaches terminal velocity quickly</li>
                </ul>
              </div>

              <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900">
                <strong>💡 Fun Fact:</strong> This was demonstrated on the Moon by Apollo 15 astronaut David Scott in 1971!
              </div>
            </CardContent>
          </Card>

          {/* Try This */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Try This!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li><strong>Vacuum first:</strong> Set air to 0%, watch them fall together</li>
                <li><strong>Add air:</strong> Increase to 100%, see the difference</li>
                <li><strong>Compare curves:</strong> Feather flattens (terminal velocity)</li>
                <li><strong>Calculate:</strong> In vacuum, time to fall 10m = √(2h/g) ≈ 1.43s</li>
                <li><strong>Observe:</strong> Feather acceleration drops as speed increases</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="vacuum-chamber"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={simulationCompleted}
          simulationData={{
            dataPoints: fallData,
            airDensity: airDensity,
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
          simulationSlug="vacuum-chamber"
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
export default function VacuumChamberSimulation() {
  return (
    <SimulationWrapper
      simulationSlug="vacuum-chamber"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <VacuumChamberContent {...props} />}
    </SimulationWrapper>
  )
}

