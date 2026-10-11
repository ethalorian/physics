import type { BlockDocument } from './content-blocks'
import workshop from './trades-etf-workshop.json'

/** Enrich canonical ETF teaching boards without changing any student evidence block. */
export function withEtfWorkshopVisuals(document: BlockDocument, slug: string): BlockDocument {
  const entry = workshop.find(day => day.slug === slug)
  if (!entry || document.presentation !== 'trades-workshop') return document
  let changed = false
  const blocks = document.blocks.map(block => {
    if ('capture' in block && block.capture) return block
    if (block.type === 'worked_example' && block.id === `${slug}-plan-example`) {
      changed = true
      return {...block, prompt:entry.practicePrompt}
    }
    const stage = block.workshop?.stage
    if (!stage || !(stage in entry.stages) || block.id !== `${slug}-${stage.toLowerCase()}` || block.teachingTool?.kind !== 'case-board') return block
    // A separately authored teaching tool remains the teacher's own content.
    if (!block.teachingTool.frames.every(frame => frame.image?.startsWith('/trades-etf/'))) return block
    const visual = entry.stages[stage as keyof typeof entry.stages]
    changed = true
    return {...block, note:visual.note, workshop:{...block.workshop!, title:visual.title, lead:visual.lead}, teachingTool:{kind:'case-board' as const, version:1 as const, frames:visual.frames}}
  })
  return changed ? {...document, blocks} : document
}
