"use client"

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import type { Stroke } from './DoodleCanvas'

// A lightweight, controlled drawing pad (handwrite math / show work). Unlike
// DoodleCanvas it has no internal "save" button — it reports strokes via
// onChange so a parent (e.g. the GEWA block) can fold them into its own save.
// Coordinate space is 640×360 to match the teacher review renderer's viewBox.

const W = 640
const H = 360
const DEFAULT_PALETTE = ['#2D2A4A', '#C0584A', '#3A6FA5', '#7FA68B']

export default function InkPad({
  value = [], onChange, palette,
}: {
  value?: Stroke[]
  onChange: (strokes: Stroke[]) => void
  palette?: string[]
}) {
  const colors = palette && palette.length ? palette : DEFAULT_PALETTE
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>(value.map((s) => ({ color: s.color, points: s.points.slice() })))
  const drawingRef = useRef(false)
  const [color, setColor] = useState(colors[0])

  const redraw = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)
    ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    for (const s of strokesRef.current) {
      if (s.points.length < 2) continue
      ctx.strokeStyle = s.color
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y)
      ctx.stroke()
    }
  }

  // initial paint only (controlled by the parent's saved value at mount)
  useEffect(() => { redraw() }, [])

  const toPoint = (e: RPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }
  const emit = () => onChange(strokesRef.current.map((s) => ({ color: s.color, points: s.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })) })))

  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true
    strokesRef.current.push({ color, points: [toPoint(e)] })
  }
  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const cur = strokesRef.current[strokesRef.current.length - 1]
    cur.points.push(toPoint(e))
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && cur.points.length >= 2) {
      ctx.strokeStyle = cur.color; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cur.points[cur.points.length - 2].x, cur.points[cur.points.length - 2].y)
      ctx.lineTo(cur.points[cur.points.length - 1].x, cur.points[cur.points.length - 1].y)
      ctx.stroke()
    }
  }
  const onUp = () => { if (drawingRef.current) { drawingRef.current = false; emit() } }
  const undo = () => { strokesRef.current.pop(); redraw(); emit() }
  const clear = () => { strokesRef.current = []; redraw(); emit() }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Pen:</span>
        {colors.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={`pen ${c}`} className="rounded-full"
            style={{ width: 20, height: 20, background: c, border: color === c ? '3px solid var(--foreground)' : '1px solid var(--border)' }} />
        ))}
        <span className="ml-auto flex gap-2">
          <button onClick={undo} className="text-xs rounded-md border px-2.5 py-1" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}>Undo</button>
          <button onClick={clear} className="text-xs rounded-md border px-2.5 py-1" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}>Clear</button>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{ width: '100%', height: 'auto', touchAction: 'none', border: '1px solid var(--primary)', borderRadius: 8, background: '#fff', cursor: 'crosshair' }}
      />
    </div>
  )
}
