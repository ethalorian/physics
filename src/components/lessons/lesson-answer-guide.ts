import { isBlockComplete, isBlockDone, type ContentBlock } from '@/data/content-blocks'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'

/** UI guidance only; completion is always determined by the shared response rules. */
export function answerGuide(block: ContentBlock): { title: string; parts: string[] } {
  switch (block.type) {
    case 'question': {
      const question = block.question as { options?: unknown[]; explain?: string } | undefined
      return { title: 'Question', parts: question?.options?.length ? ['Choose an answer', ...(question.explain ? ['Explain your choice'] : [])] : ['Write your explanation'] }
    }
    case 'lab_notebook': return { title: 'Lab notebook', parts: ['Sketch / diagram', ...(block.fields?.length ? block.fields : ['What I did', 'What I observed', 'What it means'])] }
    case 'observation': return { title: 'Observation', parts: ['Describe the pattern', 'Explain what it means'] }
    case 'data_table': return { title: 'Data & reasoning', parts: [`Complete ${block.minRows ?? 1} data reading${(block.minRows ?? 1) === 1 ? '' : 's'}`, 'Choose the pattern', 'Explain what it means'] }
    case 'gewa': return { title: 'Physics solution', parts: ['Given values', 'Equation', 'Work / substitutions', 'Answer & units'] }
    case 'equation_sandbox': return { title: 'Equation work', parts: ['Enter your equation steps'] }
    case 'sketch': return { title: 'Sketch response', parts: ['Draw or describe your answer', ...(block.prompts ?? [])] }
    case 'exit_ticket': return { title: 'Exit ticket', parts: ['Respond to the exit question'] }
    case 'sentence_frame': return { title: 'Complete the sentence', parts: ['Fill in the sentence with your own thinking'] }
    case 'self_assessment': return { title: 'Self-assessment', parts: [`Rate each of the ${block.targetIds.length} learning targets`] }
    case 'marzano': return { title: 'Self-check', parts: ['Choose your current level (saved when selected)'] }
    case 'transfer_prompt': return { title: 'Transfer response', parts: ['Explain your solution and supporting evidence'] }
    case 'concept_exercise': return { title: 'Textbook practice', parts: ['Open the practice', 'Answer every assigned item', 'Submit the practice'] }
    default: return { title: 'Your response', parts: ['Complete the activity'] }
  }
}

export function answerStatus(block: ContentBlock, responses: BlockResponseMap): string {
  const entry = responses[block.id]
  if (entry?.draft) return 'Changes need saving'
  if (!entry) return 'To answer'
  if (!isBlockComplete(block, entry.response)) return 'Finish your response'
  if (!isBlockDone(block, entry.response)) return 'Saved · check feedback'
  return 'Saved'
}

export function answerAnchor(lessonId: string, blockId: string): string {
  return `lesson-answer-${encodeURIComponent(lessonId)}-${encodeURIComponent(blockId)}`
}
