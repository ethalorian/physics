"use client"

import { useRef } from 'react'
import { InlineMath } from '@/components/MathMarkdown'
import { toLatex } from './EquationSandbox'

// A focused equation editor: type math in a friendly syntax (^, /, sqrt(), unicode
// sub/superscripts) and see it TYPESET live below as you type. A palette inserts
// structures and symbols at the cursor, and optional presets fill the field in one
// tap. Outputs the raw string; render anywhere with toLatex() + KaTeX.
//
//   v = d / t        →   v = d⁄t   (real fraction bar)
//   ½at^2            →   ½at²
//   sqrt(2as)        →   √(2as)

interface PaletteBtn {
  /** What shows on the button (already math-ish). */
  label: string
  /** Text inserted at the caret. */
  ins: string
  /** Caret offset within `ins` after insertion (defaults to end). */
  caret?: number
  title?: string
}

const STRUCTURES: PaletteBtn[] = [
  { label: 'a⁄b', ins: '()/()', caret: 1, title: 'Fraction' },
  { label: 'xⁿ', ins: '^()', caret: 2, title: 'Exponent' },
  { label: 'x²', ins: '²', title: 'Squared' },
  { label: '√', ins: 'sqrt()', caret: 5, title: 'Square root' },
  { label: '( )', ins: '()', caret: 1, title: 'Parentheses' },
  { label: 'x₀', ins: '₀', title: 'Subscript 0' },
]
const SYMBOLS: PaletteBtn[] = [
  { label: '×', ins: '×' }, { label: '÷', ins: '÷' }, { label: '·', ins: '·' },
  { label: '±', ins: '±' }, { label: '=', ins: ' = ' }, { label: '≈', ins: '≈' },
  { label: '≤', ins: '≤' }, { label: '≥', ins: '≥' }, { label: '≠', ins: '≠' },
  { label: 'Δ', ins: 'Δ' }, { label: 'π', ins: 'π' }, { label: 'θ', ins: 'θ' },
  { label: 'ω', ins: 'ω' }, { label: 'λ', ins: 'λ' }, { label: 'μ', ins: 'μ' },
  { label: 'ρ', ins: 'ρ' }, { label: '°', ins: '°' },
]

export default function EquationField({
  value, onChange, placeholder = 'type an equation,  e.g.  v = d / t', presets,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  presets?: string[]
}) {
  const ref = useRef<HTMLInputElement>(null)

  const insert = (b: PaletteBtn) => {
    const el = ref.current
    const s = el?.selectionStart ?? value.length
    const e = el?.selectionEnd ?? value.length
    const next = value.slice(0, s) + b.ins + value.slice(e)
    onChange(next)
    const pos = s + (b.caret ?? b.ins.length)
    requestAnimationFrame(() => { if (el) { el.focus(); el.setSelectionRange(pos, pos) } })
  }

  const latex = toLatex(value)

  const palBtn: React.CSSProperties = {
    minWidth: 30, height: 30, padding: '0 6px', borderRadius: 8,
    border: '0.5px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)',
    fontFamily: 'Georgia, serif', fontSize: 15, cursor: 'pointer',
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="rounded-lg border px-3 py-2 text-base outline-none"
        style={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)', fontFamily: 'ui-monospace, monospace' }}
      />

      {/* palette */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1">
          {STRUCTURES.map((b) => (
            <button key={b.label} type="button" title={b.title} aria-label={b.title} onClick={() => insert(b)} style={palBtn}>{b.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {SYMBOLS.map((b) => (
            <button key={b.label} type="button" title={b.label} aria-label={`insert ${b.label}`} onClick={() => insert(b)} style={{ ...palBtn, minWidth: 28, fontSize: 14 }}>{b.label}</button>
          ))}
        </div>
      </div>

      {/* live typeset preview */}
      <div className="rounded-lg px-3 py-2 min-h-[44px] flex items-center" style={{ border: '0.5px solid var(--border)', background: 'color-mix(in oklch, var(--primary) 5%, var(--card))' }}>
        {value.trim()
          ? <span style={{ fontSize: 20, color: 'var(--foreground)' }}><InlineMath math={latex} /></span>
          : <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>your equation appears here, typeset</span>}
      </div>

      {/* quick-fill presets (the equation bank) */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Common equations:</span>
          {presets.map((p) => (
            <button key={p} type="button" onClick={() => { onChange(p); requestAnimationFrame(() => ref.current?.focus()) }}
              className="rounded-md px-2 py-1 text-xs"
              style={{ border: '0.5px solid color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'color-mix(in oklch, var(--primary) 8%, var(--card))', color: 'var(--foreground)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
