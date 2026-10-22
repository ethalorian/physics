import type { ReadingAssignment, ReadingQuestion } from '@/lib/textbook-assignments'

export type TextbookId = 'hewitt' | 'openstax'
export type SourceFigureCoverage = {
  sourceLabel: string; printedPage: number; section: string
  treatment: 'adapted' | 'pdf-only'; anchors: readonly string[]; note: string
}
export type ReaderCheck = {
  title: string; prompt: string; options: readonly string[]; correct: number
  hint: string; feedback: readonly string[]; teacher: string
}
export type ReaderSection = {
  id: string; number: string; title: string; heading: string; subtitle: string
  pages: string; page: number; sourceUrl: string; target: string; targetSlug?: string
  check: ReaderCheck
}
/** Content and interactions plug into one reader. Source identifiers never replace assignment IDs. */
export type InteractiveChapterDefinition = {
  book: TextbookId; bookTitle: string; chapter: number; title: string; contentVersion: string
  language: 'en' | 'es' | 'pt'; pdfUrl: string; focus: string; guidingQuestion: string; scopeNote: string
  sections: readonly ReaderSection[]
  visualCoverage: readonly SourceFigureCoverage[]
  teaching: { before: string; during: string; after: string }
  synthesisIntro: string; reasoningRoutine: string
  transfer: { prompt: string; starter: string; model: string }
  questionSection: (q: ReadingQuestion) => string | null
  isSectionAssigned: (a: ReadingAssignment | undefined, s: ReaderSection) => boolean
}

/** An OpenStax assignment can also contain a Hewitt foundation. Keep the primary sources distinct. */
export function assignmentSource(a: ReadingAssignment): { book: TextbookId; sections: string[]; chapter: number | null } | null {
  if (a.honors_reading) {
    const chapters = [...new Set(a.honors_reading.sections.map(id => Number(id.split('.')[0])))]
    return { book: 'openstax', sections: a.honors_reading.sections, chapter: chapters.length === 1 ? chapters[0] : null }
  }
  if (a.passage) return null
  return { book: 'hewitt', sections: a.section_ids, chapter: a.chapter }
}

export function validateChapterDefinition(d: InteractiveChapterDefinition) {
  if (!d.sections.length || !d.contentVersion || !d.title) throw new Error('A chapter needs reviewed content and sections.')
  const ids = new Set<string>(), numbers = new Set<string>()
  for (const s of d.sections) {
    if (!/^[a-z][a-z0-9-]*$/.test(s.id) || ['opening', 'synthesis', 'assignment-turn-in', 'chapter-content'].includes(s.id) || ids.has(s.id) || numbers.has(s.number)) throw new Error(`Duplicate or invalid section ${s.id}`)
    ids.add(s.id); numbers.add(s.number)
    if (!s.heading || !s.target || !Number.isInteger(s.page) || s.page < 1 || !/^https:\/\//.test(s.sourceUrl)) throw new Error(`Incomplete source or target for ${s.id}`)
    if (s.check.options.length < 2 || s.check.feedback.length !== s.check.options.length || !Number.isInteger(s.check.correct) || s.check.correct < 0 || s.check.correct >= s.check.options.length) throw new Error(`Incomplete feedback for ${s.id}`)
  }
  if (!d.visualCoverage.length) throw new Error('Inventory the source figures before registering a chapter.')
  const figures = new Set<string>()
  for (const f of d.visualCoverage) {
    if (figures.has(f.sourceLabel) || !f.sourceLabel || !numbers.has(f.section) || !Number.isInteger(f.printedPage) || f.printedPage < 1 || !f.note || (f.treatment === 'adapted' && !f.anchors.length) || f.anchors.some(id => !/^[a-z][a-z0-9-]*$/.test(id))) throw new Error(`Incomplete visual coverage for source figure ${f.sourceLabel}`)
    figures.add(f.sourceLabel)
  }
  return d
}
