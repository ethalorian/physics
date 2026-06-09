"use client"

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  PHYSICS_FORMULAS, type FormulaCategory, MCAS_SYMBOLS, GEWA_UNIT_OPTIONS,
  convertToMcas, variableBySymbol,
} from '@/data/physics-reference'
import {
  FORMULA_AST, type Equation, type Term, type Factor,
  moveTerm, moveFactor, isIsolated, solveValue, symbolsInSide,
} from './gewa/algebra'

// GEWA "Solve it" — one substitution-first flow, MCAS notation throughout, driven
// by real drag-and-drop (pointer events, so it works with a mouse and on iPads):
//   Given → pick a (category-filtered) equation → DRAG terms/factors across the =
//   to rearrange (each move applies the real inverse operation) → DRAG a known
//   onto a variable to replace it (off-sheet units auto-convert, reason shown) →
//   the student computes the number and the block silently checks it.

export interface GewaValue {
  given?: string
  equationId?: string
  solveFor?: string
  rearranged?: Equation
  substitutions?: Record<string, { raw: number; rawUnit: string; value: number; unit: string; rule?: string }>
  answer?: string
  equation?: string   // legacy display string, kept for the teacher control room
  work?: string       // legacy substitution summary
}

interface Chip { sym: string; val: string; unit: string }

interface GewaInteractiveProps {
  prompt: string
  givenHint?: string
  equationHint?: string
  equationOptions?: string[]
  equationIds?: string[]        // curated subset of formula ids — the unit-relevant set
  solveFor?: string
  equationCategories?: FormulaCategory[]
  value?: GewaValue
  onSave: (v: GewaValue) => void
}

// What's being dragged.
type Drag =
  | { type: 'move'; which: 'lhs' | 'rhs'; kind: 'term'; index: number; label: string }
  | { type: 'move'; which: 'lhs' | 'rhs'; kind: 'factor'; pos: 'num' | 'den'; index: number; label: string }
  | { type: 'given'; chip: Chip; label: string }

const CONST_VALUES: Record<string, number> = { G: 6.7e-11, k: 9e9 }
const fieldBg = { background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }
const num = (n: number) => (Number.isInteger(n) ? n.toLocaleString('en-US') : parseFloat(n.toFixed(4)).toLocaleString('en-US'))
const coeffStr = (c: number) => (Math.abs(c) === 1 ? '' : Math.abs(c) === 0.5 ? '½' : num(Math.abs(c)))

function parseGiven(s?: string): Chip[] {
  if (!s) return [{ sym: '', val: '', unit: '' }]
  const parts = s.split(';').map((p) => p.trim()).filter(Boolean)
  if (!parts.length) return [{ sym: '', val: '', unit: '' }]
  return parts.map((piece): Chip => {
    const m = piece.match(/^(\S+)\s*=\s*([\d.\-]+)\s*(.*)$/)
    return m ? { sym: m[1], val: m[2], unit: (m[3] || '').trim() } : { sym: '', val: piece, unit: '' }
  })
}

function Symbol({ base }: { base: string }) {
  const [h, sub] = base.split('_')
  return <span style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>{h}{sub ? <sub style={{ fontStyle: 'normal' }}>{sub}</sub> : null}</span>
}
function FactorView({ x }: { x: Factor }) {
  return <span><Symbol base={x.base} />{x.exp !== 1 ? <sup>{x.exp}</sup> : null}</span>
}
const factorLabel = (x: Factor) => x.base.replace('_', '') + (x.exp !== 1 ? `^${x.exp}` : '')

const badge = (l: string, color: string, fg = 'var(--primary-foreground)') => (
  <span className="grid place-items-center font-bold flex-shrink-0" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14, background: color, color: fg }}>{l}</span>
)
const stepHead = (l: string, color: string, title: string, fg?: string) => (
  <div className="flex items-center gap-2 mb-2">{badge(l, color, fg)}<span className="text-sm font-semibold">{title}</span></div>
)

export default function GewaInteractive({
  prompt, givenHint, equationHint, equationOptions, equationIds, solveFor, equationCategories, value, onSave,
}: GewaInteractiveProps) {
  const [chips, setChips] = useState<Chip[]>(parseGiven(value?.given))
  const [formulaId, setFormulaId] = useState<string | null>(value?.equationId ?? null)
  const [eq, setEq] = useState<Equation | null>(value?.rearranged ?? (value?.equationId ? FORMULA_AST[value.equationId] : null))
  const [subs, setSubs] = useState<GewaValue['substitutions']>(value?.substitutions ?? {})
  const [convNote, setConvNote] = useState<string | null>(null)
  const [answer, setAnswer] = useState(value?.answer ?? '')
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string }[]>([])
  const [saved, setSaved] = useState(false)

  // drag state
  const [drag, setDrag] = useState<Drag | null>(null)
  const [pt, setPt] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hover, setHover] = useState<string | null>(null)

  const formula = formulaId ? PHYSICS_FORMULAS.find((f) => f.id === formulaId) : null
  const unknown = solveFor || formula?.lhs || ''
  const isolatedOn = eq && unknown ? isIsolated(eq, unknown) : null
  const sourceSide = eq && isolatedOn ? (isolatedOn === 'lhs' ? eq.rhs : eq.lhs) : null

  // Bank shown to the student — keep it short and unit-relevant. Precedence:
  // an explicit curated id list → topic categories → legacy display list → all.
  const bank = useMemo(() => {
    let list = PHYSICS_FORMULAS.filter((f) => FORMULA_AST[f.id])
    if (equationIds && equationIds.length) list = list.filter((f) => equationIds.includes(f.id))
    else if (equationCategories && equationCategories.length) list = list.filter((f) => equationCategories.includes(f.category))
    else if (equationOptions && equationOptions.length) list = list.filter((f) => equationOptions.includes(f.display))
    return list
  }, [equationIds, equationCategories, equationOptions])

  const slots = useMemo(() => {
    if (!sourceSide) return [] as string[]
    return [...symbolsInSide(sourceSide)].filter((b) => b !== unknown)
  }, [sourceSide, unknown])

  // ---- givens -------------------------------------------------------------
  const setChip = (i: number, patch: Partial<Chip>) => { setChips((p) => p.map((c, idx) => (idx === i ? { ...c, ...patch } : c))); setSaved(false) }
  const addChip = () => setChips((p) => [...p, { sym: '', val: '', unit: '' }])
  const removeChip = (i: number) => setChips((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p))
  const givenString = () => chips.filter((c) => c.sym || c.val).map((c) => `${c.sym}${c.sym ? ' = ' : ''}${c.val}${c.unit ? ' ' + c.unit : ''}`.trim()).join('; ')

  const pickFormula = (id: string) => {
    setFormulaId(id); setEq(JSON.parse(JSON.stringify(FORMULA_AST[id]))); setSubs({}); setConvNote(null); setAnswer(''); setFeedback([]); setSaved(false)
  }
  const resetEquation = () => { if (formulaId) { setEq(JSON.parse(JSON.stringify(FORMULA_AST[formulaId]))); setSubs({}); setConvNote(null) } }

  const fillSlot = (chip: Chip) => {
    const raw = parseFloat(chip.val)
    if (Number.isNaN(raw)) return
    const conv = convertToMcas(raw, chip.unit)
    const entry = conv
      ? { raw, rawUnit: chip.unit, value: conv.value, unit: conv.unit, rule: conv.rule }
      : { raw, rawUnit: chip.unit, value: raw, unit: chip.unit }
    setSubs((p) => ({ ...(p || {}), [chip.sym]: entry })); setSaved(false)
    setConvNote(conv ? `${chip.sym} = ${num(raw)} ${chip.unit} → ${num(conv.value)} ${conv.unit}  ·  ${conv.rule}` : null)
  }

  // ---- drag-and-drop engine (pointer events: mouse + touch) ---------------
  const startDrag = (e: React.PointerEvent, d: Drag) => {
    e.preventDefault()
    setPt({ x: e.clientX, y: e.clientY }); setDrag(d); setHover(null)
  }
  useEffect(() => {
    if (!drag) return
    const dropUnder = (x: number, y: number): string | null => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null
      const t = el?.closest('[data-drop]') as HTMLElement | null
      return t?.getAttribute('data-drop') ?? null
    }
    const onMove = (e: PointerEvent) => { setPt({ x: e.clientX, y: e.clientY }); setHover(dropUnder(e.clientX, e.clientY)) }
    const onUp = (e: PointerEvent) => {
      const drop = dropUnder(e.clientX, e.clientY)
      if (drop && eq) {
        if (drag.type === 'move') {
          const target = drop.startsWith('side:') ? drop.slice(5) : null
          if ((target === 'lhs' || target === 'rhs') && target !== drag.which) {
            setEq(drag.kind === 'term' ? moveTerm(eq, drag.which, drag.index) : moveFactor(eq, drag.which, drag.pos, drag.index))
            setSaved(false)
          }
        } else if (drag.type === 'given') {
          const base = drop.startsWith('slot:') ? drop.slice(5) : null
          if (base && base === drag.chip.sym) fillSlot(drag.chip)
        }
      }
      setDrag(null); setHover(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, eq])

  const dragHandleStyle = { cursor: 'grab', touchAction: 'none' as const, userSelect: 'none' as const }

  // ---- env + answer check -------------------------------------------------
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
    fb.push(allFilled ? { ok: true, msg: 'All knowns substituted.' } : { ok: false, msg: 'Drag each known onto its slot.' })
    const studentNum = parseFloat((answer.match(/-?\d*\.?\d+/) || [''])[0])
    if (!Number.isNaN(studentNum) && eq && allFilled) {
      const expected = solveValue(eq, unknown, env)
      if (expected === null) fb.push({ ok: true, msg: 'Answer recorded — your teacher checks the value on this one.' })
      else {
        const tol = Math.max(Math.abs(expected) * 0.02, 1e-9)
        fb.push(Math.abs(studentNum - expected) <= tol
          ? { ok: true, msg: 'That matches the math. Box it with its unit.' }
          : { ok: false, msg: 'That doesn’t match what the equation gives — recheck your arithmetic and units.' })
      }
    } else if (answer.trim()) fb.push({ ok: true, msg: 'Answer recorded.' })
    setFeedback(fb)
  }

  const handleSave = () => {
    const workStr = Object.entries(subs || {}).map(([k, v]) => `${k} = ${num(v.value)} ${v.unit}`).join('; ')
    onSave({
      given: givenString(), equationId: formulaId || undefined, solveFor: unknown || undefined,
      rearranged: eq || undefined, substitutions: subs, answer,
      equation: formula?.display, work: workStr || undefined,
    })
    setSaved(true); check()
  }

  // ---- draggable chip + fraction rendering --------------------------------
  const dragChip = (d: Drag, children: ReactNode, key: string | number) => (
    <span key={key} onPointerDown={(e) => startDrag(e, d)} title="drag across the ="
      style={{ ...dragHandleStyle, display: 'inline-flex', alignItems: 'center', padding: '2px 8px', border: '1.5px solid var(--primary)', background: 'color-mix(in oklch, var(--primary) 10%, var(--card))', color: 'var(--foreground)', borderRadius: 8, lineHeight: 1.4 }}>
      {children}
    </span>
  )
  const termInner = (t: Term) => {
    const c = coeffStr(t.coeff)
    const numEls = t.num.length ? t.num.map((x, k) => <FactorView key={k} x={x} />) : (t.den.length && !c ? <span>1</span> : null)
    if (t.den.length) return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
        <span>{c}{numEls}</span><span style={{ width: '100%', height: 2, background: 'var(--foreground)' }} />
        <span style={{ fontStyle: 'italic' }}>{t.den.map((x, k) => <FactorView key={k} x={x} />)}</span>
      </span>
    )
    return <span>{c}{numEls}</span>
  }
  const renderSide = (which: 'lhs' | 'rhs') => {
    if (!eq) return null
    const s = eq[which]
    const validTarget = drag?.type === 'move' && drag.which !== which
    return (
      <span data-drop={`side:${which}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, minHeight: 44,
          border: validTarget ? `2px dashed ${hover === `side:${which}` ? 'var(--success)' : 'color-mix(in oklch, var(--primary) 45%, var(--border))'}` : '2px dashed transparent',
          background: validTarget && hover === `side:${which}` ? 'color-mix(in oklch, var(--success) 10%, transparent)' : 'transparent' }}>
        {s.terms.length === 0 ? <span style={{ color: 'var(--muted-foreground)' }}>0</span> : s.terms.length > 1
          ? s.terms.map((t, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {(i > 0 || t.coeff < 0) && <span style={{ color: 'var(--muted-foreground)' }}>{t.coeff < 0 ? '−' : '+'}</span>}
              {dragChip({ type: 'move', which, kind: 'term', index: i, label: '' }, termInner({ ...t, coeff: Math.abs(t.coeff) }), i)}
            </span>
          ))
          : (() => {
            const t = s.terms[0]; const c = coeffStr(t.coeff)
            const nums = t.num.map((x, k) => dragChip({ type: 'move', which, kind: 'factor', pos: 'num', index: k, label: factorLabel(x) }, <FactorView x={x} />, 'n' + k))
            const dens = t.den.map((x, k) => dragChip({ type: 'move', which, kind: 'factor', pos: 'den', index: k, label: factorLabel(x) }, <FactorView x={x} />, 'd' + k))
            if (dens.length) return (
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{c && <span>{c}</span>}{nums.length ? nums : <span>1</span>}</span>
                <span style={{ width: '100%', height: 2, background: 'var(--foreground)' }} />
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{dens}</span>
              </span>
            )
            return <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{c && <span>{c}</span>}{nums}</span>
          })()}
      </span>
    )
  }

  const renderSub = () => {
    if (!sourceSide) return null
    const renderFactorSub = (x: Factor, k: number) => {
      const s = subs?.[x.base]; const cval = CONST_VALUES[x.base]
      if (s) return <span key={k} style={{ color: 'var(--foreground)' }}>{num(s.value)}{x.exp !== 1 ? <sup>{x.exp}</sup> : null}</span>
      if (cval !== undefined) return <span key={k} style={{ color: 'var(--foreground)' }}>{num(cval)}{x.exp !== 1 ? <sup>{x.exp}</sup> : null}</span>
      const isHover = hover === `slot:${x.base}` && drag?.type === 'given' && drag.chip.sym === x.base
      return <span key={k} data-drop={`slot:${x.base}`} style={{ padding: '2px 9px', border: `1.5px dashed ${isHover ? 'var(--success)' : 'var(--border)'}`, borderRadius: 7, color: 'var(--muted-foreground)', background: isHover ? 'color-mix(in oklch, var(--success) 12%, transparent)' : 'transparent' }}><FactorView x={x} /></span>
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

      {/* EQUATION */}
      <div>
        {stepHead('E', 'var(--primary)', `Equation — pick the one that fits${unknown ? ` (solve for ${unknown})` : ''}`)}
        {equationHint && <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>{equationHint}</p>}
        <div className="flex flex-wrap gap-1.5">
          {bank.map((fm) => (
            <button key={fm.id} onClick={() => pickFormula(fm.id)} title={fm.name} className="rounded-md px-2.5 py-1.5 text-sm"
              style={{ border: `1.5px solid ${formulaId === fm.id ? 'var(--primary)' : 'color-mix(in oklch, var(--primary) 30%, var(--border))'}`, background: formulaId === fm.id ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)', color: 'var(--foreground)', fontFamily: 'Georgia, serif' }}>
              {fm.display}
            </button>
          ))}
        </div>
      </div>

      {/* REARRANGE — drag terms/factors across the = */}
      {eq && unknown && (
        <div>
          {stepHead('R', 'oklch(0.58 0.10 255)', `Rearrange — get ${unknown} by itself`, 'white')}
          {isolatedOn
            ? <p className="text-xs mb-2" style={{ color: 'var(--success)' }}>✓ Solved for {unknown}. Now drag your knowns in below.</p>
            : <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Drag a term or factor onto the other side of the = — the operation flips automatically.</p>}
          <div className="rounded-xl p-4" style={{ border: '0.5px solid var(--border)', background: 'var(--card)', fontSize: 22 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {renderSide('lhs')}<span style={{ color: 'var(--muted-foreground)' }}>=</span>{renderSide('rhs')}
            </span>
          </div>
          {!isolatedOn && <button onClick={resetEquation} className="mt-2 text-xs rounded-md border px-2.5 py-1" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Reset equation</button>}
        </div>
      )}

      {/* SUBSTITUTE — drag a known onto its variable */}
      {isolatedOn && sourceSide && (
        <div>
          {stepHead('S', 'var(--reward)', 'Substitute — drag a known onto its variable', 'var(--reward-foreground)')}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {chips.filter((c) => c.sym && c.val).map((c, i) => {
              const used = subs && subs[c.sym] !== undefined
              const usable = slots.includes(c.sym)
              return (
                <span key={i} onPointerDown={(e) => { if (usable && !used) startDrag(e, { type: 'given', chip: c, label: `${c.sym} = ${c.val} ${c.unit}` }) }}
                  title={usable ? 'drag onto its variable' : 'not used in this equation'}
                  style={{ ...(usable && !used ? dragHandleStyle : { cursor: 'default' }), display: 'inline-flex', alignItems: 'center', borderRadius: 8, padding: '6px 10px', fontSize: 14, fontFamily: 'Georgia, serif',
                    border: `0.5px solid ${used ? 'var(--border)' : usable ? 'var(--success)' : 'var(--border)'}`,
                    background: used ? 'var(--secondary)' : usable ? 'color-mix(in oklch, var(--success) 12%, var(--card))' : 'var(--card)',
                    color: usable ? 'var(--foreground)' : 'var(--muted-foreground)', opacity: used ? 0.55 : usable ? 1 : 0.5 }}>
                  {used ? '✓ ' : ''}{c.sym} = {c.val} {c.unit}
                </span>
              )
            })}
          </div>
          {convNote && <p className="text-xs mb-2 rounded-md px-3 py-2" style={{ background: 'color-mix(in oklch, var(--reward) 16%, transparent)', color: 'var(--reward-foreground)' }}><b>Converted to MCAS units:</b> {convNote}</p>}
          {constantSlots.length > 0 && <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Constant{constantSlots.length > 1 ? 's' : ''} filled for you: {constantSlots.join(', ')}.</p>}
          <div className="rounded-xl p-4" style={{ border: '0.5px solid var(--border)', background: 'var(--card)', fontSize: 22 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Symbol base={unknown} /><span style={{ color: 'var(--muted-foreground)' }}>=</span>{renderSub()}
            </span>
          </div>
        </div>
      )}

      {/* ANSWER */}
      {isolatedOn && (
        <div>
          {stepHead('A', 'var(--success)', 'Answer — compute it and box it', 'white')}
          <div className="flex items-center gap-2 flex-wrap">
            <input value={answer} onChange={(e) => { setAnswer(e.target.value); setSaved(false) }} placeholder={`your answer${unknownUnit ? ` (in ${unknownUnit})` : ''}`} className="rounded-md border px-3 py-2 text-sm" style={{ ...fieldBg, width: 220 }} />
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
          <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>These check your setup and arithmetic. Your teacher reads your work and sets your mastery score.</p>
        </div>
      )}

      {/* drag ghost — follows the pointer */}
      {drag && (
        <div style={{ position: 'fixed', left: pt.x + 10, top: pt.y + 10, pointerEvents: 'none', zIndex: 60, padding: '3px 10px', borderRadius: 8, background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 18, fontFamily: 'Georgia, serif', boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>
          {drag.type === 'given' ? drag.label : <span style={{ fontStyle: 'italic' }}>{drag.label || 'term'}</span>}
        </div>
      )}
    </div>
  )
}
