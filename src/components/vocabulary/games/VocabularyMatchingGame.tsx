"use client"
import { useState, useEffect, useRef } from 'react'
import { VocabularyMatchingQuestion } from '@/types/assignment'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RotateCcw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VocabularyMatchingGameProps {
  question: VocabularyMatchingQuestion
  onAnswer?: (answer: { matches: Record<string, string> }) => void
  showResults?: boolean
  initialAnswer?: { matches: Record<string, string> }
  disabled?: boolean
}

interface SelectedCard {
  id: string // The actual vocabulary term ID
  cardId: string // The full card ID with prefix (term-xxx or def-xxx)
  type: 'term' | 'definition'
}

interface CardState {
  id: string
  status: 'unselected' | 'selected' | 'correct' | 'incorrect' | 'flashing' | 'flashing-success'
}

export default function VocabularyMatchingGame({ 
  question, 
  onAnswer, 
  showResults = false, 
  initialAnswer,
  disabled = false 
}: VocabularyMatchingGameProps) {
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [matches, setMatches] = useState<Record<string, string>>(initialAnswer?.matches || {})
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({})
  const [shuffledTerms, setShuffledTerms] = useState(question.vocabularyTerms || [])
  const [shuffledDefinitions, setShuffledDefinitions] = useState(question.vocabularyTerms || [])
  const [isProcessingMatch, setIsProcessingMatch] = useState(false)
  const lastMatchesRef = useRef<string>('')

  // Initialize card states
  useEffect(() => {
    const terms = question.vocabularyTerms || []
    const initialStates: Record<string, CardState> = {}
    
    terms.forEach(term => {
      initialStates[`term-${term.id}`] = { id: `term-${term.id}`, status: 'unselected' }
      initialStates[`def-${term.id}`] = { id: `def-${term.id}`, status: 'unselected' }
    })
    
    setCardStates(initialStates)
  }, [question.vocabularyTerms])

  // Shuffle terms and definitions on mount
  useEffect(() => {
    const shuffleArray = <T,>(array: T[]): T[] => {
      const newArray = [...array]
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
      }
      return newArray
    }

    const terms = question.vocabularyTerms || []
    setShuffledTerms(shuffleArray(terms))
    setShuffledDefinitions(shuffleArray(terms))
  }, [question.vocabularyTerms])

  // Update card states based on matches for results display
  useEffect(() => {
    if (showResults && matches) {
      const newCardStates = { ...cardStates }
      Object.entries(matches).forEach(([termId, definitionId]) => {
        const isCorrect = termId === definitionId
        newCardStates[`term-${termId}`] = { 
          id: `term-${termId}`, 
          status: isCorrect ? 'correct' : 'incorrect' 
        }
        newCardStates[`def-${definitionId}`] = { 
          id: `def-${definitionId}`, 
          status: isCorrect ? 'correct' : 'incorrect' 
        }
      })
      setCardStates(newCardStates)
    }
  }, [showResults, matches, cardStates])

  // Call onAnswer when matches change
  useEffect(() => {
    const matchesString = JSON.stringify(matches)
    if (onAnswer && matchesString !== lastMatchesRef.current) {
      lastMatchesRef.current = matchesString
      setTimeout(() => {
        onAnswer({ matches })
      }, 0)
    }
  }, [matches, onAnswer])

  const updateCardState = (cardId: string, status: CardState['status']) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], status }
    }))
  }

  const processMatch = async (termId: string, definitionId: string) => {
    setIsProcessingMatch(true)
    
    const termCardId = `term-${termId}`
    const defCardId = `def-${definitionId}`
    
    // A correct match is when the term ID matches the definition ID (same vocabulary item)
    const isCorrectMatch = termId === definitionId

    if (isCorrectMatch) {
      // Correct match - flash green first, then stay in correct state
      updateCardState(termCardId, 'flashing-success')
      updateCardState(defCardId, 'flashing-success')
      
      // After 600ms, change to permanent correct state
      setTimeout(() => {
        updateCardState(termCardId, 'correct')
        updateCardState(defCardId, 'correct')
        
        // Add to matches
        setMatches(prev => ({ ...prev, [termId]: definitionId }))
      }, 600)
    } else {
      // Incorrect match - flash red then return to unselected
      updateCardState(termCardId, 'flashing')
      updateCardState(defCardId, 'flashing')
      
      // After 800ms, return to unselected
      setTimeout(() => {
        updateCardState(termCardId, 'unselected')
        updateCardState(defCardId, 'unselected')
      }, 800)
    }
    
    // Clear selected cards
    setSelectedCards([])
    
    // Re-enable card selection
    setTimeout(() => {
      setIsProcessingMatch(false)
    }, isCorrectMatch ? 600 : 800)
  }

  const handleCardClick = (cardId: string, cardType: 'term' | 'definition') => {
    if (disabled || isProcessingMatch) return
    
    const cardState = cardStates[cardId]
    if (cardState?.status === 'correct') return // Can't select already matched cards
    
    // Extract the actual term/definition ID from the card ID
    const actualId = cardId.replace('term-', '').replace('def-', '')
    
    // If this exact card is already selected, deselect it
    if (selectedCards.some(card => card.cardId === cardId)) {
      setSelectedCards(prev => prev.filter(card => card.cardId !== cardId))
      updateCardState(cardId, 'unselected')
      return
    }
    
    // If we already have 2 cards selected, ignore this click
    if (selectedCards.length >= 2) return
    
    // Add this card to selection
    const newSelectedCards = [...selectedCards, { id: actualId, cardId: cardId, type: cardType }]
    setSelectedCards(newSelectedCards)
    updateCardState(cardId, 'selected')
    
    // If we now have 2 cards, check for match
    if (newSelectedCards.length === 2) {
      const [first, second] = newSelectedCards
      
      // Ensure we have one term and one definition
      if (first.type !== second.type) {
        const termCard = first.type === 'term' ? first : second
        const defCard = first.type === 'definition' ? first : second
        
        processMatch(termCard.id, defCard.id)
      } else {
        // Both same type - flash red and deselect
        updateCardState(first.cardId, 'flashing')
        updateCardState(second.cardId, 'flashing')
        
        setTimeout(() => {
          updateCardState(first.cardId, 'unselected')
          updateCardState(second.cardId, 'unselected')
          setSelectedCards([])
        }, 800)
      }
    }
  }

  const handleReset = () => {
    setMatches({})
    setSelectedCards([])
    setIsProcessingMatch(false)
    
    // Reset all card states to unselected
    const resetStates: Record<string, CardState> = {}
    const terms = question.vocabularyTerms || []
    terms.forEach(term => {
      resetStates[`term-${term.id}`] = { id: `term-${term.id}`, status: 'unselected' }
      resetStates[`def-${term.id}`] = { id: `def-${term.id}`, status: 'unselected' }
    })
    setCardStates(resetStates)
  }

  const getCardClassName = (cardId: string, baseClasses: string) => {
    const state = cardStates[cardId]
    if (!state) return baseClasses

    return cn(
      baseClasses,
      "transition-all duration-300 border-2",
      {
        // Unselected state - interactive
        'border-gray-200 bg-white cursor-pointer hover:shadow-lg transform hover:-translate-y-1': state.status === 'unselected',
        
        // Selected state - blue highlight, interactive
        'border-blue-400 bg-blue-50 ring-2 ring-blue-200 scale-105 cursor-pointer': state.status === 'selected',
        
        // Correct match - green, NOT interactive, looks "pressed in"
        'border-green-600 bg-green-300 text-green-900 cursor-default shadow-inner scale-95': state.status === 'correct',
        
        // Incorrect match - red
        'border-red-400 bg-red-100 text-red-800 cursor-pointer': state.status === 'incorrect',
        
        // Flashing red animation (wrong answer)
        'border-red-500 bg-red-200 animate-pulse cursor-pointer': state.status === 'flashing',
        
        // Flashing green animation (correct answer)
        'border-green-500 bg-green-200 animate-pulse cursor-pointer scale-105': state.status === 'flashing-success',
        
        // Global disabled state
        'cursor-not-allowed opacity-50': disabled,
        
        // Processing state
        'cursor-wait': isProcessingMatch && state.status !== 'correct' && state.status !== 'flashing-success'
      }
    )
  }

  const correctMatches = showResults ? 
    Object.entries(matches).filter(([termId, definitionId]) => termId === definitionId).length :
    Object.keys(matches).length
  const totalTerms = (question.vocabularyTerms || []).length

  return (
    <div className="space-y-6">
      {question.instructions && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border-l-4 border-primary/50">
          {question.instructions}
        </div>
      )}

      <div className="text-center">
        <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Memory Matching Game
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select a term and then select its matching definition. Correct matches turn green, wrong matches flash red.
        </p>
        {showResults && (
          <div className="mb-4">
            <Badge 
              variant={correctMatches === totalTerms ? "default" : "secondary"}
              className="text-lg px-4 py-2"
            >
              Score: {correctMatches}/{totalTerms}
            </Badge>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {selectedCards.length}/2 cards selected • {correctMatches} of {totalTerms} pairs matched
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Terms Column */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="font-semibold text-center text-base sm:text-lg border-b pb-2">Terms</h4>
          <div className="space-y-2 sm:space-y-3">
            {shuffledTerms.map((term) => {
              const cardId = `term-${term.id}`
              
              return (
                <Card
                  key={term.id}
                  className={getCardClassName(cardId, "")}
                  onClick={() => handleCardClick(cardId, 'term')}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="font-semibold text-sm sm:text-base lg:text-lg block truncate">{term.term}</span>
                        {term.category && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {term.category}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {showResults && cardStates[cardId]?.status === 'correct' && (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        )}
                        {showResults && cardStates[cardId]?.status === 'incorrect' && (
                          <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Definitions Column */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="font-semibold text-center text-base sm:text-lg border-b pb-2">Definitions</h4>
          <div className="space-y-2 sm:space-y-3">
            {shuffledDefinitions.map((term) => {
              const cardId = `def-${term.id}`
              
              return (
                <Card
                  key={`def-${term.id}`}
                  className={getCardClassName(cardId, "")}
                  onClick={() => handleCardClick(cardId, 'definition')}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-xs sm:text-sm leading-relaxed block break-words">{term.definition}</span>
                        {term.category && (
                          <div className="text-xs text-muted-foreground mt-2 truncate">
                            {term.category}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {showResults && cardStates[cardId]?.status === 'correct' && (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        )}
                        {showResults && cardStates[cardId]?.status === 'incorrect' && (
                          <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {!disabled && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isProcessingMatch}
            className="hover:bg-destructive hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Game
          </Button>
        </div>
      )}

      {showResults && (
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-6 rounded-xl border">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Final Results
          </h4>
          <div className="space-y-3">
            {Object.entries(matches).map(([termId, definitionId]) => {
              const term = (question.vocabularyTerms || []).find(t => t.id === termId)
              const matchedDefinition = (question.vocabularyTerms || []).find(t => t.id === definitionId)
              const isCorrect = termId === definitionId
              
              return (
                <div key={termId} className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-l-4 transition-all",
                  isCorrect ? 
                    "bg-green-50 border-green-400 text-green-900" : 
                    "bg-red-50 border-red-400 text-red-900"
                )}>
                  <div className="flex-shrink-0 mt-1">
                    {isCorrect ? 
                      <CheckCircle className="w-5 h-5 text-green-600" /> : 
                      <XCircle className="w-5 h-5 text-red-600" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-1">{term?.term}</div>
                    <div className="text-sm opacity-90 mb-2">
                      <span className="font-medium">Your match:</span> {matchedDefinition?.definition}
                    </div>
                    {!isCorrect && (
                      <div className="text-sm bg-white/50 p-2 rounded border border-current/20">
                        <span className="font-medium">Correct definition:</span> {term?.definition}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {correctMatches === totalTerms && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                <Sparkles className="w-5 h-5" />
                Perfect Score! Excellent work! 🎉
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}