"use client"

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  BarChart3,
  Table as TableIcon,
  Info
} from 'lucide-react'

interface DataPoint {
  time: number
  x: number
  y: number
  velocityX: number
  velocityY: number
}

export default function SimulationPage() {
  const params = useParams()
  const router = useRouter()

  // Simulation state
  const [isRunning, setIsRunning] = useState(false)
  const [angle, setAngle] = useState(45)
  const [velocity, setVelocity] = useState(20)
  const [mass, setMass] = useState(1)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  
  // Simulation parameters
  const g = 9.8 // gravity
  const dt = 0.05 // time step

  // Calculate projectile motion
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + dt
        const rad = (angle * Math.PI) / 180
        const vx = velocity * Math.cos(rad)
        const vy = velocity * Math.sin(rad)
        
        const x = vx * newTime
        const y = vy * newTime - 0.5 * g * newTime * newTime
        
        // Stop if projectile hits ground
        if (y < 0) {
          setIsRunning(false)
          return prev
        }

        // Add data point
        const newDataPoint: DataPoint = {
          time: newTime,
          x: x,
          y: y,
          velocityX: vx,
          velocityY: vy - g * newTime
        }
        
        setDataPoints(prevData => [...prevData, newDataPoint])
        
        return newTime
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isRunning, angle, velocity, g, dt])

  const handleStart = () => {
    if (dataPoints.length === 0) {
      setIsRunning(true)
    } else {
      setIsRunning(!isRunning)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setCurrentTime(0)
    setDataPoints([])
  }

  const handleExportData = () => {
    const csv = [
      'Time (s),X Position (m),Y Position (m),X Velocity (m/s),Y Velocity (m/s)',
      ...dataPoints.map(d => 
        `${d.time.toFixed(2)},${d.x.toFixed(2)},${d.y.toFixed(2)},${d.velocityX.toFixed(2)},${d.velocityY.toFixed(2)}`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulation-data-${Date.now()}.csv`
    a.click()
  }

  // Calculate current position for visualization
  const currentPoint = dataPoints[dataPoints.length - 1]
  const maxX = Math.max(...dataPoints.map(d => d.x), 50)
  const maxY = Math.max(...dataPoints.map(d => d.y), 20)

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
            <h1 className="text-3xl font-bold mb-2">Projectile Motion Simulator</h1>
            <p className="text-muted-foreground">
              Launch projectiles at different angles and velocities. Collect data and analyze motion patterns.
            </p>
          </div>
          <Badge variant="default">Beginner</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls and Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Simulation View</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="relative bg-gradient-to-b from-blue-100 to-green-100 dark:from-blue-950 dark:to-green-950 rounded-lg overflow-hidden"
                style={{ height: '400px' }}
              >
                {/* Ground */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-green-800 dark:bg-green-950" />
                
                {/* Trajectory path */}
                <svg className="absolute inset-0 w-full h-full">
                  <path
                    d={
                      dataPoints.length > 1
                        ? dataPoints.map((d, i) => {
                            const x = (d.x / maxX) * 100
                            const y = 100 - (d.y / maxY) * 100
                            return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`
                          }).join(' ')
                        : ''
                    }
                    stroke="rgba(139, 92, 246, 0.5)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />
                </svg>

                {/* Projectile */}
                {currentPoint && (
                  <div
                    className="absolute w-4 h-4 bg-primary rounded-full shadow-lg"
                    style={{
                      left: `${(currentPoint.x / maxX) * 100}%`,
                      bottom: `${(currentPoint.y / maxY) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  />
                )}

                {/* Launch point */}
                <div className="absolute bottom-2 left-4 w-2 h-2 bg-accent rounded-full" />
              </div>

              {/* Info Display */}
              <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground">Time</div>
                  <div className="text-lg font-bold">{currentTime.toFixed(2)}s</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">X Position</div>
                  <div className="text-lg font-bold">{(currentPoint?.x || 0).toFixed(2)}m</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Y Position</div>
                  <div className="text-lg font-bold">{(currentPoint?.y || 0).toFixed(2)}m</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Tabs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="graph" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="graph">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Graph
                  </TabsTrigger>
                  <TabsTrigger value="table">
                    <TableIcon className="h-4 w-4 mr-2" />
                    Data Table
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="graph" className="space-y-4">
                  <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                    {dataPoints.length === 0 ? (
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Run simulation to generate graph</p>
                      </div>
                    ) : (
                      <div className="w-full h-full p-4">
                        {/* Simple X-Y trajectory graph */}
                        <svg className="w-full h-full">
                          <polyline
                            points={dataPoints.map((d) => {
                              const x = (d.x / maxX) * 100
                              const y = 100 - (d.y / maxY) * 100
                              return `${x},${y}`
                            }).join(' ')}
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            fill="none"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Trajectory: Y Position vs X Position
                  </div>
                </TabsContent>

                <TabsContent value="table" className="space-y-4">
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    {dataPoints.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <TableIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Run simulation to collect data</p>
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
                          </tr>
                        </thead>
                        <tbody>
                          {dataPoints.map((d, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{d.time.toFixed(2)}</td>
                              <td className="p-2">{d.x.toFixed(2)}</td>
                              <td className="p-2">{d.y.toFixed(2)}</td>
                              <td className="p-2">{d.velocityX.toFixed(2)}</td>
                              <td className="p-2">{d.velocityY.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {dataPoints.length > 0 && (
                    <div className="text-xs text-muted-foreground">
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
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Controls</CardTitle>
              <CardDescription>Adjust simulation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Angle */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Launch Angle</label>
                  <span className="text-sm text-muted-foreground">{angle}°</span>
                </div>
                <Slider
                  value={[angle]}
                  onValueChange={([value]) => !isRunning && setAngle(value)}
                  min={0}
                  max={90}
                  step={1}
                  disabled={isRunning}
                />
              </div>

              {/* Initial Velocity */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Initial Velocity</label>
                  <span className="text-sm text-muted-foreground">{velocity} m/s</span>
                </div>
                <Slider
                  value={[velocity]}
                  onValueChange={([value]) => !isRunning && setVelocity(value)}
                  min={5}
                  max={50}
                  step={1}
                  disabled={isRunning}
                />
              </div>

              {/* Mass */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Mass</label>
                  <span className="text-sm text-muted-foreground">{mass} kg</span>
                </div>
                <Slider
                  value={[mass]}
                  onValueChange={([value]) => !isRunning && setMass(value)}
                  min={0.1}
                  max={5}
                  step={0.1}
                  disabled={isRunning}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button 
                  onClick={handleStart}
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
                      {dataPoints.length > 0 ? 'Resume' : 'Start'}
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                  disabled={dataPoints.length === 0}
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

          {/* Information Card */}
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
                  <li>Understand projectile motion</li>
                  <li>Analyze x and y components of velocity</li>
                  <li>Study the effect of launch angle</li>
                  <li>Collect and graph experimental data</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Key Concepts:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Horizontal velocity is constant</li>
                  <li>Vertical motion follows gravity</li>
                  <li>Range depends on angle and velocity</li>
                  <li>Maximum range at 45° (no air resistance)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
