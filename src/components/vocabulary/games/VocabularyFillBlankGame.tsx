"use client"
import { useState, useEffect, useRef } from 'react'
import { VocabularyFillBlankQuestion } from '@/types/assignment'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VocabularyFillBlankGameProps {
  question: VocabularyFillBlankQuestion
  onAnswer?: (answer: { answers: Record<string, string> }) => void
  showResults?: boolean
  initialAnswer?: { answers: Record<string, string> }
  disabled?: boolean
}

export default function VocabularyFillBlankGame({ 
  question, 
  onAnswer, 
  showResults = false, 
  initialAnswer,
  disabled = false 
}: VocabularyFillBlankGameProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswer?.answers || {})
  const [draggedTerm, setDraggedTerm] = useState<string | null>(null)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [usedTerms, setUsedTerms] = useState<Set<string>>(new Set())
  const lastAnswersRef = useRef<string>('')

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

  // Update used terms when answers change
  useEffect(() => {
    const newUsedTerms = new Set<string>()
    Object.values(answers).forEach(answer => {
      if (answer && answer.trim()) {
        newUsedTerms.add(answer.toLowerCase().trim())
      }
    })
    setUsedTerms(newUsedTerms)
  }, [answers])

  const handleInputChange = (sentenceId: string, value: string) => {
    if (disabled) return
    
    const newAnswers = { ...answers, [sentenceId]: value }
    setAnswers(newAnswers)
  }

  const handleWordBankClick = (term: string) => {
    if (disabled) return
    
    // Fill the current sentence blank
    const currentSentence = question.sentences[currentSentenceIndex]
    if (currentSentence && !answers[currentSentence.id]) {
      const newAnswers = { ...answers, [currentSentence.id]: term }
      setAnswers(newAnswers)
      
      // Note: Removed automatic progression - user must manually navigate
    }
  }

  const handleDragStart = (term: string) => {
    setDraggedTerm(term)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, sentenceId: string) => {
    e.preventDefault()
    if (draggedTerm && !disabled) {
      const newAnswers = { ...answers, [sentenceId]: draggedTerm }
      setAnswers(newAnswers)
    }
    setDraggedTerm(null)
  }

  const handleReset = () => {
    setAnswers({})
    setCurrentSentenceIndex(0)
    setUsedTerms(new Set())
  }

  const goToNextSentence = () => {
    if (currentSentenceIndex < question.sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1)
    }
  }

  const goToPreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(prev => prev - 1)
    }
  }

  const getAnswerStatus = (sentenceId: string, forRealTime: boolean = false) => {
    const userAnswer = answers[sentenceId]
    const sentence = question.sentences.find(s => s.id === sentenceId)
    const correctTerm = question.vocabularyTerms.find(t => t.id === sentence?.termId)
    
    if (!userAnswer || !correctTerm) return null
    
    const isCorrect = userAnswer.toLowerCase().trim() === correctTerm.term.toLowerCase().trim()
    
    // For real-time feedback, only show status if answer is complete enough
    if (forRealTime) {
      if (userAnswer.length >= 2) { // Show feedback after 2+ characters
        return isCorrect ? 'correct' : 'incorrect'
      }
      return null
    }
    
    // For results mode, always show status if there's an answer
    if (showResults) {
      return isCorrect ? 'correct' : 'incorrect'
    }
    
    return null
  }

  const correctAnswers = showResults ? 
    question.sentences.filter(sentence => {
      const userAnswer = answers[sentence.id]
      const correctTerm = question.vocabularyTerms.find(t => t.id === sentence.termId)
      return userAnswer && correctTerm && 
        userAnswer.toLowerCase().trim() === correctTerm.term.toLowerCase().trim()
    }).length : 0

  const totalSentences = question.sentences.length

  // Get available terms for word bank (shuffle them and filter out used terms)
  const availableTerms = question.showWordBank ? 
    [...question.vocabularyTerms]
      .sort(() => Math.random() - 0.5)
      .map(t => t.term)
      .filter(term => !usedTerms.has(term.toLowerCase().trim())) : 
    []

  const currentSentence = question.sentences[currentSentenceIndex]
  const completedSentences = Object.keys(answers).filter(key => answers[key]?.trim()).length

  const renderSentenceWithBlank = (sentence: { id: string, text: string, termId: string }) => {
    const parts = sentence.text.split('{term}')
    const userAnswer = answers[sentence.id] || ''
    const answerStatus = getAnswerStatus(sentence.id, !showResults) // Use real-time feedback when not in results mode
    
    return (
      <div key={sentence.id} className="flex items-center gap-2 flex-wrap text-sm sm:text-base">
        <span className="break-words">{parts[0]}</span>
        <div 
          className={cn(
            "relative inline-block min-w-32 sm:min-w-40 min-h-10 sm:min-h-12 max-w-full",
            question.showWordBank && "border-2 rounded-lg",
            // Empty state styling
            question.showWordBank && !userAnswer && "border-dashed border-primary/40 bg-primary/5",
            // Filled state styling with real-time feedback
            !showResults && userAnswer && answerStatus === 'correct' && "border-green-500 bg-green-100",
            !showResults && userAnswer && answerStatus === 'incorrect' && "border-red-500 bg-red-100", 
            !showResults && userAnswer && !answerStatus && "border-blue-400 bg-blue-50 dark:bg-blue-900/30",
            // Results mode styling
            showResults && answerStatus === 'correct' && "border-green-500 bg-green-100",
            showResults && answerStatus === 'incorrect' && "border-red-500 bg-red-100"
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, sentence.id)}
        >
          {question.showWordBank && !userAnswer ? (
            // Drop zone placeholder
            <div className="flex items-center justify-center h-12 px-4">
              <span className="text-sm text-muted-foreground select-none">
                {disabled ? "Empty" : "Drop vocabulary term here"}
              </span>
            </div>
          ) : (
            // Input field
            <Input
              value={userAnswer}
              onChange={(e) => handleInputChange(sentence.id, e.target.value)}
              className={cn(
                "text-center font-medium text-lg h-12 border-0 bg-transparent",
                // Real-time color feedback
                !showResults && answerStatus === 'correct' && "text-green-700",
                !showResults && answerStatus === 'incorrect' && "text-red-700",
                !showResults && userAnswer && !answerStatus && "text-blue-700",
                // Results mode colors
                showResults && answerStatus === 'correct' && "text-green-700",
                showResults && answerStatus === 'incorrect' && "text-red-700"
              )}
              placeholder={question.showWordBank ? "Type or drop here" : "____"}
              disabled={disabled}
            />
          )}
          
          {/* Real-time feedback icons */}
          {!showResults && answerStatus && (
            <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
              {answerStatus === 'correct' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          )}
          
          {/* Results mode feedback icons */}
          {showResults && answerStatus && (
            <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
              {answerStatus === 'correct' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          )}
        </div>
        <span>{parts[1]}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {question.instructions && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          {question.instructions}
        </div>
      )}

      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Fill in the blanks</h3>
        {!showResults ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {question.showWordBank ? 
                "Drag terms from the word bank to fill in the blanks" :
                "Type the correct vocabulary terms in the blanks"
              }
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="outline">
                Sentence {currentSentenceIndex + 1} of {totalSentences}
              </Badge>
              <Badge variant="secondary">
                Completed: {completedSentences}/{totalSentences}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <Badge variant={correctAnswers === totalSentences ? "default" : "secondary"}>
              Final Score: {correctAnswers}/{totalSentences}
            </Badge>
          </div>
        )}
      </div>

      {question.showWordBank && !showResults && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Word Bank</h4>
              <Badge variant="outline" className="text-xs">
                {availableTerms.length} terms remaining
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border-2 border-dashed border-muted-foreground/20 rounded-lg">
              {availableTerms.length > 0 ? (
                availableTerms.map((term, index) => (
                  <Badge
                    key={`${term}-${index}`}
                    variant="outline"
                    className={cn(
                      "cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 px-3 py-2 text-sm font-medium",
                      "hover:scale-105 hover:shadow-md",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                    draggable={!disabled}
                    onDragStart={() => handleDragStart(term)}
                    onClick={() => handleWordBankClick(term)}
                  >
                    {term}
                  </Badge>
                ))
              ) : (
                <div className="text-center w-full py-4 text-muted-foreground">
                  <p className="text-sm">All terms have been used!</p>
                  <p className="text-xs">Great job completing the vocabulary!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Sentence Display */}
      {currentSentence && !showResults && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="outline" className="mb-4">
                  Question {currentSentenceIndex + 1} of {totalSentences}
                </Badge>
              </div>
              <div className="text-lg leading-relaxed text-center">
                {renderSentenceWithBlank(currentSentence)}
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={goToPreviousSentence}
                  disabled={currentSentenceIndex === 0 || disabled}
                  className="flex items-center gap-2"
                >
                  ← Previous
                </Button>
                
                <div className="flex gap-1">
                  {question.sentences.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSentenceIndex(index)}
                      disabled={disabled}
                      className={cn(
                        "w-3 h-3 rounded-full transition-colors",
                        index === currentSentenceIndex ? "bg-primary" : "bg-muted",
                        answers[question.sentences[index].id] ? "ring-2 ring-green-400" : "",
                        !disabled && "hover:bg-primary/70 cursor-pointer"
                      )}
                    />
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  onClick={goToNextSentence}
                  disabled={currentSentenceIndex === totalSentences - 1 || disabled}
                  className="flex items-center gap-2"
                >
                  Next →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results View - Show all sentences */}
      {showResults && (
        <div className="space-y-4">
          <h4 className="font-semibold text-center">All Sentences</h4>
          {question.sentences.map((sentence) => (
            <Card key={sentence.id}>
              <CardContent className="p-4">
                <div className="text-base leading-relaxed">
                  {renderSentenceWithBlank(sentence)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completion Celebration */}
      {!showResults && completedSentences === totalSentences && totalSentences > 0 && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="space-y-3">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <h3 className="text-xl font-bold text-green-800">Congratulations!</h3>
              <p className="text-green-700">You&apos;ve completed all {totalSentences} sentences!</p>
              <Badge variant="default" className="bg-green-600">
                All vocabulary terms used correctly
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {!disabled && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          {!showResults && currentSentenceIndex > 0 && (
            <Button variant="outline" onClick={() => setCurrentSentenceIndex(0)}>
              Go to First
            </Button>
          )}
        </div>
      )}

      {showResults && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Results</h4>
          <div className="space-y-2 text-sm">
            {question.sentences.map((sentence) => {
              const userAnswer = answers[sentence.id]
              const correctTerm = question.vocabularyTerms.find(t => t.id === sentence.termId)
              const isCorrect = userAnswer && correctTerm && 
                userAnswer.toLowerCase().trim() === correctTerm.term.toLowerCase().trim()
              
              return (
                <div key={sentence.id} className={cn(
                  "flex items-start gap-2 p-2 rounded",
                  isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  {isCorrect ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <div>
                    <div className="font-medium">
                      {sentence.text.replace('{term}', `[${userAnswer || '___'}]`)}
                    </div>
                    {!isCorrect && correctTerm && (
                      <div className="text-xs mt-1">
                        Correct answer: {correctTerm.term}
                        {correctTerm.definition && (
                          <span className="block mt-1 italic">&ldquo;{correctTerm.definition}&rdquo;</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
