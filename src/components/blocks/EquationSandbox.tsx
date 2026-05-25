"use client"

import { useState, type DragEvent as RDragEvent, type KeyboardEvent as RKeyboardEvent, type FocusEvent as RFocusEvent } from 'react'
import { InlineMath } from '@/components/MathMarkdown'

// A fluid math scratch surface for the Work step. Students write their solution
// one step per line; the line they're editing is plain text, and every other
// line renders as TYPESET math right where they wrote it — so it reads like a
// continuous worked solution on paper, not a stack of form fields. Numeric lines
// quietly show their arithmetic result. The last line is treated as the answer.
// It never solves the algebra or judges the value — the teacher rates that.

export interface SandboxValue { lines: string[]; answerIndex?: number }
interface Variable { symbol: string; value?: string; unit?: string }

interface EquationSandboxProps {
  prompt?: string
  variables?: Variable[]
  equationToken?: string
  value?: SandboxValue
  onChange?: (v: SandboxValue) => void
  onSave?: (v: SandboxValue) => void
  embedded?: boolean
}

const SUB_U = '₀₁₂₃₄₅₆₇₈₉'
const SUP_U = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const identLatex = (t: string) => t.replace(new RegExp(`[${SUB_U}]+`, 'g'), (m) => '_{' + m.split('').map((c) => String(SUB_U.indexOf(c))).join('') + '}')

function simpleLatex(s: string): string {
  let x = s
  x = x.replace(new RegExp(`[${SUB_U}]+`, 'g'), (m) => '_{' + m.split('').map((c) => String(SUB_U.indexOf(c))).join('') + '}')
  x = x.replace(new RegExp(`[${SUP_U}]+`, 'g'), (m) => '^{' + m.split('').map((c) => String(SUP_U.indexOf(c))).join('') + '}')
  x = x.replace(/sqrt\(([^)]*)\)/g, '\\sqrt{$1}').replace(/√\s*\(([^)]*)\)/g, '\\sqrt{$1}').replace(/\^\(([^)]+)\)/g, '^{$1}')
  return x.replace(/×/g, ' \\times ').replace(/÷/g, ' \\div ').replace(/−/g, '-').replace(/\*/g, ' \\cdot ').replace(/\//g, ' \\div ').trim()
}

// Parse one side of an '=' into LaTeX, rendering division as a real \frac bar.
function sideToLatex(side: string): string {
  const str = side.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/·/g, '*').trim()
  if (!str) return ''
  let i = 0
  const skip = () => { while (str[i] === ' ') i++ }
  const expr = (): string => { let l = term(); skip(); while (str[i] === '+' || str[i] === '-') { const op = str[i++]; const r = term(); l = `${l} ${op} ${r}`; skip() } return l }
  const term = (): string => { let l = factor(); skip(); while (str[i] === '*' || str[i] === '/') { const op = str[i++]; const r = factor(); l = op === '*' ? `${l} \\cdot ${r}` : `\\frac{${l}}{${r}}`; skip() } return l }
  const factor = (): string => { let b = base(); skip(); if (str[i] === '^') { i++; const e = factor(); b = `${b}^{${e}}` } return b }
  const base = (): string => {
    skip()
    if (str[i] === '-') { i++; return `-${base()}` }
    if (str[i] === '+') { i++; return base() }
    if (str[i] === '(') { i++; const e = expr(); skip(); if (str[i] === ')') i++; return `\\left(${e}\\right)` }
    if (str.slice(i, i + 5) === 'sqrt(') { i += 5; const e = expr(); skip(); if (str[i] === ')') i++; return `\\sqrt{${e}}` }
    if (str[i] === '√') { i++; skip(); if (str[i] === '(') { i++; const e = expr(); skip(); if (str[i] === ')') i++; return `\\sqrt{${e}}` } return `\\sqrt{${base()}}` }
    const num = str.slice(i).match(/^\d*\.?\d+/)
    if (num) { i += num[0].length; return num[0] }
    const id = str.slice(i).match(/^[A-Za-zΑ-Ωα-ωΔπθ]+[₀-₉]*\d*/u)
    if (id) { i += id[0].length; return identLatex(id[0]) }
    throw new Error('parse')
  }
  const out = expr(); skip()
  if (i < str.length) throw new Error('trailing')
  return out
}

export function toLatex(raw: string): string {
  if (!raw.trim()) return ''
  return raw.split('=').map((side) => { try { return sideToLatex(side) } catch { return simpleLatex(side) } }).join(' = ')
}

function evaluate(raw: string): number | null {
  const expr = (raw.includes('=') ? raw.split('=').pop()! : raw).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').trim()
  if (!expr || /[a-zA-Zπ√]/.test(expr)) return null
  let i = 0
  const peek = () => expr[i]
  const skip = () => { while (expr[i] === ' ') i++ }
  function parseExpr(): number { let v = parseTerm(); skip(); while (peek() === '+' || peek() === '-') { const op = expr[i++]; const r = parseTerm(); v = op === '+' ? v + r : v - r; skip() } return v }
  function parseTerm(): number { let v = parseFactor(); skip(); while (peek() === '*' || peek() === '/') { const op = expr[i++]; const r = parseFactor(); v = op === '*' ? v * r : v / r; skip() } return v }
  function parseFactor(): number { let v = parsePrimary(); skip(); while (peek() === '^') { i++; const r = parseFactor(); v = Math.pow(v, r) } return v }
  function parsePrimary(): number {
    skip()
    if (peek() === '+') { i++; return parsePrimary() }
    if (peek() === '-') { i++; return -parsePrimary() }
    if (peek() === '(') { i++; const v = parseExpr(); skip(); if (peek() === ')') i++; return v }
    const m = expr.slice(i).match(/^\d*\.?\d+/)
    if (!m) throw new Error('parse')
    i += m[0].length
    return parseFloat(m[0])
  }
  try { const v = parseExpr(); skip(); if (i < expr.length) return null; return Number.isFinite(v) ? v : null } catch { return null }
}

const round = (n: number) => (Number.isInteger(n) ? n.toLocaleString() : parseFloat(n.toFixed(4)).toLocaleString(undefined, { maximumFractionDigits: 4 }))

// Recognized units (kinematics/forces + common); compounds split on / · *.
const BASE_UNITS = new Set(['m', 'km', 'cm', 'mm', 'nm', 's', 'ms', 'min', 'h', 'hr', 'kg', 'g', 'mg', 'n', 'j', 'kj', 'w', 'kw', 'pa', 'kpa', 'atm', 'v', 'a', 'c', 'k', 'hz', 'khz', 'rad', 'deg', 'mol', 'l', 'ml'])
const isKnownUnit = (u: string) => {
  const cleaned = u.replace(/[()]/g, '').trim()
  return cleaned.length > 0 && cleaned.split(/[\s/·*]+/).filter(Boolean).every((p) => BASE_UNITS.has(p.replace(/[²³⁴]/g, '').replace(/\^\d+/g, '').toLowerCase()))
}
// True when a line ends in a number but no recognized unit — used only for a
// gentle reminder on the final answer (never blocks, never judges the value).
const lacksUnit = (line: string) => {
  const rhs = (line.includes('=') ? line.split('=').pop()! : line).trim()
  const m = rhs.match(/(-?\d*\.?\d+)\s*([^\d=]*)$/)
  if (!m || !m[1]) return false
  const unit = (m[2] || '').trim()
  return !unit || !isKnownUnit(unit)
}

export default function EquationSandbox({ prompt, variables, equationToken, value, onChange, onSave, embedded }: EquationSandboxProps) {
  const [lines, setLines] = useState<string[]>(value?.lines?.length ? value.lines : [''])
  const [focus, setFocus] = useState(0)
  const [saved, setSaved] = useState(false)

  // The final non-empty line is the student's answer (natural — your last step).
  const payload = (next: string[]): SandboxValue => {
    const kept = next.filter((l) => l.trim())
    return { lines: kept, answerIndex: kept.length ? kept.length - 1 : undefined }
  }
  const commit = (next: string[]) => { setLines(next); setSaved(false); onChange?.(payload(next)) }
  const editLine = (i: number, text: string) => commit(lines.map((l, j) => (j === i ? text : l)))
  const insertAt = (i: number, token: string) => commit(lines.map((l, j) => (j === i ? `${l}${l && !l.endsWith(' ') ? ' ' : ''}${token} ` : l)))
  const insert = (token: string) => { const t = focus >= 0 ? focus : lines.length - 1; setFocus(t); insertAt(t, token) }
  const dragToken = (e: RDragEvent, token: string) => e.dataTransfer.setData('text/plain', token)
  const save = () => { onSave?.(payload(lines)); setSaved(true) }

  const onKey = (e: RKeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = [...lines.slice(0, i + 1), '', ...lines.slice(i + 1)]
      commit(next); setFocus(i + 1)
    } else if (e.key === 'Backspace' && lines[i] === '' && lines.length > 1) {
      e.preventDefault()
      commit(lines.filter((_, j) => j !== i)); setFocus(Math.max(0, i - 1))
    }
  }
  const collapseOnBlur = (e: RFocusEvent) => {
    const root = e.currentTarget.closest('[data-sandbox]')
    setTimeout(() => { if (root && !root.contains(document.activeElement)) setFocus(-1) }, 0)
  }

  const lastNonEmpty = [...lines].reverse().find((l) => l.trim()) || ''
  const showUnitHint = /\d/.test(lastNonEmpty) && lacksUnit(lastNonEmpty)

  return (
    <div className="flex flex-col gap-2" data-sandbox>
      {prompt && <p className="text-sm" style={{ color: 'var(--foreground)' }}>{prompt}</p>}

      {/* how to use it */}
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Write your solution one step per line — press <b style={{ color: 'var(--foreground)' }}>Enter</b> for a new line, and tap a finished line to edit it. End with your answer <b style={{ color: 'var(--foreground)' }}>and its unit</b> (like 10 m/s). Number-only lines show their result automatically.
      </p>

      {/* slim insert strip — tap or drag a known value/variable in */}
      {((variables && variables.length > 0) || equationToken) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Insert:</span>
          {variables?.map((v, i) => (
            <button key={i} onClick={() => insert(v.value || v.symbol)} draggable onDragStart={(e) => dragToken(e, v.value || v.symbol)}
              className="rounded-md px-2 py-1 text-xs font-semibold" style={{ border: '0.5px solid color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'color-mix(in oklch, var(--primary) 8%, var(--card))', color: 'var(--foreground)', cursor: 'grab', fontFamily: 'Georgia, serif' }}>
              {v.symbol}{v.value ? ` = ${v.value}${v.unit ? ` ${v.unit}` : ''}` : ''}
            </button>
          ))}
          {equationToken && (
            <button onClick={() => insert(equationToken)} draggable onDragStart={(e) => dragToken(e, equationToken)}
              className="rounded-md px-2 py-1 text-xs font-semibold" style={{ border: '0.5px solid color-mix(in oklch, var(--reward) 45%, var(--border))', background: 'color-mix(in oklch, var(--reward) 14%, var(--card))', color: 'var(--reward-foreground)', cursor: 'grab', fontFamily: 'Georgia, serif' }}>
              {equationToken}
            </button>
          )}
        </div>
      )}

      {/* the paper — one fluid surface */}
      <div className="rounded-2xl px-3 py-2" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
        {lines.map((line, i) => {
          const focused = focus === i
          const result = evaluate(line)
          return (
            <div key={i}
              onClick={() => setFocus(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const t = e.dataTransfer.getData('text/plain'); if (t) { setFocus(i); insertAt(i, t) } }}
              className="flex items-center gap-3 py-1.5"
              style={{ borderBottom: i < lines.length - 1 ? '0.5px solid color-mix(in oklch, var(--border) 60%, transparent)' : 'none', cursor: 'text', minHeight: 34 }}>
              {focused ? (
                <input autoFocus value={line} onChange={(e) => editLine(i, e.target.value)} onKeyDown={(e) => onKey(e, i)} onBlur={collapseOnBlur}
                  placeholder="write a step…  v = d / t"
                  className="flex-1 bg-transparent outline-none text-base" style={{ color: 'var(--foreground)', fontFamily: 'ui-monospace, monospace' }} />
              ) : (
                <div className="flex-1" style={{ fontSize: 18 }}>
                  {line.trim() ? <InlineMath math={toLatex(line)} /> : <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>tap to write a step…</span>}
                </div>
              )}
              {result !== null && <span className="text-sm shrink-0" style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>= {round(result)}</span>}
            </div>
          )
        })}
      </div>

      {showUnitHint && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Don&apos;t forget the unit on your answer (like m/s).</p>
      )}

      {!embedded && onSave && (
        <div className="flex items-center gap-2">
          <button onClick={save} className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Save work</button>
          {saved && <span className="text-xs" style={{ color: 'var(--success)' }}>Saved ✓</span>}
        </div>
      )}
    </div>
  )
}
