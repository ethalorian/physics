'use client'
import { isCaptureBlock, type ContentBlock, type GraphSeries } from '@/data/content-blocks'
import { lessonLocation, lessonNumber } from '@/components/lessons/LessonVisualIdentity'
import { answerGuide } from '@/components/lessons/lesson-answer-guide'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import FigureGraph from '@/components/blocks/FigureGraph'
import MathMarkdown from '@/components/MathMarkdown'
import { ProjectionSeiContext } from './ProjectionSeiContext'
import TeachingQuestion from './TeachingQuestion'
import TeachingSeiSupports from './TeachingSeiSupports'
import { FitTeachingContent } from './TeachingStage'

export function blockMode(block?: ContentBlock) {
  if (block?.type === 'callout') return block.variant === 'warning' ? 'Watch for this' : block.variant === 'misconception' ? 'Check the idea' : 'Look a little closer'
  const modes: Record<string,string> = { graph:'Read the graph', question:'Think it through', procedure:'Try it out', vocabulary:'Build your vocabulary', vocab:'Build your vocabulary', worked_example:'See the thinking', transfer_prompt:'Make the connection', sketch:'Show your thinking', observation:'Notice & wonder', data_table:'Find the pattern', exit_ticket:'Bring it together' }
  return block ? modes[block.type] ?? 'Explore the idea' : 'Today’s lesson'
}
interface TeachingBlockProps { block: ContentBlock; lessonId: string; referenceBlocks: ContentBlock[]; seiEnabled?: boolean }
export default function TeachingBlockContent(props: TeachingBlockProps) {
  return <ProjectionSeiContext.Provider value={false}><TeachingBlockContentInner {...props} /></ProjectionSeiContext.Provider>
}
function TeachingBlockContentInner({ block, lessonId, referenceBlocks, seiEnabled = false }: TeachingBlockProps) {
  const location = lessonLocation(block.id, referenceBlocks)
  const guide = isCaptureBlock(block) ? answerGuide(block) : null
  let series: GraphSeries[] = []
  if (block.type === 'graph') { series = block.series ?? []; if (!series.length && block.spec) { try { series = JSON.parse(block.spec).series ?? [] } catch { /* renderer retains invalid graph fallback */ } } }
  if (block.type === 'question') return <TeachingQuestion seiEnabled={seiEnabled} block={block} lessonId={lessonId} referenceBlocks={referenceBlocks} />
  if ((block.type === 'prose' || block.type === 'callout') && !block.sei?.visualBlockId) {
    const heading = block.markdown.match(/^#{1,3}\s+([^\n]+)\n+/)
    const title = block.type === 'callout' ? block.title ?? heading?.[1] ?? 'Look a little closer' : heading?.[1] ?? 'Explore the idea'
    const body = heading && title === heading[1] ? block.markdown.slice(heading[0].length) : block.markdown
    return <FitTeachingContent className="projected-content"><div className="teach-split" style={{ gridTemplateColumns: '.7fr 1.5fr' }}><div className="teach-focus lesson-chapter">{location && <span className="lesson-chapter-number" aria-hidden="true">{lessonNumber(location.step)}</span>}<p className="teach-eyebrow">{blockMode(block)}</p><div role="heading" aria-level={1} className="teach-headline"><MathMarkdown content={title} /></div></div><div className="teach-block-card"><MathMarkdown content={body} /><TeachingSeiSupports block={block} enabled={seiEnabled} /></div></div></FitTeachingContent>
  }
  if (block.type === 'vocab' && !block.sei?.visualBlockId) return <FitTeachingContent className="projected-content"><div className="teach-options" style={{ minHeight: 640 }}>{block.terms.map((term, i) => <div className="teach-option" key={i}><p className="teach-eyebrow" style={{ color: 'var(--primary)' }}>{String(i + 1).padStart(2, '0')}</p><h2 style={{ fontSize: 40, lineHeight: 1.15, margin: 0, color: 'var(--primary)' }}>{term.term}</h2><div className="teach-option-text"><MathMarkdown content={term.definition} /></div>{seiEnabled && term.cognate && <p style={{ fontSize: 24 }}>Cognate · {term.cognate}</p>}</div>)}</div><TeachingSeiSupports block={block} enabled={seiEnabled} /></FitTeachingContent>
  return <FitTeachingContent className="projected-content">
    {guide && <section className="teach-response-cue" aria-label="Response on your lesson screen">
      <span className="lesson-response-badge">YOUR RESPONSE {location?.response ? lessonNumber(location.response) : ''}</span><strong>{guide.title}</strong>
      <p>Answer on your lesson screen. Check each part before moving on.</p>
      <ul>{guide.parts.map((part, i) => <li key={i}>{part}</li>)}</ul>
    </section>}
    <div className="teach-block-card">
    {block.type === 'graph' ? <FigureGraph presentation title={block.title} xLabel={block.xLabel} yLabel={block.yLabel} series={series} /> : <BlockRenderer lessonId={lessonId} blocks={[block]} referenceBlocks={referenceBlocks} hideBlockHeadings={Boolean(guide)} readOnly />}
  </div><TeachingSeiSupports block={block} enabled={seiEnabled} /></FitTeachingContent>
}
