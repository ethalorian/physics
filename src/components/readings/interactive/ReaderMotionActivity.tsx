'use client'

import { useEffect, useRef, useState } from 'react'
import ReaderStudentPose from './ReaderStudentPose'
import { useReaderStoryExperiment } from './ReaderStory'
import styles from './reader-story.module.css'

/** The clock advances model time, never the assignment's saved progress. */
export function useReaderMotionActivity(id: string, duration: number) {
  const experiment = useReaderStoryExperiment(id)
  const active = experiment?.active ?? false
  const enabled = Boolean(experiment)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const progressRef = useRef(0)
  progressRef.current = progress
  useEffect(() => {
    if (!enabled) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { setReducedMotion(media.matches); if (media.matches) setRunning(false) }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [enabled])
  useEffect(() => {
    if (!active) { setRunning(false); return }
    if (!running || reducedMotion) return
    let frame = 0
    const started = performance.now() - progressRef.current * duration * 1000
    const tick = (now: number) => {
      const next = Math.min(1, (now - started) / (duration * 1000))
      setProgress(next)
      if (next < 1) frame = requestAnimationFrame(tick)
      else setRunning(false)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, running, reducedMotion, duration])
  const seek = (value: number) => { setRunning(false); setProgress(value); progressRef.current = value }
  return { experiment, active, progress, running, reducedMotion, seek,
    reset: () => seek(0),
    play: () => { if (progressRef.current >= 1) seek(0); setRunning(true) },
    pause: () => setRunning(false),
  }
}
type Activity = ReturnType<typeof useReaderMotionActivity>

export function ReaderActivityControls({ id, kind, timeline }: { id: string; kind: 'journey' | 'boat' | 'direction'; timeline?: Activity }) {
  const experiment = useReaderStoryExperiment(id)
  if (!experiment) return null
  const { story, sectionId, active, copy } = experiment
  return <div className={styles.activity} lang={story.language} translate="yes" data-reader-activity={sectionId}>
    <p>{copy[kind]}</p>
    <div className={styles.activityButtons}>
      {!active ? <button type="button" onClick={() => story.setActiveScene(sectionId)}>{copy.enter}</button> : <>
        {timeline && !timeline.reducedMotion ? <button type="button" onClick={timeline.running ? timeline.pause : timeline.play}>{timeline.running ? copy.pause : copy.play}</button> : null}
        <a href={`#story-title-${sectionId}`} onClick={() => { timeline?.pause(); story.setActiveScene(null) }}>{copy.return} ↑</a>
      </>}
    </div>
    {active && timeline ? <label className={styles.activityProgress}>{copy.progress}<span>{Math.round(timeline.progress * 100)}%</span><input type="range" aria-label={copy.progress} min={0} max={100} step={1} value={Math.round(timeline.progress * 100)} onChange={event => timeline.seek(Number(event.target.value) / 100)} /></label> : null}
    {active && timeline?.reducedMotion ? <p>{copy.reducedMotion}</p> : null}
  </div>
}

/** A DOM-backed sprite keeps the learner's saved appearance inside the actual model. */
export function ReaderActivityActor({ id, x, y, width = 50, height = 70, running = false, facing = 'right', head = false }: {
  id: string; x: number; y: number; width?: number; height?: number; running?: boolean; facing?: 'left' | 'right'; head?: boolean
}) {
  const experiment = useReaderStoryExperiment(id)
  if (!experiment?.active) return null
  return <foreignObject x={x} y={y} width={width} height={height} aria-hidden="true" pointerEvents="none">
    <div className={styles.activityActor} data-facing={facing} data-reader-actor={experiment.sectionId}>
      <ReaderStudentPose portrait={experiment.story.portrait} sampleStudent={experiment.story.sampleStudent} pose={head ? 'head' : running ? 'running' : 'standing'} />
    </div>
  </foreignObject>
}
