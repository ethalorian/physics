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
  Brain,
  CheckCircle,
  Clock,
  Flame,
  Crown
} from 'lucide-react'
import { sfx } from '@/lib/arcade-sound'
import SoundToggle from '@/components/vocabulary/arcade/SoundToggle'

interface VocabularyConcentrationGameProps {
  vocabularyTerms: VocabularyTerm[]
  onGameComplete?: (score: number, totalPairs: number, timeSpent: number) => void
  difficulty?: 'easy' | 'medium' | 'hard'
  numberOfPairs?: number
}

interface GameCard {
  id: string
  termId: string
  content: string
  type: 'term' | 'definition'
  isFlipped: boolean
  isMatched: boolean
  position: number
}

interface GameState {
  gameStatus: 'waiting' | 'playing' | 'complete'
  score: number
  startTime: number
  moves: number
  matches: number
  totalPairs: number
  selectedCards: GameCard[]
  isProcessing: boolean
}

export default function VocabularyConcentrationGame({
  vocabularyTerms,
  onGameComplete,
  difficulty = 'medium',
  numberOfPairs = 6
}: VocabularyConcentrationGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    gameStatus: 'waiting',
    score: 0,
    startTime: 0,
    moves: 0,
    matches: 0,
    totalPairs: 0,
    selectedCards: [],
    isProcessing: false
  })
  
  const [gameCards, setGameCards] = useState<GameCard[]>([])
  const [gameTerms, setGameTerms] = useState<VocabularyTerm[]>([])
  const [streak, setStreak] = useState(0)
  const [shake, setShake] = useState(false)
  const [best, setBest] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const streakRef = useRef(0)

  const multiplier = Math.min(1 + Math.floor(streak / 3), 5)

  useEffect(() => {
    fetch('/api/student-progress/game-scores?game_type=concentration')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { score?: number }[]) => setBest(Array.isArray(rows) ? rows.reduce((m, x) => Math.max(m, x.score ?? 0), 0) : 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - gameState.startTime) / 1000)), 500)
    return () => clearInterval(iv)
  }, [gameState.gameStatus, gameState.startTime])

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
      
      // Shuffle and select terms for the game
      const shuffled = [...filteredTerms].sort(() => Math.random() - 0.5)
      const selectedTerms = shuffled.slice(0, Math.min(numberOfPairs, shuffled.length))
      
      setGameTerms(selectedTerms)
      setGameState(prev => ({
        ...prev,
        totalPairs: selectedTerms.length
      }))
    }
  }, [vocabularyTerms, difficulty, numberOfPairs])

  // Create and shuffle cards when game terms change
  useEffect(() => {
    if (gameTerms.length > 0) {
      const cards: GameCard[] = []
      
      // Create pairs of cards (term + definition)
      gameTerms.forEach((term, index) => {
        // Term card
        cards.push({
          id: `term-${term.id}`,
          termId: term.id,
          content: term.term,
          type: 'term',
          isFlipped: false,
          isMatched: false,
          position: index * 2
        })
        
        // Definition card
        cards.push({
          id: `def-${term.id}`,
          termId: term.id,
          content: term.definition || '',
          type: 'definition',
          isFlipped: false,
          isMatched: false,
          position: index * 2 + 1
        })
      })
      
      // Shuffle the cards
      const shuffledCards = cards.sort(() => Math.random() - 0.5)
      
      // Assign new positions after shuffling
      shuffledCards.forEach((card, index) => {
        card.position = index
      })
      
      setGameCards(shuffledCards)
    }
  }, [gameTerms])

  const startGame = useCallback(() => {
    if (gameTerms.length === 0) return
    sfx.start()
    streakRef.current = 0
    setStreak(0); setElapsed(0)
    setGameState(prev => ({
      ...prev,
      gameStatus: 'playing',
      startTime: Date.now(),
      score: 0,
      moves: 0,
      matches: 0,
      selectedCards: [],
      isProcessing: false
    }))
    
    // Reset all cards
    setGameCards(prev => prev.map(card => ({
      ...card,
      isFlipped: false,
      isMatched: false
    })))
  }, [gameTerms])

  const handleCardClick = useCallback((clickedCard: GameCard) => {
    if (gameState.gameStatus !== 'playing' || 
        gameState.isProcessing || 
        clickedCard.isFlipped || 
        clickedCard.isMatched ||
        gameState.selectedCards.length >= 2) {
      return
    }

    // Flip the clicked card
    sfx.tick()
    setGameCards(prev => prev.map(card =>
      card.id === clickedCard.id
        ? { ...card, isFlipped: true }
        : card
    ))

    const newSelectedCards = [...gameState.selectedCards, clickedCard]
    
    setGameState(prev => ({
      ...prev,
      selectedCards: newSelectedCards
    }))

    // If this is the second card, check for match
    if (newSelectedCards.length === 2) {
      setGameState(prev => ({ ...prev, isProcessing: true }))
      
      setTimeout(() => {
        checkForMatch(newSelectedCards)
      }, 1000) // Show cards for 1 second before checking
    }
  }, [gameState])

  const checkForMatch = useCallback((selectedCards: GameCard[]) => {
    const [card1, card2] = selectedCards
    const isMatch = card1.termId === card2.termId && card1.type !== card2.type
    
    setGameState(prev => ({
      ...prev,
      moves: prev.moves + 1,
      matches: isMatch ? prev.matches + 1 : prev.matches,
      selectedCards: [],
      isProcessing: false
    }))

    if (isMatch) {
      // juice: match chime + escalating combo
      streakRef.current += 1
      sfx.correct()
      if (streakRef.current >= 3) sfx.streak(streakRef.current)
      setStreak(streakRef.current)
      // Mark cards as matched
      setGameCards(prev => prev.map(card =>
        (card.id === card1.id || card.id === card2.id)
          ? { ...card, isMatched: true }
          : card
      ))

      // Check if game is complete
      const newMatches = gameState.matches + 1
      if (newMatches === gameState.totalPairs) {
        const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000)
        const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
        // Reward fewest moves AND speed.
        const efficiencyBonus = Math.max(0, (gameState.totalPairs * 2 - gameState.moves - 1) * 5)
        const targetSecs = gameState.totalPairs * 8
        const speedBonus = Math.max(0, Math.round((targetSecs - timeSpent) * 2))
        const totalScore = (newMatches * basePoints) + efficiencyBonus + speedBonus

        sfx.gameover()
        setGameState(prev => ({
          ...prev,
          gameStatus: 'complete',
          score: totalScore
        }))

        setTimeout(() => {
          onGameComplete?.(totalScore, newMatches, timeSpent)
        }, 900)
      }
    } else {
      // juice: mismatch buzz + reset combo + shake
      streakRef.current = 0
      setStreak(0)
      sfx.wrong()
      setShake(true); setTimeout(() => setShake(false), 450)
      // Flip cards back over
      setTimeout(() => {
        setGameCards(prev => prev.map(card => 
          (card.id === card1.id || card.id === card2.id)
            ? { ...card, isFlipped: false }
            : card
        ))
      }, 500)
    }
  }, [gameState, difficulty, onGameComplete])

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'waiting'
    }))
  }, [])

  const getProgressPercentage = () => {
    if (gameState.totalPairs === 0) return 0
    return (gameState.matches / gameState.totalPairs) * 100
  }

  const getGridColumns = () => {
    const totalCards = gameState.totalPairs * 2
    if (totalCards <= 8) return 'grid-cols-4'
    if (totalCards <= 12) return 'grid-cols-4 md:grid-cols-6'
    if (totalCards <= 16) return 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
    return 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8'
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
            <Brain className="h-6 w-6 text-purple-600" />
            Concentration Ready
          </CardTitle>
          <CardDescription>
            Memory game with {gameState.totalPairs} physics term pairs ({gameState.totalPairs * 2} cards)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{gameState.totalPairs}</div>
              <div className="text-sm text-purple-600">Pairs to Match</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{gameState.totalPairs * 2}</div>
              <div className="text-sm text-blue-600">Total Cards</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30}
              </div>
              <div className="text-sm text-green-600">Points per Pair</div>
            </div>
          </div>
          
          <div className="text-center">
            <Button onClick={startGame} size="lg">
              <Brain className="h-4 w-4 mr-2" />
              Start Concentration
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (gameState.gameStatus === 'complete') {
    const accuracy = Math.round((gameState.matches / gameState.moves) * 100)
    
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-800">
            <Trophy className="h-6 w-6" />
            Perfect Memory!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 text-center">
            <div className="p-3 sm:p-4 bg-white rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-green-700">{gameState.score}</div>
              <div className="text-xs sm:text-sm text-green-600">Final Score</div>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-green-700">{gameState.matches}/{gameState.totalPairs}</div>
              <div className="text-xs sm:text-sm text-green-600">Pairs Found</div>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-green-700">{gameState.moves}</div>
              <div className="text-xs sm:text-sm text-green-600">Total Moves</div>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-green-700">{accuracy}%</div>
              <div className="text-xs sm:text-sm text-green-600">Efficiency</div>
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
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="text-xs sm:text-sm">{gameState.matches}/{gameState.totalPairs} pairs</Badge>
              <Badge variant="outline" className="text-xs sm:text-sm">{gameState.moves} moves</Badge>
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

      {/* Game Grid */}
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className={`grid gap-2 sm:gap-3 ${getGridColumns()}`}>
            {gameCards.map((card) => (
              <div
                key={card.id}
                className={`
                  relative aspect-square cursor-pointer transition-all duration-300 transform hover:scale-105
                  ${gameState.isProcessing ? 'pointer-events-none' : ''}
                `}
                onClick={() => handleCardClick(card)}
              >
                <div className={`
                  w-full h-full rounded-lg border-2 transition-all duration-500 transform-style-preserve-3d
                  ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}
                  ${card.isMatched ? 'border-green-500 bg-green-100' : 'border-gray-300'}
                `}>
                  {/* Card Back */}
                  <div className={`
                    absolute inset-0 w-full h-full rounded-lg backface-hidden
                    ${card.isMatched ? 'bg-green-50' : 'bg-gradient-to-br from-purple-400 to-blue-500'}
                    flex items-center justify-center
                  `}>
                    <Brain className={`h-8 w-8 ${card.isMatched ? 'text-green-600' : 'text-white'}`} />
                  </div>
                  
                  {/* Card Front */}
                  <div className={`
                    absolute inset-0 w-full h-full rounded-lg backface-hidden rotate-y-180
                    ${card.isMatched ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
                    border-2 p-2 flex items-center justify-center text-center
                  `}>
                    <div className="w-full">
                      <div className={`text-xs font-medium mb-1 ${card.isMatched ? 'text-green-600' : 'text-purple-600'}`}>
                        {card.type === 'term' ? 'TERM' : 'DEFINITION'}
                      </div>
                      <div className={`text-sm font-medium leading-tight ${card.isMatched ? 'text-green-800' : 'text-gray-800'}`}>
                        {card.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

