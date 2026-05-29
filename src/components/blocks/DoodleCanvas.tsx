"use client"

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import { Pen, Eraser, Undo2, Redo2, Trash2, Check } from 'lucide-react'

type Point = { x: number; y: number }
export interface Stroke { color: string; points: Point[]; width?: number }

export interface DoodleCanvasProps {
  instruction: string
  prompts?: string[]
  scaffoldSvg?: string
  imageUrl?: string
  palette?: string[]
  initialStrokes?: Stroke[]
  /** Draw faint graph-paper behind a blank sketch (ignored when a background is shown). */
  grid?: boolean
  /** A React background (e.g. a PhysicsDiagram) rendered BEHIND a transparent canvas,
   *  so students annotate on top of it. Takes precedence over scaffoldSvg/imageUrl. */
  backgroundNode?: ReactNode
  onSave: (strokes: Stroke[]) => void
}

const W = 640
const H = 360
const ERASE_R = 14 // object-eraser radius in canvas units
const DEFAULT_PALETTE = ['#2D2A4A', '#7FA68B', '#9B8EC4', '#C0584A', '#3A6FA5', '#C99A2E']
const WIDTHS: { label: string; value: number }[] = [
  { label: 'S', value: 2.5 }, { label: 'M', value: 4.5 }, { label: 'L', value: 7 },
]

export default function DoodleCanvas({
  instruction, prompts, scaffoldSvg, imageUrl, palette, initialStrokes = [], grid, backgroundNode, onSave,
}: DoodleCanvasProps) {
  const colors = palette && palette.length ? palette : DEFAULT_PALETTE
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>(initialStrokes.map((s) => ({ color: s.color, width: s.width, points: s.points.slice() })))
  const redoRef = useRef<Stroke[]>([])
  const drawingRef = useRef(false)
  const [color, setColor] = useState(colors[0])
  const [width, setWidth] = useState(WIDTHS[1].value)
  const [eraser, setEraser] = useState(false)
  const [saved, setSaved] = useState(false)
  const [, force] = useState(0) // re-render for undo/redo button enabled state

  const bgSrc = backgroundNode ? undefined : (scaffoldSvg ? `data:image/svg+xml;utf8,${encodeURIComponent(scaffoldSvg)}` : imageUrl)

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(123,107,203,0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let gx = 0; gx <= W; gx += 32) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H) }
    for (let gy = 0; gy <= H; gy += 32) { ctx.moveTo(0, gy); ctx.lineTo(W, gy) }
    ctx.stroke()
  }

  const drawStrokes = (ctx: CanvasRenderingContext2D) => {
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
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

  const drawAll = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    if (backgroundNode) { drawStrokes(ctx); return } // transparent over the DOM background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)
    if (bgSrc) {
      const img = new window.Image()
      img.onload = () => { ctx.drawImage(img, 0, 0, W, H); drawStrokes(ctx) }
      img.onerror = () => drawStrokes(ctx)
      img.src = bgSrc
      return
    }
    if (grid) drawGrid(ctx)
    drawStrokes(ctx)
  }

  useEffect(() => {
    drawAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgSrc, backgroundNode, grid])

  const toPoint = (e: RPointerEvent<HTMLCanvasElement>): Point => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }

  const eraseAt = (p: Point) => {
    const before = strokesRef.current.length
    strokesRef.current = strokesRef.current.filter((s) => !s.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) <= ERASE_R))
    if (strokesRef.current.length !== before) { redoRef.current = []; setSaved(false); drawAll(); force((n) => n + 1) }
  }

  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    const p = toPoint(e)
    if (eraser) { drawingRef.current = true; eraseAt(p); return }
    drawingRef.current = true
    redoRef.current = []
    strokesRef.current.push({ color, width, points: [p] })
    setSaved(false)
    drawAll()
  }
  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const p = toPoint(e)
    if (eraser) { eraseAt(p); return }
    const cur = strokesRef.current[strokesRef.current.length - 1]
    cur.points.push(p)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && cur.points.length >= 2) {
      ctx.strokeStyle = cur.color
      ctx.lineWidth = cur.width ?? 3
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cur.points[cur.points.length - 2].x, cur.points[cur.points.length - 2].y)
      ctx.lineTo(cur.points[cur.points.length - 1].x, cur.points[cur.points.length - 1].y)
      ctx.stroke()
    }
  }
  const onUp = () => { if (drawingRef.current) { drawingRef.current = false; force((n) => n + 1) } }

  const undo = () => { const s = strokesRef.current.pop(); if (s) { redoRef.current.push(s); setSaved(false); drawAll(); force((n) => n + 1) } }
  const redo = () => { const s = redoRef.current.pop(); if (s) { strokesRef.current.push(s); setSaved(false); drawAll(); force((n) => n + 1) } }
  const clearAll = () => { strokesRef.current = []; redoRef.current = []; setSaved(false); drawAll(); force((n) => n + 1) }
  const save = () => {
    onSave(strokesRef.current.map((s) => ({ color: s.color, width: s.width, points: s.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })) })))
    setSaved(true)
  }

  const toolBtn = (active: boolean) => ({
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    background: active ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)',
    color: active ? 'var(--primary)' : 'var(--muted-foreground)',
  })

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--secondary-foreground)' }}>{instruction}</p>
      {prompts && prompts.length > 0 && (
        <ol className="text-sm mb-2 ml-4 list-decimal" style={{ color: 'var(--muted-foreground)' }}>
          {prompts.map((p, i) => <li key={i} className="leading-snug">{p}</li>)}
        </ol>
      )}

      {/* toolbar */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button key={c} onClick={() => { setColor(c); setEraser(false) }} aria-label={`pen color ${c}`}
              className="rounded-full" style={{ width: 20, height: 20, background: c, border: !eraser && color === c ? '3px solid var(--foreground)' : '1px solid var(--border)' }} />
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
        <span className="w-px h-5" style={{ background: 'var(--border)' }} />
        <button onClick={undo} disabled={strokesRef.current.length === 0} aria-label="undo" className="rounded-md border w-7 h-7 grid place-items-center disabled:opacity-40" style={toolBtn(false)}><Undo2 size={14} /></button>
        <button onClick={redo} disabled={redoRef.current.length === 0} aria-label="redo" className="rounded-md border w-7 h-7 grid place-items-center disabled:opacity-40" style={toolBtn(false)}><Redo2 size={14} /></button>
        <button onClick={clearAll} aria-label="clear" className="rounded-md border w-7 h-7 grid place-items-center" style={toolBtn(false)}><Trash2 size={14} /></button>
      </div>

      {/* drawing surface (background node renders behind a transparent canvas) */}
      <div style={{ position: 'relative', width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--primary)' }}>
        {backgroundNode && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{backgroundNode}</div>}
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          style={{ position: 'relative', width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: eraser ? 'cell' : 'crosshair' }}
        />
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button onClick={save} className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-md px-3 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Save drawing</button>
        {saved && <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--success)' }}><Check size={12} /> Saved</span>}
      </div>
    </div>
  )
}
