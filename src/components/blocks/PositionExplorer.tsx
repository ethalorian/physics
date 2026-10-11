'use client'
import { useState } from 'react'

export default function PositionExplorer({ title }: { title: string }) {
  const [start, setStart] = useState(-3)
  const [turn, setTurn] = useState(5)
  const [finish, setFinish] = useState(1)
  const x = (value: number) => 50 + (value+8)*35
  const displacement = finish-start
  const distance = Math.abs(turn-start)+Math.abs(finish-turn)
  const signed = (n:number)=>n>0?`+${n}`:`${n}`
  return <section className="space-y-4" aria-label={title}>
    <p>Predict first: if the object returns to its starting point, what happens to its distance and displacement?</p>
    <svg viewBox="0 0 660 210" role="img" aria-label={`Trip from ${start} meters to ${turn} meters, then ${finish} meters. Distance ${distance} meters; displacement ${displacement} meters.`} className="w-full rounded-xl border bg-secondary">
      <line x1="30" y1="128" x2="635" y2="128" stroke="currentColor" strokeWidth="2"/>
      {Array.from({length:17},(_,i)=>i-8).map(n=><g key={n}><line x1={x(n)} y1="122" x2={x(n)} y2="134" stroke="currentColor"/><text x={x(n)} y="152" textAnchor="middle" fill="currentColor" fontSize="12">{n}</text></g>)}
      <path d={`M${x(start)} 86 L${x(turn)} 86 L${x(turn)} 105 L${x(finish)} 105`} fill="none" stroke="var(--primary)" strokeWidth="4"/>
      {[{v:start,y:55,t:'Start'},{v:turn,y:28,t:'Turn'},{v:finish,y:185,t:'Finish'}].map(p=><g key={p.t}><circle cx={x(p.v)} cy="128" r="5" fill="var(--primary)"/><text x={x(p.v)} y={p.y} textAnchor="middle" fill="currentColor" fontSize="14">{p.t} {signed(p.v)} m</text></g>)}
    </svg>
    <div className="grid gap-4 sm:grid-cols-3">{[{name:'Start',v:start,set:setStart},{name:'Turn',v:turn,set:setTurn},{name:'Finish',v:finish,set:setFinish}].map(p=><label key={p.name} className="block rounded-lg border p-3"><span className="block font-semibold">{p.name}: {signed(p.v)} m</span><input className="h-11 w-full accent-primary" type="range" min="-8" max="8" step="1" aria-label={`${p.name} position in meters`} value={p.v} onChange={e=>p.set(Number(e.target.value))}/></label>)}</div>
    <div aria-live="polite" className="grid gap-3 sm:grid-cols-2"><p className="rounded-lg bg-secondary p-4"><strong>Distance: {distance} m</strong><br/><span className="text-sm">Add the lengths of both parts of the trip.</span></p><p className="rounded-lg bg-secondary p-4"><strong>Displacement: {signed(displacement)} m</strong><br/><span className="text-sm">Final position − initial position.</span></p></div>
    <p className="text-sm text-muted-foreground">This model follows two straight segments on one axis. Exploring it does not submit an answer or award mastery.</p>
  </section>
}
