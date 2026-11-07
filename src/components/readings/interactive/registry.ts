import type { ReadingAssignment } from '@/lib/textbook-assignments'
import { assignmentSource, type InteractiveChapterDefinition } from './reader-contract'
import { etfChapters } from './etf-chapters'
import { chapterTwoDefinition } from './chapter-two-definition'
import { CONNECTED_CHAPTERS } from './connected-chapter-catalog'

/** Register a chapter only after its coverage, source map, and interactions pass review. */
export const INTERACTIVE_CHAPTERS: readonly InteractiveChapterDefinition[] = [...etfChapters, chapterTwoDefinition, ...CONNECTED_CHAPTERS.map(c => c.definition)]
export function interactiveChapterForAssignment(assignment: ReadingAssignment, language = 'en') {
  const source = assignmentSource(assignment)
  if (!source) return null
  // The original ETF edition is English. A physics textbook language preference
  // should not hide this book or change the learner’s preference for other books.
  const editionLanguage = source.book === 'etf' ? 'en' : language
  return INTERACTIVE_CHAPTERS.find(c => c.book === source.book && c.chapter === source.chapter && c.language === editionLanguage && source.sections.every(id => c.sections.some(s => s.number === id))) ?? null
}
