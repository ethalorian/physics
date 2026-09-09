'use client'

import type { ContentBlock, InlineQuestion, QuestionBlock } from '@/data/content-blocks'
import MathMarkdown from '@/components/MathMarkdown'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import { SeiVisual } from '@/components/blocks/SeiLayer'
import TeachingSeiSupports from './TeachingSeiSupports'
import { FitTeachingContent } from './TeachingStage'

/** A classroom question, not a disabled copy of the student's answer form. */
export default function TeachingQuestion({ block, lessonId, referenceBlocks, seiEnabled = false }: {
  seiEnabled?: boolean
  block: QuestionBlock; lessonId: string; referenceBlocks: ContentBlock[]
}) {
  const question = block.question && typeof block.question === 'object' && 'prompt' in block.question
    ? block.question as InlineQuestion : null
  if (!question) return <p role="alert">This question could not be loaded.</p>
  const options = question.options ?? []
  const visual = referenceBlocks.find(candidate => candidate.id === block.sei?.visualBlockId && candidate.id !== block.id && ['figure', 'diagram', 'graph', 'sim_embed', 'animation_3d', 'sketch'].includes(candidate.type))
  const hasVisual = Boolean(visual || block.sei?.visual)
  return <FitTeachingContent className="projected-content">
    <section className={`teach-question${hasVisual ? ' teach-question-with-visual' : ''}`} aria-label="Classroom question">
      <div className="teach-question-copy">
        <p className="teach-question-kicker">{options.length ? 'Make your call' : 'Think it through'}</p>
        <div role="heading" aria-level={1} className="teach-question-prompt"><MathMarkdown content={question.prompt} /></div>
        {options.length > 0 && <ol className="teach-question-choices" aria-label="Answer choices">
          {options.map((option, index) => <li key={option.id}>
            <span className="teach-question-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
            <MathMarkdown content={option.text} />
          </li>)}
        </ol>}
        {question.explain && <div className="teach-question-explain"><strong>Explain your thinking</strong><MathMarkdown content={question.explain} /></div>}
        <TeachingSeiSupports block={block} enabled={seiEnabled} />
      </div>
      {hasVisual && <div className="teach-question-visual" aria-label="Question visual">
        {visual && <BlockRenderer lessonId={lessonId} blocks={[visual]} referenceBlocks={referenceBlocks} hideBlockHeadings readOnly />}
        <SeiVisual visual={block.sei?.visual} />
      </div>}
    </section>
  </FitTeachingContent>
}
