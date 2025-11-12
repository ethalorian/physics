"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SimulationWrapper } from '@/components/simulations/SimulationWrapper'
import { useSimulationCompletion } from '@/hooks/useSimulationCompletion'
import SimulationProgress from '@/components/simulations/SimulationProgress'
import { getSimulationCriteria, getActionLabels } from '@/config/simulationCompletionCriteria'
import SimulationAssignment from '@/components/simulations/SimulationAssignment'
import SimulationAssignmentEditor from '@/components/simulations/SimulationAssignmentEditor'
import { 
  ArrowLeft,
  RotateCcw,
  Info,
  Plus,
  Settings,
  FileText,
  ArrowRight,
  ArrowUp,
  Maximize2,
  Navigation
} from 'lucide-react'

interface Position {
  x: number // meters from origin
  y: number // meters from origin
}

interface MazeCell {
  row: number
  col: number
  isWall: boolean
  isStart: boolean
  isEnd: boolean
}

// ============================================================================
// MAZE ENGINE
// ============================================================================

class MazeNavigationEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private cellSize: number = 25 // pixels per cell (smaller for 20x20)
  private maze: MazeCell[][] = []
  private mousePos: Position = { x: 0.5, y: 0.5 } // Start position (centered in cell 0,0)
  private cheesePos: Position = { x: 19.5, y: 19.5 } // Cheese at bottom-right (centered in cell 19,19)
  private mazeWidth: number = 20
  private mazeHeight: number = 20
  private moveSpeed: number = 0.05 // Smooth movement
  private animationId: number | null = null
  private keys: Set<string> = new Set()
  
  private onUpdate: (position: Position) => void

  constructor(
    canvas: HTMLCanvasElement,
    onUpdate: (position: Position) => void
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.onUpdate = onUpdate
    
    this.initializeMaze()
    this.resizeCanvas()
    this.setupControls()
    this.render()
    this.animate()
    
    window.addEventListener('resize', () => this.resizeCanvas())
  }

  private initializeMaze() {
    // Create a 20x20 complex maze with interesting pathways
    // 1 = wall, 0 = path
    const mazeLayout = [
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    ]

    this.maze = mazeLayout.map((row, rowIdx) =>
      row.map((cell, colIdx) => ({
        row: rowIdx,
        col: colIdx,
        isWall: cell === 1,
        isStart: rowIdx === 0 && colIdx === 0,
        isEnd: rowIdx === 19 && colIdx === 19
      }))
    )
  }

  private resizeCanvas() {
    const container = this.canvas.parentElement
    if (container) {
      const size = Math.min(container.clientWidth, 600)
      this.canvas.width = size
      this.canvas.height = size
      this.cellSize = size / this.mazeWidth
    }
  }

  private setupControls() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault()
        this.keys.add(e.key.toLowerCase())
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase())
    })
  }

  private canMoveTo(x: number, y: number): boolean {
    // Check boundaries
    if (x < 0 || x >= this.mazeWidth || y < 0 || y >= this.mazeHeight) {
      return false
    }

    // Check multiple points around the mouse for better collision detection
    const checkRadius = 0.25 // Size of the mouse's collision box
    const checkPoints = [
      { x: x, y: y },                           // Center
      { x: x - checkRadius, y: y },            // Left
      { x: x + checkRadius, y: y },            // Right
      { x: x, y: y - checkRadius },            // Top
      { x: x, y: y + checkRadius },            // Bottom
      { x: x - checkRadius, y: y - checkRadius }, // Top-left corner
      { x: x + checkRadius, y: y - checkRadius }, // Top-right corner
      { x: x - checkRadius, y: y + checkRadius }, // Bottom-left corner
      { x: x + checkRadius, y: y + checkRadius }  // Bottom-right corner
    ]
    
    // All check points must be in valid cells (not walls)
    for (const point of checkPoints) {
      const col = Math.floor(point.x)
      const row = Math.floor(point.y)
      
      // Out of bounds check
      if (row < 0 || row >= this.mazeHeight || col < 0 || col >= this.mazeWidth) {
        return false
      }
      
      // Wall check
      if (this.maze[row][col].isWall) {
        return false
      }
    }
    
    return true
  }

  public reset() {
    this.mousePos = { x: 0.5, y: 0.5 } // Start at top-left (centered in cell)
    this.keys.clear()
    this.render()
    this.onUpdate(this.mousePos)
  }

  public destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
    }
    window.removeEventListener('keydown', () => {})
    window.removeEventListener('keyup', () => {})
    window.removeEventListener('resize', () => this.resizeCanvas())
  }

  private animate() {
    // Handle keyboard input
    let dx = 0
    let dy = 0

    if (this.keys.has('arrowup') || this.keys.has('w')) dy -= this.moveSpeed
    if (this.keys.has('arrowdown') || this.keys.has('s')) dy += this.moveSpeed
    if (this.keys.has('arrowleft') || this.keys.has('a')) dx -= this.moveSpeed
    if (this.keys.has('arrowright') || this.keys.has('d')) dx += this.moveSpeed

    // Try to move with sliding collision detection
    if (dx !== 0 || dy !== 0) {
      const newX = this.mousePos.x + dx
      const newY = this.mousePos.y + dy

      // Try full movement
      if (this.canMoveTo(newX, newY)) {
        this.mousePos.x = newX
        this.mousePos.y = newY
        this.onUpdate(this.mousePos)
      } else {
        // Try sliding along walls (move in one direction only)
        // Try X movement only
        if (dx !== 0 && this.canMoveTo(newX, this.mousePos.y)) {
          this.mousePos.x = newX
          this.onUpdate(this.mousePos)
        }
        // Try Y movement only
        else if (dy !== 0 && this.canMoveTo(this.mousePos.x, newY)) {
          this.mousePos.y = newY
          this.onUpdate(this.mousePos)
        }
      }
    }

    this.render()
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  private render() {
    const ctx = this.ctx
    const cellSize = this.cellSize

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw background
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw maze grid
    for (let row = 0; row < this.mazeHeight; row++) {
      for (let col = 0; col < this.mazeWidth; col++) {
        const cell = this.maze[row][col]
        const x = col * cellSize
        const y = row * cellSize

        if (cell.isWall) {
          // Wall - solid dark gray
          ctx.fillStyle = '#374151'
          ctx.fillRect(x, y, cellSize, cellSize)
        } else {
          // Path - light background
          ctx.fillStyle = '#f9fafb'
          ctx.fillRect(x, y, cellSize, cellSize)
        }
        
        // Draw grid lines for all cells
        ctx.strokeStyle = '#d1d5db'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, cellSize, cellSize)
      }
    }

    // Draw start cell highlight
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'
    ctx.fillRect(0, 0, cellSize, cellSize)
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, cellSize, cellSize)

    // Draw end cell highlight (cheese location)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)'
    ctx.fillRect(19 * cellSize, 19 * cellSize, cellSize, cellSize)
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 3
    ctx.strokeRect(19 * cellSize, 19 * cellSize, cellSize, cellSize)

    // Draw cheese at goal position
    ctx.font = `${cellSize * 0.5}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🧀', 19.5 * cellSize, 19.5 * cellSize)

    // Draw START and ORIGIN labels
    const originX = 0.5 * cellSize
    const originY = 0.5 * cellSize
    
    // START/Origin marker
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.arc(originX, originY, 8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('O', originX, originY)
    
    // Origin label below
    ctx.fillStyle = '#10b981'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('Origin', originX, cellSize - 5)

    // Draw position vectors (from START/ORIGIN position)
    const mouseScreenX = this.mousePos.x * cellSize
    const mouseScreenY = this.mousePos.y * cellSize

    // Draw x-component vector (red)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(originX, originY)
    ctx.lineTo(mouseScreenX, originY)
    ctx.stroke()
    
    // X-component arrow
    this.drawArrowHead(ctx, mouseScreenX, originY, '#ef4444', 'right')
    
    // X-component label
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    const xComp = this.mousePos.x - 0.5 // From start position
    ctx.fillText(`x = ${xComp.toFixed(1)}m`, (originX + mouseScreenX) / 2, originY - 8)

    // Draw y-component vector (blue)
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(mouseScreenX, originY)
    ctx.lineTo(mouseScreenX, mouseScreenY)
    ctx.stroke()
    
    // Y-component arrow
    this.drawArrowHead(ctx, mouseScreenX, mouseScreenY, '#3b82f6', 'down')
    
    // Y-component label
    ctx.fillStyle = '#3b82f6'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'left'
    const yComp = this.mousePos.y - 0.5 // From start position
    ctx.fillText(`y = ${yComp.toFixed(1)}m`, mouseScreenX + 8, (originY + mouseScreenY) / 2)

    // Draw resultant vector (purple)
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(originX, originY)
    ctx.lineTo(mouseScreenX, mouseScreenY)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Resultant arrow
    this.drawArrowHead(ctx, mouseScreenX, mouseScreenY, '#8b5cf6', 'angle', originX, originY)
    
    // Resultant label
    const xComp2 = this.mousePos.x - 0.5 // From start position
    const yComp2 = this.mousePos.y - 0.5 // From start position
    const magnitude = Math.sqrt(xComp2 ** 2 + yComp2 ** 2)
    ctx.fillStyle = '#8b5cf6'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    const labelX = (originX + mouseScreenX) / 2
    const labelY = (originY + mouseScreenY) / 2 - 10
    ctx.fillText(`r = ${magnitude.toFixed(2)}m`, labelX, labelY)

    // Draw mouse (half size)
    ctx.font = `${cellSize * 0.35}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🐭', mouseScreenX, mouseScreenY)
  }

  private drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, direction: 'right' | 'down' | 'angle', fromX?: number, fromY?: number) {
    ctx.fillStyle = color
    ctx.beginPath()
    
    if (direction === 'right') {
      ctx.moveTo(x, y)
      ctx.lineTo(x - 8, y - 5)
      ctx.lineTo(x - 8, y + 5)
    } else if (direction === 'down') {
      ctx.moveTo(x, y)
      ctx.lineTo(x - 5, y - 8)
      ctx.lineTo(x + 5, y - 8)
    } else if (direction === 'angle' && fromX !== undefined && fromY !== undefined) {
      const angle = Math.atan2(y - fromY, x - fromX)
      ctx.moveTo(x, y)
      ctx.lineTo(x - 10 * Math.cos(angle - Math.PI / 6), y - 10 * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(x - 10 * Math.cos(angle + Math.PI / 6), y - 10 * Math.sin(angle + Math.PI / 6))
    }
    
    ctx.closePath()
    ctx.fill()
  }

  public hasReachedCheese(): boolean {
    // Check if mouse is within 0.6 units of cheese center
    const dx = this.mousePos.x - this.cheesePos.x
    const dy = this.mousePos.y - this.cheesePos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < 0.6
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function MazeVectorsContent({
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

  // Simulation state (position relative to START at 1, 5)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 }) // At start position
  const [magnitude, setMagnitude] = useState(0)
  const [hasWon, setHasWon] = useState(false)
  const [moveCount, setMoveCount] = useState(0)

  // Assignment state
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [editingAssignment, setEditingAssignment] = useState<any>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<MazeNavigationEngine | null>(null)
  const totalSimulationTime = useRef(0)

  // Initialize engine
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new MazeNavigationEngine(
        canvasRef.current,
        (pos) => {
          // Convert to position relative to START (0.5, 0.5)
          const relativePos = { x: pos.x - 0.5, y: pos.y - 0.5 }
          setPosition(relativePos)
          setMagnitude(Math.sqrt(relativePos.x ** 2 + relativePos.y ** 2))
          setMoveCount(prev => prev + 1)
          
          // Check if reached cheese
          if (engineRef.current?.hasReachedCheese() && !hasWon) {
            setHasWon(true)
            onComplete({
              finalPosition: pos,
              magnitude: Math.sqrt(pos.x ** 2 + pos.y ** 2),
              moveCount
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=maze-vectors')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset()
      setPosition({ x: 0, y: 0 }) // Back to start position (origin)
      setMagnitude(0)
      setHasWon(false)
      setMoveCount(0)
      onInteraction('reset', {})
    }
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
            <h1 className="text-3xl font-bold mb-2">Maze Navigator: Vector Addition</h1>
            <p className="text-muted-foreground">
              Guide the mouse to the cheese and watch how position vectors are built from x and y components
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
        {/* Left Column: Maze */}
        <div className="lg:col-span-2 space-y-6">
          {/* Maze Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Maze Navigation</CardTitle>
              <CardDescription>Navigate through the circular maze to reach the cheese at the center</CardDescription>
            </CardHeader>
            <CardContent>
              <canvas 
                ref={canvasRef}
                className="w-full border-2 border-border rounded-lg bg-white"
              />

              {/* Controls Hint */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <div className="font-semibold mb-2 text-blue-900">🎮 Controls:</div>
                <div className="grid grid-cols-2 gap-2 text-blue-700">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4" />
                    <span>Arrow Keys or WASD to move</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    <span>Navigate through the maze</span>
                  </div>
                </div>
              </div>

              {hasWon && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="text-lg font-bold text-green-900 mb-1">🎉 You Found the Cheese!</div>
                  <div className="text-sm text-green-700">
                    Final position: ({position.x.toFixed(2)}, {position.y.toFixed(2)})
                  </div>
                  <Button 
                    onClick={() => {
                      handleReset()
                      resetCompletion() // Reset completion tracking
                    }}
                    className="mt-2"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vector Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Position Vector</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="text-xs text-red-700 mb-1">X-Component</div>
                  <div className="text-2xl font-bold text-red-900">{position.x.toFixed(2)}m</div>
                  <div className="text-xs text-red-600 mt-1">→ Horizontal</div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="text-xs text-blue-700 mb-1">Y-Component</div>
                  <div className="text-2xl font-bold text-blue-900">{position.y.toFixed(2)}m</div>
                  <div className="text-xs text-blue-600 mt-1">↓ Vertical</div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="text-xs text-purple-700 mb-1">Magnitude |r|</div>
                  <div className="text-2xl font-bold text-purple-900">{magnitude.toFixed(2)}m</div>
                  <div className="text-xs text-purple-600 mt-1">Resultant</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Learning Content */}
        <div className="space-y-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Start
              </Button>

              <div className="text-sm text-muted-foreground">
                Moves: {moveCount}
              </div>
            </CardContent>
          </Card>

          {/* Vector Addition Formula */}
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-green-900">📐 Vector Addition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
                <div className="font-semibold text-purple-900 mb-2">Position Vector</div>
                <div className="text-lg font-mono bg-purple-50 p-2 rounded text-center">
                  r⃗ = x⃗ + y⃗
                </div>
                <div className="mt-2 text-center text-sm text-purple-700">
                  = {position.x.toFixed(2)}x̂ + {position.y.toFixed(2)}ŷ
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
                <div className="font-semibold text-purple-900 mb-2">Magnitude (Pythagorean Theorem)</div>
                <div className="text-base font-mono bg-purple-50 p-2 rounded text-center">
                  |r⃗| = √(x² + y²)
                </div>
                <div className="mt-2 text-center text-sm text-purple-700">
                  = √({position.x.toFixed(2)}² + {position.y.toFixed(2)}²)
                </div>
                <div className="mt-1 text-center text-sm font-bold text-purple-900">
                  = {magnitude.toFixed(2)}m
                </div>
              </div>

              <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900">
                <strong>💡 Watch:</strong> The purple vector (r⃗) is the sum of the red (x⃗) and blue (y⃗) vectors! It shows your displacement from START.
              </div>
            </CardContent>
          </Card>

          {/* Key Concepts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Key Concepts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-red-50 rounded-lg">
                <h4 className="font-semibold mb-1 text-red-900">🔴 X-Component</h4>
                <ul className="text-red-800 space-y-1 list-disc list-inside text-xs">
                  <li>Horizontal distance from origin</li>
                  <li>Parallel to x-axis (→)</li>
                  <li>Measured in meters</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-1 text-blue-900">🔵 Y-Component</h4>
                <ul className="text-blue-800 space-y-1 list-disc list-inside text-xs">
                  <li>Vertical distance from origin</li>
                  <li>Parallel to y-axis (↓)</li>
                  <li>Measured in meters</li>
                </ul>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-1 text-purple-900">🟣 Resultant Vector</h4>
                <ul className="text-purple-800 space-y-1 list-disc list-inside text-xs">
                  <li>Direct path from START to current position</li>
                  <li>Sum of x and y components</li>
                  <li>Length = √(x² + y²)</li>
                  <li>Shown as dashed purple arrow</li>
                  <li>This is your displacement from start!</li>
                </ul>
              </div>

              <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                <h4 className="font-semibold mb-1 text-green-900">✅ Vector Addition Rule</h4>
                <p className="text-green-800 text-xs">
                  To add vectors, add their components separately:
                  <br/>r⃗ = (x₁ + x₂)x̂ + (y₁ + y₂)ŷ
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Try This */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Try This!</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">1.</span>
                  <span>Move to different positions and watch the vectors change</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">2.</span>
                  <span>Notice how purple vector shows your displacement from START</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">3.</span>
                  <span>Calculate: If x=3m and y=4m, what's |r⃗|? (Answer: 5m!)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">4.</span>
                  <span>Navigate from top-left (0,0) to bottom-right (19,19) to reach the cheese</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">5.</span>
                  <span>Try moving in just x-direction, then just y-direction to see components</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Components */}
      {!isAdmin && (
        <SimulationAssignment
          simulationSlug="maze-vectors"
          simulationTime={totalSimulationTime.current}
          simulationCompleted={hasWon}
          simulationData={{
            finalPosition: position,
            magnitude: magnitude,
            moveCount: moveCount
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
          simulationSlug="maze-vectors"
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

// Wrapped export with tracking
export default function MazeVectorsSimulation() {
  return (
    <SimulationWrapper
      simulationSlug="maze-vectors"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <MazeVectorsContent {...props} />}
    </SimulationWrapper>
  )
}

