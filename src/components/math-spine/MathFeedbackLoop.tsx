'use client'
import { useEffect, useState } from 'react'
import WarmupAnswer from './WarmupAnswer'
import MathWorkReview from './MathWorkReview'
import type { MathResponse } from '@/lib/math-response'
interface Revision { id: string; submission_id: string; response_json: MathResponse; message: string; needs_help: boolean; status: string; teacher_reply?: string }
interface Submission { id: string; prompt: string; response: string; response_json: MathResponse; submitted_at: string; status: string; resulting_level: number | null; revision_requested: boolean }
interface Feedback { id: string; submission_id: string; message: string }
interface History { submissions: Submission[]; feedback: Feedback[]; revisions: Revision[] }
function ResponseForm({ sub, saved }: { sub: Submission; saved: () => void }) {
  const key = 'math-revision:' + sub.id
  const [draft, setDraft] = useState<{ work: MathResponse; message: string; help: boolean }>(() => {
    try { const raw = sessionStorage.getItem(key); if (raw) return JSON.parse(raw) } catch {}
    return { work: sub.response_json ?? {}, message: '', help: false }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const update = (patch: Partial<typeof draft>) => {
    const next = { ...draft, ...patch }; setDraft(next)
    try { sessionStorage.setItem(key, JSON.stringify(next)) } catch {}
  }
  async function send() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/math-spine/revision', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ submission_id:sub.id, response_json:draft.work, message:draft.message, needs_help:draft.help }) })
      const d = await response.json()
      if (!response.ok) throw new Error(d.error || 'Could not send your response')
      try { sessionStorage.removeItem(key) } catch {}
      saved()
    } catch (e) { setError(e instanceof Error ? e.message : 'Please retry') } finally { setBusy(false) }
  }
  return <div className="space-y-3 border-t pt-3">
    <h4 className="font-semibold">Use your teacher’s feedback</h4>
    <WarmupAnswer value={draft.work} onChange={work => update({work})} needsGraph={sub.response_json?.needsGraph} needsEquationBuilder={!!sub.response_json?.sandbox?.lines?.length} />
    <label className="block" htmlFor={sub.id+'-change'}>What did you change, or what help do you need?</label>
    <textarea id={sub.id+'-change'} rows={3} maxLength={2000} value={draft.message} onChange={e => update({message:e.target.value})} className="w-full rounded border bg-background p-3" />
    <label className="flex items-center gap-2"><input type="checkbox" checked={draft.help} onChange={e => update({help:e.target.checked})} /> I need help with this step</label>
    <button disabled={busy || !draft.message.trim()} onClick={send} className="min-h-11 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{busy ? 'Sending…' : 'Send response to my teacher'}</button>
    {error && <p role="alert">{error}</p>}
  </div>
}
export default function MathFeedbackLoop({ refreshKey=0 }: { refreshKey?: number }) {
  const [data,setData] = useState<History | null>(null)
  const [error,setError] = useState('')
  const [reload,setReload] = useState(0)
  useEffect(() => {
    let active=true
    fetch('/api/math-spine/student-warmups').then(async r => { const d=await r.json(); if(!r.ok) throw new Error(d.error || 'Could not load feedback'); return d }).then(d => { if(active) {setData(d);setError('')} }).catch(e => {if(active) setError(e.message)})
    return () => {active=false}
  },[reload,refreshKey])
  return <section id="math-feedback" className="my-4 space-y-3 rounded-xl border bg-card p-4">
    <div className="flex items-center justify-between"><h3 className="font-bold">My work and teacher feedback</h3><button className="min-h-11 px-3 text-sm underline" onClick={() => setReload(n=>n+1)}>Refresh</button></div>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p>Loading feedback…</p>}
    {data?.submissions.length===0 && <p className="text-sm text-muted-foreground">Your submitted warm-ups and next steps will appear here.</p>}
    {data?.submissions.map(sub => {
      const feedback=data.feedback.filter(f=>f.submission_id===sub.id)
      const revision=data.revisions.find(r=>r.submission_id===sub.id)
      const label=revision ? revision.status==='pending' ? 'Your response is waiting for your teacher' : 'Teacher acknowledged your response' : sub.revision_requested ? 'Your teacher asks for a response' : sub.status==='pending' ? 'Waiting for teacher review' : 'Reviewed'
      return <details key={sub.id} open={sub.revision_requested && !revision} className="rounded-lg border p-3">
        <summary className="cursor-pointer min-h-11"><b>{label}</b> · {new Date(sub.submitted_at).toLocaleDateString()}</summary>
        <p className="my-3 font-semibold">{sub.prompt}</p>
        <MathWorkReview value={sub.response_json} fallback={sub.response} />
        {sub.resulting_level && <p className="my-2">Teacher observation: {['','Not yet','Almost','Got it'][sub.resulting_level]}. Your ladder also reflects earlier evidence.</p>}
        {feedback.map(f=><p key={f.id} className="my-3 rounded bg-muted p-3 whitespace-pre-wrap"><b>Your teacher:</b> {f.message}</p>)}
        {sub.revision_requested && !revision && <ResponseForm sub={sub} saved={()=>setReload(n=>n+1)} />}
        {revision && <div className="mt-3 border-t pt-3"><p className="font-semibold">Your response</p><p className="whitespace-pre-wrap">{revision.message}</p><MathWorkReview key={revision.id} value={revision.response_json} />{revision.teacher_reply && <p className="mt-3 rounded bg-muted p-3 whitespace-pre-wrap"><b>Your teacher:</b> {revision.teacher_reply}</p>}</div>}
      </details>
    })}
  </section>
}
