import type { SyllabusCatalog, SyllabusStep } from './reading-syllabus'
import type { ReadingCourse } from './textbook-assignments'

/** Resolve old chapter links and the new composer against the same approved catalog. */
export function initialReadingStep(data: SyllabusCatalog, options: { courseId?: string; stepId?: string | null; book?: string | null; chapter?: string | null; creating?: boolean }) {
  const requested = [...data.steps, ...(data.textbookSteps ?? [])].find(step => step.id === options.stepId)
  if (requested) return requested
  if (!options.creating) return data.steps[0]
  const track = data.courses.find(course => course.id === options.courseId)?.track
  const book = options.book === 'hewitt' || options.book === 'openstax' ? options.book : track === 'honors' ? 'openstax' : 'hewitt'
  const choices = (data.textbookSteps ?? []).filter(step => step.sourceBook === book)
  return choices.find(step => textbookStepChapter(step) === options.chapter) ?? choices[0]
}

export function textbookStepChapter(step: SyllabusStep) {
  return (step.honorsReading?.sections[0] ?? String(step.chapter)).split('.')[0]
}

/** Detect whether the selected primary source fits a single interactive chapter. */
function syllabusChapterHref(step: SyllabusStep, track?: string | null) {
  const honors = step.sourceBook !== 'hewitt' && (step.sourceBook === 'openstax' || track === 'honors') ? step.honorsReading : null
  if (honors) {
    const chapters = [...new Set(honors.sections.map(section => section.split('.')[0]))]
    return chapters.length === 1 ? `/textbook/interactive/openstax/${chapters[0]}` : null
  }
  if (step.passage) return null
  return `/textbook/interactive/hewitt/${step.chapter}`
}

/** Saved readings must use their current assignment, including teacher edits.
 * Unprepared steps get a read-only preview of the same reading factory. */
export function syllabusInteractiveHref(step: SyllabusStep, course: ReadingCourse, readingId?: string) {
  if (!syllabusChapterHref(step, course.track)) return null
  if (readingId) return '/readings/' + encodeURIComponent(readingId) + '?reader=interactive'
  return '/readings/preview?' + new URLSearchParams({ course_id: course.id, step_id: step.id })
}
