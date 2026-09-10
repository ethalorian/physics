'use client'

import { useEffect, useState, type ReactNode } from 'react'
import styles from './missions.module.css'

/** Animation is optional, finite, and paused when the document is hidden. */
export default function InstrumentPanel({ kind, children }: { kind: string; children: ReactNode }) {
  const [motion, setMotion] = useState(true)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return <div className={styles.board} data-kind={kind} data-motion={motion} data-visible={visible}>
    {children}
    <div className={styles.motionControl}>
      <span>Explore the model. Watch what changes.</span>
      <button type="button" aria-pressed={motion} onClick={() => setMotion(value => !value)}>
        Motion {motion ? 'on' : 'off'}
      </button>
    </div>
  </div>
}
