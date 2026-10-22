import type { ContentBlock, InlineQuestion } from '@/data/content-blocks'

/** Let the scene support the current response instead of repeating a generic lesson goal. */
export function learningTaskFocus(blocks: ContentBlock[], fallback: string): string {
  for (const block of blocks) {
    if (block.type === 'interactive_question' && block.task.prompt) return block.task.prompt
    if (block.type === 'question') {
      const question = block.question as InlineQuestion | undefined
      if (typeof question?.prompt === 'string' && question.prompt.trim()) return question.prompt
    }
    if ((block.type === 'gewa' || block.type === 'exit_ticket') && block.prompt) return block.prompt
    if ((block.type === 'sketch' || block.type === 'lab_notebook') && block.instruction) return block.instruction
    if ((block.type === 'data_table' || block.type === 'observation') && block.patternPrompt) return block.patternPrompt
  }
  return fallback
}
