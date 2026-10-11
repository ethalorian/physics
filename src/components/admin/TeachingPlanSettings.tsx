'use client'
import { useEffect, useState } from 'react'
import type { BlockDocument } from '@/data/content-blocks'
import { commandRequest } from '@/lib/classroom-command'

export default function TeachingPlanSettings({ document, onChange, unitId, day }: {document:BlockDocument;onChange:(doc:BlockDocument)=>void;unitId?:string|null;day?:number|null}) {
  const [unit,setUnit]=useState(unitId??'unit-1')
  const [options,setOptions]=useState<{day:number;title:string}[]>([])
  const [units,setUnits]=useState<string[]>([])
  const [error,setError]=useState('')
  useEffect(()=>{const abort=new AbortController();setError('');setOptions([]);commandRequest<{days:typeof options;availableUnits:string[]}>(`/api/teacher/lesson-plans?unit_id=${encodeURIComponent(unit)}`,{signal:abort.signal}).then(d=>{setOptions(d.days);setUnits(d.availableUnits)}).catch(e=>{if(!abort.signal.aborted)setError(e.message)});return()=>abort.abort()},[unit])
  const refs=document.teachingPlans??(!document.learningPath&&unitId&&day?[{unitId,day}]:[])
  const toggle=(value:number,checked:boolean)=>onChange({...document,teachingPlans:checked?[...refs.filter(r=>r.unitId!==unit||r.day!==value),{unitId:unit,day:value}]:refs.filter(r=>r.unitId!==unit||r.day!==value)})
  return <details id="teaching-plans" className="mb-5 rounded-xl border p-4"><summary className="min-h-11 cursor-pointer font-semibold">Linked teacher plans · {refs.length}</summary><p className="my-3 text-sm text-muted-foreground">A lesson can support several teaching days. Several lessons can share a plan. Save the lesson to save these links.</p><label>Plan unit<select className="ml-3 min-h-11 rounded-lg border bg-background px-3" value={unit} onChange={e=>setUnit(e.target.value)}>{[...new Set([unit,...units])].map(u=><option key={u}>{u}</option>)}</select></label>{error&&<p role="alert">{error}</p>}<div className="mt-3 space-y-2">{options.map(p=><label key={p.day} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={refs.some(r=>r.unitId===unit&&r.day===p.day)} onChange={e=>toggle(p.day,e.target.checked)}/>{p.title}</label>)}</div>{refs.filter(r=>r.unitId!==unit||!options.some(p=>p.day===r.day)).map(r=><p key={`${r.unitId}:${r.day}`} className="text-sm">{r.unitId} · Plan {r.day} <button className="min-h-11 underline" onClick={()=>onChange({...document,teachingPlans:refs.filter(p=>p!==r)})}>Remove link</button></p>)}</details>
}
