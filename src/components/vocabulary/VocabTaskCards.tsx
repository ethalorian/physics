'use client'
import { useEffect,useState } from 'react'
import Link from 'next/link'
import type { VocabTask } from '@/lib/vocab-learning'
type CardTask=VocabTask&{progress:{covered:number;ready:number;total:number;complete:boolean;reviewDue:boolean}[]}
export default function VocabTaskCards(){
 const [tasks,setTasks]=useState<CardTask[]>([]),[error,setError]=useState('')
 useEffect(()=>{let active=true;fetch('/api/vocab/tasks').then(async r=>{if(!r.ok)throw new Error('Vocabulary assignments could not load.');return r.json()}).then(d=>{if(active)setTasks(d.tasks)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[])
 if(error)return <p role="alert" className="text-sm text-destructive">{error} <Link className="underline" href="/vocabulary/work">Open vocabulary</Link></p>
 if(!tasks.length)return null
 return <section className="rounded-xl border border-border p-4 space-y-3"><h2 className="font-bold">Assigned vocabulary</h2>{tasks.map(t=>{const p=t.progress[0];return <Link key={t.id} href={`/vocabulary/work?task_id=${t.id}`} className="block rounded-lg border border-border p-3 min-h-11 hover:bg-muted"><strong>{t.title}</strong><p className="text-sm text-muted-foreground">{p?.ready??0}/{p?.total??t.term_ids.length} words ready · {p?.covered??0} checked{t.due_on?` · due ${t.due_on}`:''}</p><span className="text-sm">{p?.reviewDue?'Time for a review':p?.complete?'Requirement met · review again':'Practice and check words'}</span></Link>})}</section>
}
