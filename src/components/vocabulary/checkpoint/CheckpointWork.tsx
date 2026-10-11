'use client'
import { useEffect, useRef, useState } from 'react'
import VocabAssignmentXp from '../VocabAssignmentXp'
import { Button } from '@/components/ui/button'
import { CheckpointResult, CheckpointStudent } from './CheckpointStudent'
import { checkpointScore, type StoredCheckpointAttempt } from '@/lib/vocab-checkpoint'
import type { VocabTask } from '@/lib/vocab-learning'
import s from './checkpoint.module.css'

export async function checkpointRequest(body: Record<string, unknown>) {
  const r = await fetch('/api/vocab/checkpoints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error ?? 'Could not save. Your answers are still here; retry.')
  return d.attempt as StoredCheckpointAttempt
}
export default function CheckpointWork({ task, knowledge }: { task: VocabTask; knowledge?: 1|2|3|null }) {
  const [attempt,setAttempt] = useState<StoredCheckpointAttempt | null>(null)
  const [history,setHistory]=useState<StoredCheckpointAttempt[]>([])
  const [words,setWords] = useState<string[]>([])
  const [error,setError] = useState('')
  const [status,setStatus] = useState('Loading saved answers…')
  const [busy,setBusy] = useState(false)
  const current = useRef<StoredCheckpointAttempt | null>(null)
  const dirty = useRef(false), saving = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const set = (a: StoredCheckpointAttempt) => { current.current = a; setAttempt(a) }
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const r = await fetch(`/api/vocab/checkpoints?task_id=${task.id}`), d = await r.json()
        if (!r.ok) throw new Error(d.error)
        let a = d.attempts[0] as StoredCheckpointAttempt | undefined
        if (!a && task.active) a = await checkpointRequest({task_id:task.id,action:'start'})
        if (active) { setWords(d.words);setHistory(d.attempts); if(a)set(a); setStatus('All answers saved') }
      } catch(e) { if(active)setError((e as Error).message) }
    }
    void load()
    const warn = (e: BeforeUnloadEvent) => { if(dirty.current || saving.current) { e.preventDefault(); e.returnValue='' } }
    window.addEventListener('beforeunload',warn)
    return () => { active=false; window.removeEventListener('beforeunload',warn); if(timer.current)clearTimeout(timer.current) }
  },[task.id,task.active])
  async function save(submit = false) {
    if(saving.current || !current.current)return
    saving.current=true
    if(submit)setBusy(true)
    setError('');setStatus(submit?'Submitting…':'Saving…')
    const snapshot=current.current
    try {
      const a=await checkpointRequest({task_id:task.id,action:submit?'submit':'save',attempt_id:snapshot.id,version:snapshot.version,answers:snapshot.answers})
      const changed=current.current?.answers!==snapshot.answers
      dirty.current=changed&&!submit
      set(changed&&!submit ? {...a,answers:current.current!.answers} : a)
      setStatus(dirty.current?'Saving…':'All answers saved')
    } catch(e) {setError((e as Error).message);setStatus('Not saved — retry before leaving')}
    finally {saving.current=false;setBusy(false)}
    if(dirty.current && !submit && current.current?.version!==snapshot.version)void save()
  }
  function answer(id:string,value:string) {
    if(!current.current)return
    set({...current.current,answers:{...current.current.answers,[id]:value}})
    dirty.current=true;setStatus('Saving…')
    if(timer.current)clearTimeout(timer.current)
    timer.current=setTimeout(()=>void save(),450)
  }
  const state={title:task.title,instructions:task.note}
  const best=history.filter(a=>a.released).sort((a,b)=>checkpointScore(b.questions,b).points!-checkpointScore(a.questions,a).points!)[0]
  return <section className={s.app}>
    <VocabAssignmentXp taskId={task.id} refreshKey={attempt?.submitted ? attempt.id : ''}/>
    {error&&<div role="alert" className={s.guidance}><p>{error}</p><Button size="lg" onClick={()=>void save()}>Retry save</Button><Button size="lg" variant="outline" onClick={()=>location.reload()}>Reload saved work</Button></div>}
    {attempt&&attempt.number>1&&best&&<div className={s.guidance}><strong>Quiz grade: {checkpointScore(best.questions,best).percent}% · best released attempt</strong><p>You are viewing attempt {attempt.number}. Your earlier grade stays until you earn a higher released score.</p></div>}
    {!attempt?<p role="status">{error?'Checkpoint could not load.':'Loading checkpoint…'}</p>:attempt.released?<CheckpointResult state={state} gradeLabel={attempt.number>1?'This attempt':'Quiz grade'} attempt={{...attempt,knowledge:knowledge??null}} questions={attempt.questions}/>:<CheckpointStudent state={state} attempt={attempt} questions={attempt.questions} words={words} busy={busy} saveStatus={status} onAnswer={answer} onSubmit={()=>{if(timer.current)clearTimeout(timer.current); if(saving.current){setError('Answers are saving. Select Submit again in a moment.');return}void save(true)}}/>}
  </section>
}
