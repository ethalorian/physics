"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { VocabularyTerm } from '@/types/assignment'
import { 
  Trophy, 
  RotateCcw, 
  Target,
  CheckCircle,
  XCircle,
  Zap,
  Heart,
  Clock,
  Play,
  Pause
} from 'lucide-react'

interface VocabularyWordShootGameProps {
  vocabularyTerms: VocabularyTerm[]
  onGameComplete?: (score: number, totalQuestions: number, timeSpent: number) => void
  difficulty?: 'easy' | 'medium' | 'hard'
  gameLength?: number // number of questions
}

interface Bubble {
  id: string
  term: VocabularyTerm
  x: number
  y: number
  speed: number
  size: number
  isCorrect: boolean
  isPopped: boolean
  animationStartTime: number
}

interface GameState {
  gameStatus: 'waiting' | 'playing' | 'paused' | 'complete' | 'question-complete' | 'wrong-answer-pause'
  score: number
  lives: number
  questionsAnswered: number
  correctAnswers: number
  currentDefinition: string
  currentCorrectTerm: VocabularyTerm | null
  startTime: number
  streak: number
  roundStartTime: number
  lastWrongBubble: Bubble | null
}

export default function VocabularyWordShootGame({
  vocabularyTerms,
  onGameComplete,
  difficulty = 'medium',
  gameLength = 20
}: VocabularyWordShootGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    gameStatus: 'waiting',
    score: 0,
    lives: 3,
    questionsAnswered: 0,
    correctAnswers: 0,
    currentDefinition: '',
    currentCorrectTerm: null,
    startTime: 0,
    streak: 0,
    roundStartTime: 0,
    lastWrongBubble: null
  })
  
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [gameTerms, setGameTerms] = useState<VocabularyTerm[]>([])
  const [currentRoundBubbles, setCurrentRoundBubbles] = useState<VocabularyTerm[]>([])
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Game configuration based on difficulty
  const gameConfig = {
    easy: { bubbleSpeed: 0.8, bubblesPerRound: 4, spawnDelay: 1200, lives: 5 },
    medium: { bubbleSpeed: 1.2, bubblesPerRound: 5, spawnDelay: 1000, lives: 3 },
    hard: { bubbleSpeed: 1.8, bubblesPerRound: 6, spawnDelay: 800, lives: 2 }
  }

  const config = gameConfig[difficulty]

  // Initialize game terms
  useEffect(() => {
    if (vocabularyTerms.length > 0) {
      // Filter by difficulty if specified
      let filteredTerms = vocabularyTerms
      
      if (difficulty === 'easy') {
        filteredTerms = vocabularyTerms.filter(term => 
          term.difficulty === 'easy' || !term.difficulty
        )
      } else if (difficulty === 'hard') {
        filteredTerms = vocabularyTerms.filter(term => 
          term.difficulty === 'hard' || !term.difficulty
        )
      }
      // For medium difficulty, use all terms (no filtering)
      
      // Shuffle terms for random order
      const shuffled = [...filteredTerms].sort(() => Math.random() - 0.5)
      setGameTerms(shuffled)
    }
  }, [vocabularyTerms, difficulty])

  // Simple animation loop using CSS animations instead of RAF
  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      const checkBubbles = setInterval(() => {
        setBubbles(prev => prev.filter(bubble => !bubble.isPopped))
      }, 100)

      return () => clearInterval(checkBubbles)
    }
  }, [gameState.gameStatus])

  // Start a new round with a fresh set of bubbles
  const startNewRound = useCallback(() => {
    if (gameState.questionsAnswered >= Math.min(gameLength, gameTerms.length)) {
      // Game complete
      const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000)
      setGameState(prev => ({ ...prev, gameStatus: 'complete' }))
      setTimeout(() => {
        onGameComplete?.(gameState.score, gameState.questionsAnswered, timeSpent)
      }, 1000)
      return
    }

    const currentTerm = gameTerms[gameState.questionsAnswered]
    if (!currentTerm) return

    // Create round bubbles - 1 correct + several wrong answers
    const wrongTerms = gameTerms.filter(t => t.id !== currentTerm.id)
    const roundBubbles: VocabularyTerm[] = [currentTerm] // Always include correct answer
    
    // Add wrong answers
    const shuffledWrong = [...wrongTerms].sort(() => Math.random() - 0.5)
    roundBubbles.push(...shuffledWrong.slice(0, config.bubblesPerRound - 1))
    
    setCurrentRoundBubbles(roundBubbles)
    
    setGameState(prev => ({
      ...prev,
      gameStatus: 'playing',
      currentDefinition: currentTerm.definition || '',
      currentCorrectTerm: currentTerm,
      roundStartTime: Date.now()
    }))

    setBubbles([])
    
    // Spawn all bubbles for this round with staggered timing
    roundBubbles.forEach((term, index) => {
      setTimeout(() => {
        spawnBubbleForTerm(term, currentTerm.id === term.id)
      }, index * config.spawnDelay)
    })
  }, [gameState, gameTerms, gameLength, config, onGameComplete])

  const spawnBubbleForTerm = useCallback((term: VocabularyTerm, isCorrect: boolean) => {
    const gameAreaWidth = gameAreaRef.current?.clientWidth || 1000
    const gameAreaHeight = gameAreaRef.current?.clientHeight || 600
    
    const newBubble: Bubble = {
      id: `bubble-${term.id}-${Date.now()}`,
      term,
      x: Math.random() * (gameAreaWidth - 140), // Account for larger bubble size
      y: Math.random() * 50, // Spawn near top of screen
      speed: config.bubbleSpeed,
      size: 110, // Larger bubbles for better clicking
      isCorrect,
      isPopped: false,
      animationStartTime: Date.now()
    }

    setBubbles(prev => [...prev, newBubble])
  }, [config.bubbleSpeed])

  const startGame = useCallback(() => {
    if (gameTerms.length === 0) return
    
    setGameState({
      gameStatus: 'waiting',
      score: 0,
      lives: config.lives,
      questionsAnswered: 0,
      correctAnswers: 0,
      currentDefinition: '',
      currentCorrectTerm: null,
      startTime: Date.now(),
      streak: 0,
      roundStartTime: 0,
      lastWrongBubble: null
    })
    
    setBubbles([])
    
    // Start first round after a brief delay
    setTimeout(() => {
      startNewRound()
    }, 500)
  }, [gameTerms, config.lives, startNewRound])

  const popBubble = useCallback((bubble: Bubble) => {
    if (bubble.isPopped || (gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'wrong-answer-pause')) return

    // Mark bubble as popped (this will trigger color change)
    setBubbles(prev => prev.map(b => 
      b.id === bubble.id ? { ...b, isPopped: true } : b
    ))

    if (bubble.isCorrect) {
      // Correct answer - clear all bubbles and move to next round
      setBubbles(prev => prev.map(b => ({ ...b, isPopped: true })))
      
      const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
      const streakBonus = gameState.streak >= 3 ? 10 : 0
      const points = basePoints + streakBonus

      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        correctAnswers: prev.correctAnswers + 1,
        questionsAnswered: prev.questionsAnswered + 1,
        streak: prev.streak + 1,
        gameStatus: 'question-complete',
        lastWrongBubble: null
      }))

      // Move to next round after showing success
      setTimeout(() => {
        startNewRound()
      }, 1500)
    } else {
      // Wrong answer - pause game and show definition reminder
      setGameState(prev => ({
        ...prev,
        lives: prev.lives - 1,
        streak: 0,
        gameStatus: 'wrong-answer-pause',
        lastWrongBubble: bubble
      }))

      // Check if game over
      if (gameState.lives <= 1) {
        const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000)
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gameStatus: 'complete' }))
          onGameComplete?.(gameState.score, gameState.questionsAnswered, timeSpent)
        }, 2000)
      }
    }
  }, [gameState, difficulty, startNewRound, onGameComplete])

  const continueAfterWrongAnswer = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'playing',
      lastWrongBubble: null
    }))
  }, [])

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'waiting'
    }))
    setBubbles([])
  }, [])

  const getProgressPercentage = () => {
    return (gameState.questionsAnswered / Math.min(gameLength, gameTerms.length)) * 100
  }

  if (gameTerms.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No vocabulary terms available for this difficulty level.</p>
        </CardContent>
      </Card>
    )
  }

  if (gameState.gameStatus === 'waiting') {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Target className="h-6 w-6 text-orange-600" />
            Word Shoot Ready
          </CardTitle>
          <CardDescription>
            Shoot the correct vocabulary bubbles as they float by
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{Math.min(gameLength, gameTerms.length)}</div>
              <div className="text-sm text-blue-600">Questions</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">{config.lives}</div>
              <div className="text-sm text-orange-600">Lives</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{config.bubblesPerRound}</div>
              <div className="text-sm text-green-600">Max Bubbles</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30}
              </div>
              <div className="text-sm text-purple-600">Base Points</div>
            </div>
          </div>
          
          <div className="text-center">
            <Button onClick={startGame} size="lg" className="bg-orange-600 hover:bg-orange-700">
              <Target className="h-4 w-4 mr-2" />
              Start Word Shoot
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (gameState.gameStatus === 'complete') {
    const accuracy = Math.round((gameState.correctAnswers / gameState.questionsAnswered) * 100)
    
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-800">
            <Trophy className="h-6 w-6" />
            Shooting Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4 text-center">
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{gameState.score}</div>
              <div className="text-sm text-green-600">Final Score</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{gameState.correctAnswers}/{gameState.questionsAnswered}</div>
              <div className="text-sm text-green-600">Hits</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{accuracy}%</div>
              <div className="text-sm text-green-600">Accuracy</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{gameState.lives}</div>
              <div className="text-sm text-green-600">Lives Left</div>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <Button onClick={resetGame} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Game Header */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Badge variant="outline" className="text-xs sm:text-sm">
                {gameState.questionsAnswered + 1} of {Math.min(gameLength, gameTerms.length)}
              </Badge>
              <Badge variant="outline" className="capitalize text-xs sm:text-sm">
                {difficulty} • {gameState.score} pts
              </Badge>
              {gameState.streak > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm">
                  🔥 {gameState.streak}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {Array.from({ length: gameState.lives }).map((_, i) => (
                <Heart key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 fill-current" />
              ))}
            </div>
          </div>
          
          <Progress value={getProgressPercentage()} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Definition */}
      <Card>
        <CardHeader className="text-center pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base md:text-lg">Find the term that matches:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-3 sm:p-4 md:p-6 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm sm:text-base md:text-xl text-blue-900 font-medium break-words">
              {gameState.currentDefinition}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Game Area */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <div 
            ref={gameAreaRef}
            className="relative bg-gradient-to-b from-sky-100 to-sky-200 overflow-hidden cursor-crosshair"
            style={{ height: '600px', minHeight: '600px' }}
          >
            {/* Floating Bubbles */}
            {bubbles.map((bubble, index) => (
              <div
                key={bubble.id}
                className={`
                  absolute cursor-pointer transition-all duration-300
                  ${bubble.isPopped ? 'bubble-pop' : 'bubble-float-down'}
                  hover:scale-110 hover:z-10
                `}
                style={{
                  left: `${bubble.x}px`,
                  top: `${bubble.y}px`,
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  animationDuration: `${12 / config.bubbleSpeed}s`,
                  animationDelay: `${index * 0.5}s`,
                  zIndex: bubble.isCorrect ? 10 : 5
                }}
                onClick={() => popBubble(bubble)}
              >
                <div className={`
                  w-full h-full rounded-full flex items-center justify-center text-center p-3
                  transition-all duration-500 shadow-lg border-4 relative
                  ${bubble.isPopped 
                    ? bubble.isCorrect 
                      ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-600 border-green-300 text-white shadow-green-400 scale-110' 
                      : 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 border-red-300 text-white shadow-red-400 scale-110'
                    : 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 border-gray-300 text-gray-800 shadow-gray-300'
                  }
                  hover:shadow-xl hover:scale-105 hover:border-white/50
                `}>
                  <span className="text-sm font-bold leading-tight drop-shadow-sm">
                    {bubble.term.term}
                  </span>
                  
                  {/* Bubble shine effect */}
                  <div className="absolute top-2 left-2 w-4 h-4 bg-white/60 rounded-full blur-sm"></div>
                  <div className="absolute top-3 left-3 w-2 h-2 bg-white/80 rounded-full"></div>
                  
                  {/* Feedback icons - only show when popped */}
                  {bubble.isPopped && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
                      {bubble.isCorrect ? (
                        <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-red-500 rounded-full flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Game Instructions Overlay */}
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 text-center border-2 border-blue-200">
                <p className="text-sm text-gray-700 font-medium">
                  🎯 Click bubbles to reveal if they&apos;re correct!
                </p>
                <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Neutral Bubble</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-green-700 font-medium">Correct</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-600" />
                    <span className="text-red-700 font-medium">Wrong</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Success Feedback */}
            {gameState.gameStatus === 'question-complete' && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                <div className="bg-green-500 text-white p-6 rounded-xl shadow-2xl text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Correct!</h3>
                  <p className="text-green-100">+{difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30} points</p>
                </div>
              </div>
            )}

            {/* Wrong Answer Pause with Definition Reminder */}
            {gameState.gameStatus === 'wrong-answer-pause' && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-4 border-4 border-red-400">
                  <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                  <h3 className="text-2xl font-bold text-red-600 mb-4">Incorrect!</h3>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                    <p className="text-sm text-red-800 font-medium mb-2">Remember the definition:</p>
                    <p className="text-red-900 font-semibold">
                      &quot;{gameState.currentDefinition}&quot;
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                    <p className="text-sm text-green-800 font-medium mb-2">The correct answer is:</p>
                    <p className="text-xl text-green-900 font-bold">
                      {gameState.currentCorrectTerm?.term}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-4 text-red-600">
                    <Heart className="h-5 w-5 fill-current" />
                    <span className="font-medium">Lives remaining: {gameState.lives}</span>
                  </div>
                  
                  <Button 
                    onClick={continueAfterWrongAnswer}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={gameState.lives <= 0}
                  >
                    {gameState.lives <= 0 ? 'Game Over' : 'Continue Playing'}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
