'use client'

/**
 * MathCanvas — a single work surface where students can TYPE numbers/equations
 * directly onto the canvas AND draw freehand on the same surface. Typed text is
 * placed as objects on the board; freehand strokes render ON TOP, so students can
 * mark up what they typed — circle an answer, cross out a wrong step, add an arrow
 * or a quick sketch to explain.
 *
 * Value out: { strokes, texts } in a 640×360 coordinate space (matches the
 * teacher review renderer's viewBox, so both show up when graded).
 */
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import type { Stroke } from '@/components/blocks/DoodleCanvas'
import { Pen, Eraser, Type, Trash2, Undo2 } from 'lucide-react'

export interface CanvasText { x: number; y: number; text: string; size?: number }
export interface MathCanvasValue { strokes: Stroke[]; texts: CanvasText[] }

const W = 640
const H = 360
const ERASE_R = 14
const PALETTE = ['#2D2A4A', '#C0584A', '#3A6FA5', '#7FA68B']
const WIDTHS = [{ label: 'S', value: 2.5 }, { label: 'M', value: 4.5 }, { label: 'L', value: 7 }]
const TEXT_SIZE = 26

type Tool = 'pen' | 'erase' | 'text'

export default function MathCanvas({ value, onChange }: { value?: MathCanvasValue; onChange: (v: MathCanvasValue) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>((value?.strokes ?? []).map((s) => ({ ...s, points: s.points.slice() })))
  const textsRef = useRef<CanvasText[]>((value?.texts ?? []).map((t) => ({ ...t })))
  const drawingRef = useRef(false)
  const [tool, setTool] = useState<Tool>('text')
  const [color, setColor] = useState(PALETTE[0])
  const [width, setWidth] = useState(WIDTHS[1].value)
  const [editor, setEditor] = useState<{ index: number | null; x: number; y: number; value: string } | null>(null)
  const [, force] = useState(0)

  const emit = () => onChange({
    strokes: strokesRef.current.map((s) => ({ color: s.color, width: s.width, points: s.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })) })),
    texts: textsRef.current.map((t) => ({ ...t })),
  })

  const redraw = () => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)
    // typed text first…
    ctx.textBaseline = 'alphabetic'
    for (const t of textsRef.current) {
      ctx.font = `${t.size ?? TEXT_SIZE}px ui-sans-serif, system-ui, sans-serif`
      ctx.fillStyle = '#1A1730'
      ctx.fillText(t.text, t.x, t.y)
    }
    // …strokes on top, so annotations mark up the text
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

  useEffect(() => { redraw() }) // redraw whenever state changes

  const toPoint = (e: RPointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }
  const eraseAt = (p: { x: number; y: number }) => {
    const before = strokesRef.current.length
    strokesRef.current = strokesRef.current.filter((s) => !s.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) <= ERASE_R))
    if (strokesRef.current.length !== before) { redraw(); emit(); force((n) => n + 1) }
  }
  const hitText = (p: { x: number; y: number }): number => {
    // approximate hit-test (text is drawn from baseline y, growing right)
    for (let i = textsRef.current.length - 1; i >= 0; i--) {
      const t = textsRef.current[i]
      const size = t.size ?? TEXT_SIZE
      const w = Math.max(20, t.text.length * size * 0.55)
      if (p.x >= t.x - 4 && p.x <= t.x + w && p.y >= t.y - size && p.y <= t.y + 6) return i
    }
    return -1
  }

  const onDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    const p = toPoint(e)
    if (tool === 'erase') { drawingRef.current = true; eraseAt(p); return }
    if (tool === 'text') {
      const hit = hitText(p)
      if (hit >= 0) {
        const t = textsRef.current[hit]
        setEditor({ index: hit, x: t.x, y: t.y, value: t.text })
      } else {
        setEditor({ index: null, x: p.x, y: p.y, value: '' })
      }
      return
    }
    // pen
    drawingRef.current = true
    strokesRef.current.push({ color, width, points: [p] })
  }
  const onMove = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const p = toPoint(e)
    if (tool === 'erase') { eraseAt(p); return }
    const cur = strokesRef.current[strokesRef.current.length - 1]
    cur.points.push(p)
    redraw()
  }
  const onUp = () => { if (drawingRef.current) { drawingRef.current = false; emit(); force((n) => n + 1) } }

  const commitEditor = () => {
    if (!editor) return
    const text = editor.value.trim()
    if (editor.index === null) {
      if (text) textsRef.current.push({ x: editor.x, y: editor.y, text, size: TEXT_SIZE })
    } else if (text) {
      textsRef.current[editor.index] = { ...textsRef.current[editor.index], text }
    } else {
      textsRef.current.splice(editor.index, 1) // emptied → delete
    }
    setEditor(null)
    redraw(); emit(); force((n) => n + 1)
  }
  const deleteEditing = () => {
    if (editor?.index != null) { textsRef.current.splice(editor.index, 1) }
    setEditor(null)
    redraw(); emit(); force((n) => n + 1)
  }
  const undoStroke = () => { if (strokesRef.current.pop()) { redraw(); emit(); force((n) => n + 1) } }
  const clearAll = () => { strokesRef.current = []; textsRef.current = []; setEditor(null); redraw(); emit(); force((n) => n + 1) }

  const tb = (active: boolean) => ({
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    background: active ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)',
    color: active ? 'var(--primary)' : 'var(--muted-foreground)',
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <button onClick={() => setTool('text')} aria-label="type" className="rounded-md border h-7 px-2 grid place-items-center" style={tb(tool === 'text')}><Type size={14} /></button>
        <button onClick={() => setTool('pen')} aria-label="draw" className="rounded-md border w-7 h-7 grid place-items-center" style={tb(tool === 'pen')}><Pen size={14} /></button>
        <button onClick={() => setTool('erase')} aria-label="erase drawing" className="rounded-md border w-7 h-7 grid place-items-center" style={tb(tool === 'erase')}><Eraser size={14} /></button>
        <span className="w-px h-5" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-1">
          {PALETTE.map((c) => (
            <button key={c} onClick={() => { setColor(c); setTool('pen') }} aria-label={`pen ${c}`} className="rounded-full"
              style={{ width: 20, height: 20, background: c, border: tool === 'pen' && color === c ? '3px solid var(--foreground)' : '1px solid var(--border)' }} />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {WIDTHS.map((wd) => (
            <button key={wd.label} onClick={() => { setWidth(wd.value); setTool('pen') }} aria-label={`pen ${wd.label}`}
              className="text-xs font-semibold rounded-md border w-7 h-7 grid place-items-center" style={tb(tool === 'pen' && width === wd.value)}>{wd.label}</button>
          ))}
        </div>
        <span className="ml-auto flex gap-1.5">
          <button onClick={undoStroke} disabled={strokesRef.current.length === 0} aria-label="undo drawing" className="rounded-md border w-7 h-7 grid place-items-center disabled:opacity-40" style={tb(false)}><Undo2 size={14} /></button>
          <button onClick={clearAll} aria-label="clear all" className="rounded-md border w-7 h-7 grid place-items-center" style={tb(false)}><Trash2 size={14} /></button>
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground mb-1">
        {tool === 'text' ? 'Tap the board to type a number or equation; tap existing text to edit it.' : tool === 'erase' ? 'Drag over a drawn mark to erase it.' : 'Draw on the board — your marks go on top of the text.'}
      </p>

      <div style={{ position: 'relative', width: '100%' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          style={{ width: '100%', height: 'auto', touchAction: 'none', border: '1px solid var(--primary)', borderRadius: 8, background: '#fff', cursor: tool === 'text' ? 'text' : tool === 'erase' ? 'cell' : 'crosshair' }}
        />
        {editor && (
          <div
            style={{ position: 'absolute', left: `${(editor.x / W) * 100}%`, top: `${((editor.y - TEXT_SIZE) / H) * 100}%`, display: 'flex', gap: 4, alignItems: 'center', zIndex: 5 }}
          >
            <input
              autoFocus
              value={editor.value}
              onChange={(e) => setEditor({ ...editor, value: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEditor(); if (e.key === 'Escape') setEditor(null) }}
              onBlur={commitEditor}
              placeholder="type math…"
              className="rounded border px-1.5 py-0.5 text-sm"
              style={{ borderColor: 'var(--primary)', background: '#fff', color: '#1A1730', minWidth: 90 }}
            />
            {editor.index !== null && (
              <button onMouseDown={(e) => { e.preventDefault(); deleteEditing() }} aria-label="delete text" className="rounded border bg-white" style={{ width: 22, height: 22, color: 'var(--destructive)' }}>×</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
