export type QuestionType = 'multiple-choice' | 'open-response' | 'essay' | 'numerical' | 'vocabulary-matching' | 'vocabulary-crossword' | 'vocabulary-fill-blank' | 'vocabulary-hangman'

// Lesson-related types
export interface LessonVideo {
  id: string
  title: string
  youtubeId: string
  duration?: string
  description?: string
  timestamp?: number // For starting at specific time
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

export interface EssayQuestion extends BaseQuestion {
  type: 'essay'
  rubric?: string
  minLength?: number
  maxLength?: number
  autoGrade?: boolean  // Enable AI grading
  gradePrompt?: string  // Custom grading instructions
  correctConcepts?: string[]  // Key concepts that should be mentioned
  commonMisconceptions?: string[]  // Common wrong ideas to check for  
  sampleAnswer?: string  // Example of a good answer
}

export interface NumericalQuestion extends BaseQuestion {
  type: 'numerical'
  correctValue: number
  tolerance?: number
  unit?: string
  unitOptions?: string[] // Multiple unit options for students to choose from
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

export interface OpenResponseQuestion extends BaseQuestion {
  type: 'open-response'
  rubric: RubricCriterion[]
  correctConcepts?: string[]  // Key physics concepts that should be mentioned
  commonMisconceptions?: string[]  // Common wrong ideas to check for  
  sampleAnswer?: string  // Example of a good answer
  minLength?: number  // Minimum character requirement
  maxLength?: number  // Character limit
  autoGrade?: boolean  // Enable AI grading
  gradePrompt?: string  // Custom grading instructions
  requiresExplanation?: boolean  // Whether student must explain reasoning
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

export type Question = MultipleChoiceQuestion | OpenResponseQuestion | EssayQuestion | NumericalQuestion | VocabularyMatchingQuestion | VocabularyCrosswordQuestion | VocabularyFillBlankQuestion | VocabularyHangmanQuestion

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

