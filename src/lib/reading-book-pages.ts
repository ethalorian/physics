import pageMap from '@/data/textbook-page-map.json'
import { TEXTBOOK_SECTIONS } from '@/data/textbook-sections'
import { textbookQuestionSet } from './textbook-target-mapping'
import type { ReadingAssignment, ReadingQuestion } from './textbook-assignments'
import type { TextbookLanguage } from '@/data/textbook'

const chapters = pageMap as Record<string, { offset: number; pages: number; questions: Record<string, number> }>
export type ReadingBookPage = { pdfPage: number; printedPage: number }

function bookPage(chapter: number, pdfPage: number | undefined): ReadingBookPage | null {
  const map = chapters[chapter]
  return map && pdfPage && pdfPage >= 1 && pdfPage <= map.pages
    ? { pdfPage, printedPage: pdfPage + map.offset } : null
}

export function readingSectionPage(chapter: number, sectionId: string) {
  const section = TEXTBOOK_SECTIONS[chapter]?.sections.find(s => s.id === sectionId)
  return section ? bookPage(chapter, section.page - chapters[chapter]?.offset) : null
}

/** Resolve only verified references; a number in a custom prompt is not a book question. */
export function readingQuestionPage(chapter: number, question: Pick<ReadingQuestion, 'reference'>) {
  const numbered = question.reference.match(/^(Check Concepts|Think and Rank|Plug and Chug|Think and Explain|Think and Solve|Activities) #(\d+)$/)
  if (numbered && textbookQuestionSet(chapter, Number(numbered[2])) === numbered[1]) {
    return bookPage(chapter, chapters[chapter]?.questions[numbered[2]])
  }
  const section = question.reference.match(/^Section (\d+\.\d+) · Concept Check$/)?.[1]
  return section ? readingSectionPage(chapter, section) : null
}

export function readingStartPage(assignment: Pick<ReadingAssignment, 'chapter' | 'section_ids'>) {
  const selected = assignment.section_ids.flatMap(id => readingSectionPage(assignment.chapter, id) ?? [])
  return selected.sort((a, b) => a.pdfPage - b.pdfPage)[0] ?? bookPage(assignment.chapter, 1)
}

export function readingBookUrl(chapter: number, page?: ReadingBookPage | null, language: TextbookLanguage = 'en') {
  return `/api/textbook/${chapter}${language === 'en' ? '' : `?lang=${language}`}${page ? `#page=${page.pdfPage}` : ''}`
}
