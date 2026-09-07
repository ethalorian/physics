'use client'
import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import WarmupAnswer from './WarmupAnswer'
import MathWorkReview from './MathWorkReview'
import type { MathResponse } from '@/lib/math-response'
import { validateMathResponse } from '@/lib/math-response'
import { OBSERVATION_LABEL, REVISION_OUTCOME, type RevisionOutcome } from '@/lib/math-student-view'
interface Revision { id: string; submission_id: string; response_json: MathResponse; message: string; needs_help: boolean; status: string; teacher_reply?: string; next_step?: RevisionOutcome }
interface Submission { id: string; competency_id: string; prompt: string; response: string; response_json: MathResponse; submitted_at: string; status: string; resulting_level: number | null; revision_requested: boolean }
interface Feedback { id: string; submission_id: string; message: string }
interface History { submissions: Submission[]; feedback: Feedback[]; revisions: Revision[] }
interface Draft { work: MathResponse; message: string; help: boolean }
function ResponseForm({ sub, saved }: { sub: Submission; saved: () => void }) {
  const key = 'math-revision:' + sub.id
  const id = useId()
  const [draft, setDraft] = useState<Draft>({ work: sub.response_json ?? {}, message: '', help: !sub.revision_requested })
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key)
      if (raw) {
        const d = JSON.parse(raw)
        if (validateMathResponse(d.work) && typeof d.message === 'string' && typeof d.help === 'boolean') setDraft(d)
      }
    } catch { /* Storage is optional; the editor remains usable. */ }
    setReady(true)
  }, [key])
  const update = (patch: Partial<Draft>) => {
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
  return <fieldset disabled={busy || !ready} className="space-y-3 border-t pt-4">
    <legend className="px-1 font-semibold">{sub.revision_requested ? 'Use your feedback' : 'Ask about this feedback'}</legend>
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={draft.help} onChange={e=>update({help:e.target.checked})} /> I need help or have a question</label>
    {!draft.help && <WarmupAnswer value={draft.work} onChange={work=>update({work})} needsGraph={sub.response_json?.needsGraph} needsEquationBuilder={!!sub.response_json?.sandbox?.lines?.length} />}
    <label className="block font-medium" htmlFor={id}>{draft.help ? 'Which step or feedback would you like help understanding?' : 'What changed in your thinking?'}</label>
    <textarea id={id} rows={3} maxLength={2000} value={draft.message} onChange={e=>update({message:e.target.value})} className="w-full rounded border bg-background p-3" />
    <p className="text-xs text-muted-foreground">Your draft is saved in this browser tab. You can send one response for this warm-up; your teacher will reply with a next step.</p>
    <button disabled={busy || !ready || !draft.message.trim()} onClick={send} className="min-h-11 rounded bg-primary px-4 text-primary-foreground disabled:opacity-50">{busy ? 'Sending…' : draft.help ? 'Send my question' : 'Send my correction'}</button>
    {error && <p role="alert">{error}</p>}
  </fieldset>
}
function WorkConversation({ sub, feedback, revision, saved }: { sub: Submission; feedback: Feedback[]; revision?: Revision; saved: () => void }) {
  const [respond, setRespond] = useState(sub.revision_requested)
  return <div className="space-y-4">
    <p className="font-semibold">{sub.prompt}</p>
    {sub.resulting_level !== null && <p className="text-sm"><b>Teacher observation on this task:</b> {OBSERVATION_LABEL[sub.resulting_level] ?? 'Reviewed'}. This is one piece of your skill evidence.</p>}
    {feedback.length > 0 && <section className="space-y-2 rounded-lg bg-muted p-4"><h4 className="font-semibold">Your teacher’s feedback</h4>{feedback.map(f=><p key={f.id} className="whitespace-pre-wrap">{f.message}</p>)}</section>}
    <details open={sub.status === 'pending'}><summary className="min-h-11 cursor-pointer py-3 font-medium">Your original work</summary><MathWorkReview value={sub.response_json} fallback={sub.response} /></details>
    {sub.status === 'reviewed' && !revision && <>{!respond && <button className="min-h-11 rounded border px-4" onClick={()=>setRespond(true)}>Ask about this feedback</button>}{respond && <ResponseForm sub={sub} saved={saved} />}</>}
    {revision && <section className="space-y-3 border-t pt-4"><h4 className="font-semibold">{revision.needs_help ? 'Your question' : 'Your correction'}</h4><p className="whitespace-pre-wrap">{revision.message}</p>{!revision.needs_help && <MathWorkReview value={revision.response_json} />}
      {revision.status === 'pending' ? <p role="status" className="text-sm text-muted-foreground">Your response is saved and waiting for your teacher. You can continue other practice.</p> : <div className="space-y-2 rounded-lg bg-muted p-4"><h4 className="font-semibold">{revision.next_step ? REVISION_OUTCOME[revision.next_step] : 'Your teacher replied'}</h4><p className="whitespace-pre-wrap">{revision.teacher_reply}</p><p className="text-sm text-muted-foreground">This conversation does not add a mastery rating. A new teacher-reviewed task can show what you now apply independently.</p>{revision.next_step === 'fresh-check' && <p className="text-sm">This skill is queued for a future daily warm-up. An already issued warm-up stays the same.</p>}{revision.next_step === 'help' && <p className="text-sm">Use your teacher’s instructions above to connect in class.</p>}</div>}
    </section>}
  </div>
}
export default function MathFeedbackLoop({ refreshKey=0, competencyId, submissionId, embedded=false }: { refreshKey?: number; competencyId?: string; submissionId?: string; embedded?: boolean }) {
  const [data,setData] = useState<History | null>(null)
  const [error,setError] = useState('')
  const [reload,setReload] = useState(0)
  const [selected,setSelected] = useState<string | null>(null)
  const [filter,setFilter] = useState<'action' | 'waiting' | 'all'>('action')
  const [loading,setLoading] = useState(true)
  const [notice,setNotice] = useState('')
  useEffect(() => {
    let active=true; setLoading(true)
    const params = new URLSearchParams()
    if (competencyId) params.set('competency_id',competencyId)
    if (submissionId) params.set('submission_id',submissionId)
    fetch('/api/math-spine/student-warmups?'+params).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error || 'Could not load feedback');return d}).then(d=>{if(active){setData(d);setError('')}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[reload,refreshKey,competencyId,submissionId])
  const revisions = new Map(data?.revisions.map(r=>[r.submission_id,r]))
  const rows = [...(data?.submissions ?? [])].sort((a,b)=>b.submitted_at.localeCompare(a.submitted_at))
  const action = rows.filter(s=>s.revision_requested && !revisions.has(s.id))
  const waiting = rows.filter(s=>s.status === 'pending' || revisions.get(s.id)?.status === 'pending')
  const visible = embedded || filter === 'all' ? rows : filter === 'waiting' ? waiting : action
  const chosen = rows.find(s=>s.id === submissionId) ?? rows.find(s=>s.id === selected) ?? visible[0]
  function choose(id: string) {setSelected(id)}
  return <section id={embedded ? undefined : 'math-feedback'} className="my-4 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{embedded ? 'Work and feedback' : 'Your next step'}</h2><button disabled={loading} className="min-h-11 px-3 text-sm underline disabled:opacity-50" onClick={()=>setReload(n=>n+1)}>{loading ? 'Updating…' : 'Refresh feedback'}</button></div>
    {notice && <p role="status" className="rounded border p-3">{notice}</p>}
    {error && <p role="alert">{error} Your saved work has not been changed.</p>}
    {!data && loading && <p role="status">Loading your work and next steps…</p>}
    {data && <>
      {!embedded && <div className="rounded-lg bg-muted p-4"><p className="font-medium">{action.length ? `${action.length} warm-up${action.length === 1 ? '' : 's'} ready for your response` : waiting.length ? 'Your work is with your teacher' : 'Continue building your math skills'}</p><p className="mt-1 text-sm text-muted-foreground">{action.length ? 'Open the feedback, choose one step to improve, and send your correction or question.' : waiting.length ? `${waiting.length} item${waiting.length === 1 ? '' : 's'} waiting for review. You can keep practicing while you wait.` : 'Check your daily warm-up or revisit feedback from earlier work.'}</p><Link href="/dashboard/math-spine/warmup" className="mt-2 inline-flex min-h-11 items-center underline">Open daily warm-up and practice</Link></div>}
      {!embedded && rows.some(s=>revisions.get(s.id)?.status === 'acknowledged') && (()=>{
        const latest = rows.find(s=>revisions.get(s.id)?.status === 'acknowledged')!
        const reply = revisions.get(latest.id)!
        return <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">A next step from your teacher</p><p className="mt-1 font-medium">{reply.next_step ? REVISION_OUTCOME[reply.next_step] : 'Read your teacher’s reply'}</p><p className="mt-1 text-sm line-clamp-2">{reply.teacher_reply}</p><button className="min-h-11 underline text-sm" onClick={()=>{setFilter('all');choose(latest.id)}}>Open reply and original work</button></div>
      })()}
      {!embedded && <div className="flex flex-wrap gap-2" aria-label="Filter feedback">{([['action',`Needs my response (${action.length})`],['waiting',`With my teacher (${waiting.length})`],['all',`Work history (${rows.length})`]] as const).map(([key,label])=><button key={key} aria-pressed={filter === key} onClick={()=>{setFilter(key);setSelected(null)}} className={`min-h-11 rounded-full border px-3 text-sm ${filter===key ? 'border-primary bg-muted font-semibold' : ''}`}>{label}</button>)}</div>}
      <div className="space-y-2">{visible.map(s=><button key={s.id} onClick={()=>choose(s.id)} aria-pressed={chosen?.id === s.id} className={`min-h-11 w-full rounded-lg border p-3 text-left ${chosen?.id === s.id ? 'border-primary bg-muted' : ''}`}><span className="block text-sm font-medium line-clamp-2">{s.prompt}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleDateString()} · {revisions.has(s.id) ? revisions.get(s.id)?.status === 'pending' ? 'Response with teacher' : 'Teacher replied' : s.status === 'pending' ? 'Awaiting review' : s.revision_requested ? 'Needs your response' : 'Reviewed'}</span></button>)}</div>
      {visible.length === 0 && <p className="text-sm text-muted-foreground">{embedded ? 'No linked warm-up found for this selection.' : filter === 'action' ? 'No corrections requested right now. You can still ask a question from Work history.' : 'No work in this view yet.'}</p>}
      {chosen && <div className="rounded-lg border p-4"><WorkConversation key={chosen.id} sub={chosen} feedback={data.feedback.filter(f=>f.submission_id===chosen.id)} revision={revisions.get(chosen.id)} saved={()=>{setNotice('Your response is saved and waiting for your teacher.');setReload(n=>n+1)}} /></div>}
    </>}
  </section>
}
