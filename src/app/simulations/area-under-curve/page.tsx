'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MathMarkdown from '@/components/MathMarkdown'
import { RotateCcw, TrendingUp, Gauge, MapPin, Lightbulb } from 'lucide-react'

interface Point {
  x: number
  y: number
}

type GraphType = 'velocity-time' | 'acceleration-time' | 'position-time'

const presets = {
  'velocity-time': [
    { name: 'Constant Speed', p1: { x: 0, y: 10 }, p2: { x: 5, y: 10 } },
    { name: 'Speeding Up', p1: { x: 0, y: 0 }, p2: { x: 5, y: 20 } },
    { name: 'Slowing Down', p1: { x: 0, y: 20 }, p2: { x: 5, y: 10 } }
  ],
  'acceleration-time': [
    { name: 'Constant Acceleration', p1: { x: 0, y: 5 }, p2: { x: 4, y: 5 } },
    { name: 'Increasing Acceleration', p1: { x: 0, y: 2 }, p2: { x: 4, y: 8 } },
    { name: 'Braking', p1: { x: 0, y: -5 }, p2: { x: 3, y: -5 } }
  ],
  'position-time': [
    { name: 'Constant Velocity', p1: { x: 0, y: 0 }, p2: { x: 5, y: 15 }, v0: 3, a: 0 },
    { name: 'Accelerating', p1: { x: 0, y: 0 }, p2: { x: 5, y: 25 }, v0: 0, a: 2 },
    { name: 'Complex Motion', p1: { x: 0, y: 5 }, p2: { x: 4, y: 20 }, v0: 2, a: 1.5 }
  ]
}

export default function AreaUnderCurvePage() {
  const [graphType, setGraphType] = useState<GraphType>('velocity-time')
  const [point1, setPoint1] = useState<Point>({ x: 0, y: 5 })
  const [point2, setPoint2] = useState<Point>({ x: 4, y: 5 })
  const [showBreakdown, setShowBreakdown] = useState(true)
  const [numRectangles, setNumRectangles] = useState(4) // For position-time approximation
  const [v0, setV0] = useState(0) // Initial velocity for position-time
  const [acceleration, setAcceleration] = useState(0) // Acceleration for position-time
  
  const orderedPoints = point1.x <= point2.x 
    ? { p1: point1, p2: point2 }
    : { p1: point2, p2: point1 }
  
  // Calculate area by breaking into rectangle + triangle
  const calculateArea = useCallback(() => {
    const { p1, p2 } = orderedPoints
    const width = p2.x - p1.x
    const h1 = p1.y
    const h2 = p2.y
    
    // Simple rectangle (horizontal line)
    if (Math.abs(h1 - h2) < 0.001) {
      return {
        area: h1 * width,
        absArea: Math.abs(h1 * width),
        shape: 'rectangle',
        rectangleArea: h1 * width,
        rectangleHeight: h1,
        triangleArea: 0,
        triangleHeight: 0,
        width: width,
        isNegative: h1 < 0
      }
    }
    
    // Triangle only (one point at zero)
    if (Math.abs(h1) < 0.001 && Math.abs(h2) >= 0.001) {
      return {
        area: 0.5 * h2 * width,
        absArea: Math.abs(0.5 * h2 * width),
        shape: 'triangle',
        rectangleArea: 0,
        rectangleHeight: 0,
        triangleArea: 0.5 * h2 * width,
        triangleHeight: h2,
        base: width,
        width: width,
        isNegative: h2 < 0
      }
    }
    
    if (Math.abs(h2) < 0.001 && Math.abs(h1) >= 0.001) {
      return {
        area: 0.5 * h1 * width,
        absArea: Math.abs(0.5 * h1 * width),
        shape: 'triangle',
        rectangleArea: 0,
        rectangleHeight: 0,
        triangleArea: 0.5 * h1 * width,
        triangleHeight: h1,
        base: width,
        width: width,
        isNegative: h1 < 0
      }
    }
    
    // Trapezoid - break into rectangle + triangle
    const minHeight = Math.min(Math.abs(h1), Math.abs(h2))
    const maxHeight = Math.max(Math.abs(h1), Math.abs(h2))
    const triangleHeight = maxHeight - minHeight
    
    const rectangleArea = minHeight * width
    const triangleArea = 0.5 * triangleHeight * width
    const totalArea = rectangleArea + triangleArea
    
    // Preserve sign
    const signedArea = (h1 >= 0 && h2 >= 0) ? totalArea : -totalArea
    
    return {
      area: signedArea,
      absArea: totalArea,
      shape: 'rectangle + triangle',
      rectangleArea: rectangleArea,
      rectangleHeight: minHeight,
      triangleArea: triangleArea,
      triangleHeight: triangleHeight,
      width: width,
      isNegative: signedArea < 0,
      h1: h1,
      h2: h2
    }
  }, [orderedPoints])
  
  const areaResult = calculateArea()
  
  const handleReset = () => {
    const preset = presets[graphType][0] as any
    setPoint1(preset.p1)
    setPoint2(preset.p2)
    if (preset.v0 !== undefined) setV0(preset.v0)
    if (preset.a !== undefined) setAcceleration(preset.a)
  }
  
  const loadPreset = (preset: any) => {
    setPoint1(preset.p1)
    setPoint2(preset.p2)
    if (preset.v0 !== undefined) setV0(preset.v0)
    if (preset.a !== undefined) setAcceleration(preset.a)
  }
  
  const getPhysicsInfo = () => {
    if (graphType === 'velocity-time') {
      return {
        areaName: 'Displacement',
        areaUnit: 'm',
        icon: <MapPin className="h-5 w-5" />,
        color: 'blue',
        equation: 'Δx = v × t'
      }
    } else if (graphType === 'acceleration-time') {
      return {
        areaName: 'Change in Velocity',
        areaUnit: 'm/s',
        icon: <Gauge className="h-5 w-5" />,
        color: 'green',
        equation: 'Δv = a × t'
      }
    } else {
      return {
        areaName: 'Average Velocity',
        areaUnit: 'm/s',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'purple',
        equation: 'v̄ = Δx / t'
      }
    }
  }
  
  const physicsInfo = getPhysicsInfo()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Area Under the Curve - Interactive Tutorial</h1>
          <p className="text-muted-foreground text-lg">
            Discover how calculating areas under graphs reveals important physics quantities!
          </p>
        </div>
        
        {/* Quick Presets */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Try These Examples!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {presets[graphType].map((preset, idx) => (
                <Button
                  key={idx}
                  onClick={() => loadPreset(preset)}
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-start"
                >
                  <div className="font-semibold">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ({preset.p1.x}, {preset.p1.y}) to ({preset.p2.x}, {preset.p2.y})
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Configure Graph</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Graph Type Selection */}
              <div className="space-y-2">
                <Label>Graph Type</Label>
                <Select value={graphType} onValueChange={(val) => setGraphType(val as GraphType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="velocity-time">Velocity vs Time</SelectItem>
                    <SelectItem value="acceleration-time">Acceleration vs Time</SelectItem>
                    <SelectItem value="position-time">Position vs Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Result Badge */}
              <div className={`p-4 rounded-lg border-2 ${
                graphType === 'velocity-time' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
                  : graphType === 'acceleration-time'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                  : 'bg-purple-50 dark:bg-purple-900/20 border-purple-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {physicsInfo.icon}
                  <span className="font-semibold">Area Represents:</span>
                </div>
                <div className="text-2xl font-bold mb-1">{physicsInfo.areaName}</div>
                <div className="text-lg">
                  {areaResult.area.toFixed(2)} {physicsInfo.areaUnit}
                </div>
              </div>
              
              {/* Point 1 */}
              <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  Point 1 (Start)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="p1x" className="text-sm">
                      {graphType === 'position-time' || graphType === 'velocity-time' || graphType === 'acceleration-time' ? 'Time (s)' : 'x'}
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
                      {graphType === 'velocity-time' ? 'Velocity (m/s)' : graphType === 'acceleration-time' ? 'Acceleration (m/s²)' : 'Position (m)'}
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
                      {graphType === 'position-time' || graphType === 'velocity-time' || graphType === 'acceleration-time' ? 'Time (s)' : 'x'}
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
                      {graphType === 'velocity-time' ? 'Velocity (m/s)' : graphType === 'acceleration-time' ? 'Acceleration (m/s²)' : 'Position (m)'}
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
              
              {graphType === 'position-time' && Math.abs(point1.y - point2.y) > 0.1 && (
                <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-400">
                  <div className="text-sm font-semibold mb-2">
                    📐 Curved Graph - Use Rectangle Approximation
                  </div>
                  <Label htmlFor="numRects" className="text-sm font-semibold">
                    Number of Rectangles: {numRectangles}
                  </Label>
                  <input
                    id="numRects"
                    type="range"
                    min="1"
                    max="50"
                    value={numRectangles}
                    onChange={(e) => setNumRectangles(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Rough (1)</span>
                    <span>Better (25)</span>
                    <span>Best (50)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Slide to see how more rectangles approximate the curved area better!
                  </p>
                </div>
              )}
              
              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </CardContent>
          </Card>
          
          {/* Visualization Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Interactive Graph</span>
                <Badge variant="outline" className="capitalize">{areaResult.shape}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AreaGraph
                point1={orderedPoints.p1}
                point2={orderedPoints.p2}
                graphType={graphType}
                numRectangles={numRectangles}
                v0={v0}
                acceleration={acceleration}
              />
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center border-2 border-purple-200">
                  <div className="text-xs text-muted-foreground mb-1">Shape</div>
                  <div className="text-lg font-bold capitalize">{areaResult.shape}</div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border-2 border-blue-200">
                  <div className="text-xs text-muted-foreground mb-1">Width</div>
                  <div className="text-lg font-bold">{(orderedPoints.p2.x - orderedPoints.p1.x).toFixed(2)}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border-2 border-green-200">
                  <div className="text-xs text-muted-foreground mb-1">Area</div>
                  <div className="text-lg font-bold">{areaResult.area.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center border-2 border-orange-200">
                  <div className="text-xs text-muted-foreground mb-1">Physics</div>
                  <div className="text-sm font-bold">{physicsInfo.areaName}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabbed Content for Different Explanations */}
        <Tabs defaultValue="calculation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculation">How to Calculate</TabsTrigger>
            <TabsTrigger value="physics">Physics Meaning</TabsTrigger>
            <TabsTrigger value="examples">Real Examples</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {graphType === 'position-time' && Math.abs(orderedPoints.p1.y - orderedPoints.p2.y) > 0.1
                    ? '📐 Rectangle Approximation Method (For Curves)'
                    : areaResult.shape === 'rectangle + triangle' 
                    ? '🔷 Break It Down: Rectangle + Triangle' 
                    : 'Step-by-Step Calculation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {graphType === 'position-time' && Math.abs(orderedPoints.p1.y - orderedPoints.p2.y) > 0.1 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-400">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        💡 Finding Area Under Curved Lines
                      </h3>
                      <p className="text-sm mb-2">
                        When a graph is curved, we can&apos;t use simple shapes like rectangles or triangles. Instead, we <strong>approximate with many thin rectangles</strong>!
                      </p>
                      <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded">
                        <p className="text-xs font-semibold">Note: This curve is a <strong>parabola</strong> (quadratic growth)</p>
                        <p className="text-xs">For uniform acceleration: x = x₀ + v₀t + ½at²</p>
                        <p className="text-xs text-muted-foreground italic">This is quadratic (t²), not exponential!</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200">
                      <h3 className="font-semibold text-lg mb-3">The Approximation Process</h3>
                      <div className="space-y-3">
                        <p className="text-sm font-semibold">Using {numRectangles} rectangle{numRectangles === 1 ? '' : 's'}</p>
                        
                        <p className="text-sm"><strong>Step 1:</strong> Divide time into equal pieces</p>
                        <div className="p-3 bg-white dark:bg-blue-950 rounded border-2 border-blue-300 text-center">
                          <p className="font-mono text-sm">Each rectangle width = {((orderedPoints.p2.x - orderedPoints.p1.x) / numRectangles).toFixed(3)} s</p>
                        </div>
                        
                        <p className="text-sm"><strong>Step 2:</strong> For each rectangle, use the position at that time as height</p>
                        
                        <p className="text-sm"><strong>Step 3:</strong> Add up all {numRectangles} areas</p>
                        
                        {numRectangles <= 5 ? (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            With only {numRectangles} rectangle{numRectangles === 1 ? '' : 's'}, you can see gaps between the rectangles and the line.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            With {numRectangles} rectangles, they closely follow the curve!
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200">
                      <h3 className="font-semibold text-lg mb-3">The Key Discovery</h3>
                      <div className="space-y-3">
                        <p className="text-sm font-semibold">More rectangles = Better approximation!</p>
                        
                        <div className="space-y-2 text-sm">
                          <p>• <strong>1-5 rectangles:</strong> Rough (gaps visible)</p>
                          <p>• <strong>10-20 rectangles:</strong> Good</p>
                          <p>• <strong>30+ rectangles:</strong> Excellent</p>
                          <p>• <strong>50 rectangles:</strong> Nearly perfect!</p>
                        </div>
                        
                        <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded mt-4">
                          <p className="text-sm text-center font-semibold">
                            More rectangles → Thinner rectangles → Better approximation
                          </p>
                        </div>
                        
                        <p className="text-sm font-semibold mt-4">The Amazing Part:</p>
                        <p className="text-sm">
                          If we used <strong>infinitely many infinitely thin rectangles</strong>, we&apos;d get the <strong>exact</strong> area under any curve!
                        </p>
                        
                        <p className="text-xs text-muted-foreground italic">
                          This method works for ANY curve shape - that&apos;s why it&apos;s so powerful!
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200">
                      <h3 className="font-semibold text-lg mb-3">Why This Matters in Physics</h3>
                      <div className="space-y-3 text-sm">
                        <p><strong>This rectangle method lets us find:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>Displacement</strong> from curved velocity-time graphs</li>
                          <li><strong>Distance traveled</strong> when velocity changes</li>
                          <li><strong>Work done</strong> by changing forces</li>
                          <li><strong>Energy</strong> in varying systems</li>
                        </ul>
                        
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded mt-4">
                          <p className="text-sm font-semibold">Remember:</p>
                          <p className="text-sm">Straight lines → Simple shapes</p>
                          <p className="text-sm">Curves → Rectangle approximation</p>
                        </div>
                        
                        <p className="text-sm font-semibold text-center mt-3">
                          The beauty: It works for ANY curve shape! 🎉
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {areaResult.shape === 'rectangle' && !(graphType === 'position-time' && Math.abs(orderedPoints.p1.y - orderedPoints.p2.y) > 0.1) && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200">
                      <h3 className="font-semibold text-lg mb-3">Rectangle Area</h3>
                      <div className="space-y-3">
                        <p className="text-sm"><strong>Width:</strong> <span className="font-mono">{areaResult.width?.toFixed(2)}</span></p>
                        <p className="text-sm"><strong>Height:</strong> <span className="font-mono">{areaResult.rectangleHeight?.toFixed(2)}</span></p>
                        
                        <p className="text-sm font-semibold mt-4">Calculate area:</p>
                        <div className="p-4 bg-white dark:bg-blue-950 rounded border-2 border-blue-300 text-center">
                          <MathMarkdown content={`\\[ ${areaResult.width?.toFixed(2)} \\times ${areaResult.rectangleHeight?.toFixed(2)} = ${areaResult.area.toFixed(2)} \\]`} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Visual diagram */}
                    <div className="p-4 bg-muted rounded-lg">
                      <RectangleDiagram width={areaResult.width} height={areaResult.rectangleHeight} />
                    </div>
                  </div>
                )}
                
                {areaResult.shape === 'triangle' && !(graphType === 'position-time' && Math.abs(orderedPoints.p1.y - orderedPoints.p2.y) > 0.1) && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200">
                      <h3 className="font-semibold text-lg mb-3">Triangle Area</h3>
                      <div className="space-y-3">
                        <p className="text-sm"><strong>Base:</strong> <span className="font-mono">{areaResult.base?.toFixed(2)}</span></p>
                        <p className="text-sm"><strong>Height:</strong> <span className="font-mono">{Math.abs(areaResult.triangleHeight!).toFixed(2)}</span></p>
                        
                        <p className="text-sm font-semibold mt-4">Calculate area:</p>
                        <div className="p-4 bg-white dark:bg-green-950 rounded border-2 border-green-300 text-center">
                          <MathMarkdown content={`\\[ \\frac{1}{2} \\times ${areaResult.base?.toFixed(2)} \\times ${Math.abs(areaResult.triangleHeight!).toFixed(2)} = ${areaResult.absArea.toFixed(2)} \\]`} />
                        </div>
                        
                        <p className="text-xs text-muted-foreground italic">Remember: Triangle is half of a rectangle!</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <TriangleDiagram base={areaResult.base || areaResult.width} height={areaResult.triangleHeight} />
                    </div>
                  </div>
                )}
                
                {areaResult.shape === 'rectangle + triangle' && !(graphType === 'position-time' && Math.abs(orderedPoints.p1.y - orderedPoints.p2.y) > 0.1) && (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-400">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        💡 The Easy Way: Break It Into Simple Shapes!
                      </h3>
                      <p className="text-sm mb-3">
                        Instead of memorizing a complex formula, we can <strong>break this shape into a rectangle and a triangle</strong> - shapes you already know!
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200">
                      <h3 className="font-semibold text-lg mb-3">Part 1: The Rectangle (Bottom Part)</h3>
                      <div className="space-y-3">
                        <p className="text-sm"><strong>Step 1:</strong> Rectangle height (the smaller value) = <span className="font-mono text-base">{areaResult.rectangleHeight?.toFixed(2)}</span></p>
                        
                        <p className="text-sm"><strong>Step 2:</strong> Calculate rectangle area:</p>
                        <div className="p-3 bg-white dark:bg-blue-950 rounded border-2 border-blue-300 text-center">
                          <MathMarkdown content={`\\[ \\text{Area} = ${areaResult.width?.toFixed(2)} \\times ${areaResult.rectangleHeight?.toFixed(2)} = ${areaResult.rectangleArea?.toFixed(2)} \\]`} />
                        </div>
                        
                        <p className="text-xs text-muted-foreground italic">This is the base layer that spans the full width.</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200">
                      <h3 className="font-semibold text-lg mb-3">Part 2: The Triangle (Top Part)</h3>
                      <div className="space-y-3">
                        <p className="text-sm"><strong>Step 1:</strong> Triangle height (difference) = <span className="font-mono text-base">{areaResult.triangleHeight?.toFixed(2)}</span></p>
                        
                        <p className="text-sm"><strong>Step 2:</strong> Calculate triangle area:</p>
                        <div className="p-3 bg-white dark:bg-green-950 rounded border-2 border-green-300 text-center">
                          <MathMarkdown content={`\\[ \\text{Area} = \\frac{1}{2} \\times ${areaResult.width?.toFixed(2)} \\times ${areaResult.triangleHeight?.toFixed(2)} = ${areaResult.triangleArea?.toFixed(2)} \\]`} />
                        </div>
                        
                        <p className="text-xs text-muted-foreground italic">This is the extra piece on top.</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-400">
                      <h3 className="font-semibold text-lg mb-3">Part 3: Add Them Together!</h3>
                      <div className="space-y-3">
                        <p className="text-sm"><strong>Final Step:</strong> Add both areas:</p>
                        <div className="p-4 bg-white dark:bg-purple-950 rounded border-2 border-purple-300 text-center">
                          <MathMarkdown content={`\\[ ${areaResult.rectangleArea?.toFixed(2)} + ${areaResult.triangleArea?.toFixed(2)} = ${areaResult.absArea.toFixed(2)} \\]`} />
                        </div>
                        
                        <p className="text-sm font-semibold text-center">✅ Total Area = {areaResult.absArea.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* Visual decomposition diagram */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-3 text-center">Visual Decomposition</h3>
                      <DecompositionDiagram 
                        rectangleHeight={areaResult.rectangleHeight!} 
                        triangleHeight={areaResult.triangleHeight!} 
                        width={areaResult.width!}
                        rectangleArea={areaResult.rectangleArea!}
                        triangleArea={areaResult.triangleArea!}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="physics" className="space-y-4">
            <PhysicsMeaningCard 
              graphType={graphType} 
              areaResult={areaResult} 
              orderedPoints={orderedPoints}
              numRectangles={numRectangles}
            />
          </TabsContent>
          
          <TabsContent value="examples" className="space-y-4">
            <RealWorldExamplesCard graphType={graphType} areaResult={areaResult} orderedPoints={orderedPoints} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Area graph component with animated shading
function AreaGraph({ 
  point1, 
  point2, 
  graphType,
  numRectangles = 4,
  v0 = 0,
  acceleration = 0
}: { 
  point1: Point
  point2: Point
  graphType: GraphType
  numRectangles?: number
  v0?: number
  acceleration?: number
}) {
  const graphWidth = 700
  const graphHeight = 450
  const padding = 60
  
  const xMin = Math.min(point1.x, point2.x, 0) - 0.5
  const xMax = Math.max(point1.x, point2.x) + 0.5
  const yMin = Math.min(point1.y, point2.y, 0) - 2
  const yMax = Math.max(point1.y, point2.y, 0) + 2
  
  const scaleX = (graphWidth - 2 * padding) / (xMax - xMin)
  const scaleY = (graphHeight - 2 * padding) / (yMax - yMin)
  
  const toScreenX = (x: number) => padding + (x - xMin) * scaleX
  const toScreenY = (y: number) => graphHeight - padding - (y - yMin) * scaleY
  
  const point1Screen = { x: toScreenX(point1.x), y: toScreenY(point1.y) }
  const point2Screen = { x: toScreenX(point2.x), y: toScreenY(point2.y) }
  const zeroLine = toScreenY(0)
  
  const getGraphLabels = () => {
    if (graphType === 'velocity-time') return { x: 'Time (s)', y: 'Velocity (m/s)' }
    if (graphType === 'acceleration-time') return { x: 'Time (s)', y: 'Acceleration (m/s²)' }
    return { x: 'Time (s)', y: 'Position (m)' }
  }
  
  const labels = getGraphLabels()

  return (
    <svg width={graphWidth} height={graphHeight} className="border-2 rounded-lg bg-white">
      {/* Grid */}
      <defs>
        <pattern id="grid-area" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
        </pattern>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect width={graphWidth} height={graphHeight} fill="url(#grid-area)" />
      
      {/* Shaded area - rectangle approximation only for curved position-time graphs */}
      {graphType === 'position-time' && Math.abs(point1.y - point2.y) > 0.1 ? (
        <>
          {/* Draw rectangles for position-time approximation */}
          {(() => {
            const rectangles = []
            const width = point2.x - point1.x
            const rectWidth = width / numRectangles
            const x0 = point1.y  // Initial position
            
            for (let i = 0; i < numRectangles; i++) {
              const t = point1.x + i * rectWidth
              // Use kinematic equation: x = x0 + v0*t + 0.5*a*t²
              const position = x0 + v0 * (t - point1.x) + 0.5 * acceleration * (t - point1.x) * (t - point1.x)
              
              rectangles.push(
                <rect
                  key={i}
                  x={toScreenX(t)}
                  y={toScreenY(position)}
                  width={toScreenX(t + rectWidth) - toScreenX(t)}
                  height={zeroLine - toScreenY(position)}
                  fill="#3b82f6"
                  fillOpacity={0.4}
                  stroke="#2563eb"
                  strokeWidth="1.5"
                />
              )
            }
            return rectangles
          })()}
          
          {/* Draw the actual parabolic curve on top */}
          <path
            d={(() => {
              const numPoints = 100
              const width = point2.x - point1.x
              const timeStep = width / numPoints
              const x0 = point1.y
              
              let pathData = ''
              for (let i = 0; i <= numPoints; i++) {
                const t = point1.x + i * timeStep
                const position = x0 + v0 * (t - point1.x) + 0.5 * acceleration * (t - point1.x) * (t - point1.x)
                const screenX = toScreenX(t)
                const screenY = toScreenY(position)
                
                if (i === 0) {
                  pathData = `M ${screenX} ${screenY}`
                } else {
                  pathData += ` L ${screenX} ${screenY}`
                }
              }
              return pathData
            })()}
            stroke="#1e40af"
            strokeWidth="4"
            fill="none"
          />
        </>
      ) : (
        <>
          {/* Regular shaded area for velocity/acceleration graphs */}
          <path
            d={`M ${toScreenX(point1.x)} ${zeroLine} 
                L ${toScreenX(point1.x)} ${point1Screen.y} 
                L ${toScreenX(point2.x)} ${point2Screen.y} 
                L ${toScreenX(point2.x)} ${zeroLine} Z`}
            fill="url(#areaGradient)"
            stroke="#2563eb"
            strokeWidth="3"
            filter="url(#shadow)"
          />
          
          {/* Show decomposition line for rectangle + triangle */}
          {Math.abs(point1.y - point2.y) > 0.1 && (
            <>
              {/* Horizontal line separating rectangle from triangle */}
              <line
                x1={toScreenX(point1.x)}
                y1={toScreenY(Math.min(Math.abs(point1.y), Math.abs(point2.y)))}
                x2={toScreenX(point2.x)}
                y2={toScreenY(Math.min(Math.abs(point1.y), Math.abs(point2.y)))}
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
              
              {/* Label for rectangle part */}
              <text
                x={(toScreenX(point1.x) + toScreenX(point2.x)) / 2}
                y={(toScreenY(Math.min(Math.abs(point1.y), Math.abs(point2.y))) + zeroLine) / 2}
                textAnchor="middle"
                fontSize="16"
                fill="#2563eb"
                fontWeight="bold"
              >
                Rectangle
              </text>
              
              {/* Label for triangle part */}
              <text
                x={(toScreenX(point1.x) + toScreenX(point2.x)) / 2}
                y={(toScreenY(Math.max(Math.abs(point1.y), Math.abs(point2.y))) + toScreenY(Math.min(Math.abs(point1.y), Math.abs(point2.y)))) / 2}
                textAnchor="middle"
                fontSize="16"
                fill="#059669"
                fontWeight="bold"
              >
                Triangle
              </text>
            </>
          )}
        </>
      )}
      
      {/* Dimension labels */}
      <line
        x1={toScreenX(point1.x)}
        y1={zeroLine + 20}
        x2={toScreenX(point2.x)}
        y2={zeroLine + 20}
        stroke="#ef4444"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
      <text
        x={(toScreenX(point1.x) + toScreenX(point2.x)) / 2}
        y={zeroLine + 40}
        textAnchor="middle"
        fontSize="14"
        fill="#ef4444"
        fontWeight="bold"
      >
        Width = {(point2.x - point1.x).toFixed(2)}
      </text>
      
      {/* Height indicators */}
      {Math.abs(point1.y - point2.y) < 0.1 ? (
        <text
          x={toScreenX(point1.x) - 50}
          y={(point1Screen.y + zeroLine) / 2}
          textAnchor="end"
          fontSize="14"
          fill="#10b981"
          fontWeight="bold"
        >
          h = {Math.abs(point1.y).toFixed(2)}
        </text>
      ) : (
        <>
          <text
            x={toScreenX(point1.x) - 50}
            y={(point1Screen.y + zeroLine) / 2}
            textAnchor="end"
            fontSize="12"
            fill="#10b981"
            fontWeight="bold"
          >
            h₁ = {Math.abs(point1.y).toFixed(2)}
          </text>
          <text
            x={toScreenX(point2.x) + 50}
            y={(point2Screen.y + zeroLine) / 2}
            textAnchor="start"
            fontSize="12"
            fill="#10b981"
            fontWeight="bold"
          >
            h₂ = {Math.abs(point2.y).toFixed(2)}
          </text>
        </>
      )}
      
      {/* Axes */}
      <line x1={toScreenX(0)} y1={padding} x2={toScreenX(0)} y2={graphHeight - padding} stroke="#374151" strokeWidth="3" />
      <line x1={padding} y1={toScreenY(0)} x2={graphWidth - padding} y2={toScreenY(0)} stroke="#374151" strokeWidth="3" />
      
      {/* Axis labels */}
      <text x={graphWidth / 2} y={graphHeight - 15} textAnchor="middle" fontSize="18" fill="#374151" fontWeight="600">
        {labels.x}
      </text>
      <text x="25" y={graphHeight / 2} textAnchor="middle" fontSize="18" fill="#374151" fontWeight="600" transform={`rotate(-90, 25, ${graphHeight / 2})`}>
        {labels.y}
      </text>
      
      {/* Line between points */}
      <line
        x1={point1Screen.x}
        y1={point1Screen.y}
        x2={point2Screen.x}
        y2={point2Screen.y}
        stroke="#1e40af"
        strokeWidth="5"
      />
      
      {/* Vertical boundaries */}
      <line x1={point1Screen.x} y1={point1Screen.y} x2={point1Screen.x} y2={zeroLine} stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" />
      <line x1={point2Screen.x} y1={point2Screen.y} x2={point2Screen.x} y2={zeroLine} stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" />
      
      {/* Points */}
      <circle cx={point1Screen.x} cy={point1Screen.y} r="10" fill="#8b5cf6" stroke="white" strokeWidth="3" />
      <text
        x={point1Screen.x}
        y={point1Screen.y < zeroLine ? point1Screen.y - 25 : point1Screen.y + 30}
        textAnchor="middle"
        fontSize="15"
        fill="#8b5cf6"
        fontWeight="bold"
      >
        Start: {point1.y.toFixed(1)}
      </text>
      
      <circle cx={point2Screen.x} cy={point2Screen.y} r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
      <text
        x={point2Screen.x}
        y={point2Screen.y < zeroLine ? point2Screen.y - 25 : point2Screen.y + 30}
        textAnchor="middle"
        fontSize="15"
        fill="#3b82f6"
        fontWeight="bold"
      >
        End: {point2.y.toFixed(1)}
      </text>
      
      {/* "AREA" label inside shaded region */}
      <text
        x={(point1Screen.x + point2Screen.x) / 2}
        y={(Math.min(point1Screen.y, point2Screen.y) + zeroLine) / 2}
        textAnchor="middle"
        fontSize="24"
        fill="#1e40af"
        fontWeight="bold"
        opacity="0.7"
      >
        AREA
      </text>
    </svg>
  )
}

// Visual diagram components
function RectangleDiagram({ width, height }: { width?: number; height?: number }) {
  const safeWidth = width || 0
  const safeHeight = height || 0
  
  // Scale for better visual
  const scaledWidth = Math.min(safeWidth * 25, 180)
  const scaledHeight = Math.min(Math.abs(safeHeight) * 20, 120)
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <div className="text-sm font-semibold text-muted-foreground mb-2">Rectangle Visualization</div>
      </div>
      <svg width="350" height="250" className="bg-white rounded-lg border-2 shadow-sm">
        {/* Rectangle */}
        <rect 
          x={175 - scaledWidth / 2} 
          y={140 - scaledHeight} 
          width={scaledWidth} 
          height={scaledHeight} 
          fill="#3b82f6" 
          fillOpacity="0.4" 
          stroke="#2563eb" 
          strokeWidth="3" 
        />
        
        {/* Width dimension line and label */}
        <line 
          x1={175 - scaledWidth / 2} 
          y1="160" 
          x2={175 + scaledWidth / 2} 
          y2="160" 
          stroke="#ef4444" 
          strokeWidth="2" 
        />
        <line x1={175 - scaledWidth / 2} y1="155" x2={175 - scaledWidth / 2} y2="165" stroke="#ef4444" strokeWidth="2" />
        <line x1={175 + scaledWidth / 2} y1="155" x2={175 + scaledWidth / 2} y2="165" stroke="#ef4444" strokeWidth="2" />
        <text 
          x="175" 
          y="180" 
          textAnchor="middle" 
          fontSize="15" 
          fontWeight="bold"
          fill="#ef4444"
        >
          width = {safeWidth.toFixed(2)}
        </text>
        
        {/* Height dimension line and label */}
        <line 
          x1={175 - scaledWidth / 2 - 20} 
          y1={140 - scaledHeight} 
          x2={175 - scaledWidth / 2 - 20} 
          y2="140" 
          stroke="#10b981" 
          strokeWidth="2" 
        />
        <line x1={175 - scaledWidth / 2 - 25} y1={140 - scaledHeight} x2={175 - scaledWidth / 2 - 15} y2={140 - scaledHeight} stroke="#10b981" strokeWidth="2" />
        <line x1={175 - scaledWidth / 2 - 25} y1="140" x2={175 - scaledWidth / 2 - 15} y2="140" stroke="#10b981" strokeWidth="2" />
        <text 
          x={175 - scaledWidth / 2 - 35} 
          y={140 - scaledHeight / 2 + 5} 
          textAnchor="middle" 
          fontSize="15" 
          fontWeight="bold"
          fill="#10b981"
          transform={`rotate(-90, ${175 - scaledWidth / 2 - 35}, ${140 - scaledHeight / 2 + 5})`}
        >
          height = {Math.abs(safeHeight).toFixed(2)}
        </text>
        
        {/* Area label inside rectangle */}
        <text 
          x="175" 
          y={140 - scaledHeight / 2 + 5} 
          textAnchor="middle" 
          fontSize="18" 
          fontWeight="bold" 
          fill="#1e40af"
        >
          Area = {(safeWidth * Math.abs(safeHeight)).toFixed(2)}
        </text>
      </svg>
      
      {/* Formula below */}
      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-full">
        <MathMarkdown content={`\\[ A = \\text{width} \\times \\text{height} = ${safeWidth.toFixed(2)} \\times ${Math.abs(safeHeight).toFixed(2)} = ${(safeWidth * Math.abs(safeHeight)).toFixed(2)} \\]`} />
      </div>
    </div>
  )
}

function TriangleDiagram({ base, height }: { base?: number; height?: number }) {
  const safeBase = base || 0
  const safeHeight = height || 0
  
  const scaledBase = Math.min(safeBase * 25, 180)
  const scaledHeight = Math.min(Math.abs(safeHeight) * 20, 120)
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <div className="text-sm font-semibold text-muted-foreground mb-2">Triangle Visualization</div>
      </div>
      <svg width="350" height="250" className="bg-white rounded-lg border-2 shadow-sm">
        {/* Triangle */}
        <polygon 
          points={`${175 - scaledBase / 2},180 ${175 - scaledBase / 2},${180 - scaledHeight} ${175 + scaledBase / 2},180`} 
          fill="#10b981" 
          fillOpacity="0.4" 
          stroke="#059669" 
          strokeWidth="3" 
        />
        
        {/* Base dimension */}
        <line 
          x1={175 - scaledBase / 2} 
          y1="195" 
          x2={175 + scaledBase / 2} 
          y2="195" 
          stroke="#ef4444" 
          strokeWidth="2" 
        />
        <line x1={175 - scaledBase / 2} y1="190" x2={175 - scaledBase / 2} y2="200" stroke="#ef4444" strokeWidth="2" />
        <line x1={175 + scaledBase / 2} y1="190" x2={175 + scaledBase / 2} y2="200" stroke="#ef4444" strokeWidth="2" />
        <text 
          x="175" 
          y="215" 
          textAnchor="middle" 
          fontSize="15" 
          fontWeight="bold"
          fill="#ef4444"
        >
          base = {safeBase.toFixed(2)}
        </text>
        
        {/* Height dimension */}
        <line 
          x1={175 - scaledBase / 2 - 20} 
          y1={180 - scaledHeight} 
          x2={175 - scaledBase / 2 - 20} 
          y2="180" 
          stroke="#10b981" 
          strokeWidth="2" 
        />
        <line x1={175 - scaledBase / 2 - 25} y1={180 - scaledHeight} x2={175 - scaledBase / 2 - 15} y2={180 - scaledHeight} stroke="#10b981" strokeWidth="2" />
        <line x1={175 - scaledBase / 2 - 25} y1="180" x2={175 - scaledBase / 2 - 15} y2="180" stroke="#10b981" strokeWidth="2" />
        <text 
          x={175 - scaledBase / 2 - 40} 
          y={180 - scaledHeight / 2 + 5} 
          textAnchor="middle" 
          fontSize="15" 
          fontWeight="bold"
          fill="#10b981"
          transform={`rotate(-90, ${175 - scaledBase / 2 - 40}, ${180 - scaledHeight / 2 + 5})`}
        >
          height = {Math.abs(safeHeight).toFixed(2)}
        </text>
        
        {/* Area label */}
        <text 
          x="175" 
          y={180 - scaledHeight / 2 + 40} 
          textAnchor="middle" 
          fontSize="16" 
          fontWeight="bold" 
          fill="#059669"
        >
          Area = {(0.5 * safeBase * Math.abs(safeHeight)).toFixed(2)}
        </text>
      </svg>
      
      {/* Formula below */}
      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg w-full">
        <MathMarkdown content={`\\[ A = \\frac{1}{2} \\times \\text{base} \\times \\text{height} = \\frac{1}{2} \\times ${safeBase.toFixed(2)} \\times ${Math.abs(safeHeight).toFixed(2)} = ${(0.5 * safeBase * Math.abs(safeHeight)).toFixed(2)} \\]`} />
      </div>
    </div>
  )
}

function DecompositionDiagram({ 
  rectangleHeight, 
  triangleHeight, 
  width,
  rectangleArea,
  triangleArea
}: { 
  rectangleHeight: number
  triangleHeight: number
  width: number
  rectangleArea: number
  triangleArea: number
}) {
  const scale = 30
  const rectHeight = Math.abs(rectangleHeight) * 15
  const triHeight = Math.abs(triangleHeight) * 15
  const rectWidth = width * scale
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Rectangle part */}
        <div className="text-center">
          <div className="text-lg font-semibold mb-3 text-blue-600">① Rectangle Part</div>
          <svg width="200" height="220" className="bg-white rounded-lg border-2 shadow-sm mx-auto">
            <rect 
              x="60" 
              y={170 - rectHeight} 
              width={Math.min(rectWidth, 80)} 
              height={rectHeight} 
              fill="#3b82f6" 
              fillOpacity="0.5" 
              stroke="#2563eb" 
              strokeWidth="3" 
            />
            
            {/* Dimensions */}
            <line x1="60" y1="185" x2={60 + Math.min(rectWidth, 80)} y2="185" stroke="#ef4444" strokeWidth="2" />
            <text x="100" y="202" textAnchor="middle" fontSize="13" fill="#ef4444" fontWeight="bold">
              w={width.toFixed(2)}
            </text>
            
            <line x1="45" y1={170 - rectHeight} x2="45" y2="170" stroke="#10b981" strokeWidth="2" />
            <text x="32" y={170 - rectHeight / 2} textAnchor="middle" fontSize="13" fill="#10b981" fontWeight="bold" transform={`rotate(-90, 32, ${170 - rectHeight / 2})`}>
              h={rectangleHeight.toFixed(2)}
            </text>
            
            <text x="100" y={170 - rectHeight / 2 + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#2563eb">
              = {rectangleArea.toFixed(2)}
            </text>
          </svg>
          <div className="mt-2 text-sm text-muted-foreground">
            w × h = Area
          </div>
        </div>
        
        {/* Plus sign */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-7xl font-bold text-purple-600">+</div>
          <div className="text-sm text-muted-foreground mt-2">Add together</div>
        </div>
        
        {/* Triangle part */}
        <div className="text-center">
          <div className="text-lg font-semibold mb-3 text-green-600">② Triangle Part</div>
          <svg width="200" height="220" className="bg-white rounded-lg border-2 shadow-sm mx-auto">
            {/* Show triangle separately, not stacked */}
            <polygon 
              points={`60,170 60,${170 - triHeight} ${60 + Math.min(rectWidth, 80)},170`} 
              fill="#10b981" 
              fillOpacity="0.5" 
              stroke="#059669" 
              strokeWidth="3" 
            />
            
            {/* Dimensions */}
            <line x1="60" y1="185" x2={60 + Math.min(rectWidth, 80)} y2="185" stroke="#ef4444" strokeWidth="2" />
            <text x="100" y="202" textAnchor="middle" fontSize="13" fill="#ef4444" fontWeight="bold">
              w={width.toFixed(2)}
            </text>
            
            <line x1="45" y1="170" x2="45" y2={170 - triHeight} stroke="#10b981" strokeWidth="2" />
            <text x="32" y={170 - triHeight / 2} textAnchor="middle" fontSize="13" fill="#10b981" fontWeight="bold" transform={`rotate(-90, 32, ${170 - triHeight / 2})`}>
              h={triangleHeight.toFixed(2)}
            </text>
            
            <text x="100" y={170 - triHeight / 2 + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#059669">
              = {triangleArea.toFixed(2)}
            </text>
          </svg>
          <div className="mt-2 text-sm text-muted-foreground">
            ½ × w × h = Area
          </div>
        </div>
      </div>
      
      {/* Final result with equals */}
      <div className="text-center p-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border-2 border-purple-400 shadow-lg">
        <div className="text-sm text-muted-foreground mb-2">TOTAL AREA</div>
        <div className="text-5xl font-bold text-purple-600 mb-4">
          {rectangleArea.toFixed(2)} + {triangleArea.toFixed(2)} = {(rectangleArea + triangleArea).toFixed(2)}
        </div>
        <div className="text-base text-muted-foreground">
          Rectangle + Triangle = Total Area Under the Curve
        </div>
      </div>
    </div>
  )
}

// Physics meaning card
function PhysicsMeaningCard({ graphType, areaResult, orderedPoints, numRectangles = 4 }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What Does This Area Mean in Physics?</CardTitle>
      </CardHeader>
      <CardContent>
        {graphType === 'velocity-time' && (
          <MathMarkdown content={`
## Velocity-Time Graph → Displacement

**The area under a velocity-time graph gives you displacement (change in position).**

### Your Calculation:

\\[ \\text{Displacement} = ${areaResult.area.toFixed(2)} \\, \\text{m} \\]

### Why This Works:

Velocity tells you **how fast** you're moving. Time tells you **how long**.

**Think about it:**
- Travel at ${Math.abs(orderedPoints.p1.y).toFixed(2)} m/s for ${(orderedPoints.p2.x - orderedPoints.p1.x).toFixed(2)} seconds
- You cover: velocity × time = distance

### The Physics Connection:

\\[ \\text{Displacement} = \\text{velocity} \\times \\text{time} = \\text{Area} \\]

${areaResult.shape === 'rectangle' ? `
**Your case (Rectangle):**
- Constant velocity = ${orderedPoints.p1.y.toFixed(2)} m/s
- You move the same distance every second
- Total: ${orderedPoints.p1.y.toFixed(2)} m/s × ${(orderedPoints.p2.x - orderedPoints.p1.x).toFixed(2)} s = ${areaResult.area.toFixed(2)} m
` : areaResult.shape === 'triangle' ? `
**Your case (Triangle):**
- Velocity changes from ${orderedPoints.p1.y.toFixed(2)} to ${orderedPoints.p2.y.toFixed(2)} m/s
- Average velocity = ${((orderedPoints.p1.y + orderedPoints.p2.y) / 2).toFixed(2)} m/s
- Distance = average velocity × time = ${areaResult.area.toFixed(2)} m
` : `
**Your case (Rectangle + Triangle):**
- Velocity changes from ${orderedPoints.p1.y.toFixed(2)} to ${orderedPoints.p2.y.toFixed(2)} m/s
- We break it into two parts:
  - **Rectangle:** ${areaResult.rectangleArea?.toFixed(2)} m (constant part)
  - **Triangle:** ${areaResult.triangleArea?.toFixed(2)} m (changing part)
- Total displacement = ${areaResult.rectangleArea?.toFixed(2)} + ${areaResult.triangleArea?.toFixed(2)} = ${areaResult.absArea.toFixed(2)} m
`}
          `} />
        )}
        
        {graphType === 'acceleration-time' && (
          <MathMarkdown content={`
## Acceleration-Time Graph → Change in Velocity

**The area under an acceleration-time graph gives you the change in velocity.**

### Your Calculation:

\\[ \\Delta v = ${areaResult.area.toFixed(2)} \\, \\text{m/s} \\]

### Why This Works:

Acceleration tells you **how fast velocity changes**. Time tells you **how long**.

**Think about it:**
- Accelerate at ${Math.abs(orderedPoints.p1.y).toFixed(2)} m/s² for ${(orderedPoints.p2.x - orderedPoints.p1.x).toFixed(2)} seconds
- Your speed changes by: acceleration × time

### The Physics Connection:

\\[ \\Delta v = \\text{acceleration} \\times \\text{time} = \\text{Area} \\]

This comes from the equation: \\( v = v_0 + at \\)

The "at" part is the **area** under the acceleration-time graph!
          `} />
        )}
        
        {graphType === 'position-time' && Math.abs(orderedPoints.p1.y - orderedPoints.p2.y) > 0.1 && (
          <MathMarkdown content={`
## Position-Time Graph → Parabolic Curves (Not Exponential!)

**For position-time graphs with acceleration, the curve is a PARABOLA (t²), not exponential (e^t).**

### Why Parabolic?

The position equation for uniform acceleration is:

\\[ x = x_0 + v_0 t + \\frac{1}{2}at^2 \\]

The **t²** term creates a parabola. This is **quadratic growth**, meaning:
- Position increases faster and faster
- But at a **constant rate of change of velocity** (constant acceleration)
- Different from exponential growth (which has ever-increasing rate)

### The Rectangle Approximation Method

**The Big Idea:** Break the area under this parabolic curve into many thin rectangles, then add them up!

**Step 1:** Divide the time interval into ${numRectangles} equal pieces

\\[ \\text{Rectangle width} = \\frac{\\text{total time}}{\\text{number of rectangles}} = \\frac{${(orderedPoints.p2.x - orderedPoints.p1.x).toFixed(2)}}{${numRectangles}} = ${((orderedPoints.p2.x - orderedPoints.p1.x) / numRectangles).toFixed(3)} \\, \\text{s} \\]

**Step 2:** For each rectangle, use the position value at that time as the height

**Step 3:** Add up all the rectangle areas

${numRectangles === 1 ? `
With just **1 rectangle**, we get a rough estimate. The actual curve goes above (or below) the rectangle top.
` : numRectangles < 10 ? `
With **${numRectangles} rectangles**, we get a better estimate. Some rectangles are too tall, some too short, but they average out.
` : `
With **${numRectangles} rectangles**, we get a very good estimate! The rectangles closely follow the curve.
`}

### The Amazing Discovery:

**As you use more and more rectangles (make them thinner), the approximation gets better and better!**

- 1 rectangle → rough estimate
- 10 rectangles → good estimate  
- 50 rectangles → excellent estimate
- 100+ rectangles → nearly perfect!

**In the limit** (infinitely many infinitely thin rectangles), you get the **exact area** under the curve!

### What Does This Mean?

For position-time graphs:
- **Slope** = Velocity (rate of change)
- **Area** = Not typically used (use slope instead!)

For curved motion, we use this rectangle method to find areas under **velocity-time** graphs (which gives displacement).

**Key Pattern:**
- Position-Time **slope** → Velocity
- Velocity-Time **area** → Displacement  
- Acceleration-Time **area** → Change in velocity
          `} />
        )}
        
        {graphType === 'position-time' && Math.abs(orderedPoints.p1.y - orderedPoints.p2.y) <= 0.1 && (
          <MathMarkdown content={`
## Position-Time Graph → Use Slope, Not Area!

**For position-time graphs, we typically use the SLOPE to find velocity, not the area.**

### Your Graph:

\\[ \\text{Velocity} = \\frac{\\Delta x}{\\Delta t} = \\frac{${orderedPoints.p2.y.toFixed(2)} - ${orderedPoints.p1.y.toFixed(2)}}{${orderedPoints.p2.x.toFixed(2)} - ${orderedPoints.p1.x.toFixed(2)}} = ${((orderedPoints.p2.y - orderedPoints.p1.y) / (orderedPoints.p2.x - orderedPoints.p1.x)).toFixed(2)} \\, \\text{m/s} \\]

### The Key Difference:

- **Position-Time slope** = Velocity (what we want!)
- **Velocity-Time area** = Displacement (very useful!)
- **Acceleration-Time area** = Change in velocity (very useful!)

**Try the other graph types to see how area calculations give you important physics quantities!**
          `} />
        )}
      </CardContent>
    </Card>
  )
}

// Real world examples card
function RealWorldExamplesCard({ graphType, areaResult, orderedPoints }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-World Examples & Applications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {graphType === 'velocity-time' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-lg mb-2">🚗 Car Trip</h3>
              <p className="text-sm mb-2">
                A car travels at {Math.abs(orderedPoints.p1.y).toFixed(2)} m/s for {(orderedPoints.p2.x - orderedPoints.p1.x).toFixed(2)} seconds.
              </p>
              <p className="text-sm font-semibold">
                Distance covered: {Math.abs(areaResult.area).toFixed(2)} meters (area under the curve!)
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
              <h3 className="font-semibold text-lg mb-2">🏃 Running Race</h3>
              <p className="text-sm mb-2">
                A runner&apos;s velocity-time graph shows their speed over a race. The total area gives the race distance!
              </p>
              <p className="text-sm font-semibold">
                If velocity varies, use average: ({orderedPoints.p1.y.toFixed(2)} + {orderedPoints.p2.y.toFixed(2)}) / 2 = {((orderedPoints.p1.y + orderedPoints.p2.y) / 2).toFixed(2)} m/s
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
              <h3 className="font-semibold text-lg mb-2">🚀 Rocket Launch</h3>
              <p className="text-sm mb-2">
                A rocket&apos;s velocity increases from 0 to high speeds. The area under its velocity-time graph tells you how high it went!
              </p>
            </div>
          </div>
        )}
        
        {graphType === 'acceleration-time' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
              <h3 className="font-semibold text-lg mb-2">🚗 Car Acceleration</h3>
              <p className="text-sm mb-2">
                A car accelerates from a stoplight at {Math.abs(orderedPoints.p1.y).toFixed(2)} m/s² for {(orderedPoints.p2.x - orderedPoints.p1.x).toFixed(2)} seconds.
              </p>
              <p className="text-sm font-semibold">
                Speed gained: {Math.abs(areaResult.area).toFixed(2)} m/s (area under the curve!)
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
              <h3 className="font-semibold text-lg mb-2">🛑 Braking Distance</h3>
              <p className="text-sm mb-2">
                When braking (negative acceleration), the area tells you how much your speed decreases. Crucial for safety calculations!
              </p>
            </div>
            
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border-l-4 border-teal-500">
              <h3 className="font-semibold text-lg mb-2">✈️ Airplane Takeoff</h3>
              <p className="text-sm mb-2">
                The area under the acceleration-time graph during takeoff tells you the final speed at liftoff!
              </p>
            </div>
          </div>
        )}
        
        {graphType === 'position-time' && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-semibold text-lg mb-2">💡 Key Insight</h3>
              <p className="text-sm mb-2">
                For position-time graphs, we typically use the **slope** (not area) to find velocity.
              </p>
              <p className="text-sm font-semibold">
                Slope of position-time graph = velocity
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold mb-2">The Pattern:</h3>
              <ul className="text-sm space-y-2 list-disc list-inside">
                <li><strong>Position-Time slope</strong> → Velocity</li>
                <li><strong>Velocity-Time area</strong> → Displacement</li>
                <li><strong>Velocity-Time slope</strong> → Acceleration</li>
                <li><strong>Acceleration-Time area</strong> → Change in velocity</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}