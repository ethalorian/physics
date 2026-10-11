'use client'

import type { SessionView } from '@/lib/math-missions/types'
import styles from './missions.module.css'

export default function MissionTeaching({ strategy, open }: { strategy: SessionView['strategy']; open: boolean }) {
  if (!strategy) return null
  return <details open={open} className={styles.teaching}>
    <summary>Learn the strategy</summary>
    <p>{strategy.idea}</p>
    {strategy.example && <section aria-label="A separate worked example">
      <h3>{strategy.example.title}</h3>
      <p className={styles.fine}>A separate example to learn from, then apply to your game.</p>
      <p>{strategy.example.prompt}</p>
      <ol>{strategy.example.steps.map((step, i) => <li key={i}><strong>{step.action}</strong><p>{step.why}</p></li>)}</ol>
      <p><strong>Check the reasoning:</strong> {strategy.example.check}</p>
    </section>}
    <details><summary>Words that help</summary><dl>{strategy.words.map(w => <div key={w.term}><dt><strong>{w.term}</strong></dt><dd>{w.meaning}</dd></div>)}</dl></details>
    {strategy.transfer && <p><strong>Now try your game:</strong> {strategy.transfer}</p>}
  </details>
}
