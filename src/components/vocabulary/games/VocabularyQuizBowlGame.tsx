"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { VocabularyTerm } from '@/types/assignment'
import { 
  Clock, 
  Trophy, 
  RotateCcw, 
  CheckCircle, 
  XCircle,
  Zap,
  Target,
  Timer
} from 'lucide-react'

interface VocabularyQuizBowlGameProps {
  vocabularyTerms: VocabularyTerm[]
  onGameComplete?: (score: number, totalQuestions: number, timeSpent: number) => void
  difficulty?: 'easy' | 'medium' | 'hard'
  timeLimit?: number // seconds per question
  totalQuestions?: number
}

interface QuizState {
  currentTerm: VocabularyTerm | null
  currentAnswer: string
  score: number
  questionsAnswered: number
  correctAnswers: number
  gameStatus: 'waiting' | 'playing' | 'complete'
  startTime: number
  timeRemaining: number
  streak: number
  maxStreak: number
}

interface QuestionResult {
  term: VocabularyTerm
  userAnswer: string
  isCorrect: boolean
  timeUsed: number
}

export default function VocabularyQuizBowlGame({
  vocabularyTerms,
  onGameComplete,
  difficulty = 'medium',
  timeLimit = 10,
  totalQuestions = 20
}: VocabularyQuizBowlGameProps) {
  const [quizState, setQuizState] = useState<QuizState>({
    currentTerm: null,
    currentAnswer: '',
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    gameStatus: 'waiting',
    startTime: 0,
    timeRemaining: timeLimit,
    streak: 0,
    maxStreak: 0
  })
  
  const [gameTerms, setGameTerms] = useState<VocabularyTerm[]>([])
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [showResult, setShowResult] = useState<boolean>(false)
  const [lastResult, setLastResult] = useState<QuestionResult | null>(null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize game terms
  useEffect(() => {
    if (vocabularyTerms.length > 0) {
      // Filter by difficulty if specified
      let filteredTerms = vocabularyTerms
      
      // Only filter if difficulty is not medium, and include terms without difficulty
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
      
      console.log('Quiz Bowl Debug:', {
        totalTerms: vocabularyTerms.length,
        difficulty,
        filteredTerms: filteredTerms.length,
        requestedQuestions: totalQuestions
      })
      
      // Shuffle and select terms for the game
      const shuffled = [...filteredTerms].sort(() => Math.random() - 0.5)
      const gameTerms = shuffled.slice(0, Math.min(totalQuestions, shuffled.length))
      
      console.log('Quiz Bowl Game Terms:', gameTerms.length)
      setGameTerms(gameTerms)
    }
  }, [vocabularyTerms, difficulty, totalQuestions])

  // Timer effect
  useEffect(() => {
    if (quizState.gameStatus === 'playing' && quizState.timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setQuizState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }))
      }, 1000)
    } else if (quizState.gameStatus === 'playing' && quizState.timeRemaining === 0) {
      // Time's up - treat as wrong answer
      handleAnswer(false)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [quizState.gameStatus, quizState.timeRemaining])

  // Focus input when new question starts
  useEffect(() => {
    if (quizState.gameStatus === 'playing' && !showResult) {
      inputRef.current?.focus()
    }
  }, [quizState.currentTerm, showResult, quizState.gameStatus])

  const startGame = useCallback(() => {
    if (gameTerms.length === 0) return
    
    setQuizState({
      currentTerm: gameTerms[0],
      currentAnswer: '',
      score: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      gameStatus: 'playing',
      startTime: Date.now(),
      timeRemaining: timeLimit,
      streak: 0,
      maxStreak: 0
    })
    setQuestionResults([])
    setShowResult(false)
    setLastResult(null)
  }, [gameTerms, timeLimit])

  const handleAnswer = useCallback((isCorrect?: boolean) => {
    if (!quizState.currentTerm || quizState.gameStatus !== 'playing') return

    const timeUsed = timeLimit - quizState.timeRemaining
    const userAnswer = quizState.currentAnswer.trim()
    
    // Check if answer is correct (if not provided)
    let correct = isCorrect
    if (correct === undefined) {
      correct = userAnswer.toLowerCase() === quizState.currentTerm.term.toLowerCase()
    }

    // Calculate points
    const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    const timeBonus = Math.max(0, Math.floor((timeLimit - timeUsed) / 2)) // Bonus for speed
    const streakBonus = quizState.streak >= 3 ? 5 : 0
    const points = correct ? basePoints + timeBonus + streakBonus : 0

    // Create result record
    const result: QuestionResult = {
      term: quizState.currentTerm,
      userAnswer,
      isCorrect: correct,
      timeUsed
    }

    setLastResult(result)
    setQuestionResults(prev => [...prev, result])
    setShowResult(true)

    // Update quiz state
    setQuizState(prev => {
      const newStreak = correct ? prev.streak + 1 : 0
      const newQuestionsAnswered = prev.questionsAnswered + 1
      const newCorrectAnswers = prev.correctAnswers + (correct ? 1 : 0)
      const isGameComplete = newQuestionsAnswered >= Math.min(totalQuestions, gameTerms.length)

      return {
        ...prev,
        score: prev.score + points,
        questionsAnswered: newQuestionsAnswered,
        correctAnswers: newCorrectAnswers,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        gameStatus: isGameComplete ? 'complete' : 'playing'
      }
    })

    // Auto-advance to next question after showing result
    setTimeout(() => {
      setShowResult(false)
      
      const nextIndex = quizState.questionsAnswered + 1
      if (nextIndex < Math.min(totalQuestions, gameTerms.length)) {
        setQuizState(prev => ({
          ...prev,
          currentTerm: gameTerms[nextIndex],
          currentAnswer: '',
          timeRemaining: timeLimit
        }))
      } else {
        // Game complete
        const totalTime = Math.floor((Date.now() - quizState.startTime) / 1000)
        onGameComplete?.(quizState.score + points, Math.min(totalQuestions, gameTerms.length), totalTime)
      }
    }, 1500)
  }, [quizState, difficulty, timeLimit, totalQuestions, gameTerms, onGameComplete])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (quizState.currentAnswer.trim()) {
      handleAnswer()
    }
  }, [quizState.currentAnswer, handleAnswer])

  const handleSkip = useCallback(() => {
    handleAnswer(false)
  }, [handleAnswer])

  const resetGame = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      gameStatus: 'waiting'
    }))
    setQuestionResults([])
    setShowResult(false)
    setLastResult(null)
  }, [])

  const getProgressPercentage = () => {
    return (quizState.questionsAnswered / Math.min(totalQuestions, gameTerms.length)) * 100
  }

  const getTimeColor = () => {
    const percentage = (quizState.timeRemaining / timeLimit) * 100
    if (percentage > 50) return 'text-green-600'
    if (percentage > 25) return 'text-yellow-600'
    return 'text-red-600'
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

  if (quizState.gameStatus === 'waiting') {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 text-yellow-600" />
            Quiz Bowl Ready
          </CardTitle>
          <CardDescription>
            Fast-paced vocabulary quiz with {Math.min(totalQuestions, gameTerms.length)} questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{Math.min(totalQuestions, gameTerms.length)}</div>
              <div className="text-sm text-blue-600">Questions</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{timeLimit}s</div>
              <div className="text-sm text-green-600">Per Question</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30}</div>
              <div className="text-sm text-purple-600">Base Points</div>
            </div>
          </div>
          
          <div className="text-center">
            <Button onClick={startGame} size="lg" className="bg-yellow-600 hover:bg-yellow-700">
              <Zap className="h-4 w-4 mr-2" />
              Start Quiz Bowl
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quizState.gameStatus === 'complete') {
    const accuracy = Math.round((quizState.correctAnswers / quizState.questionsAnswered) * 100)
    const totalTime = Math.floor((Date.now() - quizState.startTime) / 1000)
    
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-800">
            <Trophy className="h-6 w-6" />
            Quiz Bowl Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4 text-center">
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{quizState.score}</div>
              <div className="text-sm text-green-600">Final Score</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{quizState.correctAnswers}/{quizState.questionsAnswered}</div>
              <div className="text-sm text-green-600">Correct</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{accuracy}%</div>
              <div className="text-sm text-green-600">Accuracy</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{quizState.maxStreak}</div>
              <div className="text-sm text-green-600">Best Streak</div>
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
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Question {quizState.questionsAnswered + 1} of {Math.min(totalQuestions, gameTerms.length)}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {difficulty} • {quizState.score} points
              </Badge>
              {quizState.streak > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  🔥 {quizState.streak} streak
                </Badge>
              )}
            </div>
            <div className={`flex items-center gap-2 font-mono text-lg font-bold ${getTimeColor()}`}>
              <Timer className="h-4 w-4" />
              {quizState.timeRemaining}s
            </div>
          </div>
          
          <Progress value={getProgressPercentage()} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="relative">
        {showResult && lastResult && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center rounded-lg ${
            lastResult.isCorrect ? 'bg-green-500/90' : 'bg-red-500/90'
          }`}>
            <div className="text-center text-white">
              <div className="flex items-center justify-center gap-2 mb-2">
                {lastResult.isCorrect ? (
                  <CheckCircle className="h-8 w-8" />
                ) : (
                  <XCircle className="h-8 w-8" />
                )}
                <span className="text-2xl font-bold">
                  {lastResult.isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              {!lastResult.isCorrect && (
                <p className="text-lg">
                  Answer: <strong>{lastResult.term.term}</strong>
                </p>
              )}
            </div>
          </div>
        )}
        
        <CardHeader>
          <CardTitle className="text-center text-xl">
            What physics term is defined as:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-lg text-blue-900 font-medium">
              {quizState.currentTerm?.definition}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={quizState.currentAnswer}
                onChange={(e) => setQuizState(prev => ({ ...prev, currentAnswer: e.target.value }))}
                placeholder="Type your answer..."
                className="text-lg"
                disabled={showResult}
              />
              <Button type="submit" disabled={!quizState.currentAnswer.trim() || showResult}>
                <Target className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
            
            <div className="text-center">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSkip}
                disabled={showResult}
              >
                Skip Question
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
