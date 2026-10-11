import type { BlockDocument, InlineQuestion, QuestionBlock } from '@/data/content-blocks'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import manifest from '@/data/explainers/claude-manifest.json'
import quiz from '@/data/explainers/units-notebook.json'

/** A presentation over ordinary question blocks, never a second evidence model. */
export interface InteractiveNotebook {
  version: 1
  sourceId: 'units'
  sourceHash: string
  sourceBlockId: string
  questionBlockIds: string[]
}
export const UNITS_NOTEBOOK_SOURCE = manifest.find(source => source.id === 'units')!
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}

/** Called after server track filtering: an incomplete mapping never opens the full source. */
export function notebookQuestions(document: BlockDocument): QuestionBlock[] | null {
  if (!Array.isArray(document.blocks) || document.blocks.some(block => !block || typeof block !== 'object')) return null
  const config = object(document.interactiveNotebook), ids = config.questionBlockIds
  if (config.version !== 1 || config.sourceId !== 'units' || config.sourceHash !== quiz.sourceHash || !Array.isArray(ids) || ids.length !== quiz.questions.length || new Set(ids).size !== ids.length) return null
  const source = document.blocks.find(block => block.id === config.sourceBlockId)
  if (source?.type !== 'prose' || source.teachingTool?.kind !== 'physics-explainer' || source.teachingTool.source?.id !== 'units' || source.teachingTool.source.src !== UNITS_NOTEBOOK_SOURCE.src) return null
  const blocks = ids.map(id => document.blocks.find(block => block.id === id))
  if (!blocks.every((block, index): block is QuestionBlock => {
    if (block?.type !== 'question' || block.gate || block.requiredForCompletion === false) return false
    const q = object(block.question), expected = quiz.questions[index]
    return q.prompt === expected.text && !q.explain && Array.isArray(q.options) && q.options.length === expected.options.length && q.options.every((option, i) => object(option).id === 'ABCD'[i] && object(option).text === expected.options[i])
  })) return null
  return blocks
}
export function notebookAuthoringIssues(document: BlockDocument, publishing: boolean): string[] {
  if (document.interactiveNotebook === undefined) return []
  const questions = notebookQuestions(document)
  if (!questions) return ['The notebook must retain its original source and five linked questions. Switch to the standard layout before changing those prompts or choices.']
  const related = document.blocks.filter(block => block.id === document.interactiveNotebook!.sourceBlockId || questions.some(q => q.id === block.id))
  if (related.some(block => block.visibilityTrack)) return ['Set the track on the whole notebook lesson, or switch to the standard layout to gate individual questions.']
  if (questions.some((block, index) => (block.question as InlineQuestion).correctOptionId !== 'ABCD'[quiz.questions[index].correct])) return ['The notebook answer keys must match the original questions.']
  if (publishing && questions.some(block => !block.targetId)) return ['Assign a learning target to each notebook question before publishing.']
  return []
}
export function notebookAnswers(questions: QuestionBlock[], responses: BlockResponseMap): Record<string, number> {
  return Object.fromEntries(questions.flatMap((question, index) => {
    const answer = object(responses[question.id]?.response).optionId
    const choice = typeof answer === 'string' ? 'ABCD'.indexOf(answer) : -1
    return choice >= 0 && typeof answer === 'string' && answer.length === 1 ? [[String(index), choice]] : []
  }))
}
/** Only valid answer indices cross from the original runtime to the lesson store. */
export function notebookAnswerChanges(questions: QuestionBlock[], responses: BlockResponseMap, values: unknown) {
  const answers = object(values)
  return questions.flatMap((question, index) => {
    const choice = answers[String(index)]
    if (!Number.isInteger(choice) || Number(choice) < 0 || Number(choice) > 3) return []
    const optionId = 'ABCD'[Number(choice)]
    if (object(responses[question.id]?.response).optionId === optionId) return []
    return [{ blockId: question.id, response: { mode: 'choice', optionId } }]
  })
}
