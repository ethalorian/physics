'use client'
import { useState } from 'react'
import type { MathCompetencyRecord } from '@/data/curriculum-types'
import { OBSERVATION_LABEL } from '@/lib/math-student-view'
interface ClimbCompetency { id: string; code?: string; statement?: string }
export default function MathClimb({ competencies, records }: { competencies: ClimbCompetency[]; records: MathCompetencyRecord[] }) {
  const [selected, setSelected] = useState('')
  const id = selected || competencies.find(c=>records.some(r=>r.competencyId===c.id))?.id || competencies[0]?.id
  const history = records.filter(r=>r.competencyId===id).slice().sort((a,b)=>b.observedAt.localeCompare(a.observedAt))
  return <section className="rounded-lg border p-4"><h3 className="font-semibold">Teacher observations by skill</h3><label className="mt-2 block text-sm">Choose a skill<select value={id ?? ''} onChange={e=>setSelected(e.target.value)} className="mt-1 min-h-11 w-full rounded border bg-background p-2">{competencies.map(c=><option key={c.id} value={c.id}>{c.statement ?? c.code ?? c.id}</option>)}</select></label>{history.length ? <ol className="mt-3 space-y-2 text-sm">{history.map((r,i)=><li key={i}>{new Date(r.observedAt).toLocaleDateString()} · {OBSERVATION_LABEL[r.level]}</li>)}</ol> : <p className="mt-3 text-sm">Not assessed yet.</p>}</section>
}
