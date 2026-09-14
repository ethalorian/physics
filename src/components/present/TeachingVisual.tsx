'use client'
import type { ContentBlock } from '@/data/content-blocks'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import FigureGraph from '@/components/blocks/FigureGraph'
import { SeiVisual } from '@/components/blocks/SeiLayer'
export function questionVisual(block: ContentBlock, blocks: ContentBlock[]) {
  const visual = block.sei?.visualBlockId ? blocks.find(b => b.id === block.sei?.visualBlockId) : block.sei?.visual ? undefined : blocks[blocks.findIndex(b => b.id === block.id) - 1]
  return visual && visual.id !== block.id && ['figure','diagram','graph','sim_embed','animation_3d','sketch'].includes(visual.type) ? visual : undefined
}
export default function TeachingVisual({ block, blocks, lessonId }: { block: ContentBlock; blocks: ContentBlock[]; lessonId: string }) {
  const visual = questionVisual(block, blocks)
  let series = visual?.type === 'graph' ? visual.series ?? [] : []
  if (visual?.type === 'graph' && !series.length && visual.spec) {
    try { series = JSON.parse(visual.spec).series ?? [] } catch { /* invalid graph remains visibly empty */ }
  }
  if (!visual && !block.sei?.visual) return null
  return <div className="teach-question-visual" aria-label="Question visual">
    {visual?.type === 'graph' ? <FigureGraph presentation presentationHeight={450} {...visual} series={series} /> : visual && <BlockRenderer lessonId={lessonId} blocks={[visual]} referenceBlocks={blocks} hideBlockHeadings readOnly />}
    <SeiVisual visual={block.sei?.visual} />
  </div>
}
