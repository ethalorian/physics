import { HONORS_READING_MAP, type HonorsReading } from './openstax-physics'
import type { ReadingAssignment, ReadingCourse, ReadingTarget } from './textbook-assignments'
import type { LearningWord } from './vocab-learning'
import type { Quiz, QuizQuestion } from './quizzes/types'

export interface SyllabusWord { term: string; definition: string }
export interface SyllabusCheck { prompt: string; guide: string; target: string }
export interface SyllabusStep {
  id: string; unit: string; title: string; focus: string; chapter: number; sections: string[];
  prerequisites: string[]; words: SyllabusWord[]; vocabularyTarget: string;
  readingCheck: SyllabusCheck; quizCheck: SyllabusCheck; honors: SyllabusCheck;
  passage?: string; honorsReading?: HonorsReading;
}
export interface SyllabusBundle {
  course_id: string; step_id: string; reading_id: string; practice_id: string;
  reading_quiz_id: string; vocabulary_quiz_id: string; created_at: string;
}
export interface SyllabusResource { id: string; title: string; status: string; state?: string; version?: number; due_at?: string | null; due_on?: string | null }
export interface SyllabusBundleView extends SyllabusBundle {
  reading: SyllabusResource; practice: SyllabusResource; readingQuiz: SyllabusResource; vocabularyQuiz: SyllabusResource;
}
export interface SyllabusCatalog {
  courses: ReadingCourse[]; steps: SyllabusStep[]; bundles: SyllabusBundleView[];
  targets: ReadingTarget[]; readOnly: boolean;
}
export interface SyllabusDrafts {
  reading: ReadingAssignment; readingQuiz: Quiz; vocabularyQuiz: Quiz;
  words: SyllabusWord[]; vocabularyTarget: string; unit: string; step_id: string;
}
export const SYLLABUS_UNITS = [
  ['unit-1', 'Motion & forces'], ['unit-2', 'Gravitation & fields'], ['unit-3', 'Momentum & collisions'],
  ['unit-4', 'Energy & work'], ['unit-5', 'Thermal physics'], ['unit-6', 'Waves, sound & light'],
  ['unit-7', 'Electricity & magnetism'], ['unit-8', 'Car project connections'],
] as const

/** Suggestions are teacher-paced. Publication and evidence never imply mastery. */
export function nextSyllabusStep(steps: Pick<SyllabusStep, 'id'>[], bundles: SyllabusBundleView[]) {
  return steps.find(step => !bundles.some(b => b.step_id === step.id && b.reading.status !== 'draft'))?.id ?? null
}
export function syllabusWordKey(term: string) { return term.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ') }
export function resolveSyllabusWords(words: SyllabusWord[], available: LearningWord[], unitSetIds: Set<string>) {
  return words.map(word => ({ ...word, existing: available.find(w => unitSetIds.has(w.vocabulary_set_id) && syllabusWordKey(w.term) === syllabusWordKey(word.term)) ?? null }))
}
export function buildSyllabusDrafts(step: SyllabusStep, steps: SyllabusStep[], course: ReadingCourse, targets: ReadingTarget[], newId: () => string): SyllabusDrafts {
  if (course.program !== 'physics') throw Error('Choose a Physics class for this syllabus.')
  const target = (slug: string) => {
    const match = targets.find(t => t.slug === slug && t.program === 'physics')
    if (!match) throw Error(`The learning target ${slug} is unavailable. Restore its mapping before assigning this step.`)
    return match.id
  }
  const prior = step.prerequisites.map(id => steps.find(s => s.id === id)).filter((s): s is SyllabusStep => !!s)
  const practiceChecks = [step.readingCheck]
  const checks = [step.quizCheck, ...(prior.length ? [prior[0].quizCheck] : [])]
  if (course.track === 'honors') checks.push(step.honors)
  const question = (q: SyllabusCheck): QuizQuestion => ({ id: newId(), kind: 'written', prompt: q.prompt, guide: q.guide, points: 3, target_id: target(q.target) })
  const base = { course_id: course.id, instructions: 'Explain your thinking. Words, labeled sketches, and equations may support your explanation. Your teacher reviews the evidence.', grade_mode: 'credit' as const, status: 'draft' as const, version: 0, due_at: null, student_ids: null, source_quiz_id: null, language_level: course.track === 'honors' ? 'honors' as const : 'cpa' as const }
  const vocabularyTarget = target(step.vocabularyTarget)
  if (targets.find(t => t.id === vocabularyTarget)?.domain !== 'knowledge') throw Error('Vocabulary needs a Knowledge target.')
  return {
    step_id: step.id, unit: step.unit, words: step.words, vocabularyTarget,
    reading: { id: newId(), course_id: course.id, title: step.title, chapter: step.chapter, section_ids: step.sections,
      reading: course.track === 'honors' && HONORS_READING_MAP[step.id] ? `OpenStax AP Physics 2e · §${HONORS_READING_MAP[step.id].sections.join(', ')} · pp. ${HONORS_READING_MAP[step.id].from}–${HONORS_READING_MAP[step.id].to}` : step.passage ? 'Course reading · ' + step.title : `Hewitt · Sections ${step.sections.join(', ')}`,
      honors_reading: course.track === 'honors' ? HONORS_READING_MAP[step.id] ?? null : null, passage: step.passage ?? null, instructions: `${step.focus}\n\nBefore reading: preview ${step.words.map(w => w.term).join(', ')}.\nAfter reading: explain the idea in your own words, then practice the vocabulary.${prior.length ? '\nBring back: ' + prior.map(s => s.title).join('; ') + '.' : ''}`,
      questions: practiceChecks.map(q => ({ id: newId(), reference: 'Read & explain', prompt: q.prompt, target_id: target(q.target) })),
      due_at: null, status: 'draft', version: 0, created_at: new Date().toISOString() },
    readingQuiz: { ...base, id: newId(), title: `${step.title} · Reading check`, kind: 'understanding', questions: checks.map(question) },
    vocabularyQuiz: { ...base, id: newId(), title: `${step.title} · Vocabulary check`, kind: 'vocabulary',
      questions: step.words.map(word => ({ id: newId(), kind: 'written', points: 2, target_id: vocabularyTarget,
        prompt: `Explain “${word.term}” in your own words. Use it in a specific example connected to ${step.title.toLowerCase()}.`,
        guide: `Meaning (1 point): ${word.definition} Use (1 point): a physically correct, specific example that uses the word consistently with this meaning. Accept equivalent wording and labeled sketches; do not deduct for language errors.`, vocabulary: [word.term] })) },
  }
}
