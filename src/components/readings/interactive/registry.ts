import type { ReadingAssignment } from '@/lib/textbook-assignments'
import { assignmentSource, type InteractiveChapterDefinition } from './reader-contract'
import { chapterTwoDefinition } from './chapter-two-definition'
import { CONNECTED_CHAPTERS } from './connected-chapter-catalog'

/** Register a chapter only after its coverage, source map, and interactions pass review. */
export const INTERACTIVE_CHAPTERS: readonly InteractiveChapterDefinition[] = [chapterTwoDefinition, ...CONNECTED_CHAPTERS.map(c => c.definition)]
export function interactiveChapterForAssignment(assignment: ReadingAssignment, language = 'en') {
  const source = assignmentSource(assignment)
  if (!source) return null
  return INTERACTIVE_CHAPTERS.find(c => c.book === source.book && c.chapter === source.chapter && c.language === language && source.sections.every(id => c.sections.some(s => s.number === id))) ?? null
}
