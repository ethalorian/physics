'use client'

import { Check, Lock, Pencil } from 'lucide-react'
import { isBlockComplete, isCaptureBlock, type LessonPage } from '@/data/content-blocks'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import { answerGuide, answerStatus } from './lesson-answer-guide'
import styles from './LessonViewer.module.css'

export default function AnswerChecklist({ pages, responses, currentIndex, isLocked, onOpen }: {
  pages: LessonPage[]; responses: BlockResponseMap; currentIndex: number
  isLocked: (index: number) => boolean; onOpen: (index: number, blockId: string) => void
}) {
  const answers = pages.flatMap((page, index) => page.blocks.filter(isCaptureBlock).map(block => ({ block, index })))
  if (!answers.length) return null
  const saved = answers.filter(({ block }) => !responses[block.id]?.draft && isBlockComplete(block, responses[block.id]?.response)).length
  return <nav className={styles.answerChecklist} aria-label="Lesson answer checklist">
    <div className={styles.answerListHeading}><Pencil size={17} /><strong>Answers to complete</strong><span>{saved}/{answers.length} saved</span></div>
    <p>Every response in this lesson. Select one to find it.</p>
    <ol>{answers.map(({ block, index }, i) => {
      const locked = isLocked(index)
      const status = answerStatus(block, responses)
      return <li key={block.id}><button type="button" disabled={locked} onClick={() => onOpen(index, block.id)} aria-current={index === currentIndex ? 'step' : undefined}>
        <span className={styles.answerNumber}>{locked ? <Lock size={13} /> : status === 'Saved' ? <Check size={14} /> : i + 1}</span>
        <span><strong>{i + 1}. {answerGuide(block).title}</strong><small>Step {index + 1} · {locked ? 'Finish the earlier checkpoint' : status}</small></span>
      </button></li>
    })}</ol>
  </nav>
}
