import { isCaptureBlock, type ContentBlock, type InlineQuestion } from '@/data/content-blocks'

export function teachingPrompt(block: ContentBlock): string {
  switch (block.type) {
    case 'question': return (block.question as InlineQuestion)?.prompt ?? ''
    case 'prose': case 'callout': return block.markdown
    case 'target': return block.statementStudent ?? block.statement
    case 'sketch': case 'lab_notebook': return block.instruction
    case 'sentence_frame': return block.frame
    case 'observation': return `${block.patternPrompt}\n\n${block.interpretPrompt}`
    case 'data_table': return block.patternPrompt ?? 'Use the readings to identify a pattern. Explain what it means.'
    case 'gewa': case 'exit_ticket': case 'equation_sandbox': case 'worked_example': return block.prompt
    case 'transfer_prompt': return block.task?.prompt ?? 'Explain your solution using evidence.'
    case 'marzano': case 'self_assessment': return '1 — I need help. 2 — I can do this with support. 3 — I can explain it independently. Point to evidence in your work.'
    default: return ''
  }
}

export function teachingTitle(block: ContentBlock): string {
  if (block.teachingMoment?.title) return block.teachingMoment.title
  if (block.workshop?.title) return block.workshop.title
  if ('title' in block && block.title) return String(block.title)
  if (block.type === 'figure') return block.caption || block.alt
  if (block.type === 'vocab' || block.type === 'lesson_vocab') return 'Vocabulary for today'
  if (block.type === 'marzano' || block.type === 'self_assessment') return 'Reflect on your evidence'
  return teachingPrompt(block).replace(/^#+\s*/, '').split('\n')[0].slice(0, 120) || block.type.replaceAll('_', ' ')
}

export function teachingCue(block?: ContentBlock): string {
  if (!block) return 'Notice. Question. Make sense of it.'
  if (isCaptureBlock(block)) return block.requiredForCompletion === false ? 'Optional practice · respond on your device if useful.' : 'Your individual response · save on your lesson screen.'
  return block.teachingMoment?.purpose ?? 'Look at the shared model. Be ready to explain what you notice.'
}
