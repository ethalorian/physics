'use client'

import { useState } from 'react'
import SimLab from '@/components/simulations/lab/SimLab'
import type { SimEngine } from '@/components/simulations/lab/contract'
import { mazeVectorsDef } from './def'
import type { MazeEngine } from './engine'

const buttonClass = 'rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-[var(--secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:opacity-40'
function MazeTools({ engine }: { engine: MazeEngine | null }) {
  const [x, setX] = useState(''), [y, setY] = useState(''), [magnitude, setMagnitude] = useState('')
  const [feedback, setFeedback] = useState('')
  const values = engine?.getReadouts()
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--card)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold">Navigate & observe</h2><p className="text-sm text-[var(--muted-foreground)]">Arrow keys / WASD after clicking the maze. On touch screens, swipe one step or tap a neighboring passage.</p></div>
          <div className="grid grid-cols-3 gap-1" aria-label="Movement controls">
            <span /><button className={buttonClass} disabled={!engine} aria-label="Move north" onClick={() => engine?.move('up')}>↑</button><span />
            <button className={buttonClass} disabled={!engine} aria-label="Move west" onClick={() => engine?.move('left')}>←</button>
            <button className={buttonClass} disabled={!engine} aria-label="Move south" onClick={() => engine?.move('down')}>↓</button>
            <button className={buttonClass} disabled={!engine} aria-label="Move east" onClick={() => engine?.move('right')}>→</button>
          </div>
        </div>
        <p className="text-sm font-medium" role="status">{values?.status}</p>
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} disabled={!engine} onClick={() => engine?.record()}>Record evidence</button>
          <button className={buttonClass} disabled={!engine} onClick={() => engine?.hint()}>One-step hint</button>
          <button className={buttonClass} disabled={!engine} onClick={() => { engine?.newMaze(); setFeedback(''); setX(''); setY(''); setMagnitude('') }}>New maze</button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
          <span style={{ color: '#dc2626' }}>Red: Δx</span><span style={{ color: '#2563eb' }}>Blue: Δy</span><span style={{ color: '#7c3aed' }}>Purple: displacement</span><span style={{ color: '#0f766e' }}>Teal: route traveled</span>
        </div>
        <p className="rounded-lg p-3 text-sm" style={{ background: 'var(--secondary)' }}>
          Current displacement: √[({values?.x ?? 0})² + ({values?.y ?? 0})²] = {Number(values?.magnitude ?? 0).toFixed(2)} m.
          {' '}Distance traveled: {values?.distance ?? 0} m.
        </p>
      </div>
      <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--card)' }}>
        <h2 className="font-semibold">1 · Predict the goal displacement</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Before navigating, count from S to G. Enter signed components and the straight-line magnitude (nearest 0.1 m). The walls change your route, not the displacement.</p>
        <form onSubmit={e => { e.preventDefault(); setFeedback(engine?.checkPrediction(x, y, magnitude) ?? '') }} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {([['Δx (m)', x, setX], ['Δy (m)', y, setY], ['|Δr| (m)', magnitude, setMagnitude]] as const).map(([label, value, setter]) => (
              <label className="text-sm" key={label}>{label}<input type="number" step="any" value={value} onChange={e => { setter(e.target.value); setFeedback('') }} className="mt-1 w-full rounded-lg border p-2 bg-[var(--background)]" /></label>
            ))}
          </div>
          <button disabled={!engine} className={buttonClass}>Check prediction</button>
          <p role="status" className="text-sm">{feedback}</p>
        </form>
        <details className="text-sm"><summary className="cursor-pointer font-medium">2 · Investigate, compare, explain</summary>
          <ol className="list-decimal pl-5 mt-2 space-y-2 text-[var(--muted-foreground)]">
            <li>Record a reading at a junction. Take a wrong branch, return to the junction, and record again. Which measurements changed?</li>
            <li>Reach G and record. Compare your distance with the shortest maze route and the magnitude of displacement. Why are these three different?</li>
            <li>Navigate back to S without resetting. Record the round trip. Explain how displacement can be zero after a long journey.</li>
            <li>Export your evidence. Support this claim with two rows: “Displacement depends on endpoints; distance depends on the route.”</li>
          </ol>
        </details>
        <details className="text-sm"><summary className="cursor-pointer font-medium">Teacher discussion prompts</summary><p className="mt-2 text-[var(--muted-foreground)]">Hide the vector overlay before asking for predictions. Pause at a junction and ask whether the next step increases distance, displacement, both, or neither. Have pairs compare the same difficulty and layout before using New maze. Use the round-trip rows as an exit ticket; a correct maze solution alone does not demonstrate understanding.</p></details>
      </div>
    </div>
  )
}
const renderTools = (engine: SimEngine | null) => <MazeTools key={engine?.getReadouts().trial ?? 0} engine={engine as MazeEngine | null} />
export default function MazeVectorsSimulation() {
  return <div className="maze-vector-lab">
    <style>{`.maze-vector-lab canvas { height: min(580px, calc(100vw + 30px)) !important; touch-action: none; } .maze-vector-lab canvas:focus-visible { outline: 3px solid #7c3aed; outline-offset: -3px; }`}</style>
    <SimLab def={mazeVectorsDef} renderTools={renderTools} />
  </div>
}
