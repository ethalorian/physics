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
      const terms = question.vocabularyTerms.slice(0, 10) // Limit to 10 terms for simplicity
      
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
      let clueNumber = 1

      // Simple placement algorithm - place terms in a basic pattern
      terms.forEach((term, index) => {
        const direction = index % 2 === 0 ? 'across' : 'down'
        const answer = term.term.toUpperCase().replace(/\s+/g, '')
        
        let startRow: number
        let startCol: number

        if (direction === 'across') {
          startRow = Math.floor(gridSize / 2) + (Math.floor(index / 2) * 2) - 2
          startCol = 2
        } else {
          startRow = 2
          startCol = Math.floor(gridSize / 2) + (Math.floor(index / 2) * 2) - 2
        }

        // Ensure placement is within bounds
        if (direction === 'across') {
          if (startCol + answer.length >= gridSize || startRow < 0 || startRow >= gridSize) return
        } else {
          if (startRow + answer.length >= gridSize || startCol < 0 || startCol >= gridSize) return
        }

        const clueId = `clue-${term.id}`
        
        // Place the word in the grid
        for (let i = 0; i < answer.length; i++) {
          const row = direction === 'across' ? startRow : startRow + i
          const col = direction === 'across' ? startCol + i : startCol
          
          if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
            if (!grid[row][col].letter) {
              grid[row][col].letter = answer[i]
            }
            grid[row][col].clueIds.push(clueId)
            
            if (i === 0) {
              grid[row][col].isStart = true
              grid[row][col].number = clueNumber
            }
          }
        }

        clues.push({
          id: clueId,
          number: clueNumber,
          direction,
          clue: term.definition,
          answer,
          startRow,
          startCol,
          length: answer.length,
          termId: term.id
        })

        clueNumber++
      })

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
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">{clue.number}.</span>
                            <span className="text-sm">{clue.clue}</span>
                            {showResults && status && (
                              status === 'correct' ? 
                                <CheckCircle className="w-4 h-4 text-green-600" /> :
                                <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: clue.length }, (_, i) => (
                              <Input
                                key={i}
                                className="w-8 h-8 text-center p-0 font-mono font-bold"
                                maxLength={1}
                                value={userAnswer[i] || ''}
                                onChange={(e) => handleCellChange(clue.id, i, e.target.value)}
                                onFocus={() => setSelectedClue(clue.id)}
                                disabled={disabled}
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
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">{clue.number}.</span>
                            <span className="text-sm">{clue.clue}</span>
                            {showResults && status && (
                              status === 'correct' ? 
                                <CheckCircle className="w-4 h-4 text-green-600" /> :
                                <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: clue.length }, (_, i) => (
                              <Input
                                key={i}
                                className="w-8 h-8 text-center p-0 font-mono font-bold"
                                maxLength={1}
                                value={userAnswer[i] || ''}
                                onChange={(e) => handleCellChange(clue.id, i, e.target.value)}
                                onFocus={() => setSelectedClue(clue.id)}
                                disabled={disabled}
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
