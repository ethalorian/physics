'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Gamepad2 } from 'lucide-react'

export const VOCABULARY_GAMES = [
  ['matching', 'Matching'], ['concentration', 'Concentration'], ['quiz-bowl', 'Quiz Bowl'],
  ['word-shoot', 'Word Shoot'], ['letter-catch', 'Letter Catch'], ['hangman', 'Hangman'],
  ['crossword', 'Crossword'], ['duel', 'Word Duel'], ['balderdash', 'Balderdash'],
] as const

export default function UnitVocabularyPractice({taskId,lessonId}:{taskId?:string;lessonId?:string}) {
  const [units,setUnits] = useState<{id:string;name:string}[]>([]),[selected,setSelected] = useState(''),[error,setError] = useState(''),[loading,setLoading]=useState(true)
  useEffect(()=>{
    const controller=new AbortController()
    async function load(){try{
      const response=await fetch('/api/vocab/sources',{signal:controller.signal})
      if(!response.ok)throw Error('Unit vocabulary could not load. Refresh to try again.')
      const data=await response.json()
      if(controller.signal.aborted)return
      setUnits(data.units??[])
      if(lessonId){const set=data.sets?.find((s:{lessonId:string;unitId:string})=>s.lessonId===lessonId);if(set?.unitId)setSelected(set.unitId)}
      if(taskId){const r=await fetch('/api/vocab/play?practice=unit&task_id='+encodeURIComponent(taskId),{signal:controller.signal});if(r.ok){const d=await r.json();if(!controller.signal.aborted&&d.unitId)setSelected(d.unitId)}}
    }catch(e){if(!controller.signal.aborted)setError((e as Error).message)}finally{if(!controller.signal.aborted)setLoading(false)}}
    void load();return()=>controller.abort()
  },[taskId,lessonId])
  const unit=units.some(u=>u.id===selected)?selected:units[0]?.id??''
  return <section aria-label="Vocabulary games" className="space-y-4 rounded-xl border border-border bg-card p-5">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Practice the whole unit</h2><p className="mt-1 text-sm text-muted-foreground">Every vocabulary game uses all published words in your unit. Play any game to practice.</p></div><Gamepad2 className="shrink-0 text-primary" /></div>
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    <label className="grid gap-2 text-sm font-medium">Unit<select className="min-h-11 rounded-lg border border-border bg-background px-3" value={unit} disabled={loading||!units.length} onChange={e=>setSelected(e.target.value)}>{!units.length&&<option value="">{loading?'Loading units…':'No published vocabulary yet'}</option>}{units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
    {unit&&<div className="grid gap-2 sm:grid-cols-3">{VOCABULARY_GAMES.map(([slug,label])=><Link key={slug} className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted" href={`/vocabulary/${slug}?unit_id=${encodeURIComponent(unit)}`}>{label}<ArrowRight size={14}/></Link>)}</div>}
    <p className="text-sm text-muted-foreground">Assigned vocabulary quizzes are in <Link className="underline text-primary" href="/quizzes">Quizzes</Link>.</p>
  </section>
}
