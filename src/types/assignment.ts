export type QuestionType = 'multiple-choice' | 'short-answer' | 'essay' | 'numerical'

export interface BaseQuestion {
  id: string
  type: QuestionType
  question: string
  points: number
  required?: boolean
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice'
  options: string[]
  correctAnswer: number // index of correct answer
  explanation?: string
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer'
  expectedAnswer?: string
  keywords?: string[]
  maxLength?: number
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay'
  rubric?: string
  minLength?: number
  maxLength?: number
}

export interface NumericalQuestion extends BaseQuestion {
  type: 'numerical'
  correctValue: number
  tolerance?: number
  unit?: string
}

export type Question = MultipleChoiceQuestion | ShortAnswerQuestion | EssayQuestion | NumericalQuestion

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

export interface Submission {
  id: string
  assignment_id: string
  user_id: string
  answers: Record<string, string | number | string[]>
  score?: number
  max_score?: number
  feedback?: Record<string, string>
  submitted_at: string
  graded_at?: string
  status: 'submitted' | 'graded' | 'partial'
}

