"use client"

import type { DiagramForce, DiagramVector, DiagramKind } from '@/data/content-blocks'

// ---------------------------------------------------------------------------
// PhysicsDiagram — code-drawn SVG physics figures (no image files). On-brand
// (lavender / sage / gold), crisp at any size, grayscale-safe for print.
// Three kinds: free-body (box + labeled force arrows), vectors (arrows from an
// origin with an optional resultant), motion map (a strobe row of dots whose
// spacing shows speeding up / slowing down).
// ---------------------------------------------------------------------------

const PALETTE = ['var(--primary)', 'var(--success)', 'oklch(0.62 0.16 25)', 'oklch(0.58 0.10 255)', 'var(--reward)']
const INK = 'var(--foreground)'
const MUTE = 'var(--muted-foreground)'
const HAIR = 'var(--border)'

const dirToAngle = (d: DiagramForce['dir']): number =>
  typeof d === 'number' ? d
    : d === 'up' ? 90 : d === 'down' ? -90 : d === 'left' ? 180 : 0 // 'right'

function Arrow({ x0, y0, x1, y1, color, width = 3 }: { x0: number; y0: number; x1: number; y1: number; color: string; width?: number }) {
  const a = Math.atan2(y1 - y0, x1 - x0)
  const h = 9 + width
  const p1x = x1 - h * Math.cos(a - Math.PI / 6), p1y = y1 - h * Math.sin(a - Math.PI / 6)
  const p2x = x1 - h * Math.cos(a + Math.PI / 6), p2y = y1 - h * Math.sin(a + Math.PI / 6)
  return (
    <g>
      <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x1},${y1} ${p1x},${p1y} ${p2x},${p2y}`} fill={color} />
    </g>
  )
}

function FreeBody({ forces }: { forces: DiagramForce[] }) {
  const cx = 200, cy = 140, box = 46
  const maxMag = Math.max(1, ...forces.map((f) => Math.abs(f.mag)))
  const maxLen = 88
  return (
    <>
      {/* object */}
      <rect x={cx - box / 2} y={cy - box / 2} width={box} height={box} rx={8}
        fill="color-mix(in oklch, var(--primary) 14%, var(--card))" stroke="var(--primary)" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={3} fill={INK} />
      {forces.map((f, i) => {
        const ang = (dirToAngle(f.dir) * Math.PI) / 180
        const len = 20 + (Math.abs(f.mag) / maxMag) * maxLen
        const x1 = cx + len * Math.cos(ang), y1 = cy - len * Math.sin(ang) // SVG y is down
        const color = f.color ?? PALETTE[i % PALETTE.length]
        const lx = cx + (len + 16) * Math.cos(ang), ly = cy - (len + 16) * Math.sin(ang)
        return (
          <g key={i}>
            <Arrow x0={cx} y0={cy} x1={x1} y1={y1} color={color} />
            <text x={lx} y={ly} fill={color} fontSize={13} fontWeight={600} textAnchor="middle" dominantBaseline="middle">{f.label}</text>
          </g>
        )
      })}
    </>
  )
}

function Vectors({ vectors, showResultant }: { vectors: DiagramVector[]; showResultant?: boolean }) {
  const cx = 200, cy = 150
  const maxMag = Math.max(1, ...vectors.map((v) => Math.abs(v.mag)))
  const scale = 110 / maxMag
  let rx = 0, ry = 0
  return (
    <>
      {/* light axes */}
      <line x1={40} y1={cy} x2={360} y2={cy} stroke={HAIR} strokeWidth={1} />
      <line x1={cx} y1={20} x2={cx} y2={280} stroke={HAIR} strokeWidth={1} />
      {vectors.map((v, i) => {
        const ang = (v.angle * Math.PI) / 180
        const dx = v.mag * scale * Math.cos(ang), dy = v.mag * scale * Math.sin(ang)
        rx += dx; ry += dy
        const x1 = cx + dx, y1 = cy - dy
        const color = v.color ?? PALETTE[i % PALETTE.length]
        return (
          <g key={i}>
            <Arrow x0={cx} y0={cy} x1={x1} y1={y1} color={color} />
            <text x={cx + dx + 12 * Math.cos(ang)} y={cy - dy - 12 * Math.sin(ang)} fill={color} fontSize={13} fontWeight={600} textAnchor="middle" dominantBaseline="middle">{v.label}</text>
          </g>
        )
      })}
      {showResultant && vectors.length > 1 && (
        <g>
          <line x1={cx} y1={cy} x2={cx + rx} y2={cy - ry} stroke="var(--reward)" strokeWidth={3} strokeDasharray="6 5" strokeLinecap="round" />
          <Arrow x0={cx + rx * 0.86} y0={cy - ry * 0.86} x1={cx + rx} y1={cy - ry} color="var(--reward)" />
          <text x={cx + rx + 14} y={cy - ry} fill="var(--reward)" fontSize={12} fontWeight={700} textAnchor="middle" dominantBaseline="middle">R</text>
        </g>
      )}
    </>
  )
}

function MotionMap({ dots }: { dots: number[] }) {
  const cy = 150, x0 = 40
  const gaps = dots.length ? dots : [1, 1, 1, 1]
  const total = gaps.reduce((s, g) => s + g, 0)
  const usable = 320
  const unit = usable / total
  const xs: number[] = [x0]
  gaps.forEach((g) => xs.push(xs[xs.length - 1] + g * unit))
  return (
    <>
      <line x1={x0} y1={cy} x2={x0 + usable} y2={cy} stroke={HAIR} strokeWidth={1} />
      {xs.slice(0, -1).map((x, i) => (
        <Arrow key={`a${i}`} x0={x} y0={cy} x1={xs[i + 1] - 6} y1={cy} color="oklch(0.58 0.10 255)" width={2} />
      ))}
      {xs.map((x, i) => (
        <circle key={`d${i}`} cx={x} cy={cy} r={6} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
      ))}
      <text x={x0} y={cy + 28} fill={MUTE} fontSize={11} textAnchor="start">wider gaps = faster</text>
    </>
  )
}

export default function PhysicsDiagram({
  kind, title, caption, forces, vectors, showResultant, dots,
}: {
  kind: DiagramKind
  title?: string
  caption?: string
  forces?: DiagramForce[]
  vectors?: DiagramVector[]
  showResultant?: boolean
  dots?: number[]
}) {
  return (
    <figure style={{ margin: 0 }}>
      {title && <figcaption style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 6 }}>{title}</figcaption>}
      <div style={{ borderRadius: 12, border: `0.5px solid ${HAIR}`, background: 'var(--card)', padding: 6 }}>
        <svg viewBox="0 0 400 280" style={{ width: '100%', height: 'auto' }} role="img"
          aria-label={title || `${kind.replace('_', ' ')} diagram`}>
          {kind === 'free_body' && <FreeBody forces={forces ?? []} />}
          {kind === 'vectors' && <Vectors vectors={vectors ?? []} showResultant={showResultant} />}
          {kind === 'motion_map' && <MotionMap dots={dots ?? []} />}
        </svg>
      </div>
      {caption && <figcaption style={{ fontSize: 12.5, color: MUTE, marginTop: 6 }}>{caption}</figcaption>}
    </figure>
  )
}
