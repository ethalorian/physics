'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import MathMarkdown from '@/components/MathMarkdown'
import { RotateCcw, Move, Bug } from 'lucide-react'

interface Point {
  x: number
  y: number
}

interface PathPoint extends Point {
  timestamp: number
}

export default function DistanceDisplacementPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bug, setBug] = useState<Point>({ x: 300, y: 300 })
  const [initialPosition, setInitialPosition] = useState<Point>({ x: 300, y: 300 })
  const [path, setPath] = useState<PathPoint[]>([{ x: 300, y: 300, timestamp: Date.now() }])
  const [origin, setOrigin] = useState<Point>({ x: 50, y: 550 })
  const [rotation, setRotation] = useState(0) // in degrees
  const [isDraggingBug, setIsDraggingBug] = useState(false)
  const [isDraggingOrigin, setIsDraggingOrigin] = useState(false)
  const [isDrawingMode, setIsDrawingMode] = useState(true)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null)
  const [lockedAxis, setLockedAxis] = useState<'x' | 'y' | null>(null)
  
  const canvasWidth = 700
  const canvasHeight = 600
  
  // Transform point from canvas to physics coordinates
  const toPhysicsCoords = useCallback((point: Point): Point => {
    const dx = point.x - origin.x
    const dy = origin.y - point.y // Flip y-axis
    
    // Apply rotation
    const rad = (rotation * Math.PI) / 180
    const rotatedX = dx * Math.cos(rad) - dy * Math.sin(rad)
    const rotatedY = dx * Math.sin(rad) + dy * Math.cos(rad)
    
    return { x: rotatedX / 50, y: rotatedY / 50 } // Scale to meters (50px = 1m)
  }, [origin, rotation])
  
  // Calculate total distance traveled
  const totalDistance = useCallback(() => {
    let distance = 0
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x
      const dy = path[i].y - path[i - 1].y
      distance += Math.sqrt(dx * dx + dy * dy)
    }
    return distance / 50 // Convert to meters
  }, [path])
  
  // Calculate displacement
  const displacement = useCallback(() => {
    const initial = toPhysicsCoords(initialPosition)
    const final = toPhysicsCoords(bug)
    const dx = final.x - initial.x
    const dy = final.y - initial.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    return { magnitude, angle, dx, dy }
  }, [bug, initialPosition, toPhysicsCoords])
  
  // Handle keyboard events for shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true)
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false)
        setLockedAxis(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  // Draw everything on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let x = 0; x <= canvasWidth; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasHeight)
      ctx.stroke()
    }
    for (let y = 0; y <= canvasHeight; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasWidth, y)
      ctx.stroke()
    }
    
    // Draw coordinate axes
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 3
    
    // X-axis
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    const xAxisEnd = {
      x: origin.x + 200 * Math.cos((rotation * Math.PI) / 180),
      y: origin.y - 200 * Math.sin((rotation * Math.PI) / 180)
    }
    ctx.lineTo(xAxisEnd.x, xAxisEnd.y)
    ctx.stroke()
    
    // X-axis arrow
    const arrowSize = 10
    const xAngle = (rotation * Math.PI) / 180
    ctx.beginPath()
    ctx.moveTo(xAxisEnd.x, xAxisEnd.y)
    ctx.lineTo(
      xAxisEnd.x - arrowSize * Math.cos(xAngle - Math.PI / 6),
      xAxisEnd.y + arrowSize * Math.sin(xAngle - Math.PI / 6)
    )
    ctx.moveTo(xAxisEnd.x, xAxisEnd.y)
    ctx.lineTo(
      xAxisEnd.x - arrowSize * Math.cos(xAngle + Math.PI / 6),
      xAxisEnd.y + arrowSize * Math.sin(xAngle + Math.PI / 6)
    )
    ctx.stroke()
    
    // X-axis label
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('x', xAxisEnd.x + 10, xAxisEnd.y)
    
    // Y-axis
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    const yAngle = ((rotation + 90) * Math.PI) / 180
    const yAxisEnd = {
      x: origin.x + 200 * Math.cos(yAngle),
      y: origin.y - 200 * Math.sin(yAngle)
    }
    ctx.lineTo(yAxisEnd.x, yAxisEnd.y)
    ctx.stroke()
    
    // Y-axis arrow
    ctx.beginPath()
    ctx.moveTo(yAxisEnd.x, yAxisEnd.y)
    ctx.lineTo(
      yAxisEnd.x - arrowSize * Math.cos(yAngle - Math.PI / 6),
      yAxisEnd.y + arrowSize * Math.sin(yAngle - Math.PI / 6)
    )
    ctx.moveTo(yAxisEnd.x, yAxisEnd.y)
    ctx.lineTo(
      yAxisEnd.x - arrowSize * Math.cos(yAngle + Math.PI / 6),
      yAxisEnd.y + arrowSize * Math.sin(yAngle + Math.PI / 6)
    )
    ctx.stroke()
    
    // Y-axis label
    ctx.fillText('y', yAxisEnd.x, yAxisEnd.y - 10)
    
    // Draw path (dotted line)
    if (path.length > 1) {
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // Draw position vector from origin to initial position
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 3
    drawArrow(ctx, origin.x, origin.y, initialPosition.x, initialPosition.y, '#8b5cf6')
    
    // Label for initial position vector
    const initialMidX = (origin.x + initialPosition.x) / 2
    const initialMidY = (origin.y + initialPosition.y) / 2
    ctx.fillStyle = '#8b5cf6'
    ctx.font = 'bold 14px sans-serif'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeText('r⃗ᵢ', initialMidX + 10, initialMidY - 5)
    ctx.fillText('r⃗ᵢ', initialMidX + 10, initialMidY - 5)
    
    // Draw position vector from origin to final position
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    drawArrow(ctx, origin.x, origin.y, bug.x, bug.y, '#3b82f6')
    
    // Label for final position vector
    const finalMidX = (origin.x + bug.x) / 2
    const finalMidY = (origin.y + bug.y) / 2
    ctx.fillStyle = '#3b82f6'
    ctx.font = 'bold 14px sans-serif'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeText('r⃗f', finalMidX + 10, finalMidY - 5)
    ctx.fillText('r⃗f', finalMidX + 10, finalMidY - 5)
    
    // Draw displacement vector
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 4
    drawArrow(ctx, initialPosition.x, initialPosition.y, bug.x, bug.y, '#ef4444')
    
    // Label for displacement vector
    const dispMidX = (initialPosition.x + bug.x) / 2
    const dispMidY = (initialPosition.y + bug.y) / 2
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 16px sans-serif'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeText('Δr⃗', dispMidX + 10, dispMidY - 5)
    ctx.fillText('Δr⃗', dispMidX + 10, dispMidY - 5)
    
    // Draw origin point
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(origin.x, origin.y, 8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw initial position
    ctx.fillStyle = '#8b5cf6'
    ctx.beginPath()
    ctx.arc(initialPosition.x, initialPosition.y, 8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw bug - more detailed sprite
    // Bug body (oval)
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.ellipse(bug.x, bug.y, 12, 16, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#065f46'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Bug head (circle)
    ctx.fillStyle = '#059669'
    ctx.beginPath()
    ctx.arc(bug.x, bug.y - 12, 8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#065f46'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Antennae
    ctx.strokeStyle = '#065f46'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(bug.x - 4, bug.y - 15)
    ctx.lineTo(bug.x - 8, bug.y - 22)
    ctx.moveTo(bug.x + 4, bug.y - 15)
    ctx.lineTo(bug.x + 8, bug.y - 22)
    ctx.stroke()
    
    // Antennae tips
    ctx.fillStyle = '#065f46'
    ctx.beginPath()
    ctx.arc(bug.x - 8, bug.y - 22, 2, 0, 2 * Math.PI)
    ctx.arc(bug.x + 8, bug.y - 22, 2, 0, 2 * Math.PI)
    ctx.fill()
    
    // Bug eyes
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(bug.x - 3, bug.y - 13, 3, 0, 2 * Math.PI)
    ctx.arc(bug.x + 3, bug.y - 13, 3, 0, 2 * Math.PI)
    ctx.fill()
    
    // Eye pupils
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(bug.x - 3, bug.y - 13, 1.5, 0, 2 * Math.PI)
    ctx.arc(bug.x + 3, bug.y - 13, 1.5, 0, 2 * Math.PI)
    ctx.fill()
    
    // Legs (6 legs)
    ctx.strokeStyle = '#065f46'
    ctx.lineWidth = 2
    // Left legs
    ctx.beginPath()
    ctx.moveTo(bug.x - 10, bug.y - 5)
    ctx.lineTo(bug.x - 18, bug.y - 8)
    ctx.moveTo(bug.x - 11, bug.y)
    ctx.lineTo(bug.x - 20, bug.y - 2)
    ctx.moveTo(bug.x - 10, bug.y + 5)
    ctx.lineTo(bug.x - 18, bug.y + 8)
    // Right legs
    ctx.moveTo(bug.x + 10, bug.y - 5)
    ctx.lineTo(bug.x + 18, bug.y - 8)
    ctx.moveTo(bug.x + 11, bug.y)
    ctx.lineTo(bug.x + 20, bug.y - 2)
    ctx.moveTo(bug.x + 10, bug.y + 5)
    ctx.lineTo(bug.x + 18, bug.y + 8)
    ctx.stroke()
    
    // Spots on back
    ctx.fillStyle = '#047857'
    ctx.beginPath()
    ctx.arc(bug.x - 4, bug.y - 2, 2, 0, 2 * Math.PI)
    ctx.arc(bug.x + 4, bug.y - 2, 2, 0, 2 * Math.PI)
    ctx.arc(bug.x, bug.y + 4, 2, 0, 2 * Math.PI)
    ctx.fill()
    
  }, [bug, initialPosition, path, origin, rotation, canvasWidth, canvasHeight])
  
  // Draw arrow helper
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
    const headLength = 15
    const dx = toX - fromX
    const dy = toY - fromY
    const angle = Math.atan2(dy, dx)
    
    // Draw line
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()
    
    // Draw arrowhead
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
  
  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Check if clicking on bug
    const bugDist = Math.sqrt((x - bug.x) ** 2 + (y - bug.y) ** 2)
    if (bugDist < 15) {
      setIsDraggingBug(true)
      setIsDrawingMode(false)
      setDragStartPos({ x: bug.x, y: bug.y })
      setLockedAxis(null)
      return
    }
    
    // Check if clicking on origin
    const originDist = Math.sqrt((x - origin.x) ** 2 + (y - origin.y) ** 2)
    if (originDist < 15) {
      setIsDraggingOrigin(true)
      return
    }
    
    // Otherwise, move bug to new location
    if (isDrawingMode) {
      setBug({ x, y })
      setPath(prev => [...prev, { x, y, timestamp: Date.now() }])
    }
  }
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    
    if (isDraggingBug) {
      // Apply axis locking when shift is pressed
      if (isShiftPressed && dragStartPos) {
        // Determine which axis to lock to if not already determined
        if (lockedAxis === null) {
          const dx = Math.abs(x - dragStartPos.x)
          const dy = Math.abs(y - dragStartPos.y)
          
          // Lock to the axis with more initial movement
          if (dx > 5 || dy > 5) { // Threshold to avoid premature locking
            setLockedAxis(dx > dy ? 'x' : 'y')
          }
        }
        
        // Apply the axis lock
        if (lockedAxis === 'x') {
          y = bug.y // Keep y constant
        } else if (lockedAxis === 'y') {
          x = bug.x // Keep x constant
        }
      }
      
      setBug({ x, y })
      setPath(prev => [...prev, { x, y, timestamp: Date.now() }])
    } else if (isDraggingOrigin) {
      setOrigin({ x, y })
    }
  }
  
  const handleMouseUp = () => {
    setIsDraggingBug(false)
    setIsDraggingOrigin(false)
    setDragStartPos(null)
    if (!isShiftPressed) {
      setLockedAxis(null)
    }
  }
  
  const handleReset = () => {
    const resetPos = { x: 300, y: 300 }
    setBug(resetPos)
    setInitialPosition(resetPos)
    setPath([{ x: resetPos.x, y: resetPos.y, timestamp: Date.now() }])
  }
  
  const handleResetOrigin = () => {
    setOrigin({ x: 50, y: 550 })
    setRotation(0)
  }
  
  const dist = totalDistance()
  const disp = displacement()
  const initialPhysics = toPhysicsCoords(initialPosition)
  const finalPhysics = toPhysicsCoords(bug)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Distance vs Displacement Visualizer</h1>
          <p className="text-muted-foreground text-lg">
            Move the bug around to see the difference between distance traveled and displacement!
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-green-600" />
                Interactive Canvas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="border-2 border-border rounded-lg cursor-pointer bg-white"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              
              {/* Legend */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>Bug (click to move)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-gray-500" style={{ borderTop: '2px dashed' }}></div>
                  <span>Path traveled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-purple-500"></div>
                  <span>Initial position vector</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-blue-500"></div>
                  <span>Final position vector</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-red-500"></div>
                  <span className="font-bold">Displacement vector</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span>Origin (drag to move)</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Controls & Readouts */}
          <div className="space-y-6">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isShiftPressed && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="text-yellow-600 dark:text-yellow-400 font-bold">⇧ SHIFT MODE</div>
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Movement locked to {lockedAxis === 'x' ? 'horizontal' : lockedAxis === 'y' ? 'vertical' : 'primary'} axis
                    </div>
                  </div>
                )}
                
                <Button onClick={handleReset} variant="outline" className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Bug Path
                </Button>
                
                <Button onClick={handleResetOrigin} variant="outline" className="w-full">
                  <Move className="h-4 w-4 mr-2" />
                  Reset Origin & Rotation
                </Button>
                
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="rotation">Coordinate Rotation (degrees)</Label>
                  <Input
                    id="rotation"
                    type="number"
                    step="15"
                    value={rotation}
                    onChange={(e) => setRotation(parseFloat(e.target.value) || 0)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Rotate the coordinate system to simplify calculations
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    <strong>💡 Tip:</strong> Hold <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">Shift</kbd> while dragging to lock movement to horizontal or vertical
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Readouts */}
            <Card>
              <CardHeader>
                <CardTitle>Measurements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Distance</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {dist.toFixed(2)} m
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Length of path traveled
                  </div>
                </div>
                
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Displacement Vector</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {disp.magnitude.toFixed(2)} m
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Direction: {disp.angle.toFixed(1)}° from +x axis
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                    <div><strong>x-component:</strong> Δx = {disp.dx.toFixed(2)} m</div>
                    <div><strong>y-component:</strong> Δy = {disp.dy.toFixed(2)} m</div>
                  </div>
                </div>
                
                {dist > 0 && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Badge variant={dist > disp.magnitude ? "default" : "secondary"}>
                      {dist > disp.magnitude 
                        ? "Distance > Displacement" 
                        : "Distance = Displacement"}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-2">
                      {dist > disp.magnitude 
                        ? "The path is not a straight line!" 
                        : "The path is a straight line"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Position Vectors - Horizontal Layout Spanning Both Columns */}
        <Card>
          <CardHeader>
            <CardTitle>Position Vectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-500">
                <div className="text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">Initial Position Vector</div>
                <MathMarkdown content={`\\[ \\vec{r}_i = (${initialPhysics.x.toFixed(2)}, ${initialPhysics.y.toFixed(2)}) \\, \\text{m} \\]`} />
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <div><strong>x-component:</strong> {initialPhysics.x.toFixed(2)} m</div>
                  <div><strong>y-component:</strong> {initialPhysics.y.toFixed(2)} m</div>
                  <div className="mt-1 text-xs">From origin to starting point</div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
                <div className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">Final Position Vector</div>
                <MathMarkdown content={`\\[ \\vec{r}_f = (${finalPhysics.x.toFixed(2)}, ${finalPhysics.y.toFixed(2)}) \\, \\text{m} \\]`} />
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <div><strong>x-component:</strong> {finalPhysics.x.toFixed(2)} m</div>
                  <div><strong>y-component:</strong> {finalPhysics.y.toFixed(2)} m</div>
                  <div className="mt-1 text-xs">From origin to current position</div>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-500">
                <div className="text-sm font-semibold mb-2 text-red-700 dark:text-red-300">Displacement Vector</div>
                <MathMarkdown content={`\\[ \\vec{\\Delta r} = \\vec{r}_f - \\vec{r}_i = (${disp.dx.toFixed(2)}, ${disp.dy.toFixed(2)}) \\, \\text{m} \\]`} />
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <div><strong>x-component:</strong> Δx = {disp.dx.toFixed(2)} m</div>
                  <div><strong>y-component:</strong> Δy = {disp.dy.toFixed(2)} m</div>
                  <div className="mt-1 text-xs">Direct path from start to end</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Educational Content */}
        <Card>
          <CardHeader>
            <CardTitle>Understanding Distance vs Displacement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MathMarkdown content={`
## Key Concepts

**Distance** is a scalar quantity representing the **total length of the path traveled**. It&apos;s always positive and depends on the route taken.

\\[ \\text{Distance} = \\text{length of dotted path} \\]

**Displacement** is a vector quantity representing the **straight-line distance from initial to final position**. It has both magnitude and direction.

\\[ \\vec{\\Delta r} = \\vec{r}_f - \\vec{r}_i \\]

## Relationship

- If motion is in a **straight line**, distance = displacement magnitude
- If the path is **curved or changes direction**, distance > displacement magnitude
- Displacement can be **zero** even if distance is large (return to start!)

## Using Different Origins

Moving the origin changes the **position vectors** but the **displacement stays the same**! Try it:
1. Drag the orange origin point to a new location
2. Notice how position vectors change, but displacement remains constant
3. Rotate the coordinate system to align with the displacement for simpler math
            `} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
