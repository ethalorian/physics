import { READING_ASSIGNMENT_XP, type ReadingXpStatus } from '@/lib/xp-policy'
import styles from './readings.module.css'

export default function ReadingXpReceipt({ xp, teacher = false, archived = false, onOpen, disabled = false }: { xp?: ReadingXpStatus | null; teacher?: boolean; archived?: boolean; onOpen?: (href: string) => void; disabled?: boolean }) {
  const earned = (xp?.earned ?? 0) > 0
  return <section className={styles.question} aria-label="Reading XP" aria-live="polite">
    <h2 className="text-title-3">{teacher ? `${READING_ASSIGNMENT_XP} XP for reading completion` : earned ? `+${xp!.earned} XP earned` : xp?.earned === null || !xp ? 'Reading XP receipt unavailable' : archived ? 'Reading XP' : `${xp.available} XP when you submit`}</h2>
    <p>{teacher ? 'Students earn once when they submit their assigned explanations. Returning work for revision keeps the reward; resubmitting does not award it again.' : earned ? 'Saved to your XP balance. Reopening this reading or revising your answers keeps this reward without earning it twice.' : !xp || xp.earned === null ? 'Your reading and answers are still available. Reload to check your saved XP receipt.' : archived ? 'This reading is closed for submissions.' : 'Read, explain your thinking, then submit your assigned responses to earn XP once.'}</p>
    <p className={styles.muted}>XP recognizes completed work. Your teacher reviews the evidence for mastery.</p>
    {!teacher && earned && onOpen ? <button type="button" disabled={disabled} onClick={() => onOpen('/avatar')} className="text-sm text-primary underline disabled:opacity-50">View your avatar & XP balance →</button> : null}
  </section>
}
