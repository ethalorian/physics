export type ResultKind = 'worksheet' | 'simulation' | 'interactive' | 'quiz' | 'reading' | 'review' | 'vocabulary' | 'math' | 'video' | 'reflection' | 'choice' | 'lesson' | 'presentation'
export type ResultState = 'not_started' | 'draft' | 'submitted' | 'returned' | 'reviewed' | 'excused' | 'completed'
export type ResultStudent = { id: string; name: string; firstName?: string | null; lastName?: string | null }
export type ResultCell = {
  /** Released lab submissions, including originals retained after a revision. */
  transferGrades?: import('../interactive-assignments/lab-rubric').ReleasedLabEntry[]
  labGrades?: import('../interactive-assignments/lab-rubric').ReleasedLabEntry[]
  /** Teacher-released feedback only; private drafts are never copied here. */
  feedback?: string
  releasedAt?: string | null
  /** Only a source-confirmed, teacher-released grade belongs here. Never an AI draft. */
  grade?: { earned: number; possible: number; version: string; letter?: string }
  state: ResultState
  label: string
  detail?: string
  needsReview: boolean
  reviewIds?: string[]
  reviewItems?: { id: string; submittedAt: string; assessment?: ResultCell['assessment'] }[]
  assessmentSource?: 'vocabulary'|'checkpoint'
  assessmentVersion?: string
  assessment?: 'queued' | 'processing' | 'ready' | 'error' | 'none'
  submittedAt?: string | null
  submissionId?: string
  masteryValue?: number | null
  masteryCount?: number
  pendingTargets?: string[]
}
export type ResultActivity = {
  quizSchedule?: import('../quiz-schedule').QuizSchedule
  pairedKey?: string
  description?: string
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
  gradingSettings?: import('../grading-terms').GradingSettings
  gradingTermId?: string
  termQuizTotals?: Record<string, { earned: number; possible: number; percent: number | null; count: number }>
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
  worksheet: 'Worksheets',
  lesson: 'Class lessons', presentation: 'Live classroom responses', simulation: 'Simulations', interactive: 'Interactive lessons', quiz: 'Quizzes', reading: 'Readings', review: 'Reviews', vocabulary: 'Vocabulary', math: 'Math', video: 'Videos', reflection: 'Reflections & chapter responses', choice: 'Student choices',
}
