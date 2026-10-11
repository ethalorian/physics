'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { TextbookGroupActivity } from '@/lib/textbook-group-activities'
import {Textarea} from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { lobbyReadyDefault, type ContentBlock } from '@/data/content-blocks'
import { teachingPrompt, teachingTitle } from '@/lib/teaching-content'
import { commandRequest, type CommandLesson, type LiveCommandState } from '@/lib/classroom-command'

function blockPrompt(block: ContentBlock): string {
  return teachingPrompt(block) || teachingTitle(block)
}
export default function CommandLobby({ lesson, live, pulseOpen = false, preferred }: { lesson: CommandLesson; live: LiveCommandState; pulseOpen?: boolean; preferred?: {blockId?:string;frame?:number;source?:'lesson'|'textbook';prompt?:string;targetId?:string|null} }) {
  const blocks = lesson.content_blocks.blocks.filter(b=>lobbyReadyDefault(b)||b.teachingTool?.kind==='physics-explainer')
  const [blockId, setBlockId] = useState(preferred?.blockId ?? blocks[0]?.id ?? '')
  const isPlan=Boolean(live.session.plan_unit_id)
  const [source,setSource]=useState<'lesson'|'textbook'|'custom'>(isPlan||preferred?.prompt?'custom':preferred?.source??'lesson')
  const [prompt,setPrompt]=useState(preferred?.prompt??'Discuss the question on the classroom screen. Submit a claim supported by evidence.')
  const [frame,setFrame]=useState(preferred?.frame??0)
  const [textbook,setTextbook]=useState<TextbookGroupActivity[]>([])
  const [textbookId,setTextbookId]=useState('')
  const [loadingBook,setLoadingBook]=useState(false)
  const [bookError,setBookError]=useState('')
  const [bookRetry,setBookRetry]=useState(0)
  useEffect(()=>{
    if(source!=='textbook')return
    const abort=new AbortController()
    setLoadingBook(true);setBookError('')
    commandRequest<{activities:TextbookGroupActivity[]}>(`/api/present/textbook-activities?course_id=${encodeURIComponent(live.session.course_id)}&lesson_id=${encodeURIComponent(lesson.id)}`,{signal:abort.signal})
      .then(data=>{if(!abort.signal.aborted){setTextbook(data.activities);setTextbookId(old=>data.activities.some(a=>a.id===old)?old:data.activities[0]?.id??'')}})
      .catch(e=>{if(!abort.signal.aborted)setBookError(e instanceof Error?e.message:'Textbook activities could not load.')})
      .finally(()=>{if(!abort.signal.aborted)setLoadingBook(false)})
    return()=>abort.abort()
  },[source,live.session.course_id,lesson.id,bookRetry])
  const selected=blocks.find(b=>b.id===blockId)
  const explainer=selected?.teachingTool?.kind==='physics-explainer'?selected.teachingTool:undefined
  const discussion=explainer?.frames[frame]?.discussion
  const book=textbook.find(a=>a.id===textbookId)
  const [size, setSize] = useState(4)
  const [mode, setMode] = useState('near_peer')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const pending = useRef(false)
  const [created, setCreated] = useState<LiveCommandState['lobby']>(null)
  // Hold a newly created session until the live polling response catches up.
  useEffect(() => { if (live.lobby) setCreated(null) }, [live.lobby])
  const lobby = live.lobby ?? created
  async function action(url: string, body: Record<string, unknown>, method = 'POST') {
    if (pending.current) return
    pending.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const data = await commandRequest<{ session?: NonNullable<LiveCommandState['lobby']> }>(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (data.session && url === '/api/lobby/sessions') setCreated(data.session)
      if (body.status === 'closed') setCreated(null)
      setNotice('Activity updated. The classroom screen will catch up in a moment.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Activity was not confirmed. Check before retrying.') }
    finally { pending.current = false; setBusy(false) }
  }
  function launch() {
    if(source==='custom'){void action('/api/lobby/sessions',{present_session_id:live.session.id,course_id:live.session.course_id,lesson_id:live.session.lesson_id,prompt:prompt.trim(),target_id:preferred?.targetId??null,task_type:'short_response',grouping_mode:mode,group_size:size});return}

    if(source==='textbook') {
      if(!book||loadingBook||bookError)return
      void action('/api/lobby/sessions',{present_session_id:live.session.id,course_id:live.session.course_id,lesson_id:lesson.id,textbook_activity_id:book.id,task_type:'short_response',grouping_mode:mode,group_size:size})
      return
    }
    const block = blocks.find(b => b.id === blockId)
    if (!block || (explainer&&!discussion)) return
    void action('/api/lobby/sessions', { present_session_id:live.session.id,course_id: live.session.course_id, lesson_id: lesson.id, block_id: block.id, ...(explainer?{explainer_frame:frame}:{}), debrief:discussion?.debrief, target_slug: block.targetId ?? null, prompt: blockPrompt(block), task_type: ['sketch', 'lab_notebook'].includes(block.type) ? 'drawing' : ['gewa', 'equation_sandbox'].includes(block.type) ? 'proof' : block.type === 'question' ? 'question' : 'short_response', grouping_mode: mode, group_size: size })
  }
  const selectClass = 'min-h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base'
  return <div id="presentation-group-activity" className="scroll-mt-40 space-y-3"><h2 className="text-title-2">Group activity</h2><p className="text-muted-foreground">Arrival shows the join code; work shows the task; debrief shows the discussion question.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}{notice && <p role="status">{notice}</p>}
    {lobby ? <><p className="text-title-1 tracking-widest">{lobby.code}</p><p>Status: {lobby.debrief_meta?.projection_phase === 'debrief' ? 'Debrief' : lobby.status}</p><div className="flex flex-wrap gap-2"><Button className="min-h-12" disabled={busy || lobby.status !== 'lobby'} onClick={() => action(`/api/lobby/sessions/${lobby.id}/group`, {})}>Form groups</Button><Button className="min-h-12" disabled={busy || lobby.status !== 'grouped'} onClick={() => action(`/api/lobby/sessions/${lobby.id}`, { status: 'open' }, 'PATCH')}>Start work</Button><Button className="min-h-12" variant="outline" disabled={busy || lobby.status !== 'open'} onClick={() => action(`/api/lobby/sessions/${lobby.id}`, { projection_phase: lobby.debrief_meta?.projection_phase === 'debrief' ? 'working' : 'debrief' }, 'PATCH')}>{lobby.debrief_meta?.projection_phase === 'debrief' ? 'Show task' : 'Start debrief'}</Button><Button variant="outline" className="min-h-12" disabled={busy} onClick={() => action(`/api/lobby/sessions/${lobby.id}`, { status: 'closed' }, 'PATCH')}>Close activity & return to slides</Button><Button asChild variant="outline" className="min-h-12"><Link href={`/admin/lobby/${lobby.id}`} target="_blank">View groups & work</Link></Button></div></> : <fieldset disabled={busy || pulseOpen || Boolean(live.session.poll_block_id)} className="min-w-0 space-y-3"><label className="block text-caption">Activity source<select aria-label="Activity source" className={selectClass} value={source} onChange={e=>setSource(e.target.value as 'lesson'|'textbook'|'custom')}><option value="custom">Question from this presentation</option>{!isPlan&&<><option value="lesson">Lesson discussion</option><option value="textbook">Textbook questions</option></>}</select></label>
      {source==='custom'?<label className="block text-caption">Group activity prompt<Textarea aria-label="Group activity prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={4000} className="min-h-32 text-base"/><span className="text-sm text-muted-foreground">Students in this class receive a join alert. Their work opens in the lobby.</span></label>:source==='textbook'?<>{loadingBook?<p role="status">Loading textbook questions…</p>:bookError?<div><p role="alert">{bookError}</p><Button variant="outline" onClick={()=>setBookRetry(n=>n+1)}>Retry textbook questions</Button></div>:textbook.length?<><label className="block text-caption">Textbook question<select aria-label="Textbook question" className={selectClass} value={textbookId} onChange={e=>setTextbookId(e.target.value)}>{textbook.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></label>{book&&<div className="rounded-xl border p-4"><p className="whitespace-pre-wrap">{book.prompt}</p><Link className="inline-flex min-h-12 items-center underline" href={book.bookUrl} target="_blank">Open textbook</Link><p className="text-sm text-muted-foreground">Groups submit a claim, evidence, reasoning, and one disagreement to discuss.</p></div>}</>:<p>No questions are available for this lesson yet. Add a reading or concept activity, or publish a textbook assignment for this class.</p>}</>:<><label className="block text-caption">Lesson activity<select className={selectClass} value={blockId} onChange={e => { setBlockId(e.target.value); const b=blocks.find(x=>x.id===e.target.value); setFrame(b?.teachingTool?.kind==='physics-explainer'?Math.max(0,b.teachingTool.frames.findIndex(f=>f.discussion)):0) }}>{blocks.map(b => <option key={b.id} value={b.id}>{teachingTitle(b)}</option>)}</select></label>{explainer&&<label className="block text-caption">Discussion slide<select aria-label="Discussion slide" className={selectClass} value={frame} onChange={e=>setFrame(Number(e.target.value))}>{explainer.frames.map((f,i)=>f.discussion?<option key={i} value={i}>{i+1}. {f.title}</option>:null)}</select></label>}<div className="rounded-xl border p-4"><p className="whitespace-pre-wrap">{discussion?.prompt??(selected?blockPrompt(selected):'No lesson activities available.')}</p>{discussion&&<p className="mt-3 text-sm text-muted-foreground">Debrief: {discussion.debrief}</p>}</div></>}
      <div className="grid grid-cols-2 gap-3"><label className="text-caption">Grouping<select className={selectClass} value={mode} onChange={e => setMode(e.target.value)}><option value="near_peer">Near-peer</option><option value="random">Random</option><option value="matched">Matched</option></select></label><label className="text-caption">Group size<select className={selectClass} value={size} onChange={e => setSize(Number(e.target.value))}>{[2,3,4,5,6].map(n => <option key={n}>{n}</option>)}</select></label></div><Button className="min-h-14 w-full" disabled={source==='custom'?!prompt.trim():source==='textbook'?loadingBook||!!bookError||!book:!selected||!!explainer&&!discussion} onClick={launch}>Launch lobby</Button></fieldset>}
    {live.session.poll_block_id && !lobby && <p>Close the poll before launching a group activity.</p>}
  </div>
}
