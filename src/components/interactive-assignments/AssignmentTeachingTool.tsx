'use client'

import {useEffect, useRef, useState} from 'react'
import {classDayTool} from '@/lib/class-day-tools'
import type {LessonAssignment} from '@/lib/interactive-assignments/catalog'
import s from './assignment.module.css'

const timestamp = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** Keep one player mounted so answering, scrolling, and enlarging preserve playback. */
export default function AssignmentTeachingTool({lesson, visible = true}: {lesson: LessonAssignment; visible?: boolean}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const panel = useRef<HTMLElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [notice, setNotice] = useState('')
  const tool = classDayTool(lesson.unit, lesson.day)

  useEffect(() => {
    setReady(false); setFailed(false)
    let initialized = false
    // The original engine mounts asynchronously and shares a saved playhead
    // across documents. Seek only once per load, never when answers change.
    const timer = window.setInterval(() => {
      try {
        const canvas = frame.current?.contentDocument?.querySelector('[data-om-exportable-video-with-duration-secs][data-om-sync-seek="true"]')
        if (!canvas || initialized) return
        initialized = true
        canvas.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', {detail: {time: 0, sync: true}}))
        setReady(true); setFailed(false)
        window.clearInterval(timer); window.clearTimeout(timeout)
      } catch { /* The recovery controls remain available if the frame fails. */ }
    }, 100)
    const timeout = window.setTimeout(() => {window.clearInterval(timer); setFailed(true)}, 20000)
    return () => {window.clearInterval(timer); window.clearTimeout(timeout)}
  }, [lesson.toolHref, reload])

  useEffect(() => {
    const change = () => setExpanded(document.fullscreenElement === panel.current)
    document.addEventListener('fullscreenchange', change)
    return () => document.removeEventListener('fullscreenchange', change)
  }, [])

  useEffect(() => {
    if (visible || !ready) return
    // The original player's pause icon identifies its running state. Pause
    // only a running film; never seek or reload when changing workspace view.
    const button = frame.current?.contentDocument?.querySelector<HTMLButtonElement>('button[title="Play/pause (space)"]')
    if (button?.querySelector('rect')) button.click()
  }, [visible, ready])

  function playPause() {
    frame.current?.contentDocument?.querySelector<HTMLButtonElement>('button[title="Play/pause (space)"]')?.click()
  }

  function seek(time: number, play = false) {
    const canvas = frame.current?.contentDocument?.querySelector('[data-om-exportable-video-with-duration-secs]')
    canvas?.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', {detail: {time, sync: true}}))
    if (play) playPause()
  }

  async function enlarge() {
    try {
      if (document.fullscreenElement === panel.current) await document.exitFullscreen()
      else await panel.current?.requestFullscreen()
      setNotice('')
    } catch {setNotice('Full screen is unavailable here. You can keep watching below or open the full view in another tab.')}
  }

  return <section ref={panel} id="assignment-teaching-tool" tabIndex={-1} aria-labelledby="assignment-teaching-title" className={s.teachingTool}>
      <header className={s.teachingHeading}>
        <div><p className={s.eyebrow}>Watch · pause · try it</p><h2 id="assignment-teaching-title">Today’s teaching tool</h2></div>
        <button type="button" onClick={enlarge}>{expanded ? 'Back to assignment' : 'Enlarge'}</button>
      </header>
      <div className={s.teachingStage}>
        <iframe key={reload} ref={frame} src={lesson.toolHref} title={`${lesson.title} · teaching tool`} allowFullScreen onError={() => setFailed(true)}/>
        {!ready && <div className={s.teachingLoading} role="status"><span>{failed ? 'The teaching tool could not finish loading.' : 'Loading today’s teaching tool…'}</span>{failed && <button type="button" onClick={() => setReload(n => n + 1)}>Retry teaching tool</button>}</div>}
      </div>
      <div className={s.teachingControls}>
        <div className={s.teachingTransport}><button type="button" className={s.primary} disabled={!ready} onClick={playPause}>Play / pause</button><button type="button" disabled={!ready} onClick={() => seek(0)}>Restart</button></div>
        {tool && <label className={s.teachingSections}><span>Replay a section</span><select aria-label="Replay a teaching-tool section" disabled={!ready} value="" onChange={event => {if (event.target.value !== '') seek(Number(event.target.value), true)}}><option value="">Choose a section…</option>{tool.scenes.map((scene, i) => <option key={i} value={scene.start}>{`${scene.name} · ${timestamp(scene.start)}`}</option>)}</select></label>}
        <p className={s.teachingHint}>Choose Work to try the questions. Watch brings you back to this moment.</p>
        {notice && <p role="status" className={s.teachingHint}>{notice}</p>}
        {(failed || notice) && <a className={s.teachingExternal} href={lesson.toolHref} target="_blank" rel="noopener noreferrer">Open full view in a new tab ↗</a>}
      </div>
    </section>
}
