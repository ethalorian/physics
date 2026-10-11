'use client'
import type { DeckActivity } from '@/lib/deck-activities'
import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Textarea} from '@/components/ui/textarea'
import {isTicket,pulseOptions,pulsePrompt,validPulseDraft,type ToolsState} from '@/lib/presentation-tools'
import type {LiveCommandState} from '@/lib/classroom-command'

export default function TeachingPoll({live,state,busy,action,preferred}:{live:LiveCommandState;state:ToolsState;busy:boolean;action:(body:Record<string,unknown>)=>Promise<unknown>;preferred?:DeckActivity}){
 const [prompt,setPrompt]=useState(preferred?.prompt??'Answer the question on the classroom screen.')
 const [answers,setAnswers]=useState('A\nB\nC\nD')
 const [required,setRequired]=useState(true),[anonymous,setAnonymous]=useState(false)
 const [kind,setKind]=useState<string>(preferred?.kind??'custom'),[target,setTarget]=useState(preferred?.targetId??'')
 const ticket=kind==='warmup'||kind==='exit_ticket'||kind==='solo'
 const pulse=state.pulse?.status==='open'?state.pulse:null
 const options=answers.split('\n').map(s=>s.trim()).filter(Boolean)
 const blocked=busy||Boolean(live.lobby||live.session.poll_block_id)
 const draft={action:'pulse',kind,prompt,options,required,anonymous:ticket?false:anonymous,...(ticket?{target_id:target}:{})}
 return <Card density="compact" className="min-w-0 space-y-3" id="presentation-live-poll">
  <h2 className="text-title-2">Solo activity or live poll</h2>{preferred&&<p className="text-sm font-medium">Prepared from slide {preferred.slide} · {preferred.title}</p>}
  {pulse?<><p className="font-semibold whitespace-pre-wrap">{pulsePrompt(pulse)}</p><p className="text-sm text-muted-foreground">{pulse.required?'Response required':'Optional response'} · {pulse.anonymous?'Anonymous totals':'Named responses'} · {pulse.locked?'Responses paused':'Accepting responses'}</p>
   {pulseOptions(pulse).map((option,i)=><div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-muted p-3"><span>{option}</span><strong>{pulse.tally?.[i]??0}</strong></div>)}
   <p role="status">{pulse.saved??0} of {live.enrolled} responses saved</p>
   {isTicket(pulse)&&<p className="text-sm">Written responses go to your mastery drawer for the selected learning target.</p>}
   <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-12" disabled={busy} onClick={()=>action({action:'lock_pulse',locked:!pulse.locked})}>{pulse.locked?'Reopen responses':'Pause responses'}</Button>{!isTicket(pulse)&&<Button variant="outline" className="min-h-12" disabled={busy||pulse.revealed} onClick={()=>action({action:'reveal_pulse'})}>Show results on screen</Button>}<Button className="min-h-12" disabled={busy} onClick={()=>action({action:'close_pulse'})}>Close activity & return to slides</Button></div>
   {isTicket(pulse)&&<Button variant="outline" asChild className="min-h-12"><a target="_blank" rel="noopener noreferrer" href={'/admin/control-room?view=mastery&unit='+encodeURIComponent(state.unitId??live.session.plan_unit_id??'unit-1')+'&class='+encodeURIComponent(live.session.course_id)+'&target='+encodeURIComponent(pulse.target_id??'')+'&lesson='+encodeURIComponent('presentation:'+pulse.id)}>Review in mastery drawer</a></Button>}
  </>:<>
   <p className="text-sm text-muted-foreground">Students receive an alert wherever they are on the classroom site. The poll appears on your classroom screen.</p>
   <label className="block text-sm font-medium">Activity<select aria-label="Live activity type" className="mt-1 min-h-12 w-full rounded-lg border bg-background px-3" value={kind} disabled={blocked} onChange={e=>setKind(e.target.value)}><option value="custom">Live poll</option><option value="warmup">Warm-up</option><option value="exit_ticket">Exit ticket</option><option value="solo">Solo written response</option></select></label>
   {ticket&&<><label className="block text-sm font-medium">Learning target<select aria-label="Activity learning target" className="mt-1 min-h-12 w-full rounded-lg border bg-background px-3" disabled={blocked} value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose a learning target</option>{state.targets?.map(t=><option key={t.id} value={t.id}>{t.statement}</option>)}</select></label><p className="text-sm text-muted-foreground">Students write a named response. Their work enters your mastery-rating drawer; no rating is assigned automatically.</p></>}
   <label className="block text-sm font-medium">Question<Textarea aria-label="Live poll question" value={prompt} maxLength={1000} onChange={e=>setPrompt(e.target.value)} disabled={blocked} className="mt-1 min-h-24 text-base"/></label>
   {!ticket&&<label className="block text-sm font-medium">Answer choices · one per line<Textarea aria-label="Live poll answer choices" value={answers} onChange={e=>setAnswers(e.target.value)} maxLength={1205} disabled={blocked} className="mt-1 min-h-28 text-base"/><span className="text-sm font-normal text-muted-foreground">Use 2–6 different choices. Keep A, B, C, D for a question already on your slide.</span></label>}
   <label className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={required} onChange={e=>setRequired(e.target.checked)} disabled={blocked} className="h-5 w-5"/>Require a response</label>
   {!ticket&&<label className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)} disabled={blocked} className="h-5 w-5"/>Anonymous totals only</label>}
   {!ticket&&anonymous&&<p className="text-sm text-muted-foreground">Names are not saved with answers or added to the help queue. Each student still sees whether their own response is saved.</p>}
   <Button className="min-h-14 w-full" disabled={blocked||!validPulseDraft(draft)} onClick={()=>action(draft)}>{kind==='warmup'?'Launch warm-up':kind==='exit_ticket'?'Launch exit ticket':kind==='solo'?'Launch solo activity':'Launch live poll'}</Button>
   {!ticket&&<div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-12" disabled={blocked} onClick={()=>action({action:'pulse',kind:'readiness',required,anonymous})}>Quick readiness check</Button><Button variant="outline" className="min-h-12" disabled={blocked} onClick={()=>action({action:'pulse',kind:'confidence',required,anonymous})}>Quick confidence check</Button></div>}
   {(live.lobby||live.session.poll_block_id)&&<p className="text-sm">Close the current activity before launching another poll.</p>}
  </>}
  {!pulse&&state.pulse&&isTicket(state.pulse)&&<Button variant="outline" asChild className="min-h-12"><a target="_blank" rel="noopener noreferrer" href={'/admin/control-room?view=mastery&unit='+encodeURIComponent(state.unitId??'unit-1')+'&class='+encodeURIComponent(live.session.course_id)+'&target='+encodeURIComponent(state.pulse.target_id??'')+'&lesson='+encodeURIComponent('presentation:'+state.pulse.id)}>Review last activity in mastery drawer</a></Button>}
 </Card>
}
