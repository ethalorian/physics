import type { SyllabusBundleView } from './reading-syllabus'

type StudentStep = { id: string; title: string; focus: string }

/** The student API intentionally omits teacher-only textbook templates. Every
 * published bundle must still be discoverable, even without a course-step row. */
export function studentReadingGroups(steps: StudentStep[], bundles: SyllabusBundleView[]) {
  const positions = new Map(steps.map((step, index) => [step.id, { step, index }]))
  return bundles.filter(bundle => [bundle.reading, bundle.practice, bundle.readingQuiz, bundle.vocabularyQuiz].some(resource => resource.id || resource.status === 'scheduled')).map(bundle => {
    const match = positions.get(bundle.step_id)
    return { bundle, title: match?.step.title ?? bundle.reading.title, focus: match?.step.focus ?? '', position: match ? match.index + 1 : null }
  }).sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity))
}
