"use client"

import { useState, type DragEvent as RDragEvent } from 'react'
import { InlineMath } from '@/components/MathMarkdown'

// An equation/algebra sandbox for the Work step. Students build "math logic lines"
// by typing or tapping variable/operator tokens; each line is TYPESET with KaTeX
// (graceful fallback to raw text) and, when a line is purely numeric, the
// arithmetic is evaluated like a calculator. It never solves the symbolic algebra
// or judges correctness — that's the student's work and the teacher's rating.

export interface SandboxValue { lines: string[]; answerIndex?: number }
interface Variable { symbol: string; value?: string; unit?: string }

interface EquationSandboxProps {
  prompt?: string
  variables?: Variable[]
  /** Optional full equation offered as a one-tap token (e.g. the chosen GEWA equation). */
  equationToken?: string
  value?: SandboxValue
  /** Continuous reporting (controlled / embedded use, e.g. inside GEWA). */
  onChange?: (v: SandboxValue) => void
  /** Standalone save (block use). Shows a Save button + helper note. */
  onSave?: (v: SandboxValue) => void
  embedded?: boolean
}

const OPS = ['=', '+', '−', '×', '÷', '(', ')', '^', '√']
const SUB_U = '₀₁₂₃₄₅₆₇₈₉'
const SUP_U = '⁰¹²³⁴⁵⁶⁷⁸⁹'

const identLatex = (t: string) => t.replace(new RegExp(`[${SUB_U}]+`, 'g'), (m) => '_{' + m.split('').map((c) => String(SUB_U.indexOf(c))).join('') + '}')

// Forgiving fallback for partial / unparseable lines (e.g. while still typing).
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
  const expr = (): string => {
    let l = term(); skip()
    while (str[i] === '+' || str[i] === '-') { const op = str[i++]; const r = term(); l = `${l} ${op} ${r}`; skip() }
    return l
  }
  const term = (): string => {
    let l = factor(); skip()
    while (str[i] === '*' || str[i] === '/') { const op = str[i++]; const r = factor(); l = op === '*' ? `${l} \\cdot ${r}` : `\\frac{${l}}{${r}}`; skip() }
    return l
  }
  const factor = (): string => {
    let b = base(); skip()
    if (str[i] === '^') { i++; const e = factor(); b = `${b}^{${e}}` }
    return b
  }
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

// Convert a student's raw line into LaTeX for KaTeX. Pretty (\frac bars) when the
// line parses; gracefully falls back to a simple transform while it's incomplete.
export function toLatex(raw: string): string {
  if (!raw.trim()) return ''
  return raw.split('=').map((side) => {
    try { return sideToLatex(side) } catch { return simpleLatex(side) }
  }).join(' = ')
}

function evaluate(raw: string): number | null {
  const expr = (raw.includes('=') ? raw.split('=').pop()! : raw)
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').trim()
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

// Recognized base units (kinematics/forces + common). Compound units like m/s or
// m/s² are split on / · * and each base checked.
const BASE_UNITS = new Set(['m', 'km', 'cm', 'mm', 'nm', 's', 'ms', 'min', 'h', 'hr', 'kg', 'g', 'mg', 'n', 'j', 'kj', 'w', 'kw', 'pa', 'kpa', 'atm', 'v', 'a', 'c', 'k', 'hz', 'khz', 'rad', 'deg', 'mol', 'l', 'ml'])
function isKnownUnit(u: string): boolean {
  const cleaned = u.replace(/[()]/g, '').trim()
  if (!cleaned) return false
  const parts = cleaned.split(/[\s/·*]+/).filter(Boolean)
  return parts.every((p) => BASE_UNITS.has(p.replace(/[²³⁴]/g, '').replace(/\^\d+/g, '').toLowerCase()))
}
// MECHANICAL only: confirms the final answer has a number + a recognized unit.
// Never judges whether the value is correct — the teacher rates that.
function answerUnitNudge(line: string): { ok: boolean; msg: string } {
  const rhs = (line.includes('=') ? line.split('=').pop()! : line).trim()
  const m = rhs.match(/(-?\d*\.?\d+)\s*([^\d=]*)$/)
  if (!m || !m[1]) return { ok: false, msg: 'Your final answer needs a number.' }
  const unit = (m[2] || '').trim()
  if (!unit) return { ok: false, msg: 'Add a unit to your answer (like m/s).' }
  return isKnownUnit(unit)
    ? { ok: true, msg: `Answer has a number and a recognized unit: ${unit}.` }
    : { ok: false, msg: `Double-check your unit — “${unit}” isn’t one I recognize.` }
}

export default function EquationSandbox({ prompt, variables, equationToken, value, onChange, onSave, embedded }: EquationSandboxProps) {
  const [lines, setLines] = useState<string[]>(value?.lines?.length ? value.lines : [''])
  const [answerIdx, setAnswerIdx] = useState<number | null>(value?.answerIndex ?? null)
  const [focus, setFocus] = useState(0)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  // Build the saved value: drop empty lines and remap the answer index onto the
  // filtered array so "which line is the answer" survives the cleanup.
  const payload = (nextLines: string[], nextAnswer: number | null): SandboxValue => {
    const kept = nextLines.map((l, idx) => ({ l, idx })).filter((x) => x.l.trim())
    const ai = nextAnswer != null ? kept.findIndex((x) => x.idx === nextAnswer) : -1
    return { lines: kept.map((x) => x.l), answerIndex: ai >= 0 ? ai : undefined }
  }
  const commit = (next: string[], nextAnswer: number | null = answerIdx) => {
    setLines(next); setAnswerIdx(nextAnswer); setSaved(false); onChange?.(payload(next, nextAnswer))
  }
  const editLine = (i: number, text: string) => commit(lines.map((l, j) => (j === i ? text : l)))
  const insertAt = (i: number, token: string) => commit(lines.map((l, j) => (j === i ? `${l}${l && !l.endsWith(' ') ? ' ' : ''}${token} ` : l)))
  const insert = (token: string) => insertAt(focus, token)
  const dragToken = (e: RDragEvent, token: string) => e.dataTransfer.setData('text/plain', token)
  const addLine = () => { commit([...lines, '']); setFocus(lines.length) }
  const removeLine = (i: number) => {
    if (lines.length <= 1) return
    const na = answerIdx === i ? null : answerIdx != null && answerIdx > i ? answerIdx - 1 : answerIdx
    commit(lines.filter((_, j) => j !== i), na)
  }
  const markAnswer = (i: number) => commit(lines, answerIdx === i ? null : i)
  const save = () => { onSave?.(payload(lines, answerIdx)); setSaved(true) }

  const opChip = (label: string, token: string) => (
    <button key={label} onClick={() => insert(token)} draggable onDragStart={(e) => dragToken(e, token)} className="rounded-lg text-sm font-semibold transition-transform active:scale-95"
      style={{ minWidth: 38, padding: '7px 0', border: '0.5px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'Georgia, serif', cursor: 'grab' }}>
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-3">
      {prompt && <p className="text-sm" style={{ color: 'var(--foreground)' }}>{prompt}</p>}

      {/* palette */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid color-mix(in oklch, var(--primary) 28%, var(--border))' }}>
        <div className="px-3 py-1.5 text-xs font-semibold" style={{ background: 'color-mix(in oklch, var(--primary) 14%, var(--card))', color: 'color-mix(in oklch, var(--primary) 60%, var(--foreground))' }}>
          Build your math — tap to drop a token, or just type
        </div>
        <div className="p-3 space-y-2.5" style={{ background: 'var(--card)' }}>
          {variables && variables.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {variables.map((v, i) => (
                <span key={i} className="inline-flex items-center rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--primary)' }}>
                  <button onClick={() => insert(v.symbol)} draggable onDragStart={(e) => dragToken(e, v.symbol)} className="px-2.5 py-1.5 text-sm font-bold transition-transform active:scale-95" style={{ background: 'color-mix(in oklch, var(--primary) 14%, var(--card))', color: 'var(--foreground)', fontFamily: 'Georgia, serif', cursor: 'grab' }}>{v.symbol}</button>
                  {v.value && <button onClick={() => insert(v.value!)} draggable onDragStart={(e) => dragToken(e, v.value!)} className="px-2 py-1.5 text-xs transition-transform active:scale-95" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', borderLeft: '0.5px solid var(--primary)', cursor: 'grab' }}>{v.value}{v.unit ? ` ${v.unit}` : ''}</button>}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {OPS.map((op) => opChip(op, op === '√' ? 'sqrt(' : op))}
          </div>
          {equationToken && (
            <button onClick={() => insert(equationToken)} draggable onDragStart={(e) => dragToken(e, equationToken)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-transform active:scale-95"
              style={{ background: 'color-mix(in oklch, var(--reward) 18%, var(--card))', color: 'var(--reward-foreground)', border: '0.5px solid color-mix(in oklch, var(--reward) 45%, var(--border))', cursor: 'grab' }}>
              Drop your equation: <span style={{ fontFamily: 'Georgia, serif' }}>{equationToken}</span>
            </button>
          )}
        </div>
      </div>

      {/* logic lines */}
      <div className="flex flex-col gap-2">
        {lines.map((line, i) => {
          const result = evaluate(line)
          const isAns = answerIdx === i
          const bColor = dragOver === i ? 'var(--primary)' : isAns ? 'var(--reward)' : focus === i ? 'var(--primary)' : 'var(--border)'
          const bg = dragOver === i ? 'color-mix(in oklch, var(--primary) 8%, var(--card))' : isAns ? 'color-mix(in oklch, var(--reward) 8%, var(--card))' : 'var(--card)'
          return (
            <div key={i}
              onDragOver={(e) => { e.preventDefault(); setDragOver(i) }}
              onDragLeave={() => setDragOver((d) => (d === i ? null : d))}
              onDrop={(e) => { e.preventDefault(); const t = e.dataTransfer.getData('text/plain'); if (t) { setFocus(i); insertAt(i, t) } setDragOver(null) }}
              className="rounded-2xl p-2.5 transition-colors"
              style={{ border: `${dragOver === i ? '2px' : isAns ? '1.5px' : '0.5px'} solid ${bColor}`, background: bg }}>
              <div className="flex items-center gap-2">
                <span className="grid place-items-center rounded-full text-xs font-bold shrink-0" style={{ width: 22, height: 22, background: 'color-mix(in oklch, var(--primary) 14%, var(--card))', color: 'var(--primary)' }}>{i + 1}</span>
                <input value={line} onFocus={() => setFocus(i)} onChange={(e) => editLine(i, e.target.value)} placeholder="Type, tap, or drag tokens in…  e.g.  v = d / t"
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-sm" style={{ border: '0.5px solid var(--border)', background: 'color-mix(in oklch, var(--secondary) 30%, var(--card))', color: 'var(--foreground)', fontFamily: 'ui-monospace, monospace' }} />
                {line.trim() && (
                  <button onClick={() => markAnswer(i)} title="Mark as your final answer" className="text-xs rounded-md px-2 py-1 font-semibold shrink-0"
                    style={{ border: '0.5px solid', borderColor: isAns ? 'var(--reward)' : 'var(--border)', background: isAns ? 'color-mix(in oklch, var(--reward) 18%, var(--card))' : 'var(--card)', color: isAns ? 'var(--reward-foreground)' : 'var(--muted-foreground)' }}>
                    {isAns ? '★ Answer' : 'Answer'}
                  </button>
                )}
                {lines.length > 1 && <button onClick={() => removeLine(i)} className="text-lg leading-none px-1 shrink-0" style={{ color: 'var(--muted-foreground)' }} aria-label="remove line">×</button>}
              </div>
              {line.trim() && (
                <div className="flex items-center gap-2.5 mt-2 pl-8 flex-wrap" style={{ minHeight: 26 }}>
                  <span style={{ fontSize: 18 }}><InlineMath math={isAns ? `\\boxed{${toLatex(line)}}` : toLatex(line)} /></span>
                  {result !== null && (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: 'color-mix(in oklch, var(--success) 18%, transparent)', color: 'var(--success)' }}>= {round(result)}</span>
                  )}
                </div>
              )}
              {isAns && line.trim() && (() => {
                const u = answerUnitNudge(line)
                return (
                  <div className="mt-1.5 pl-8">
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                      style={{ background: u.ok ? 'color-mix(in oklch, var(--success) 14%, transparent)' : 'color-mix(in oklch, var(--reward) 18%, transparent)', color: u.ok ? 'var(--success)' : 'var(--reward-foreground)' }}>
                      {u.ok ? '✓' : '⚠'} {u.msg}
                    </span>
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={addLine} className="rounded-lg px-3 py-2 text-xs font-semibold transition-transform active:scale-95" style={{ border: '0.5px dashed color-mix(in oklch, var(--primary) 50%, var(--border))', color: 'var(--primary)' }}>+ Add a line</button>
        {!embedded && onSave && <button onClick={save} className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Save work</button>}
        {saved && <span className="text-xs" style={{ color: 'var(--success)' }}>Saved ✓</span>}
      </div>
      {!embedded && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          The sandbox typesets your math and checks the arithmetic on number-only lines. It won&apos;t solve the algebra — that&apos;s your work, and your teacher rates it.
        </p>
      )}
    </div>
  )
}
