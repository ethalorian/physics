"use client"

import { ProjectionSeiContext } from '@/components/present/ProjectionSeiContext'
import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useDraft } from './useDraft'
import PaintPad from './PaintPad'
import MathMarkdown from '@/components/MathMarkdown'
import PhysicsDiagram from './PhysicsDiagram'
import type { Stroke } from './DoodleCanvas'
import type { DiagramScene, ResponseMode, SeiFrame, SeiScaffold } from '@/data/content-blocks'
import { effectiveLevel, frameTierFor, modesFor, pickFrame, pickL1, scaffoldsOn, type ScaffoldLevel } from '@/lib/sei'
import { useLanguageProfile } from '@/components/lessons/LanguageProfileProvider'

/**
 * SEI layer for capture blocks — the eight principles rendered as data:
 *   visual first · Tier 2 glossary (via prose) · L1 as a bridge · frames for
 *   output · talk before write · many ways to show it · fading scaffolds ·
 *   rate physics only.
 * A block passes its `sei` and gets back: the prompt with its L1 line, the
 * visual, the frame + word bank for the current level, the mode switch, the
 * fairness note — and the `scaffolds` list to log with the response.
 */

const C = { indigo: 'var(--foreground)', muted: 'var(--muted-foreground)', hairline: 'var(--border)', tint: 'var(--secondary)', primary: 'var(--primary)' }

export interface SeiState {
  level: ScaffoldLevel
  l1Text: string | null
  frame: SeiFrame | null
  frameRequested: boolean
  requestFrame: () => void
  wordBank: string[]
  modes: ResponseMode[]
  mode: ResponseMode
  setMode: (m: ResponseMode) => void
  talkFirst: boolean
  talkDone: boolean
  setTalkDone: (v: boolean) => void
  scaffolds: string[]
}

export function useSei(sei: SeiScaffold | undefined, opts: { fallbackFrame?: string; wordBank?: string[]; talkFirst?: boolean; defaultMode?: ResponseMode; extraModes?: ResponseMode[]; supportedModes?: ResponseMode[] } = {}): SeiState {
  const { profile, dial, showL1 } = useLanguageProfile()
  const projectionSupports = useContext(ProjectionSeiContext)
  const level = projectionSupports === null ? effectiveLevel(sei, profile, dial) : projectionSupports ? 'full' : 'bare'
  const [frameRequested, setFrameRequested] = useState(false)
  const [mode, setMode] = useState<ResponseMode>(opts.defaultMode ?? 'text')
  const [talkDone, setTalkDone] = useState(false)

  const l1Text = projectionSupports !== false && showL1 ? pickL1(sei?.prompt_l1, profile?.homeLang) : null
  const tier = frameTierFor(level)
  const frames: SeiFrame[] | undefined = sei?.frames?.length ? sei.frames : opts.fallbackFrame ? [{ level: 2, text: opts.fallbackFrame }] : undefined
  const frame = projectionSupports === false ? null : tier ? pickFrame(frames, tier) : frameRequested ? pickFrame(frames, 3) ?? pickFrame(frames, 2) : null
  const wordBank = projectionSupports === false ? [] : level === 'bare' && !frameRequested ? [] : (sei?.wordBank ?? opts.wordBank ?? [])
  const offeredModes = modesFor({ ...sei, modes: [...(sei?.modes ?? []), ...(opts.extraModes ?? [])] }, level, [opts.defaultMode ?? 'text'])
  const modes = offeredModes.filter((m) => (opts.supportedModes ?? ['text', 'sketch', 'choice']).includes(m))
  if (!modes.length) modes.push('text')
  const talkFirst = Boolean(sei?.talkFirst || opts.talkFirst) && level !== 'bare'
  useEffect(() => { if (!modes.includes(mode)) setMode(modes[0]) }, [modes, mode])

  const scaffolds = useMemo(() => scaffoldsOn({ level, l1: Boolean(l1Text), frame, wordBank: wordBank.length > 0, visual: Boolean(sei?.visual || sei?.visualBlockId), talkFirst, mode }), [level, l1Text, frame, wordBank.length, sei?.visual, sei?.visualBlockId, talkFirst, mode])

  return { level, l1Text, frame, frameRequested, requestFrame: () => setFrameRequested(true), wordBank, modes, mode, setMode, talkFirst, talkDone, setTalkDone, scaffolds }
}

// ---------------------------------------------------------------- parts

export function SeiPrompt({ prompt, l1Text, children }: { prompt: string; l1Text: string | null; children?: ReactNode }) {
  const { profile } = useLanguageProfile()
  return (
    <div className="mb-2">
      <div className="text-sm" style={{ color: C.indigo }}><MathMarkdown content={prompt} />{children}</div>
      {l1Text && <p className="text-sm mt-0.5" style={{ color: C.muted }} lang={profile?.homeLang ?? undefined}>{l1Text}</p>}
    </div>
  )
}

export function SeiVisual({ visual }: { visual: SeiScaffold['visual'] }) {
  if (!visual) return null
  if ('src' in visual) return <img src={visual.src} alt={visual.alt} className="rounded-md border mb-2" style={{ borderColor: C.hairline, maxWidth: '100%' }} />
  const s = visual as DiagramScene
  return (
    <div className="mb-2 rounded-md border p-2" style={{ borderColor: C.hairline, background: 'var(--card)' }}>
      <PhysicsDiagram kind={s.kind} title={s.title} caption={s.caption} forces={s.forces} vectors={s.vectors} showResultant={s.showResultant} dots={s.dots} components={s.components} links={s.links} leftMag={s.leftMag} rightMag={s.rightMag} veerDir={s.veerDir} />
    </div>
  )
}

export function SeiFrameBox({ state, onUseFrame }: { state: SeiState; onUseFrame?: (text: string) => void }) {
  const projectionSupports = useContext(ProjectionSeiContext)
  if (projectionSupports === false) return null
  const { frame, wordBank, level, frameRequested, requestFrame } = state
  if (!frame && wordBank.length === 0) {
    if (level === 'bare' && !frameRequested) return (
      <button type="button" onClick={requestFrame} className="text-xs underline mb-2" style={{ color: C.muted }}>Need a starter? · ¿Necesitas ayuda para empezar?</button>
    )
    return null
  }
  return (
    <div className="rounded-md border p-2 mb-2 text-sm" style={{ borderColor: C.hairline, background: C.tint }}>
      {frame && (
        <div className="flex items-start gap-2">
          <p className="italic flex-1" style={{ color: C.indigo }}>{frame.text}</p>
          {onUseFrame && <button type="button" onClick={() => onUseFrame(frame.text)} className="text-xs rounded border px-2 py-0.5" style={{ borderColor: C.hairline, background: 'var(--card)' }}>Use frame</button>}
        </div>
      )}
      {wordBank.length > 0 && (
        <p className="text-xs mt-1" style={{ color: C.muted }}>Word bank · Banco de palabras: {wordBank.map((w, i) => <span key={i} className="inline-block rounded px-1.5 py-0.5 mr-1 mb-1" style={{ background: 'var(--card)', border: `1px solid ${C.hairline}` }}>{w}</span>)}</p>
      )}
    </div>
  )
}

export function SeiModeSwitch({ state }: { state: SeiState }) {
  const { modes, mode, setMode } = state
  if (modes.length <= 1) return null
  const label: Record<ResponseMode, string> = { text: '✎ Write', sketch: '✐ Sketch it', audio: '🎙 Say it', label: '🏷 Label it', choice: 'Choose' }
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {modes.map((m) => (
        <button key={m} aria-pressed={mode === m} type="button" onClick={() => setMode(m)} className="text-xs rounded-full border px-2.5 py-1"
          style={{ borderColor: mode === m ? C.primary : C.hairline, background: mode === m ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)', color: C.indigo, fontWeight: mode === m ? 700 : 500 }}>
          {label[m]}
        </button>
      ))}
    </div>
  )
}

/** "Say it first": a 60-second partner rehearsal before the box opens. */
export function SeiTalkFirst({ state }: { state: SeiState }) {
  const { talkFirst, talkDone, setTalkDone } = state
  const [left, setLeft] = useState(60)
  useEffect(() => {
    if (!talkFirst || talkDone) return
    if (left <= 0) { setTalkDone(true); return }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [talkFirst, talkDone, left, setTalkDone])
  if (!talkFirst || talkDone) return null
  return (
    <div className="rounded-md border p-2 mb-2 text-sm flex items-center gap-3" style={{ borderColor: C.hairline, background: C.tint }}>
      <span style={{ color: C.indigo }}><b>Say it first.</b> Tell your partner your answer — in any language — then write. · <i>Dilo primero a tu compañero.</i></span>
      <span className="font-mono text-xs" style={{ color: C.muted }}>{left}s</span>
      <button type="button" onClick={() => setTalkDone(true)} className="text-xs rounded border px-2 py-0.5 ml-auto" style={{ borderColor: C.hairline, background: 'var(--card)' }}>We talked</button>
    </div>
  )
}

export function SeiFairnessNote() {
  const projectionSupports = useContext(ProjectionSeiContext)
  if (projectionSupports === false) return null
  return <p className="text-[11px] mt-1" style={{ color: C.muted }}>Rated on the physics, not the English. · Se evalúa la física, no el inglés.</p>
}

/** Sketch-mode answer surface (principle 6): the drawing IS the answer. */
export function SeiSketchAnswer({ value, onChange, labelBank }: { value: Stroke[]; onChange: (s: Stroke[]) => void; labelBank?: string[] }) {
  return (
    <div>
      {labelBank && labelBank.length > 0 && (
        <p className="text-xs mb-1" style={{ color: C.muted }}>Labels · Etiquetas: {labelBank.join(' · ')}</p>
      )}
      <PaintPad value={value} onChange={onChange} />
    </div>
  )
}

/** Text answer with the whole SEI layer around it. Saves { text | strokes, mode }. */
export function SeiTextCapture({ sei, prompt, fallbackFrame, wordBank, talkFirst, placeholder, value, onSave, onDraft }: {
  sei?: SeiScaffold
  prompt: string
  fallbackFrame?: string
  wordBank?: string[]
  talkFirst?: boolean
  placeholder?: string
  value?: unknown
  onSave: (response: { text?: string; strokes?: Stroke[]; mode: ResponseMode }, scaffolds: string[], mode: ResponseMode) => void | Promise<boolean>
  /** as-you-type draft of the same shape onSave sends (autosave; never evidence) */
  onDraft?: (response: { text?: string; strokes?: Stroke[]; mode: ResponseMode }) => void
}) {
  const prior = (typeof value === 'string' ? { text: value } : (value as { text?: string; strokes?: Stroke[]; mode?: ResponseMode } | undefined)) ?? {}
  const state = useSei(sei, { fallbackFrame, wordBank, talkFirst, defaultMode: prior.mode === 'sketch' ? 'sketch' : 'text', supportedModes: ['text', 'sketch'], extraModes: prior.mode === 'sketch' ? ['sketch'] : [] })
  const [text, setText] = useState(prior.text ?? '')
  const [strokes, setStrokes] = useState<Stroke[]>(prior.strokes ?? [])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [touched, setTouched] = useState(false)
  useEffect(() => { if (!touched) { setText(prior.text ?? ''); setStrokes(prior.strokes ?? []) } }, [prior.text, prior.strokes, touched])
  useDraft(onDraft ?? (() => {}), touched ? ({ text, strokes, mode: state.mode }) : undefined)
  const gated = state.talkFirst && !state.talkDone
  const canSave = !gated && (state.mode === 'sketch' ? strokes.length > 0 : text.trim().length > 0 && !/_{2,}/.test(text) && text.trim() !== state.frame?.text.trim())
  return (
    <div>
      <SeiPrompt prompt={prompt} l1Text={state.l1Text} />
      <SeiVisual visual={sei?.visual} />
      <SeiTalkFirst state={state} />
      <SeiModeSwitch state={{ ...state, setMode: (mode) => { state.setMode(mode); setTouched(true); setSaved(false) } }} />
      <SeiFrameBox state={state} onUseFrame={(f) => { if (!text.trim()) { setText(f); setTouched(true) } }} />
      {state.mode === 'sketch' ? (
        <SeiSketchAnswer value={strokes} onChange={(s) => { setStrokes(s); setSaved(false); setTouched(true) }} labelBank={sei?.labelBank} />
      ) : (
        <textarea aria-label={prompt} value={text} onChange={(e) => { setText(e.target.value); setSaved(false); setTouched(true) }} placeholder={placeholder} rows={4} disabled={gated}
          className="w-full rounded-md border p-2 text-sm disabled:opacity-60" style={{ borderColor: C.hairline, color: C.indigo, background: 'var(--card)' }} />
      )}
      <div className="flex items-center gap-2 mt-1">
        <button type="button" onClick={async () => {
          if (!canSave || saving) return
          setSaving(true); setSaveError(false)
          try {
            const ok = await onSave({ text: text.trim(), strokes, mode: state.mode }, state.scaffolds, state.mode)
            setSaved(ok !== false); setSaveError(ok === false)
            if (ok !== false) setTouched(false)
          } catch { setSaveError(true) } finally { setSaving(false) }
        }} disabled={!canSave || saving} className="text-sm font-bold rounded-lg px-4 py-2.5 disabled:opacity-50"
          style={{ color: 'var(--primary-foreground)', background: C.primary }}>
          {saving ? 'Saving…' : saved ? 'Answer saved ✓' : saveError ? 'Retry save' : 'Save answer'}
        </button>
        <span role="status" className="text-sm" style={{ color: C.muted }}>
          {saveError ? 'Couldn’t save. Please retry.' : touched && !saved ? 'Changes need saving. Drafts are kept automatically.' : ''}
        </span>
        {!canSave && !gated && <span className="text-xs" style={{ color: C.muted }}>Add your own reasoning or a sketch first.</span>}
      </div>
      <SeiFairnessNote />
    </div>
  )
}
