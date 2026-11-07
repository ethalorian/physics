'use client'
import {useEffect,useState} from 'react'
import type {McasPresentation} from '@/lib/mcas/types'
import QuizContent from '@/components/quizzes/QuizContent'
import s from './Mcas.module.css'
const cached=new Map<string,McasPresentation>()
// Only audited local source images receive a link; this never accepts user HTML.
function zoomableSource(html:string){return html.replace(/<img\b([^>]*?)src="(\/mcas\/assets\/[^"<>]+)"([^>]*)>/g,(_,before:string,src:string,after:string)=>`<a href="${src}" target="_blank" rel="noopener noreferrer" aria-label="Open this original figure or question at full size"><img${before}src="${src}"${after}></a>`)}
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
    {item.practicePrompt ? <><div className={s.practice}><p className={s.practiceLabel}>Classroom wording · same physics task</p><QuizContent questionEmphasis content={item.practicePrompt}/></div><div className={s.sourceBody}><p className={s.figureLabel}>Use the original figures, data, and answer choices below. Select an image to open it at full size.</p><div dangerouslySetInnerHTML={{__html:zoomableSource(item.html)}}/></div></> : <><p className={s.practiceLabel}>Classroom wording · same physics task</p><div className={s.sourceBody} dangerouslySetInnerHTML={{__html:zoomableSource(item.practiceHtml??item.html)}}/><details className={s.sourceOriginal}><summary>See original test wording</summary><div className={s.sourceBody} dangerouslySetInnerHTML={{__html:zoomableSource(item.html)}}/></details></>}
    <p className={s.credit}>Massachusetts DESE · <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Original source</a></p>
  </section>
}
