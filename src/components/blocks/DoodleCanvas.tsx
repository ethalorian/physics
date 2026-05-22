"use client"

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'

type Point = { x: number; y: number }
export interface Stroke { color: string; points: Point[] }

export interface DoodleCanvasProps {
  instruction: string
  prompts?: string[]
  scaffoldSvg?: string
  imageUrl?: string
  palette?: string[]
  initialStrokes?: Stroke[]
  onSave: (strokes: Stroke[]) => void
}

const W = 640
const H = 360
const DEFAULT_PALETTE = ['#2D2A4A', '#7FA68B', '#9B8EC4', '#C0584A', '#3A6FA5', '#C99A2E']

export default function DoodleCanvas({
  instruction, prompts, scaffoldSvg, imageUrl, palette, initialStrokes = [], onSave,
}: DoodleCanvasProps) {
  const colors = palette && palette.length ? palette : DEFAULT_PALETTE
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>(initialStrokes.map((s) => ({ color: s.color, points: s.points.slice() })))
  const drawingRef = useRef(false)
  const [color, setColor] = useState(colors[0])
  const [saved, setSaved] = useState(false)

  const bgSrc = scaffoldSvg
    ? `data:image/svg+xml;utf8,${encodeURIComponent(scaffoldSvg)}`
    : imageUrl

  const drawStrokes = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    for (const s of strokesRef.current) {
      if (s.points.length < 2) continue
      ctx.strokeStyle = s.color
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y)
      ctx.stroke()
    }
  }

  const drawAll = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)
    if (bgSrc) {
      const img = new window.Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H)
        drawStrokes(ctx)
      }
      img.onerror = () => drawStrokes(ctx)
      img.src = bgSrc
    } else {
      drawStrokes(ctx)
    }
  }

  useEffect(() => {
    drawAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgSrc])

  const toPoint = (e: RPointerEvent<HTMLCanvasElement>): Point => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }
  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true
    strokesRef.current.push({ color, points: [toPoint(e)] })
    setSaved(false)
  }
  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const cur = strokesRef.current[strokesRef.current.length - 1]
    cur.points.push(toPoint(e))
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && cur.points.length >= 2) {
      ctx.strokeStyle = cur.color
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cur.points[cur.points.length - 2].x, cur.points[cur.points.length - 2].y)
      ctx.lineTo(cur.points[cur.points.length - 1].x, cur.points[cur.points.length - 1].y)
      ctx.stroke()
    }
  }
  const onUp = () => { drawingRef.current = false }
  const undo = () => { strokesRef.current.pop(); setSaved(false); drawAll() }
  const clear = () => { strokesRef.current = []; setSaved(false); drawAll() }
  const save = () => {
    onSave(strokesRef.current.map((s) => ({ color: s.color, points: s.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })) })))
    setSaved(true)
  }

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: '#E7E4F0', background: '#fff' }}>
      <p className="text-sm font-medium mb-1" style={{ color: '#4A4470' }}>{instruction}</p>
      {prompts && prompts.length > 0 && (
        <ol className="text-sm mb-2 ml-4 list-decimal" style={{ color: '#6B6890' }}>
          {prompts.map((p, i) => <li key={i} className="leading-snug">{p}</li>)}
        </ol>
      )}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs" style={{ color: '#6B6890' }}>Color:</span>
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={`color ${c}`}
            className="rounded-full"
            style={{ width: 22, height: 22, background: c, border: color === c ? '3px solid #2D2A4A' : '1px solid #E7E4F0' }}
          />
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{ width: '100%', height: 'auto', touchAction: 'none', border: '1px solid #9B8EC4', borderRadius: 8, cursor: 'crosshair' }}
      />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={save} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: '#E7E4F0', background: '#fff', color: '#2D2A4A' }}>Save drawing</button>
        <button onClick={undo} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: '#E7E4F0', background: '#fff', color: '#6B6890' }}>Undo</button>
        <button onClick={clear} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: '#E7E4F0', background: '#fff', color: '#6B6890' }}>Clear</button>
        {saved && <span className="text-xs" style={{ color: '#7FA68B' }}>Saved ✓</span>}
      </div>
    </div>
  )
}
