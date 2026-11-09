import type { ChoiceEdition } from './student-choice'

export type BinderSource = { edition: ChoiceEdition; day: number }
export type BinderSection = 'A' | 'B' | 'C' | 'D' | 'E'
export type BinderLesson = BinderSource & {
  title: string; subtitle: string; paragraphs: string[]; packet: string
  sections: Record<BinderSection, { title: string; text: string; box: number[] }>
  words: { term: string; definition: string }[]
}

export function binderStepId({edition, day}: BinderSource) {
  return `binder-u1-${edition}-${String(day).padStart(2, '0')}`
}

export function binderDayLabel(day: number) { return `Unit 1 Day ${day}` }

// Course passages already have a dedicated field. Only these exact, versioned
// references resolve to the read-only published sources.
export function binderPassage(source: BinderSource) { return 'Student Choice Binder v1 / ' + binderStepId(source) }
export function binderSource(passage?: string | null): BinderSource | null {
  const prefix = 'Student Choice Binder v1 / '
  return passage?.startsWith(prefix) ? binderSourceForStep(passage.slice(prefix.length)) : null
}
export function binderSourceForStep(stepId: string): BinderSource | null {
  const match = /^binder-u1-(cpa|honors)-(0[1-9]|1[0-9]|2[0-2])$/.exec(stepId)
  return match ? { edition: match[1] as ChoiceEdition, day: Number(match[2]) } : null
}
export function binderMaterials({edition, day}: BinderSource) {
  return '/student-choice-pages/unit-1/interactive-v1/' + edition + '-' + String(day).padStart(2, '0')
}
export function binderPreview({edition, day}: BinderSource) { return '/readings/binder/' + edition + '/' + day }
