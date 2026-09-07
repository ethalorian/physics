"use client"
import { useState, useMemo, useRef } from 'react'
import { useVocabAttempts } from '@/components/vocabulary/arcade/useVocabAttempts'
import { VocabularyTerm, VocabularyCrosswordQuestion } from '@/types/assignment'
import VocabularyCrosswordGame from './VocabularyCrosswordGame'

interface VocabularyCrosswordGameWrapperProps {
  vocabularyTerms: VocabularyTerm[]
  onGameComplete?: (score: number, totalWords: number, timeSpent: number) => void
  difficulty?: 'easy' | 'medium' | 'hard'
}

export default function VocabularyCrosswordGameWrapper({
  vocabularyTerms,
  onGameComplete,
  difficulty = 'medium'
}: VocabularyCrosswordGameWrapperProps) {
  const attempts = useVocabAttempts(null, 'crossword')
  const [startTime] = useState(Date.now())

  // Convert vocabulary terms to crossword question format
  const submitted = useRef(false)
  const crosswordQuestion: VocabularyCrosswordQuestion = useMemo(() => ({
    id: `crossword-${Date.now()}`,
    type: 'vocabulary-crossword',
    question: 'Complete the crossword puzzle using the physics vocabulary terms',
    points: vocabularyTerms.length * 2,
    required: true,
    vocabularyTerms: vocabularyTerms.slice(0, 15), // Limit for crossword grid
    gridSize: 15
  }), [vocabularyTerms])

  const handleAnswer = (answer: { answers: Record<string, string> }) => {
    if (submitted.current) return
    submitted.current = true
    // Calculate score based on correct answers
    const correctAnswers = Object.keys(answer.answers).filter(termId => {
      const term = vocabularyTerms.find(t => t.id === termId)
      return term && answer.answers[termId].toLowerCase().replace(/\s+/g, '') === term.term.toLowerCase().replace(/\s+/g, '')
    })
    for (const termId of Object.keys(answer.answers)) {
      attempts.record({ id: termId }, correctAnswers.includes(termId))
    }
    attempts.flush()

    const score = correctAnswers.length * 10
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    onGameComplete?.(score, Object.keys(answer.answers).length, timeSpent)
  }

  return (
    <VocabularyCrosswordGame
      question={crosswordQuestion}
      onAnswer={handleAnswer}
      showResults={false}
      disabled={false}
    />
  )
}

