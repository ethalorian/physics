import source from '@/data/textbook-target-map.json'
import { TEXTBOOK_SECTIONS } from '@/data/textbook-sections'
import type { ReadingTarget } from './textbook-assignments'

type ChapterMap = { sets: Record<string, number[]>; targets: Record<string, string>; sections: Record<string, string>; notes?: Record<string, string> }
export const TEXTBOOK_TARGET_MAP = source as { edition: string; reviewedAt: string; program: string; chapters: Record<string, ChapterMap> }
export const READING_QUESTION_SETS = ['Check Concepts', 'Think and Rank', 'Plug and Chug', 'Think and Explain', 'Think and Solve', 'Activities']
export type ReadingMatch = { target: ReadingTarget | null; reason: string }

/** Authored question-level alignments, never a chapter-wide or keyword fallback. */
export function textbookQuestionSet(chapter: number, number: number): string | null {
  return Object.entries(TEXTBOOK_TARGET_MAP.chapters[chapter]?.sets ?? {}).find(([, numbers]) => numbers.includes(number))?.[0] ?? null
}
export function numberedReadingReference(chapter: number, number: number, requestedSet = 'auto') {
  const actual = textbookQuestionSet(chapter, number)
  if (!actual) throw new Error(`Chapter ${chapter} has no verified question #${number}. Check the book or use “Write a question”.`)
  if (requestedSet !== 'auto' && requestedSet !== actual) throw new Error(`Chapter ${chapter} #${number} is in ${actual}, not ${requestedSet}. Choose the matching set or automatic detection.`)
  return `${actual} #${number}`
}
export function matchReadingTarget(chapter: number, reference: string, targets: ReadingTarget[], program: string, prompt = ''): ReadingMatch {
  const map = TEXTBOOK_TARGET_MAP.chapters[chapter]
  const numbered = reference.match(/^(Check Concepts|Think and Rank|Plug and Chug|Think and Explain|Think and Solve|Activities) #(\d+)$/)
  const section = reference.match(/^Section (\d+\.\d+) · Concept Check$/)?.[1]
  let slug: string | undefined
  if (section) {
    const original = TEXTBOOK_SECTIONS[chapter]?.sections.find(s => s.id === section)?.conceptCheck
    if (!original || prompt.trim() !== original.trim()) return { target: null, reason: 'This prompt was customized. Choose the target that matches your question.' }
    slug = map?.sections[section]
  } else if (numbered) {
    if (prompt.trim()) return { target: null, reason: 'This prompt was customized. Choose the target that matches your question.' }
    const n = Number(numbered[2]), actual = textbookQuestionSet(chapter, n)
    if (actual !== numbered[1]) return { target: null, reason: actual ? `The book places #${n} in ${actual}. Check this reference.` : 'This question number has not been verified. Check the reference and choose a target.' }
    if (map?.notes?.[n]) return { target: null, reason: map.notes[n] }
    slug = map?.targets[n]
  } else return { target: null, reason: 'Choose a mastery target for this custom question.' }
  if (program !== TEXTBOOK_TARGET_MAP.program) return { target: null, reason: 'Automatic mappings currently use the Physics curriculum. Choose a target from this class’s curriculum.' }
  if (!slug) return { target: null, reason: 'No reviewed target match for this question yet. Choose an appropriate target before saving.' }
  const target = targets.find(t => t.slug === slug && (t.program ?? 'physics') === program)
  return target ? { target, reason: 'Textbook match. This question provides evidence toward the target; the teacher determines mastery.' } : { target: null, reason: 'The mapped target is unavailable in this class’s curriculum. Choose a current target.' }
}
export function readingMappingCoverage(chapter: number, targets: ReadingTarget[], program: string) {
  const map = TEXTBOOK_TARGET_MAP.chapters[chapter]
  const slugs = new Set(targets.filter(t => (t.program ?? 'physics') === program).map(t => t.slug))
  return { total: Object.values(map?.sets ?? {}).flat().length, mapped: program === TEXTBOOK_TARGET_MAP.program ? Object.values(map?.targets ?? {}).filter(slug => slugs.has(slug)).length : 0 }
}
