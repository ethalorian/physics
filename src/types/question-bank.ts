import { Question } from './assignment'

export interface QuestionBankItem {
  id: string
  question: Question
  unit: string
  lesson: string
  topics: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  usage_count: number
  created_at: string
  updated_at: string
  created_by?: string
  tags?: string[]
  estimated_time?: number // in minutes
  cognitive_level?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  standards?: string[] // e.g., NGSS standards
}

export interface Unit {
  id: string
  name: string
  description: string
  order_index: number
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  unit_id: string
  name: string
  description: string
  order_index: number
  objectives?: string[]
}

export interface QuestionBankFilters {
  units?: string[]
  lessons?: string[]
  topics?: string[]
  difficulty?: ('easy' | 'medium' | 'hard')[]
  questionTypes?: string[]
  searchText?: string
  tags?: string[]
  cognitive_levels?: string[]
}

export interface QuestionBankStats {
  total_questions: number
  by_unit: Record<string, number>
  by_difficulty: {
    easy: number
    medium: number
    hard: number
  }
  by_type: Record<string, number>
  most_used: QuestionBankItem[]
  recently_added: QuestionBankItem[]
}
