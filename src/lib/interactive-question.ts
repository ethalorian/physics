import type { AssessmentDemand } from './assessment-demand'
import { stageHasEvidence, validateProblemStage, type ProblemStageResponse } from './problem-response'

type PartBase = { id: string; label: string; prompt: string; hint?: string }
export type InteractivePart = PartBase & (
  | { kind: 'choice'; options: { id: string; text: string }[]; answer?: string; explanation?: string }
  | { kind: 'number'; unit: string; answer?: number; tolerance?: number; explanation?: string }
  | { kind: 'reasoning' }
)
export interface InteractiveTask {
  title: string
  format: 'concept' | 'application' | 'transfer' | 'design'
  prompt: string
  parts: InteractivePart[]
  demand?: AssessmentDemand
}
export type InteractiveAnswer = { version: 1; answers: Record<string, string | ProblemStageResponse>; checks?: Record<string, 'match' | 'mismatch'> }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
export function partComplete(part: InteractivePart, value: unknown): boolean {
  if (part.kind === 'choice') return typeof value === 'string' && part.options.some(o => o.id === value)
  if (part.kind === 'number') return typeof value === 'string' && /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(value.trim()) && Number.isFinite(Number(value))
  try { return stageHasEvidence(validateProblemStage(value)) } catch { return false }
}
export function interactiveComplete(task: InteractiveTask | undefined, value: unknown): boolean {
  if (!task || !task.parts.length || !object(value) || value.version !== 1 || !object(value.answers)) return false
  return task.parts.every(part => partComplete(part, (value.answers as Record<string, unknown>)[part.id]))
}
/** Only authored parts are saved; correctness is recomputed from the server's content. */
export function checkInteractiveAnswer(task: InteractiveTask, incoming: unknown): InteractiveAnswer {
  if (!object(incoming) || incoming.version !== 1 || !object(incoming.answers)) throw Error('Use the interactive question response.')
  const answers: InteractiveAnswer['answers'] = {}, checks: NonNullable<InteractiveAnswer['checks']> = {}
  for (const part of task.parts) {
    const value = incoming.answers[part.id]
    if (!partComplete(part, value)) throw Error(`Complete ${part.label.toLowerCase()} before saving this question.`)
    answers[part.id] = part.kind === 'reasoning' ? validateProblemStage(value) : String(value).trim()
    if (part.kind === 'choice' && part.answer !== undefined) checks[part.id] = value === part.answer ? 'match' : 'mismatch'
    if (part.kind === 'number' && part.answer !== undefined) checks[part.id] = Math.abs(Number(value) - part.answer) <= (part.tolerance ?? 0.000001) ? 'match' : 'mismatch'
  }
  return { version: 1, answers, checks }
}
export function studentInteractiveTask(task: InteractiveTask): InteractiveTask {
  return { ...task, parts: task.parts.map(part => {
    if (part.kind === 'reasoning') return part
    const { answer, explanation, ...safe } = part
    void answer; void explanation
    return safe
  }) }
}
export function interactiveTaskIssues(task: unknown): string[] {
  if (!object(task) || typeof task.title !== 'string' || !task.title.trim() || typeof task.prompt !== 'string' || !task.prompt.trim() || !['concept','application','transfer','design'].includes(String(task.format)) || !Array.isArray(task.parts) || task.parts.length < 1 || task.parts.length > 8) return ['Add a title, scenario, format, and 1–8 interactive parts.']
  const ids = new Set<string>(), errors: string[] = []
  for (const raw of task.parts) {
    if (!object(raw) || typeof raw.id !== 'string' || !raw.id || ids.has(raw.id) || typeof raw.label !== 'string' || !raw.label || typeof raw.prompt !== 'string' || !raw.prompt || !['choice','number','reasoning'].includes(String(raw.kind))) { errors.push('Every part needs a unique ID, label, prompt, and supported response type.'); continue }
    ids.add(raw.id)
    if (raw.kind === 'choice') {
      const options = raw.options
      if (!Array.isArray(options) || options.length !== 4 || options.some(o => !object(o) || typeof o.id !== 'string' || !o.id || typeof o.text !== 'string' || !o.text.trim()) || new Set(options.map(o => o.id)).size !== 4 || (raw.answer !== undefined && !options.some(o => o.id === raw.answer))) errors.push('Choice parts need four distinct options and a valid key.')
    }
    if (raw.kind === 'number' && (typeof raw.unit !== 'string' || raw.answer !== undefined && (typeof raw.answer !== 'number' || !Number.isFinite(raw.answer)) || raw.tolerance !== undefined && (typeof raw.tolerance !== 'number' || raw.tolerance < 0))) errors.push('Numerical parts need a unit and finite answer/tolerance.')
  }
  return errors
}
