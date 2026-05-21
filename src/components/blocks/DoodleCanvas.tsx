"use client"

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'

type Point = { x: number; y: number }
export type Stroke = Point[]

export interface DoodleCanvasProps {
  instruction: string
  imageUrl?: string
  initialStrokes?: Stroke[]
  onSave: (strokes: Stroke[]) => void
}

const W = 640
const H = 360
const INK = '#2D2A4A'
const LAVENDER = '#9B8EC4'

export default function DoodleCanvas({ instruction, imageUrl, initialStrokes = [], onSave }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>(initialStrokes.map((s) => s.slice()))
  const drawingRef = useRef(false)
  const [saved, setSaved] = useState(false)

  const drawAll = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)
    const strokes = () => {
      ctx.strokeStyle = INK
      ctx.lineWidth = 2.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      for (const s of strokesRef.current) {
        if (s.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(s[0].x, s[0].y)
        for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y)
        ctx.stroke()
      }
    }
    if (imageUrl) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H)
        strokes()
      }
      img.onerror = () => strokes()
      img.src = imageUrl
    } else {
      strokes()
    }
  }

  useEffect(() => {
    drawAll()
    // redraw when the background image changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  const toPoint = (e: RPointerEvent<HTMLCanvasElement>): Point => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }

  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true
    strokesRef.current.push([toPoint(e)])
    setSaved(false)
  }
  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const cur = strokesRef.current[strokesRef.current.length - 1]
    cur.push(toPoint(e))
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && cur.length >= 2) {
      ctx.strokeStyle = INK
      ctx.lineWidth = 2.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cur[cur.length - 2].x, cur[cur.length - 2].y)
      ctx.lineTo(cur[cur.length - 1].x, cur[cur.length - 1].y)
      ctx.stroke()
    }
  }
  const onUp = () => {
    drawingRef.current = false
  }
  const clear = () => {
    strokesRef.current = []
    setSaved(false)
    drawAll()
  }
  const save = () => {
    onSave(strokesRef.current.map((s) => s.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }))))
    setSaved(true)
  }

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: '#E7E4F0', background: '#fff' }}>
      <p className="text-sm mb-2" style={{ color: '#4A4470' }}>{instruction}</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{ width: '100%', height: 'auto', touchAction: 'none', border: `1px solid ${LAVENDER}`, borderRadius: 8, cursor: 'crosshair' }}
      />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={save} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: '#E7E4F0', background: '#fff', color: '#2D2A4A' }}>
          Save drawing
        </button>
        <button onClick={clear} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: '#E7E4F0', background: '#fff', color: '#6B6890' }}>
          Clear
        </button>
        {saved && <span className="text-xs" style={{ color: '#7FA68B' }}>Saved ✓</span>}
      </div>
    </div>
  )
}
