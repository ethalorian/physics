"use client"

import { useState } from 'react'
import PaintPad from './PaintPad'
import EquationSandbox, { type SandboxValue } from './EquationSandbox'
import EquationField from './EquationField'
import type { Stroke } from './DoodleCanvas'

// Given + Equation stay structured (chips / equation bank). Work & Answer are now
// HANDWRITTEN on a drawing pad (workStrokes) — students show their solution by
// hand and box the answer; the teacher control-room drawer renders the strokes.
// `work`/`answer` strings remain optional for backward compatibility with older
// saved responses.
export interface GewaValue {
  given?: string
  equation?: string
  work?: string
  answer?: string
  workStrokes?: Stroke[]
  sandbox?: SandboxValue
}

interface Chip { sym: string; val: string; unit: string }

interface GewaInteractiveProps {
  prompt: string
  givenHint?: string
  equationHint?: string
  equationOptions?: string[]
  value?: GewaValue
  onSave: (v: GewaValue) => void
}

const DEFAULT_EQUATIONS = ['v = d / t', 'd = v × t', 'a = Δv / Δt', 'v = v₀ + a·t', 'd = v₀·t + ½at²']
const SYMBOLS = ['d', 't', 'v', 'a', 'v₀', 'x', 'm', 'F']
const UNITS = ['m', 'km', 'cm', 's', 'min', 'h', 'm/s', 'km/h', 'm/s²', 'kg', 'N']

function parseGiven(s?: string): Chip[] {
  if (!s) return [{ sym: '', val: '', unit: '' }]
  const parts = s.split(';').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return [{ sym: '', val: '', unit: '' }]
  return parts.map((piece): Chip => {
    const m = piece.match(/^(\S+)\s*=\s*([\d.\-]+)\s*(.*)$/)
    if (m) return { sym: m[1], val: m[2], unit: (m[3] || '').trim() }
    return { sym: '', val: piece, unit: '' }
  })
}

const fieldBg = { background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }

export default function GewaInteractive({ prompt, givenHint, equationHint, equationOptions, value, onSave }: GewaInteractiveProps) {
  const equations = equationOptions && equationOptions.length > 0 ? equationOptions : DEFAULT_EQUATIONS
  const [chips, setChips] = useState<Chip[]>(parseGiven(value?.given))
  const [equation, setEquation] = useState(value?.equation ?? '')
  const [sandbox, setSandbox] = useState<SandboxValue>(value?.sandbox ?? { lines: [] })
  const [workStrokes, setWorkStrokes] = useState<Stroke[]>(value?.workStrokes ?? [])
  const [workMode, setWorkMode] = useState<'type' | 'write'>(value?.workStrokes?.length ? 'write' : 'type')
  const [nudges, setNudges] = useState<{ ok: boolean; msg: string }[]>([])
  const [saved, setSaved] = useState(false)

  // The Given chips double as the sandbox's variable palette.
  const sandboxVars = chips.filter((c) => c.sym).map((c) => ({ symbol: c.sym, value: c.val || undefined, unit: c.unit || undefined }))

  const setChip = (i: number, patch: Partial<Chip>) => {
    setChips((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
    setSaved(false)
  }
  const addChip = () => setChips((prev) => [...prev, { sym: '', val: '', unit: '' }])
  const removeChip = (i: number) => setChips((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  const givenString = () =>
    chips
      .filter((c) => c.sym || c.val)
      .map((c) => `${c.sym}${c.sym ? ' = ' : ''}${c.val}${c.unit ? ' ' + c.unit : ''}`.trim())
      .join('; ')

  const buildValue = (): GewaValue => ({ given: givenString(), equation, sandbox, workStrokes })

  const workShown = sandbox.lines.some((l) => l.trim()) || workStrokes.length > 0
  const runCheck = () => {
    const filled = chips.filter((c) => c.sym || c.val).length
    const n: { ok: boolean; msg: string }[] = [
      filled >= 2 ? { ok: true, msg: `You listed ${filled} knowns.` } : { ok: false, msg: 'Add at least the two knowns the problem gives you.' },
      equation ? { ok: true, msg: `Equation chosen: ${equation}.` } : { ok: false, msg: 'Choose an equation before you solve.' },
      workShown ? { ok: true, msg: 'You showed your worked solution.' } : { ok: false, msg: 'Show your work — build it in the sandbox or write it on the pad, and finish with the answer.' },
    ]
    setNudges(n)
  }

  const handleSave = () => {
    onSave(buildValue())
    setSaved(true)
    runCheck()
  }

  // Color-coded GEWA steps (matches the design-system solve-box):
  // G = sage (what you know) · E = indigo (the relationship) ·
  // W = neutral (show your steps) · A = gold (the answer / the prize).
  const badge = (l: string, color: string, fg: string = 'var(--primary-foreground)') => (
    <span className="grid place-items-center font-bold flex-shrink-0" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14, background: color, color: fg }}>{l}</span>
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--foreground)' }}>{prompt}</p>

      {/* GIVEN */}
      <div>
        <div className="flex items-center gap-2 mb-2">{badge('G', 'var(--viz-up)')}<span className="text-sm font-semibold">Given — pull out what you know</span></div>
        {givenHint && <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>{givenHint}</p>}
        <div className="flex flex-col gap-2">
          {chips.map((c, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <select value={c.sym} onChange={(e) => setChip(i, { sym: e.target.value })} className="rounded-md border px-2 py-1.5 text-sm" style={{ ...fieldBg, width: 80, fontWeight: 700 }}>
                <option value="">sym</option>
                {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 700 }}>=</span>
              <input value={c.val} onChange={(e) => setChip(i, { val: e.target.value })} placeholder="value" className="rounded-md border px-2 py-1.5 text-sm" style={{ ...fieldBg, width: 100 }} />
              <select value={c.unit} onChange={(e) => setChip(i, { unit: e.target.value })} className="rounded-md border px-2 py-1.5 text-sm" style={{ ...fieldBg, width: 92 }}>
                <option value="">unit</option>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <button onClick={() => removeChip(i)} className="ml-auto text-lg" style={{ color: 'var(--muted-foreground)' }} aria-label="remove">×</button>
            </div>
          ))}
        </div>
        <button onClick={addChip} className="mt-2 rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--primary)', borderStyle: 'dashed' }}>+ Add a known</button>
      </div>

      {/* EQUATION */}
      <div>
        <div className="flex items-center gap-2 mb-2">{badge('E', 'var(--primary)')}<span className="text-sm font-semibold">Equation — type it or pick the one that fits</span></div>
        {equationHint && <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>{equationHint}</p>}
        <EquationField
          value={equation}
          onChange={(v) => { setEquation(v); setSaved(false) }}
          presets={equations}
        />
      </div>

      {/* WORK & ANSWER — handwritten on the pad */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {badge('W', 'var(--muted-foreground)')}{badge('A', 'var(--reward)', 'var(--reward-foreground)')}
          <span className="text-sm font-semibold">Work &amp; Answer — show your steps and box the answer</span>
        </div>
        {equation && (
          <div className="text-xs mb-2 rounded-md px-3 py-2" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--foreground)' }}>
            Working from: <b style={{ fontFamily: 'Georgia, serif' }}>{equation}</b>
          </div>
        )}
        {/* mode toggle: type in the equation sandbox, or handwrite */}
        <div className="inline-flex rounded-lg overflow-hidden mb-2" style={{ border: '0.5px solid var(--border)' }}>
          {(['type', 'write'] as const).map((m) => (
            <button key={m} onClick={() => { setWorkMode(m); setSaved(false) }} className="px-3 py-1.5 text-xs font-semibold"
              style={{ background: workMode === m ? 'var(--primary)' : 'var(--card)', color: workMode === m ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}>
              {m === 'type' ? 'Type it' : 'Write it'}
            </button>
          ))}
        </div>
        {workMode === 'type' ? (
          <EquationSandbox
            embedded
            variables={sandboxVars}
            equationToken={equation || undefined}
            value={sandbox}
            onChange={(v) => { setSandbox(v); setSaved(false) }}
          />
        ) : (
          <>
            <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Write your solution by hand: substitute your knowns, solve step by step, and circle your final answer with its unit.</p>
            <PaintPad value={workStrokes} onChange={(s) => { setWorkStrokes(s); setSaved(false) }} />
          </>
        )}
      </div>

      {/* check + save */}
      <div className="flex items-center gap-2">
        <button onClick={runCheck} className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>Check my work</button>
        <button onClick={handleSave} className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Save work</button>
        {saved && <span className="text-xs" style={{ color: 'var(--success)' }}>Saved ✓</span>}
      </div>

      {nudges.length > 0 && (
        <div className="flex flex-col gap-2">
          {nudges.map((nd, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm" style={{ background: nd.ok ? 'color-mix(in oklch, var(--success) 13%, transparent)' : 'color-mix(in oklch, var(--reward) 18%, transparent)', color: nd.ok ? 'var(--success)' : 'var(--reward-foreground)' }}>
              <span style={{ fontWeight: 700 }}>{nd.ok ? '✓' : '⚠'}</span>
              <span>{nd.msg}</span>
            </div>
          ))}
          <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
            These check your setup, not whether the number is &ldquo;right.&rdquo; Your teacher reads your work and sets your mastery score.
          </p>
        </div>
      )}
    </div>
  )
}
