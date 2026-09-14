import { type BlockDocument, type ContentBlock } from '@/data/content-blocks'
/** Canonical pieces referenced by authored slides. Resolves after class/track filtering. */
export function presentationBinding(binding: string | null | undefined, doc: BlockDocument): ContentBlock | undefined {
  if (!binding) return undefined
  const blocks = doc.blocks
  if (binding === '@target') return blocks.find(b => b.type === 'target')
  if (binding === '@exit') return blocks.find(b => b.evidenceRole === 'exit' && b.requiredForCompletion !== false) ?? blocks.find(b => b.teachingMoment?.phase === 'exit' && b.requiredForCompletion !== false) ?? blocks.find(b => b.type === 'exit_ticket' && b.requiredForCompletion !== false)
  if (binding === '@reflection') return blocks.find(b => b.type === 'marzano' || b.type === 'self_assessment')
  if (binding === '@reading') {
    const reading = blocks.filter(b => b.type === 'reading')
    return { id:'class-reading', type:'prose', markdown:'## Reading for your class\n\n' + (reading.length ? reading.map(b => b.type === 'reading' ? `**Chapter ${b.chapter} · ${(b.sectionIds ?? []).join(', ')}**\n\n${b.focus ?? ''}${b.thinkAndSolve?.length ? '\n\nThink and Solve: ' + b.thinkAndSolve.join(', ') : ''}` : '').join('\n\n') : 'Use the optional practice and references on your lesson screen. No additional reading is assigned here.') }
  }
  return blocks.find(b => b.id === binding && b.type !== 'deck')
}
