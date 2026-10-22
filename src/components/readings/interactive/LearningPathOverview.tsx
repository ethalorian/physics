'use client'

import type { LearningPathItem } from './learning-path'
import styles from './learning-path.module.css'

export function LearningPathOverview({ items, onOpen, disabled = false, sample = false }: {
  items: LearningPathItem[]; onOpen?: (href: string) => void; disabled?: boolean; sample?: boolean
}) {
  return <section className={styles.path} aria-label={sample ? 'Sample learning sequence' : 'Your connected assignments'}>
    <header><p>{sample ? 'HOW THIS CONNECTS IN YOUR CLASS' : 'YOUR CONNECTED ASSIGNMENTS'}</p><h2>Read. Practice. Explain. Grow.</h2></header>
    <ol>{items.map((item, index) => <li key={item.title}><span className={styles.number} aria-hidden="true">{index + 1}</span><div><h3>{item.title}</h3><span className={styles.status} aria-live="polite">{item.status}</span><p>{item.description}</p>{item.href && onOpen ? <button type="button" disabled={disabled} onClick={() => onOpen(item.href!)}>Open {item.title.toLowerCase()} <span aria-hidden="true">↗</span></button> : null}</div></li>)}</ol>
    <p className={styles.evidence}>{sample ? 'This preview uses sample work. In an assigned class, ' : ''}{sample ? 'your' : 'Your'} teacher uses submitted explanations and assessments to rate learning targets. Reading progress and practice checks help you prepare; they do not award mastery.</p>
  </section>
}

