import { paginateBlocks, isCaptureBlock, type ContentBlock, type BlockDocument } from '@/data/content-blocks'
import { projectedBlockPages } from '@/lib/projected-block'
import { sectionAnchor } from '@/lib/lesson-anchors'
import { teachingTitle, teachingCue } from '@/lib/teaching-content'

interface Slide { label: string; notes: string; kicker: string; title: string; anchor: string | null; blocks: ContentBlock[] }
/** Authored moments select existing blocks; the learner, print and projector share their content. */
export function buildSlides(title: string, doc: Pick<BlockDocument, 'blocks'> | null): Slide[] {
  const blocks = doc?.blocks ?? []
  const authored = blocks.some(b => b.teachingMoment && b.teachingMoment.phase !== 'reference')
  const slides: Slide[] = [{ label: 'Today’s lesson', notes: '', kicker: 'Today', title, anchor: null, blocks: [] }]
  // Legacy/unreviewed documents get one useful shared-attention block per section.
  for (const page of paginateBlocks(blocks)) {
    const selected = authored ? page.blocks.filter(b => b.teachingMoment && b.teachingMoment.phase !== 'reference') :
      [page.blocks.find(b => b.teachingTool || (isCaptureBlock(b) && b.requiredForCompletion !== false)) ?? page.blocks.find(b => ['target','graph','figure','diagram','worked_example','procedure'].includes(b.type))].filter((b): b is ContentBlock => Boolean(b))
    for (const original of selected.filter(b => b.type !== 'deck')) {
      const parts = projectedBlockPages(original)
      parts.forEach((block, part) => slides.push({
        label: `${teachingTitle(original)}${parts.length > 1 ? ` · ${part + 1}/${parts.length}` : ''}`,
        notes: [original.note, original.teachingMoment?.purpose, teachingCue(original)].filter(Boolean).join('\n\n'),
        kicker: original.teachingMoment?.phase ?? 'Explore', title: teachingTitle(original),
        anchor: sectionAnchor(page), blocks: [block],
      }))
    }
  }
  return slides
}
