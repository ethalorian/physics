'use client'

import {useEffect, useRef, useState} from 'react'
import {foundationSlides} from '@/lib/interactive-assignments/foundations/slides'
import type {FoundationKey} from '@/lib/interactive-assignments/foundations/checkpoints'
import s from './Foundation.module.css'


export default function FoundationSlides({foundation='day-one'}:{foundation?:FoundationKey}) {
  const {slides,day,src,channel}=foundationSlides[foundation]
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [enlarged, setEnlarged] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  const panel = useRef<HTMLElement>(null)
  const enlargeButton = useRef<HTMLButtonElement>(null)
  const slide = slides[index]

  useEffect(() => {
    function receive(event: MessageEvent) {
      // An allow-scripts-only iframe has an opaque origin. Authenticate its
      // exact Window, and accept only navigation state, never assessment data.
      if (event.source !== frame.current?.contentWindow || event.origin !== 'null' || event.data?.channel !== channel) return
      const data = event.data
      if (data.type === 'slide' && data.total === slides.length && Number.isInteger(data.index) && data.index >= 0 && data.index < slides.length) {
        setIndex(data.index)
        setReady(true)
        setError('')
      } else if (data.type === 'error') {
        setError('The slideshow encountered a problem. Reload the slides to try again.')
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [channel, slides])

  useEffect(() => {
    if (ready) return
    // A one-shot loading timeout, not a refresh/polling loop.
    const timeout = window.setTimeout(() => setError('The slideshow could not finish loading. Try reloading the slides.'), 20000)
    return () => window.clearTimeout(timeout)
  }, [ready, attempt])

  useEffect(() => {
    function changed() {
      const isFull = document.fullscreenElement === panel.current
      setEnlarged(isFull)
      if (!isFull) enlargeButton.current?.focus({preventScroll: true})
    }
    document.addEventListener('fullscreenchange', changed)
    return () => document.removeEventListener('fullscreenchange', changed)
  }, [])

  function navigate(next: number) {
    // '*' is required for the sandbox's opaque target; only the slide index is sent.
    frame.current?.contentWindow?.postMessage({channel, type: 'navigate', index: next}, '*')
  }

  async function toggleEnlarged() {
    try {
      if (document.fullscreenElement === panel.current) await document.exitFullscreen()
      else await panel.current?.requestFullscreen()
    } catch {
      setError('This browser could not enlarge the slideshow. You can still use the slides here.')
    }
  }

  function retry() {
    setReady(false)
    setError('')
    setIndex(0)
    setAttempt(value => value + 1)
  }

  return <section ref={panel} id="assignment-teaching-tool" className={s.viewer} aria-label={`Day ${day} slide viewer`}>
    <div className={s.slideHeader}>
      <div><p>Day {day} · Foundational slides</p><h2>{slide.title}</h2></div>
      <button ref={enlargeButton} type="button" onClick={toggleEnlarged}>{enlarged ? 'Close enlarged slides' : 'Enlarge'}</button>
    </div>
    {/* Keep this one iframe mounted through slide changes, Work and fullscreen. */}
    <div className={s.slideFrame}>
      <iframe key={attempt} ref={frame} className={s.originalSlides} title={`Original Day ${day} interactive slideshow`}
        src={src} sandbox="allow-scripts"
        onLoad={() => frame.current?.contentWindow?.postMessage({channel, type: 'status'}, '*')}
        onError={() => setError('The slideshow could not load. Try reloading the slides.')}/>
    </div>
    {!ready && !error && <p className={s.slideCount} role="status">Loading interactive slides…</p>}
    {error && <div className={s.slideError}><p role="alert">{error}</p><button type="button" onClick={retry}>Reload slides</button></div>}
    <div className={s.slideControls}>
      <button type="button" disabled={!ready || index === 0} onClick={() => navigate(index - 1)} aria-label="Previous slide">← Previous</button>
      <label>Slide<select disabled={!ready} value={index} onChange={event => navigate(Number(event.target.value))}>
        {slides.map((item, i) => <option value={i} key={item.number}>{item.number}. {item.title}</option>)}
      </select></label>
      <button type="button" disabled={!ready || index === slides.length - 1} onClick={() => navigate(index + 1)} aria-label="Next slide">Next →</button>
    </div>
    <p className={s.slideCount} aria-live="polite">{index + 1} of {slides.length} · Use Work for your responses and group discussion.</p>
    <details className={s.companion}><summary>Read slide text</summary><p>{slide.text}</p></details>
  </section>
}
