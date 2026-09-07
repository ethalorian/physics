import type { ContentBlock } from '@/data/content-blocks'

/** Presentation-only continuations. Original prompts/evidence blocks stay unchanged. */
export function projectedBlockPages(block: ContentBlock): ContentBlock[] {
  if (block.type === 'prose' || block.type === 'callout') {
    const parts: string[] = []
    let current = ''
    for (const paragraph of block.markdown.split(/\n\s*\n/)) {
      if (current && current.length + paragraph.length > 750) { parts.push(current); current = '' }
      current += (current ? '\n\n' : '') + paragraph
    }
    if (current) parts.push(current)
    return parts.length ? parts.map(markdown => ({ ...block, markdown })) : [block]
  }
  if (block.type === 'vocab' && block.terms.length > 4) {
    return Array.from({ length: Math.ceil(block.terms.length / 4) }, (_, i) => ({ ...block, terms: block.terms.slice(i * 4, i * 4 + 4) }))
  }
  if (block.type === 'procedure' && block.steps.length > 4) {
    return Array.from({ length: Math.ceil(block.steps.length / 4) }, (_, i) => ({ ...block, title: `${block.title ?? 'Procedure'} · steps ${i * 4 + 1}–${Math.min(block.steps.length, i * 4 + 4)}`, steps: block.steps.slice(i * 4, i * 4 + 4) }))
  }
  return [block]
}
