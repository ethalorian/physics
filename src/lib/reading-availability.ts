import availability from '@/data/interactive-reading-availability.json'
import { assignmentSource } from '@/components/readings/interactive/reader-contract'
import { HONORS_READING_MAP } from './openstax-physics'
import type { ReadingAssignment } from './textbook-assignments'
import type { SyllabusStep } from './reading-syllabus'

export const INTERACTIVE_READING_ONLY = 'Choose an interactive reading. Basic textbook readings are no longer available to assign.'
type ReadingSource = Pick<ReadingAssignment, 'chapter' | 'section_ids' | 'passage' | 'honors_reading'>

/** Generated from the reader registry; prebuild verifies it before publication. */
export function isInteractiveReading(reading: ReadingSource) {
  if (!Array.isArray(reading.section_ids) || !Number.isInteger(reading.chapter)) return false
  if (reading.honors_reading && (!Array.isArray(reading.honors_reading.sections) || !reading.honors_reading.sections.length)) return false
  const source = assignmentSource(reading as ReadingAssignment)
  return !!source && availability.some(chapter => chapter.book === source.book && chapter.chapter === source.chapter && chapter.language === 'en' && source.sections.every(id => chapter.sections.includes(id)))
}

export function isInteractiveSyllabusStep(step: SyllabusStep, track?: string | null) {
  if (step.sourceBook === 'openstax' && track !== 'honors') return false
  return isInteractiveReading({
    chapter: step.chapter, section_ids: step.sections, passage: step.passage ?? null,
    honors_reading: step.sourceBook !== 'hewitt' && (step.sourceBook === 'openstax' || track === 'honors')
      ? step.honorsReading ?? HONORS_READING_MAP[step.id] ?? null : null,
  })
}
