'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MathMarkdown from '@/components/MathMarkdown'
import { ArrowRight, Plus, Settings, FileText } from 'lucide-react'
import { SimulationWrapper } from '@/components/simulations/SimulationWrapper'
import SimulationAssignment from '@/components/simulations/SimulationAssignment'
import SimulationAssignmentEditor from '@/components/simulations/SimulationAssignmentEditor'

interface Point {
  x: number
  y: number
}

type GraphContext = 'kinematics' | 'generic'

function SlopeCalculatorContent({
  onInteraction,
  onComplete
}: {
  onInteraction: (action: string, data: Record<string, any>) => void
  onComplete: (data: Record<string, any>, score?: number) => void
}) {
  const { data: session } = useSession()
  const userRole = getUserRole(session?.user?.email)
  const isAdmin = userRole === 'admin' || userRole === 'teacher'
  const totalSimulationTime = useRef(0)
  
  const [point1, setPoint1] = useState<Point>({ x: 0, y: 0 })
  const [point2, setPoint2] = useState<Point>({ x: 4, y: 8 })
  const [context, setContext] = useState<GraphContext>('kinematics')
  const [inputMode, setInputMode] = useState<'points' | 'equation'>('points')
  
  // Equation mode variables
  const [x0, setX0] = useState(0) // Initial position
  const [v0, setV0] = useState(2) // Initial velocity
  const [acceleration, setAcceleration] = useState(0) // Acceleration
  const [timeRange, setTimeRange] = useState(4) // Time duration
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
      const response = await fetch('/api/simulations/assignments?simulation_slug=slope-calculator')
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
  
  // Update points from equation when in equation mode
  useEffect(() => {
    if (inputMode === 'equation' && context === 'kinematics') {
      // Use kinematic equation: x = x0 + v0*t + 0.5*a*t²
      const t1 = 0
      const t2 = timeRange
      
      const x1 = x0 + v0 * t1 + 0.5 * acceleration * t1 * t1
      const x2 = x0 + v0 * t2 + 0.5 * acceleration * t2 * t2
      
      setPoint1({ x: t1, y: x1 })
      setPoint2({ x: t2, y: x2 })
    }
  }, [inputMode, context, x0, v0, acceleration, timeRange])
  
  // Ensure points are in order (point1.x < point2.x)
  const orderedPoints = point1.x <= point2.x 
    ? { p1: point1, p2: point2 }
    : { p1: point2, p2: point1 }
  
  const calculateSlope = useCallback((y1: number, y2: number, x1: number, x2: number) => {
    const deltaY = y2 - y1
    const deltaX = x2 - x1
    
    if (deltaX === 0) return null
    
    return {
      slope: deltaY / deltaX,
      deltaY,
      deltaX
    }
  }, [])
  
  // Calculate position-time slope (velocity)
  const positionResult = calculateSlope(
    orderedPoints.p1.y, 
    orderedPoints.p2.y, 
    orderedPoints.p1.x, 
    orderedPoints.p2.x
  )
  
  // Calculate y-intercept (b) using y = mx + b
  // b = y - mx (using point 1)
  const yIntercept = positionResult 
    ? orderedPoints.p1.y - positionResult.slope * orderedPoints.p1.x 
    : 0
  
  // For kinematics mode, calculate derived graphs
  // In equation mode, use actual values; in point mode, derive from slope
  const velocity = inputMode === 'equation' && context === 'kinematics' 
    ? v0  // Initial velocity for equation mode
    : positionResult?.slope || 0
  
  const actualAcceleration = inputMode === 'equation' && context === 'kinematics'
    ? acceleration
    : 0
  
  
  const handleReset = () => {
    setPoint1({ x: 0, y: 0 })
    setPoint2({ x: 4, y: 8 })
  }
  
  const handleSwapPoints = () => {
    const temp = { ...point1 }
    setPoint1(point2)
    setPoint2(temp)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold">Slope Calculator & Kinematics Visualizer</h1>
              <Badge variant="default">Intermediate</Badge>
              {isAdmin && assignments.length > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <FileText className="h-3 w-3 mr-1" />
                  {assignments.length} Assignment{assignments.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg">
              Calculate slope and understand the relationships between position, velocity, and acceleration in kinematics.
            </p>
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
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Configure Points</CardTitle>
            </CardHeader>
              <CardContent className="space-y-6">
                {/* Context Selection */}
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select value={context} onValueChange={(val) => setContext(val as GraphContext)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kinematics">Kinematics (Position-Time)</SelectItem>
                      <SelectItem value="generic">Generic (x, y)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {context === 'kinematics' 
                      ? 'Shows position, velocity, and acceleration graphs'
                      : 'Simple slope calculation'}
                  </p>
                </div>
                
                {/* Input Mode Toggle (Kinematics only) */}
                {context === 'kinematics' && (
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <Label>Input Method</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={inputMode === 'points' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setInputMode('points')}
                        className="flex-1"
                      >
                        Points
                      </Button>
                      <Button
                        variant={inputMode === 'equation' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setInputMode('equation')}
                        className="flex-1"
                      >
                        Equation
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {inputMode === 'points' 
                        ? 'Enter two points manually'
                        : 'Use kinematic equations (UAM)'}
                    </p>
                  </div>
                )}
              
              {/* Point Input Mode */}
              {inputMode === 'points' && (
                <>
                  {/* Point 1 */}
                  <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                      Point 1 (Start)
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="p1x" className="text-sm">
                          {context === 'kinematics' ? 'Time (s)' : 'x'}
                        </Label>
                        <Input
                          id="p1x"
                          type="number"
                          step="0.01"
                          value={point1.x}
                          onChange={(e) => setPoint1({ ...point1, x: parseFloat(e.target.value) || 0 })}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="p1y" className="text-sm">
                          {context === 'kinematics' ? 'Position (m)' : 'y'}
                        </Label>
                        <Input
                          id="p1y"
                          type="number"
                          step="0.01"
                          value={point1.y}
                          onChange={(e) => setPoint1({ ...point1, y: parseFloat(e.target.value) || 0 })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Point 2 */}
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      Point 2 (End)
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="p2x" className="text-sm">
                          {context === 'kinematics' ? 'Time (s)' : 'x'}
                        </Label>
                        <Input
                          id="p2x"
                          type="number"
                          step="0.01"
                          value={point2.x}
                          onChange={(e) => setPoint2({ ...point2, x: parseFloat(e.target.value) || 0 })}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="p2y" className="text-sm">
                          {context === 'kinematics' ? 'Position (m)' : 'y'}
                        </Label>
                        <Input
                          id="p2y"
                          type="number"
                          step="0.01"
                          value={point2.y}
                          onChange={(e) => setPoint2({ ...point2, y: parseFloat(e.target.value) || 0 })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Equation Input Mode */}
              {inputMode === 'equation' && context === 'kinematics' && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-semibold mb-2">Kinematic Variables</div>
                  <div className="text-xs text-muted-foreground mb-4">
                    Equation: x = x₀ + v₀t + ½at²
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="x0" className="text-sm flex items-center gap-2">
                        Initial Position (x₀)
                        <span className="text-xs text-muted-foreground">meters</span>
                      </Label>
                      <Input
                        id="x0"
                        type="number"
                        step="0.01"
                        value={x0}
                        onChange={(e) => setX0(parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="v0" className="text-sm flex items-center gap-2">
                        Initial Velocity (v₀)
                        <span className="text-xs text-muted-foreground">m/s</span>
                      </Label>
                      <Input
                        id="v0"
                        type="number"
                        step="0.01"
                        value={v0}
                        onChange={(e) => setV0(parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="acceleration" className="text-sm flex items-center gap-2">
                        Acceleration (a)
                        <span className="text-xs text-muted-foreground">m/s²</span>
                      </Label>
                      <Input
                        id="acceleration"
                        type="number"
                        step="0.01"
                        value={acceleration}
                        onChange={(e) => setAcceleration(parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timeRange" className="text-sm flex items-center gap-2">
                        Time Duration (t)
                        <span className="text-xs text-muted-foreground">seconds</span>
                      </Label>
                      <Input
                        id="timeRange"
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={timeRange}
                        onChange={(e) => setTimeRange(Math.max(0.1, parseFloat(e.target.value) || 1))}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-3 p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
                    <strong>Generated Points:</strong><br/>
                    Point 1: t = 0s, x = {x0.toFixed(2)}m<br/>
                    Point 2: t = {timeRange.toFixed(2)}s, x = {(x0 + v0 * timeRange + 0.5 * acceleration * timeRange * timeRange).toFixed(2)}m
                  </div>
                </div>
              )}
              
              {inputMode === 'points' && (
                <div className="flex gap-2">
                  <Button onClick={handleSwapPoints} variant="outline" className="flex-1" size="sm">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Swap
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1" size="sm">
                    Reset
                  </Button>
                </div>
              )}
              
              {inputMode === 'equation' && (
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-xs text-muted-foreground">
                  <strong>💡 Tip:</strong> Change the variables above to see how they affect all three graphs!
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Visualization Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {context === 'kinematics' ? 'Kinematics Graphs' : 'Graph Visualization'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {context === 'kinematics' ? (
                <Tabs defaultValue="position" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="position">Position vs Time</TabsTrigger>
                    <TabsTrigger value="velocity">Velocity vs Time</TabsTrigger>
                    <TabsTrigger value="acceleration">Acceleration vs Time</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="position" className="space-y-4">
                    <GraphVisualization
                      point1={orderedPoints.p1}
                      point2={orderedPoints.p2}
                      xLabel="Time (s)"
                      yLabel="Position (m)"
                      showRiseRun={inputMode === 'points'}
                      isEquationMode={inputMode === 'equation'}
                      equationParams={{ x0, v0, a: acceleration }}
                    />
                    {positionResult && (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                          <h3 className="font-semibold text-lg mb-2">
                            {inputMode === 'equation' ? 'Kinematic Equation' : 'Equation of the Line'}
                          </h3>
                          {inputMode === 'equation' ? (
                            actualAcceleration !== 0 ? (
                              <MathMarkdown content={`**General Position Equation:**

\\[ x = x_0 + v_0 t + \\frac{1}{2}at^2 \\]

**With your values:**

\\[ x = ${x0.toFixed(2)} + ${v0.toFixed(2)}t + \\frac{1}{2}(${acceleration.toFixed(2)})t^2 \\]

This is a **parabola** (curved line).

- At t=0: x = ${x0.toFixed(2)} m
- At t=${timeRange.toFixed(2)}s: x = ${(x0 + v0 * timeRange + 0.5 * acceleration * timeRange * timeRange).toFixed(2)} m`} />
                            ) : (
                              <MathMarkdown content={`**General Position Equation:**

\\[ x = x_0 + v_0 t + \\frac{1}{2}at^2 \\]

**With a = 0, this simplifies to:**

\\[ x = ${x0.toFixed(2)} + ${v0.toFixed(2)}t \\]

This is a **straight line** (constant velocity).

- At t=0: x = ${x0.toFixed(2)} m
- At t=${timeRange.toFixed(2)}s: x = ${(x0 + v0 * timeRange).toFixed(2)} m`} />
                            )
                          ) : (
                            <MathMarkdown content={`**Slope-Intercept Form:**

\\[ x = ${positionResult.slope.toFixed(3)}t ${yIntercept >= 0 ? '+ ' : ''}${yIntercept.toFixed(3)} \\]

**Point-Slope Form:**

\\[ x - ${orderedPoints.p1.y.toFixed(3)} = ${positionResult.slope.toFixed(3)}(t - ${orderedPoints.p1.x.toFixed(3)}) \\]

where slope m = ${positionResult.slope.toFixed(3)} and y-intercept b = ${yIntercept.toFixed(3)}`} />
                          )}
                        </div>
                        
                        {inputMode === 'equation' ? (
                          <div className="p-4 bg-muted rounded-lg space-y-2">
                            <h3 className="font-semibold text-lg">Understanding the Motion</h3>
                            <MathMarkdown content={`
**Your scenario:**
- Starts at position ${x0.toFixed(2)} m
- Initial velocity of ${v0.toFixed(2)} m/s
- ${acceleration === 0 ? 'No acceleration (constant velocity)' : `Acceleration of ${acceleration.toFixed(2)} m/s²`}

${acceleration !== 0 ? `
**What&apos;s happening:**
The object ${acceleration > 0 ? 'speeds up' : 'slows down'} as time passes. The position changes faster and faster because velocity is changing.

**Average velocity over this time:**
\\[ \\bar{v} = \\frac{x_f - x_0}{t} = \\frac{${(x0 + v0 * timeRange + 0.5 * acceleration * timeRange * timeRange).toFixed(2)} - ${x0.toFixed(2)}}{${timeRange.toFixed(2)}} = ${((v0 * timeRange + 0.5 * acceleration * timeRange * timeRange) / timeRange).toFixed(2)} \\, \\text{m/s} \\]
` : `
**What&apos;s happening:**
The object moves at a constant ${v0.toFixed(2)} m/s. No acceleration means velocity stays the same, creating a straight line.

**Velocity at any time:** ${v0.toFixed(2)} m/s (constant)
`}
                            `} />
                          </div>
                        ) : (
                          <div className="p-4 bg-muted rounded-lg space-y-2">
                            <h3 className="font-semibold text-lg">Velocity Calculation</h3>
                            <MathMarkdown content={`
**The slope of a position-time graph tells us velocity!**

**Step 1:** Find the change in position (rise):
\\[ \\Delta x = ${positionResult.deltaY.toFixed(2)} \\, \\text{m} \\]

**Step 2:** Find the change in time (run):
\\[ \\Delta t = ${positionResult.deltaX.toFixed(2)} \\, \\text{s} \\]

**Step 3:** Divide to get velocity (slope):
\\[ v = \\frac{\\Delta x}{\\Delta t} = \\frac{${positionResult.deltaY.toFixed(2)}}{${positionResult.deltaX.toFixed(2)}} = ${positionResult.slope.toFixed(3)} \\, \\text{m/s} \\]

${positionResult.slope > 0 ? '**Interpretation:** Positive velocity → moving in the positive direction' : positionResult.slope < 0 ? '**Interpretation:** Negative velocity → moving in the negative direction' : '**Interpretation:** Zero velocity → object is at rest'}
                            `} />
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="velocity" className="space-y-4">
                    <VelocityGraph
                      point1={orderedPoints.p1}
                      point2={orderedPoints.p2}
                      velocity={velocity}
                      acceleration={actualAcceleration}
                    />
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                        <h3 className="font-semibold text-lg mb-2">
                          {inputMode === 'equation' ? 'Velocity Equation' : 'Equation of Velocity-Time Line'}
                        </h3>
                        <MathMarkdown content={`
${inputMode === 'equation' ? `
**Velocity Equation:**

\\[ v = v_0 + at \\]

**With your values:**

\\[ v = ${v0.toFixed(2)} + (${acceleration.toFixed(2)})t \\]

${actualAcceleration !== 0 ? `
This is a **slanted line** because acceleration changes velocity over time.

**At key times:**
- t = 0s: v = ${v0.toFixed(2)} m/s (initial velocity)
- t = ${timeRange.toFixed(2)}s: v = ${(v0 + acceleration * timeRange).toFixed(2)} m/s (final velocity)

**Change in velocity:** Δv = ${(acceleration * timeRange).toFixed(2)} m/s
` : `
This is a **horizontal line** because acceleration is zero.

Simplifies to: \\( v = ${v0.toFixed(2)} \\, \\text{m/s (constant)} \\)
`}
` : `
\\[ v = ${velocity.toFixed(3)} \\, \\text{m/s (constant)} \\]

This is a **horizontal line** because velocity stays the same over time.

Since velocity doesn&apos;t change, acceleration = 0.
`}
                        `} />
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <h3 className="font-semibold text-lg">
                          {inputMode === 'equation' ? 'Understanding Velocity Changes' : 'Velocity Graph Explanation'}
                        </h3>
                        <MathMarkdown content={`
${inputMode === 'equation' ? `
**How velocity changes:**

${actualAcceleration !== 0 ? `
The object ${acceleration > 0 ? 'speeds up' : 'slows down'} at a constant rate of ${Math.abs(acceleration).toFixed(2)} m/s².

Every second:
- Velocity changes by ${acceleration.toFixed(2)} m/s
- ${acceleration > 0 ? 'Speed increases' : 'Speed decreases'}

**After ${timeRange.toFixed(2)} seconds:**
- Started at: ${v0.toFixed(2)} m/s
- Ended at: ${(v0 + acceleration * timeRange).toFixed(2)} m/s
- Total change: ${(acceleration * timeRange).toFixed(2)} m/s
` : `
The velocity **never changes** because acceleration is zero.

This is called **uniform motion** (constant velocity).

- No forces causing speeding up or slowing down
- Straight line on position-time graph
- Horizontal line on velocity-time graph
`}
` : `
The velocity from the position-time graph is **${velocity.toFixed(3)} m/s**.

**Key Connection:** 
- Straight line on position-time graph → Constant velocity
- Constant velocity → Horizontal line on velocity-time graph

The slope of the position-time graph **IS** the velocity!
`}
                        `} />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="acceleration" className="space-y-4">
                    <AccelerationGraph
                      point1={orderedPoints.p1}
                      point2={orderedPoints.p2}
                      acceleration={actualAcceleration}
                    />
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                        <h3 className="font-semibold text-lg mb-2">
                          {inputMode === 'equation' ? 'Your Acceleration Value' : 'Equation of Acceleration-Time Line'}
                        </h3>
                        <MathMarkdown content={`
${inputMode === 'equation' ? `
**Given Acceleration:**

\\[ a = ${acceleration.toFixed(2)} \\, \\text{m/s}^2 \\]

${actualAcceleration !== 0 ? `
This is **constant** throughout the motion (Uniformly Accelerated Motion - UAM).

The acceleration stays at ${acceleration.toFixed(2)} m/s² for the entire time period.

**This means:**
- Every second, velocity changes by ${acceleration.toFixed(2)} m/s
- The velocity-time graph has a slope of ${acceleration.toFixed(2)}
- The position-time graph curves ${acceleration > 0 ? 'upward' : 'downward'}
` : `
This is **zero** - no acceleration means constant velocity!

**This means:**
- Velocity never changes (stays at ${v0.toFixed(2)} m/s)
- Velocity-time graph is horizontal
- Position-time graph is a straight line
`}
` : `
\\[ a = ${actualAcceleration.toFixed(3)} \\, \\text{m/s}^2 \\text{ (constant)} \\]

${actualAcceleration !== 0 ? `
This is **constant** because we&apos;re using **uniform acceleration**.

The acceleration stays the same throughout the motion.
` : `
This is **zero** because velocity doesn&apos;t change!

When velocity is constant → acceleration = 0
`}
`}
                        `} />
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <h3 className="font-semibold text-lg">
                          {inputMode === 'equation' ? 'The Three Graph Connection' : 'Acceleration Graph Explanation'}
                        </h3>
                        <MathMarkdown content={`
${inputMode === 'equation' ? `
**Understanding the relationship between all three graphs:**

${actualAcceleration !== 0 ? `
1. **Acceleration-Time Graph** (this one): Horizontal line at ${acceleration.toFixed(2)} m/s²
   - Shows constant acceleration

2. **Velocity-Time Graph**: Slanted line
   - Starts at ${v0.toFixed(2)} m/s, ends at ${(v0 + acceleration * timeRange).toFixed(2)} m/s
   - Slope equals acceleration: ${acceleration.toFixed(2)} m/s²

3. **Position-Time Graph**: Curved line (parabola)
   - Curves because velocity is changing
   - Steeper slope over time if a > 0
   - Shallower slope over time if a < 0
` : `
1. **Acceleration-Time Graph** (this one): Horizontal line at 0
   - No acceleration

2. **Velocity-Time Graph**: Horizontal line at ${v0.toFixed(2)} m/s
   - Constant velocity

3. **Position-Time Graph**: Straight line
   - Constant slope equals the constant velocity
`}

**Remember:** Acceleration is the slope of the velocity-time graph!
` : `
**Finding Acceleration from Velocity-Time Graph:**

Acceleration is the slope of the velocity-time graph:

\\[ a = \\frac{\\text{change in velocity}}{\\text{change in time}} = \\frac{\\Delta v}{\\Delta t} \\]

Since velocity is **${velocity.toFixed(3)} m/s** the whole time:

\\[ a = \\frac{0 \\, \\text{m/s}}{${positionResult?.deltaX.toFixed(2)} \\, \\text{s}} = 0 \\, \\text{m/s}^2 \\]

**The Pattern:**
- Straight line on position-time → Constant velocity → Zero acceleration
- The slope of velocity-time graph **IS** the acceleration!
`}
                        `} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="space-y-4">
                  <GraphVisualization
                    point1={orderedPoints.p1}
                    point2={orderedPoints.p2}
                    xLabel="x"
                    yLabel="y"
                    showRiseRun={true}
                  />
                  {positionResult && (
                    <div className="space-y-4">
                      {/* Instructions Card */}
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-400 dark:border-yellow-600">
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          📚 How to Find Slope from Two Points
                        </h3>
                        <div className="text-sm space-y-2">
                          <p><strong>What you need:</strong> Two points on a line: (x₁, y₁) and (x₂, y₂)</p>
                          <p><strong>What you do:</strong> Use the slope formula</p>
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded text-center font-mono">
                            m = (y₂ - y₁) / (x₂ - x₁)
                          </div>
                          <p className="text-xs text-muted-foreground">
                            The slope tells you how steep the line is and which direction it goes.
                          </p>
                        </div>
                      </div>
                      
                      {/* Step-by-step calculation */}
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                        <h3 className="font-semibold text-lg mb-2">Step-by-Step Calculation</h3>
                        <MathMarkdown content={`
**Your points:** P1(${orderedPoints.p1.x.toFixed(2)}, ${orderedPoints.p1.y.toFixed(2)}) and P2(${orderedPoints.p2.x.toFixed(2)}, ${orderedPoints.p2.y.toFixed(2)})

**Step 1:** Find the rise (vertical change)

\\[ \\text{Rise} = y_2 - y_1 = ${orderedPoints.p2.y.toFixed(2)} - ${orderedPoints.p1.y.toFixed(2)} = ${positionResult.deltaY.toFixed(2)} \\]

This is the **green line** on the graph.

**Step 2:** Find the run (horizontal change)

\\[ \\text{Run} = x_2 - x_1 = ${orderedPoints.p2.x.toFixed(2)} - ${orderedPoints.p1.x.toFixed(2)} = ${positionResult.deltaX.toFixed(2)} \\]

This is the **red line** on the graph.

**Step 3:** Divide rise by run

\\[ m = \\frac{\\text{Rise}}{\\text{Run}} = \\frac{${positionResult.deltaY.toFixed(2)}}{${positionResult.deltaX.toFixed(2)}} = ${positionResult.slope.toFixed(3)} \\]

**Your slope is ${positionResult.slope.toFixed(3)}**
                        `} />
                      </div>
                      
                      {/* Understanding slope meaning */}
                      <div className={`p-4 rounded-lg border-2 ${
                        positionResult.slope > 0 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : positionResult.slope < 0
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                      }`}>
                        <h3 className="font-semibold text-lg mb-2">Understanding Your Slope</h3>
                        {positionResult.slope > 0 ? (
                          <MathMarkdown content={`
**✅ Positive Slope** (m = ${positionResult.slope.toFixed(3)})

**Direction:** Line goes **upward** from left to right ↗️

**What it means:**
- When x increases by 1, y increases by ${positionResult.slope.toFixed(3)}
- The larger the slope, the steeper the line
- Both variables move in the same direction

**Real-world examples:**
- Climbing a hill (distance vs height)
- Saving money over time (time vs savings)
- Speed increasing (time vs speed)
                          `} />
                        ) : positionResult.slope < 0 ? (
                          <MathMarkdown content={`
**✅ Negative Slope** (m = ${positionResult.slope.toFixed(3)})

**Direction:** Line goes **downward** from left to right ↘️

**What it means:**
- When x increases by 1, y decreases by ${Math.abs(positionResult.slope).toFixed(3)}
- The more negative, the steeper downward
- Variables move in opposite directions

**Real-world examples:**
- Going down a hill (distance vs height)
- Spending money (time vs money remaining)
- Temperature cooling down (time vs temperature)
                          `} />
                        ) : (
                          <MathMarkdown content={`
**✅ Zero Slope** (m = 0)

**Direction:** Line is **horizontal** (perfectly flat) →

**What it means:**
- When x changes, y stays exactly the same
- No relationship between x and y
- Constant value

**Real-world examples:**
- Flat road (distance vs height = 0)
- Bank account with no deposits/withdrawals
- Object at rest (time vs position)
                          `} />
                        )}
                      </div>
                      
                      {/* Equation forms */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-lg mb-2">Equation of Your Line</h3>
                        <MathMarkdown content={`
**Slope-Intercept Form:**

\\[ y = ${positionResult.slope.toFixed(3)}x ${yIntercept >= 0 ? '+ ' : ''}${yIntercept.toFixed(3)} \\]

**Point-Slope Form:**

\\[ y - ${orderedPoints.p1.y.toFixed(3)} = ${positionResult.slope.toFixed(3)}(x - ${orderedPoints.p1.x.toFixed(3)}) \\]

Both equations describe the same line! Use whichever is easier for your problem.
                        `} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignment Components */}
        {!isAdmin && (
          <SimulationAssignment
            simulationSlug="slope-calculator"
            simulationTime={totalSimulationTime.current}
            simulationCompleted={simulationCompleted}
            simulationData={{
              slope: positionResult?.slope || 0,
              point1,
              point2,
              context,
              inputMode,
              velocity: context === 'kinematics' ? velocity : undefined,
              acceleration: context === 'kinematics' ? actualAcceleration : undefined
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
            simulationSlug="slope-calculator"
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

export default function SlopeCalculatorPage() {
  return (
    <SimulationWrapper
      simulationSlug="slope-calculator"
      trackProgress={true}
      aiEnabled={true}
    >
      {(props) => <SlopeCalculatorContent {...props} />}
    </SimulationWrapper>
  )
}

// Graph visualization component
function GraphVisualization({ 
  point1, 
  point2, 
  xLabel, 
  yLabel, 
  showRiseRun,
  isEquationMode = false,
  equationParams
}: { 
  point1: Point
  point2: Point
  xLabel: string
  yLabel: string
  showRiseRun: boolean
  isEquationMode?: boolean
  equationParams?: {
    x0: number
    v0: number
    a: number
  }
}) {
  const graphWidth = 600
  const graphHeight = 400
  const padding = 60
  
  const xMin = Math.min(point1.x, point2.x, 0) - 1
  const xMax = Math.max(point1.x, point2.x) + 1
  const yMin = Math.min(point1.y, point2.y, 0) - 1
  const yMax = Math.max(point1.y, point2.y) + 1
  
  const scaleX = (graphWidth - 2 * padding) / (xMax - xMin)
  const scaleY = (graphHeight - 2 * padding) / (yMax - yMin)
  
  const toScreenX = (x: number) => padding + (x - xMin) * scaleX
  const toScreenY = (y: number) => graphHeight - padding - (y - yMin) * scaleY
  
  const point1Screen = { x: toScreenX(point1.x), y: toScreenY(point1.y) }
  const point2Screen = { x: toScreenX(point2.x), y: toScreenY(point2.y) }
  
  const deltaX = point2.x - point1.x
  const deltaY = point2.y - point1.y

  return (
    <div className="space-y-4">
      <svg width={graphWidth} height={graphHeight} className="border rounded bg-white mx-auto">
        {/* Grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={graphWidth} height={graphHeight} fill="url(#grid)" />
        
        {/* Axes */}
        <line
          x1={toScreenX(0)}
          y1={padding}
          x2={toScreenX(0)}
          y2={graphHeight - padding}
          stroke="#374151"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={toScreenY(0)}
          x2={graphWidth - padding}
          y2={toScreenY(0)}
          stroke="#374151"
          strokeWidth="2"
        />
        
        {/* Axis labels */}
        <text x={graphWidth / 2} y={graphHeight - 10} textAnchor="middle" fontSize="16" fill="#374151" fontWeight="600">
          {xLabel}
        </text>
        <text
          x="20"
          y={graphHeight / 2}
          textAnchor="middle"
          fontSize="16"
          fill="#374151"
          fontWeight="600"
          transform={`rotate(-90, 20, ${graphHeight / 2})`}
        >
          {yLabel}
        </text>
        
        {/* Rise and Run indicators */}
        {showRiseRun && deltaX !== 0 && (
          <>
            <line
              x1={point1Screen.x}
              y1={point1Screen.y}
              x2={point2Screen.x}
              y2={point1Screen.y}
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <text
              x={(point1Screen.x + point2Screen.x) / 2}
              y={point1Screen.y - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#ef4444"
              fontWeight="bold"
            >
              Δx = {deltaX.toFixed(2)}
            </text>
            
            <line
              x1={point2Screen.x}
              y1={point1Screen.y}
              x2={point2Screen.x}
              y2={point2Screen.y}
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray="8,4"
            />
            <text
              x={point2Screen.x + 45}
              y={(point1Screen.y + point2Screen.y) / 2}
              textAnchor="middle"
              fontSize="14"
              fill="#10b981"
              fontWeight="bold"
            >
              Δy = {deltaY.toFixed(2)}
            </text>
          </>
        )}
        
        {/* Line/Curve between points */}
        {isEquationMode && equationParams ? (
          <>
            {/* Draw curve using kinematic equation */}
            <path
              d={(() => {
                const numPoints = 100
                const tStart = point1.x
                const tEnd = point2.x
                const timeStep = (tEnd - tStart) / numPoints
                
                // Calculate first point
                const t0 = tStart
                const x0Val = equationParams.x0 + equationParams.v0 * t0 + 0.5 * equationParams.a * t0 * t0
                let pathData = `M ${toScreenX(t0)} ${toScreenY(x0Val)}`
                
                // Calculate intermediate points
                for (let i = 1; i <= numPoints; i++) {
                  const t = tStart + i * timeStep
                  const x = equationParams.x0 + equationParams.v0 * t + 0.5 * equationParams.a * t * t
                  const screenX = toScreenX(t)
                  const screenY = toScreenY(x)
                  pathData += ` L ${screenX} ${screenY}`
                }
                
                return pathData
              })()}
              stroke="#3b82f6"
              strokeWidth="4"
              fill="none"
            />
            
            {/* Draw small markers along curve to show it's continuous */}
            {equationParams.a !== 0 && (() => {
              const markers = []
              const tStart = point1.x
              const tEnd = point2.x
              const numMarkers = 8
              
              for (let i = 1; i < numMarkers; i++) {
                const t = tStart + (i / numMarkers) * (tEnd - tStart)
                const x = equationParams.x0 + equationParams.v0 * t + 0.5 * equationParams.a * t * t
                markers.push(
                  <circle
                    key={`marker-${i}`}
                    cx={toScreenX(t)}
                    cy={toScreenY(x)}
                    r="3"
                    fill="#3b82f6"
                  />
                )
              }
              return markers
            })()}
          </>
        ) : (
          // Draw straight line for points mode
          <line
            x1={point1Screen.x}
            y1={point1Screen.y}
            x2={point2Screen.x}
            y2={point2Screen.y}
            stroke="#3b82f6"
            strokeWidth="4"
          />
        )}
        
        {/* Points */}
        <circle cx={point1Screen.x} cy={point1Screen.y} r="8" fill="#8b5cf6" stroke="white" strokeWidth="2" />
        <text
          x={point1Screen.x}
          y={point1Screen.y - 20}
          textAnchor="middle"
          fontSize="14"
          fill="#8b5cf6"
          fontWeight="bold"
        >
          {isEquationMode ? `t=0s, x=${point1.y.toFixed(1)}m` : `P1 (${point1.x.toFixed(1)}, ${point1.y.toFixed(1)})`}
        </text>
        
        <circle cx={point2Screen.x} cy={point2Screen.y} r="8" fill="#3b82f6" stroke="white" strokeWidth="2" />
        <text
          x={point2Screen.x}
          y={point2Screen.y - 20}
          textAnchor="middle"
          fontSize="14"
          fill="#3b82f6"
          fontWeight="bold"
        >
          {isEquationMode ? `t=${point2.x.toFixed(1)}s, x=${point2.y.toFixed(1)}m` : `P2 (${point2.x.toFixed(1)}, ${point2.y.toFixed(1)})`}
        </text>
      </svg>
    </div>
  )
}

// Velocity graph component
function VelocityGraph({ 
  point1, 
  point2, 
  velocity,
  acceleration = 0
}: { 
  point1: Point
  point2: Point
  velocity: number
  acceleration?: number
}) {
  const graphWidth = 600
  const graphHeight = 400
  const padding = 60
  
  const xMin = Math.min(point1.x, 0) - 0.5
  const xMax = Math.max(point2.x, point1.x) + 0.5
  
  // Calculate velocity range, accounting for acceleration
  const vStart = velocity
  const vEnd = velocity + acceleration * (point2.x - point1.x)
  const vMin = Math.min(vStart, vEnd, 0)
  const vMax = Math.max(vStart, vEnd, 1)
  const yMin = vMin - Math.abs(vMax - vMin) * 0.2
  const yMax = vMax + Math.abs(vMax - vMin) * 0.2
  
  const scaleX = (graphWidth - 2 * padding) / (xMax - xMin)
  const scaleY = (graphHeight - 2 * padding) / (yMax - yMin)
  
  const toScreenX = (x: number) => padding + (x - xMin) * scaleX
  const toScreenY = (y: number) => graphHeight - padding - (y - yMin) * scaleY
  
  return (
    <svg width={graphWidth} height={graphHeight} className="border rounded bg-white mx-auto">
      <defs>
        <pattern id="grid-v" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width={graphWidth} height={graphHeight} fill="url(#grid-v)" />
      
      {/* Axes */}
      <line x1={toScreenX(0)} y1={padding} x2={toScreenX(0)} y2={graphHeight - padding} stroke="#374151" strokeWidth="2" />
      <line x1={padding} y1={toScreenY(0)} x2={graphWidth - padding} y2={toScreenY(0)} stroke="#374151" strokeWidth="2" />
      
      {/* Labels */}
      <text x={graphWidth / 2} y={graphHeight - 10} textAnchor="middle" fontSize="16" fill="#374151" fontWeight="600">
        Time (s)
      </text>
      <text x="20" y={graphHeight / 2} textAnchor="middle" fontSize="16" fill="#374151" fontWeight="600" transform={`rotate(-90, 20, ${graphHeight / 2})`}>
        Velocity (m/s)
      </text>
      
      {/* Velocity line (horizontal if no acceleration, slanted if acceleration) */}
      {acceleration === 0 ? (
        <>
          <line
            x1={toScreenX(point1.x)}
            y1={toScreenY(velocity)}
            x2={toScreenX(point2.x)}
            y2={toScreenY(velocity)}
            stroke="#10b981"
            strokeWidth="4"
          />
          
          <text
            x={(toScreenX(point1.x) + toScreenX(point2.x)) / 2}
            y={toScreenY(velocity) - 15}
            textAnchor="middle"
            fontSize="16"
            fill="#10b981"
            fontWeight="bold"
          >
            v = {velocity.toFixed(3)} m/s
          </text>
          
          <circle cx={toScreenX(point1.x)} cy={toScreenY(velocity)} r="6" fill="#10b981" />
          <circle cx={toScreenX(point2.x)} cy={toScreenY(velocity)} r="6" fill="#10b981" />
        </>
      ) : (
        <>
          <line
            x1={toScreenX(point1.x)}
            y1={toScreenY(velocity)}
            x2={toScreenX(point2.x)}
            y2={toScreenY(velocity + acceleration * (point2.x - point1.x))}
            stroke="#10b981"
            strokeWidth="4"
          />
          
          <text
            x={toScreenX(point1.x) + 10}
            y={toScreenY(velocity) - 10}
            textAnchor="start"
            fontSize="14"
            fill="#10b981"
            fontWeight="bold"
          >
            v₀ = {velocity.toFixed(3)} m/s
          </text>
          
          <text
            x={toScreenX(point2.x) - 10}
            y={toScreenY(velocity + acceleration * (point2.x - point1.x)) - 10}
            textAnchor="end"
            fontSize="14"
            fill="#10b981"
            fontWeight="bold"
          >
            v = {(velocity + acceleration * (point2.x - point1.x)).toFixed(3)} m/s
          </text>
          
          <circle cx={toScreenX(point1.x)} cy={toScreenY(velocity)} r="6" fill="#10b981" />
          <circle cx={toScreenX(point2.x)} cy={toScreenY(velocity + acceleration * (point2.x - point1.x))} r="6" fill="#10b981" />
        </>
      )}
    </svg>
  )
}

// Acceleration graph component
function AccelerationGraph({ 
  point1, 
  point2,
  acceleration = 0
}: { 
  point1: Point
  point2: Point
  acceleration?: number
}) {
  const graphWidth = 600
  const graphHeight = 400
  const padding = 60
  
  const xMin = Math.min(point1.x, 0) - 0.5
  const xMax = Math.max(point2.x, point1.x) + 0.5
  
  // Calculate y-axis range based on acceleration
  const aRange = Math.max(Math.abs(acceleration) * 1.5, 2)
  const yMin = -aRange
  const yMax = aRange
  
  const scaleX = (graphWidth - 2 * padding) / (xMax - xMin)
  const scaleY = (graphHeight - 2 * padding) / (yMax - yMin)
  
  const toScreenX = (x: number) => padding + (x - xMin) * scaleX
  const toScreenY = (y: number) => graphHeight - padding - (y - yMin) * scaleY
  
  return (
    <svg width={graphWidth} height={graphHeight} className="border rounded bg-white mx-auto">
      <defs>
        <pattern id="grid-a" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width={graphWidth} height={graphHeight} fill="url(#grid-a)" />
      
      {/* Axes */}
      <line x1={toScreenX(0)} y1={padding} x2={toScreenX(0)} y2={graphHeight - padding} stroke="#374151" strokeWidth="2" />
      <line x1={padding} y1={toScreenY(0)} x2={graphWidth - padding} y2={toScreenY(0)} stroke="#374151" strokeWidth="2" />
      
      {/* Labels */}
      <text x={graphWidth / 2} y={graphHeight - 10} textAnchor="middle" fontSize="16" fill="#374151" fontWeight="600">
        Time (s)
      </text>
      <text x="20" y={graphHeight / 2} textAnchor="middle" fontSize="16" fill="#374151" fontWeight="600" transform={`rotate(-90, 20, ${graphHeight / 2})`}>
        Acceleration (m/s²)
      </text>
      
      {/* Acceleration line */}
      <line
        x1={toScreenX(point1.x)}
        y1={toScreenY(acceleration)}
        x2={toScreenX(point2.x)}
        y2={toScreenY(acceleration)}
        stroke="#f59e0b"
        strokeWidth="4"
      />
      
      {/* Label */}
      <text
        x={(toScreenX(point1.x) + toScreenX(point2.x)) / 2}
        y={toScreenY(acceleration) - 15}
        textAnchor="middle"
        fontSize="16"
        fill="#f59e0b"
        fontWeight="bold"
      >
        a = {acceleration.toFixed(3)} m/s²
      </text>
      
      {/* Points */}
      <circle cx={toScreenX(point1.x)} cy={toScreenY(acceleration)} r="6" fill="#f59e0b" />
      <circle cx={toScreenX(point2.x)} cy={toScreenY(acceleration)} r="6" fill="#f59e0b" />
    </svg>
  )
}