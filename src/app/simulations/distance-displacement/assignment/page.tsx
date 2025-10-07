'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import MathMarkdown from '@/components/MathMarkdown'
import { RotateCcw, Move, Bug, ChevronRight, CheckCircle } from 'lucide-react'

interface Point {
  x: number
  y: number
}

interface PathPoint extends Point {
  timestamp: number
}

interface Question {
  id: string
  text: string
  type: 'short-answer' | 'numerical' | 'multiple-choice'
  options?: string[]
  correctAnswer?: string | number
  points: number
  hint?: string
}

interface QuestionResponse {
  questionId: string
  answer: string
  isCorrect?: boolean
  pointsEarned?: number
}

const assignmentQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Create a path where the bug moves in a square pattern (4 equal sides). What is the relationship between the total distance traveled and the displacement magnitude?',
    type: 'short-answer',
    points: 5,
    hint: 'Think about where the bug starts and ends'
  },
  {
    id: 'q2',
    text: 'Move the bug to create a path where distance = 8.00 m. Then drag the origin to a different location. What happens to the displacement magnitude?',
    type: 'multiple-choice',
    options: [
      'Displacement increases',
      'Displacement decreases',
      'Displacement stays the same',
      'Displacement becomes zero'
    ],
    correctAnswer: 'Displacement stays the same',
    points: 3,
    hint: 'Displacement is independent of coordinate system choice'
  },
  {
    id: 'q3',
    text: 'Using shift-lock, create a perfectly horizontal path of 6 units (±0.2). What is the y-component of the displacement?',
    type: 'numerical',
    correctAnswer: 0,
    points: 4,
    hint: 'Horizontal motion means no vertical component'
  },
  {
    id: 'q4',
    text: 'Create any path where the total distance is MORE than 10 m but displacement is LESS than 5 m. Explain why this is possible.',
    type: 'short-answer',
    points: 6,
    hint: 'Think about curved or back-and-forth paths'
  },
  {
    id: 'q5',
    text: 'Move the bug to create a displacement of approximately 5 m at 45° from the +x axis. What are the x and y components approximately equal to?',
    type: 'numerical',
    correctAnswer: 3.54,
    points: 5,
    hint: 'Use cos(45°) and sin(45°) ≈ 0.707'
  }
]

export default function DistanceDisplacementAssignmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Canvas state
  const [bug, setBug] = useState<Point>({ x: 300, y: 300 })
  const [initialPosition, setInitialPosition] = useState<Point>({ x: 300, y: 300 })
  const [path, setPath] = useState<PathPoint[]>([{ x: 300, y: 300, timestamp: Date.now() }])
  const [origin, setOrigin] = useState<Point>({ x: 50, y: 550 })
  const [rotation, setRotation] = useState(0)
  const [isDraggingBug, setIsDraggingBug] = useState(false)
  const [isDraggingOrigin, setIsDraggingOrigin] = useState(false)
  const [isDrawingMode, setIsDrawingMode] = useState(true)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null)
  const [lockedAxis, setLockedAxis] = useState<'x' | 'y' | null>(null)
  
  // Assignment state
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<QuestionResponse[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  
  const canvasWidth = 700
  const canvasHeight = 600
  
  const progress = ((currentQuestion + 1) / assignmentQuestions.length) * 100
  const totalPoints = assignmentQuestions.reduce((sum, q) => sum + q.points, 0)
  const earnedPoints = responses.reduce((sum, r) => sum + (r.pointsEarned || 0), 0)
  
  // Transform point from canvas to physics coordinates
  const toPhysicsCoords = useCallback((point: Point): Point => {
    const dx = point.x - origin.x
    const dy = origin.y - point.y
    
    const rad = (rotation * Math.PI) / 180
    const rotatedX = dx * Math.cos(rad) - dy * Math.sin(rad)
    const rotatedY = dx * Math.sin(rad) + dy * Math.cos(rad)
    
    return { x: rotatedX / 50, y: rotatedY / 50 }
  }, [origin, rotation])
  
  const totalDistance = useCallback(() => {
    let distance = 0
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x
      const dy = path[i].y - path[i - 1].y
      distance += Math.sqrt(dx * dx + dy * dy)
    }
    return distance / 50
  }, [path])
  
  const displacement = useCallback(() => {
    const initial = toPhysicsCoords(initialPosition)
    const final = toPhysicsCoords(bug)
    const dx = final.x - initial.x
    const dy = final.y - initial.y
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    return { magnitude, angle, dx, dy }
  }, [bug, initialPosition, toPhysicsCoords])
  
  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true)
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
  
  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    
    // Grid
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
    
    // Axes
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 3
    
    const xAxisEnd = {
      x: origin.x + 200 * Math.cos((rotation * Math.PI) / 180),
      y: origin.y - 200 * Math.sin((rotation * Math.PI) / 180)
    }
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    ctx.lineTo(xAxisEnd.x, xAxisEnd.y)
    ctx.stroke()
    
    const yAngle = ((rotation + 90) * Math.PI) / 180
    const yAxisEnd = {
      x: origin.x + 200 * Math.cos(yAngle),
      y: origin.y - 200 * Math.sin(yAngle)
    }
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    ctx.lineTo(yAxisEnd.x, yAxisEnd.y)
    ctx.stroke()
    
    // Path
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
    
    // Vectors with labels
    const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string) => {
      const headLength = 15
      const dx = toX - fromX
      const dy = toY - fromY
      const angle = Math.atan2(dy, dx)
      
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(toX, toY)
      ctx.stroke()
      
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
      ctx.closePath()
      ctx.fill()
    }
    
    drawArrow(origin.x, origin.y, initialPosition.x, initialPosition.y, '#8b5cf6')
    drawArrow(origin.x, origin.y, bug.x, bug.y, '#3b82f6')
    drawArrow(initialPosition.x, initialPosition.y, bug.x, bug.y, '#ef4444')
    
    // Origin
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(origin.x, origin.y, 8, 0, 2 * Math.PI)
    ctx.fill()
    
    // Initial position point
    ctx.fillStyle = '#8b5cf6'
    ctx.beginPath()
    ctx.arc(initialPosition.x, initialPosition.y, 8, 0, 2 * Math.PI)
    ctx.fill()
    
    // Draw bug - detailed sprite
    // Bug body (oval)
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.ellipse(bug.x, bug.y, 12, 16, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#065f46'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Bug head
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
    ctx.beginPath()
    ctx.moveTo(bug.x - 10, bug.y - 5)
    ctx.lineTo(bug.x - 18, bug.y - 8)
    ctx.moveTo(bug.x - 11, bug.y)
    ctx.lineTo(bug.x - 20, bug.y - 2)
    ctx.moveTo(bug.x - 10, bug.y + 5)
    ctx.lineTo(bug.x - 18, bug.y + 8)
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
  
  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const bugDist = Math.sqrt((x - bug.x) ** 2 + (y - bug.y) ** 2)
    if (bugDist < 15) {
      setIsDraggingBug(true)
      setIsDrawingMode(false)
      setDragStartPos({ x: bug.x, y: bug.y })
      setLockedAxis(null)
      return
    }
    
    const originDist = Math.sqrt((x - origin.x) ** 2 + (y - origin.y) ** 2)
    if (originDist < 15) {
      setIsDraggingOrigin(true)
      return
    }
    
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
      if (isShiftPressed && dragStartPos) {
        if (lockedAxis === null) {
          const dx = Math.abs(x - dragStartPos.x)
          const dy = Math.abs(y - dragStartPos.y)
          
          if (dx > 5 || dy > 5) {
            setLockedAxis(dx > dy ? 'x' : 'y')
          }
        }
        
        if (lockedAxis === 'x') {
          y = bug.y
        } else if (lockedAxis === 'y') {
          x = bug.x
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
  
  const handleSubmitAnswer = () => {
    const question = assignmentQuestions[currentQuestion]
    let isCorrect = false
    let pointsEarned = 0
    
    if (question.type === 'multiple-choice' && question.correctAnswer) {
      isCorrect = currentAnswer === question.correctAnswer
      pointsEarned = isCorrect ? question.points : 0
    } else if (question.type === 'numerical' && typeof question.correctAnswer === 'number') {
      const numAnswer = parseFloat(currentAnswer)
      isCorrect = Math.abs(numAnswer - question.correctAnswer) < 0.5
      pointsEarned = isCorrect ? question.points : 0
    } else {
      // Short answer - give full points for any attempt
      pointsEarned = question.points
      isCorrect = true
    }
    
    setResponses([...responses, {
      questionId: question.id,
      answer: currentAnswer,
      isCorrect,
      pointsEarned
    }])
    
    setCurrentAnswer('')
    setShowHint(false)
    
    if (currentQuestion < assignmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setIsSubmitted(true)
    }
  }
  
  const dist = totalDistance()
  const disp = displacement()
  const question = assignmentQuestions[currentQuestion]

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You must be signed in to complete this assignment.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Assignment Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {earnedPoints} / {totalPoints}
              </div>
              <div className="text-muted-foreground">Points Earned</div>
              <div className="text-3xl font-bold text-muted-foreground mt-4">
                {Math.round((earnedPoints / totalPoints) * 100)}%
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Your Responses:</h3>
              {assignmentQuestions.map((q, idx) => {
                const response = responses[idx]
                return (
                  <div key={q.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">Question {idx + 1}</div>
                      <Badge variant={response.isCorrect ? "default" : "secondary"}>
                        {response.pointsEarned} / {q.points} pts
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{q.text}</p>
                    <p className="text-sm"><strong>Your answer:</strong> {response.answer}</p>
                  </div>
                )
              })}
            </div>
            
            <div className="flex gap-4">
              <Button onClick={() => router.push('/dashboard')} className="flex-1">
                Back to Dashboard
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Progress */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>Distance vs Displacement - Interactive Assignment</CardTitle>
              <Badge variant="outline">
                Question {currentQuestion + 1} of {assignmentQuestions.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-muted-foreground mt-2">
              Points: {earnedPoints} / {totalPoints}
            </div>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-green-600" />
                Interactive Canvas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="border-2 border-border rounded-lg cursor-pointer bg-white w-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Total Distance</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {dist.toFixed(2)} m
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Path length traveled
                  </div>
                </div>
                
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Displacement Vector</div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    {disp.magnitude.toFixed(2)} m
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {disp.angle.toFixed(1)}° from +x axis
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground"><strong>x-component</strong></div>
                    <div className="font-mono text-sm">Δx = {disp.dx.toFixed(2)} m</div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="text-xs text-muted-foreground"><strong>y-component</strong></div>
                    <div className="font-mono text-sm">Δy = {disp.dy.toFixed(2)} m</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline" size="sm" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={handleResetOrigin} variant="outline" size="sm" className="flex-1">
                  <Move className="h-4 w-4 mr-2" />
                  Reset Origin
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                <strong>💡 Controls:</strong> Click to move bug | Drag bug or origin | Hold Shift to lock axis
              </div>
            </CardContent>
          </Card>
          
          {/* Question */}
          <Card>
            <CardHeader>
              <CardTitle>Question {currentQuestion + 1}</CardTitle>
              <Badge variant="secondary">{question.points} points</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <MathMarkdown content={question.text} />
              </div>
              
              {question.type === 'multiple-choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        currentAnswer === option
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={currentAnswer === option}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        className="mr-3"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === 'numerical' && (
                <div className="space-y-2">
                  <Label htmlFor="numerical-answer">Your Answer (numerical value)</Label>
                  <Input
                    id="numerical-answer"
                    type="number"
                    step="0.01"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Enter number"
                    className="font-mono"
                  />
                </div>
              )}
              
              {question.type === 'short-answer' && (
                <div className="space-y-2">
                  <Label htmlFor="short-answer">Your Answer</Label>
                  <Textarea
                    id="short-answer"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Explain your reasoning..."
                    rows={4}
                  />
                </div>
              )}
              
              {question.hint && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(!showHint)}
                  >
                    {showHint ? 'Hide' : 'Show'} Hint
                  </Button>
                  {showHint && (
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
                      💡 {question.hint}
                    </div>
                  )}
                </div>
              )}
              
              <Button
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer.trim()}
                className="w-full"
              >
                {currentQuestion < assignmentQuestions.length - 1 ? (
                  <>
                    Next Question
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Submit Assignment
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
