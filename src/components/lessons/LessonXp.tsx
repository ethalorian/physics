import { Star } from 'lucide-react'
import { isCaptureBlock, type ContentBlock } from '@/data/content-blocks'
import styles from './LessonViewer.module.css'

export function lessonXpTotal(blocks: ContentBlock[]) {
  const seen = new Set<string>()
  return blocks.reduce((total, block) => {
    if (seen.has(block.id)) return total
    seen.add(block.id)
    return total + (isCaptureBlock(block) && typeof block.xp === 'number' && Number.isFinite(block.xp) && block.xp > 0 ? Math.round(block.xp) : 0)
  }, 0)
}

export default function LessonXp({ blocks, earned }: { blocks: ContentBlock[]; earned?: number }) {
  const total = lessonXpTotal(blocks)
  const remaining = earned === undefined ? undefined : Math.max(0, total - earned)
  return <section className={styles.xpBar} aria-label="Lesson XP rewards">
    <div className={styles.xpAmount}>
      <Star aria-hidden="true" size={26} fill="currentColor" />
      <div><strong>{(remaining ?? total).toLocaleString()} XP</strong><span>{total === 0 ? 'No XP assigned' : remaining === undefined ? 'Possible in this lesson' : remaining === 0 ? 'Left to earn · reward complete' : 'Up for grabs'}</span></div>
    </div>
    <div className={styles.xpDetail}>
      <span role="status">{earned === undefined ? `${total.toLocaleString()} XP lesson reward` : `${earned.toLocaleString()} XP earned · ${total.toLocaleString()} XP total`}</span>
      <small>{total > 0 ? 'Earn once per eligible completed answer.' : 'Your answers still count as learning evidence.'}</small>
    </div>
  </section>
}
