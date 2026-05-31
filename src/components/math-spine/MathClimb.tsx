'use client'

/**
 * MathClimb — the student's math-progress version of the "Your Mastery Climb"
 * chart. Each dot is a teacher rating; the line is the decaying weighted average
 * (recent work counts more, earlier still counts). Toggle by math strand.
 */
import { useState } from 'react'
import { MathCompetencyRecord, MathStrand, decayingAverage } from '@/data/curriculum-types'
import { STRAND_ORDER, STRAND_LABEL } from '@/lib/math-spine'
import { PALETTE } from './math-spine-display'

interface ClimbPoint { observedAt: string; level: number }

function ClimbChart({ points }: { points: ClimbPoint[] }) {
  const W = 720, L = 60, R = 700, T = 18, B = 210
  const sorted = [...points].sort((a, b) => a.observedAt.localeCompare(b.observedAt))
  const n = sorted.length
  if (n === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Your climb will appear here once your teacher logs your first mastery ratings.
      </p>
    )
  }
  const sx = (i: number) => (n === 1 ? (L + R) / 2 : L + (i / (n - 1)) * (R - L))
  const sy = (v: number) => B - ((v - 1) / 2) * (B - T) // level 1..3 -> bottom..top
  const line = sorted.map((_, i) => {
    const v = decayingAverage(sorted.slice(0, i + 1).map((p) => p.level)) ?? sorted[i].level
    return { x: sx(i), y: sy(v) }
  })
  const linePts = line.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return (
    <svg viewBox={`0 0 ${W} 240`} role="img" aria-label="Math mastery over time" style={{ width: '100%', height: 'auto' }}>
      <rect x={L} y={15} width={R - L} height={70} style={{ fill: 'var(--success)', opacity: 0.1 }} />
      <rect x={L} y={85} width={R - L} height={70} style={{ fill: 'var(--reward)', opacity: 0.12 }} />
      <rect x={L} y={155} width={R - L} height={70} style={{ fill: 'var(--destructive)', opacity: 0.09 }} />
      <text x={8} y={54} style={{ fill: 'var(--success)', fontWeight: 700 }} fontSize="11">Got it</text>
      <text x={8} y={124} style={{ fill: 'var(--muted-foreground)' }} fontSize="11">Almost</text>
      <text x={8} y={194} style={{ fill: 'var(--muted-foreground)' }} fontSize="11">Not yet</text>
      {n > 1 && <polyline points={linePts} fill="none" style={{ stroke: 'var(--primary)' }} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
      {sorted.map((p, i) => (
        <circle key={i} cx={sx(i)} cy={sy(p.level)} r={6} style={{ fill: 'var(--reward)' }}>
          <title>{`${fmt(p.observedAt)} — level ${p.level}`}</title>
        </circle>
      ))}
      <text x={sx(0)} y={236} textAnchor="middle" style={{ fill: 'var(--muted-foreground)' }} fontSize="10">{fmt(sorted[0].observedAt)}</text>
      {n > 1 && <text x={sx(n - 1)} y={236} textAnchor="middle" style={{ fill: 'var(--foreground)', fontWeight: 700 }} fontSize="10">{fmt(sorted[n - 1].observedAt)}</text>}
    </svg>
  )
}

interface ClimbCompetency { id: string; strand: MathStrand }

export default function MathClimb({ competencies, records }: { competencies: ClimbCompetency[]; records: MathCompetencyRecord[] }) {
  const strands = STRAND_ORDER.filter((s) => competencies.some((c) => c.strand === s))
  const idsFor = (s: MathStrand) => new Set(competencies.filter((c) => c.strand === s).map((c) => c.id))
  const strandHasRecords = (s: MathStrand) => {
    const ids = idsFor(s)
    return records.some((r) => ids.has(r.competencyId))
  }
  const [sel, setSel] = useState<MathStrand>(() => strands.find(strandHasRecords) ?? strands[0])

  const ids = idsFor(sel)
  const points: ClimbPoint[] = records
    .filter((r) => ids.has(r.competencyId))
    .map((r) => ({ observedAt: r.observedAt, level: r.level }))

  return (
    <div>
      <div className="flex items-center gap-2 mt-6 mb-2">
        <span aria-hidden style={{ width: 16, height: 3, borderRadius: 2, background: PALETTE.lavender }} />
        <span className="text-xs font-bold uppercase" style={{ color: 'var(--foreground)', letterSpacing: '0.12em' }}>Your math climb</span>
      </div>
      <div className="rounded-lg border bg-card p-4" style={{ borderColor: PALETTE.hairline }}>
        <p className="text-sm mb-3" style={{ color: PALETTE.indigoMuted }}>
          Each dot is a rating from your teacher. The line is your weighted mastery — recent work counts more, but earlier work still counts.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {strands.map((s) => {
            const active = s === sel
            return (
              <button
                key={s}
                onClick={() => setSel(s)}
                className="rounded-full px-3 py-1 text-sm font-medium border"
                style={{
                  borderColor: active ? PALETTE.lavender : PALETTE.hairline,
                  background: active ? PALETTE.lavender : 'var(--card)',
                  color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
                }}
              >
                {STRAND_LABEL[s]}
              </button>
            )
          })}
        </div>
        <ClimbChart points={points} />
      </div>
    </div>
  )
}
