"use client"

import { useMemo, useState, type ReactNode } from 'react'
import {
  PHYSICS_FORMULAS, type FormulaCategory, MCAS_SYMBOLS, GEWA_UNIT_OPTIONS,
  convertToMcas, variableBySymbol,
} from '@/data/physics-reference'
import {
  FORMULA_AST, type Equation, type Term, type Factor,
  moveTerm, moveFactor, isIsolated, solveValue, symbolsInSide,
} from './gewa/algebra'

// GEWA "Solve it" — one substitution-first flow, MCAS notation throughout:
//   Given → pick a (category-filtered) equation → freely rearrange it by tapping
//   terms/factors across the = (each move applies the real inverse operation) →
//   tap a known to drop it into its slot (off-sheet units auto-convert, with the
//   reason shown) → the student computes the number and the block silently checks
//   it against the algebra without revealing it. No re-typing the equation, no
//   duplicate "Working from / Insert" panels, no handwriting fork.

export interface GewaValue {
  given?: string
  equationId?: string
  solveFor?: string
  rearranged?: Equation
  substitutions?: Record<string, { raw: number; rawUnit: string; value: number; unit: string; rule?: string }>
  answer?: string
  // legacy fields kept so older saved responses still load
  equation?: string
  work?: string
}

interface Chip { sym: string; val: string; unit: string }

interface GewaInteractiveProps {
  prompt: string
  givenHint?: string
  equationHint?: string
  equationOptions?: string[]            // legacy: restrict the bank to these display strings
  solveFor?: string                     // the unknown to isolate (defaults to the formula's own LHS)
  equationCategories?: FormulaCategory[] // scope the bank to these topics
  value?: GewaValue
  onSave: (v: GewaValue) => void
}

const CONST_VALUES: Record<string, number> = { G: 6.7e-11, k: 9e9 }
const fieldBg = { background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }
const num = (n: number) => (Number.isInteger(n) ? n.toLocaleString('en-US') : parseFloat(n.toFixed(4)).toLocaleString('en-US'))

function parseGiven(s?: string): Chip[] {
  if (!s) return [{ sym: '', val: '', unit: '' }]
  const parts = s.split(';').map((p) => p.trim()).filter(Boolean)
  if (!parts.length) return [{ sym: '', val: '', unit: '' }]
  return parts.map((piece): Chip => {
    const m = piece.match(/^(\S+)\s*=\s*([\d.\-]+)\s*(.*)$/)
    return m ? { sym: m[1], val: m[2], unit: (m[3] || '').trim() } : { sym: '', val: piece, unit: '' }
  })
}

// ---- small typeset helpers (subscripts like v_i, exponents like d²) --------
function Symbol({ base }: { base: string }) {
  const [h, sub] = base.split('_')
  return <span style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>{h}{sub ? <sub style={{ fontStyle: 'normal' }}>{sub}</sub> : null}</span>
}
function FactorView({ x }: { x: Factor }) {
  return <span><Symbol base={x.base} />{x.exp !== 1 ? <sup>{x.exp}</sup> : null}</span>
}

const badge = (l: string, color: string, fg = 'var(--primary-foreground)') => (
  <span className="grid place-items-center font-bold flex-shrink-0" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14, background: color, color: fg }}>{l}</span>
)
const stepHead = (l: string, color: string, title: string, fg?: string) => (
  <div className="flex items-center gap-2 mb-2">{badge(l, color, fg)}<span className="text-sm font-semibold">{title}</span></div>
)

const coeffStr = (c: number) => (Math.abs(c) === 1 ? '' : Math.abs(c) === 0.5 ? '½' : num(Math.abs(c)))

export default function GewaInteractive({
  prompt, givenHint, equationHint, equationOptions, solveFor, equationCategories, value, onSave,
}: GewaInteractiveProps) {
  const [chips, setChips] = useState<Chip[]>(parseGiven(value?.given))
  const [formulaId, setFormulaId] = useState<string | null>(value?.equationId ?? null)
  const [eq, setEq] = useState<Equation | null>(value?.rearranged ?? (value?.equationId ? FORMULA_AST[value.equationId] : null))
  const [subs, setSubs] = useState<GewaValue['substitutions']>(value?.substitutions ?? {})
  const [convNote, setConvNote] = useState<string | null>(null)
  const [answer, setAnswer] = useState(value?.answer ?? '')
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string }[]>([])
  const [saved, setSaved] = useState(false)

  // Equation bank: filter the MCAS formulas to the lesson's topic(s) (or a legacy
  // explicit list), so a kinematics block shows kinematics formulas only.
  const bank = useMemo(() => {
    let list = PHYSICS_FORMULAS.filter((f) => FORMULA_AST[f.id])
    if (equationCategories && equationCategories.length) list = list.filter((f) => equationCategories.includes(f.category))
    if (equationOptions && equationOptions.length) list = list.filter((f) => equationOptions.includes(f.display))
    return list
  }, [equationCategories, equationOptions])

  const formula = formulaId ? PHYSICS_FORMULAS.find((f) => f.id === formulaId) : null
  const unknown = solveFor || formula?.lhs || ''
  const isolatedOn = eq && unknown ? isIsolated(eq, unknown) : null
  const sourceSide = eq && isolatedOn ? (isolatedOn === 'lhs' ? eq.rhs : eq.lhs) : null

  // ---- givens -------------------------------------------------------------
  const setChip = (i: number, patch: Partial<Chip>) => { setChips((p) => p.map((c, idx) => (idx === i ? { ...c, ...patch } : c))); setSaved(false) }
  const addChip = () => setChips((p) => [...p, { sym: '', val: '', unit: '' }])
  const removeChip = (i: number) => setChips((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p))
  const givenString = () => chips.filter((c) => c.sym || c.val).map((c) => `${c.sym}${c.sym ? ' = ' : ''}${c.val}${c.unit ? ' ' + c.unit : ''}`.trim()).join('; ')

  const pickFormula = (id: string) => {
    setFormulaId(id); setEq(JSON.parse(JSON.stringify(FORMULA_AST[id]))); setSubs({}); setConvNote(null); setAnswer(''); setFeedback([]); setSaved(false)
  }
  const resetEquation = () => { if (formulaId) { setEq(JSON.parse(JSON.stringify(FORMULA_AST[formulaId]))); setSubs({}); setConvNote(null) } }

  // ---- substitution -------------------------------------------------------
  // slots = the distinct variable bases on the source side, minus the unknown.
  const slots = useMemo(() => {
    if (!sourceSide) return [] as string[]
    return [...symbolsInSide(sourceSide)].filter((b) => b !== unknown)
  }, [sourceSide, unknown])

  const fillSlot = (chip: Chip) => {
    if (!chip.sym || !slots.includes(chip.sym)) return
    const raw = parseFloat(chip.val)
    if (Number.isNaN(raw)) return
    const conv = convertToMcas(raw, chip.unit)
    const entry = conv
      ? { raw, rawUnit: chip.unit, value: conv.value, unit: conv.unit, rule: conv.rule }
      : { raw, rawUnit: chip.unit, value: raw, unit: chip.unit }
    setSubs((p) => ({ ...(p || {}), [chip.sym]: entry })); setSaved(false)
    setConvNote(conv ? `${chip.sym} = ${num(raw)} ${chip.unit} → ${num(conv.value)} ${conv.unit}  ·  ${conv.rule}` : null)
  }

  const env = useMemo(() => {
    const e: Record<string, number> = { ...CONST_VALUES }
    Object.entries(subs || {}).forEach(([k, v]) => { e[k] = v.value })
    return e
  }, [subs])

  const constantSlots = slots.filter((s) => CONST_VALUES[s] !== undefined)
  const fillableSlots = slots.filter((s) => CONST_VALUES[s] === undefined)
  const allFilled = fillableSlots.every((s) => subs && subs[s] !== undefined)

  const check = () => {
    const fb: { ok: boolean; msg: string }[] = []
    const filledCount = chips.filter((c) => c.sym && c.val).length
    fb.push(filledCount >= 1 ? { ok: true, msg: `You listed ${filledCount} known${filledCount > 1 ? 's' : ''}.` } : { ok: false, msg: 'List the knowns the problem gives you.' })
    fb.push(formulaId ? { ok: true, msg: `Equation: ${formula?.display}.` } : { ok: false, msg: 'Pick the equation that fits.' })
    fb.push(isolatedOn ? { ok: true, msg: `Solved for ${unknown}.` } : { ok: false, msg: `Rearrange until ${unknown} is by itself.` })
    fb.push(allFilled ? { ok: true, msg: 'All knowns substituted.' } : { ok: false, msg: 'Tap each known to drop it into its slot.' })

    const studentNum = parseFloat((answer.match(/-?\d*\.?\d+/) || [''])[0])
    if (!Number.isNaN(studentNum) && eq && allFilled) {
      const expected = solveValue(eq, unknown, env)
      if (expected === null) {
        fb.push({ ok: true, msg: 'Answer recorded — your teacher checks the value on this one.' })
      } else {
        const tol = Math.max(Math.abs(expected) * 0.02, 1e-9)
        fb.push(Math.abs(studentNum - expected) <= tol
          ? { ok: true, msg: 'That matches the math. Box it with its unit.' }
          : { ok: false, msg: 'That doesn’t match what the equation gives — recheck your arithmetic and units.' })
      }
    } else if (answer.trim()) {
      fb.push({ ok: true, msg: 'Answer recorded.' })
    }
    setFeedback(fb)
  }

  const handleSave = () => {
    // Also write the legacy `equation`/`work` strings so the teacher control room
    // (which reads those keys from saved JSON) shows the chosen equation + the
    // substituted knowns for new structured responses too.
    const workStr = Object.entries(subs || {}).map(([k, v]) => `${k} = ${num(v.value)} ${v.unit}`).join('; ')
    onSave({
      given: givenString(), equationId: formulaId || undefined, solveFor: unknown || undefined,
      rearranged: eq || undefined, substitutions: subs, answer,
      equation: formula?.display, work: workStr || undefined,
    })
    setSaved(true); check()
  }

  // ---- interactive equation (tap a term/factor to send it across =) --------
  const movChip = (onClick: () => void, children: ReactNode, key: string | number) => (
    <button key={key} onClick={onClick} title="tap to move across ="
      style={{ cursor: 'pointer', padding: '2px 8px', border: '1.5px solid var(--primary)', background: 'color-mix(in oklch, var(--primary) 10%, var(--card))', color: 'var(--foreground)', borderRadius: 8, lineHeight: 1.4 }}>
      {children}
    </button>
  )
  const termInner = (t: Term) => {
    const c = coeffStr(t.coeff)
    const numEls = t.num.length ? t.num.map((x, k) => <FactorView key={k} x={x} />) : (t.den.length && !c ? <span>1</span> : null)
    if (t.den.length) {
      return (
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}>
          <span>{c}{numEls}</span>
          <span style={{ width: '100%', height: 2, background: 'var(--foreground)' }} />
          <span style={{ fontStyle: 'italic' }}>{t.den.map((x, k) => <FactorView key={k} x={x} />)}</span>
        </span>
      )
    }
    return <span>{c}{numEls}</span>
  }
  // A side is interactive: many terms → each TERM moves; one term → each FACTOR moves.
  const renderSide = (which: 'lhs' | 'rhs') => {
    if (!eq) return null
    const s = eq[which]
    if (s.terms.length > 1) {
      return s.terms.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {(i > 0 || t.coeff < 0) && <span style={{ color: 'var(--muted-foreground)' }}>{t.coeff < 0 ? '−' : '+'}</span>}
          {movChip(() => { setEq(moveTerm(eq, which, i)); setSaved(false) }, termInner({ ...t, coeff: Math.abs(t.coeff) }), i)}
        </span>
      ))
    }
    const t = s.terms[0]
    if (!t) return <span style={{ color: 'var(--muted-foreground)' }}>0</span>
    const c = coeffStr(t.coeff)
    const numChips = t.num.map((x, k) => movChip(() => { setEq(moveFactor(eq, which, 'num', k)); setSaved(false) }, <FactorView x={x} />, 'n' + k))
    const denChips = t.den.map((x, k) => movChip(() => { setEq(moveFactor(eq, which, 'den', k)); setSaved(false) }, <FactorView x={x} />, 'd' + k))
    if (denChips.length) {
      return (
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{c && <span>{c}</span>}{numChips.length ? numChips : <span>1</span>}</span>
          <span style={{ width: '100%', height: 2, background: 'var(--foreground)' }} />
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{denChips}</span>
        </span>
      )
    }
    return <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{c && <span>{c}</span>}{numChips}</span>
  }

  // ---- substituted source side (numbers replace symbols once dropped) ------
  const renderSub = () => {
    if (!sourceSide) return null
    const renderFactorSub = (x: Factor, k: number) => {
      const s = subs?.[x.base]
      const cval = CONST_VALUES[x.base]
      if (s) return <span key={k} style={{ color: 'var(--foreground)' }}>{num(s.value)}{x.exp !== 1 ? <sup>{x.exp}</sup> : null}</span>
      if (cval !== undefined) return <span key={k} style={{ color: 'var(--foreground)' }}>{num(cval)}{x.exp !== 1 ? <sup>{x.exp}</sup> : null}</span>
      return <span key={k} style={{ padding: '1px 7px', border: '1.5px dashed var(--border)', borderRadius: 7, color: 'var(--muted-foreground)' }}><FactorView x={x} /></span>
    }
    const termSub = (t: Term, i: number, first: boolean) => (
      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {(!first || t.coeff < 0) && <span style={{ color: 'var(--muted-foreground)' }}>{t.coeff < 0 ? '−' : '+'}</span>}
        {coeffStr(t.coeff) && <span>{coeffStr(t.coeff)}</span>}
        {t.num.map(renderFactorSub)}
        {t.den.length ? <span style={{ color: 'var(--muted-foreground)' }}>/</span> : null}
        {t.den.map(renderFactorSub)}
      </span>
    )
    return <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{sourceSide.terms.map((t, i) => termSub(t, i, i === 0))}</span>
  }

  const unknownUnit = variableBySymbol(unknown)?.unit

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--foreground)' }}>{prompt}</p>

      {/* GIVEN */}
      <div>
        {stepHead('G', 'var(--viz-up)', 'Given — pull out what you know')}
        {givenHint && <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>{givenHint}</p>}
        <div className="flex flex-col gap-2">
          {chips.map((c, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <select value={c.sym} onChange={(e) => setChip(i, { sym: e.target.value })} className="rounded-md border px-2 py-1.5 text-sm" style={{ ...fieldBg, width: 90, fontWeight: 700 }}>
                <option value="">sym</option>
                {MCAS_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 700 }}>=</span>
              <input value={c.val} onChange={(e) => setChip(i, { val: e.target.value })} placeholder="value" className="rounded-md border px-2 py-1.5 text-sm" style={{ ...fieldBg, width: 96 }} />
              <select value={c.unit} onChange={(e) => setChip(i, { unit: e.target.value })} className="rounded-md border px-2 py-1.5 text-sm" style={{ ...fieldBg, width: 92 }}>
                <option value="">unit</option>
                {GEWA_UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <button onClick={() => removeChip(i)} className="ml-auto text-lg" style={{ color: 'var(--muted-foreground)' }} aria-label="remove">×</button>
            </div>
          ))}
        </div>
        <button onClick={addChip} className="mt-2 rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--primary)', borderStyle: 'dashed' }}>+ Add a known</button>
      </div>

      {/* EQUATION — pick from the (filtered) bank */}
      <div>
        {stepHead('E', 'var(--primary)', `Equation — pick the one that fits${unknown ? ` (solve for ${unknown})` : ''}`)}
        {equationHint && <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>{equationHint}</p>}
        <div className="flex flex-wrap gap-1.5">
          {bank.map((fm) => (
            <button key={fm.id} onClick={() => pickFormula(fm.id)} title={fm.name}
              className="rounded-md px-2.5 py-1.5 text-sm"
              style={{ border: `1.5px solid ${formulaId === fm.id ? 'var(--primary)' : 'color-mix(in oklch, var(--primary) 30%, var(--border))'}`, background: formulaId === fm.id ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)', color: 'var(--foreground)', fontFamily: 'Georgia, serif' }}>
              {fm.display}
            </button>
          ))}
        </div>
      </div>

      {/* REARRANGE — tap terms/factors across the = */}
      {eq && unknown && (
        <div>
          {stepHead('R', 'oklch(0.58 0.10 255)', `Rearrange — get ${unknown} by itself`, 'white')}
          {isolatedOn ? (
            <p className="text-xs mb-2" style={{ color: 'var(--success)' }}>✓ Solved for {unknown}. Now substitute your knowns below.</p>
          ) : (
            <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Tap a term or factor to move it across the = — the operation flips automatically.</p>
          )}
          <div className="rounded-xl p-4" style={{ border: '0.5px solid var(--border)', background: 'var(--card)', fontSize: 22 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{renderSide('lhs')}</span>
              <span style={{ color: 'var(--muted-foreground)' }}>=</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{renderSide('rhs')}</span>
            </span>
          </div>
          {!isolatedOn && <button onClick={resetEquation} className="mt-2 text-xs rounded-md border px-2.5 py-1" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Reset equation</button>}
        </div>
      )}

      {/* SUBSTITUTE — tap a known to drop it into its slot */}
      {isolatedOn && sourceSide && (
        <div>
          {stepHead('S', 'var(--reward)', 'Substitute — tap a known to drop it in', 'var(--reward-foreground)')}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {chips.filter((c) => c.sym && c.val).map((c, i) => {
              const used = subs && subs[c.sym] !== undefined
              const usable = slots.includes(c.sym)
              return (
                <button key={i} disabled={!usable} onClick={() => fillSlot(c)}
                  className="rounded-md px-2.5 py-1.5 text-sm"
                  style={{ border: `0.5px solid ${used ? 'var(--border)' : usable ? 'var(--success)' : 'var(--border)'}`, background: used ? 'var(--secondary)' : usable ? 'color-mix(in oklch, var(--success) 12%, var(--card))' : 'var(--card)', color: usable ? 'var(--foreground)' : 'var(--muted-foreground)', opacity: used ? 0.55 : usable ? 1 : 0.5, fontFamily: 'Georgia, serif', cursor: usable && !used ? 'pointer' : 'default' }}>
                  {used ? '✓ ' : ''}{c.sym} = {c.val} {c.unit}
                </button>
              )
            })}
          </div>
          {convNote && <p className="text-xs mb-2 rounded-md px-3 py-2" style={{ background: 'color-mix(in oklch, var(--reward) 16%, transparent)', color: 'var(--reward-foreground)' }}><b>Converted to MCAS units:</b> {convNote}</p>}
          {constantSlots.length > 0 && <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Constant{constantSlots.length > 1 ? 's' : ''} filled for you: {constantSlots.join(', ')}.</p>}
          <div className="rounded-xl p-4" style={{ border: '0.5px solid var(--border)', background: 'var(--card)', fontSize: 22 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Symbol base={unknown} />
              <span style={{ color: 'var(--muted-foreground)' }}>=</span>
              {renderSub()}
            </span>
          </div>
        </div>
      )}

      {/* ANSWER — student computes; block checks silently */}
      {isolatedOn && (
        <div>
          {stepHead('A', 'var(--success)', 'Answer — compute it and box it', 'white')}
          <div className="flex items-center gap-2 flex-wrap">
            <input value={answer} onChange={(e) => { setAnswer(e.target.value); setSaved(false) }} placeholder={`your answer${unknownUnit ? ` (in ${unknownUnit})` : ''}`}
              className="rounded-md border px-3 py-2 text-sm" style={{ ...fieldBg, width: 220 }} />
            {unknownUnit && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>expected unit: {unknownUnit}</span>}
          </div>
        </div>
      )}

      {/* check + save */}
      <div className="flex items-center gap-2">
        <button onClick={check} className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>Check my work</button>
        <button onClick={handleSave} className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Save work</button>
        {saved && <span className="text-xs" style={{ color: 'var(--success)' }}>Saved ✓</span>}
      </div>

      {feedback.length > 0 && (
        <div className="flex flex-col gap-2">
          {feedback.map((nd, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm" style={{ background: nd.ok ? 'color-mix(in oklch, var(--success) 13%, transparent)' : 'color-mix(in oklch, var(--reward) 18%, transparent)', color: nd.ok ? 'var(--success)' : 'var(--reward-foreground)' }}>
              <span style={{ fontWeight: 700 }}>{nd.ok ? '✓' : '⚠'}</span><span>{nd.msg}</span>
            </div>
          ))}
          <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
            These check your setup and arithmetic. Your teacher reads your work and sets your mastery score.
          </p>
        </div>
      )}
    </div>
  )
}
