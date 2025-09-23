"use client"
import { useState, useEffect, useRef } from 'react'
import { VocabularyCrosswordQuestion } from '@/types/assignment'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RotateCcw, ArrowRight, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CrosswordCell {
  id: string
  row: number
  col: number
  letter: string
  isStart: boolean
  number?: number
  clueIds: string[]
}

interface CrosswordClue {
  id: string
  number: number
  direction: 'across' | 'down'
  clue: string
  answer: string
  startRow: number
  startCol: number
  length: number
  termId: string
}

interface VocabularyCrosswordGameProps {
  question: VocabularyCrosswordQuestion
  onAnswer?: (answer: { answers: Record<string, string> }) => void
  showResults?: boolean
  initialAnswer?: { answers: Record<string, string> }
  disabled?: boolean
}

export default function VocabularyCrosswordGame({ 
  question, 
  onAnswer, 
  showResults = false, 
  initialAnswer,
  disabled = false 
}: VocabularyCrosswordGameProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswer?.answers || {})
  const [selectedClue, setSelectedClue] = useState<string | null>(null)
  const [crosswordData, setCrosswordData] = useState<{
    grid: CrosswordCell[][]
    clues: CrosswordClue[]
    gridSize: number
  } | null>(null)
  const lastAnswersRef = useRef<string>('')

  // Generate crossword puzzle from vocabulary terms
  useEffect(() => {
    const generateCrossword = () => {
      const gridSize = question.gridSize || 15
      const terms = question.vocabularyTerms.slice(0, 8) // Limit for better placement
      
      // Initialize empty grid
      const grid: CrosswordCell[][] = Array(gridSize).fill(null).map((_, row) =>
        Array(gridSize).fill(null).map((_, col) => ({
          id: `${row}-${col}`,
          row,
          col,
          letter: '',
          isStart: false,
          clueIds: []
        }))
      )

      const clues: CrosswordClue[] = []
      const placedWords: Array<{
        word: string
        startRow: number
        startCol: number
        direction: 'across' | 'down'
        clueId: string
      }> = []
      let clueNumber = 1

      // Helper function to find intersections between two words
      const findIntersections = (word1: string, word2: string): Array<{word1Index: number, word2Index: number}> => {
        const intersections: Array<{word1Index: number, word2Index: number}> = []
        for (let i = 0; i < word1.length; i++) {
          for (let j = 0; j < word2.length; j++) {
            if (word1[i] === word2[j]) {
              intersections.push({ word1Index: i, word2Index: j })
            }
          }
        }
        return intersections
      }

      // Helper function to check if a word can be placed at a position
      const canPlaceWord = (word: string, row: number, col: number, direction: 'across' | 'down'): boolean => {
        if (direction === 'across') {
          if (col + word.length > gridSize || row < 0 || row >= gridSize) return false
          
          // Check if placement conflicts with existing letters or creates invalid adjacencies
          for (let i = 0; i < word.length; i++) {
            const currentCell = grid[row][col + i]
            
            // If there's already a letter, it must match
            if (currentCell.letter && currentCell.letter !== word[i]) {
              return false
            }
            
            // Check for invalid adjacent letters (above/below)
            if (!currentCell.letter) { // Only check if we're placing a new letter
              if (row > 0 && grid[row - 1][col + i].letter && 
                  grid[row - 1][col + i].clueIds.length === 0) return false
              if (row < gridSize - 1 && grid[row + 1][col + i].letter && 
                  grid[row + 1][col + i].clueIds.length === 0) return false
            }
          }
          
          // Check word boundaries (no adjacent words at start/end)
          if (col > 0 && grid[row][col - 1].letter) return false
          if (col + word.length < gridSize && grid[row][col + word.length].letter) return false
          
        } else { // down
          if (row + word.length > gridSize || col < 0 || col >= gridSize) return false
          
          // Check if placement conflicts with existing letters or creates invalid adjacencies
          for (let i = 0; i < word.length; i++) {
            const currentCell = grid[row + i][col]
            
            // If there's already a letter, it must match
            if (currentCell.letter && currentCell.letter !== word[i]) {
              return false
            }
            
            // Check for invalid adjacent letters (left/right)
            if (!currentCell.letter) { // Only check if we're placing a new letter
              if (col > 0 && grid[row + i][col - 1].letter && 
                  grid[row + i][col - 1].clueIds.length === 0) return false
              if (col < gridSize - 1 && grid[row + i][col + 1].letter && 
                  grid[row + i][col + 1].clueIds.length === 0) return false
            }
          }
          
          // Check word boundaries (no adjacent words at start/end)
          if (row > 0 && grid[row - 1][col].letter) return false
          if (row + word.length < gridSize && grid[row + word.length][col].letter) return false
        }
        return true
      }

      // Helper function to place a word on the grid
      const placeWord = (term: { id: string; definition: string }, word: string, row: number, col: number, direction: 'across' | 'down') => {
        const clueId = `clue-${term.id}`
        
        for (let i = 0; i < word.length; i++) {
          const cellRow = direction === 'across' ? row : row + i
          const cellCol = direction === 'across' ? col + i : col
          
          // Safety check to ensure we're within grid bounds
          if (cellRow >= 0 && cellRow < gridSize && cellCol >= 0 && cellCol < gridSize) {
            grid[cellRow][cellCol].letter = word[i]
            grid[cellRow][cellCol].clueIds.push(clueId)
            
            if (i === 0) {
              grid[cellRow][cellCol].isStart = true
              grid[cellRow][cellCol].number = clueNumber
            }
          }
        }

        clues.push({
          id: clueId,
          number: clueNumber,
          direction,
          clue: term.definition,
          answer: word,
          startRow: row,
          startCol: col,
          length: word.length,
          termId: term.id
        })

        placedWords.push({
          word,
          startRow: row,
          startCol: col,
          direction,
          clueId
        })

        clueNumber++
      }

      // Start with the longest word in the center
      const sortedTerms = [...terms].sort((a, b) => 
        b.term.replace(/\s+/g, '').length - a.term.replace(/\s+/g, '').length
      )

      if (sortedTerms.length > 0) {
        const firstTerm = sortedTerms[0]
        const firstWord = firstTerm.term.toUpperCase().replace(/\s+/g, '')
        const centerRow = Math.floor(gridSize / 2)
        const centerCol = Math.floor((gridSize - firstWord.length) / 2)
        
        placeWord(firstTerm, firstWord, centerRow, centerCol, 'across')

        // Try to place remaining words by finding intersections
        for (let i = 1; i < sortedTerms.length; i++) {
          const currentTerm = sortedTerms[i]
          const currentWord = currentTerm.term.toUpperCase().replace(/\s+/g, '')
          let placed = false

          // Try to intersect with each already placed word
          for (const placedWord of placedWords) {
            if (placed) break

            const intersections = findIntersections(placedWord.word, currentWord)
            
            for (const intersection of intersections) {
              if (placed) break

              // Calculate position for intersection
              let newRow: number, newCol: number, newDirection: 'across' | 'down'

              if (placedWord.direction === 'across') {
                // Place new word vertically to intersect
                newDirection = 'down'
                newRow = placedWord.startRow - intersection.word2Index
                newCol = placedWord.startCol + intersection.word1Index
              } else {
                // Place new word horizontally to intersect
                newDirection = 'across'
                newRow = placedWord.startRow + intersection.word1Index
                newCol = placedWord.startCol - intersection.word2Index
              }

              // Check bounds and conflicts - ensure all coordinates are valid
              if (newRow >= 0 && newCol >= 0 && 
                  newRow < gridSize && newCol < gridSize &&
                  (newDirection === 'across' ? newCol + currentWord.length <= gridSize : newRow + currentWord.length <= gridSize) &&
                  canPlaceWord(currentWord, newRow, newCol, newDirection)) {
                placeWord(currentTerm, currentWord, newRow, newCol, newDirection)
                placed = true
              }
            }
          }

          // If couldn't find intersection, try to place in empty area
          if (!placed && placedWords.length < 6) {
            const attempts = 20
            for (let attempt = 0; attempt < attempts && !placed; attempt++) {
              const randomDirection = Math.random() > 0.5 ? 'across' : 'down'
              
              // Calculate valid ranges based on direction and word length
              const maxRow = randomDirection === 'across' ? gridSize - 1 : gridSize - currentWord.length
              const maxCol = randomDirection === 'across' ? gridSize - currentWord.length : gridSize - 1
              
              if (maxRow > 0 && maxCol > 0) {
                const randomRow = Math.floor(Math.random() * maxRow)
                const randomCol = Math.floor(Math.random() * maxCol)
                
                if (canPlaceWord(currentWord, randomRow, randomCol, randomDirection)) {
                  placeWord(currentTerm, currentWord, randomRow, randomCol, randomDirection)
                  placed = true
                }
              }
            }
          }
        }
      }

      setCrosswordData({ grid, clues, gridSize })
    }

    generateCrossword()
  }, [question.vocabularyTerms, question.gridSize])

  // Call onAnswer when answers change, but only if they actually changed
  useEffect(() => {
    const answersString = JSON.stringify(answers)
    if (onAnswer && answersString !== lastAnswersRef.current) {
      lastAnswersRef.current = answersString
      // Use setTimeout to prevent infinite loops
      const timeoutId = setTimeout(() => {
        onAnswer({ answers })
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [answers, onAnswer])

  const handleCellChange = (clueId: string, position: number, value: string) => {
    if (disabled) return
    
    const newAnswers = { ...answers }
    const currentAnswer = newAnswers[clueId] || ''
    const answerArray = currentAnswer.split('')
    
    // Ensure array is long enough
    while (answerArray.length <= position) {
      answerArray.push('')
    }
    
    answerArray[position] = value.toUpperCase()
    newAnswers[clueId] = answerArray.join('')
    
    setAnswers(newAnswers)

    // Auto-advance to next input if a letter was entered and there's a next position
    if (value && position < (crosswordData?.clues.find(c => c.id === clueId)?.length || 0) - 1) {
      const nextInput = document.querySelector(
        `input[data-clue-id="${clueId}"][data-position="${position + 1}"]`
      ) as HTMLInputElement
      
      if (nextInput) {
        setTimeout(() => {
          nextInput.focus()
          nextInput.select()
        }, 0)
      }
    }
  }

  const handleKeyDown = (clueId: string, position: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    // Handle backspace - move to previous input if current is empty
    if (e.key === 'Backspace') {
      const currentInput = e.target as HTMLInputElement
      if (!currentInput.value && position > 0) {
        const prevInput = document.querySelector(
          `input[data-clue-id="${clueId}"][data-position="${position - 1}"]`
        ) as HTMLInputElement
        
        if (prevInput) {
          setTimeout(() => {
            prevInput.focus()
            prevInput.select()
          }, 0)
        }
      }
    }
  }

  const handleReset = () => {
    setAnswers({})
  }

  const getClueStatus = (clueId: string) => {
    if (!showResults) return null
    const userAnswer = answers[clueId] || ''
    const clue = crosswordData?.clues.find(c => c.id === clueId)
    
    if (!clue) return null
    
    return userAnswer.toUpperCase() === clue.answer ? 'correct' : 'incorrect'
  }

  if (!crosswordData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Generating crossword puzzle...</p>
        </div>
      </div>
    )
  }

  const correctAnswers = showResults ? 
    crosswordData.clues.filter(clue => {
      const userAnswer = answers[clue.id] || ''
      return userAnswer.toUpperCase() === clue.answer
    }).length : 0

  const totalClues = crosswordData.clues.length

  return (
    <div className="space-y-6">
      {question.instructions && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          {question.instructions}
        </div>
      )}

      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Crossword Puzzle</h3>
        <p className="text-sm text-muted-foreground">
          Fill in the crossword using the vocabulary definitions as clues
        </p>
        {showResults && (
          <div className="mt-2">
            <Badge variant={correctAnswers === totalClues ? "default" : "secondary"}>
              Score: {correctAnswers}/{totalClues}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Crossword Grid */}
        <div className="flex justify-center">
          <div className="inline-block border-2 border-muted">
            {crosswordData.grid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell) => {
                  const hasLetter = cell.letter !== ''
                  const cellAnswers: Record<string, { answer: string, position: number }> = {}
                  
                  // Get user answers for this cell
                  cell.clueIds.forEach(clueId => {
                    const clue = crosswordData.clues.find(c => c.id === clueId)
                    if (clue) {
                      const userAnswer = answers[clueId] || ''
                      const position = clue.direction === 'across' ? 
                        cell.col - clue.startCol : 
                        cell.row - clue.startRow
                      cellAnswers[clueId] = { answer: userAnswer, position }
                    }
                  })

                  const displayLetter = hasLetter ? 
                    Object.values(cellAnswers)[0]?.answer[Object.values(cellAnswers)[0]?.position] || '' :
                    ''

                  return (
                    <div
                      key={cell.id}
                      className={cn(
                        "w-8 h-8 border border-muted-foreground/20 relative flex items-center justify-center text-xs font-mono",
                        hasLetter ? "bg-white" : "bg-muted/20",
                        !hasLetter && "cursor-not-allowed"
                      )}
                    >
                      {cell.number && (
                        <span className="absolute top-0 left-0 text-[8px] font-bold leading-none p-0.5">
                          {cell.number}
                        </span>
                      )}
                      {hasLetter && (
                        <span className="font-bold">
                          {displayLetter}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Clues */}
        <div className="space-y-4">
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4" />
                Across
              </h4>
              <div className="space-y-2">
                {crosswordData.clues
                  .filter(clue => clue.direction === 'across')
                  .sort((a, b) => a.number - b.number)
                  .map((clue) => {
                    const userAnswer = answers[clue.id] || ''
                    const status = getClueStatus(clue.id)
                    
                    return (
                      <Card key={clue.id} className={cn(
                        selectedClue === clue.id && "ring-2 ring-primary",
                        status === 'correct' && showResults && "bg-green-50 border-green-200",
                        status === 'incorrect' && showResults && "bg-red-50 border-red-200"
                      )}>
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="font-bold text-sm flex-shrink-0">{clue.number}.</span>
                            <span className="text-xs sm:text-sm break-words flex-1">{clue.clue}</span>
                            {showResults && status && (
                              <div className="flex-shrink-0">
                                {status === 'correct' ? 
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" /> :
                                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                }
                              </div>
                            )}
                          </div>
                          <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                            {Array.from({ length: clue.length }, (_, i) => (
                              <Input
                                key={i}
                                className="w-6 h-6 sm:w-8 sm:h-8 text-center p-0 font-mono font-bold text-xs sm:text-sm flex-shrink-0"
                                maxLength={1}
                                value={userAnswer[i] || ''}
                                onChange={(e) => handleCellChange(clue.id, i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(clue.id, i, e)}
                                onFocus={() => setSelectedClue(clue.id)}
                                disabled={disabled}
                                data-clue-id={clue.id}
                                data-position={i}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ({clue.length} letters)
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </div>

            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <ArrowDown className="w-4 h-4" />
                Down
              </h4>
              <div className="space-y-2">
                {crosswordData.clues
                  .filter(clue => clue.direction === 'down')
                  .sort((a, b) => a.number - b.number)
                  .map((clue) => {
                    const userAnswer = answers[clue.id] || ''
                    const status = getClueStatus(clue.id)
                    
                    return (
                      <Card key={clue.id} className={cn(
                        selectedClue === clue.id && "ring-2 ring-primary",
                        status === 'correct' && showResults && "bg-green-50 border-green-200",
                        status === 'incorrect' && showResults && "bg-red-50 border-red-200"
                      )}>
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="font-bold text-sm flex-shrink-0">{clue.number}.</span>
                            <span className="text-xs sm:text-sm break-words flex-1">{clue.clue}</span>
                            {showResults && status && (
                              <div className="flex-shrink-0">
                                {status === 'correct' ? 
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" /> :
                                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                }
                              </div>
                            )}
                          </div>
                          <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                            {Array.from({ length: clue.length }, (_, i) => (
                              <Input
                                key={i}
                                className="w-6 h-6 sm:w-8 sm:h-8 text-center p-0 font-mono font-bold text-xs sm:text-sm flex-shrink-0"
                                maxLength={1}
                                value={userAnswer[i] || ''}
                                onChange={(e) => handleCellChange(clue.id, i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(clue.id, i, e)}
                                onFocus={() => setSelectedClue(clue.id)}
                                disabled={disabled}
                                data-clue-id={clue.id}
                                data-position={i}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ({clue.length} letters)
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!disabled && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All Answers
          </Button>
        </div>
      )}

      {showResults && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Results</h4>
          <div className="grid gap-2 text-sm">
            {crosswordData.clues.map((clue) => {
              const userAnswer = answers[clue.id] || ''
              const isCorrect = userAnswer.toUpperCase() === clue.answer
              
              return (
                <div key={clue.id} className={cn(
                  "flex items-center gap-2 p-2 rounded",
                  isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span className="font-bold">{clue.number}{clue.direction === 'across' ? 'A' : 'D'}.</span>
                  <span className="flex-1">{clue.clue}</span>
                  <span className="font-mono font-bold">
                    {userAnswer || '___'} 
                    {!isCorrect && ` → ${clue.answer}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
