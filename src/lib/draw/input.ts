// Shared pointer/tool logic for stroke editors. One implementation of "what
// happens when you press, drag, and release" for every drawing tool, so each
// editor (PaintPad, DoodleCanvas, MathCanvas) only supplies a canvas,
// dimensions, a repaint() that knows its own background, and an emit().

import type { PointerEvent as RPointerEvent } from 'react'
import { type Stroke, type StrokeTool, type Point, sprayDots, isBackgroundFill } from './strokes'

export type EditorTool = StrokeTool | 'fill' | 'eraser'

export interface StrokeHandlerOpts {
  canvas: HTMLCanvasElement | null
  W: number
  H: number
  strokesRef: { current: Stroke[] }
  redoRef: { current: Stroke[] }
  drawingRef: { current: boolean }
  tool: EditorTool
  color: string
  size: number
  fillShapes: boolean
  /** Object eraser removes whole strokes near the cursor (good over a background);
   *  otherwise the eraser paints with white (good on a plain white pad). */
  objectErase?: boolean
  repaint: () => void
  emit: () => void
  bump: () => void
}

const ERASE_R = 14

export function makeStrokeHandlers(o: StrokeHandlerOpts) {
  const toPoint = (e: RPointerEvent<HTMLCanvasElement>): Point => {
    const r = (o.canvas as HTMLCanvasElement).getBoundingClientRect()
    return { x: ((e.clientX - r.left) * o.W) / r.width, y: ((e.clientY - r.top) * o.H) / r.height }
  }

  const bucketFill = () => {
    const bg: Stroke = { color: o.color, width: 0, tool: 'rect', fill: true, points: [{ x: 0, y: 0 }, { x: o.W, y: o.H }] }
    o.strokesRef.current = [bg, ...o.strokesRef.current.filter((s) => !isBackgroundFill(s, o.W))]
    o.redoRef.current = []
    o.repaint(); o.emit(); o.bump()
  }

  const eraseAt = (p: Point) => {
    const before = o.strokesRef.current.length
    o.strokesRef.current = o.strokesRef.current.filter(
      (s) => !s.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) <= ERASE_R),
    )
    if (o.strokesRef.current.length !== before) { o.redoRef.current = []; o.repaint(); o.emit(); o.bump() }
  }

  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    const p = toPoint(e)
    if (o.tool === 'fill') { bucketFill(); return }
    o.drawingRef.current = true
    o.redoRef.current = []
    if (o.tool === 'eraser') {
      if (o.objectErase) { eraseAt(p); return }
      o.strokesRef.current.push({ color: '#FFFFFF', width: o.size, tool: 'pen', points: [p] })
    } else if (o.tool === 'pen') {
      o.strokesRef.current.push({ color: o.color, width: o.size, tool: 'pen', points: [p] })
    } else if (o.tool === 'spray') {
      o.strokesRef.current.push({ color: o.color, width: o.size, tool: 'spray', points: sprayDots(p, o.size * 1.5) })
    } else {
      o.strokesRef.current.push({
        color: o.color, width: o.size, tool: o.tool,
        fill: o.tool === 'rect' || o.tool === 'ellipse' ? o.fillShapes : undefined,
        points: [p, p],
      })
    }
    o.repaint()
  }

  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!o.drawingRef.current) return
    const p = toPoint(e)
    if (o.tool === 'eraser' && o.objectErase) { eraseAt(p); return }
    const cur = o.strokesRef.current[o.strokesRef.current.length - 1]
    if (!cur) return
    const t = cur.tool ?? 'pen'
    if (t === 'pen') cur.points.push(p)
    else if (t === 'spray') cur.points.push(...sprayDots(p, (cur.width ?? 6) * 1.5))
    else cur.points = [cur.points[0], p]
    o.repaint()
  }

  const onUp = () => {
    if (o.drawingRef.current) { o.drawingRef.current = false; o.emit(); o.bump() }
  }

  return { onDown, onMove, onUp }
}
