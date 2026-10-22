'use client'

import { useEffect, useRef } from 'react'
import { drawSeasonalScene } from '@/lib/student-season-scene'
import styles from './StudentCheckIn.module.css'

/** Static decoration; redraw only for a month or container-size change. */
export default function SeasonalBackdrop({ month }: { month: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas?.parentElement) return
    const draw = () => drawSeasonalScene(canvas, month)
    const observer = new ResizeObserver(draw)
    observer.observe(canvas.parentElement)
    draw()
    return () => observer.disconnect()
  }, [month])
  return <canvas ref={ref} className={styles.backdrop} aria-hidden="true" />
}
