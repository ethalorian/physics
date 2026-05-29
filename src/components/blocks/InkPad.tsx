"use client"

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import type { Stroke } from './DoodleCanvas'
import { Pen, Eraser, Undo2, Redo2, Trash2 } from 'lucide-react'

// A lightweight, controlled drawing pad (handwrite math / show work). Unlike
// DoodleCanvas it has no internal "save" button — it reports strokes via
// onChange so a parent (e.g. the GEWA block) can fold them into its own save.
// Coordinate space is 640×360 to match the teacher review renderer's viewBox.

const W = 640
const H = 360
const ERASE_R = 14
const DEFAULT_PALETTE = ['#2D2A4A', '#C0584A', '#3A6FA5', '#7FA68B']
const WIDTHS: { label: string; value: number }[] = [
  { label: 'S', value: 2.5 }, { label: 'M', value: 4.5 }, { label: 'L', value: 7 },
]

export default function InkPad({
  value = [], onChange, palette,
}: {
  value?: Stroke[]
  onChange: (strokes: Stroke[]) => void
  palette?: string[]
}) {
  const colors = palette && palette.length ? palette : DEFAULT_PALETTE
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>(value.map((s) => ({ color: s.color, width: s.width, points: s.points.slice() })))
  const redoRef = useRef<Stroke[]>([])
  const drawingRef = useRef(false)
  const [color, setColor] = useState(colors[0])
  const [width, setWidth] = useState(WIDTHS[1].value)
  const [eraser, setEraser] = useState(false)
  const [, force] = useState(0)

  const redraw = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    for (const s of strokesRef.current) {
      if (s.points.length < 1) continue
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.width ?? 3
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      if (s.points.length === 1) ctx.lineTo(s.points[0].x + 0.1, s.points[0].y + 0.1)
      else for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y)
      ctx.stroke()
    }
  }

  useEffect(() => { redraw() }, [])

  const toPoint = (e: RPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }
  const emit = () => onChange(strokesRef.current.map((s) => ({ color: s.color, width: s.width, points: s.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })) })))

  const eraseAt = (p: { x: number; y: number }) => {
    const before = strokesRef.current.length
    strokesRef.current = strokesRef.current.filter((s) => !s.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) <= ERASE_R))
    if (strokesRef.current.length !== before) { redoRef.current = []; redraw(); emit(); force((n) => n + 1) }
  }

  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true
    const p = toPoint(e)
    if (eraser) { eraseAt(p); return }
    redoRef.current = []
    strokesRef.current.push({ color, width, points: [p] })
  }
  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const p = toPoint(e)
    if (eraser) { eraseAt(p); return }
    const cur = strokesRef.current[strokesRef.current.length - 1]
    cur.points.push(p)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && cur.points.length >= 2) {
      ctx.strokeStyle = cur.color; ctx.lineWidth = cur.width ?? 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cur.points[cur.points.length - 2].x, cur.points[cur.points.length - 2].y)
      ctx.lineTo(cur.points[cur.points.length - 1].x, cur.points[cur.points.length - 1].y)
      ctx.stroke()
    }
  }
  const onUp = () => { if (drawingRef.current) { drawingRef.current = false; emit(); force((n) => n + 1) } }
  const undo = () => { const s = strokesRef.current.pop(); if (s) { redoRef.current.push(s); redraw(); emit(); force((n) => n + 1) } }
  const redo = () => { const s = redoRef.current.pop(); if (s) { strokesRef.current.push(s); redraw(); emit(); force((n) => n + 1) } }
  const clearAll = () => { strokesRef.current = []; redoRef.current = []; redraw(); emit(); force((n) => n + 1) }

  const toolBtn = (active: boolean) => ({
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    background: active ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)',
    color: active ? 'var(--primary)' : 'var(--muted-foreground)',
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button key={c} onClick={() => { setColor(c); setEraser(false) }} aria-label={`pen color ${c}`} className="rounded-full"
              style={{ width: 20, height: 20, background: c, border: !eraser && color === c ? '3px solid var(--foreground)' : '1px solid var(--border)' }} />
          ))}
        </div>
        <span className="w-px h-5" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-1">
          {WIDTHS.map((wd) => (
            <button key={wd.label} onClick={() => { setWidth(wd.value); setEraser(false) }} aria-label={`pen ${wd.label}`}
              className="text-xs font-semibold rounded-md border w-7 h-7 grid place-items-center" style={toolBtn(!eraser && width === wd.value)}>{wd.label}</button>
          ))}
        </div>
        <span className="w-px h-5" style={{ background: 'var(--border)' }} />
        <button onClick={() => setEraser(false)} aria-label="pen" className="rounded-md border w-7 h-7 grid place-items-center" style={toolBtn(!eraser)}><Pen size={14} /></button>
        <button onClick={() => setEraser(true)} aria-label="eraser" className="rounded-md border w-7 h-7 grid place-items-center" style={toolBtn(eraser)}><Eraser size={14} /></button>
        <span className="ml-auto flex gap-1.5">
          <button onClick={undo} disabled={strokesRef.current.length === 0} aria-label="undo" className="rounded-md border w-7 h-7 grid place-items-center disabled:opacity-40" style={toolBtn(false)}><Undo2 size={14} /></button>
          <button onClick={redo} disabled={redoRef.current.length === 0} aria-label="redo" className="rounded-md border w-7 h-7 grid place-items-center disabled:opacity-40" style={toolBtn(false)}><Redo2 size={14} /></button>
          <button onClick={clearAll} aria-label="clear" className="rounded-md border w-7 h-7 grid place-items-center" style={toolBtn(false)}><Trash2 size={14} /></button>
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
        style={{ width: '100%', height: 'auto', touchAction: 'none', border: '1px solid var(--primary)', borderRadius: 8, background: '#fff', cursor: eraser ? 'cell' : 'crosshair' }}
      />
    </div>
  )
}
