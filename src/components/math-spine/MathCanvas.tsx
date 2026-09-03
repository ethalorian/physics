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
import { PAINT_PALETTE } from '@/components/draw/PaintToolbar'
import { Type, Pen, Slash, MoveUpRight, Square, Circle, SprayCan, PaintBucket, Eraser, Undo2, Redo2, Trash2, LocateFixed } from 'lucide-react'
import { useTranslator } from '@/lib/math-translate-store'
import { wrapBoardText, textBox, textWidth, LINE_H } from '@/lib/draw/board-text'

export interface CanvasText { x: number; y: number; text: string; size?: number }
export interface MathCanvasValue { strokes: Stroke[]; texts: CanvasText[] }

const W = 640
const H = 360
const TEXT_SIZE = 26

// The drawing tools plus a 'text' tool unique to this surface, and a 'plot'
// tool that appears only on graph paper (snaps a dot to a grid intersection).
type Tool = EditorTool | 'text' | 'plot'
const GRID = 32

export default function MathCanvas({ value, onChange, gridded = false, lang = '', readOnly = false, stamp }: {
  value?: MathCanvasValue
  onChange: (v: MathCanvasValue) => void
  gridded?: boolean
  lang?: string
  /** Frozen board (post-submit): no tools, no pointer input. */
  readOnly?: boolean
  /** Small verdict stamp painted in the corner of a frozen board. */
  stamp?: { text: string; tone: 'up' | 'down' | 'neutral' } | null
}) {
  const t = useTranslator(lang)
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
    // optional graph paper (light grid + center axes) for graphing items
    if (gridded) {
      const step = GRID
      ctx.lineWidth = 1
      ctx.strokeStyle = '#E3E8F0'
      for (let x = step; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = step; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      ctx.strokeStyle = '#AEB7C7'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
    }
    // typed text first…
    ctx.textBaseline = 'alphabetic'
    for (const t of textsRef.current) {
      const size = t.size ?? TEXT_SIZE
      ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`
      ctx.fillStyle = '#1A1730'
      // wrapped to the board's right edge so nothing runs off the canvas
      wrapBoardText(t.text, t.x, size).forEach((line, i) => ctx.fillText(line, t.x, t.y + i * size * LINE_H))
    }
    // …strokes on top, so annotations mark up the text
    paintStrokes(ctx, strokesRef.current)
    // verdict stamp on a frozen board — the teacher's review drawer paints the
    // same strokes+texts, so student and teacher look at one artifact
    if (readOnly && stamp) {
      ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif'
      const w = ctx.measureText(stamp.text).width + 18
      ctx.fillStyle = stamp.tone === 'up' ? '#DCEBDD' : stamp.tone === 'down' ? '#F1DEDA' : '#E6E8EE'
      ctx.fillRect(W - w - 10, 10, w, 24)
      ctx.fillStyle = stamp.tone === 'up' ? '#2F6B3A' : stamp.tone === 'down' ? '#8A4A3F' : '#4A4E5C'
      ctx.fillText(stamp.text, W - w - 1, 27)
    }
  }
  useEffect(() => { redraw() }) // redraw whenever state changes

  const toPoint = (e: RPointerEvent<HTMLCanvasElement>) => {
    const r = (canvasRef.current as HTMLCanvasElement).getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }
  const hitText = (p: { x: number; y: number }): number => {
    for (let i = textsRef.current.length - 1; i >= 0; i--) {
      const t = textsRef.current[i]
      const b = textBox(t.text, t.x, t.y, t.size ?? TEXT_SIZE)
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return i
    }
    return -1
  }

  // Drawing tools are handled by the shared engine; the text tool is bespoke.
  const drawTool: EditorTool = tool === 'text' || tool === 'plot' ? 'pen' : tool
  const handlers = makeStrokeHandlers({
    canvas: canvasRef.current, W, H, strokesRef, redoRef, drawingRef,
    tool: drawTool, color, size: width, fillShapes, objectErase: true, repaint: redraw, emit, bump,
  })

  const onPointerDown = (e: RPointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return
    if (tool === 'plot') {
      const p = toPoint(e)
      const x = Math.round(p.x / GRID) * GRID
      const y = Math.round(p.y / GRID) * GRID
      strokesRef.current.push({ color, width: 2, tool: 'ellipse', fill: true, points: [{ x: x - 5, y: y - 5 }, { x: x + 5, y: y + 5 }] })
      redoRef.current = []
      redraw(); emit(); bump()
      return
    }
    if (tool === 'text') {
      const p = toPoint(e)
      const hit = hitText(p)
      if (hit >= 0) { const t = textsRef.current[hit]; setEditor({ index: hit, x: t.x, y: t.y, value: t.text }) }
      else setEditor({ index: null, x: p.x, y: p.y, value: '' })
      return
    }
    handlers.onDown(e)
  }
  const onPointerMove = (e: RPointerEvent<HTMLCanvasElement>) => { if (!readOnly && tool !== 'text' && tool !== 'plot') handlers.onMove(e) }
  const onPointerUp = () => { if (!readOnly && tool !== 'text' && tool !== 'plot') handlers.onUp() }

  const commitEditor = () => {
    if (!editor) return
    const text = editor.value.trim()
    if (editor.index === null) {
      // Placed near the right edge? Slide the block left so a readable width
      // (up to 240px) fits before wrapping kicks in.
      const want = Math.min(240, textWidth(text, TEXT_SIZE) + 8)
      const x = Math.max(4, Math.min(editor.x, W - 8 - want))
      if (text) textsRef.current.push({ x, y: editor.y, text, size: TEXT_SIZE })
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

  // Toolbar: every tool at a 40px target, grouped by job — draw · shapes ·
  // ink · history. The four most-used sit first; nothing hides in a menu.
  const tb = (active: boolean) => ({
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    background: active ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)',
    color: active ? 'var(--primary)' : 'var(--muted-foreground)',
  })
  const TB = ({ id, label, Icon, text }: { id: Tool; label: string; Icon: typeof Pen; text?: string }) => (
    <button type="button" onClick={() => setTool(id)} aria-label={label} title={label} aria-pressed={tool === id}
      className="rounded-lg border inline-flex items-center justify-center gap-1.5 text-xs font-semibold"
      style={{ ...tb(tool === id), height: 40, minWidth: 40, padding: text ? '0 12px' : 0 }}>
      <Icon size={17} />{text && <span>{text}</span>}
    </button>
  )
  const HB = ({ onClick, label, Icon, disabled }: { onClick: () => void; label: string; Icon: typeof Pen; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className="rounded-lg border grid place-items-center disabled:opacity-40"
      style={{ ...tb(false), height: 40, width: 40 }}>
      <Icon size={17} />
    </button>
  )
  const Sep = () => <span aria-hidden className="mx-1" style={{ width: 1, height: 28, background: 'var(--border)' }} />
  const showFill = tool === 'rect' || tool === 'ellipse'
  const hint = tool === 'text' ? t('Tap the board to type a number or equation; tap existing text to edit it.')
    : tool === 'plot' ? t('Tap a grid intersection to plot a point — it snaps to the grid.')
    : tool === 'eraser' ? t('Drag over a drawn mark to erase it.')
    : t('Draw on the board — your marks go on top of the text.')

  return (
    <div>
      {!readOnly && (
        <div className="flex items-center gap-1.5 mb-2 flex-wrap" role="toolbar" aria-label="board tools">
          {gridded && <TB id="plot" label="Plot point" Icon={LocateFixed} text={t('Plot')} />}
          <TB id="text" label="Type text" Icon={Type} text={t('Type')} />
          <TB id="pen" label="Pen" Icon={Pen} text={t('Pen')} />
          <TB id="line" label="Line" Icon={Slash} text={t('Line')} />
          <TB id="eraser" label="Eraser" Icon={Eraser} text={t('Erase')} />
          <Sep />
          <TB id="arrow" label="Arrow (for vectors & forces)" Icon={MoveUpRight} />
          <TB id="rect" label="Rectangle" Icon={Square} />
          <TB id="ellipse" label="Ellipse" Icon={Circle} />
          <TB id="spray" label="Spray paint" Icon={SprayCan} />
          {!gridded && <TB id="fill" label="Fill background" Icon={PaintBucket} />}
          {showFill && (
            <label className="text-xs inline-flex items-center gap-1 cursor-pointer px-1" style={{ color: 'var(--muted-foreground)', height: 40 }}>
              <input type="checkbox" checked={fillShapes} onChange={(e) => setFillShapes(e.target.checked)} /> {t('Fill')}
            </label>
          )}
          <Sep />
          <div className="inline-flex items-center gap-1 flex-wrap" aria-label="ink color" style={{ maxWidth: 150 }}>
            {PAINT_PALETTE.slice(0, 8).map((c) => (
              <button key={c} type="button" onClick={() => { setColor(c); if (tool === 'eraser' || tool === 'fill' || tool === 'text') setTool('pen') }} aria-label={`color ${c}`}
                className="rounded-full" style={{ width: 18, height: 18, background: c, border: color === c ? '3px solid var(--foreground)' : '1px solid var(--border)' }} />
            ))}
          </div>
          <div className="inline-flex items-center gap-1.5" title="Thickness">
            <span style={{ display: 'inline-block', width: Math.min(18, width + 2), height: Math.min(18, width + 2), borderRadius: 999, background: 'var(--foreground)' }} />
            <input type="range" min={1} max={24} step={1} value={width} onChange={(e) => setWidth(Number(e.target.value))} style={{ width: 70 }} aria-label="thickness" />
          </div>
          <Sep />
          <HB onClick={undo} label="Undo" Icon={Undo2} disabled={strokesRef.current.length === 0} />
          <HB onClick={redo} label="Redo" Icon={Redo2} disabled={redoRef.current.length === 0} />
          <HB onClick={clearAll} label="Clear board" Icon={Trash2} />
        </div>
      )}

      {!readOnly && <p className="text-[11px] mb-1" style={{ color: 'var(--muted-foreground)' }}>{hint}</p>}

      <div style={{ position: 'relative', width: '100%' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          aria-readonly={readOnly || undefined}
          style={{ width: '100%', height: 'auto', touchAction: 'none', border: `1px solid ${readOnly ? 'var(--border)' : 'var(--primary)'}`, borderRadius: 8, background: '#fff', cursor: readOnly ? 'default' : tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair' }}
        />
        {editor && !readOnly && (
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
            <textarea
              autoFocus
              rows={Math.min(4, Math.max(1, editor.value.split('\n').length))}
              value={editor.value}
              onChange={(e) => setEditor({ ...editor, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEditor() }
                if (e.key === 'Escape') setEditor(null)
              }}
              placeholder={t('type a number or equation… (Shift+Enter for a new line)')}
              className="rounded border px-1.5 py-1 text-sm"
              style={{ borderColor: 'var(--border)', background: '#fff', color: '#1A1730', minWidth: 220, maxWidth: 360, resize: 'none', lineHeight: 1.3 }}
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
