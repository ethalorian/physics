'use client'
import { useEffect, useState, type ComponentProps } from 'react'
import BlockLessonViewer from './BlockLessonViewer'
import { TradeContext } from './TradeContext'
import { TRADE_LABELS, isAssignedTrade, type AssignedTrade } from '@/lib/vocational'
export default function TradeLessonShell(props: ComponentProps<typeof BlockLessonViewer>) {
  const [trade,setTrade]=useState<AssignedTrade|null>(props.staffView ? 'electrical' : null)
  const [choice,setChoice]=useState('')
  const [loading,setLoading]=useState(!props.staffView)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{if(props.staffView)return; const c=new AbortController();fetch('/api/trade-profile',{signal:c.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setTrade(isAssignedTrade(d.trade)?d.trade:null)}).catch(e=>{if(!c.signal.aborted)setError(e.message)}).finally(()=>{if(!c.signal.aborted)setLoading(false)});return()=>c.abort()},[props.staffView])
  async function save(){setBusy(true);setError('');try{const r=await fetch('/api/trade-profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({trade:choice})});const d=await r.json();if(!r.ok)throw Error(d.error);setTrade(d.trade)}catch(e){setError(e instanceof Error?e.message:'Could not save your trade.')}finally{setBusy(false)}}
  return <TradeContext.Provider value={trade}><section className="mx-auto max-w-5xl p-4" aria-label="Assigned trade profile"><h2 className="font-semibold">{props.staffView ? 'Preview assigned trade' : 'Your assigned trade'}</h2>{loading ? <p role="status">Loading your trade…</p> : props.staffView ? <><select aria-label="Preview assigned trade" className="min-h-11 border rounded p-2" value={trade ?? ''} onChange={e=>setTrade(e.target.value as AssignedTrade)}>{Object.entries(TRADE_LABELS).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select><a className="ml-4 underline" href="/admin/trades">Manage student trades</a></> : trade ? <p>{TRADE_LABELS[trade]} · Saved in your profile. Ask your teacher for corrections.</p> : <><p>Select the program you already attend.</p><select aria-label="Assigned trade" className="min-h-11 border rounded p-2" value={choice} onChange={e=>setChoice(e.target.value)}><option value="" disabled>Select your program</option>{Object.entries(TRADE_LABELS).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select><button className="ml-3 min-h-11 border rounded px-4 disabled:opacity-50" disabled={!choice||busy} onClick={save}>{busy?'Saving…':'Save my trade'}</button></>}{error&&<p role="alert">{error}</p>}</section>{trade&&<BlockLessonViewer {...props}/>}</TradeContext.Provider>
}
