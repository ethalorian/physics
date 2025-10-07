'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import MathMarkdown from '@/components/MathMarkdown'
import { ArrowLeft, Check, X, RotateCcw, Target, Ruler, Move } from 'lucide-react'
import Link from 'next/link'

interface MeasurementDevice {
  name: string
  minorDivision: number
  precision: number
  unit: string
  range: [number, number]
  description: string
}

interface MeasurementProblem {
  device: MeasurementDevice
  trueValue: number
  objectPosition: number
  hint: string
}

interface AccuracyDemo {
  name: string
  measurements: number[]
  trueValue: number
  accurate: boolean
  precise: boolean
  description: string
}

const devices: MeasurementDevice[] = [
  {
    name: 'Ruler (mm)',
    minorDivision: 1,
    precision: 0.5,
    unit: 'mm',
    range: [0, 100],
    description: 'Standard metric ruler with millimeter markings. You can estimate to half a millimeter.'
  },
  {
    name: 'Ruler (cm)',
    minorDivision: 1,
    precision: 0.5,
    unit: 'cm',
    range: [0, 15],
    description: 'Ruler with only centimeter markings. You can estimate to half a centimeter.'
  }
]

const accuracyDemos: AccuracyDemo[] = [
  {
    name: 'High Precision, High Accuracy',
    measurements: [10.1, 10.2, 10.0, 10.1, 10.2],
    trueValue: 10.1,
    accurate: true,
    precise: true,
    description: 'Measurements are clustered tightly together AND close to the true value.'
  },
  {
    name: 'High Precision, Low Accuracy',
    measurements: [8.1, 8.2, 8.0, 8.1, 8.2],
    trueValue: 10.1,
    accurate: false,
    precise: true,
    description: 'Measurements are clustered tightly together but far from the true value (systematic error).'
  },
  {
    name: 'Low Precision, High Accuracy',
    measurements: [9.5, 10.8, 10.2, 9.8, 10.7],
    trueValue: 10.1,
    accurate: true,
    precise: false,
    description: 'Measurements are spread out but average close to the true value (random errors).'
  },
  {
    name: 'Low Precision, Low Accuracy',
    measurements: [7.5, 8.8, 8.2, 7.8, 8.7],
    trueValue: 10.1,
    accurate: false,
    precise: false,
    description: 'Measurements are spread out AND far from the true value (both systematic and random errors).'
  }
]

// Interactive accuracy/precision exercise
interface MeasurementAttempt {
  value: number
  x: number
  y: number
}

function AccuracyPrecisionExercise() {
  const generateRandomValue = () => Math.floor(Math.random() * 20 + 40) // Random true value 40-60
  const [trueValue, setTrueValue] = useState(generateRandomValue)
  const [attempts, setAttempts] = useState<MeasurementAttempt[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [showFinalAnalysis, setShowFinalAnalysis] = useState(false)

  const addMeasurement = useCallback(() => {
    if (!currentInput || attempts.length >= 10) return
    
    const value = parseFloat(currentInput)
    if (isNaN(value) || value < 0 || value > 100) return

    // Calculate position on target
    const deviation = value - trueValue
    const distance = Math.abs(deviation)
    
    // Add some randomness to position for visualization
    const angle = Math.random() * Math.PI * 2
    const spread = 3 + Math.random() * 2
    const x = 90 + Math.cos(angle) * (distance * spread)
    const y = 90 + Math.sin(angle) * (distance * spread)

    setAttempts(prev => [...prev, { value, x, y }])
    setCurrentInput('')
  }, [currentInput, attempts.length, trueValue])

  const showResults = useCallback(() => {
    if (attempts.length === 0) return
    setShowFinalAnalysis(true)
  }, [attempts.length])

  const reset = useCallback(() => {
    setAttempts([])
    setShowFinalAnalysis(false)
    setCurrentInput('')
    setTrueValue(generateRandomValue()) // Generate new random true value
  }, [])

  const calculateStats = useCallback(() => {
    if (attempts.length === 0) return null

    const average = attempts.reduce((sum, a) => sum + a.value, 0) / attempts.length
    const deviations = attempts.map(a => a.value - average)
    const variance = deviations.reduce((sum, d) => sum + d * d, 0) / attempts.length
    const standardDeviation = Math.sqrt(variance)
    
    // Determine accuracy (average close to true value)
    const accuracyError = Math.abs(average - trueValue)
    const isAccurate = accuracyError < 2.0 // Within 2 units

    // Determine precision (low standard deviation)
    const isPrecise = standardDeviation < 1.5 // SD less than 1.5

    return {
      average: average.toFixed(1),
      standardDeviation: standardDeviation.toFixed(2),
      isAccurate,
      isPrecise,
      accuracyError: accuracyError.toFixed(1)
    }
  }, [attempts, trueValue])

  const stats = calculateStats()

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addMeasurement()
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Measurement Challenge
        </h3>
        <p className="text-gray-700 mb-2">
          Imagine you&apos;re measuring an object multiple times to test your accuracy and precision. 
          {!showFinalAnalysis && <span> The true value is <strong>hidden</strong> until you reveal your results.</span>}
          {showFinalAnalysis && <span> The true value was <strong className="text-red-600">{trueValue} cm</strong>.</span>}
        </p>
        <p className="text-sm text-gray-600">
          Make up to 10 measurements, then click &quot;Show Results&quot; to see how you did!
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Make Your Measurements ({attempts.length}/10)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter measurement (cm)"
                  disabled={attempts.length >= 10 || showFinalAnalysis}
                  className="flex-1"
                />
                <Button 
                  onClick={addMeasurement}
                  disabled={!currentInput || attempts.length >= 10 || showFinalAnalysis}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter values between 0 and 100 cm
              </p>
            </div>

            {/* Measurements List */}
            {attempts.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Your Measurements:</div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                  {attempts.map((attempt, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                    >
                      <span className="font-medium">Trial {idx + 1}:</span>
                      <span className="font-mono">{attempt.value.toFixed(1)} cm</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attempts.length > 0 && !showFinalAnalysis && (
              <Button 
                onClick={showResults}
                className="w-full"
                disabled={attempts.length < 3}
              >
                <Target className="h-4 w-4 mr-2" />
                Show Results ({attempts.length} measurement{attempts.length !== 1 ? 's' : ''})
              </Button>
            )}

            {attempts.length > 0 && (
              <Button 
                onClick={reset}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset and Try Again
              </Button>
            )}

            {attempts.length > 0 && attempts.length < 3 && !showFinalAnalysis && (
              <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                Make at least 3 measurements before showing results
              </p>
            )}
          </CardContent>
        </Card>

        {/* Target Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Diagram</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {attempts.length === 0 && 'Start adding measurements to see them appear'}
              {attempts.length > 0 && !showFinalAnalysis && 'Watch your measurements appear on the target'}
              {showFinalAnalysis && 'Your measurements vs. the true value'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-square bg-gray-50 rounded-lg">
              <svg width="100%" height="100%" viewBox="0 0 180 180" className="absolute inset-0">
                {/* Target circles */}
                <circle cx="90" cy="90" r="70" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                <circle cx="90" cy="90" r="50" fill="none" stroke="#d1d5db" strokeWidth="2" />
                <circle cx="90" cy="90" r="30" fill="none" stroke="#9ca3af" strokeWidth="2" />
                <circle cx="90" cy="90" r="15" fill="none" stroke="#6b7280" strokeWidth="2" />
                <circle cx="90" cy="90" r="5" fill="none" stroke="#4b5563" strokeWidth="2" />
                
                {/* Center point (true value) - only show after analysis */}
                {showFinalAnalysis && (
                  <>
                    <circle cx="90" cy="90" r="4" fill="#ef4444" />
                    <circle cx="90" cy="90" r="8" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
                    <text x="90" y="105" textAnchor="middle" className="text-xs fill-red-600 font-bold">
                      True Value
                    </text>
                  </>
                )}
                
                {/* Center indicator before reveal */}
                {!showFinalAnalysis && attempts.length === 0 && (
                  <>
                    <circle cx="90" cy="90" r="3" fill="#9ca3af" opacity="0.5" />
                    <text x="90" y="105" textAnchor="middle" className="text-xs fill-gray-500">
                      Target Center
                    </text>
                  </>
                )}
                
                {/* Measurement points */}
                {attempts.map((attempt, i) => (
                  <g key={i}>
                    <circle 
                      cx={attempt.x} 
                      cy={attempt.y} 
                      r="5" 
                      fill="#3b82f6"
                      opacity="0.8"
                      className="transition-all duration-500"
                    />
                    <text 
                      x={attempt.x} 
                      y={attempt.y - 10} 
                      textAnchor="middle" 
                      className="text-xs fill-blue-900 font-semibold"
                    >
                      {i + 1}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="mt-4 text-xs text-center text-gray-600">
              {!showFinalAnalysis && 'Blue dots = your measurements (true value hidden)'}
              {showFinalAnalysis && 'Blue dots = your measurements | Red dot = true value'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis */}
      {showFinalAnalysis && stats && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Results Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Average</div>
                <div className="text-2xl font-bold text-blue-600">{stats.average} cm</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">True Value</div>
                <div className="text-2xl font-bold text-red-600">{trueValue} cm</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm text-gray-600 mb-1">Std. Deviation</div>
                <div className="text-2xl font-bold text-purple-600">{stats.standardDeviation} cm</div>
              </div>
            </div>

            {/* Classification */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 ${
                stats.isAccurate 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {stats.isAccurate ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-bold ${
                    stats.isAccurate ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {stats.isAccurate ? 'ACCURATE' : 'NOT ACCURATE'}
                  </span>
                </div>
                <p className={`text-sm ${
                  stats.isAccurate ? 'text-green-800' : 'text-red-800'
                }`}>
                  Your average is {stats.accuracyError} cm from the true value.
                  {stats.isAccurate 
                    ? ' Great job getting close!' 
                    : ' Try to get closer to the target.'}
                </p>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                stats.isPrecise 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-yellow-50 border-yellow-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {stats.isPrecise ? (
                    <Check className="h-5 w-5 text-blue-600" />
                  ) : (
                    <X className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className={`font-bold ${
                    stats.isPrecise ? 'text-blue-900' : 'text-yellow-900'
                  }`}>
                    {stats.isPrecise ? 'PRECISE' : 'NOT PRECISE'}
                  </span>
                </div>
                <p className={`text-sm ${
                  stats.isPrecise ? 'text-blue-800' : 'text-yellow-800'
                }`}>
                  Your measurements have a standard deviation of {stats.standardDeviation} cm.
                  {stats.isPrecise 
                    ? ' Very consistent!' 
                    : ' Try to be more consistent.'}
                </p>
              </div>
            </div>

            {/* Overall Assessment */}
            <div className={`p-4 rounded-lg border-2 ${
              stats.isAccurate && stats.isPrecise 
                ? 'bg-green-50 border-green-400'
                : stats.isPrecise && !stats.isAccurate
                  ? 'bg-orange-50 border-orange-400'
                  : stats.isAccurate && !stats.isPrecise
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-red-50 border-red-400'
            }`}>
              <div className="font-semibold mb-2">
                {stats.isAccurate && stats.isPrecise && '🎯 Excellent! High Accuracy & High Precision'}
                {stats.isPrecise && !stats.isAccurate && '⚠️ Systematic Error: High Precision but Low Accuracy'}
                {stats.isAccurate && !stats.isPrecise && '📊 Random Errors: Low Precision but High Accuracy'}
                {!stats.isAccurate && !stats.isPrecise && '❌ Low Accuracy & Low Precision'}
              </div>
              <p className="text-sm">
                {stats.isAccurate && stats.isPrecise && 
                  'Your measurements are both close to the true value AND consistent with each other. This is the ideal result!'}
                {stats.isPrecise && !stats.isAccurate && 
                  'Your measurements are consistent but systematically off from the true value. This suggests a calibration error or systematic bias.'}
                {stats.isAccurate && !stats.isPrecise && 
                  'Your measurements average close to the true value but are spread out. Random errors are affecting your precision.'}
                {!stats.isAccurate && !stats.isPrecise && 
                  'Your measurements have both systematic and random errors. Focus on technique and consistency.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Interactive measurement visualization component
interface InteractiveMeasurementProps {
  device: MeasurementDevice
}

function InteractiveMeasurement({ device }: InteractiveMeasurementProps) {
  const [position, setPosition] = useState(25)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(percentage)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(percentage)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('touchend', handleGlobalMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchend', handleGlobalMouseUp)
    }
  }, [])

  // Calculate the measurement value
  const rawValue = (position / 100) * (device.range[1] - device.range[0]) + device.range[0]
  
  // Format to correct precision
  const decimalPlaces = device.precision.toString().includes('.') 
    ? device.precision.toString().split('.')[1].length 
    : 0
  const displayValue = rawValue.toFixed(decimalPlaces)

  // Find nearest marking for visual feedback
  const nearestMarking = Math.round(rawValue / device.minorDivision) * device.minorDivision

  return (
    <div className="space-y-4">
      <div 
        ref={containerRef}
        className="relative h-40 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4 cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Instructions */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Move className="h-3 w-3" />
          Drag the red marker to measure
        </div>

        {/* Scale */}
        <div className="absolute bottom-8 left-4 right-4 h-16 border-t-2 border-l-2 border-r-2 border-gray-800 bg-white rounded-t">
          {/* Generate scale markings */}
          {Array.from({ 
            length: Math.floor(device.range[1] / device.minorDivision) + 1 
          }).map((_, i) => {
            const value = i * device.minorDivision
            const positionPercent = (value / device.range[1]) * 100
            const isMajorTick = value % (device.minorDivision * 5) === 0
            const isNearMarker = Math.abs(value - rawValue) < device.minorDivision
            
            return (
              <div
                key={i}
                className="absolute transition-all duration-150"
                style={{ left: `${positionPercent}%` }}
              >
                <div 
                  className={`border-l-2 transition-all duration-150 ${
                    isNearMarker 
                      ? 'border-red-500 h-10' 
                      : isMajorTick 
                        ? 'border-gray-800 h-8' 
                        : 'border-gray-600 h-4'
                  }`}
                />
                {isMajorTick && (
                  <div className={`text-xs font-medium -ml-2 mt-1 transition-colors duration-150 ${
                    isNearMarker ? 'text-red-600 font-bold' : 'text-gray-700'
                  }`}>
                    {value}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Draggable measurement indicator */}
        <div
          className="absolute bottom-24 transform -translate-x-1/2 cursor-grab active:cursor-grabbing"
          style={{ left: `calc(4% + ${position * 0.92}%)` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* Arrow and line */}
          <div className="flex flex-col items-center">
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap mb-1">
              {displayValue} {device.unit}
            </div>
            <div className="w-0.5 h-8 bg-red-500"></div>
            <div className="w-3 h-3 bg-red-500 rotate-45 transform -translate-y-1.5"></div>
          </div>
        </div>

        {/* Unit label */}
        <div className="absolute bottom-2 right-4 text-sm font-medium text-gray-600">
          Units: {device.unit}
        </div>
      </div>

      {/* Measurement explanation */}
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="font-semibold text-blue-900 mb-1">Raw Position</div>
          <div className="text-blue-800">≈ {rawValue.toFixed(2)} {device.unit}</div>
          <div className="text-xs text-blue-700 mt-1">
            (Too many decimal places!)
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="font-semibold text-green-900 mb-1">Recorded Measurement</div>
          <div className="text-green-800 font-bold">{displayValue} {device.unit}</div>
          <div className="text-xs text-green-700 mt-1">
            (Correct precision: ±{device.precision} {device.unit})
          </div>
        </div>
      </div>

      <div className="bg-purple-50 p-3 rounded-lg text-sm">
        <div className="flex items-start gap-2">
          <div className="text-purple-500 mt-0.5">💡</div>
          <div className="text-purple-900">
            <strong>Notice:</strong> Even though the object might be at {rawValue.toFixed(2)} {device.unit}, 
            we can only record <strong>{displayValue} {device.unit}</strong> because the measuring device 
            has a precision of ±{device.precision} {device.unit}. We estimate to the limit of the instrument&apos;s precision.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MeasurementPrecisionSimulation() {
  const [selectedDevice, setSelectedDevice] = useState<MeasurementDevice>(devices[0])
  const [currentProblem, setCurrentProblem] = useState<MeasurementProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showHint, setShowHint] = useState(false)
  const [demoDevice, setDemoDevice] = useState<MeasurementDevice>(devices[0])

  const generateProblem = useCallback((device: MeasurementDevice) => {
    const trueValue = Number((Math.random() * (device.range[1] - device.range[0] - 10) + 5).toFixed(1))
    const objectPosition = trueValue + (Math.random() - 0.5) * 0.3
    
    const hints = [
      'Remember to estimate one digit beyond the smallest marking on the device.',
      'The precision is half of the smallest division marked on the instrument.',
      'Look carefully at where the object lines up with the markings.',
      'Your answer should reflect the precision of the measuring device.',
      'Count the number of decimal places - it should match the device precision.'
    ]

    const problem: MeasurementProblem = {
      device,
      trueValue,
      objectPosition,
      hint: hints[Math.floor(Math.random() * hints.length)]
    }

    setCurrentProblem(problem)
    setUserAnswer('')
    setFeedback(null)
    setShowHint(false)
  }, [])

  const checkAnswer = useCallback(() => {
    if (!currentProblem || !userAnswer) return

    const answer = parseFloat(userAnswer)
    const { objectPosition, device } = currentProblem

    // Check if answer is within acceptable range
    const isCorrectValue = Math.abs(answer - objectPosition) <= device.precision
    
    // Check if answer has correct precision (decimal places)
    const decimalPlaces = userAnswer.includes('.') ? userAnswer.split('.')[1].length : 0
    const expectedDecimals = device.precision.toString().includes('.') 
      ? device.precision.toString().split('.')[1].length 
      : 0
    const hasCorrectPrecision = decimalPlaces === expectedDecimals

    const correct = isCorrectValue && hasCorrectPrecision

    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }))

    if (correct) {
      setFeedback({
        correct: true,
        message: `Correct! You measured ${answer} ${device.unit} with the proper precision.`
      })
    } else if (!hasCorrectPrecision) {
      setFeedback({
        correct: false,
        message: `Close, but check your precision. This device has a precision of ${device.precision} ${device.unit}, so your answer should have ${expectedDecimals} decimal place${expectedDecimals !== 1 ? 's' : ''}.`
      })
    } else {
      setFeedback({
        correct: false,
        message: `Not quite. The correct measurement is approximately ${objectPosition.toFixed(expectedDecimals)} ${device.unit}. Remember to read the scale carefully.`
      })
    }
  }, [currentProblem, userAnswer])

  const resetScore = useCallback(() => {
    setScore({ correct: 0, total: 0 })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/simulations">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Measurement, Precision & Accuracy</h1>
              <p className="text-gray-600 mt-1">Learn to measure with proper precision and understand accuracy</p>
            </div>
          </div>
          {score.total > 0 && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Score: {score.correct}/{score.total}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="learn" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="learn">Learn Concepts</TabsTrigger>
            <TabsTrigger value="practice">Practice Measuring</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy vs Precision</TabsTrigger>
          </TabsList>

          {/* Learn Tab */}
          <TabsContent value="learn" className="space-y-6">
            {/* Interactive Demo Section */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Move className="h-5 w-5 text-primary" />
                  Interactive Measurement Demo
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag the red marker to see how measurements work with different devices
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Device selector */}
                <div>
                  <div className="text-sm font-medium mb-2">Select a Measuring Device:</div>
                  <div className="grid grid-cols-2 gap-3">
                    {devices.map((device, idx) => (
                      <Button
                        key={idx}
                        variant={demoDevice.name === device.name ? 'default' : 'outline'}
                        onClick={() => setDemoDevice(device)}
                        className="h-auto py-3"
                      >
                        <div className="text-center">
                          <div className="font-semibold">{device.name}</div>
                          <div className="text-xs opacity-80 mt-0.5">±{device.precision} {device.unit}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Interactive visualization */}
                <InteractiveMeasurement device={demoDevice} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Understanding Measurement Precision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">What is Precision?</h3>
                  <p className="text-gray-700">
                    <strong>Precision</strong> refers to the smallest increment that can be measured by an instrument. 
                    When taking a measurement, you should always:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
                    <li>Read all digits that are certain (marked on the scale)</li>
                    <li>Estimate one additional digit (the uncertain digit)</li>
                    <li>Record your measurement with the appropriate number of decimal places</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Rule of Thumb</h4>
                  <MathMarkdown content="The precision of a measuring device is typically **half the smallest marked division**." />
                  <div className="text-blue-800 mt-2">
                    <MathMarkdown content="For example, if a ruler has millimeter markings, you can estimate to \\( \pm 0.5 \\, \text{mm} \\)." />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Examples of Precision</h3>
                  <div className="space-y-3">
                    {devices.map((device, idx) => (
                      <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-gray-600">{device.description}</p>
                        <p className="text-sm mt-1">
                          <strong>Precision:</strong> ± {device.precision} {device.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Common Mistakes to Avoid</h4>
                  <ul className="list-disc list-inside space-y-1 text-yellow-800">
                    <li>Recording too many decimal places (more precision than the device allows)</li>
                    <li>Recording too few decimal places (not showing the full precision)</li>
                    <li>Forgetting to estimate the final uncertain digit</li>
                    <li>Not aligning your eye level with the measurement (parallax error)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select a Measuring Device</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {devices.map((device, idx) => (
                    <Button
                      key={idx}
                      variant={selectedDevice.name === device.name ? 'default' : 'outline'}
                      className="h-auto py-4 px-4 text-left flex flex-col items-start"
                      onClick={() => {
                        setSelectedDevice(device)
                        setCurrentProblem(null)
                        setFeedback(null)
                      }}
                    >
                      <span className="font-semibold">{device.name}</span>
                      <span className="text-sm opacity-80">Precision: ± {device.precision} {device.unit}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!currentProblem ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Button 
                    onClick={() => generateProblem(selectedDevice)}
                    size="lg"
                    className="mx-auto"
                  >
                    Start Practice with {selectedDevice.name}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Read the Measurement</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Device: {currentProblem.device.name} (Precision: ± {currentProblem.device.precision} {currentProblem.device.unit})
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Visual representation of measurement */}
                  <div className="bg-gray-100 p-6 rounded-lg">
                    <div className="relative h-32 mb-8">
                      {/* Scale markings */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 border-t-2 border-l-2 border-r-2 border-gray-800">
                        {Array.from({ length: Math.floor(currentProblem.device.range[1] / currentProblem.device.minorDivision) + 1 }).map((_, i) => {
                          const value = i * currentProblem.device.minorDivision
                          const position = (value / currentProblem.device.range[1]) * 100
                          const isMajorTick = value % (currentProblem.device.minorDivision * 5) === 0
                          
                          return (
                            <div
                              key={i}
                              className="absolute"
                              style={{ left: `${position}%` }}
                            >
                              <div 
                                className={`border-l-2 border-gray-800 ${isMajorTick ? 'h-8' : 'h-4'}`}
                              />
                              {isMajorTick && (
                                <div className="text-xs font-medium text-gray-700 -ml-2 mt-1">
                                  {value}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Object indicator */}
                      <div
                        className="absolute w-1 h-12 bg-red-500 transform -translate-x-1/2"
                        style={{ 
                          left: `${(currentProblem.objectPosition / currentProblem.device.range[1]) * 100}%`,
                          bottom: '80px'
                        }}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          Measure here ↓
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-600 mt-4">
                      Unit: {currentProblem.device.unit}
                    </div>
                  </div>

                  {/* Answer input */}
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="any"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder={`Enter measurement (${currentProblem.device.unit})`}
                        className="flex-1"
                        disabled={feedback !== null}
                      />
                      {!feedback ? (
                        <Button onClick={checkAnswer} disabled={!userAnswer}>
                          <Check className="h-4 w-4 mr-2" />
                          Check
                        </Button>
                      ) : (
                        <Button onClick={() => generateProblem(selectedDevice)}>
                          Next Problem
                        </Button>
                      )}
                    </div>

                    {!feedback && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHint(!showHint)}
                      >
                        {showHint ? 'Hide' : 'Show'} Hint
                      </Button>
                    )}

                    {showHint && !feedback && (
                      <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
                        💡 {currentProblem.hint}
                      </div>
                    )}

                    {feedback && (
                      <div className={`p-4 rounded-lg flex items-start gap-3 ${
                        feedback.correct 
                          ? 'bg-green-50 text-green-900' 
                          : 'bg-red-50 text-red-900'
                      }`}>
                        {feedback.correct ? (
                          <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        )}
                        <p>{feedback.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetScore}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Score
                    </Button>
                    <div className="text-sm text-gray-600">
                      Problems completed: {score.total}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Accuracy vs Precision Tab */}
          <TabsContent value="accuracy" className="space-y-6">
            {/* Interactive Exercise */}
            <AccuracyPrecisionExercise />

            {/* Concept Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Understanding Accuracy vs Precision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Accuracy</h3>
                    <p className="text-gray-700">
                      How close a measurement is to the <strong>true value</strong> or accepted value.
                    </p>
                    <div className="bg-green-50 p-3 rounded text-sm text-green-900">
                      Think of accuracy as hitting the bullseye on a target.
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Precision</h3>
                    <p className="text-gray-700">
                      How close measurements are to <strong>each other</strong> when repeated.
                    </p>
                    <div className="bg-blue-50 p-3 rounded text-sm text-blue-900">
                      Think of precision as hitting the same spot repeatedly (even if it&apos;s not the bullseye).
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg mt-6">
                  <h4 className="font-semibold text-purple-900 mb-2">Key Insight</h4>
                  <p className="text-purple-800">
                    A measurement can be precise without being accurate (systematic error), 
                    and it can be accurate without being precise (random errors cancel out). 
                    The goal is to achieve both!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Example scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Common Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {accuracyDemos.map((demo, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{demo.name}</h4>
                        <div className="flex flex-col gap-1">
                          <Badge variant={demo.accurate ? 'default' : 'secondary'} className="text-xs">
                            {demo.accurate ? '✓ Accurate' : '✗ Not Accurate'}
                          </Badge>
                          <Badge variant={demo.precise ? 'default' : 'secondary'} className="text-xs">
                            {demo.precise ? '✓ Precise' : '✗ Not Precise'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 italic">
                        {demo.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sources of Error</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-red-900">Systematic Errors (Affect Accuracy)</h4>
                  <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                    <li>Instrument calibration errors (scale reads 2g high)</li>
                    <li>Parallax error (viewing angle is wrong)</li>
                    <li>Zero error (instrument doesn&apos;t start at zero)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-900">Random Errors (Affect Precision)</h4>
                  <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                    <li>Estimating the uncertain digit differently each time</li>
                    <li>Environmental fluctuations (temperature, vibrations)</li>
                    <li>Variations in measurement technique</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Improving Your Measurements</h4>
                  <ul className="list-disc list-inside text-green-800 space-y-1">
                    <li>Take multiple measurements and average them (reduces random error)</li>
                    <li>Calibrate instruments properly (reduces systematic error)</li>
                    <li>Control environmental conditions</li>
                    <li>Use the most precise instrument available</li>
                    <li>Be consistent in your measurement technique</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
