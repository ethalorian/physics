/**
 * Type definitions for Interactive Content System
 * Includes Simulations, Tools, and Interactive Lessons
 */

import { Question, QuestionType } from './assignment'

// ============================================================================
// SIMULATION TYPES
// ============================================================================

export type SimulationCategory = 
  | 'kinematics'
  | 'forces'
  | 'energy'
  | 'momentum'
  | 'waves'
  | 'electricity'
  | 'magnetism'
  | 'optics'
  | 'thermodynamics'
  | 'modern-physics'
  | 'lab-skills'

export interface Simulation {
  id: string
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  
  // Categorization
  category: SimulationCategory
  unit: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  
  // Technical
  component_path: string
  estimated_time?: number // minutes
  
  // Learning
  objectives?: string[]
  key_concepts?: string[]
  prerequisite_knowledge?: string[]
  
  // Features
  can_embed: boolean
  has_ai_guide: boolean
  supported_question_types?: QuestionType[]
  
  // Metadata
  published: boolean
  created_by?: string
  created_at: string
  updated_at: string
  
  // Analytics
  view_count: number
  embed_count: number
}

// ============================================================================
// TOOL TYPES
// ============================================================================

export type ToolCategory = 
  | 'measurement'
  | 'calculator'
  | 'data-analysis'
  | 'visualization'
  | 'conversion'

export interface Tool {
  id: string
  title: string
  slug: string
  description?: string
  icon_name?: string // Lucide icon name
  
  // Categorization
  category: ToolCategory
  tool_type: string
  tags: string[]
  
  // Technical
  component_path: string
  can_embed: boolean
  
  // Integration
  compatible_simulations?: string[]
  data_input_schema?: Record<string, any>
  data_output_schema?: Record<string, any>
  
  // Metadata
  published: boolean
  created_at: string
  updated_at: string
  
  // Analytics
  use_count: number
}

// ============================================================================
// INTERACTIVE LESSON TYPES
// ============================================================================

export type AIScaffoldingLevel = 'none' | 'minimal' | 'adaptive' | 'full'

export interface InteractiveLesson {
  id: string
  lesson_id: string
  steps: InteractiveLessonStep[]
  
  // AI Configuration
  ai_enabled: boolean
  ai_scaffolding_level: AIScaffoldingLevel
  ai_system_prompt?: string
  
  // Progress Requirements
  requires_sequential: boolean
  passing_score?: number // 0-100
  
  // Metadata
  created_at: string
  updated_at: string
  
  // Populated data (optional)
  lesson?: {
    id: string
    title: string
    slug: string
    unit: string
  }
}

export type StepType = 
  | 'simulation'
  | 'tool'
  | 'question'
  | 'content'
  | 'video'
  | 'ai-discussion'

export interface InteractiveLessonStep {
  id: string
  type: StepType
  title: string
  order: number
  
  // Content (varies by type)
  content: StepContent
  
  // AI Features
  ai_hints?: string[]
  ai_can_provide_help: boolean
  ai_validation_prompt?: string
  
  // Requirements
  required: boolean
  min_time?: number // seconds
  max_attempts?: number
  
  // Navigation
  next_step_id?: string
  conditional_next?: ConditionalNavigation[]
}

export interface StepContent {
  // Content type
  markdown?: string
  
  // Simulation
  simulation_id?: string
  simulation_slug?: string
  initial_parameters?: Record<string, any>
  success_criteria?: SuccessCriteria
  
  // Tool
  tool_id?: string
  tool_slug?: string
  tool_config?: Record<string, any>
  
  // Question
  question?: Question
  ai_generate?: boolean // Generate question based on previous steps
  
  // Video
  video?: {
    youtubeId: string
    title?: string
    duration?: string
    timestamp?: number
  }
  
  // AI Discussion
  ai_prompt?: string
  discussion_topic?: string
  expected_concepts?: string[]
}

export type SuccessCriteriaType = 
  | 'data-match'
  | 'calculation-accuracy'
  | 'concept-demonstration'
  | 'time-spent'
  | 'custom'

export interface SuccessCriteria {
  type: SuccessCriteriaType
  criteria: Record<string, any>
  ai_validate?: boolean
  validation_prompt?: string
}

export interface ConditionalNavigation {
  condition: string // JavaScript-like expression: 'score > 80', 'attempts < 3'
  next_step_id: string
  description?: string
}

// ============================================================================
// PROGRESS TRACKING TYPES
// ============================================================================

export interface SimulationActivity {
  id: string
  student_id: string
  simulation_id: string
  
  // Session
  started_at: string
  completed_at?: string
  time_spent: number // seconds
  
  // Data
  interactions: SimulationInteraction[]
  final_state?: Record<string, any>
  
  // AI
  ai_hints_used: number
  ai_messages?: AIMessage[]
  
  // Assessment
  score?: number
  passed?: boolean
  
  // Context
  lesson_id?: string
  step_id?: string
  
  created_at: string
}

export interface SimulationInteraction {
  timestamp: number // milliseconds since session start
  action: string // 'start', 'parameter-change', 'data-recorded', 'complete', etc.
  data: Record<string, any>
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface InteractiveLessonProgress {
  id: string
  student_id: string
  lesson_id: string
  interactive_lesson_id: string
  
  // Progress
  current_step_id?: string
  completed_steps: string[]
  step_scores: Record<string, number>
  
  // Status
  status: 'not_started' | 'in_progress' | 'completed'
  started_at?: string
  completed_at?: string
  last_accessed_at: string
  
  // Scoring
  total_score: number
  max_possible_score: number
  percentage: number
  
  // AI
  total_ai_interactions: number
  ai_conversation_history?: AIMessage[]
  
  // Metadata
  created_at: string
  updated_at: string
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface SimulationProps {
  // Configuration
  simulationId?: string
  initialParameters?: Record<string, any>
  readOnly?: boolean
  embedded?: boolean
  
  // Callbacks
  onComplete?: (result: SimulationResult) => void
  onDataChange?: (data: Record<string, any>) => void
  onInteraction?: (interaction: SimulationInteraction) => void
  
  // AI Integration
  aiEnabled?: boolean
  onAIRequest?: (context: SimulationContext) => Promise<string>
  
  // Progress
  showProgress?: boolean
  successCriteria?: SuccessCriteria
}

export interface SimulationResult {
  completed: boolean
  score?: number
  data: Record<string, any>
  interactions: SimulationInteraction[]
  time_spent: number
}

export interface SimulationContext {
  simulation_id: string
  current_state: Record<string, any>
  student_interactions: SimulationInteraction[]
  question_asked: string
  time_spent: number
}

export interface ToolProps {
  // Configuration
  toolId?: string
  config?: Record<string, any>
  readOnly?: boolean
  embedded?: boolean
  
  // Data flow
  inputData?: Record<string, any>
  onDataChange?: (data: Record<string, any>) => void
  
  // Integration
  connectedSimulation?: string
  onConnect?: (simulationId: string) => void
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SimulationFilters {
  category?: SimulationCategory
  unit?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  has_ai_guide?: boolean
  can_embed?: boolean
  search?: string
}

export interface AIAssistRequest {
  action: 'hint' | 'validate' | 'generate-question' | 'discuss'
  context: SimulationContext | LessonStepContext
  student_input?: string
  conversation_history?: AIMessage[]
}

export interface AIAssistResponse {
  success: boolean
  result?: {
    message?: string
    validation?: {
      understood: boolean
      feedback: string
      score: number
    }
    question?: Question
  }
  error?: string
}

export interface LessonStepContext {
  lesson_id: string
  step_id: string
  step_type: StepType
  student_progress: InteractiveLessonProgress
  previous_steps_data?: Record<string, any>
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface SimulationMetadata {
  id: string
  title: string
  slug: string
  category: SimulationCategory
  difficulty: string
  estimated_time?: number
}

export interface ToolMetadata {
  id: string
  title: string
  slug: string
  category: ToolCategory
  icon_name?: string
}

export interface StepValidationResult {
  valid: boolean
  score?: number
  feedback?: string
  next_step_id?: string
}

// ============================================================================
// REGISTRY TYPES
// ============================================================================

export interface RegisteredSimulation {
  id: string
  slug: string
  component: React.ComponentType<SimulationProps>
  metadata: SimulationMetadata
}

export interface RegisteredTool {
  id: string
  slug: string
  component: React.ComponentType<ToolProps>
  metadata: ToolMetadata
}
