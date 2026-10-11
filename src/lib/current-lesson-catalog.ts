import { isCatalogLesson } from '@/lib/retired-curriculum'
export interface CurrentLessonMetadata {
  unit_id?: string | null
  program?: string | null
  lesson_type?: string | null
  content_blocks?: { blocks?: unknown; presentation?: unknown; learningPath?: unknown } | null
  presentation?: unknown
  learning_path?: unknown
}

/** A lightweight projection for catalogs that must not load lesson bodies. */
export const CURRENT_LESSON_FIELDS = 'unit_id,presentation:content_blocks->>presentation,learning_path:content_blocks->learningPath' as const

/** Current instruction and review choices only. Historical ratings stay independent. */
export function isCurrentLesson(lesson: CurrentLessonMetadata): boolean {
  if (lesson.program === 'projects' || !isCatalogLesson(lesson)) return false
  const physics = lesson.program === 'physics' || /^unit-[1-8]$/.test(lesson.unit_id ?? '')
  const presentation = lesson.content_blocks?.presentation ?? lesson.presentation
  const learningPath = lesson.content_blocks?.learningPath ?? lesson.learning_path
  return !physics || Boolean(presentation === 'physics-path' && learningPath)
}

/** Video concept lessons support a course plan; they are not its classroom session. */
export function isCurrentClassroomLesson(lesson: CurrentLessonMetadata): boolean {
  const path = lesson.content_blocks?.learningPath ?? lesson.learning_path
  const kind = path && typeof path === 'object' && 'kind' in path ? path.kind : undefined
  return isCurrentLesson(lesson) && !(lesson.lesson_type === 'video' && kind === 'lesson')
}
