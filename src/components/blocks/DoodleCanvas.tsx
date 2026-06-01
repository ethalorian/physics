"use client"

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { Stroke } from '@/lib/draw/strokes'
import { paintStrokes } from '@/lib/draw/strokes'
import { makeStrokeHandlers, type EditorTool } from '@/lib/draw/input'
import PaintToolbar from '@/components/draw/PaintToolbar'

// Canonical types now live in the shared draw engine; re-export so existing
// imports (`from './DoodleCanvas'`) keep working.
export type { Stroke, StrokeTool } from '@/lib/draw/strokes'

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

export default function DoodleCanvas({
  instruction, prompts, scaffoldSvg, imageUrl, palette, initialStrokes = [], grid, backgroundNode, onSave,
}: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgImgRef = useRef<HTMLImageElement | null>(null)
  const strokesRef = useRef<Stroke[]>(initialStrokes.map((s) => ({ ...s, points: s.points.slice() })))
  const redoRef = useRef<Stroke[]>([])
  const drawingRef = useRef(false)
  const [tool, setTool] = useState<EditorTool>('pen')
  const [color, setColor] = useState((palette && palette[0]) || '#2D2A4A')
  const [size, setSize] = useState(4)
  const [fillShapes, setFillShapes] = useState(false)
  const [saved, setSaved] = useState(false)
  const [, force] = useState(0)
  const bump = () => force((n) => n + 1)

  const bgSrc = backgroundNode ? undefined : (scaffoldSvg ? `data:image/svg+xml;utf8,${encodeURIComponent(scaffoldSvg)}` : imageUrl)
  // Drawing over a background (DOM node or image) → object eraser + no flood fill,
  // so the eraser removes marks instead of painting white over the background.
  const overBackground = !!backgroundNode || !!bgSrc

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(123,107,203,0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let gx = 0; gx <= W; gx += 32) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H) }
    for (let gy = 0; gy <= H; gy += 32) { ctx.moveTo(0, gy); ctx.lineTo(W, gy) }
    ctx.stroke()
  }

  // Synchronous repaint using a pre-loaded background image (cached in a ref) so
  // shape rubber-banding can fully redraw on every pointer move without a flicker.
  const repaint = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    if (backgroundNode) { paintStrokes(ctx, strokesRef.current); return } // transparent over the DOM background
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)
    if (bgImgRef.current) ctx.drawImage(bgImgRef.current, 0, 0, W, H)
    else if (grid) drawGrid(ctx)
    paintStrokes(ctx, strokesRef.current)
  }

  // Load (and cache) the background image whenever its source changes, then repaint.
  useEffect(() => {
    if (!bgSrc) { bgImgRef.current = null; repaint(); return }
    let cancelled = false
    const img = new window.Image()
    img.onload = () => { if (!cancelled) { bgImgRef.current = img; repaint() } }
    img.onerror = () => { if (!cancelled) { bgImgRef.current = null; repaint() } }
    img.src = bgSrc
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgSrc, backgroundNode, grid])

  const emit = () => setSaved(false)

  const handlers = makeStrokeHandlers({
    canvas: canvasRef.current, W, H, strokesRef, redoRef, drawingRef,
    tool, color, size, fillShapes, objectErase: true, repaint, emit, bump,
  })

  const undo = () => { const s = strokesRef.current.pop(); if (s) { redoRef.current.push(s); setSaved(false); repaint(); bump() } }
  const redo = () => { const s = redoRef.current.pop(); if (s) { strokesRef.current.push(s); setSaved(false); repaint(); bump() } }
  const clearAll = () => { strokesRef.current = []; redoRef.current = []; setSaved(false); repaint(); bump() }
  const save = () => {
    onSave(strokesRef.current.map((s) => ({
      color: s.color, width: s.width, tool: s.tool, fill: s.fill,
      points: s.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    })))
    setSaved(true)
  }

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--secondary-foreground)' }}>{instruction}</p>
      {prompts && prompts.length > 0 && (
        <ol className="text-sm mb-2 ml-4 list-decimal" style={{ color: 'var(--muted-foreground)' }}>
          {prompts.map((p, i) => <li key={i} className="leading-snug">{p}</li>)}
        </ol>
      )}

      <PaintToolbar
        tool={tool} setTool={setTool} color={color} setColor={setColor}
        size={size} setSize={setSize} fillShapes={fillShapes} setFillShapes={setFillShapes}
        onUndo={undo} onRedo={redo} onClear={clearAll}
        canUndo={strokesRef.current.length > 0} canRedo={redoRef.current.length > 0}
        palette={palette} hideFill={overBackground}
      />

      {/* drawing surface (background node renders behind a transparent canvas) */}
      <div style={{ position: 'relative', width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--primary)' }}>
        {backgroundNode && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{backgroundNode}</div>}
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={handlers.onDown}
          onPointerMove={handlers.onMove}
          onPointerUp={handlers.onUp}
          onPointerLeave={handlers.onUp}
          style={{ position: 'relative', width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: tool === 'eraser' ? 'cell' : tool === 'fill' ? 'copy' : 'crosshair' }}
        />
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button onClick={save} className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-md px-3 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Save drawing</button>
        {saved && <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--success)' }}><Check size={12} /> Saved</span>}
      </div>
    </div>
  )
}
