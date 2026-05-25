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
  Users,
  CheckCircle,
  Clock,
  Flame,
  Crown
} from 'lucide-react'
import VocabularyMatchingGame from './VocabularyMatchingGame'
import { sfx } from '@/lib/arcade-sound'
import SoundToggle from '@/components/vocabulary/arcade/SoundToggle'

interface VocabularyMatchingGameWrapperProps {
  vocabularyTerms: VocabularyTerm[]
  onGameComplete?: (score: number, totalMatches: number, timeSpent: number) => void
  difficulty?: 'easy' | 'medium' | 'hard'
  maxMatches?: number
}

interface GameState {
  gameStatus: 'waiting' | 'playing' | 'complete'
  score: number
  startTime: number
  completedMatches: number
  totalMatches: number
}

export default function VocabularyMatchingGameWrapper({
  vocabularyTerms,
  onGameComplete,
  difficulty = 'medium',
  maxMatches = 8
}: VocabularyMatchingGameWrapperProps) {
  const [gameState, setGameState] = useState<GameState>({
    gameStatus: 'waiting',
    score: 0,
    startTime: 0,
    completedMatches: 0,
    totalMatches: 0
  })
  
  const [gameTerms, setGameTerms] = useState<VocabularyTerm[]>([])
  const [currentMatches, setCurrentMatches] = useState<Record<string, string>>({})
  const [elapsed, setElapsed] = useState(0)
  const [streak, setStreak] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [shake, setShake] = useState(false)
  const [best, setBest] = useState(0)

  const multiplier = Math.min(1 + Math.floor(streak / 3), 5)
  const streakRef = useRef(0)

  useEffect(() => {
    fetch('/api/student-progress/game-scores?game_type=matching')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { score?: number }[]) => setBest(Array.isArray(rows) ? rows.reduce((m, x) => Math.max(m, x.score ?? 0), 0) : 0))
      .catch(() => {})
  }, [])

  // live count-up timer
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - gameState.startTime) / 1000)), 500)
    return () => clearInterval(iv)
  }, [gameState.gameStatus, gameState.startTime])

  const onMatchAttempt = useCallback((correct: boolean) => {
    if (correct) {
      streakRef.current += 1
      sfx.correct()
      if (streakRef.current >= 3) sfx.streak(streakRef.current)
      setStreak(streakRef.current)
    } else {
      streakRef.current = 0
      sfx.wrong()
      setStreak(0)
      setMistakes((m) => m + 1)
      setShake(true); setTimeout(() => setShake(false), 450)
    }
  }, [])

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
      
      console.log('Matching Game Debug:', {
        totalTerms: vocabularyTerms.length,
        difficulty,
        filteredTerms: filteredTerms.length,
        requestedMatches: maxMatches
      })
      
      // Shuffle and select terms for the game
      const shuffled = [...filteredTerms].sort(() => Math.random() - 0.5)
      const gameTerms = shuffled.slice(0, Math.min(maxMatches, shuffled.length))
      
      console.log('Matching Game Terms:', gameTerms.length)
      setGameTerms(gameTerms)
      setGameState(prev => ({
        ...prev,
        totalMatches: gameTerms.length
      }))
    }
  }, [vocabularyTerms, difficulty, maxMatches])

  const startGame = useCallback(() => {
    if (gameTerms.length === 0) return
    sfx.start()
    streakRef.current = 0
    setStreak(0); setMistakes(0); setElapsed(0)
    setGameState({
      gameStatus: 'playing',
      score: 0,
      startTime: Date.now(),
      completedMatches: 0,
      totalMatches: gameTerms.length
    })
    setCurrentMatches({})
  }, [gameTerms])

  const handleMatchingAnswer = useCallback((answer: { matches: Record<string, string> }) => {
    const matches = answer.matches || {}
    const completedMatches = Object.keys(matches).length
    
    setCurrentMatches(matches)
    setGameState(prev => ({
      ...prev,
      completedMatches
    }))

    // Check if game is complete
    if (completedMatches === gameTerms.length) {
      const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000)
      const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
      // Race the clock + accuracy: base per match, speed bonus vs a target pace,
      // minus a penalty per wrong attempt (never below 40% of base).
      const targetSecs = completedMatches * 6
      const speedBonus = Math.max(0, Math.round((targetSecs - timeSpent) * 3))
      const floor = Math.round(completedMatches * basePoints * 0.4)
      const totalScore = Math.max(floor, completedMatches * basePoints + speedBonus - mistakes * 5)

      sfx.gameover()
      setGameState(prev => ({ ...prev, gameStatus: 'complete', score: totalScore }))

      setTimeout(() => {
        onGameComplete?.(totalScore, completedMatches, timeSpent)
      }, 900)
    }
  }, [gameTerms.length, gameState.startTime, difficulty, mistakes, onGameComplete])

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'waiting'
    }))
    setCurrentMatches({})
  }, [])

  const getProgressPercentage = () => {
    if (gameState.totalMatches === 0) return 0
    return (gameState.completedMatches / gameState.totalMatches) * 100
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
            <Users className="h-6 w-6 text-blue-600" />
            Matching Game Ready
          </CardTitle>
          <CardDescription>
            Match {gameState.totalMatches} physics terms with their definitions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{gameState.totalMatches}</div>
              <div className="text-sm text-blue-600">Matches</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30}
              </div>
              <div className="text-sm text-green-600">Points Each</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {gameState.totalMatches * (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30)}
              </div>
              <div className="text-sm text-purple-600">Max Score</div>
            </div>
          </div>
          
          <div className="text-center">
            <Button onClick={startGame} size="lg">
              <Users className="h-4 w-4 mr-2" />
              Start Matching Game
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (gameState.gameStatus === 'complete') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-800">
            <Trophy className="h-6 w-6" />
            Perfect Match!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{gameState.score}</div>
              <div className="text-sm text-green-600">Final Score</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">{gameState.completedMatches}/{gameState.totalMatches}</div>
              <div className="text-sm text-green-600">Matches</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-700">100%</div>
              <div className="text-sm text-green-600">Accuracy</div>
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

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className={`space-y-6 ${shake ? 'arcade-shake' : ''}`}>
      <style>{`@keyframes arcadeShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}.arcade-shake{animation:arcadeShake .45s}`}</style>
      {/* Game Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline">{gameState.completedMatches} / {gameState.totalMatches}</Badge>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'color-mix(in oklch, var(--reward) 20%, transparent)', color: 'var(--reward)', transform: `scale(${Math.min(1 + streak * 0.04, 1.3)})` }}>
                  <Flame className="h-3.5 w-3.5" /> ×{multiplier}
                </span>
              )}
              {best > 0 && (
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <Crown className="h-3.5 w-3.5" /> best {best.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-mono text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                <Clock className="h-4 w-4" /> {mm}:{ss}
              </span>
              <SoundToggle />
            </div>
          </div>

          <Progress value={getProgressPercentage()} className="h-2" />
        </CardContent>
      </Card>

      {/* Matching Game */}
      <VocabularyMatchingGame
        question={{
          id: 'matching-game',
          type: 'vocabulary-matching',
          question: 'Match the physics terms with their definitions.',
          points: gameTerms.length * 2,
          vocabularyTerms: gameTerms
        }}
        onAnswer={handleMatchingAnswer}
        onMatchAttempt={onMatchAttempt}
        showResults={false}
        disabled={false}
        initialAnswer={{ matches: currentMatches }}
      />
    </div>
  )
}
