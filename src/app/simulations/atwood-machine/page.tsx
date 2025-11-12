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
  Scale,
  ArrowDown,
  ArrowUp
} from 'lucide-react'

interface PulleyData {
  time: number
  position: number
  velocity: number
  acceleration: number
  tensionForce: number
  netForce: number
  mass1Weight: number
  mass2Weight: number
}

const GRAVITY = 9.8 // m/s²

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

class AtwoodMachineEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  // Masses
  private mass1: number = 2.0 // kg (left side, heavier by default)
  private mass2: number = 1.5 // kg (right side, lighter)
  
  // Motion state
  private position: number = 0 // meters (positive = mass1 goes down, mass2 goes up)
  private velocity: number = 0 // m/s
  private acceleration: number = 0 // m/s²
  
  // Pulley position
  private pulleyX: number = 350 // pixels
  private pulleyY: number = 80 // pixels
  private pulleyRadius: number = 30 // pixels
  
  // Rope lengths
  private maxRopeLength: number = 3 // meters on each side
  
  private animationId: number | null = null
  private lastTime: number = 0
  private isRunning: boolean = false
  private time: number = 0
  private pixelsPerMeter: number = 80
  private targetDistance: number = 2 // meters to fall
  
  private onUpdate: (data: {
    time: number
    position: number
    velocity: number
    acceleration: number
    mass1: number
    mass2: number
    tension: number
    equilibriumType: 'static' | 'dynamic' | 'accelerating'
    targetReached: boolean
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
      this.pulleyX = this.canvas.width / 2
    }
  }

  public setMasses(m1: number, m2: number) {
    this.mass1 = m1
    this.mass2 = m2
    this.calculateAcceleration()
  }

  public setTargetDistance(distance: number) {
    this.targetDistance = distance
  }

  private calculateAcceleration() {
    // Atwood machine formula: a = g(m1 - m2)/(m1 + m2)
    this.acceleration = GRAVITY * (this.mass1 - this.mass2) / (this.mass1 + this.mass2)
  }

  public start() {
    if (!this.isRunning) {
      this.calculateAcceleration()
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
    this.position = 0
    this.velocity = 0
    this.time = 0
    this.calculateAcceleration()
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
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.016) // Cap at ~60fps
    this.lastTime = currentTime

    // Update kinematics
    this.velocity += this.acceleration * dt
    this.position += this.velocity * dt

    // Stop if either mass hits limit
    if (Math.abs(this.position) >= this.maxRopeLength) {
      this.position = Math.sign(this.position) * this.maxRopeLength
      this.velocity = 0
      this.pause()
    }

    // Check if target distance reached
    if (Math.abs(this.position) >= this.targetDistance && this.acceleration !== 0) {
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
    // Calculate tension: T = m1*g - m1*a = m1(g - a)
    // Or equivalently: T = m2(g + a)
    const tension = this.mass1 * (GRAVITY - this.acceleration)
    
    let equilibriumType: 'static' | 'dynamic' | 'accelerating'
    if (Math.abs(this.acceleration) < 0.01) {
      if (Math.abs(this.velocity) < 0.01) {
        equilibriumType = 'static'
      } else {
        equilibriumType = 'dynamic'
      }
    } else {
      equilibriumType = 'accelerating'
    }

    this.onUpdate({
      time: this.time,
      position: this.position,
      velocity: this.velocity,
      acceleration: this.acceleration,
      mass1: this.mass1,
      mass2: this.mass2,
      tension: tension,
      equilibriumType: equilibriumType,
      targetReached: Math.abs(this.position) >= this.targetDistance
    })
  }

  private render() {
    const ctx = this.ctx

    // Clear with elegant background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    bgGradient.addColorStop(0, '#f8fafc')
    bgGradient.addColorStop(1, '#e2e8f0')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw subtle grid for reference
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
    ctx.lineWidth = 1
    for (let y = 100; y < this.canvas.height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(this.canvas.width, y)
      ctx.stroke()
    }

    // Draw ceiling
    ctx.fillStyle = '#cbd5e1'
    ctx.fillRect(0, 0, this.canvas.width, 60)
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(0, 58, this.canvas.width, 4)

    // Ceiling mounting bracket
    ctx.fillStyle = '#475569'
    ctx.fillRect(this.pulleyX - 15, 40, 30, 20)
    
    // Pulley mount (realistic fixture)
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.arc(this.pulleyX, this.pulleyY, 8, 0, 2 * Math.PI)
    ctx.fill()

    // Draw pulley wheel (with 3D effect)
    // Outer rim shadow
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(this.pulleyX + 2, this.pulleyY + 2, this.pulleyRadius, 0, 2 * Math.PI)
    ctx.fill()
    
    // Main pulley body
    const pulleyGradient = ctx.createRadialGradient(
      this.pulleyX - 10, this.pulleyY - 10, 5,
      this.pulleyX, this.pulleyY, this.pulleyRadius
    )
    pulleyGradient.addColorStop(0, '#e2e8f0')
    pulleyGradient.addColorStop(1, '#94a3b8')
    ctx.fillStyle = pulleyGradient
    ctx.beginPath()
    ctx.arc(this.pulleyX, this.pulleyY, this.pulleyRadius, 0, 2 * Math.PI)
    ctx.fill()
    
    // Pulley groove
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(this.pulleyX, this.pulleyY, this.pulleyRadius - 5, 0, 2 * Math.PI)
    ctx.stroke()
    
    // Center axle
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.arc(this.pulleyX, this.pulleyY, 6, 0, 2 * Math.PI)
    ctx.fill()
    
    // Axle highlight
    ctx.fillStyle = '#475569'
    ctx.beginPath()
    ctx.arc(this.pulleyX - 2, this.pulleyY - 2, 3, 0, 2 * Math.PI)
    ctx.fill()

    // Calculate mass positions (screen coordinates)
    const mass1Y = this.pulleyY + this.pulleyRadius + (this.maxRopeLength / 2 + this.position) * this.pixelsPerMeter
    const mass2Y = this.pulleyY + this.pulleyRadius + (this.maxRopeLength / 2 - this.position) * this.pixelsPerMeter
    
    const mass1X = this.pulleyX - this.pulleyRadius - 10
    const mass2X = this.pulleyX + this.pulleyRadius + 10

    // Draw rope (realistic with smooth curves)
    ctx.strokeStyle = '#78716c'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    const ropeRadius = this.pulleyRadius - 3 // Rope sits in pulley groove
    
    // Left rope segment (from mass1 to pulley edge)
    ctx.beginPath()
    ctx.moveTo(mass1X, mass1Y - 25)
    ctx.lineTo(mass1X, this.pulleyY + ropeRadius)
    ctx.stroke()
    
    // Rope around pulley (smooth arc from left to right)
    ctx.beginPath()
    ctx.arc(this.pulleyX, this.pulleyY, ropeRadius, Math.PI * 0.5, -Math.PI * 0.5, false)
    ctx.stroke()
    
    // Right rope segment (from pulley edge to mass2)
    ctx.beginPath()
    ctx.moveTo(mass2X, this.pulleyY + ropeRadius)
    ctx.lineTo(mass2X, mass2Y - 25)
    ctx.stroke()
    
    // Rope highlights (for 3D effect on straight segments only)
    ctx.strokeStyle = '#a8a29e'
    ctx.lineWidth = 1.5
    
    // Left highlight
    ctx.beginPath()
    ctx.moveTo(mass1X - 1.5, mass1Y - 25)
    ctx.lineTo(mass1X - 1.5, this.pulleyY + ropeRadius - 5)
    ctx.stroke()
    
    // Right highlight
    ctx.beginPath()
    ctx.moveTo(mass2X + 1.5, this.pulleyY + ropeRadius - 5)
    ctx.lineTo(mass2X + 1.5, mass2Y - 25)
    ctx.stroke()

    // Draw mass blocks with 3D effect
    this.drawMass(ctx, mass1X, mass1Y, this.mass1, '#3b82f6', 'M₁')
    this.drawMass(ctx, mass2X, mass2Y, this.mass2, '#ef4444', 'M₂')

    // Draw force vectors if in motion or showing forces
    if ((this.isRunning || Math.abs(this.velocity) > 0.01) && !this.hasReachedTarget()) {
      this.drawForceVectors(ctx, mass1X, mass1Y, mass2X, mass2Y)
    }

    // Draw reference marks for target distance
    if (this.targetDistance > 0) {
      const targetLineY = this.pulleyY + this.pulleyRadius + (this.maxRopeLength / 2 + this.targetDistance) * this.pixelsPerMeter
      
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 5])
      ctx.beginPath()
      ctx.moveTo(mass1X - 40, targetLineY)
      ctx.lineTo(mass1X + 40, targetLineY)
      ctx.stroke()
      ctx.setLineDash([])
      
      ctx.fillStyle = '#ef4444'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`Target: ${this.targetDistance}m`, mass1X - 45, targetLineY + 4)
    }

    // Draw position indicator (below pulley, not on masses)
    ctx.fillStyle = '#64748b'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Displacement: ${Math.abs(this.position).toFixed(2)}m`, this.pulleyX, this.canvas.height - 50)

    // Equilibrium indicator (at bottom)
    if (Math.abs(this.acceleration) < 0.01) {
      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      if (Math.abs(this.velocity) < 0.01) {
        ctx.fillText('⚖️ STATIC EQUILIBRIUM', this.pulleyX, this.canvas.height - 20)
      } else {
        ctx.fillText('⚖️ DYNAMIC EQUILIBRIUM', this.pulleyX, this.canvas.height - 20)
      }
      ctx.font = '11px sans-serif'
      ctx.fillStyle = '#22c55e'
      ctx.fillText('Equal masses → no net force → a = 0', this.pulleyX, this.canvas.height - 5)
    }
  }

  private drawMass(ctx: CanvasRenderingContext2D, x: number, y: number, mass: number, color: string, label: string) {
    const width = 50
    const height = 50 + mass * 8 // Height scales with mass
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(x - width/2 + 3, y - height/2 + 3, width, height)
    
    // Main body gradient
    const gradient = ctx.createLinearGradient(x - width/2, y - height/2, x + width/2, y - height/2)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.5, this.lightenColor(color))
    gradient.addColorStop(1, color)
    ctx.fillStyle = gradient
    ctx.fillRect(x - width/2, y - height/2, width, height)
    
    // Edge highlight
    ctx.fillStyle = this.lightenColor(color)
    ctx.fillRect(x - width/2, y - height/2, 5, height)
    
    // Bottom shadow
    ctx.fillStyle = this.darkenColor(color)
    ctx.fillRect(x - width/2, y + height/2 - 5, width, 5)
    
    // Border
    ctx.strokeStyle = this.darkenColor(color)
    ctx.lineWidth = 2
    ctx.strokeRect(x - width/2, y - height/2, width, height)
    
    // Label and mass
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x, y - 8)
    ctx.font = '14px sans-serif'
    ctx.fillText(`${mass.toFixed(1)} kg`, x, y + 10)
  }

  private drawForceVectors(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    const vectorScale = 8 // pixels per Newton
    
    // Mass 1 forces
    const weight1 = this.mass1 * GRAVITY
    const tension = this.mass1 * (GRAVITY - this.acceleration)
    
    // Weight vector (down) - red
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1, y1 + weight1 * vectorScale)
    ctx.stroke()
    this.drawArrow(ctx, x1, y1 + weight1 * vectorScale, Math.PI / 2, '#ef4444')
    
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`W₁=${weight1.toFixed(1)}N`, x1 + 10, y1 + weight1 * vectorScale / 2)
    
    // Tension vector (up) - green
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1, y1 - tension * vectorScale)
    ctx.stroke()
    this.drawArrow(ctx, x1, y1 - tension * vectorScale, -Math.PI / 2, '#10b981')
    
    ctx.fillStyle = '#10b981'
    ctx.textAlign = 'left'
    ctx.fillText(`T=${tension.toFixed(1)}N`, x1 + 10, y1 - tension * vectorScale / 2)

    // Mass 2 forces
    const weight2 = this.mass2 * GRAVITY
    
    // Weight vector (down) - red
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2, y2 + weight2 * vectorScale)
    ctx.stroke()
    this.drawArrow(ctx, x2, y2 + weight2 * vectorScale, Math.PI / 2, '#ef4444')
    
    ctx.fillStyle = '#ef4444'
    ctx.textAlign = 'right'
    ctx.fillText(`W₂=${weight2.toFixed(1)}N`, x2 - 10, y2 + weight2 * vectorScale / 2)
    
    // Tension vector (up) - green
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2, y2 - tension * vectorScale)
    ctx.stroke()
    this.drawArrow(ctx, x2, y2 - tension * vectorScale, -Math.PI / 2, '#10b981')
    
    ctx.fillStyle = '#10b981'
    ctx.textAlign = 'right'
    ctx.fillText(`T=${tension.toFixed(1)}N`, x2 - 10, y2 - tension * vectorScale / 2)
  }

  private drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
    const arrowSize = 8
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

  private lightenColor(color: string): string {
    const colors: Record<string, string> = {
      '#3b82f6': '#93c5fd',
      '#ef4444': '#fca5a5',
    }
    return colors[color] || color
  }

  private darkenColor(color: string): string {
    const colors: Record<string, string> = {
      '#3b82f6': '#1e40af',
      '#ef4444': '#991b1b',
    }
    return colors[color] || color
  }

  private hasReachedTarget(): boolean {
    return Math.abs(this.position) >= this.targetDistance
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function AtwoodMachineContent({
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
  const [mass1, setMass1] = useState(2.0) // kg
  const [mass2, setMass2] = useState(1.5) // kg
  const [targetDistance, setTargetDistance] = useState(2.0) // meters
  const [pulleyData, setPulleyData] = useState<PulleyData[]>([])
  const [currentData, setCurrentData] = useState({
    time: 0,
    position: 0,
    velocity: 0,
    acceleration: 0,
    mass1: 2.0,
    mass2: 1.5,
    tension: 0,
    equilibriumType: 'static' as 'static' | 'dynamic' | 'accelerating',
    targetReached: false
  })
  // Use standardized completion tracking
  const completionConfig = getSimulationCriteria('atwood-machine')
  const actionLabelsMap = getActionLabels('atwood-machine')
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
  const engineRef = useRef<AtwoodMachineEngine | null>(null)
  const dataCollectionInterval = useRef<NodeJS.Timeout | null>(null)
  const totalSimulationTime = useRef(0)
  const currentValuesRef = useRef({
    time: 0,
    position: 0,
    velocity: 0,
    acceleration: 0,
    tension: 0
  })

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new AtwoodMachineEngine(
        canvasRef.current,
        (data) => {
          setCurrentData(data)
          currentValuesRef.current = {
            time: data.time,
            position: data.position,
            velocity: data.velocity,
            acceleration: data.acceleration,
            tension: data.tension
          }

          if (data.targetReached && !completionState.isCompleted) {
            markComplete({}, 100)
            onComplete({
              time: data.time,
              acceleration: data.acceleration,
              targetDistance: targetDistance
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=atwood-machine')
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
        const weight1 = mass1 * GRAVITY
        const weight2 = mass2 * GRAVITY
        const netForce = weight1 - weight2
        
        const newDataPoint: PulleyData = {
          time: parseFloat(current.time.toFixed(3)),
          position: parseFloat(current.position.toFixed(3)),
          velocity: parseFloat(current.velocity.toFixed(3)),
          acceleration: parseFloat(current.acceleration.toFixed(3)),
          tensionForce: parseFloat(current.tension.toFixed(2)),
          netForce: parseFloat(netForce.toFixed(2)),
          mass1Weight: parseFloat(weight1.toFixed(2)),
          mass2Weight: parseFloat(weight2.toFixed(2))
        }

        setPulleyData(prev => [...prev, newDataPoint])
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
  }, [isRunning, mass1, mass2])

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
      engineRef.current.setMasses(mass1, mass2)
      engineRef.current.setTargetDistance(targetDistance)
      engineRef.current.start()
      setIsRunning(true)
      handleInteraction('start', { mass1, mass2, targetDistance })
    }
  }

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause()
      setIsRunning(false)
      handleInteraction('pause', { time: currentData.time })
    }
  }

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      setIsRunning(false)
      setPulleyData([])
      // Completion reset handled by resetCompletion()
      handleInteraction('reset', {})
    }
  }

  const handleExportData = () => {
    const csv = [
      'Time (s),Position (m),Velocity (m/s),Acceleration (m/s²),Tension (N),Net Force (N),W1 (N),W2 (N)',
      ...pulleyData.map(d => 
        `${d.time},${d.position},${d.velocity},${d.acceleration},${d.tensionForce},${d.netForce},${d.mass1Weight},${d.mass2Weight}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atwood-machine-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate predicted time to fall target distance
  const calculatePredictedTime = () => {
    const a = GRAVITY * (mass1 - mass2) / (mass1 + mass2)
    if (Math.abs(a) < 0.01) return null // Equilibrium
    
    // d = ½at² → t = √(2d/a)
    const t = Math.sqrt(2 * targetDistance / Math.abs(a))
    return t
  }

  const predictedTime = calculatePredictedTime()

  // Calculate system acceleration
  const systemAcceleration = GRAVITY * (mass1 - mass2) / (mass1 + mass2)
  
  // Calculate tension
  const tension = mass1 * (GRAVITY - systemAcceleration)

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
            <h1 className="text-3xl font-bold mb-2">Atwood Machine: Forces & Equilibrium</h1>
            <p className="text-muted-foreground">
              Study balanced and unbalanced forces using a classic pulley system
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
      {/* Temporarily disabled - completion state not implemented yet
      {!isAdmin && (
        <SimulationProgress 
          state={completionState}
          actionLabels={actionLabelsMap}
          hideWhenComplete={false}
          className="mb-6"
        />
      )}
      */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pulley System */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atwood Machine</CardTitle>
              <CardDescription>
                Two masses connected by a rope over a frictionless pulley
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
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-700 font-medium mb-1">Position</div>
                  <div className="text-lg font-mono text-green-900">{Math.abs(currentData.position).toFixed(2)}m</div>
                  <div className="text-xs text-green-600">
                    {mass1 > mass2 ? 'M₁ down ↓' : mass2 > mass1 ? 'M₂ down ↓' : 'Balanced'}
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-700 font-medium mb-1">Acceleration</div>
                  <div className="text-lg font-bold text-purple-900">
                    {Math.abs(currentData.acceleration).toFixed(2)} m/s²
                  </div>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-700 font-medium mb-1">Tension</div>
                  <div className="text-lg font-bold text-orange-900">{currentData.tension.toFixed(1)} N</div>
                </div>
              </div>

              {/* Status Display */}
              <div className="mt-4">
                {currentData.equilibriumType === 'static' ? (
                  <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg text-center">
                    <div className="text-sm font-semibold text-green-900">
                      ⚖️ Static Equilibrium: Masses are balanced!
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      Equal masses → F<sub>net</sub> = 0 → a = 0 → v = 0 (at rest)
                    </div>
                  </div>
                ) : currentData.equilibriumType === 'dynamic' ? (
                  <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
                    <div className="text-sm font-semibold text-blue-900">
                      ⚖️ Dynamic Equilibrium: Moving at constant velocity!
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Equal masses → F<sub>net</sub> = 0 → a = 0 → v = constant
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-orange-50 border-2 border-orange-200 rounded-lg text-center">
                    <div className="text-sm font-semibold text-orange-900">
                      ⚡ Accelerating: Unbalanced forces!
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      M₁ ({mass1}kg) {'>'} M₂ ({mass2}kg) → F<sub>net</sub> = {((mass1 - mass2) * GRAVITY).toFixed(1)}N → a = {systemAcceleration.toFixed(2)} m/s²
                    </div>
                  </div>
                )}
              </div>

              {/* Target Reached */}
              {currentData.targetReached && (
                <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <div className="text-lg font-bold text-purple-900 mb-2">
                    🎯 Target Distance Reached!
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-purple-700"><strong>Actual Time:</strong></div>
                      <div className="text-purple-900 font-mono text-lg">{currentData.time.toFixed(2)}s</div>
                    </div>
                    <div>
                      <div className="text-purple-700"><strong>Predicted Time:</strong></div>
                      <div className="text-purple-900 font-mono text-lg">
                        {predictedTime ? predictedTime.toFixed(2) : 'N/A'}s
                      </div>
                    </div>
                  </div>
                  {predictedTime && Math.abs(currentData.time - predictedTime) < 0.1 && (
                    <div className="mt-2 text-xs text-purple-700 bg-purple-100 p-2 rounded text-center">
                      ✓ Perfect match! Your calculation was correct!
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Graphs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="motion" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="motion">Motion Graph</TabsTrigger>
                  <TabsTrigger value="table">Data Table</TabsTrigger>
                </TabsList>

                <TabsContent value="motion" className="space-y-2">
                  <h4 className="font-semibold text-sm">Position vs. Time</h4>
                  <div className="h-64 bg-white border rounded-lg p-4 relative">
                    {pulleyData.length === 0 ? (
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
                        <polyline
                          points={pulleyData.map((d, i) => {
                            const x = (i / Math.max(pulleyData.length - 1, 1)) * 100
                            const maxPos = Math.max(...pulleyData.map(p => Math.abs(p.position)), 0.1)
                            const y = 50 - (d.position / maxPos) * 45
                            return `${x},${y}`
                          }).join(' ')}
                          stroke="#8b5cf6"
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
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.abs(systemAcceleration) < 0.01 
                      ? "Equilibrium: Horizontal line (constant position or velocity)"
                      : "Accelerating: Parabolic curve (position = ½at²)"
                    }
                  </p>
                </TabsContent>

                <TabsContent value="table" className="space-y-4">
                  <div className="max-h-80 overflow-y-auto border rounded-lg">
                    {pulleyData.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <TableIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Start simulation to collect data</p>
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Time</th>
                            <th className="p-2 text-left">Position</th>
                            <th className="p-2 text-left">Velocity</th>
                            <th className="p-2 text-left">Accel</th>
                            <th className="p-2 text-left">Tension</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pulleyData.map((d, i) => (
                            <tr key={i} className="border-t hover:bg-muted/50">
                              <td className="p-2">{d.time}s</td>
                              <td className="p-2 font-mono text-purple-700">{d.position.toFixed(3)}</td>
                              <td className="p-2 font-mono text-blue-700">{d.velocity.toFixed(3)}</td>
                              <td className="p-2 font-mono text-orange-700">{d.acceleration.toFixed(3)}</td>
                              <td className="p-2 font-mono text-green-700">{d.tensionForce.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {pulleyData.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {pulleyData.length} data points (every 0.1s)
                      </div>
                      <Button size="sm" variant="outline" onClick={handleExportData} className="w-full">
                        <Download className="h-3 w-3 mr-1" />
                        Download CSV
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          {/* Setup Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mass 1 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Mass 1 (M₁) - Blue</label>
                  <span className="text-sm text-muted-foreground">{mass1.toFixed(1)} kg</span>
                </div>
                <Slider
                  value={[mass1]}
                  onValueChange={([value]) => setMass1(value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  disabled={isRunning}
                />
              </div>

              {/* Mass 2 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Mass 2 (M₂) - Red</label>
                  <span className="text-sm text-muted-foreground">{mass2.toFixed(1)} kg</span>
                </div>
                <Slider
                  value={[mass2]}
                  onValueChange={([value]) => setMass2(value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  disabled={isRunning}
                />
              </div>

              {/* Target Distance */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Target Distance</label>
                  <span className="text-sm text-muted-foreground">{targetDistance.toFixed(1)} m</span>
                </div>
                <Slider
                  value={[targetDistance]}
                  onValueChange={([value]) => setTargetDistance(value)}
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  disabled={isRunning}
                />
                <p className="text-xs text-muted-foreground">
                  System stops when this distance is reached
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
                  Release System
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

          {/* Physics Analysis */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">⚖️ Force Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded-lg">
                <div className="font-semibold text-blue-900 mb-2">System Acceleration</div>
                <div className="text-base font-mono bg-blue-50 p-2 rounded text-center">
                  a = g(M₁ - M₂)/(M₁ + M₂)
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs text-blue-700">
                    = 9.8 × ({mass1.toFixed(1)} - {mass2.toFixed(1)}) / ({mass1.toFixed(1)} + {mass2.toFixed(1)})
                  </div>
                  <div className="text-lg font-bold text-blue-900 mt-1">
                    = {systemAcceleration.toFixed(2)} m/s²
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg">
                <div className="font-semibold text-green-900 mb-2">Rope Tension</div>
                <div className="text-base font-mono bg-green-50 p-2 rounded text-center">
                  T = M₁(g - a)
                </div>
                <div className="mt-2 text-center">
                  <div className="text-lg font-bold text-green-900">
                    = {tension.toFixed(1)} N
                  </div>
                </div>
              </div>

              {predictedTime && (
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-semibold text-purple-900 mb-2">Predicted Time</div>
                  <div className="text-base font-mono bg-purple-50 p-2 rounded text-center">
                    t = √(2d/a)
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs text-purple-700">
                      = √(2 × {targetDistance} / {Math.abs(systemAcceleration).toFixed(2)})
                    </div>
                    <div className="text-lg font-bold text-purple-900 mt-1">
                      = {predictedTime.toFixed(2)} seconds
                    </div>
                  </div>
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
                <li><strong>Equal masses (2.0, 2.0):</strong> Static equilibrium - no motion</li>
                <li><strong>Unequal masses (2.0, 1.5):</strong> Accelerated motion</li>
                <li><strong>Calculate time:</strong> Predict before running, then verify!</li>
                <li><strong>Large difference:</strong> Try (4.0, 1.0) - fast acceleration</li>
                <li><strong>Small difference:</strong> Try (2.0, 1.9) - slow acceleration</li>
                <li><strong>Check tension:</strong> Always between the two weights!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="atwood-machine"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={completionState.isCompleted}
          simulationData={{
            time: currentData.time,
            acceleration: currentData.acceleration,
            targetDistance: targetDistance
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
          simulationSlug="atwood-machine"
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
export default function AtwoodMachineSimulation() {
  return (
    <SimulationWrapper
      simulationSlug="atwood-machine"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <AtwoodMachineContent {...props} />}
    </SimulationWrapper>
  )
}

