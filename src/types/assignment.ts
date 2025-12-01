// Essay type removed - consolidated into open-response with flexible rubric system
export type QuestionType = 'multiple-choice' | 'open-response' | 'numerical' | 'vocabulary-matching' | 'vocabulary-crossword' | 'vocabulary-fill-blank' | 'vocabulary-hangman'

// Lesson-related types
export interface VideoQuestion {
  id: string
  timestamp: number // When to pause video (in seconds)
  question: Question // Any question type
  answered?: boolean
  studentAnswer?: any
  score?: number
}

export interface LessonVideo {
  id: string
  title: string
  youtubeId: string
  duration?: string
  description?: string
  timestamp?: number // For starting at specific time
  questions?: VideoQuestion[] // EdPuzzle-like embedded questions
}

export interface Lesson {
  id: string
  title: string
  slug: string
  description?: string
  content?: string
  unit: string
  lesson_number: number
  published: boolean
  videos?: LessonVideo[]
  objectives?: string[]
  estimated_time?: number // in minutes
  isEnhanced?: boolean // Flag for enhanced lesson view
  created_at: string
  updated_at: string
}

export interface BaseQuestion {
  id: string
  type: QuestionType
  question: string
  points: number
  required?: boolean
  scenarioImage?: string // URL or base64 of generated physics scenario image
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice'
  options: string[]
  correctAnswer: number // index of correct answer
  explanation?: string
}

// Short answer removed - consolidated into open-response with AI grading
// Essay type removed - consolidated into open-response with flexible rubric system

/**
 * Enhanced Numerical Question Type
 * 
 * Supports AI-powered word problem generation and solving.
 * Can generate step-by-step solutions and explanations.
 */
export interface NumericalQuestion extends BaseQuestion {
  type: 'numerical'
  
  // Answer Configuration
  correctValue: number
  tolerance?: number  // Acceptable margin of error (default 0.01 or 1%)
  unit?: string  // The correct unit (e.g., 'm/s', 'N', 'J')
  unitOptions?: string[]  // Multiple unit options for students to choose from
  
  // Problem Context (for AI generation and grading)
  topic?: string  // Physics topic (e.g., 'kinematics', 'forces', 'energy')
  difficulty?: 'easy' | 'medium' | 'hard'
  
  // Given Values (extracted or provided)
  givenValues?: {
    name: string  // e.g., 'initial velocity', 'mass'
    symbol: string  // e.g., 'v₀', 'm'
    value: number
    unit: string
  }[]
  
  // Solution Details (can be AI-generated)
  formula?: string  // The main formula used (e.g., 'v = d/t', 'F = ma')
  formulaLatex?: string  // LaTeX version for rendering
  solutionSteps?: {
    step: number
    description: string
    equation?: string  // LaTeX equation
    result?: string
  }[]
  explanation?: string  // Conceptual explanation of the solution
  
  // Common Mistakes
  commonMistakes?: {
    incorrectValue: number
    incorrectUnit?: string
    misconception: string
  }[]
  
  // AI Generation Metadata
  generatedByAI?: boolean
  solutionGeneratedByAI?: boolean
}

export interface RubricCriterion {
  id: string
  name: string
  description: string
  maxPoints: number
  levels: {
    score: number
    description: string
  }[]
}

/**
 * Unified Open Response Question Type
 * 
 * This is the single, flexible question type for all written responses.
 * Consolidates the former "essay" and "open-response" types.
 * 
 * Features:
 * - Flexible rubric system (can be empty for simple questions or detailed for complex ones)
 * - AI-powered rubric generation from question text
 * - AI-powered sample answer generation
 * - AI-powered grading with detailed feedback
 * - Support for key concepts and common misconceptions
 */
export interface OpenResponseQuestion extends BaseQuestion {
  type: 'open-response'
  
  // Rubric Configuration - flexible: can be empty, simple, or detailed
  rubric: RubricCriterion[]  // Structured rubric criteria (can be AI-generated)
  
  // AI Grading Features
  autoGrade?: boolean  // Enable AI grading
  gradePrompt?: string  // Custom instructions for AI grader
  
  // Content Guidance
  correctConcepts?: string[]  // Key physics concepts that should be mentioned
  commonMisconceptions?: string[]  // Common wrong ideas to check for
  sampleAnswer?: string  // Example of a good answer (can be AI-generated)
  
  // Response Requirements
  minLength?: number  // Minimum word requirement
  maxLength?: number  // Maximum word limit
  requiresExplanation?: boolean  // Whether student must explain reasoning
  
  // AI Generation Metadata
  rubricGeneratedByAI?: boolean  // Whether rubric was AI-generated
  sampleAnswerGeneratedByAI?: boolean  // Whether sample answer was AI-generated
}

// Vocabulary types
export interface VocabularyTerm {
  id: string
  term: string
  definition: string
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface VocabularyMatchingQuestion extends BaseQuestion {
  type: 'vocabulary-matching'
  vocabularyTerms: VocabularyTerm[]
  instructions?: string
}

export interface VocabularyCrosswordQuestion extends BaseQuestion {
  type: 'vocabulary-crossword'
  vocabularyTerms: VocabularyTerm[]
  gridSize?: number // Default 15x15
  instructions?: string
}

export interface VocabularyFillBlankQuestion extends BaseQuestion {
  type: 'vocabulary-fill-blank'
  vocabularyTerms: VocabularyTerm[]
  sentences: {
    id: string
    text: string // Text with {term} placeholders
    termId: string // Which vocabulary term fills the blank
  }[]
  showWordBank?: boolean // Whether to show available terms
  instructions?: string
}

export interface VocabularyHangmanQuestion extends BaseQuestion {
  type: 'vocabulary-hangman'
  vocabularyTerms: VocabularyTerm[]
  difficulty?: 'easy' | 'medium' | 'hard'
  maxWrongGuesses?: number // Default 6
  showDefinitions?: boolean // Whether to show definitions as hints
  wordsPerGame?: number // How many words in one game (default 10)
  instructions?: string
}

export type Question = MultipleChoiceQuestion | OpenResponseQuestion | NumericalQuestion | VocabularyMatchingQuestion | VocabularyCrosswordQuestion | VocabularyFillBlankQuestion | VocabularyHangmanQuestion

export interface Assignment {
  id: string
  lesson_id?: string
  title: string
  description?: string
  instructions?: string
  questions: Question[]
  total_points: number
  due_date?: string
  published: boolean
  created_at: string
  updated_at: string
  lesson?: {
    title: string
    slug: string
  }
}

export interface RubricScore {
  criterionId: string
  score: number
  feedback?: string
}

export interface OpenResponseGrade {
  questionId: string
  rubricScores: RubricScore[]
  totalScore: number
  overallFeedback?: string
  aiGenerated?: boolean
}

export interface Submission {
  id: string
  assignment_id: string
  user_id: string
  answers: Record<string, string | number | string[] | Record<string, unknown>>
  score?: number
  max_score?: number
  feedback?: Record<string, string>
  rubric_grades?: OpenResponseGrade[]
  submitted_at: string
  graded_at?: string
  status: 'submitted' | 'graded' | 'partial'
}

