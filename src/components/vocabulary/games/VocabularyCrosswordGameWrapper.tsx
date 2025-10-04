"use client"
import { useState, useEffect } from 'react'
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
  const [startTime] = useState(Date.now())

  // Convert vocabulary terms to crossword question format
  const crosswordQuestion: VocabularyCrosswordQuestion = {
    id: `crossword-${Date.now()}`,
    type: 'vocabulary-crossword',
    question: 'Complete the crossword puzzle using the physics vocabulary terms',
    points: vocabularyTerms.length * 2,
    required: true,
    vocabularyTerms: vocabularyTerms.slice(0, 15), // Limit for crossword grid
    gridSize: 15
  }

  const handleAnswer = (answer: { answers: Record<string, string> }) => {
    // Calculate score based on correct answers
    const correctAnswers = Object.keys(answer.answers).filter(termId => {
      const term = vocabularyTerms.find(t => t.id === termId)
      return term && answer.answers[termId].toLowerCase() === term.term.toLowerCase()
    })

    const score = correctAnswers.length * 10
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    onGameComplete?.(score, vocabularyTerms.length, timeSpent)
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

