'use client'

/**
 * MathCanvas — a single work surface where students can TYPE numbers/equations
 * directly onto the canvas AND draw freehand (now with the full paint toolset:
 * pen, line, rect, ellipse, spray, filled shapes) on the same surface. Typed
 * text is placed as objects on the board; strokes render ON TOP, so students can
 * mark up what they typed — circle an answer, cross out a wrong step, add an arrow.
 *
 * Value out: { strokes, texts } in a 640×360 coordinate space (matches the
 * teacher review renderer's viewBox, so both show up when graded).
 */
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import type { Stroke } from '@/components/blocks/DoodleCanvas'
import { paintStrokes } from '@/lib/draw/strokes'
import { makeStrokeHandlers, type EditorTool } from '@/lib/draw/input'
import PaintToolbar from '@/components/draw/PaintToolbar'
import { Type } from 'lucide-react'

export interface CanvasText { x: number; y: number; text: string; size?: number }
export interface MathCanvasValue { strokes: Stroke[]; texts: CanvasText[] }

const W = 640
const H = 360
const TEXT_SIZE = 26

// The drawing tools plus a 'text' tool unique to this surface.
type Tool = EditorTool | 'text'

export default function MathCanvas({ value, onChange }: { value?: MathCanvasValue; onChange: (v: MathCanvasValue) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>((value?.strokes ?? []).map((s) => ({ ...s, points: s.points.slice() })))
  const redoRef = useRef<Stroke[]>([])
  const textsRef = useRef<CanvasText[]>((value?.texts ?? []).map((t) => ({ ...t })))
  const drawingRef = useRef(false)
  const [tool, setTool] = useState<Tool>('text')
  const [color, setColor] = useState('#2D2A4A')
  const [width, setWidth] = useState(4)
  const [fillShapes, setFillShapes] = useState(false)
  const [editor, setEditor] = useState<{ index: number | null; x: number; y: number; value: string } | null>(null)
  const [, force] = useState(0)
  const bump = () => force((n) => n + 1)

  const emit = () => onChange({
    strokes: strokesRef.current.map((s) => ({
      color: s.color, width: s.width, tool: s.tool, fill: s.fill,
      points: s.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    })),
    texts: textsRef.current.map((t) => ({ ...t })),
  })

  const redraw = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)
    // typed text first…
    ctx.textBaseline = 'alphabetic'
    for (const t of textsRef.current) {
      ctx.font = `${t.size ?? TEXT_SIZE}px ui-sans-serif, system-ui, sans-serif`
      ctx.fillStyle = '#1A1730'
      ctx.fillText(t.text, t.x, t.y)
    }
    // …strokes on top, so annotations mark up the text
    paintStrokes(ctx, strokesRef.current)
  }
  useEffect(() => { redraw() }) // redraw whenever state changes

  const toPoint = (e: RPointerEvent<HTMLCanvasElement>) => {
    const r = (canvasRef.current as HTMLCanvasElement).getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }
  const hitText = (p: { x: number; y: number }): number => {
    for (let i = textsRef.current.length - 1; i >= 0; i--) {
      const t = textsRef.current[i]
      const size = t.size ?? TEXT_SIZE
      const w = Math.max(20, t.text.length * size * 0.55)
      if (p.x >= t.x - 4 && p.x <= t.x + w && p.y >= t.y - size && p.y <= t.y + 6) return i
    }
    return -1
  }

  // Drawing tools are handled by the shared engine; the text tool is bespoke.
  const drawTool: EditorTool = tool === 'text' ? 'pen' : tool
  const handlers = makeStrokeHandlers({
    canvas: canvasRef.current, W, H, strokesRef, redoRef, drawingRef,
    tool: drawTool, color, size: width, fillShapes, objectErase: true, repaint: redraw, emit, bump,
  })

  const onPointerDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      const p = toPoint(e)
      const hit = hitText(p)
      if (hit >= 0) { const t = textsRef.current[hit]; setEditor({ index: hit, x: t.x, y: t.y, value: t.text }) }
      else setEditor({ index: null, x: p.x, y: p.y, value: '' })
      return
    }
    handlers.onDown(e)
  }
  const onPointerMove = (e: RPointerEvent<HTMLCanvasElement>) => { if (tool !== 'text') handlers.onMove(e) }
  const onPointerUp = () => { if (tool !== 'text') handlers.onUp() }

  const commitEditor = () => {
    if (!editor) return
    const text = editor.value.trim()
    if (editor.index === null) {
      if (text) textsRef.current.push({ x: editor.x, y: editor.y, text, size: TEXT_SIZE })
    } else if (text) {
      textsRef.current[editor.index] = { ...textsRef.current[editor.index], text }
    } else {
      textsRef.current.splice(editor.index, 1)
    }
    setEditor(null)
    redraw(); emit(); bump()
  }
  const deleteEditing = () => {
    if (editor?.index != null) { textsRef.current.splice(editor.index, 1) }
    setEditor(null)
    redraw(); emit(); bump()
  }
  const undo = () => { const s = strokesRef.current.pop(); if (s) { redoRef.current.push(s); redraw(); emit(); bump() } }
  const redo = () => { const s = redoRef.current.pop(); if (s) { strokesRef.current.push(s); redraw(); emit(); bump() } }
  const clearAll = () => { strokesRef.current = []; redoRef.current = []; textsRef.current = []; setEditor(null); redraw(); emit(); bump() }

  const tb = (active: boolean) => ({
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    background: active ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)',
    color: active ? 'var(--primary)' : 'var(--muted-foreground)',
  })

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <button onClick={() => setTool('text')} aria-label="type" title="Type text"
          className="rounded-md border h-7 px-2 inline-flex items-center gap-1 text-xs font-semibold" style={tb(tool === 'text')}>
          <Type size={14} /> Text
        </button>
        <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>or draw with the tools below</span>
      </div>

      <PaintToolbar
        tool={tool} setTool={(t) => setTool(t)} color={color} setColor={setColor}
        size={width} setSize={setWidth} fillShapes={fillShapes} setFillShapes={setFillShapes}
        onUndo={undo} onRedo={redo} onClear={clearAll}
        canUndo={strokesRef.current.length > 0} canRedo={redoRef.current.length > 0}
        hideFill
      />

      <p className="text-[11px] mb-1" style={{ color: 'var(--muted-foreground)' }}>
        {tool === 'text' ? 'Tap the board to type a number or equation; tap existing text to edit it.' : tool === 'eraser' ? 'Drag over a drawn mark to erase it.' : 'Draw on the board — your marks go on top of the text.'}
      </p>

      <div style={{ position: 'relative', width: '100%' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ width: '100%', height: 'auto', touchAction: 'none', border: '1px solid var(--primary)', borderRadius: 8, background: '#fff', cursor: tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair' }}
        />
        {editor && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(Math.max((editor.x / W) * 100, 1), 60)}%`,
              top: `${Math.min(Math.max(((editor.y - TEXT_SIZE) / H) * 100, 1), 82)}%`,
              display: 'flex', gap: 4, alignItems: 'center', zIndex: 10,
              background: '#fff', border: '1px solid var(--primary)', borderRadius: 8, padding: 4,
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            }}
          >
            <input
              autoFocus
              value={editor.value}
              onChange={(e) => setEditor({ ...editor, value: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEditor(); if (e.key === 'Escape') setEditor(null) }}
              placeholder="type a number or equation…"
              className="rounded border px-1.5 py-1 text-sm"
              style={{ borderColor: 'var(--border)', background: '#fff', color: '#1A1730', minWidth: 150 }}
            />
            <button onMouseDown={(e) => { e.preventDefault(); commitEditor() }} onTouchStart={(e) => { e.preventDefault(); commitEditor() }}
              aria-label="add to board" className="rounded-md grid place-items-center"
              style={{ width: 30, height: 30, background: 'var(--primary)', color: 'var(--primary-foreground)', flexShrink: 0 }}>✓</button>
            <button onMouseDown={(e) => { e.preventDefault(); if (editor.index !== null) { deleteEditing() } else { setEditor(null) } }}
              aria-label="cancel" className="rounded-md border grid place-items-center"
              style={{ width: 30, height: 30, background: '#fff', color: 'var(--destructive)', flexShrink: 0 }}>×</button>
          </div>
        )}
      </div>
    </div>
  )
}
