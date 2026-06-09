"use client"

import { InlineMath } from '@/components/MathMarkdown'
import {
  PHYSICS_FORMULAS,
  FORMULA_CATEGORIES,
  PHYSICS_VARIABLES,
  PHYSICS_UNITS,
  PHYSICS_CONSTANTS,
  PHYSICS_IDENTITIES,
} from '@/data/physics-reference'

// Student-facing reference sheet — the on-screen twin of the MCAS Introductory
// Physics Reference Sheet students get on the exam. Everything here is rendered
// from the single source of truth in src/data/physics-reference.ts, so it can
// never drift from the symbols/units/formulas used in the GEWA blocks.

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>{children}</h2>
  )
}

// Render a variable symbol with a proper subscript (e.g. 'v_i' -> v with sub i),
// keeping unicode like Δ / λ / Ω as-is. Plain text, no KaTeX needed.
function Sym({ symbol }: { symbol: string }) {
  const [head, sub] = symbol.split('_')
  return (
    <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
      {head}{sub ? <sub style={{ fontStyle: 'normal' }}>{sub}</sub> : null}
    </span>
  )
}

export default function ReferenceSheetPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          Massachusetts Comprehensive Assessment System
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Introductory Physics Reference Sheet
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          The same formulas, variables, and constants you may use on the exam — and the exact notation we use throughout these lessons.
        </p>
      </div>

      {/* FORMULAS — grouped by category, typeset */}
      <section className="mb-8">
        <SectionHeading>Formulas</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          {FORMULA_CATEGORIES.map((cat) => (
            <div key={cat} className="rounded-2xl p-4" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>{cat}</div>
              <ul className="space-y-3">
                {PHYSICS_FORMULAS.filter((f) => f.category === cat).map((f) => (
                  <li key={f.id} className="flex items-baseline justify-between gap-3">
                    <span style={{ fontSize: 18, color: 'var(--foreground)' }}><InlineMath math={f.latex} /></span>
                    <span className="text-xs text-right shrink-0" style={{ color: 'var(--muted-foreground)' }}>{f.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* VARIABLES */}
      <section className="mb-8">
        <SectionHeading>Variables</SectionHeading>
        <div className="rounded-2xl p-4" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {PHYSICS_VARIABLES.map((v) => (
              <div key={v.symbol} className="flex items-baseline gap-2 text-sm">
                <dt className="font-semibold shrink-0" style={{ minWidth: 42, color: 'var(--foreground)' }}>
                  <Sym symbol={v.symbol} />
                </dt>
                <dd style={{ color: 'var(--muted-foreground)' }}>
                  {v.name}
                  {v.unit ? <span style={{ color: 'var(--foreground)' }}> · {v.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* UNIT SYMBOLS + CONSTANTS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="mb-2">
          <SectionHeading>Unit Symbols</SectionHeading>
          <div className="rounded-2xl p-4" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
              {PHYSICS_UNITS.map((u) => (
                <li key={u.symbol} style={{ color: 'var(--muted-foreground)' }}>
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{u.symbol}</span> — {u.name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-2">
          <SectionHeading>Definitions &amp; Constants</SectionHeading>
          <div className="rounded-2xl p-4 space-y-3" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
            {PHYSICS_CONSTANTS.map((c) => (
              <div key={c.symbol} className="text-sm">
                <span style={{ fontSize: 16, color: 'var(--foreground)' }}><InlineMath math={c.latex} /></span>
                <span style={{ color: 'var(--muted-foreground)' }}> — {c.name}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1" style={{ borderTop: '0.5px solid var(--border)' }}>
              {PHYSICS_IDENTITIES.map((id) => (
                <span key={id.display} style={{ fontSize: 15, color: 'var(--foreground)' }}><InlineMath math={id.latex} /></span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
