// ---------------------------------------------------------------------------
// Shared canvas drawing language for SimLab engines.
//
// Every sim engine owns its own canvas, but they should LOOK like one product:
// the same lavender-tinted field, the same grid, the same vector/arrow style,
// the same readable label chips, and depth from flat layered shapes (a soft
// ground-shadow ellipse) rather than blur/gradients — which render
// inconsistently across DPRs and feel heavy.
//
// Engines call these helpers in render(); a change here restyles every sim.
// All helpers draw in CSS-pixel space (the SimLab shell pre-applies the DPR
// transform), so pass the dims() width/height, not canvas.width.
// ---------------------------------------------------------------------------

/** Unified palette. Semantic physics roles map to the app's brand accents. */
export const PAL = {
  // surfaces
  bg: '#F6F4FF', // lavender-tinted field (the canvas backdrop)
  surface: '#FFFFFF', // cards / graph panels
  surfaceMute: '#EFEBFB',
  // structure
  grid: '#E7E2FB',
  gridStrong: '#D6CEF2',
  axis: '#B4A9DE',
  // text
  ink: '#26215C', // primary label
  mute: '#6F6A86', // secondary label
  onAccent: '#FFFFFF',
  // semantic accents (consistent meaning across every sim)
  primary: '#7F77DD', // lavender — position / object A / neutral highlight
  velocity: '#1D9E75', // green — velocity / motion / "distance"
  force: '#D85A30', // coral — force / object B / danger
  accent: '#E0A93C', // gold — events, intersections, rewards, "answer"
  cool: '#3FA59B', // teal — current / secondary vector
  ground: 'rgba(38,33,92,0.12)', // soft shadow ink
} as const

export type RGB = string

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Fill the whole field with the standard backdrop. */
export function clearField(ctx: CanvasRenderingContext2D, w: number, h: number, bg: RGB = PAL.bg) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
}

/** A rounded surface panel (graph backers, readout strips on-canvas). */
export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12, fill: RGB = PAL.surface) {
  roundRectPath(ctx, x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
}

/** A light, even grid. `step` is in px. Optional bounds default to the field. */
export function grid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  step = 32,
  opts: { x0?: number; y0?: number; x1?: number; y1?: number; color?: RGB; originX?: number; originY?: number } = {},
) {
  const { x0 = 0, y0 = 0, x1 = w, y1 = h, color = PAL.grid, originX, originY } = opts
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  const ox = originX ?? x0
  const oy = originY ?? y0
  ctx.beginPath()
  for (let gx = ox; gx <= x1; gx += step) { ctx.moveTo(gx, y0); ctx.lineTo(gx, y1) }
  for (let gx = ox - step; gx >= x0; gx -= step) { ctx.moveTo(gx, y0); ctx.lineTo(gx, y1) }
  for (let gy = oy; gy <= y1; gy += step) { ctx.moveTo(x0, gy); ctx.lineTo(x1, gy) }
  for (let gy = oy - step; gy >= y0; gy -= step) { ctx.moveTo(x0, gy); ctx.lineTo(x1, gy) }
  ctx.stroke()
}

/** L-shaped axes (left + bottom) for a graph region. */
export function axes(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: RGB = PAL.axis) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x0, y1)
  ctx.lineTo(x1, y1)
  ctx.stroke()
}

/** A soft contact shadow under an object — flat ellipse, no blur. Gives depth. */
export function groundShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry = rx * 0.32, fill: RGB = PAL.ground) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
}

interface ArrowOpts { color?: RGB; width?: number; head?: number; dash?: number[] }

/** A crisp vector arrow from (x0,y0) to (x1,y1) with a filled head. */
export function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, opts: ArrowOpts = {}) {
  const { color = PAL.ink, width = 2.5, head = 10, dash } = opts
  const a = Math.atan2(y1 - y0, x1 - x0)
  const len = Math.hypot(x1 - x0, y1 - y0)
  if (len < 0.5) return
  // shaft stops short of the tip so the head sits cleanly
  const sx = x1 - Math.cos(a) * head * 0.9
  const sy = y1 - Math.sin(a) * head * 0.9
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  if (dash) ctx.setLineDash(dash)
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(sx, sy)
  ctx.stroke()
  if (dash) ctx.setLineDash([])
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - head * Math.cos(a - Math.PI / 6), y1 - head * Math.sin(a - Math.PI / 6))
  ctx.lineTo(x1 - head * Math.cos(a + Math.PI / 6), y1 - head * Math.sin(a + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

interface LabelOpts {
  color?: RGB
  size?: number
  weight?: '' | 'bold'
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
}

/** A plain text label using the shared type ramp. */
export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: LabelOpts = {}) {
  const { color = PAL.ink, size = 12, weight = '', align = 'left', baseline = 'alphabetic' } = opts
  ctx.fillStyle = color
  ctx.font = `${weight ? 'bold ' : ''}${size}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(text, x, y)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

/** A pill behind text so a value stays legible over any scene. Returns width. */
export function chip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { bg?: RGB; color?: RGB; size?: number; align?: CanvasTextAlign } = {},
): number {
  const { bg = PAL.surface, color = PAL.ink, size = 11, align = 'center' } = opts
  ctx.font = `bold ${size}px ui-sans-serif, system-ui, sans-serif`
  const tw = ctx.measureText(text).width
  const padX = 6
  const w = tw + padX * 2
  const h = size + 8
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  roundRectPath(ctx, left, y - h / 2, w, h, h / 2)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, left + w / 2, y + 0.5)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  return w
}
