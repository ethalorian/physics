import {demand} from '@/lib/assessment-demand'
import { HONORS_READING_MAP, type HonorsReading } from './openstax-physics'
import type { ReadingAssignment, ReadingCourse, ReadingTarget } from './textbook-assignments'
import type { LearningWord } from './vocab-learning'
import type { Quiz, QuizQuestion } from './quizzes/types'

export interface SyllabusWord { term: string; definition: string }
export interface SyllabusCheck { prompt: string; guide: string; target: string; reference?: string }
export interface SyllabusStep {
  id: string; unit: string; title: string; focus: string; chapter: number; sections: string[];
  prerequisites: string[]; words: SyllabusWord[]; vocabularyTarget: string;
  readingCheck: SyllabusCheck; quizCheck: SyllabusCheck; honors: SyllabusCheck;
  passage?: string; honorsReading?: HonorsReading; sourceBook?: 'hewitt' | 'openstax'; selectionRequired?: boolean;
}
export interface SyllabusBundle {
  course_id: string; step_id: string; reading_id: string; practice_id: string;
  reading_quiz_id: string; vocabulary_quiz_id: string; created_at: string;
}
export interface SyllabusResource { id: string; title: string; status: string; state?: string; version?: number; opens_at?: string | null; due_at?: string | null; due_on?: string | null }
export interface SyllabusBundleView extends SyllabusBundle {
  reading: SyllabusResource; practice: SyllabusResource; readingQuiz: SyllabusResource; vocabularyQuiz: SyllabusResource;
}
export interface SyllabusCatalog {
  courses: ReadingCourse[]; steps: SyllabusStep[]; bundles: SyllabusBundleView[];
  targets: ReadingTarget[]; readOnly: boolean; textbookSteps?: SyllabusStep[];
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
/** Shared by draft creation and the read-only preview, so section scope and
 * required responses stay identical before and after preparing an assignment. */
export function buildSyllabusReading(step: SyllabusStep, steps: SyllabusStep[], course: ReadingCourse, target: (slug: string) => string, newId: () => string): ReadingAssignment {
  if (step.sourceBook === 'openstax' && course.track !== 'honors') throw Error('OpenStax readings require an Honors class.')
  if (course.program !== 'physics') throw Error('Choose a Physics class for this syllabus.')
  const honorsReading = step.sourceBook === 'hewitt' ? null : step.honorsReading ?? HONORS_READING_MAP[step.id] ?? null
  const prior = step.prerequisites.map(id => steps.find(s => s.id === id)).filter((s): s is SyllabusStep => !!s)
  const practiceChecks = [
    {...step.readingCheck,demand:demand('Understand',2,'Explain the reading’s idea using its evidence and representations.')},
    {...step.quizCheck,reference:'Apply the idea',demand:demand('Apply',2,'Apply the reading’s model to the supplied situation.')},
    {target:step.readingCheck.target,reference:'Evaluate evidence',prompt:`Choose a claim about ${step.title.toLowerCase()} from the assigned reading. State the claim and identify a particular example, diagram, or calculation that supports it. Explain the connection, identify an assumption or limit, and describe evidence that would challenge an overgeneralization of the claim.`,demand:demand('Evaluate',3,'Judge a claim using source evidence, assumptions and a disconfirming condition.')},
    {target:step.readingCheck.target,reference:'Create & transfer',prompt:`Create a different everyday situation that uses the idea of ${step.title.toLowerCase()}. State the conditions, use the reading’s model to make a prediction, and show a labeled sketch, calculation, or connected explanation. Change one condition, explain how your prediction changes, and propose a way to check it.`,demand:demand('Create',3,'Construct and test a new application under an explicit change in conditions.')},
  ]
  return { id: newId(), course_id: course.id, title: step.title, chapter: step.chapter, section_ids: step.sections,
      reading: course.track === 'honors' && honorsReading ? `OpenStax AP Physics 2e · §${honorsReading.sections.join(', ')} · pp. ${honorsReading.from}–${honorsReading.to}` : step.passage ? 'Course reading · ' + step.title : `Hewitt · Sections ${step.sections.join(', ')}`,
      honors_reading: course.track === 'honors' ? honorsReading : null, passage: step.passage ?? null, instructions: `${step.focus}\n\nBefore reading: preview ${step.words.map(w => w.term).join(', ')}.\nAfter reading: explain the idea in your own words, then practice the vocabulary.${prior.length ? '\nBring back: ' + prior.map(s => s.title).join('; ') + '.' : ''}`,
      questions: practiceChecks.map(q => ({ id: newId(), reference: q.reference ?? 'Read & explain', prompt: q.prompt, target_id: target(q.target), demand:q.demand })),
      due_at: null, status: 'draft', version: 0, created_at: new Date().toISOString() }
}

export function buildSyllabusDrafts(step: SyllabusStep, steps: SyllabusStep[], course: ReadingCourse, targets: ReadingTarget[], newId: () => string): SyllabusDrafts {
  if (step.sourceBook === 'openstax' && course.track !== 'honors') throw Error('OpenStax readings require an Honors class.')
  if (course.program !== 'physics') throw Error('Choose a Physics class for this syllabus.')
  const target = (slug: string) => {
    const match = targets.find(t => t.slug === slug && t.program === 'physics')
    if (!match) throw Error(`The learning target ${slug} is unavailable. Restore its mapping before assigning this step.`)
    return match.id
  }
  const prior = step.prerequisites.map(id => steps.find(s => s.id === id)).filter((s): s is SyllabusStep => !!s)
  const checks = [step.quizCheck, ...(prior.length ? [prior[0].quizCheck] : [])]
  if (course.track === 'honors') checks.push(step.honors)
  const question = (q: SyllabusCheck): QuizQuestion => ({ id: newId(), kind: 'written', prompt: q.prompt, guide: q.guide, points: 3, target_id: target(q.target) })
  const base = { course_id: course.id, instructions: 'Explain your thinking. Words, labeled sketches, and equations may support your explanation. Your teacher reviews the evidence.', grade_mode: 'credit' as const, status: 'draft' as const, version: 0, due_at: null, student_ids: null, source_quiz_id: null, language_level: course.track === 'honors' ? 'honors' as const : 'cpa' as const }
  const vocabularyTarget = target(step.vocabularyTarget)
  if (targets.find(t => t.id === vocabularyTarget)?.domain !== 'knowledge') throw Error('Vocabulary needs a Knowledge target.')
  return {
    step_id: step.id, unit: step.unit, words: step.words, vocabularyTarget,
    reading: buildSyllabusReading(step, steps, course, target, newId),
    readingQuiz: { ...base, id: newId(), title: `${step.title} · Reading check`, kind: 'understanding', questions: [...checks.map(question),{id:newId(),kind:'written',points:4,target_id:target(step.readingCheck.target),prompt:`Develop a new example of ${step.title.toLowerCase()} that could expose a common misunderstanding. State the conditions, give the correct reasoning and a plausible incorrect conclusion, and explain which evidence distinguishes them.`,guide:'One point each: specific new example; accurate physical reasoning; plausible substantive misconception; evidence that discriminates between the explanations.',demand:demand('Evaluate',3,'Create and evaluate a counterexample using evidence, not a remembered statement.')}] },
    vocabularyQuiz: { ...base, id: newId(), title: `${step.title} · Vocabulary check`, kind: 'vocabulary',
      questions: [...step.words.map((word):QuizQuestion => ({ id: newId(), kind: 'written', points: 2, target_id: vocabularyTarget,
        prompt: `Explain “${word.term}” in your own words. Use it in a specific example connected to ${step.title.toLowerCase()}.`,
        guide: `Meaning (1 point): ${word.definition} Use (1 point): a physically correct, specific example that uses the word consistently with this meaning. Accept equivalent wording and labeled sketches; do not deduct for language errors.`, vocabulary: [word.term], demand:demand('Understand',2,'Explain a meaning and connect it to a concrete example.') })),{id:newId(),kind:'written',points:4,target_id:vocabularyTarget,prompt:`Design one situation connecting ${step.words.map(w=>w.term).join(', ')}. Use each word accurately. Change one condition, predict the effect and explain what evidence would test your prediction.`,guide:'One point each: coherent situation; accurate word use; justified prediction; relevant test. Use the supplied vocabulary meanings to judge content.',vocabulary:step.words.map(w=>w.term),demand:demand('Create',3,'Connect technical meanings in a new model, prediction and test.')}] },
  }
}
