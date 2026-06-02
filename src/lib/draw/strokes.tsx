// Shared drawing engine — the single source of truth for the stroke data model
// and how strokes are rendered to BOTH a canvas (live editors) and SVG (teacher
// replay / read-only viewers). Every drawing surface imports from here so a new
// tool is added in one place and shows up everywhere.

import React from 'react'

export type Point = { x: number; y: number }

/** Tool that produced a stroke. Absent = freehand pen (back-compat with old data). */
export type StrokeTool = 'pen' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'spray'

export interface Stroke {
  color: string
  points: Point[]
  width?: number
  /** Defaults to 'pen' when omitted. */
  tool?: StrokeTool
  /** For 'rect'/'ellipse': filled vs outline. */
  fill?: boolean
}

// --- geometry helpers -------------------------------------------------------

/** Bounding box from a stroke's first and last point (used by line/rect/ellipse). */
export function bbox(pts: Point[]) {
  const a = pts[0]
  const b = pts[pts.length - 1]
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) }
}

/** A burst of randomly-scattered dots around p, for the spray tool. */
export function sprayDots(p: Point, radius: number, n = 10): Point[] {
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * radius
    out.push({ x: p.x + Math.cos(ang) * r, y: p.y + Math.sin(ang) * r })
  }
  return out
}

/** True for a full-canvas filled rectangle (the "fill background" / bucket result). */
export function isBackgroundFill(s: Stroke, w: number): boolean {
  return s.tool === 'rect' && s.fill === true && s.points.length >= 2 &&
    Math.min(s.points[0].x, s.points[1].x) <= 0 && Math.max(s.points[0].x, s.points[1].x) >= w
}

// --- canvas rendering -------------------------------------------------------

/** Paint a single stroke onto a 2D canvas context. Handles every tool. */
export function paintStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  const pts = s.points
  if (!pts.length) return
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width ?? 4
  const tool = s.tool ?? 'pen'
  if (tool === 'pen') {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1)
    else for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()
  } else if (tool === 'line') {
    const a = pts[0]; const b = pts[pts.length - 1]
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
  } else if (tool === 'arrow') {
    const a = pts[0]; const b = pts[pts.length - 1]
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    // arrowhead at b, scaled to line width
    const ang = Math.atan2(b.y - a.y, b.x - a.x)
    const head = Math.max(10, (s.width ?? 4) * 3)
    const spread = Math.PI / 7
    ctx.beginPath()
    ctx.moveTo(b.x, b.y)
    ctx.lineTo(b.x - head * Math.cos(ang - spread), b.y - head * Math.sin(ang - spread))
    ctx.lineTo(b.x - head * Math.cos(ang + spread), b.y - head * Math.sin(ang + spread))
    ctx.closePath(); ctx.fill()
  } else if (tool === 'rect') {
    const { x, y, w, h } = bbox(pts)
    if (s.fill) ctx.fillRect(x, y, w, h); else ctx.strokeRect(x, y, w, h)
  } else if (tool === 'ellipse') {
    const { x, y, w, h } = bbox(pts)
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, Math.max(0.5, w / 2), Math.max(0.5, h / 2), 0, 0, Math.PI * 2)
    if (s.fill) ctx.fill(); else ctx.stroke()
  } else if (tool === 'spray') {
    const r = Math.max(0.8, (s.width ?? 6) / 6)
    for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill() }
  }
}

/** Paint a whole list of strokes in order. */
export function paintStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  for (const s of strokes) paintStroke(ctx, s)
}

// --- SVG rendering (read-only viewers) --------------------------------------

/** One stroke as an SVG element. Mirrors paintStroke exactly. */
export function StrokeShapeEl({ s }: { s: Stroke }) {
  const pts = s.points ?? []
  if (!pts.length) return null
  const stroke = s.color || 'var(--foreground)'
  const w = s.width ?? 3
  const tool = s.tool ?? 'pen'
  if (tool === 'line') {
    const a = pts[0]; const b = pts[pts.length - 1]
    return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={w} strokeLinecap="round" />
  }
  if (tool === 'arrow') {
    const a = pts[0]; const b = pts[pts.length - 1]
    const ang = Math.atan2(b.y - a.y, b.x - a.x)
    const head = Math.max(10, w * 3)
    const spread = Math.PI / 7
    const h1x = b.x - head * Math.cos(ang - spread), h1y = b.y - head * Math.sin(ang - spread)
    const h2x = b.x - head * Math.cos(ang + spread), h2y = b.y - head * Math.sin(ang + spread)
    return (
      <g stroke={stroke} fill={stroke}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={w} strokeLinecap="round" />
        <polygon points={`${b.x},${b.y} ${h1x},${h1y} ${h2x},${h2y}`} strokeWidth={0} />
      </g>
    )
  }
  if (tool === 'rect') {
    const { x, y, w: bw, h } = bbox(pts)
    return <rect x={x} y={y} width={bw} height={h} fill={s.fill ? stroke : 'none'} stroke={s.fill ? 'none' : stroke} strokeWidth={w} />
  }
  if (tool === 'ellipse') {
    const { x, y, w: bw, h } = bbox(pts)
    return <ellipse cx={x + bw / 2} cy={y + h / 2} rx={Math.max(0.5, bw / 2)} ry={Math.max(0.5, h / 2)} fill={s.fill ? stroke : 'none'} stroke={s.fill ? 'none' : stroke} strokeWidth={w} />
  }
  if (tool === 'spray') {
    const r = Math.max(0.8, w / 6)
    return <g fill={stroke}>{pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={r} />)}</g>
  }
  return <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
}

/** Render an array of strokes as inline SVG elements (drop into an existing <svg>). */
export function StrokeShapes({ strokes }: { strokes: Stroke[] }) {
  return <>{strokes.map((s, i) => <StrokeShapeEl key={i} s={s} />)}</>
}

/** A complete, self-contained SVG board of strokes (640×360 by default). */
export function StrokesSvg({
  strokes, width = 640, height = 360, maxWidth = 260, style, ariaLabel = 'Drawing',
}: {
  strokes: Stroke[]
  width?: number
  height?: number
  maxWidth?: number
  style?: React.CSSProperties
  ariaLabel?: string
}) {
  if (!strokes.length) {
    return <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>[empty drawing]</span>
  }
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth, height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', ...style }}
      role="img"
      aria-label={ariaLabel}
    >
      <StrokeShapes strokes={strokes} />
    </svg>
  )
}
