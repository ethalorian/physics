"use client"

import { Pen, Slash, Square, Circle, SprayCan, PaintBucket, Eraser, Undo2, Redo2, Trash2 } from 'lucide-react'
import type { EditorTool } from '@/lib/draw/input'

// Shared drawing toolbar: tools, color palette + custom picker, thickness slider,
// fill toggle, and undo/redo/clear. Controlled — the editor owns the state.

export const PAINT_PALETTE = [
  '#000000', '#5F5E5A', '#C0584A', '#E0843D', '#C99A2E', '#5BA152',
  '#2E7D5B', '#3A6FA5', '#3454B4', '#7B5EC4', '#B5489B', '#8B5E3C',
  '#FFFFFF', '#9AA0A6',
]

const TOOLS: { id: EditorTool; label: string; Icon: typeof Pen }[] = [
  { id: 'pen', label: 'Pen', Icon: Pen },
  { id: 'line', label: 'Line', Icon: Slash },
  { id: 'rect', label: 'Rectangle', Icon: Square },
  { id: 'ellipse', label: 'Ellipse', Icon: Circle },
  { id: 'spray', label: 'Spray paint', Icon: SprayCan },
  { id: 'fill', label: 'Fill background', Icon: PaintBucket },
  { id: 'eraser', label: 'Eraser', Icon: Eraser },
]

export interface PaintToolbarProps {
  /** Current tool. Typed as string so editors with extra tools (e.g. a text
   *  tool) can pass their own value; only the drawing tools highlight here. */
  tool: string
  setTool: (t: EditorTool) => void
  color: string
  setColor: (c: string) => void
  size: number
  setSize: (n: number) => void
  fillShapes: boolean
  setFillShapes: (b: boolean) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  canUndo: boolean
  canRedo: boolean
  palette?: string[]
  /** Hide the fill (bucket) tool — e.g. when drawing over a background. */
  hideFill?: boolean
}

const tb = (active: boolean) => ({
  borderColor: active ? 'var(--primary)' : 'var(--border)',
  background: active ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)',
  color: active ? 'var(--primary)' : 'var(--muted-foreground)',
})

export default function PaintToolbar(p: PaintToolbarProps) {
  const palette = p.palette && p.palette.length ? p.palette : PAINT_PALETTE
  const tools = p.hideFill ? TOOLS.filter((t) => t.id !== 'fill') : TOOLS
  const showFill = p.tool === 'rect' || p.tool === 'ellipse'
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {tools.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => p.setTool(id)} aria-label={label} title={label}
            className="rounded-md border w-7 h-7 grid place-items-center" style={tb(p.tool === id)}>
            <Icon size={14} />
          </button>
        ))}
        <span className="w-px h-5" style={{ background: 'var(--border)' }} />
        <button onClick={p.onUndo} disabled={!p.canUndo} aria-label="undo" className="rounded-md border w-7 h-7 grid place-items-center disabled:opacity-40" style={tb(false)}><Undo2 size={14} /></button>
        <button onClick={p.onRedo} disabled={!p.canRedo} aria-label="redo" className="rounded-md border w-7 h-7 grid place-items-center disabled:opacity-40" style={tb(false)}><Redo2 size={14} /></button>
        <button onClick={p.onClear} aria-label="clear" className="rounded-md border w-7 h-7 grid place-items-center" style={tb(false)}><Trash2 size={14} /></button>
      </div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {palette.map((c) => (
            <button key={c} onClick={() => { p.setColor(c); if (p.tool === 'eraser' || p.tool === 'fill') p.setTool('pen') }} aria-label={`color ${c}`} className="rounded-full"
              style={{ width: 18, height: 18, background: c, border: p.color === c ? '3px solid var(--foreground)' : '1px solid var(--border)' }} />
          ))}
          <label className="rounded-full grid place-items-center cursor-pointer overflow-hidden" title="Custom color"
            style={{ width: 18, height: 18, border: '1px solid var(--border)', background: 'conic-gradient(red,orange,yellow,green,blue,violet,red)' }}>
            <input type="color" value={p.color} onChange={(e) => p.setColor(e.target.value)} style={{ opacity: 0, width: 18, height: 18, cursor: 'pointer' }} />
          </label>
        </div>
        <span className="w-px h-5" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-1.5" title="Thickness">
          <span style={{ display: 'inline-block', width: Math.min(22, p.size + 2), height: Math.min(22, p.size + 2), borderRadius: 999, background: 'var(--foreground)' }} />
          <input type="range" min={1} max={32} step={1} value={p.size} onChange={(e) => p.setSize(Number(e.target.value))} style={{ width: 90 }} aria-label="thickness" />
          <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)', width: 18 }}>{p.size}</span>
        </div>
        {showFill && (
          <>
            <span className="w-px h-5" style={{ background: 'var(--border)' }} />
            <label className="text-xs inline-flex items-center gap-1 cursor-pointer" style={{ color: 'var(--muted-foreground)' }}>
              <input type="checkbox" checked={p.fillShapes} onChange={(e) => p.setFillShapes(e.target.checked)} /> Fill shape
            </label>
          </>
        )}
      </div>
    </div>
  )
}
