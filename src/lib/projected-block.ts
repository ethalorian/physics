import { teachingPrompt } from '@/lib/teaching-content'
import { isCaptureBlock, type ContentBlock } from '@/data/content-blocks'

/** Presentation-only continuations. Original prompts/evidence blocks stay unchanged. */
export function projectedBlockPages(block: ContentBlock): ContentBlock[] {
  if (block.teachingTool) return [block]
  if (isCaptureBlock(block) && !['question','data_table','marzano','self_assessment'].includes(block.type)) {
    const prompt = teachingPrompt(block)
    const chunks = splitTeachingText(prompt, 650)
    if (chunks.length > 1) return chunks.map((text, i) => ({...block, ...('instruction' in block ? {instruction:text} : 'prompt' in block ? {prompt:text} : {frame:text}), ...(i > 0 ? {studentDirections:undefined} : {})}))
  }
  if (block.type === 'prose' || block.type === 'callout') {
    const parts: string[] = []
    let current = ''
    for (const paragraph of splitTeachingText(block.markdown, 650)) {
      if (current && current.length + paragraph.length > 650) { parts.push(current); current = '' }
      current += (current ? '\n\n' : '') + paragraph
    }
    if (current) parts.push(current)
    return parts.length ? parts.map(markdown => ({ ...block, markdown })) : [block]
  }
  if (block.type === 'vocab' && block.terms.length > 2) {
    return Array.from({ length: Math.ceil(block.terms.length / 2) }, (_, i) => ({ ...block, terms: block.terms.slice(i * 2, i * 2 + 2) }))
  }
  if (block.type === 'procedure' && block.steps.length > 4) {
    return Array.from({ length: Math.ceil(block.steps.length / 4) }, (_, i) => ({ ...block, title: `${block.title ?? 'Procedure'} · steps ${i * 4 + 1}–${Math.min(block.steps.length, i * 4 + 4)}`, steps: block.steps.slice(i * 4, i * 4 + 4), startNumber: (block.startNumber ?? 1) + i * 4 }))
  }
  return [block]
}

/** Keep paragraphs, lists and equations intact where possible; split long prose at sentence boundaries. */
export function splitTeachingText(text: string, limit = 650): string[] {
  const parts: string[] = []
  let current = ''
  const paragraphs = text.split(/\n\s*\n/).flatMap(p => p.length > limit && !p.includes('|') ? p.split(/(?<=[.!?])\s+(?=[A-Z¡¿*])/u) : [p])
  for (const p of paragraphs) { if (current && current.length + p.length > limit) { parts.push(current); current = '' }; current += (current ? '\n\n' : '') + p }
  if (current) parts.push(current)
  return parts.length ? parts : ['']
}
