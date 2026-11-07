'use client'
import { useEffect, useState } from 'react'
import { unitFloor, type FloorPreviewRow } from '@/lib/assigned-mastery-xp'
type View={physics:boolean;enabled:boolean;units:{id:string;name:string}[];terms:{id:string;name:string}[];selected:string;releases:{unit_id:string;term_id:string}[];roster:FloorPreviewRow[];readOnly:boolean}
export default function MasteryXpFloors({course}:{course:string}) {
  const [unit,setUnit]=useState(''),[term,setTerm]=useState(''),[data,setData]=useState<View|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[version,refresh]=useState(0),[confirm,setConfirm]=useState(false)
  useEffect(()=>{
    const ctrl=new AbortController();setData(null);setError('');setConfirm(false)
    if(course) fetch('/api/teacher/mastery-xp?'+new URLSearchParams({class:course,...(unit?{unit}:{})}),{signal:ctrl.signal,cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d}).then(d=>{if(!ctrl.signal.aborted)setData(d)}).catch(e=>{if(!ctrl.signal.aborted)setError(e.message)})
    return ()=>ctrl.abort()
  },[course,unit,version])
  async function post(activate=false){
    if(!data||(!activate&&!term))return;setBusy(true);setError('')
    try{const r=await fetch('/api/teacher/mastery-xp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:activate?'enable':'post',course,unit:data.selected,term,preview:data.roster})});const d=await r.json();if(!r.ok)throw Error(d.error);refresh(v=>v+1)}catch(e){setError(e instanceof Error?e.message:'Could not post the unit.');setConfirm(false)}finally{setBusy(false)}
  }
  const posted=data?.releases?.find(r=>r.unit_id===data.selected), button='rounded-lg border px-3 py-2 font-medium disabled:opacity-50'
  return <section className="space-y-3 rounded-xl border p-5"><h2 className="text-xl font-bold">Unit XP floors</h2><p>Preview each student’s assigned mastery work. A student meets the floor at 80%; only posted units enter the 5% XP grade.</p>
    {error && <p role="alert">{error} <button className={button} onClick={()=>refresh(v=>v+1)}>Reload preview</button></p>}
    {!course ? <p>Select a Physics class above.</p> : !data ? !error&&<p role="status">Loading preview…</p> : !data.physics ? <p>Unit floors apply to Physics classes.</p> : <>
      <label>Unit <select disabled={busy} className={button} value={data.selected} onChange={e=>{setUnit(e.target.value);setTerm('')}}>{data.units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
      <table className="w-full text-left text-sm"><thead><tr><th>Student</th><th>Submitted / eligible</th><th>Floor</th></tr></thead><tbody>{data.roster.map(r=><tr key={r.user_id} className="border-t"><td className="py-2">{r.name}</td><td>{r.completed} / {r.assigned}</td><td>{!r.assigned?'Excluded':unitFloor(r.completed,r.assigned).met?'Met':'Not met'}</td></tr>)}</tbody></table>
      {!data.enabled ? <div className="space-y-2"><p>Enable for this class to credit earlier eligible submissions across all units and future submissions. Existing awards are kept; only any difference is added to the wallet. No unit grades are posted.</p><button className={button} disabled={busy||data.readOnly} onClick={()=>setConfirm(true)}>Enable assigned mastery XP…</button>{confirm && <button className={button} disabled={busy} onClick={()=>post(true)}>Confirm and credit this class</button>}</div> : posted ? <p role="status">Posted in {data.terms.find(t=>t.id===posted.term_id)?.name??posted.term_id}. The recorded grade is fixed.</p> : <>
        <label>Post in term <select className={button} disabled={busy} value={term} onChange={e=>{setTerm(e.target.value);setConfirm(false)}}><option value="">Choose term</option>{data.terms.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></label>
        {!data.terms.length&&<p>Set up grading terms in Class settings before posting.</p>}
        {confirm ? <div className="space-x-2"><p>Post these results now? Students below the floor receive 0 for this unit; students with no eligible work are excluded.</p><button className={button} disabled={busy} onClick={()=>post()}>{busy?'Posting…':'Confirm and post'}</button><button className={button} disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button></div> : <button className={button} disabled={data.readOnly||!term||!data.roster.some(r=>r.assigned>0)} onClick={()=>setConfirm(true)}>Post unit floor…</button>}
      </>}
    </>}
  </section>
}
