'use client'

import type { ContentBlock, InlineQuestion, QuestionBlock } from '@/data/content-blocks'
import MathMarkdown from '@/components/MathMarkdown'
import TeachingVisual, { questionVisual } from './TeachingVisual'
import { teachingCue } from '@/lib/teaching-content'
import TeachingSeiSupports from './TeachingSeiSupports'
import { FitTeachingContent } from './TeachingStage'

/** A classroom question, not a disabled copy of the student's answer form. */
export default function TeachingQuestion({ block, lessonId, referenceBlocks, seiEnabled = false, results, status }: {
  results?: { tally: Record<string, number>; saved: number }; status?: string
  seiEnabled?: boolean
  block: QuestionBlock; lessonId: string; referenceBlocks: ContentBlock[]
}) {
  const question = block.question && typeof block.question === 'object' && 'prompt' in block.question
    ? block.question as InlineQuestion : null
  if (!question) return <p role="alert">This question could not be loaded.</p>
  const options = question.options ?? []
  const visual = questionVisual(block, referenceBlocks)
  const hasVisual = Boolean(visual || block.sei?.visual)
  return <FitTeachingContent className="projected-content">
    <section className={`teach-question${hasVisual ? ' teach-question-with-visual' : ''}`} aria-label="Classroom question">
      <div className="teach-question-copy">
        <p className="teach-question-kicker">{status ?? teachingCue(block)}</p>
        <div role="heading" aria-level={1} className="teach-question-prompt"><MathMarkdown content={question.prompt} /></div>
        {options.length > 0 && <ol className="teach-question-choices" aria-label="Answer choices">
          {options.map((option, index) => <li key={option.id}>
            <span className="teach-question-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
            <div><MathMarkdown content={option.text} />{results && <p className="teach-poll-count">{results.tally[option.id] ?? 0} responses · {results.saved ? Math.round((results.tally[option.id] ?? 0) / results.saved * 100) : 0}%</p>}</div>
          </li>)}
        </ol>}
        {question.explain && <div className="teach-question-explain"><strong>Explain your thinking</strong><MathMarkdown content={question.explain} /></div>}
        {!hasVisual && <TeachingSeiSupports block={block} enabled={seiEnabled} />}
      </div>
      {hasVisual && <div><TeachingVisual block={block} blocks={referenceBlocks} lessonId={lessonId} /><TeachingSeiSupports block={block} enabled={seiEnabled} /></div>}
    </section>
  </FitTeachingContent>
}
