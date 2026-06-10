'use client'

/**
 * AnimationStage — shared chrome for instructional 3D animations.
 * Owns the clock, play/pause/restart, the scrub bar, step captions, and the
 * single knob. The engine only ever sees render(t, knob).
 *
 * Accessibility / low-end devices:
 *   - Never autoplays. A poster frame renders on mount; motion is opt-in.
 *   - prefers-reduced-motion: playback still works (user-initiated), but we
 *     surface the scrubber as the primary control.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import type { AnimDefinition, AnimEngine } from './contract'

export default function AnimationStage({ def, caption }: { def: AnimDefinition; caption?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<AnimEngine | null>(null)
  const rafRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)

  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(def.posterTime ?? 0)
  const [knob, setKnob] = useState(def.knob.initial)
  const [readout, setReadout] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  // Refs mirror state so the rAF loop reads fresh values without re-binding.
  const tRef = useRef(t); tRef.current = t
  const knobRef = useRef(knob); knobRef.current = knob
  const playingRef = useRef(playing); playingRef.current = playing

  const draw = useCallback((time: number, k: number) => {
    const eng = engineRef.current
    if (!eng) return
    eng.render(time, k)
    setReadout(eng.readout ? eng.readout(time, k) : null)
  }, [])

  // Engine lifecycle + sizing.
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    let eng: AnimEngine
    try {
      eng = def.create(canvas)
    } catch (e) {
      console.error('animation engine failed to start', def.slug, e)
      setFailed(true)
      return
    }
    engineRef.current = eng
    const size = () => {
      const w = wrap.clientWidth
      const h = Math.max(260, Math.round(w * 0.56))
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      eng.resize(canvas.width, canvas.height)
      eng.render(tRef.current, knobRef.current)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(wrap)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
      eng.dispose()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def])

  // Clock.
  useEffect(() => {
    if (!playing) { cancelAnimationFrame(rafRef.current); return }
    lastTickRef.current = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTickRef.current) / 1000)
      lastTickRef.current = now
      let next = tRef.current + dt
      if (next >= def.duration) { next = def.duration; setPlaying(false) }
      setT(next)
      draw(next, knobRef.current)
      if (playingRef.current && next < def.duration) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, def.duration, draw])

  // Knob or scrub changes re-render the current frame even while paused.
  const seek = (next: number) => { setT(next); draw(next, knobRef.current) }
  const turnKnob = (k: number) => { setKnob(k); draw(tRef.current, k) }

  const atEnd = t >= def.duration
  const currentStep = [...def.steps].reverse().find((s) => t >= s.atTime)
  const nextStepTime = def.steps.find((s) => s.atTime > t + 0.01)?.atTime

  if (failed) {
    return (
      <div className="text-sm rounded-lg border p-3" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}>
        This animation couldn&apos;t start on this device.
      </div>
    )
  }

  const k = def.knob
  const knobText = k.display ? k.display(knob) : `${knob}${k.unit ?? ''}`

  return (
    <div>
      {caption && <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>{caption}</p>}
      <div ref={wrapRef} className="rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} aria-label={def.title} role="img" />

        {/* step caption strip */}
        <div className="px-3 py-2 text-sm" style={{ minHeight: 38, background: 'color-mix(in oklch, var(--primary) 8%, var(--card))', color: 'var(--foreground)', borderTop: '0.5px solid var(--border)' }}>
          {currentStep ? currentStep.label : 'Press play to begin.'}
        </div>

        {/* transport + scrub */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: '0.5px solid var(--border)' }}>
          <button
            onClick={() => { if (atEnd) seek(0); setPlaying((p) => !p) }}
            className="grid place-items-center rounded-full"
            style={{ width: 34, height: 34, background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
          </button>
          <button
            onClick={() => { setPlaying(false); seek(0) }}
            className="grid place-items-center rounded-full"
            style={{ width: 30, height: 30, background: 'var(--secondary)', color: 'var(--foreground)' }}
            aria-label="Restart"
          >
            <RotateCcw size={14} />
          </button>
          {nextStepTime !== undefined && (
            <button
              onClick={() => { setPlaying(false); seek(nextStepTime) }}
              className="grid place-items-center rounded-full"
              style={{ width: 30, height: 30, background: 'var(--secondary)', color: 'var(--foreground)' }}
              aria-label="Next step"
              title="Jump to next step"
            >
              <SkipForward size={14} />
            </button>
          )}
          <input
            type="range"
            min={0}
            max={def.duration}
            step={0.01}
            value={t}
            onChange={(e) => { setPlaying(false); seek(Number(e.target.value)) }}
            className="flex-1"
            aria-label="Scrub timeline"
          />
          <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)', minWidth: 64, textAlign: 'right' }}>
            {t.toFixed(1)}s / {def.duration.toFixed(0)}s
          </span>
        </div>

        {/* THE knob */}
        <div className="flex items-center gap-3 px-3 py-2" style={{ borderTop: '0.5px solid var(--border)', background: 'color-mix(in oklch, var(--reward) 8%, var(--card))' }}>
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{k.label}</span>
          <input
            type="range"
            min={k.min}
            max={k.max}
            step={k.step}
            value={knob}
            onChange={(e) => turnKnob(Number(e.target.value))}
            className="flex-1"
            aria-label={k.label}
          />
          <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--foreground)', minWidth: 90, textAlign: 'right' }}>{knobText}</span>
        </div>

        {/* live readout */}
        {readout && (
          <div className="px-3 py-1.5 text-xs font-mono" style={{ borderTop: '0.5px solid var(--border)', color: 'var(--success)', background: 'color-mix(in oklch, var(--success) 7%, var(--card))' }}>
            {readout}
          </div>
        )}
      </div>
      <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
        Watch first. Then change <strong>{k.label.toLowerCase()}</strong>, predict what will differ, and replay.
      </p>
    </div>
  )
}
