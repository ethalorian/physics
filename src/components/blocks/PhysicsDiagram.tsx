"use client"

import type { DiagramForce, DiagramVector, DiagramKind, CircuitComponent, EnergyChainLink } from '@/data/content-blocks'

// ---------------------------------------------------------------------------
// PhysicsDiagram — code-drawn SVG physics figures (no image files). On-brand
// (lavender / sage / gold), crisp at any size, grayscale-safe for print.
// Kinds:
//   free_body          — box + labeled force arrows
//   vectors            — arrows from an origin with an optional resultant
//   motion_map         — strobe row of dots whose spacing shows speeding up
//   circuit            — rectangular series loop with battery/switch/motor/etc.
//   energy_chain       — left-to-right labeled energy stages with arrows
//   friction_asymmetry — top-down car with unequal wheel-friction arrows + veer
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

// --- Circuit (kind === 'circuit') -----------------------------------------
// A rectangular series loop. Components placed by edge (top/right/bottom/left).
// Drawn as outlined symbols with labels; current-direction arrows hint the loop.
function CircuitGlyph({ kind: ck, x, y }: { kind: CircuitComponent['kind']; x: number; y: number }) {
  const stroke = INK, sw = 2
  if (ck === 'battery') {
    // long-short plates
    return (
      <g>
        <line x1={x - 12} y1={y - 14} x2={x - 12} y2={y + 14} stroke={stroke} strokeWidth={sw + 1} />
        <line x1={x - 4} y1={y - 8} x2={x - 4} y2={y + 8} stroke={stroke} strokeWidth={sw + 1} />
        <line x1={x + 4} y1={y - 14} x2={x + 4} y2={y + 14} stroke={stroke} strokeWidth={sw + 1} />
        <line x1={x + 12} y1={y - 8} x2={x + 12} y2={y + 8} stroke={stroke} strokeWidth={sw + 1} />
      </g>
    )
  }
  if (ck === 'switch') {
    return (
      <g>
        <circle cx={x - 12} cy={y} r={3.5} fill="var(--card)" stroke={stroke} strokeWidth={sw} />
        <circle cx={x + 12} cy={y} r={3.5} fill="var(--card)" stroke={stroke} strokeWidth={sw} />
        <line x1={x - 9} y1={y} x2={x + 10} y2={y - 12} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </g>
    )
  }
  if (ck === 'motor') {
    return (
      <g>
        <circle cx={x} cy={y} r={14} fill="color-mix(in oklch, var(--primary) 14%, var(--card))" stroke="var(--primary)" strokeWidth={sw} />
        <text x={x} y={y + 4} fill="var(--primary)" fontSize={13} fontWeight={700} textAnchor="middle">M</text>
      </g>
    )
  }
  if (ck === 'bulb') {
    return (
      <g>
        <circle cx={x} cy={y} r={12} fill="color-mix(in oklch, var(--reward) 18%, var(--card))" stroke="var(--reward)" strokeWidth={sw} />
        <line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} stroke="var(--reward)" strokeWidth={sw} />
        <line x1={x - 7} y1={y + 7} x2={x + 7} y2={y - 7} stroke="var(--reward)" strokeWidth={sw} />
      </g>
    )
  }
  // resistor — zigzag
  const z = [-18, -12, -6, 0, 6, 12, 18].map((dx, i) => [x + dx, y + (i % 2 === 0 ? -7 : 7)] as [number, number])
  return <polyline points={z.map(([px, py]) => `${px},${py}`).join(' ')} fill="none" stroke={stroke} strokeWidth={sw + 0.5} />
}

function Circuit({ components }: { components: CircuitComponent[] }) {
  // loop coords
  const x1 = 60, y1 = 60, x2 = 340, y2 = 220
  // for each side, evenly distribute components and place a glyph + label
  const bySide: Record<CircuitComponent['side'], CircuitComponent[]> = { top: [], right: [], bottom: [], left: [] }
  components.forEach((c) => bySide[c.side].push(c))
  const positions: { x: number; y: number; c: CircuitComponent }[] = []
  const ph = (xs: number, xe: number, y: number, list: CircuitComponent[]) =>
    list.forEach((c, i) => { const t = (i + 1) / (list.length + 1); positions.push({ x: xs + t * (xe - xs), y, c }) })
  const pv = (ys: number, ye: number, x: number, list: CircuitComponent[]) =>
    list.forEach((c, i) => { const t = (i + 1) / (list.length + 1); positions.push({ x, y: ys + t * (ye - ys), c }) })
  ph(x1, x2, y1, bySide.top); pv(y1, y2, x2, bySide.right); ph(x1, x2, y2, bySide.bottom); pv(y1, y2, x1, bySide.left)
  return (
    <>
      {/* the loop */}
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke={INK} strokeWidth={2.5} />
      {/* current direction hints — small arrowheads, clockwise */}
      <Arrow x0={x1 + 100} y0={y1} x1={x1 + 110} y1={y1} color={MUTE} width={1.5} />
      <Arrow x0={x2} y0={y1 + 70} x1={x2} y1={y1 + 80} color={MUTE} width={1.5} />
      <Arrow x0={x2 - 100} y0={y2} x1={x2 - 110} y1={y2} color={MUTE} width={1.5} />
      <Arrow x0={x1} y0={y2 - 70} x1={x1} y1={y2 - 80} color={MUTE} width={1.5} />
      {/* component glyphs */}
      {positions.map(({ x, y, c }, i) => (
        <g key={i}>
          {/* erase the wire under the glyph for cleanness */}
          <rect x={x - 22} y={y - 18} width={44} height={36} fill="var(--card)" />
          <CircuitGlyph kind={c.kind} x={x} y={y} />
          {c.label && (
            <text x={x} y={c.side === 'top' ? y - 26 : c.side === 'bottom' ? y + 32 : y + 30}
              fill={INK} fontSize={11.5} fontWeight={600} textAnchor="middle">{c.label}</text>
          )}
        </g>
      ))}
    </>
  )
}

// --- Energy chain (kind === 'energy_chain') -------------------------------
// Left-to-right labeled boxes joined by arrows.
function EnergyChain({ links }: { links: EnergyChainLink[] }) {
  if (links.length === 0) return null
  const x0 = 30, y = 120, total = 340
  const gap = 18
  const boxW = Math.max(54, (total - gap * (links.length - 1)) / links.length)
  const boxH = 84
  return (
    <>
      {links.map((l, i) => {
        const x = x0 + i * (boxW + gap)
        const fill = l.color ?? PALETTE[i % PALETTE.length]
        return (
          <g key={i}>
            <rect x={x} y={y - boxH / 2} width={boxW} height={boxH} rx={10}
              fill={`color-mix(in oklch, ${fill} 14%, var(--card))`} stroke={fill} strokeWidth={2} />
            <text x={x + boxW / 2} y={y - 4} fill={INK} fontSize={12} fontWeight={700} textAnchor="middle">{l.label}</text>
            {l.sublabel && (
              <text x={x + boxW / 2} y={y + 14} fill={MUTE} fontSize={10.5} textAnchor="middle">{l.sublabel}</text>
            )}
            {i < links.length - 1 && (
              <Arrow x0={x + boxW + 2} y0={y} x1={x + boxW + gap - 2} y1={y} color={INK} width={2} />
            )}
          </g>
        )
      })}
    </>
  )
}

// --- Friction asymmetry (kind === 'friction_asymmetry') -------------------
// Top-down car silhouette with two backward-pointing friction arrows of
// unequal length at left and right wheel pairs, plus a curved torque hint.
function FrictionAsymmetry({ leftMag = 1, rightMag = 1, veerDir = 'right' }: { leftMag?: number; rightMag?: number; veerDir?: 'left' | 'right' }) {
  const cx = 200, cy = 125
  // car body (top-down silhouette)
  const bw = 86, bh = 150
  const maxMag = Math.max(1, Math.abs(leftMag), Math.abs(rightMag))
  const maxLen = 55
  const lLen = 24 + (Math.abs(leftMag) / maxMag) * maxLen
  const rLen = 24 + (Math.abs(rightMag) / maxMag) * maxLen
  const lx = cx - bw / 2 - 2, rx = cx + bw / 2 + 2
  const aStart = cy + bh / 2 - 20
  return (
    <>
      {/* car body (rounded rect, nose at top) */}
      <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={14}
        fill="color-mix(in oklch, var(--primary) 10%, var(--card))" stroke="var(--primary)" strokeWidth={2} />
      {/* nose hint */}
      <polygon points={`${cx - 12},${cy - bh / 2 + 4} ${cx + 12},${cy - bh / 2 + 4} ${cx},${cy - bh / 2 - 8}`}
        fill="var(--primary)" opacity={0.6} />
      {/* wheels */}
      <rect x={lx - 10} y={cy - bh / 2 + 12} width={10} height={24} rx={3} fill={INK} />
      <rect x={lx - 10} y={cy + bh / 2 - 36} width={10} height={24} rx={3} fill={INK} />
      <rect x={rx} y={cy - bh / 2 + 12} width={10} height={24} rx={3} fill={INK} />
      <rect x={rx} y={cy + bh / 2 - 36} width={10} height={24} rx={3} fill={INK} />
      {/* friction arrows — backward (downward) from each rear wheel; labels placed BESIDE the arrow to avoid vertical overflow */}
      <Arrow x0={lx - 5} y0={aStart} x1={lx - 5} y1={aStart + lLen} color="oklch(0.62 0.16 25)" width={3} />
      <text x={lx - 22} y={aStart + lLen / 2 + 4} fill="oklch(0.62 0.16 25)" fontSize={11.5} fontWeight={700} textAnchor="middle">f_L</text>
      <Arrow x0={rx + 5} y0={aStart} x1={rx + 5} y1={aStart + rLen} color="oklch(0.62 0.16 25)" width={3} />
      <text x={rx + 22} y={aStart + rLen / 2 + 4} fill="oklch(0.62 0.16 25)" fontSize={11.5} fontWeight={700} textAnchor="middle">f_R</text>
      {/* curved arrow hinting torque about vertical axis */}
      <g>
        <path d={veerDir === 'right'
          ? `M ${cx - 22} ${cy} A 22 22 0 0 1 ${cx + 22} ${cy}`
          : `M ${cx + 22} ${cy} A 22 22 0 0 0 ${cx - 22} ${cy}`}
          fill="none" stroke="var(--reward)" strokeWidth={2.5} strokeDasharray="5 4" />
        <text x={cx} y={cy + 4} fill="var(--reward)" fontSize={11} fontWeight={700} textAnchor="middle">τ</text>
      </g>
    </>
  )
}

export default function PhysicsDiagram({
  kind, title, caption, forces, vectors, showResultant, dots, components, links, leftMag, rightMag, veerDir,
}: {
  kind: DiagramKind
  title?: string
  caption?: string
  forces?: DiagramForce[]
  vectors?: DiagramVector[]
  showResultant?: boolean
  dots?: number[]
  components?: CircuitComponent[]
  links?: EnergyChainLink[]
  leftMag?: number
  rightMag?: number
  veerDir?: 'left' | 'right'
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
          {kind === 'circuit' && <Circuit components={components ?? []} />}
          {kind === 'energy_chain' && <EnergyChain links={links ?? []} />}
          {kind === 'friction_asymmetry' && <FrictionAsymmetry leftMag={leftMag} rightMag={rightMag} veerDir={veerDir} />}
        </svg>
      </div>
      {caption && <figcaption style={{ fontSize: 12.5, color: MUTE, marginTop: 6 }}>{caption}</figcaption>}
    </figure>
  )
}
