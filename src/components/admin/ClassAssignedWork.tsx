'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, ChevronRight, Plus, RefreshCw, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { assignedWorkDetailHref, lessonWorkAccess, workKinds, workAccessLabels, workDueTime, workMatches, type ClassWorkItem, type WorkFilter } from '@/lib/class-work'
import { toLocalDateTime } from '@/lib/lesson-release'
import { useClassWork, saveClassWork } from './useClassWork'
import s from './ClassAssignedWork.module.css'

const filters: {id:WorkFilter;label:string}[] = [{id:'assigned',label:'All assigned'},{id:'open',label:'Open now'},{id:'due',label:'Due in 7 days'},{id:'past',label:'Past due dates'},{id:'scheduled',label:'Scheduled'},{id:'closed',label:'Closed'},{id:'unassigned',label:'Not assigned'}]
type Edit = {item:ClassWorkItem;action:'schedule'|'due'|'close'|'open'}
function dateLabel(date:string|null,dateOnly=false) {
  if(!date)return 'No due date'
  return new Date(dateOnly?date+'T12:00:00':date).toLocaleString(undefined,{month:'short',day:'numeric',...(dateOnly?{}:{hour:'numeric',minute:'2-digit'})})
}

export default function ClassAssignedWork({classId,resource}:{classId:string|null;resource?:ReturnType<typeof useClassWork>}) {
  const params=useSearchParams(),local=useClassWork(resource?null:classId),{data,error,loading,load}=resource??local
  const [edit,setEdit]=useState<Edit|null>(null),[notice,setNotice]=useState(''),[now,setNow]=useState(Date.now())
  const filter=filters.find(f=>f.id===params.get('workStatus'))?.id??'assigned'
  const kind=params.get('workKind')??'all',query=params.get('workSearch')??''
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer)},[])
  function change(key:string,value:string){const p=new URLSearchParams(window.location.search);if(value)p.set(key,value);else p.delete(key);window.history.replaceState(null,'','?'+p)}
  const items=(data?.items??[]).map(item=>item.window?{...item,access:lessonWorkAccess(item.window,now)}:item),visible=items.filter(i=>workMatches(i,filter,now)&&(kind==='all'||i.kind===kind)&&`${i.title} ${i.context} ${i.audience}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>Number(a.access==='closed')-Number(b.access==='closed')||workDueTime(a)-workDueTime(b)||a.title.localeCompare(b.title,undefined,{numeric:true}))
  if(!classId)return <section className={s.empty}><CalendarDays size={28}/><h2>Choose a classroom to manage its work</h2><p>Select a class above to see assignments, due dates, and access together.</p></section>
  return <section className={s.workspace} aria-label="Class assigned work">
    <div className={s.heading}><div><h2>Everything assigned to this class</h2><p>Set deadlines and manage student access across all units.</p></div><div className={s.actions}>
      <Link className={s.secondary} href={`/home?class=${classId}`}><CalendarDays size={16}/>Calendar</Link>
      <button className={s.secondary} disabled={loading} onClick={()=>void load().then(()=>setNow(Date.now()))} aria-label="Refresh assigned work"><RefreshCw size={16}/></button>
      <details className={s.add}><summary><Plus size={17}/>Assign work</summary><div>
        <button onClick={e=>{change('workStatus','unassigned');change('workKind','homework');e.currentTarget.closest('details')?.removeAttribute('open')}}>Video homework</button>
        <Link href={`/admin/control-room?view=quizzes&class=${classId}`}>Quiz</Link><Link href={`/admin/control-room?view=readings&class=${classId}&create=1`}>Reading</Link><Link href={`/admin/reading-syllabus?class=${classId}`}>Reading sequence</Link><Link href={`/admin/vocabulary/tasks?class=${classId}`}>Vocabulary</Link>
      </div></details>
    </div></div>
    {error&&<p role="alert" className={s.error}>{error} <button onClick={()=>void load()}>Try again</button></p>}
    {data?.warnings.map(w=><p key={w} role="alert" className={s.error}>{w}</p>)}
    {data?.readOnly&&<p className={s.notice}>Viewing assignments. Return to your own teacher account to make changes.</p>}
    {notice&&<p role="status" className={s.notice}>{notice}</p>}
    {!data&&loading?<p role="status" className={s.empty}>Loading classroom assignments…</p>:data&&<>
      <div className={s.summary} aria-label="Assignment summary">{[{id:'open' as const,label:'Open now'},{id:'due' as const,label:'Due in 7 days'},{id:'past' as const,label:'Past due dates'},{id:'scheduled' as const,label:'Scheduled to open'}].map(card=><button key={card.id} onClick={()=>change('workStatus',card.id)} aria-pressed={filter===card.id}><strong>{items.filter(i=>workMatches(i,card.id,now)).length}</strong><span>{card.label}</span></button>)}</div>
      <div className={s.toolbar}><label className={s.search}><Search size={17}/><input aria-label="Search assigned work" value={query} onChange={e=>change('workSearch',e.target.value)} placeholder="Find work, a topic, or a student…"/></label><label>Type<select aria-label="Assignment type" value={kind} onChange={e=>change('workKind',e.target.value)}><option value="all">All types</option>{Object.entries(workKinds).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div>
      <div className={s.filters} aria-label="Filter assignments">{filters.map(f=><button key={f.id} aria-pressed={filter===f.id} onClick={()=>change('workStatus',f.id)}>{f.label}</button>)}</div>
      <div className={s.listHeading}><strong>{visible.length} {visible.length===1?'item':'items'}</strong><span>Active first, then due date · {Intl.DateTimeFormat().resolvedOptions().timeZone}</span></div>
      {filter==='past'&&<p className={s.explainer}>These assignment deadlines have passed. Open the work to check which students still need to finish.</p>}
      {filter==='unassigned'&&<p className={s.explainer}>Published lessons and prepared drafts that haven’t been assigned to this class. Choose Manage to release a lesson or open a draft to finish preparing it.</p>}
      <div className={s.list}>
        <div className={s.columns} aria-hidden="true"><span>Assignment</span><span>Due</span><span>Student access</span><span>Manage</span></div>
        {visible.map(item=><article key={item.id} className={s.row} aria-label={item.title}>
          <div className={s.identity}><span className={s.kind} data-kind={item.kind}>{workKinds[item.kind]}</span><Link className={s.title} href={assignedWorkDetailHref(item.href,params.toString())}>{item.title}<ChevronRight size={15}/></Link><p>{item.context}{item.context?' · ':''}{item.audience}</p>{item.restriction&&<p>{item.restriction}</p>}</div>
          <div className={s.due}><span className={s.mobileLabel}>Due</span><strong data-past={workMatches(item,'past',now)}>{dateLabel(item.dueAt,item.dateOnly)}</strong>{workMatches(item,'past',now)&&<small>Deadline passed</small>}{item.canEditDue&&<button disabled={data.readOnly} onClick={()=>setEdit({item,action:item.kind==='homework'||item.kind==='lesson'?'schedule':'due'})}>{item.dueAt?'Edit date':'Set date'}</button>}</div>
          <div className={s.access}><span className={s.badge} data-access={item.access}>{workAccessLabels[item.access]}</span>{item.access==='scheduled'&&item.opensAt&&<small>Opens {dateLabel(item.opensAt)}</small>}{item.access==='open'&&<small>{item.closesAt?`Closes ${dateLabel(item.closesAt)}`:'No automatic close'}</small>}{item.access==='closed'&&item.closesAt&&<small>Closed {dateLabel(item.closesAt)}</small>}</div>
          <div className={s.rowActions}>{item.kind==='homework'||item.kind==='lesson'?<button className={s.secondary} disabled={data.readOnly} onClick={()=>setEdit({item,action:'schedule'})}>Manage</button>:<><Link className={s.secondary} href={assignedWorkDetailHref(item.href,params.toString())}>{item.access==='draft'?'Open draft':'Open work'}</Link>{item.canToggle&&<button disabled={data.readOnly} onClick={()=>setEdit({item,action:item.access==='closed'?'open':'close'})}>{item.access==='closed'?'Reopen':'Close'}</button>}</>}</div>
        </article>)}
        {!visible.length&&<div className={s.empty}><h3>No work in this view</h3><p>{query?'Try another search or clear your filters.':filter==='unassigned'?'Everything available has been assigned.':'Choose Assign work to add something, or check another status.'}</p><button className={s.secondary} onClick={()=>{change('workSearch','');change('workKind','all');change('workStatus','assigned')}}>Show all assigned work</button></div>}
      </div><p className={s.footnote}>Class lessons, readings, quizzes, vocabulary, math missions, and class simulations. Activities inside a lesson stay with that lesson. Closing work keeps student responses and grades.</p>
    </>}
    {edit&&<WorkEditor key={edit.item.id+edit.action} edit={edit} classId={classId} onClose={()=>setEdit(null)} onSaved={async()=>{setNotice(`${edit.item.title} updated.`);setEdit(null);await load();setNow(Date.now())}}/>}
  </section>
}

function WorkEditor({edit:{item,action},classId,onClose,onSaved}:{edit:Edit;classId:string;onClose:()=>void;onSaved:()=>Promise<void>}) {
  const [due,setDue]=useState(item.dateOnly?item.dueAt??'':toLocalDateTime(item.dueAt)),[opens,setOpens]=useState(toLocalDateTime(item.opensAt??null)),[closes,setCloses]=useState(toLocalDateTime(item.closesAt??null))
  const [access,setAccess]=useState(item.access==='scheduled'?'scheduled':item.access==='open'?'open':'closed'),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const schedule=action==='schedule',title=schedule?'Manage '+workKinds[item.kind].toLowerCase():action==='due'?'Edit due date':action==='close'?'Close assignment?':'Reopen assignment?'
  const convert=(value:string,original:string|null)=>value===toLocalDateTime(original)?original:value?new Date(value).toISOString():null
  async function save(){if(busy)return;setBusy(true);setError('');try{
    const due_at=item.dateOnly?(due||null):convert(due,item.dueAt)
    const open_at=access==='closed'?null:access==='scheduled'?convert(opens,item.opensAt??null):item.access==='open'?item.opensAt??new Date().toISOString():new Date().toISOString()
    if(schedule&&access==='scheduled'&&(!open_at||Date.parse(open_at)<=Date.now()))throw Error('Choose an opening time in the future.')
    await saveClassWork(item,classId,action,{due_at,...(schedule?{open_at,close_at:access==='closed'?null:convert(closes,item.closesAt??null),access}:{})});await onSaved()
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose()}}><DialogContent className={s.dialog} onInteractOutside={e=>e.preventDefault()} onEscapeKeyDown={e=>{if(busy)e.preventDefault()}}><DialogTitle>{title}</DialogTitle><DialogDescription>{item.title}</DialogDescription>
    <form className={s.editor} onSubmit={e=>{e.preventDefault();void save()}}>
      {schedule&&<><label>Student access<select aria-label="Student access" value={access} disabled={busy} onChange={e=>{setAccess(e.target.value);if(access==='closed'&&e.target.value!=='closed')setCloses('')}}><option value="closed">Closed</option><option value="open">Open now</option><option value="scheduled">Schedule opening</option></select></label>{access==='scheduled'&&<label>Opens<input type="datetime-local" required value={opens} disabled={busy} onChange={e=>setOpens(e.target.value)}/></label>}</>}
      {(schedule||action==='due')&&<><label>Due {item.dateOnly?'date':'date and time'}<input type={item.dateOnly?'date':'datetime-local'} value={due} disabled={busy} onChange={e=>setDue(e.target.value)}/></label><p className={s.explainer}>The due date sets the deadline. Students can continue until you close access.</p></>}
      {schedule&&access!=='closed'&&<label>Closes (optional)<input type="datetime-local" value={closes} disabled={busy} onChange={e=>setCloses(e.target.value)}/><small>Leave blank to allow late work.</small></label>}
      {schedule&&item.kind==='homework'&&<p className={s.notice}>Students complete the video and its lesson activities on their own time or during spare class time. Their existing progress stays with the lesson.</p>}
      {action==='close'&&<p>Students will no longer be able to submit this assignment. Their responses, grades, and feedback will stay available.</p>}
      {action==='open'&&<p>Students can work on this assignment again. Its due date stays {item.dueAt?dateLabel(item.dueAt,item.dateOnly):'unset'}.</p>}
      <p className={s.footnote}>Times use {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
      {error&&<p role="alert" className={s.error}>{error}</p>}
      <div className={s.actions}><button type="button" className={s.secondary} disabled={busy} onClick={onClose}>Cancel</button><button className={s.primary} disabled={busy}>{busy?'Saving…':action==='close'?'Close assignment':action==='open'?'Reopen assignment':'Save changes'}</button></div>
    </form>
  </DialogContent></Dialog>
}
