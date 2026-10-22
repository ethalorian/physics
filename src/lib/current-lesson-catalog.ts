import { isCatalogLesson } from '@/lib/retired-curriculum'
export interface CurrentLessonMetadata {
  unit_id?: string | null
  program?: string | null
  lesson_type?: string | null
  content_blocks?: { blocks?: unknown; presentation?: unknown; learningPath?: unknown; reflection?: unknown } | null
  presentation?: unknown
  learning_path?: unknown
  reflection_assignment?: unknown
}

/** A lightweight projection for catalogs that must not load lesson bodies. */
export const CURRENT_LESSON_FIELDS = 'unit_id,presentation:content_blocks->>presentation,learning_path:content_blocks->learningPath,reflection_assignment:content_blocks->reflection' as const

function isReflection(lesson: CurrentLessonMetadata): boolean {
  const value = lesson.content_blocks?.reflection ?? lesson.reflection_assignment
  return !!value && typeof value === 'object' && 'version' in value && value.version === 1 && 'kind' in value && (value.kind === 'manga' || value.kind === 'story')
}

/** Current instruction and review choices only. Historical ratings stay independent. */
export function isCurrentLesson(lesson: CurrentLessonMetadata): boolean {
  if (lesson.program === 'projects' || !isCatalogLesson(lesson)) return false
  const physics = lesson.program === 'physics' || /^unit-[1-8]$/.test(lesson.unit_id ?? '')
  const presentation = lesson.content_blocks?.presentation ?? lesson.presentation
  const learningPath = lesson.content_blocks?.learningPath ?? lesson.learning_path
  return !physics || isReflection(lesson) || Boolean(presentation === 'physics-path' && learningPath)
}

/** Video concept lessons support a course plan; they are not its classroom session. */
export function isCurrentClassroomLesson(lesson: CurrentLessonMetadata): boolean {
  const path = lesson.content_blocks?.learningPath ?? lesson.learning_path
  const kind = path && typeof path === 'object' && 'kind' in path ? path.kind : undefined
  return isCurrentLesson(lesson) && !isReflection(lesson) && !(lesson.lesson_type === 'video' && kind === 'lesson')
}
