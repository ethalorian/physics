'use client'

import { Pen, Slash, MoveUpRight, Square, Circle, Eraser, Undo2, Redo2, Trash2, Type, SlidersHorizontal, Grid2X2, Magnet } from 'lucide-react'
import type { PaintToolbarProps } from '@/components/draw/PaintToolbar'
import { WORKSHOP_INKS } from '@/lib/palette'
import styles from './WorkshopResponses.module.css'

const tools = [
  { id: 'pen', label: 'Pen', Icon: Pen }, { id: 'line', label: 'Line', Icon: Slash },
  { id: 'arrow', label: 'Arrow', Icon: MoveUpRight }, { id: 'rect', label: 'Box', Icon: Square },
  { id: 'ellipse', label: 'Circle', Icon: Circle }, { id: 'text', label: 'Label', Icon: Type },
  { id: 'eraser', label: 'Erase', Icon: Eraser },
] as const
const colors = WORKSHOP_INKS
interface Props extends PaintToolbarProps {
  canClear?: boolean
  grid?: boolean
  onGrid?: () => void
  snap?: boolean
  onSnap?: () => void
  label?: string
  onLabel?: (text: string) => void
  onPlaceLabel?: () => void
}
export default function WorkshopDrawingToolbar(p: Props) {
  return <div className={styles.drawToolbar}>
    <div className={styles.workbenchTop}><span>Drawing bench <small>Sketch · mark · label</small></span><div className={styles.history} role="group" aria-label="Drawing history">
      <button type="button" onClick={p.onUndo} disabled={!p.canUndo} aria-label="Undo" title="Undo"><Undo2 size={19}/></button>
      <button type="button" onClick={p.onRedo} disabled={!p.canRedo} aria-label="Redo" title="Redo"><Redo2 size={19}/></button>
    </div></div>
    <div className={styles.toolRow} role="group" aria-label="Drawing tools">
      {tools.map(({ id, label, Icon }) => <button type="button" key={id} aria-pressed={p.tool === id} onClick={() => p.setTool(id)}><Icon size={21} aria-hidden />{label}</button>)}
    </div>
    <div className={styles.benchOptions}>
      <div className={styles.quickInk} role="group" aria-label="Quick ink colors">{colors.filter((_,i)=>[0,2,4].includes(i)).map(([value,label])=><button type="button" key={value} aria-label={`${label} ink`} aria-pressed={p.color===value} onClick={()=>p.setColor(value)}><span style={{background:value}}/></button>)}</div>
      <label className={styles.weight}>Weight<select aria-label="Line weight" value={p.size} onChange={e=>p.setSize(Number(e.target.value))}><option value={2}>Fine</option><option value={4}>Medium</option><option value={8}>Bold</option></select></label>
      <button type="button" aria-pressed={p.snap} onClick={p.onSnap}><Magnet size={17} aria-hidden/>Snap lines</button>
      <button type="button" aria-pressed={p.grid} onClick={p.onGrid}><Grid2X2 size={17} aria-hidden/>Grid</button>
      <details className={styles.toolTray}><summary><SlidersHorizontal size={17} aria-hidden/>More options</summary><div className={styles.trayContent}>
        <div><strong>Ink</strong><div className={styles.inkPalette}>{colors.map(([value,label])=><button type="button" key={value} aria-label={`${label} ink from palette`} aria-pressed={p.color===value} onClick={()=>p.setColor(value)}><span style={{background:value}}/>{label}</button>)}</div></div>
        <label className={styles.fillOption}><input type="checkbox" checked={p.fillShapes} onChange={e=>p.setFillShapes(e.target.checked)}/>Fill boxes and circles</label>
        <button type="button" onClick={p.onClear} disabled={!(p.canClear??p.canUndo)}><Trash2 size={17} aria-hidden/>Clear drawing</button><small>Undo restores a cleared drawing.</small>
      </div></details>
    </div>
    {p.tool==='text' && <div className={styles.labelComposer}><label>Label text<input aria-label="Drawing label" placeholder="e.g. 8 3/8 in · starting edge" maxLength={48} value={p.label??''} onChange={e=>p.onLabel?.(e.target.value)}/></label><button type="button" disabled={!p.label?.trim()} onClick={p.onPlaceLabel}>Place in center</button><small>Tap the drawing to place your label, or place it in the center.</small></div>}
  </div>
}
