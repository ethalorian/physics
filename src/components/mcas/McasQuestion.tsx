'use client'
import {useEffect,useState} from 'react'
import type {McasPresentation} from '@/lib/mcas/types'
import s from './Mcas.module.css'
const cached=new Map<string,McasPresentation>()
export default function McasQuestion({id}:{id:string}) {
  const [item,setItem]=useState<McasPresentation|null>(cached.get(id)??null),[error,setError]=useState(''),[retry,setRetry]=useState(0)
  useEffect(()=>{let active=true;setError('');setItem(cached.get(id)??null);if(cached.has(id))return
    fetch(`/api/mcas/items/${encodeURIComponent(id)}`,{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error??'Could not load the original question.');return d.item as McasPresentation}).then(q=>{cached.set(id,q);if(active)setItem(q)}).catch(e=>{if(active)setError(e.message)})
    return()=>{active=false}
  },[id,retry])
  if(error)return <p role="alert" className={s.notice}>{error} <button type="button" onClick={()=>setRetry(n=>n+1)}>Retry question</button></p>
  if(!item||item.id!==id)return <p role="status">Loading original MCAS question…</p>
  return <section className={s.original} aria-label={`MCAS ${item.year} question ${item.number}`}><div className={s.source}><strong>MCAS {item.year} · Question {item.number}</strong><span>{item.label}{item.hasContext?' · Shared investigation included':''}</span></div>
    {/* HTML is generated from the fixed, audited source bank; arbitrary request HTML is never accepted. */}
    <div className={s.sourceBody} dangerouslySetInnerHTML={{__html:item.html}}/>
    <p className={s.credit}>Massachusetts DESE · <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Original source</a></p>
  </section>
}
