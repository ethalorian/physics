import { assignmentPresentation, type ActivityType } from './assignment-presentation'
import { ASSIGNMENT_METADATA } from './interactive-assignments/metadata'
import type { QuizSchedule } from './quiz-schedule'

/** Display metadata only: source identity, routing and saved titles remain unchanged. */
export interface AssignmentSource {
  kind: string; title: string; sourceId?: string; key?: string; activityKey?: string
  activityType?: ActivityType; quizSchedule?: QuizSchedule; pairedKey?: string
  format?: string
}
export function sourcePresentation(source: AssignmentSource) {
  const key = source.activityKey ?? source.key ?? ''
  const slug = source.sourceId ?? (key.startsWith('interactive:') ? key.slice(12) : '')
  const interactive = ['interactive', 'simulation'].includes(source.kind) || key.startsWith('interactive:')
  const metadata = interactive ? ASSIGNMENT_METADATA.find(a => a.slug === slug) : undefined
  let activityType = source.activityType ?? metadata?.activityType
  if (!activityType && metadata) activityType = 'daily-review'
  if (!activityType && source.kind === 'quiz' && (source.pairedKey?.startsWith('worksheet:') || / · Paired quiz$/i.test(source.title))) activityType = 'worksheet-quiz'
  if (!activityType && (source.format === 'graphic-novel' || ['reflection','lesson'].includes(source.kind) && /^Graphic novel · Chapter /i.test(source.title))) activityType = 'chapter-response'
  const kind = source.kind === 'simulation' ? 'review' : source.kind === 'interactive' ? 'review' : source.kind === 'homework' ? 'video' : source.kind === 'vocabulary-set' ? 'vocabulary' : source.kind
  // These teacher evidence sources are distinct from scheduled student warm-ups.
  const evidence = ({ math: ['Math practice', 'Practice a skill. Show your method.'], reflection: ['Written reflection', 'Develop an explanation. Support it with evidence.'], choice: ['Student choice', 'Follow the directions for your chosen activity.'], presentation: ['Classroom response', 'Explain your thinking during the lesson.'] } as Record<string, [string, string]>)[kind]
  if (!activityType && evidence) return { type: kind, label: evidence[0], thinking: evidence[1], title: source.title, day: undefined, question: undefined }
  const safeKind = (['worksheet', 'quiz', 'reading', 'review', 'vocabulary', 'video', 'lesson'].includes(kind) ? kind : 'lesson') as 'worksheet' | 'quiz' | 'reading' | 'review' | 'vocabulary' | 'video' | 'lesson'
  return assignmentPresentation({ id: interactive ? 'interactive:' + slug : key, kind: safeKind, title: metadata?.title ?? source.title, activityType, quizSchedule: source.quizSchedule, courseDay: metadata?.day, topicTitle: metadata?.topicTitle, focusQuestion: metadata?.focusQuestion, status: '', complete: false })
}
export function sourceTitle(source: AssignmentSource) {
  const p = sourcePresentation(source)
  return [p.label, p.day ? 'Course day ' + p.day : '', p.title].filter(Boolean).join(' · ')
}
/** Prefix new filter values so old links retain their broader source-category meaning. */
export function matchesSourceType(source: AssignmentSource, filter: string) {
  return !filter || filter === 'all' || (filter.startsWith('type:') ? sourcePresentation(source).type === filter.slice(5) : source.kind === filter)
}
export function sourceTypeOptions(sources: readonly AssignmentSource[]) {
  return [...new Map(sources.map(source => { const p = sourcePresentation(source); return ['type:' + p.type, p.label] as const })).entries()].sort((a, b) => a[1].localeCompare(b[1]))
}
