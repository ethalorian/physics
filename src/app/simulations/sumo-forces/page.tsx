"use client"
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SimulationWrapper } from '@/components/simulations/SimulationWrapper'
import SimulationAssignment from '@/components/simulations/SimulationAssignment'
import SimulationAssignmentEditor from '@/components/simulations/SimulationAssignmentEditor'
import { RotateCcw, Play, Pause, Info, Trophy, TrendingUp, Activity, Plus, Settings, FileText } from 'lucide-react'
import MathMarkdown from '@/components/MathMarkdown'
import { Line } from 'recharts'
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface SimulationState {
  // Wrestler properties
  redMass: number
  blueMass: number
  redForce: number
  blueForce: number
  
  // Physics state
  position: number // Position on the mat (-100 to +100)
  velocity: number
  acceleration: number
  netForce: number
  totalMass: number
  
  // Simulation state
  isRunning: boolean
  time: number
  winner: 'red' | 'blue' | null
}

interface KinematicsData {
  time: number
  position: number
  velocity: number
  acceleration: number
  netForce: number
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

class SumoPhysicsEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private state: SimulationState
  private kinematicsHistory: KinematicsData[]
  private animationId: number | null = null
  private lastTime: number = 0
  private onUpdate: (state: SimulationState, kinematics: KinematicsData[]) => void
  private resizeHandler = () => this.resizeCanvas()
  
  // Ring properties
  private ringRadius: number = 150
  private ringCenter: { x: number; y: number }
  private wrestlerSize: number = 60
  
  constructor(canvas: HTMLCanvasElement, onUpdate: (state: SimulationState, kinematics: KinematicsData[]) => void) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.onUpdate = onUpdate
    this.ringCenter = { x: canvas.width / 2, y: canvas.height / 2 }
    
    this.state = {
      redMass: 150, // kg
      blueMass: 150, // kg
      redForce: 500, // N
      blueForce: 500, // N
      position: 0,
      velocity: 0,
      acceleration: 0,
      netForce: 0,
      totalMass: 300,
      isRunning: false,
      time: 0,
      winner: null
    }
    
    this.kinematicsHistory = []
    this.resizeCanvas()
    this.setupResize()
    this.render()
  }
  
  private resizeCanvas() {
    const rect = this.canvas.parentElement?.getBoundingClientRect()
    if (rect) {
      this.canvas.width = rect.width
      this.canvas.height = Math.min(rect.height, 400)
      this.ringCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 }
      this.render()
    }
  }
  
  private setupResize() {
    window.addEventListener('resize', this.resizeHandler)
  }
  
  public setRedForce(force: number) {
    this.state.redForce = force
    this.updatePhysics()
  }
  
  public setBlueForce(force: number) {
    this.state.blueForce = force
    this.updatePhysics()
  }
  
  public setRedMass(mass: number) {
    this.state.redMass = mass
    this.state.totalMass = this.state.redMass + this.state.blueMass
    this.updatePhysics()
  }
  
  public setBlueMass(mass: number) {
    this.state.blueMass = mass
    this.state.totalMass = this.state.redMass + this.state.blueMass
    this.updatePhysics()
  }
  
  private updatePhysics() {
    // Calculate net force (positive = red winning, negative = blue winning)
    this.state.netForce = this.state.redForce - this.state.blueForce
    
    // Calculate acceleration using F = ma
    this.state.acceleration = this.state.netForce / this.state.totalMass
    
    // Only update React state if not animating (to avoid re-render loops)
    if (!this.state.isRunning) {
      this.onUpdate(this.state, [...this.kinematicsHistory])
    }
    this.render()
  }
  
  public start() {
    if (this.state.isRunning) return
    
    this.state.isRunning = true
    this.lastTime = performance.now()
    // Update React state when starting
    this.onUpdate(this.state, [...this.kinematicsHistory])
    this.animate()
  }
  
  public pause() {
    this.state.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    // Update React state when pausing
    this.onUpdate(this.state, [...this.kinematicsHistory])
  }
  
  public reset() {
    this.pause()
    this.state.position = 0
    this.state.velocity = 0
    this.state.time = 0
    this.state.winner = null
    this.kinematicsHistory = []
    this.updatePhysics()
    this.onUpdate(this.state, [])
    this.render()
  }
  
  private animate() {
    if (!this.state.isRunning) return
    
    const currentTime = performance.now()
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1) // Cap at 0.1s
    this.lastTime = currentTime
    
    // Update physics
    this.state.velocity += this.state.acceleration * dt
    this.state.position += this.state.velocity * dt
    this.state.time += dt
    
    // Record kinematics data and update React state only at intervals
    let shouldUpdateReact = false
    if (this.kinematicsHistory.length === 0 || 
        this.state.time - this.kinematicsHistory[this.kinematicsHistory.length - 1].time >= 0.1) {
      const newDataPoint = {
        time: Math.round(this.state.time * 10) / 10,
        position: Math.round(this.state.position * 10) / 10,
        velocity: Math.round(this.state.velocity * 100) / 100,
        acceleration: Math.round(this.state.acceleration * 100) / 100,
        netForce: Math.round(this.state.netForce)
      }
      
      // Create a new array to avoid mutation issues
      this.kinematicsHistory = [...this.kinematicsHistory, newDataPoint]
      
      // Keep only last 50 data points
      if (this.kinematicsHistory.length > 50) {
        this.kinematicsHistory = this.kinematicsHistory.slice(1)
      }
      
      shouldUpdateReact = true
    }
    
    // Check for winner (wrestler pushed out of ring)
    if (Math.abs(this.state.position) > 100) {
      this.state.winner = this.state.position > 100 ? 'red' : 'blue'
      this.pause()
      shouldUpdateReact = true
    }
    
    // Only update React state periodically to avoid re-render loops
    if (shouldUpdateReact) {
      this.onUpdate(this.state, [...this.kinematicsHistory])
    }
    
    this.render()
    
    if (this.state.isRunning) {
      this.animationId = requestAnimationFrame(() => this.animate())
    }
  }
  
  private render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Draw ring (dohyo)
    this.drawRing()
    
    // Draw wrestlers
    this.drawWrestlers()
    
    // Draw force vectors
    this.drawForceVectors()
    
    // Draw winner message
    if (this.state.winner) {
      this.drawWinnerMessage()
    }
  }
  
  private drawRing() {
    const ctx = this.ctx
    
    // Outer ring
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(this.ringCenter.x, this.ringCenter.y, this.ringRadius, 0, Math.PI * 2)
    ctx.stroke()
    
    // Inner circle (sand color)
    const gradient = ctx.createRadialGradient(
      this.ringCenter.x, this.ringCenter.y, 0,
      this.ringCenter.x, this.ringCenter.y, this.ringRadius
    )
    gradient.addColorStop(0, '#F4E4C1')
    gradient.addColorStop(1, '#DCC896')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.ringCenter.x, this.ringCenter.y, this.ringRadius, 0, Math.PI * 2)
    ctx.fill()
    
    // Center lines (shikiri-sen)
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.ringCenter.x - 40, this.ringCenter.y)
    ctx.lineTo(this.ringCenter.x - 10, this.ringCenter.y)
    ctx.moveTo(this.ringCenter.x + 10, this.ringCenter.y)
    ctx.lineTo(this.ringCenter.x + 40, this.ringCenter.y)
    ctx.stroke()
  }
  
  private drawWrestlers() {
    const ctx = this.ctx
    
    // Calculate wrestler positions based on simulation position
    const redX = this.ringCenter.x + this.state.position - 30
    const blueX = this.ringCenter.x + this.state.position + 30
    const wrestlerY = this.ringCenter.y
    
    // Draw red wrestler
    this.drawSumoWrestler(redX, wrestlerY, 'red', this.state.redMass)
    
    // Draw blue wrestler
    this.drawSumoWrestler(blueX, wrestlerY, 'blue', this.state.blueMass)
  }
  
  private drawSumoWrestler(x: number, y: number, color: 'red' | 'blue', mass: number) {
    const ctx = this.ctx
    const size = 30 + (mass / 10) // Size based on mass
    
    // Body circle
    ctx.fillStyle = color === 'red' ? '#DC2626' : '#2563EB'
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    
    // Face
    ctx.fillStyle = '#FDB5A6'
    ctx.beginPath()
    ctx.arc(x, y - size/3, size/2, 0, Math.PI * 2)
    ctx.fill()
    
    // Mawashi (belt)
    ctx.strokeStyle = color === 'red' ? '#991B1B' : '#1E40AF'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x, y, size, Math.PI * 0.2, Math.PI * 0.8)
    ctx.stroke()
    
    // Arms pushing
    ctx.strokeStyle = '#FDB5A6'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    
    if (color === 'red') {
      // Right arm pushing right
      ctx.beginPath()
      ctx.moveTo(x + size * 0.7, y)
      ctx.lineTo(x + size * 1.3, y - 10)
      ctx.stroke()
      
      // Left arm pushing right
      ctx.beginPath()
      ctx.moveTo(x + size * 0.7, y)
      ctx.lineTo(x + size * 1.3, y + 10)
      ctx.stroke()
    } else {
      // Right arm pushing left
      ctx.beginPath()
      ctx.moveTo(x - size * 0.7, y)
      ctx.lineTo(x - size * 1.3, y - 10)
      ctx.stroke()
      
      // Left arm pushing left
      ctx.beginPath()
      ctx.moveTo(x - size * 0.7, y)
      ctx.lineTo(x - size * 1.3, y + 10)
      ctx.stroke()
    }
    
    // Mass label
    ctx.fillStyle = 'white'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${mass}kg`, x, y + 5)
  }
  
  private drawForceVectors() {
    const ctx = this.ctx
    const redX = this.ringCenter.x + this.state.position - 30
    const blueX = this.ringCenter.x + this.state.position + 30
    const y = this.ringCenter.y - 80
    
    // Scale for force vectors (pixels per Newton)
    const scale = 0.1
    
    // Draw red force vector
    if (this.state.redForce > 0) {
      this.drawArrow(redX, y, redX + this.state.redForce * scale, y, '#DC2626', 3)
      ctx.fillStyle = '#DC2626'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${this.state.redForce}N`, redX + this.state.redForce * scale / 2, y - 10)
    }
    
    // Draw blue force vector
    if (this.state.blueForce > 0) {
      this.drawArrow(blueX, y, blueX - this.state.blueForce * scale, y, '#2563EB', 3)
      ctx.fillStyle = '#2563EB'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${this.state.blueForce}N`, blueX - this.state.blueForce * scale / 2, y - 10)
    }
    
    // Draw net force indicator
    if (Math.abs(this.state.netForce) > 10) {
      const netY = this.ringCenter.y + 80
      const centerX = this.ringCenter.x + this.state.position
      
      if (this.state.netForce > 0) {
        this.drawArrow(centerX, netY, centerX + Math.abs(this.state.netForce) * scale, netY, '#10B981', 4)
      } else {
        this.drawArrow(centerX, netY, centerX - Math.abs(this.state.netForce) * scale, netY, '#10B981', 4)
      }
      
      ctx.fillStyle = '#10B981'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`Net: ${Math.abs(this.state.netForce)}N`, centerX, netY + 20)
    }
  }
  
  private drawArrow(fromX: number, fromY: number, toX: number, toY: number, color: string, width: number) {
    const ctx = this.ctx
    const dx = toX - fromX
    const dy = toY - fromY
    const angle = Math.atan2(dy, dx)
    
    // Draw line
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()
    
    // Draw arrowhead
    const headLength = 12
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }
  
  private drawWinnerMessage() {
    const ctx = this.ctx
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Winner text
    ctx.fillStyle = this.state.winner === 'red' ? '#DC2626' : '#2563EB'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      `${this.state.winner === 'red' ? 'RED' : 'BLUE'} WINS!`,
      this.ringCenter.x,
      this.ringCenter.y
    )
    
    // Japanese text
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText('勝負あり！', this.ringCenter.x, this.ringCenter.y + 40)
  }
  
  public cleanup() {
    window.removeEventListener('resize', this.resizeHandler)
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function SumoForcesContent({
  onInteraction,
  onComplete
}: {
  onInteraction: (action: string, data: Record<string, any>) => void
  onComplete: (data: Record<string, any>, score?: number) => void
}) {
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)
  const isAdmin = userRole === 'admin' || userRole === 'teacher'
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SumoPhysicsEngine | null>(null)
  const totalSimulationTime = useRef(0)
  
  const [simulationState, setSimulationState] = useState<SimulationState>({
    redMass: 150,
    blueMass: 150,
    redForce: 500,
    blueForce: 500,
    position: 0,
    velocity: 0,
    acceleration: 0,
    netForce: 0,
    totalMass: 300,
    isRunning: false,
    time: 0,
    winner: null
  })
  
  const [kinematicsData, setKinematicsData] = useState<KinematicsData[]>([])
  const [showKinematics, setShowKinematics] = useState(false)
  const [simulationCompleted, setSimulationCompleted] = useState(false)
  
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=sumo-forces')
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
      if (simulationState.isRunning) {
        totalSimulationTime.current += 1
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [simulationState.isRunning])
  
  // Track winner for completion
  useEffect(() => {
    if (simulationState.winner && !simulationCompleted) {
      setSimulationCompleted(true)
      onComplete({
        winner: simulationState.winner,
        time: simulationState.time,
        redForce: simulationState.redForce,
        blueForce: simulationState.blueForce
      }, 100)
    }
  }, [simulationState.winner, simulationCompleted, simulationState, onComplete])
  
  // Memoize chart data to prevent unnecessary re-renders
  const memoizedKinematicsData = useMemo(() => [...kinematicsData], [kinematicsData])
  
  // Initialize simulation
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new SumoPhysicsEngine(
        canvasRef.current,
        (state, kinematics) => {
          setSimulationState(state)
          setKinematicsData(kinematics)
        }
      )
    }
    
    return () => {
      engineRef.current?.cleanup()
    }
  }, [])
  
  const handleStart = () => {
    engineRef.current?.start()
    onInteraction('simulation_started', { 
      redForce: simulationState.redForce,
      blueForce: simulationState.blueForce,
      netForce: simulationState.netForce
    })
  }
  
  const handlePause = () => {
    engineRef.current?.pause()
    onInteraction('simulation_paused', { time: simulationState.time })
  }
  
  const handleReset = () => {
    engineRef.current?.reset()
    onInteraction('simulation_reset', {})
  }
  
  const handleRedForceChange = (value: number[]) => {
    engineRef.current?.setRedForce(value[0])
    onInteraction('red_force_changed', { force: value[0] })
  }
  
  const handleBlueForceChange = (value: number[]) => {
    engineRef.current?.setBlueForce(value[0])
    onInteraction('blue_force_changed', { force: value[0] })
  }
  
  const handleRedMassChange = (value: number[]) => {
    engineRef.current?.setRedMass(value[0])
    onInteraction('red_mass_changed', { mass: value[0] })
  }
  
  const handleBlueMassChange = (value: number[]) => {
    engineRef.current?.setBlueMass(value[0])
    onInteraction('blue_mass_changed', { mass: value[0] })
  }
  
  const loadPreset = (preset: string) => {
    switch (preset) {
      case 'balanced':
        engineRef.current?.setRedForce(500)
        engineRef.current?.setBlueForce(500)
        engineRef.current?.setRedMass(150)
        engineRef.current?.setBlueMass(150)
        break
      case 'red-stronger':
        engineRef.current?.setRedForce(700)
        engineRef.current?.setBlueForce(500)
        break
      case 'blue-heavier':
        engineRef.current?.setBlueMass(200)
        engineRef.current?.setRedMass(150)
        break
      case 'david-goliath':
        engineRef.current?.setRedMass(100)
        engineRef.current?.setBlueMass(200)
        engineRef.current?.setRedForce(400)
        engineRef.current?.setBlueForce(600)
        break
    }
    onInteraction('preset_loaded', { preset })
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-2xl">Sumo Wrestling Forces</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Explore Newton&apos;s Second Law through sumo wrestling!
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
                <Button
                  variant="outline"
                  onClick={() => setShowKinematics(!showKinematics)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {showKinematics ? 'Hide' : 'Show'} Kinematics
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Canvas and Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Simulation Canvas */}
            <Card>
              <CardContent className="p-6">
                <canvas
                  ref={canvasRef}
                  className="w-full border rounded-lg bg-white"
                  style={{ height: '400px' }}
                />
                
                {/* Play Controls */}
                <div className="flex justify-center gap-4 mt-4">
                  {!simulationState.isRunning ? (
                    <Button onClick={handleStart} size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      Start Battle
                    </Button>
                  ) : (
                    <Button onClick={handlePause} size="lg" variant="outline" className="gap-2">
                      <Pause className="h-5 w-5" />
                      Pause
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Force Controls */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Red Wrestler Controls */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-red-700">Red Wrestler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mass: {simulationState.redMass} kg</Label>
                    <Slider
                      value={[simulationState.redMass]}
                      onValueChange={handleRedMassChange}
                      min={80}
                      max={250}
                      step={5}
                      className="[&>span]:bg-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Force: {simulationState.redForce} N</Label>
                    <Slider
                      value={[simulationState.redForce]}
                      onValueChange={handleRedForceChange}
                      min={0}
                      max={1000}
                      step={10}
                      className="[&>span]:bg-red-500"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Blue Wrestler Controls */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-700">Blue Wrestler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mass: {simulationState.blueMass} kg</Label>
                    <Slider
                      value={[simulationState.blueMass]}
                      onValueChange={handleBlueMassChange}
                      min={80}
                      max={250}
                      step={5}
                      className="[&>span]:bg-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Force: {simulationState.blueForce} N</Label>
                    <Slider
                      value={[simulationState.blueForce]}
                      onValueChange={handleBlueForceChange}
                      min={0}
                      max={1000}
                      step={10}
                      className="[&>span]:bg-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Right Panel */}
          <div className="space-y-4">
            {/* Physics Calculations */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Physics Calculations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Net Force (ΣF)</Label>
                  <div className="text-2xl font-bold">
                    {Math.abs(simulationState.netForce)} N
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {simulationState.netForce > 0 ? '→ Red advantage' : 
                     simulationState.netForce < 0 ? '← Blue advantage' : 
                     '⚖️ Balanced'}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Total Mass (m)</Label>
                  <div className="text-2xl font-bold">
                    {simulationState.totalMass} kg
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Acceleration (a)</Label>
                  <div className="text-2xl font-bold">
                    {Math.abs(simulationState.acceleration).toFixed(2)} m/s²
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <MathMarkdown content="\\( F_{net} = ma \\)" />
                  <MathMarkdown content={`\\( ${simulationState.netForce} = ${simulationState.totalMass} \\times ${simulationState.acceleration.toFixed(2)} \\)`} />
                </div>
              </CardContent>
            </Card>
            
            {/* Presets */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Battle Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => loadPreset('balanced')}
                >
                  ⚖️ Evenly Matched
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => loadPreset('red-stronger')}
                >
                  💪 Red Stronger
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => loadPreset('blue-heavier')}
                >
                  🏋️ Blue Heavier
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => loadPreset('david-goliath')}
                >
                  🎭 David vs Goliath
                </Button>
              </CardContent>
            </Card>
            
            {/* Status */}
            {simulationState.winner && (
              <Card className="border-yellow-400 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    <div className="text-xl font-bold">
                      {simulationState.winner === 'red' ? 'Red' : 'Blue'} Wrestler Wins!
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Kinematics Graphs */}
        {showKinematics && memoizedKinematicsData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kinematics Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Position vs Time */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Position vs Time</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={memoizedKinematicsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Position (cm)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="position" stroke="#8884d8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Velocity vs Time */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Velocity vs Time</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={memoizedKinematicsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Velocity (cm/s)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="velocity" stroke="#82ca9d" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Educational Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Physics Concepts
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-base font-semibold">Newton&apos;s Second Law</h3>
                <p className="text-sm text-muted-foreground">
                  The net force on the wrestlers equals their combined mass times acceleration.
                  When forces are balanced, there&apos;s no acceleration. When unbalanced, the wrestlers
                  accelerate in the direction of the stronger force.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold">Kinematics</h3>
                <p className="text-sm text-muted-foreground">
                  Watch how position changes over time (velocity) and how velocity changes
                  over time (acceleration). The constant acceleration creates a parabolic
                  position curve and linear velocity curve.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Components */}
        {!isAdmin && (
          <SimulationAssignment
            simulationSlug="sumo-forces"
            simulationTime={totalSimulationTime.current}
            simulationCompleted={simulationCompleted}
            simulationData={{
              winner: simulationState.winner,
              redForce: simulationState.redForce,
              blueForce: simulationState.blueForce,
              redMass: simulationState.redMass,
              blueMass: simulationState.blueMass,
              netForce: simulationState.netForce,
              acceleration: simulationState.acceleration,
              time: simulationState.time
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
            simulationSlug="sumo-forces"
            assignment={editingAssignment}
            onSave={(assignment) => {
              loadAssignments()
              setShowAssignmentEditor(false)
              setEditingAssignment(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function SumoForcesPage() {
  return (
    <SimulationWrapper
      simulationSlug="sumo-forces"
      trackProgress={true}
      aiEnabled={true}
      successCriteria={{
        type: 'data-based',
        criteria: {
          minimumInteractions: 5,
          requiredActions: ['simulation_started', 'red_force_changed', 'blue_force_changed'],
          minimumDuration: 60
        }
      }}
    >
      {({ onInteraction, onComplete }) => (
        <SumoForcesContent 
          onInteraction={onInteraction}
          onComplete={onComplete}
        />
      )}
    </SimulationWrapper>
  )
}
