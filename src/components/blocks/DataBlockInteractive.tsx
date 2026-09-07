"use client"

import { useId, useState } from 'react'
import { useDraft } from './useDraft'
import { numericCell, axisRange, formatTick } from './data-plot'

export interface DataValue {
  rows?: string[][]
  pattern?: string
  interpret?: string
}

interface DataBlockProps {
  columns: string[]
  rows: number
  minRows?: number
  plot?: boolean
  xCol?: number
  yCol?: number
  patternPrompt?: string
  value?: DataValue
  onSave: (v: DataValue) => void | Promise<boolean>
  /** as-you-type draft (autosave; never evidence) */
  onDraft?: (v: DataValue) => void | Promise<boolean>
}

const PATTERNS = ['Straight line (linear)', 'Curved', 'Flat (no change)']

function blankGrid(cols: number, rows: number): string[][] {
  return Array.from({ length: Math.max(rows, 1) }, () => Array.from({ length: Math.max(cols, 1) }, () => ''))
}

const fieldBg = { background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }

export default function DataBlockInteractive({ columns, rows, minRows = 1, plot, xCol, yCol, patternPrompt, value, onSave, onDraft }: DataBlockProps) {
  const clipId = useId()
  const cols = columns && columns.length > 0 ? columns : ['x', 'y']
  const xi = xCol ?? 0
  const yi = yCol ?? 1
  const showPlot = (plot ?? cols.length >= 2) && cols.length >= 2

  const [grid, setGrid] = useState<string[][]>(value?.rows && value.rows.length > 0 ? value.rows : blankGrid(cols.length, rows))
  const [trend, setTrend] = useState(false)
  const [pattern, setPattern] = useState(value?.pattern ?? '')
  const [interpret, setInterpret] = useState(value?.interpret ?? '')
  const [nudges, setNudges] = useState<{ ok: boolean; msg: string }[]>([])
  const [saved, setSaved] = useState(false)
  useDraft(onDraft ?? (() => {}), { rows: grid, pattern, interpret })

  const setCell = (r: number, c: number, v: string) => {
    setGrid((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)))
    setSaved(false)
  }
  const addRow = () => { setSaved(false); setGrid((prev) => [...prev, Array.from({ length: cols.length }, () => '')]) }

  const points = (): { x: number; y: number }[] => {
    const out: { x: number; y: number }[] = []
    for (const row of grid) {
      const x = numericCell(row[xi])
      const y = numericCell(row[yi])
      if (x !== null && y !== null) out.push({ x, y })
    }
    return out
  }

  const runCheck = () => {
    const filled = grid.filter((row) => row.length >= cols.length && row.every((v) => v.trim()) && (!showPlot || [row[xi], row[yi]].every((v) => numericCell(v) !== null))).length
    const n: { ok: boolean; msg: string }[] = [
      filled >= minRows ? { ok: true, msg: `You recorded ${filled} readings.` } : { ok: false, msg: `Record at least ${minRows} complete readings${showPlot ? '; use numbers in the plotted columns' : ''}.` },
      pattern ? { ok: true, msg: `You named the pattern: ${pattern}.` } : { ok: false, msg: 'Choose what kind of relationship your data shows.' },
      interpret.trim().length > 3 ? { ok: true, msg: 'You explained what it means.' } : { ok: false, msg: 'Finish the sentence — what does this tell you?' },
    ]
    setNudges(n)
  }
  const handleSave = async () => {
    const ok = await onSave({ rows: grid, pattern, interpret })
    setSaved(ok !== false)
    runCheck()
  }

  // --- live plot geometry ---
  const pts = points()
  const L = 46, R = 410, T = 16, B = 200, Wd = 430, Hd = 232
  const xr = axisRange(pts.map((p) => p.x)), yr = axisRange(pts.map((p) => p.y))
  const sx = (x: number) => L + ((x - xr.min) / (xr.max - xr.min)) * (R - L)
  const sy = (y: number) => B - ((y - yr.min) / (yr.max - yr.min)) * (B - T)
  let trendLine: { x1: number; y1: number; x2: number; y2: number } | null = null
  if (trend && pts.length >= 2) {
    const n = pts.length
    let sT = 0, sY = 0, sTT = 0, sTY = 0
    for (const p of pts) { sT += p.x; sY += p.y; sTT += p.x * p.x; sTY += p.x * p.y }
    const denom = n * sTT - sT * sT
    if (denom !== 0) {
      const slope = (n * sTY - sT * sY) / denom
      const inter = (sY - slope * sT) / n
      trendLine = { x1: sx(xr.min), y1: sy(slope * xr.min + inter), x2: sx(xr.max), y2: sy(slope * xr.max + inter) }
    }
  }

  const badge = (l: string, color: string) => (
    <span className="grid place-items-center font-bold flex-shrink-0" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14, background: color, color: 'var(--primary-foreground)' }}>{l}</span>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* RECORD */}
      <div>
        <div className="flex items-center gap-2 mb-2">{badge('1', 'var(--primary)')}<span className="text-sm font-semibold">Record — enter what you measured</span></div>
        <div className="overflow-x-auto">
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>{cols.map((c, i) => <th key={i} className="text-xs font-bold text-left pb-2 px-1" style={{ color: 'var(--muted-foreground)' }}>{c}</th>)}<th /></tr>
            </thead>
            <tbody>
              {grid.map((row, ri) => (
                <tr key={ri}>
                  {cols.map((_, ci) => (
                    <td key={ci} className="px-1 py-0.5">
                      <input aria-label={`Reading ${ri + 1}, ${cols[ci]}`} aria-invalid={showPlot && (ci === xi || ci === yi) && Boolean(row[ci]?.trim()) && numericCell(row[ci]) === null} value={row[ci] ?? ''} onChange={(e) => setCell(ri, ci, e.target.value)} className="w-full rounded-md border px-2 py-1.5 text-sm" style={fieldBg} />
                    </td>
                  ))}
                  <td className="px-1">
                    {grid.length > 1 && <button onClick={() => { setSaved(false); setGrid((prev) => prev.filter((_, i) => i !== ri)) }} className="text-lg" style={{ color: 'var(--muted-foreground)' }} aria-label="remove row">×</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showPlot && <p className="text-xs text-muted-foreground mt-1">Enter numbers only in the plotted columns, including negative values or scientific notation. Units belong in the column headings.</p>}
        <button onClick={addRow} className="mt-2 rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--primary)', borderStyle: 'dashed' }}>+ Add a reading</button>
      </div>

      {/* GRAPH */}
      {showPlot && (
        <div>
          <div className="flex items-center gap-2 mb-2">{badge('2', 'var(--primary)')}<span className="text-sm font-semibold">Graph — watch the shape appear</span></div>
          <svg viewBox={`0 0 ${Wd} ${Hd}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label={`${cols[yi]} vs ${cols[xi]}`}>
            <line x1={L} y1={T} x2={L} y2={B} style={{ stroke: 'var(--border)' }} strokeWidth={1.5} />
            <line x1={L} y1={B} x2={R} y2={B} style={{ stroke: 'var(--border)' }} strokeWidth={1.5} />
            <text x={(L + R) / 2} y={Hd - 2} textAnchor="middle" style={{ fill: 'var(--muted-foreground)' }} fontSize="11">{cols[xi]}</text>
            <text transform={`translate(11,${(T + B) / 2}) rotate(-90)`} textAnchor="middle" style={{ fill: 'var(--muted-foreground)' }} fontSize="11">{cols[yi]}</text>
            <defs><clipPath id={clipId}><rect x={L} y={T} width={R-L} height={B-T} /></clipPath></defs>
            <line x1={sx(0)} y1={T} x2={sx(0)} y2={B} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
            <line x1={L} y1={sy(0)} x2={R} y2={sy(0)} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
            <text x={L - 6} y={B + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="10">{formatTick(yr.min)}</text>
            <text x={L} y={B + 15} textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">{formatTick(xr.min)}</text>
            <text x={L - 6} y={T + 8} textAnchor="end" style={{ fill: 'var(--muted-foreground)' }} fontSize="10">{formatTick(yr.max)}</text>
            <text x={R} y={B + 15} textAnchor="middle" style={{ fill: 'var(--muted-foreground)' }} fontSize="10">{formatTick(xr.max)}</text>
            {trendLine && <line clipPath={`url(#${clipId})`} x1={trendLine.x1} y1={trendLine.y1} x2={trendLine.x2} y2={trendLine.y2} style={{ stroke: 'var(--primary)', opacity: 0.7 }} strokeWidth={2.5} strokeDasharray="6 5" />}
            {pts.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={6} style={{ fill: 'var(--primary)' }} />)}
          </svg>
          <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer" style={{ color: 'var(--muted-foreground)' }}>
            <input type="checkbox" checked={trend} onChange={(e) => setTrend(e.target.checked)} />
            Show trend line <span style={{ opacity: 0.7 }}>(a guide — you still name the pattern)</span>
          </label>
        </div>
      )}

      {/* PATTERN + MEANING */}
      <div>
        <div className="flex items-center gap-2 mb-2">{badge('3', 'var(--success)')}<span className="text-sm font-semibold">Pattern &amp; meaning</span></div>
        <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>{patternPrompt ?? 'What kind of relationship is this — and what does it tell you?'}</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {PATTERNS.map((p) => {
            const sel = pattern === p
            return (
              <button key={p} aria-pressed={sel} onClick={() => { setPattern(sel ? '' : p); setSaved(false) }} className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: sel ? 'var(--success)' : 'var(--border)', background: sel ? 'color-mix(in oklch, var(--success) 14%, transparent)' : 'var(--card)', color: sel ? 'var(--success)' : 'var(--foreground)' }}>{p}</button>
            )
          })}
        </div>
        <textarea aria-label={patternPrompt ?? 'Interpret the measured pattern'} value={interpret} onChange={(e) => { setInterpret(e.target.value); setSaved(false) }} rows={3} placeholder="In your own words: what does this pattern tell you?" className="w-full rounded-lg border p-3 text-sm" style={fieldBg} />
      </div>

      {/* check + save */}
      <div className="flex items-center gap-2">
        <button onClick={runCheck} className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>Check my work</button>
        <button onClick={handleSave} className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Save</button>
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
            These check your setup, not whether you&apos;re &ldquo;right.&rdquo; Your teacher reads your data and reasoning and sets your mastery score.
          </p>
        </div>
      )}
    </div>
  )
}
