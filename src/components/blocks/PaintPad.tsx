"use client"

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Stroke } from '@/lib/draw/strokes'
import { paintStrokes } from '@/lib/draw/strokes'
import { makeStrokeHandlers, type EditorTool } from '@/lib/draw/input'
import WorkshopDrawingToolbar from '@/components/lessons/WorkshopDrawingToolbar'
import styles from '@/components/lessons/WorkshopResponses.module.css'
import PaintToolbar from '@/components/draw/PaintToolbar'
import { INK_PALETTE } from '@/lib/palette'

// MS-Paint-style drawing pad on a plain white canvas. Controlled — reports via
// onChange. All tools, rendering, and pointer logic come from the
// shared draw engine, so this file is just state + a white background.

const W = 640
const H = 360

export default function PaintPad({
  value = [], onChange, palette, transparent = false, background, workshop = false,
}: {
  workshop?: boolean
  value?: Stroke[]
  onChange: (strokes: Stroke[]) => void
  palette?: string[]
  /** When true, the canvas stays transparent so a background (grid/diagram)
   *  layered behind it shows through. Used by the sketch block's grid mode. */
  transparent?: boolean
  /** A node drawn BEHIND the canvas only (never behind the toolbar), so a grid
   *  or diagram template can't bleed up into the tool row. */
  background?: ReactNode
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pixelScaleRef = useRef(1)
  const strokesRef = useRef<Stroke[]>(value.map((s) => ({ ...s, points: s.points.slice() })))
  const redoRef = useRef<Stroke[]>([])
  const historyRef = useRef<Stroke[][]>([])
  const futureRef = useRef<Stroke[][]>([])
  const beforeRef = useRef<Stroke[] | null>(null)
  const copyStrokes = () => strokesRef.current.map(s => ({ ...s, points: s.points.map(p => ({ ...p })) }))
  const remember = (before: Stroke[]) => { historyRef.current = [...historyRef.current.slice(-49), before]; futureRef.current = [] }
  const drawingRef = useRef(false)
  const [tool, setTool] = useState<EditorTool>('pen')
  const [color, setColor] = useState((palette && palette[0]) || INK_PALETTE[0])
  const [size, setSize] = useState(4)
  const [fillShapes, setFillShapes] = useState(false)
  const [grid, setGrid] = useState(true)
  const [snap, setSnap] = useState(false)
  const [label, setLabel] = useState('')
  const [, force] = useState(0)
  const bump = () => force((n) => n + 1)

  const clearBackgroundRef = useRef(false)
  clearBackgroundRef.current = !!(transparent || background || (workshop && grid))
  const repaint = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.setTransform(pixelScaleRef.current,0,0,pixelScaleRef.current,0,0)
    ctx.clearRect(0, 0, W, H)
    // Only paint a white fill when there's nothing behind the canvas. If a
    // background node (grid / diagram / trace-over SVG) is layered behind, keep
    // the canvas pixels clear so it shows through — otherwise the white fill hides it.
    if (!clearBackgroundRef.current) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H) }
    paintStrokes(ctx, strokesRef.current)
  }
  useEffect(() => {
    const canvas=canvasRef.current
    if (!canvas) return
    const resize=()=>{
      const ratio=Math.max(1,canvas.getBoundingClientRect().width/W*(window.devicePixelRatio||1))
      pixelScaleRef.current=ratio; canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);repaint()
    }
    const observer=new ResizeObserver(resize);observer.observe(canvas);resize()
    return ()=>observer.disconnect()
  }, [])

  useEffect(() => { repaint() }, [grid])

  const emit = () => onChange(strokesRef.current.map((s) => ({
    color: s.color, width: s.width, tool: s.tool, fill: s.fill, ...(s.text !== undefined ? { text:s.text } : {}),
    points: s.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
  })))

  const handlers = makeStrokeHandlers({
    canvas: canvasRef.current, W, H, strokesRef, redoRef, drawingRef,
    tool, color, size, fillShapes, objectErase: workshop, snapAngles: workshop && snap, repaint, emit, bump,
  })

  const finishStroke = () => {
    handlers.onUp()
    const before = beforeRef.current
    if (workshop && before && JSON.stringify(before) !== JSON.stringify(strokesRef.current)) { remember(before); bump() }
    beforeRef.current = null
  }
  const undo = () => {
    if (workshop) { const previous = historyRef.current.pop(); if (previous) { futureRef.current.push(copyStrokes()); strokesRef.current = previous; repaint(); emit(); bump() }; return }
 const s = strokesRef.current.pop(); if (s) { redoRef.current.push(s); repaint(); emit(); bump() } }
  const redo = () => {
    if (workshop) { const next = futureRef.current.pop(); if (next) { historyRef.current.push(copyStrokes()); strokesRef.current = next; repaint(); emit(); bump() }; return }
 const s = redoRef.current.pop(); if (s) { strokesRef.current.push(s); repaint(); emit(); bump() } }
  const clearAll = () => { if (workshop) { remember(copyStrokes()) } else { redoRef.current = [] }; strokesRef.current = []; repaint(); emit(); bump() }
  const placeLabel = (x: number, y: number) => {
    if (!label.trim()) return
    remember(copyStrokes())
    const fontSize = size === 8 ? 22 : size === 2 ? 14 : 18
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.font = fontSize+'px Arial, sans-serif'
    const width = ctx?.measureText(label.trim()).width ?? label.length*fontSize*.55
    strokesRef.current.push({tool:'text',text:label.trim(),color,width:fontSize,points:[{x:Math.max(8,Math.min(W-width-8,x)),y:Math.max(fontSize+8,Math.min(H-8,y))}]})
    repaint(); emit(); bump()
  }
  const Toolbar = workshop ? WorkshopDrawingToolbar : PaintToolbar

  return (
    <div className={workshop ? styles.drawPad : undefined}>
      <Toolbar
        tool={tool} setTool={setTool} color={color} setColor={setColor}
        size={size} setSize={setSize} fillShapes={fillShapes} setFillShapes={setFillShapes}
        onUndo={undo} onRedo={redo} onClear={clearAll}
        canUndo={workshop ? historyRef.current.length > 0 : strokesRef.current.length > 0} canRedo={workshop ? futureRef.current.length > 0 : redoRef.current.length > 0}
        {...(workshop ? { canClear: strokesRef.current.length > 0, grid, onGrid:()=>setGrid(v=>!v), snap, onSnap:()=>setSnap(v=>!v), label, onLabel:setLabel, onPlaceLabel:()=>placeLabel(W/2,H/2) } : {})}
        palette={palette}
      />
      {/* Buffer between the tool row and the canvas, so a template behind the
          canvas always sits clearly below the tools. */}
      <div className={workshop ? styles.paper : undefined} style={{ position: 'relative', marginTop: workshop ? undefined : 10 }}>
        {background && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#fff' }}>
            {background}
          </div>
        )}
        {workshop && grid && <div className={styles.draftingGrid} aria-hidden/>}
        <canvas
          aria-label="Drawing canvas. Use the keyboard description below if you prefer to type."
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={e => { if (workshop && tool==='text') { const r=e.currentTarget.getBoundingClientRect(); placeLabel((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height); return }; if (workshop) beforeRef.current = copyStrokes(); handlers.onDown(e) }}
          onPointerMove={handlers.onMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
          style={{ position: 'relative', display: 'block', width: '100%', height: 'auto', touchAction: 'none', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', background: (transparent || background || (workshop && grid)) ? 'transparent' : '#fff', cursor: tool === 'eraser' ? 'cell' : tool === 'fill' ? 'copy' : 'crosshair' }}
        />
      </div>
      {workshop && <div className={styles.paperHint}>{tool==='text' ? 'Label tool · tap to place text' : snap && (tool==='line'||tool==='arrow') ? 'Snap on · lines lock to 45° angles' : 'Draw with finger, pencil or mouse'}<span>Sketch only · not to scale</span></div>}
    </div>
  )
}
