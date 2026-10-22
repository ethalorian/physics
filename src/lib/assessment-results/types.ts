export type ResultKind = 'simulation' | 'interactive' | 'quiz' | 'reading' | 'review' | 'vocabulary' | 'math' | 'video' | 'reflection' | 'choice'
export type ResultState = 'not_started' | 'draft' | 'submitted' | 'returned' | 'reviewed' | 'excused' | 'completed'
export type ResultStudent = { id: string; name: string }
export type ResultCell = {
  state: ResultState
  label: string
  detail?: string
  needsReview: boolean
  reviewIds?: string[]
  assessment?: 'queued' | 'processing' | 'ready' | 'error' | 'none'
  submittedAt?: string | null
  submissionId?: string
  masteryValue?: number | null
  masteryCount?: number
  pendingTargets?: string[]
}
export type ResultActivity = {
  key: string
  sourceId: string
  choiceSectionId?: string
  lessonIds?: string[]
  sourceKeys?: string[]
  followUpKeys?: string[]
  evidenceActivities?: ResultActivity[]
  kind: ResultKind
  title: string
  unitIds: string[]
  targetIds?: string[]
  /** Math observations follow the learner across the year. */
  crossUnit?: boolean
  code?: string
  dueAt: string | null
  dateOnly?: boolean
  archived: boolean
  cells: Record<string, ResultCell>
}
export type ResultsData = {
  courseId: string
  unitId: string
  students: ResultStudent[]
  activities: ResultActivity[]
  units: { id: string; name: string }[]
  targets?: { id: string; statement: string; unitId: string }[]
  unmapped: number
  warnings: { source: string; message: string }[]
}
export const RESULT_KINDS: Record<ResultKind, string> = {
  simulation: 'Simulations', interactive: 'Interactive lessons', quiz: 'Quizzes', reading: 'Readings', review: 'Reviews', vocabulary: 'Vocabulary', math: 'Math', video: 'Videos', reflection: 'Reflections & chapter responses', choice: 'Student choices',
}
