"use client"
import { useState, useEffect, useCallback } from 'react'
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
  Eye
} from 'lucide-react'

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
        const efficiencyBonus = Math.max(0, (gameState.totalPairs * 2 - gameState.moves - 1) * 5)
        const totalScore = (newMatches * basePoints) + efficiencyBonus
        
        setGameState(prev => ({
          ...prev,
          gameStatus: 'complete',
          score: totalScore
        }))
        
        setTimeout(() => {
          onGameComplete?.(totalScore, newMatches, timeSpent)
        }, 1500)
      }
    } else {
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
            <Button onClick={startGame} size="lg" className="bg-purple-600 hover:bg-purple-700">
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

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Badge variant="outline" className="text-xs sm:text-sm">
                {gameState.matches}/{gameState.totalPairs} pairs
              </Badge>
              <Badge variant="outline" className="capitalize text-xs sm:text-sm">
                {difficulty} • {gameState.moves} moves
              </Badge>
              <Badge variant="outline" className="text-xs sm:text-sm">
                {gameState.score} pts
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Eye className={`h-4 w-4 ${gameState.selectedCards.length > 0 ? 'text-blue-600' : 'text-muted-foreground'}`} />
              <span className="text-xs sm:text-sm font-medium">
                {gameState.selectedCards.length}/2 selected
              </span>
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

