import { paginateBlocks, type ContentBlock, type BlockDocument } from '@/data/content-blocks'
import { sectionAnchor } from '@/lib/lesson-anchors'
import { buildSections } from '@/components/lessons/lesson-sections'

interface Slide { label: string; notes: string; kicker: string; title: string; anchor: string | null; blocks: ContentBlock[] }
export function buildSlides(title: string, doc: Pick<BlockDocument, 'blocks'> | null): Slide[] {
  const pages = paginateBlocks(doc?.blocks ?? [])
  const sections = buildSections(pages)
  const slides: Slide[] = [{ label: 'Title', notes: '', kicker: 'Today', title, anchor: null, blocks: [] }]
  pages.forEach((page, section) => {
    // Explicit continuation slides preserve every representation and full prompt.
    page.blocks.filter(b => b.type !== 'deck').forEach((block, part, blocks) => slides.push({
      label: `${sections[section]?.title ?? 'Section'} · ${part + 1}/${blocks.length}`,
      notes: page.hasCapture ? 'Students save their work in this section.' : '',
      kicker: `Section ${section + 1} · ${part ? 'Continued · ' : ''}${part + 1}/${blocks.length}`,
      title: sections[section]?.title ?? `Section ${section + 1}`,
      anchor: sectionAnchor(page), blocks: [block],
    }))
  })
  return slides
}

