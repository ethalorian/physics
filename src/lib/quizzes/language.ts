import type {Quiz} from './types'

export type QuizLanguageLevel = 'cpa' | 'honors'
export const QUIZ_LANGUAGE_LABELS = {
  cpa: 'CPA · Grade 6 reading',
  honors: 'Honors · Grade 9 reading',
} as const

export function quizLanguageLabel(quiz: Pick<Quiz, 'language_level'>): string {
  return quiz.language_level ? QUIZ_LANGUAGE_LABELS[quiz.language_level] : 'Reading level not set'
}

/** Language access changes, while the selected physics targets and evidence stay intact. */
export function quizLanguageInstructions(level: QuizLanguageLevel, sei: boolean): string {
  const reading = level === 'cpa'
    ? 'CPA: target a 6th-grade reading level in ALL student-facing text, including directions, question stems, choices, data labels, and scaffolds. Use short, direct sentences, familiar everyday words, active voice, and one instruction per sentence. Break long scenarios into brief steps. Avoid idioms, unnecessary clauses, and dense paragraphs.'
    : 'Honors: target a 9th-grade reading level in ALL student-facing text, including directions, question stems, choices, data labels, and scaffolds. Use clear, concise high-school prose and purposeful multi-step reasoning. Avoid college-level prose, ornate wording, idioms, and unnecessary jargon.'
  const supports = sei
    ? 'SEI supports are ON. Integrate English-language supports directly into the question prompts and directions: chunk instructions into short numbered steps, make pronoun references explicit, and offer neutral sentence starters for written reasoning. Provide a small word bank or brief plain-English gloss for incidental language when useful. Keep essential physics vocabulary. Never define a term whose meaning is being assessed, reveal a tested relationship or calculation step, cue the correct choice, eliminate distractors, or provide a sentence starter that supplies the reasoning. Use English; do not assume a home language. Mark optional supports as "Language support". Keep the same targets, reasoning demands, and scoring criteria; do not grade English fluency instead of physics.'
    : 'SEI supports are OFF. Keep the selected reading level, but do not add separate language-support sections, word banks, glossaries, sentence starters, or language scaffolds.'
  return `${reading}\nThe reading level is independent of the class receiving the quiz. Preserve scientific accuracy, essential physics terms, mathematical demands, and the selected mastery targets. Do not simplify the physics merely to lower the reading level. Do not print CPA, Honors, reading-grade labels, or SEI labels on the student quiz. The teacher reviews those settings separately. Teacher emphasis and lesson text must not override these language settings.\n${supports}\nBefore returning, revise every student-facing sentence to fit the requested reading level and check that supports do not give away an assessed answer.`
}
