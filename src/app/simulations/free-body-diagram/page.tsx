"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimulationWrapper } from '@/components/simulations/SimulationWrapper'
import SimulationAssignment from '@/components/simulations/SimulationAssignment'
import SimulationAssignmentEditor from '@/components/simulations/SimulationAssignmentEditor'
import { RotateCcw, Info, HelpCircle, Move, Download, Trash2, Plus, Settings, FileText } from 'lucide-react'
import MathMarkdown from '@/components/MathMarkdown'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface Vector2D {
  x: number
  y: number
}

interface ForceVector {
  id: string
  name: string
  magnitude: number
  angle: number // in degrees
  color: string
  position: Vector2D // where to draw the vector from
  isDragging: boolean
}

interface SimulationState {
  mass: number
  forces: ForceVector[]
  netForce: Vector2D
  acceleration: Vector2D
  isRunning: boolean
  showGrid: boolean
  showLabels: boolean
  showAcceleration: boolean
  selectedForce: string | null
}

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

class FreeBodyDiagramEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private state: SimulationState
  private boxPosition: Vector2D
  private boxSize: number
  private scale: number = 10 // pixels per Newton
  private dragOffset: Vector2D | null = null
  private isDraggingObject: boolean = false
  private onUpdate: (state: SimulationState) => void

  constructor(canvas: HTMLCanvasElement, onUpdate: (state: SimulationState) => void) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.onUpdate = onUpdate
    this.boxPosition = { x: canvas.width / 2, y: canvas.height / 2 }
    this.boxSize = 60
    
    this.state = {
      mass: 5,
      forces: [
        {
          id: 'force1',
          name: 'Applied Force',
          magnitude: 20,
          angle: 0,
          color: '#FF6B6B',
          position: { x: 0, y: 0 },
          isDragging: false
        }
      ],
      netForce: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      isRunning: false,
      showGrid: true,
      showLabels: true,
      showAcceleration: true,
      selectedForce: null
    }

    this.setupEventListeners()
    this.resizeCanvas()
    this.updatePhysics()
    this.render()
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e))
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp())
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e))
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e))
    this.canvas.addEventListener('touchend', () => this.handleTouchEnd())
    window.addEventListener('resize', () => this.resizeCanvas())
  }

  private resizeCanvas() {
    const rect = this.canvas.parentElement?.getBoundingClientRect()
    if (rect) {
      this.canvas.width = rect.width
      this.canvas.height = Math.min(rect.height, 500)
      this.boxPosition = { 
        x: this.canvas.width / 2, 
        y: this.canvas.height / 2 
      }
      this.render()
    }
  }

  private getMousePosition(e: MouseEvent): Vector2D {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  private handleMouseDown(e: MouseEvent) {
    const pos = this.getMousePosition(e)
    
    // Check if clicking on a force vector arrow head
    for (const force of this.state.forces) {
      const forceEnd = this.getForceEndpoint(force)
      const dist = Math.sqrt(
        (pos.x - forceEnd.x) ** 2 + 
        (pos.y - forceEnd.y) ** 2
      )
      
      if (dist < 15) {
        force.isDragging = true
        this.state.selectedForce = force.id
        this.dragOffset = { 
          x: pos.x - forceEnd.x, 
          y: pos.y - forceEnd.y 
        }
        this.render()
        return
      }
    }

    // Check if clicking on the object
    const objDist = Math.sqrt(
      (pos.x - this.boxPosition.x) ** 2 + 
      (pos.y - this.boxPosition.y) ** 2
    )
    
    if (objDist < this.boxSize / 2 + 10) {
      this.isDraggingObject = true
      this.dragOffset = {
        x: pos.x - this.boxPosition.x,
        y: pos.y - this.boxPosition.y
      }
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const pos = this.getMousePosition(e)

    if (this.isDraggingObject && this.dragOffset) {
      this.boxPosition = {
        x: pos.x - this.dragOffset.x,
        y: pos.y - this.dragOffset.y
      }
      this.render()
      return
    }

    // Handle force vector dragging
    for (const force of this.state.forces) {
      if (force.isDragging) {
        // Calculate new angle and magnitude based on mouse position
        const dx = pos.x - this.boxPosition.x
        const dy = pos.y - this.boxPosition.y
        
        const magnitude = Math.min(Math.sqrt(dx * dx + dy * dy) / this.scale, 100)
        const angle = Math.atan2(-dy, dx) * (180 / Math.PI)
        
        force.magnitude = Math.max(0, magnitude)
        force.angle = angle
        
        this.updatePhysics()
        this.render()
        break
      }
    }
  }

  private handleMouseUp() {
    this.isDraggingObject = false
    this.dragOffset = null
    
    for (const force of this.state.forces) {
      force.isDragging = false
    }
    this.render()
  }

  private handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      this.handleMouseDown(mouseEvent)
    }
  }

  private handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 1) {
      e.preventDefault()
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      this.handleMouseMove(mouseEvent)
    }
  }

  private handleTouchEnd() {
    this.handleMouseUp()
  }

  private getForceEndpoint(force: ForceVector): Vector2D {
    const rad = force.angle * (Math.PI / 180)
    return {
      x: this.boxPosition.x + force.magnitude * this.scale * Math.cos(rad),
      y: this.boxPosition.y - force.magnitude * this.scale * Math.sin(rad)
    }
  }

  public updatePhysics() {
    // Calculate net force
    let netX = 0
    let netY = 0
    
    for (const force of this.state.forces) {
      const rad = force.angle * (Math.PI / 180)
      netX += force.magnitude * Math.cos(rad)
      netY += force.magnitude * Math.sin(rad)
    }
    
    this.state.netForce = { x: netX, y: netY }
    
    // Calculate acceleration using F = ma -> a = F/m
    this.state.acceleration = {
      x: netX / this.state.mass,
      y: netY / this.state.mass
    }
    
    this.onUpdate(this.state)
  }

  public addForce(name: string, color: string) {
    const newForce: ForceVector = {
      id: `force${Date.now()}`,
      name,
      magnitude: 10,
      angle: Math.random() * 360,
      color,
      position: { x: 0, y: 0 },
      isDragging: false
    }
    
    this.state.forces.push(newForce)
    this.updatePhysics()
    this.render()
  }

  public removeForce(id: string) {
    this.state.forces = this.state.forces.filter(f => f.id !== id)
    this.updatePhysics()
    this.render()
  }

  public setMass(mass: number) {
    this.state.mass = mass
    this.updatePhysics()
    this.render()
  }

  public setForceProperty(id: string, property: 'magnitude' | 'angle', value: number) {
    const force = this.state.forces.find(f => f.id === id)
    if (force) {
      force[property] = value
      this.updatePhysics()
      this.render()
    }
  }

  public toggleGrid() {
    this.state.showGrid = !this.state.showGrid
    this.render()
  }

  public toggleLabels() {
    this.state.showLabels = !this.state.showLabels
    this.render()
  }

  public toggleAcceleration() {
    this.state.showAcceleration = !this.state.showAcceleration
    this.render()
  }

  public reset() {
    this.state.forces = [{
      id: 'force1',
      name: 'Applied Force',
      magnitude: 20,
      angle: 0,
      color: '#FF6B6B',
      position: { x: 0, y: 0 },
      isDragging: false
    }]
    this.state.mass = 5
    this.updatePhysics()
    this.render()
  }

  private render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Draw grid
    if (this.state.showGrid) {
      this.drawGrid()
    }
    
    // Draw object (box)
    this.drawObject()
    
    // Draw force vectors
    for (const force of this.state.forces) {
      this.drawForceVector(force)
    }
    
    // Draw net force vector
    if (this.state.forces.length > 1) {
      this.drawNetForce()
    }
    
    // Draw acceleration vector
    if (this.state.showAcceleration) {
      this.drawAcceleration()
    }
    
    // Draw scale indicator
    this.drawScale()
  }

  private drawGrid() {
    this.ctx.strokeStyle = '#e0e0e0'
    this.ctx.lineWidth = 0.5
    
    const gridSize = 20
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvas.height)
      this.ctx.stroke()
    }
    
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width, y)
      this.ctx.stroke()
    }
  }

  private drawObject() {
    // Draw box with gradient
    const gradient = this.ctx.createLinearGradient(
      this.boxPosition.x - this.boxSize/2,
      this.boxPosition.y - this.boxSize/2,
      this.boxPosition.x + this.boxSize/2,
      this.boxPosition.y + this.boxSize/2
    )
    gradient.addColorStop(0, '#4A5568')
    gradient.addColorStop(1, '#2D3748')
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(
      this.boxPosition.x - this.boxSize/2,
      this.boxPosition.y - this.boxSize/2,
      this.boxSize,
      this.boxSize
    )
    
    // Draw border
    this.ctx.strokeStyle = '#1A202C'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(
      this.boxPosition.x - this.boxSize/2,
      this.boxPosition.y - this.boxSize/2,
      this.boxSize,
      this.boxSize
    )
    
    // Draw mass label
    if (this.state.showLabels) {
      this.ctx.fillStyle = 'white'
      this.ctx.font = 'bold 14px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(
        `m = ${this.state.mass} kg`,
        this.boxPosition.x,
        this.boxPosition.y
      )
    }
  }

  private drawForceVector(force: ForceVector) {
    if (force.magnitude === 0) return
    
    const start = this.boxPosition
    const end = this.getForceEndpoint(force)
    
    // Draw arrow
    this.drawArrow(start, end, force.color, 3)
    
    // Draw label
    if (this.state.showLabels) {
      const midX = (start.x + end.x) / 2
      const midY = (start.y + end.y) / 2
      
      this.ctx.fillStyle = force.color
      this.ctx.font = 'bold 12px sans-serif'
      this.ctx.textAlign = 'center'
      
      const labelOffset = 20
      const rad = force.angle * (Math.PI / 180)
      const labelX = midX + labelOffset * Math.sin(rad)
      const labelY = midY + labelOffset * Math.cos(rad)
      
      this.ctx.fillText(
        `${force.name}`,
        labelX,
        labelY - 10
      )
      this.ctx.fillText(
        `${force.magnitude.toFixed(1)} N`,
        labelX,
        labelY + 5
      )
    }
    
    // Draw drag handle
    if (force.isDragging || this.state.selectedForce === force.id) {
      this.ctx.fillStyle = force.color
      this.ctx.beginPath()
      this.ctx.arc(end.x, end.y, 8, 0, Math.PI * 2)
      this.ctx.fill()
      
      this.ctx.strokeStyle = 'white'
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }
  }

  private drawNetForce() {
    if (Math.abs(this.state.netForce.x) < 0.1 && Math.abs(this.state.netForce.y) < 0.1) return
    
    const start = this.boxPosition
    const end = {
      x: start.x + this.state.netForce.x * this.scale,
      y: start.y - this.state.netForce.y * this.scale
    }
    
    // Draw dashed arrow for net force
    this.ctx.setLineDash([5, 5])
    this.drawArrow(start, end, '#10B981', 4)
    this.ctx.setLineDash([])
    
    // Label
    if (this.state.showLabels) {
      const magnitude = Math.sqrt(
        this.state.netForce.x ** 2 + 
        this.state.netForce.y ** 2
      )
      
      this.ctx.fillStyle = '#10B981'
      this.ctx.font = 'bold 14px sans-serif'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(
        `Net Force: ${magnitude.toFixed(1)} N`,
        end.x + 10,
        end.y
      )
    }
  }

  private drawAcceleration() {
    if (Math.abs(this.state.acceleration.x) < 0.1 && Math.abs(this.state.acceleration.y) < 0.1) return
    
    const accScale = this.scale * 2 // Make acceleration vector more visible
    const start = this.boxPosition
    const end = {
      x: start.x + this.state.acceleration.x * accScale,
      y: start.y - this.state.acceleration.y * accScale
    }
    
    // Draw dotted arrow for acceleration
    this.ctx.setLineDash([2, 3])
    this.drawArrow(start, end, '#F59E0B', 3)
    this.ctx.setLineDash([])
    
    // Label
    if (this.state.showLabels) {
      const magnitude = Math.sqrt(
        this.state.acceleration.x ** 2 + 
        this.state.acceleration.y ** 2
      )
      
      this.ctx.fillStyle = '#F59E0B'
      this.ctx.font = 'bold 14px sans-serif'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(
        `a: ${magnitude.toFixed(2)} m/s²`,
        end.x + 10,
        end.y + 20
      )
    }
  }

  private drawArrow(from: Vector2D, to: Vector2D, color: string, width: number) {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const angle = Math.atan2(dy, dx)
    const length = Math.sqrt(dx * dx + dy * dy)
    
    if (length < 5) return
    
    // Draw line
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = width
    this.ctx.beginPath()
    this.ctx.moveTo(from.x, from.y)
    this.ctx.lineTo(to.x, to.y)
    this.ctx.stroke()
    
    // Draw arrowhead
    const headLength = Math.min(15, length * 0.3)
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(to.x, to.y)
    this.ctx.lineTo(
      to.x - headLength * Math.cos(angle - Math.PI / 6),
      to.y - headLength * Math.sin(angle - Math.PI / 6)
    )
    this.ctx.lineTo(
      to.x - headLength * Math.cos(angle + Math.PI / 6),
      to.y - headLength * Math.sin(angle + Math.PI / 6)
    )
    this.ctx.closePath()
    this.ctx.fill()
  }

  private drawScale() {
    const scaleX = 10
    const scaleY = this.canvas.height - 10
    
    // Draw scale line
    this.ctx.strokeStyle = '#718096'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(scaleX, scaleY)
    this.ctx.lineTo(scaleX + this.scale * 10, scaleY)
    this.ctx.stroke()
    
    // Draw scale label
    this.ctx.fillStyle = '#718096'
    this.ctx.font = '11px sans-serif'
    this.ctx.textAlign = 'left'
    this.ctx.fillText('10 N', scaleX + this.scale * 10 + 5, scaleY + 3)
  }

  public getState(): SimulationState {
    return this.state
  }

  public cleanup() {
    // Remove event listeners
    window.removeEventListener('resize', () => this.resizeCanvas())
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function FreeBodyDiagramContent({
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
  const engineRef = useRef<FreeBodyDiagramEngine | null>(null)
  const totalSimulationTime = useRef(0)
  
  const [simulationState, setSimulationState] = useState<SimulationState>({
    mass: 5,
    forces: [],
    netForce: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    isRunning: false,
    showGrid: true,
    showLabels: true,
    showAcceleration: true,
    selectedForce: null
  })
  
  const [selectedPreset, setSelectedPreset] = useState('custom')
  const [showHelp, setShowHelp] = useState(false)
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=free-body-diagram')
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
      totalSimulationTime.current += 1
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Initialize simulation
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new FreeBodyDiagramEngine(
        canvasRef.current,
        (state) => setSimulationState(state)
      )
    }
    
    return () => {
      engineRef.current?.cleanup()
    }
  }, [])

  // Handle preset changes
  const loadPreset = (preset: string) => {
    if (!engineRef.current) return
    
    engineRef.current.reset()
    onInteraction('preset_loaded', { preset })
    
    switch (preset) {
      case 'balanced':
        engineRef.current.setMass(10)
        engineRef.current.addForce('Force 1', '#FF6B6B')
        engineRef.current.addForce('Force 2', '#4ECDC4')
        engineRef.current.setForceProperty('force1', 'magnitude', 30)
        engineRef.current.setForceProperty('force1', 'angle', 0)
        // Note: We'd need to get the actual force IDs for this to work properly
        break
      
      case 'unbalanced':
        engineRef.current.setMass(5)
        engineRef.current.addForce('Push', '#FF6B6B')
        engineRef.current.setForceProperty('force1', 'magnitude', 50)
        engineRef.current.setForceProperty('force1', 'angle', 45)
        break
      
      case 'gravity':
        engineRef.current.setMass(2)
        engineRef.current.addForce('Weight', '#9333EA')
        engineRef.current.setForceProperty('force1', 'magnitude', 19.6)
        engineRef.current.setForceProperty('force1', 'angle', -90)
        break
      
      case 'friction':
        engineRef.current.setMass(8)
        engineRef.current.addForce('Applied', '#FF6B6B')
        engineRef.current.addForce('Friction', '#78716C')
        engineRef.current.setForceProperty('force1', 'magnitude', 40)
        engineRef.current.setForceProperty('force1', 'angle', 0)
        // Set friction opposite to applied force
        break
    }
  }

  const handleReset = () => {
    engineRef.current?.reset()
    onInteraction('reset', {})
  }

  const handleAddForce = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#9333EA', '#F59E0B', '#10B981']
    const forceCount = simulationState.forces.length
    const color = colors[forceCount % colors.length]
    engineRef.current?.addForce(`Force ${forceCount + 1}`, color)
    onInteraction('force_added', { forceCount: forceCount + 1 })
  }

  const handleRemoveForce = (id: string) => {
    engineRef.current?.removeForce(id)
    onInteraction('force_removed', { forceId: id })
  }

  const handleMassChange = (value: number[]) => {
    engineRef.current?.setMass(value[0])
    onInteraction('mass_changed', { mass: value[0] })
  }

  const handleForceChange = (id: string, property: 'magnitude' | 'angle', value: number) => {
    engineRef.current?.setForceProperty(id, property, value)
    onInteraction('force_modified', { forceId: id, property, value })
  }

  const handleExportData = () => {
    const data = {
      mass: simulationState.mass,
      forces: simulationState.forces.map(f => ({
        name: f.name,
        magnitude: f.magnitude,
        angle: f.angle
      })),
      netForce: {
        x: simulationState.netForce.x,
        y: simulationState.netForce.y,
        magnitude: Math.sqrt(
          simulationState.netForce.x ** 2 + 
          simulationState.netForce.y ** 2
        )
      },
      acceleration: {
        x: simulationState.acceleration.x,
        y: simulationState.acceleration.y,
        magnitude: Math.sqrt(
          simulationState.acceleration.x ** 2 + 
          simulationState.acceleration.y ** 2
        )
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `free-body-diagram-${Date.now()}.json`
    a.click()
    
    onComplete(data, 100)
  }

  const netForceMagnitude = Math.sqrt(
    simulationState.netForce.x ** 2 + 
    simulationState.netForce.y ** 2
  )
  
  const accelerationMagnitude = Math.sqrt(
    simulationState.acceleration.x ** 2 + 
    simulationState.acceleration.y ** 2
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-2xl">Free Body Diagram Lab</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Explore Newton&apos;s Second Law: F = ma
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
                  size="icon"
                  onClick={() => setShowHelp(!showHelp)}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Help Card */}
        {showHelp && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Move className="h-4 w-4 mt-0.5 text-blue-600" />
                  <p>
                    <strong>Drag force vectors</strong> by their arrowheads to change magnitude and direction
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-green-600" />
                  <p>
                    <strong>Net Force (green dashed)</strong> shows the vector sum of all forces
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-amber-600" />
                  <p>
                    <strong>Acceleration (yellow dotted)</strong> shows the resulting acceleration from F = ma
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <MathMarkdown content="Remember: \\( \\vec{a} = \\frac{\\vec{F}_{net}}{m} \\)" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <canvas
                  ref={canvasRef}
                  className="w-full border rounded-lg bg-white"
                  style={{ height: '500px' }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Calculations Display */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Real-Time Calculations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Mass (m)</Label>
                  <div className="text-2xl font-bold">
                    {simulationState.mass} kg
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Net Force (ΣF)</Label>
                  <div className="text-2xl font-bold text-green-600">
                    {netForceMagnitude.toFixed(2)} N
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    x: {simulationState.netForce.x.toFixed(2)} N, 
                    y: {simulationState.netForce.y.toFixed(2)} N
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground">Acceleration (a)</Label>
                  <div className="text-2xl font-bold text-amber-600">
                    {accelerationMagnitude.toFixed(2)} m/s²
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    x: {simulationState.acceleration.x.toFixed(2)} m/s², 
                    y: {simulationState.acceleration.y.toFixed(2)} m/s²
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <MathMarkdown content="\\( F_{net} = ma \\)" />
                  <MathMarkdown content={`\\( ${netForceMagnitude.toFixed(1)} = ${simulationState.mass} \\times ${accelerationMagnitude.toFixed(2)} \\)`} />
                </div>
              </CardContent>
            </Card>

            {/* Object Properties */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Object Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mass: {simulationState.mass} kg</Label>
                  <Slider
                    value={[simulationState.mass]}
                    onValueChange={handleMassChange}
                    min={1}
                    max={20}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Presets</Label>
                  <Select value={selectedPreset} onValueChange={(value) => {
                    setSelectedPreset(value)
                    loadPreset(value)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="balanced">Balanced Forces</SelectItem>
                      <SelectItem value="unbalanced">Unbalanced Forces</SelectItem>
                      <SelectItem value="gravity">Gravity Only</SelectItem>
                      <SelectItem value="friction">With Friction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleAddForce} 
                  className="w-full"
                  disabled={simulationState.forces.length >= 5}
                >
                  Add Force Vector
                </Button>
              </CardContent>
            </Card>

            {/* Force Controls */}
            {simulationState.forces.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Force Vectors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {simulationState.forces.map((force) => (
                    <div key={force.id} className="space-y-2 p-2 border rounded">
                      <div className="flex items-center justify-between">
                        <Badge style={{ backgroundColor: force.color }}>
                          {force.name}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveForce(force.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-16">Magnitude:</span>
                          <Slider
                            value={[force.magnitude]}
                            onValueChange={(value) => handleForceChange(force.id, 'magnitude', value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="w-12 text-right">{force.magnitude.toFixed(0)} N</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-16">Angle:</span>
                          <Slider
                            value={[force.angle]}
                            onValueChange={(value) => handleForceChange(force.id, 'angle', value[0])}
                            min={-180}
                            max={180}
                            step={1}
                            className="flex-1"
                          />
                          <span className="w-12 text-right">{force.angle.toFixed(0)}°</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Display Options */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Show Grid</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => engineRef.current?.toggleGrid()}
                  >
                    {simulationState.showGrid ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Labels</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => engineRef.current?.toggleLabels()}
                  >
                    {simulationState.showLabels ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Acceleration</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => engineRef.current?.toggleAcceleration()}
                  >
                    {simulationState.showAcceleration ? 'On' : 'Off'}
                  </Button>
                </div>
                
                <Button 
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Assignment Components */}
        {!isAdmin && (
          <SimulationAssignment
            simulationSlug="free-body-diagram"
            simulationTime={totalSimulationTime.current}
            simulationCompleted={simulationCompleted}
            simulationData={{
              mass: simulationState.mass,
              forces: simulationState.forces,
              netForce: simulationState.netForce,
              acceleration: simulationState.acceleration,
              netForceMagnitude: Math.sqrt(
                simulationState.netForce.x ** 2 + 
                simulationState.netForce.y ** 2
              )
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
            simulationSlug="free-body-diagram"
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

export default function FreeBodyDiagramPage() {
  return (
    <SimulationWrapper
      simulationSlug="free-body-diagram"
      trackProgress={true}
      aiEnabled={true}
      successCriteria={{
        type: 'data-based',
        criteria: {
          minimumInteractions: 5,
          requiredActions: ['force_added', 'mass_changed', 'force_modified'],
          minimumDuration: 120
        }
      }}
    >
      {({ onInteraction, onComplete }) => (
        <FreeBodyDiagramContent 
          onInteraction={onInteraction}
          onComplete={onComplete}
        />
      )}
    </SimulationWrapper>
  )
}
