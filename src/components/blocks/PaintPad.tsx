"use client"

import { useEffect, useRef, useState } from 'react'
import type { Stroke } from '@/lib/draw/strokes'
import { paintStrokes } from '@/lib/draw/strokes'
import { makeStrokeHandlers, type EditorTool } from '@/lib/draw/input'
import PaintToolbar, { PAINT_PALETTE } from '@/components/draw/PaintToolbar'

// MS-Paint-style drawing pad on a plain white canvas. Controlled — reports via
// onChange. All tools, rendering, and pointer logic come from the
// shared draw engine, so this file is just state + a white background.

const W = 640
const H = 360

export default function PaintPad({
  value = [], onChange, palette, transparent = false,
}: {
  value?: Stroke[]
  onChange: (strokes: Stroke[]) => void
  palette?: string[]
  /** When true, the canvas stays transparent so a background (grid/diagram)
   *  layered behind it shows through. Used by the sketch block's grid mode. */
  transparent?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>(value.map((s) => ({ ...s, points: s.points.slice() })))
  const redoRef = useRef<Stroke[]>([])
  const drawingRef = useRef(false)
  const [tool, setTool] = useState<EditorTool>('pen')
  const [color, setColor] = useState((palette && palette[0]) || PAINT_PALETTE[0])
  const [size, setSize] = useState(4)
  const [fillShapes, setFillShapes] = useState(false)
  const [, force] = useState(0)
  const bump = () => force((n) => n + 1)

  const repaint = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    if (!transparent) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H) }
    paintStrokes(ctx, strokesRef.current)
  }
  useEffect(() => { repaint() }, [])

  const emit = () => onChange(strokesRef.current.map((s) => ({
    color: s.color, width: s.width, tool: s.tool, fill: s.fill,
    points: s.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
  })))

  const handlers = makeStrokeHandlers({
    canvas: canvasRef.current, W, H, strokesRef, redoRef, drawingRef,
    tool, color, size, fillShapes, repaint, emit, bump,
  })

  const undo = () => { const s = strokesRef.current.pop(); if (s) { redoRef.current.push(s); repaint(); emit(); bump() } }
  const redo = () => { const s = redoRef.current.pop(); if (s) { strokesRef.current.push(s); repaint(); emit(); bump() } }
  const clearAll = () => { strokesRef.current = []; redoRef.current = []; repaint(); emit(); bump() }

  return (
    <div>
      <PaintToolbar
        tool={tool} setTool={setTool} color={color} setColor={setColor}
        size={size} setSize={setSize} fillShapes={fillShapes} setFillShapes={setFillShapes}
        onUndo={undo} onRedo={redo} onClear={clearAll}
        canUndo={strokesRef.current.length > 0} canRedo={redoRef.current.length > 0}
        palette={palette}
      />
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={handlers.onDown}
        onPointerMove={handlers.onMove}
        onPointerUp={handlers.onUp}
        onPointerLeave={handlers.onUp}
        style={{ width: '100%', height: 'auto', touchAction: 'none', border: '1px solid var(--primary)', borderRadius: 8, background: transparent ? 'transparent' : '#fff', cursor: tool === 'eraser' ? 'cell' : tool === 'fill' ? 'copy' : 'crosshair' }}
      />
    </div>
  )
}
