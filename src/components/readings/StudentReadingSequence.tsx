'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SyllabusBundleView, SyllabusResource } from '@/lib/reading-syllabus'
import { readingFetch } from './ReadingShared'

export default function StudentReadingSequence(){
  const [data,setData]=useState<{staff:boolean;steps:{id:string;title:string;focus:string}[];bundles:SyllabusBundleView[]}|null>(null)
  const [error,setError]=useState('')
  useEffect(()=>{const c=new AbortController();readingFetch<NonNullable<typeof data>>('/api/reading-syllabus',{signal:c.signal}).then(setData).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>c.abort()},[])
  if(error)return <p role="status" className="text-muted-foreground">The connected course sequence could not load. Your individual readings are available below.</p>
  if(!data||data.staff||!data.bundles.length)return null
  const link=(r:SyllabusResource,label:string,href:string)=>r.id?<div className="flex flex-col gap-2"><Button asChild variant="outline"><Link href={href}>{label}{r.state?` · ${r.state.replaceAll('_',' ')}`:''}</Link></Button>{label==='Reading quiz'&&r.status==='published'&&!['submitted','graded'].includes(r.state??'')&&<span className="text-caption font-semibold text-primary">Needs completion</span>}</div>:<span className="text-caption text-muted-foreground">{label} · {r.status==='locked'?'submit the reading to unlock':'not assigned yet'}</span>
  return <section aria-label="Connected reading sequence" className="space-y-4"><h2 className="text-title-2">Your course sequence</h2><p className="text-muted-foreground">Read and submit your responses to unlock the reading quiz. Practice the vocabulary and complete its quiz when assigned.</p>{data.steps.map((s,i)=>data.bundles.filter(b=>b.step_id===s.id).map(b=><Card key={`${b.course_id}:${s.id}`} className="p-5 gap-3"><p className="text-overline text-primary">Step {i+1}</p><h3 className="text-title-3">{s.title}</h3><p>{s.focus}</p><div className="flex flex-wrap gap-3 items-center">{link(b.reading,'Reading',`/readings/${b.reading.id}`)}{link(b.practice,'Vocabulary practice',`/vocabulary/work?task_id=${b.practice.id}`)}{link(b.readingQuiz,'Reading quiz',`/quizzes/${b.readingQuiz.id}`)}{link(b.vocabularyQuiz,'Vocabulary quiz',`/quizzes/${b.vocabularyQuiz.id}`)}</div></Card>))}</section>
}
