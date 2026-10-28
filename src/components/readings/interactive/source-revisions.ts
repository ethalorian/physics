import revisions from '@/data/interactive-reader-revisions.json'
import type { ConnectedChapter } from './lesson-contract'

export type SourceRevision = {
  sourcePages: number[]
  restored: string
  opening: string
  closing?: string
}
type ChapterRevision = { invitation: string; sections: Record<string, SourceRevision> }
export const SOURCE_REVISIONS = revisions as Record<string, ChapterRevision>

/** Book-specific prose: shared models must not erase a source's teaching examples.
 * IDs, checks, assignment scope and contentVersion remain stable so this editorial
 * pass preserves saved practice, notes, answers and reading position.
 */
export function reviseChapter(chapter: ConnectedChapter): ConnectedChapter {
  const revision = SOURCE_REVISIONS[`${chapter.definition.book}:${chapter.definition.chapter}`]
  if (!revision) return chapter
  const lessons = chapter.lessons.map(lesson => {
    const section = revision.sections[lesson.number]
    return section ? {
      ...lesson,
      paragraphs: [section.opening, ...lesson.paragraphs, ...(section.closing ? [section.closing] : [])],
    } : lesson
  })
  return { ...chapter, lessons, intro: { ...chapter.intro, invitation: revision.invitation } }
}
