'use client'
import { useCallback,useEffect,useState } from 'react'
import Link from 'next/link'
import { assessmentCenterHref } from '@/lib/assessment-center'
import { BookOpen,ArrowRight } from 'lucide-react'
import type { ReadingList } from '@/lib/textbook-assignments'
import { readingFetch } from './ReadingShared'
/** In-app alert only. No external messages and no new access to student answers. */
export default function ReadingReviewInbox({classId}: {classId?: string | null} = {}){
  const [data,setData]=useState<ReadingList|null>(null),[error,setError]=useState(false)
  const load=useCallback(async(signal?:AbortSignal)=>{try{const r=await readingFetch<ReadingList>('/api/readings',{signal});setData(r);setError(false)}catch{if(!signal?.aborted)setError(true)}},[])
  useEffect(()=>{const c=new AbortController();void load(c.signal);const refresh=()=>{if(document.visibilityState==='visible')void load(c.signal)};const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{c.abort();clearInterval(timer);window.removeEventListener('focus',refresh)}},[load])
  if(data&&!data.staff)return null
  const pending=data?.assignments.filter(a=>(!classId||a.course_id===classId)&&(data.review_counts?.[a.id]??0)>0)??[],count=pending.reduce((n,a)=>n+(data?.review_counts?.[a.id]??0),0)
  return <section className="my-4 rounded-xl border border-primary/30 bg-primary/5 p-5" aria-label="Reading review inbox"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold"><BookOpen size={20}/>Textbook reading reviews</h2><Link className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline" href={assessmentCenterHref('readings',null,classId)}>All reading assignments<ArrowRight size={16}/></Link></div><p className="text-sm text-muted-foreground" role="status">{error?'Could not refresh the reading inbox. Open all reading assignments to retry.':!data?'Checking for submissions…':count?`${count} submission${count===1?'':'s'} ready for your review`:'No reading submissions waiting for review.'}</p>{pending.length>0&&<ul className="mt-3 space-y-2">{pending.map(a=><li key={a.id}><Link className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm" href={assessmentCenterHref('readings',a.id,classId)}><span><strong>{a.title}</strong> · {data?.courses.find(c=>c.id===a.course_id)?.name}</span><span className="font-semibold text-primary">{data?.review_counts?.[a.id]} to review →</span></Link></li>)}</ul>}</section>
}
