import { sourcePresentation, type AssignmentSource } from '@/lib/assignment-source-presentation'
import s from './AssignmentIdentity.module.css'

/** Span-only content works inside links, buttons, table cells and sequence cards. */
export default function AssignmentIdentity({ source, compact = false, layout = 'default' }: { source: AssignmentSource; compact?: boolean; layout?: 'default' | 'card' }) {
  const p = sourcePresentation(source)
  return <span className={`${s.identity} ${layout === 'card' ? s.card : ''}`} data-assignment-type={p.type}>
    <span className={s.type}>{p.label}{p.day ? <span className={s.day}>{layout === 'card' ? '' : ' · '}Course day {p.day}</span> : null}</span>
    <strong className={s.topic}>{p.title}</strong>
    {!compact && <span className={s.thinking}>{layout === 'card' && <span className={s.thinkingLabel}>Thinking: </span>}{p.thinking}</span>}
  </span>
}
