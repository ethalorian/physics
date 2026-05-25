'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSimulations } from '@/contexts/SimulationContext'
import { useSimEmbedded } from '@/components/simulations/embed-context'
import { useSimulationCompletion } from '@/hooks/useSimulationCompletion'
import { getSimulationCriteria } from '@/config/simulationCompletionCriteria'
import type { SimulationInteraction, SimulationResult } from '@/types/interactive-content'
import {
  ArrowLeft, Play, Pause, RotateCcw, Download, Info, CheckCircle2, Sparkles,
} from 'lucide-react'
import {
  SimDefinition, SimEngine, ParamValues, defaultParamValues, SimData,
} from './contract'

// ---------------------------------------------------------------------------
// SimLab — the one shell every simulation renders inside. The sim contributes
// only a SimDefinition (params + readouts + a canvas engine). Everything around
// the canvas — chrome, controls, readouts, data, export, completion, theming,
// embedded layout — lives here, so all sims stay consistent and a fix lands once.
// ---------------------------------------------------------------------------

const LEVEL_TINT: Record<string, string> = {
  Intro: 'var(--success)', Core: 'var(--primary)', Challenge: 'var(--reward)',
}

// Fixed-substep integration constants (module scope = stable across renders).
const FIXED_DT = 1 / 120
const MAX_SUBSTEPS = 10

export default function SimLab({ def, lessonId }: { def: SimDefinition; lessonId?: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const embeddedCtx = useSimEmbedded()
  const embedded = embeddedCtx

  const { getSimulationBySlug, startActivity, recordInteraction, completeActivity } = useSimulations()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SimEngine | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const accumRef = useRef(0)
  const runningRef = useRef(false)
  const activityIdRef = useRef<string | null>(null)

  const initialValues = useMemo(() => defaultParamValues(def.params), [def.params])
  const [values, setValues] = useState<ParamValues>(initialValues)
  const [readouts, setReadouts] = useState<Record<string, number | string>>({})
  const [data, setData] = useState<SimData | null>(null)
  const [running, setRunning] = useState(false)

  const completionConfig = useMemo(() => getSimulationCriteria(def.slug), [def.slug])

  // Persist completion to the activity API (single tracking path for the platform).
  const onComplete = useCallback((payload: Record<string, unknown>, score?: number) => {
    const result: SimulationResult = {
      completed: true,
      score,
      data: payload,
      interactions: [],
      time_spent: typeof payload.timeSpent === 'number' ? payload.timeSpent : 0,
    }
    if (activityIdRef.current) completeActivity(activityIdRef.current, result).catch(() => {})
  }, [completeActivity])

  const { state: completion, trackInteraction, markComplete, reset: resetCompletion } =
    useSimulationCompletion(completionConfig, onComplete)

  // ---- canvas + engine lifecycle ----------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = () => window.devicePixelRatio || 1
    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * dpr()))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr()))
      ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0)
      engineRef.current?.render()
    }

    const engine = def.createEngine(canvas, ctx, initialValues)
    engineRef.current = engine
    sizeCanvas()
    setReadouts(engine.getReadouts())
    if (engine.getData) setData(engine.getData())

    const ro = new ResizeObserver(() => sizeCanvas())
    ro.observe(canvas)

    return () => {
      ro.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      runningRef.current = false
      engine.destroy()
      engineRef.current = null
    }
    // createEngine identity is stable per definition; re-run only if the sim changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.slug])

  // ---- one-time activity registration ------------------------------------
  useEffect(() => {
    if (!session?.user?.id) return
    let cancelled = false
    getSimulationBySlug(def.slug)
      .then((sim) => {
        if (!sim || cancelled) return
        return startActivity(sim.id, lessonId)
      })
      .then((id) => { if (id && !cancelled) activityIdRef.current = id })
      .catch(() => {})
    return () => { cancelled = true }
  }, [session?.user?.id, def.slug, lessonId, getSimulationBySlug, startActivity])

  // ---- shared state pull (readouts, data, completion) --------------------
  const pullState = useCallback(() => {
    const eng = engineRef.current
    if (!eng) return
    setReadouts(eng.getReadouts())
    if (eng.getData) setData(eng.getData())
    if (eng.isComplete?.()) markComplete()
  }, [markComplete])

  // ---- animation loop -----------------------------------------------------
  // Fixed-substep integration: regardless of frame rate, physics advances in
  // small constant steps. A slow frame or a backgrounded tab can't make an
  // object tunnel through a wall or blow up — every engine integrates stably.
  const loop = useCallback((ts: number) => {
    const eng = engineRef.current
    if (!eng) return
    const last = lastTsRef.current ?? ts
    const frame = Math.min((ts - last) / 1000, 0.1) // clamp huge gaps (tab switch)
    lastTsRef.current = ts
    if (eng.step) {
      accumRef.current += frame
      let n = 0
      while (accumRef.current >= FIXED_DT && n < MAX_SUBSTEPS) {
        eng.step(FIXED_DT)
        accumRef.current -= FIXED_DT
        n++
      }
      if (accumRef.current > FIXED_DT * MAX_SUBSTEPS) accumRef.current = 0 // shed backlog
    }
    eng.render()
    pullState()
    if (runningRef.current) rafRef.current = requestAnimationFrame(loop)
  }, [pullState])

  const startLoop = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true
    setRunning(true)
    lastTsRef.current = null
    accumRef.current = 0
    rafRef.current = requestAnimationFrame(loop)
  }, [loop])

  const stopLoop = useCallback(() => {
    runningRef.current = false
    setRunning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  // ---- control handlers ---------------------------------------------------
  const handleParam = useCallback((key: string, value: number | string | boolean) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      engineRef.current?.setParams(next)
      engineRef.current?.render()
      return next
    })
    trackInteraction(`${key}_changed`, { value })
    // For non-animated sims, refresh readouts immediately.
    if (!runningRef.current) pullState()
    const interaction: SimulationInteraction = { timestamp: Date.now(), action: `${key}_changed`, data: { value } }
    if (activityIdRef.current) recordInteraction(activityIdRef.current, interaction).catch(() => {})
  }, [trackInteraction, pullState, recordInteraction])

  const handlePlayPause = useCallback(() => {
    if (running) { stopLoop(); return }
    engineRef.current?.start?.(values)
    trackInteraction('play', {})
    startLoop()
  }, [running, values, startLoop, stopLoop, trackInteraction])

  const handleReset = useCallback(() => {
    stopLoop()
    engineRef.current?.reset()
    engineRef.current?.render()
    pullState()
    resetCompletion()
    trackInteraction('reset', {})
  }, [stopLoop, pullState, resetCompletion, trackInteraction])

  const handleExport = useCallback(() => {
    const d = engineRef.current?.getData?.()
    if (!d || d.rows.length === 0) return
    const csv = [d.columns.join(','), ...d.rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${def.slug}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [def.slug])

  // ---- embed height handshake --------------------------------------------
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!embedded || !rootRef.current) return
    const post = () => {
      const h = rootRef.current?.scrollHeight ?? 0
      if (h > 0) window.parent?.postMessage({ type: 'sim-embed-height', slug: def.slug, height: h }, '*')
    }
    post()
    const ro = new ResizeObserver(post)
    ro.observe(rootRef.current)
    return () => ro.disconnect()
  }, [embedded, def.slug])

  const showPlay = def.showPlay ?? true
  const showExport = (def.showExport ?? false) || !!data
  const accent = LEVEL_TINT[def.level] ?? 'var(--primary)'
  const canvasH = def.canvasHeight ?? 420

  // ---- render -------------------------------------------------------------
  return (
    <div ref={rootRef} className={embedded ? 'p-3' : 'container mx-auto px-4 py-6 max-w-6xl'} style={{ color: 'var(--foreground)' }}>
      {!embedded && (
        <div className="mb-5">
          <button onClick={() => router.push('/simulations')} className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            <ArrowLeft size={16} /> Back to simulations
          </button>
          <div className="flex items-start gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{def.title}</h1>
                <span className="text-[11px] font-semibold rounded-full px-2.5 py-1" style={{ background: `color-mix(in oklch, ${accent} 16%, var(--card))`, color: `color-mix(in oklch, ${accent} 60%, var(--foreground))` }}>{def.level}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{def.summary}</p>
            </div>
          </div>
        </div>
      )}

      <div className={embedded ? 'flex flex-col gap-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-5'}>
        {/* visualization */}
        <div className={embedded ? '' : 'lg:col-span-2 space-y-4'}>
          <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
            <canvas ref={canvasRef} className="w-full block" style={{ height: canvasH }} />
          </div>

          {/* readouts */}
          {def.readouts.length > 0 && (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
              {def.readouts.map((r) => {
                const raw = readouts[r.key]
                const val = typeof raw === 'number' ? raw.toFixed(r.precision ?? 2) : (raw ?? '—')
                return (
                  <div key={r.key} className="rounded-xl px-3 py-2" style={{ background: 'var(--secondary)' }}>
                    <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{r.label}</div>
                    <div className="text-lg font-semibold" style={{ color: r.color ?? 'var(--foreground)' }}>
                      {val}{r.unit ? <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}> {r.unit}</span> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* data table */}
          {data && data.rows.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0" style={{ background: 'var(--muted)' }}>
                    <tr>{data.columns.map((c) => <th key={c} className="p-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={i} style={{ borderTop: '0.5px solid var(--border)' }}>
                        {row.map((cell, j) => <td key={j} className="p-2 font-mono">{typeof cell === 'number' ? cell.toFixed(2) : cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* controls + completion + about */}
        <div className="space-y-4">
          <div className="rounded-2xl p-4 space-y-4" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
            {def.params.map((p) => {
              const locked = running && !p.live
              return (
              <div key={p.key} className="space-y-1.5">
                {p.type === 'slider' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <label className="font-medium">{p.label}</label>
                      <span style={{ color: 'var(--muted-foreground)' }}>{values[p.key] as number}{p.unit ? ` ${p.unit}` : ''}</span>
                    </div>
                    <input type="range" min={p.min} max={p.max} step={p.step ?? 1} value={values[p.key] as number} disabled={locked}
                      onChange={(e) => handleParam(p.key, Number(e.target.value))}
                      className="w-full" style={{ accentColor: 'var(--primary)' }} />
                  </>
                )}
                {p.type === 'select' && (
                  <>
                    <label className="text-sm font-medium">{p.label}</label>
                    <select value={values[p.key] as string} disabled={locked} onChange={(e) => handleParam(p.key, e.target.value)}
                      className="w-full rounded-lg border px-2.5 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                      {p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </>
                )}
                {p.type === 'toggle' && (
                  <label className="flex items-center justify-between text-sm font-medium cursor-pointer">
                    {p.label}
                    <input type="checkbox" checked={values[p.key] as boolean} disabled={locked} onChange={(e) => handleParam(p.key, e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                  </label>
                )}
              </div>
              )
            })}

            <div className="flex flex-col gap-2 pt-1">
              {showPlay && (
                <button onClick={handlePlayPause} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                  {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Run</>}
                </button>
              )}
              <div className="flex gap-2">
                <button onClick={handleReset} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
                  <RotateCcw size={15} /> Reset
                </button>
                {showExport && (
                  <button onClick={handleExport} disabled={!data || data.rows.length === 0} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold" style={{ border: '0.5px solid var(--border)', background: 'var(--card)', opacity: !data || data.rows.length === 0 ? 0.5 : 1 }}>
                    <Download size={15} /> Export
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* completion chip — on-brand, replaces the old green/purple bar */}
          {completionConfig && (
            <div className="rounded-2xl p-3" style={{ border: `0.5px solid color-mix(in oklch, ${completion.isCompleted ? 'var(--success)' : 'var(--primary)'} 30%, var(--border))`, background: `color-mix(in oklch, ${completion.isCompleted ? 'var(--success)' : 'var(--primary)'} 10%, var(--card))` }}>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: completion.isCompleted ? 'var(--success)' : 'var(--foreground)' }}>
                {completion.isCompleted ? <><CheckCircle2 size={16} /> Explored — nice work</> : <><Sparkles size={16} /> Explore the simulation</>}
              </div>
              {!completion.isCompleted && (
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'color-mix(in oklch, var(--primary) 18%, var(--card))' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${completion.progress}%`, background: 'var(--primary)' }} />
                </div>
              )}
            </div>
          )}

          {!embedded && def.learning && (
            <div className="rounded-2xl p-4 text-sm space-y-3" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
              <div className="flex items-center gap-2 font-semibold"><Info size={16} style={{ color: accent }} /> About this lab</div>
              {def.learning.objectives && (
                <div>
                  <div className="font-medium mb-1">You&apos;ll learn to</div>
                  <ul className="space-y-1 list-disc list-inside" style={{ color: 'var(--muted-foreground)' }}>{def.learning.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
                </div>
              )}
              {def.learning.tryThis && (
                <div>
                  <div className="font-medium mb-1">Try this</div>
                  <ul className="space-y-1 list-disc list-inside" style={{ color: 'var(--muted-foreground)' }}>{def.learning.tryThis.map((o, i) => <li key={i}>{o}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
