'use client'
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react'
import {getFoundationCheckpoints,emptyCheckpointWriting,type CheckpointId,type FoundationPair,type FoundationKey,type Checkpoint} from '@/lib/interactive-assignments/foundations/checkpoints'
import {foundationExchangeEvidence} from '@/lib/interactive-assignments/foundations/evidence'
import {DAY_THREE_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-three-checkpoints'
import {DAY_NINE_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-nine-checkpoints'
import {DAY_EIGHT_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-eight-checkpoints'
import {DAY_SEVEN_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-seven-checkpoints'
import {DAY_SIX_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-six-checkpoints'
import {DAY_FIVE_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-five-checkpoints'
import {DAY_FOUR_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-four-checkpoints'
import {DAY_TWO_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-two-checkpoints'
import MangaAvatar from '@/components/avatar/Avatar'
import {foundationRole} from '@/lib/interactive-assignments/foundations/groups'
import {watchFoundation} from '@/lib/interactive-assignments/foundations/notifications'
import s from './Foundation.module.css'

type Action='create'|'join'|'start'|'share'|'reply'|'reflect'|'makeup'|'preview-approve'
type ExchangeContext={
 definitions:readonly Checkpoint[]; pair:FoundationPair|null; preview:boolean; readOnly:boolean; busy:boolean; loaded:boolean; error:string
 drafts:Record<string,string>; draft:(key:string,value:string)=>void
 load:()=>Promise<boolean>; act:(action:Action,text?:string,checkpoint?:CheckpointId)=>Promise<void>
}
const Context=createContext<ExchangeContext|null>(null)
export function useFoundationMakeup(){const pair=useContext(Context)?.pair;return !!(pair?.makeup&&pair.approved)}
const previewWriting={
 evidence:{contribution:'Approaching Earth does not establish a collision. We still need the direction and repeated positions to estimate a path.',reply:'Your labeled cart values are evidence for that classroom model. They do not measure the fictional asteroid’s path.'},
 model:{contribution:'The cart gains 2 m each second. I predict 6 m only if that same motion continues.',reply:'Your two causes need different checks. An independent position and time measurement could test whether the 5 m reading is reliable.'},
 questions:{contribution:'Where will it be tomorrow? Repeated positions and their times could help estimate velocity, including direction. Choosing a response also involves human priorities.',reply:'Adding a specific time makes your question easier to investigate. State how the position measurements will help estimate the path.'},
}
export function FoundationCollaboration({id,enabled,foundation='day-one',preview=false,readOnly=false,children}:{id:string;enabled:boolean;foundation?:FoundationKey;preview?:boolean;readOnly?:boolean;children:ReactNode}){
 const definitions=getFoundationCheckpoints(foundation),peerWriting=foundation==='day-nine'?DAY_NINE_PREVIEW_WRITING:foundation==='day-eight'?DAY_EIGHT_PREVIEW_WRITING:foundation==='day-seven'?DAY_SEVEN_PREVIEW_WRITING:foundation==='day-six'?DAY_SIX_PREVIEW_WRITING:foundation==='day-five'?DAY_FIVE_PREVIEW_WRITING:foundation==='day-four'?DAY_FOUR_PREVIEW_WRITING:foundation==='day-three'?DAY_THREE_PREVIEW_WRITING:foundation==='day-two'?DAY_TWO_PREVIEW_WRITING:previewWriting
 const [pair,setPair]=useState<FoundationPair|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(preview),[drafts,setDrafts]=useState<Record<string,string>>({})
 const pending=useRef(false),request=useRef(0)
 const load=useCallback(async()=>{
  if(preview||!enabled)return true
  const revision=++request.current
  try{
   const r=await fetch(`/api/interactive-assignments/${id}/partner`,{cache:'no-store'}),d=await r.json()
   if(!r.ok)throw Error(d.error||'Could not check partner updates. Try again.')
   if(revision===request.current){setPair(d.pair);setLoaded(true);setError('')}
   return true
  }catch(e){if(revision===request.current)setError((e as Error).message);return false}
 },[id,preview,enabled])
 const invalidate=useCallback(()=>{request.current++},[])
 useEffect(()=>{void load();return invalidate},[load,invalidate])
 const connection=pair?.realtime
 useEffect(()=>{
  if(!enabled||preview||readOnly||!pair||pair.complete||(pair.makeup&&pair.approved))return
  return watchFoundation(connection,load)
 },[enabled,preview,readOnly,!!pair,pair?.complete,pair?.makeup,pair?.approved,connection?.url,connection?.key,connection?.topic,load]) // eslint-disable-line react-hooks/exhaustive-deps
 const hasDrafts=!preview&&Object.values(drafts).some(v=>v.trim())
 useEffect(()=>{
  if(!hasDrafts)return
  const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=''}
  window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)
 },[hasDrafts])
 async function act(action:Action,text='',checkpoint?:CheckpointId){
  if(pending.current||readOnly||(action==='preview-approve'&&!preview))return
  pending.current=true;request.current++;setBusy(true);setError('')
  try{
   if(preview){
    setPair(current=>{
     if(action==='makeup')return {code:'',slot:1,peerJoined:false,peerName:null,makeup:true,approved:false,flaggedAt:new Date().toISOString(),complete:false,checkpoints:definitions.map(c=>({id:c.id,own:emptyCheckpointWriting(),peer:null,peerShared:false,complete:false,available:false}))}
     if(action==='preview-approve')return current?{...current,approved:true,checkpoints:current.checkpoints.map((c,i)=>({...c,available:i===0}))}:current
     if(action==='create'||action==='join')return current??{code:'PREVIEW',slot:1,protocolVersion:3,started:false,peerJoined:true,peerName:'Blair (preview)',members:['You (preview)','Blair (preview)','Avery (preview)','Sam (preview)'].slice(0,Number(text)||4).map((name,i)=>({slot:i+1,name,isYou:i===0,independent:null,avatar:{traits:{hair_style:['short','curls','ponytail','fade'][i],hair_color:['brown','black','auburn','black'][i],skin:['light','brown','olive','deep'][i]},equipped:{}}})),complete:false,checkpoints:definitions.map(c=>({id:c.id,own:emptyCheckpointWriting(),peer:null,peers:[],peerShared:false,complete:false,available:false}))}
     if(action==='start')return current?{...current,started:true,checkpoints:current.checkpoints.map((c,i)=>({...c,available:i===0}))}:current
     if(!current||!checkpoint)return current
     let available=true
     const checkpoints=current.checkpoints.map(c=>{
      const next=c.id===checkpoint?{...c,own:{...c.own,...(action==='share'?{contribution:text}:action==='reply'?{reply:text}:{reflection:text})},peer:current.makeup?null:{...peerWriting[checkpoint],reply:action==='share'?null:peerWriting[checkpoint].reply},peerShared:!current.makeup,complete:action==='reflect'}:{...c}
      if(!current.makeup&&c.id===checkpoint){
       next.peers=(current.members??[]).filter(m=>!m.isYou).map(m=>({slot:m.slot,name:m.name,contribution:peerWriting[checkpoint].contribution,reply:action==='share'?null:peerWriting[checkpoint].reply,replyToSlot:m.slot===(current.members?.length??2)?1:m.slot+1}))
       next.replyToSlot=2;next.sharedCount=current.members?.length??2;next.repliedCount=action==='share'?0:current.members?.length??2
      }
      next.available=available;available=available&&next.complete;return next
     })
     return {...current,checkpoints,complete:checkpoints.every(c=>c.complete)}
    })
   }else{
    const r=await fetch(`/api/interactive-assignments/${id}/partner`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,text,checkpoint})}),d=await r.json()
    if(!r.ok)throw Error(d.error||'Your response could not be saved. Try again.')
    if(!await load()){setError('Your response was saved, but the latest view could not load. Check saved work or partner updates to continue.');return}
   }
   if(checkpoint)setDrafts(values=>({...values,[checkpoint+'-'+action]:''}))
  }catch(e){setError((e as Error).message)}finally{pending.current=false;setBusy(false)}
 }
 return <Context.Provider value={{definitions,pair,preview,readOnly,busy,loaded,error,drafts,draft:(key,value)=>setDrafts(values=>({...values,[key]:value})),load,act}}>{children}</Context.Provider>
}
function SavedWriting({title,text}:{title:string;text:string}){
 return <div className={s.peer}><strong>{title}</strong><p>{text}</p></div>
}
function ResponseField({checkpoint,action,label,prompt,button}:{checkpoint:CheckpointId;action:'share'|'reply'|'reflect';label:string;prompt?:string;button:string}){
 const context=useContext(Context)!
 const key=checkpoint+'-'+action,value=context.drafts[key]??''
 return <><label>{label}{prompt&&<span className={s.status}>{prompt}</span>}<textarea maxLength={4000} value={value} disabled={context.busy||context.readOnly} onChange={e=>context.draft(key,e.target.value)}/></label><button disabled={context.busy||context.readOnly||value.trim().length<10} onClick={()=>void context.act(action,value,checkpoint)}>{context.busy?'Saving…':button}</button><small>Save when ready. Your original writing stays recorded; develop it in the next response.</small></>
}
function GroupMembers({index}:{index:number}){
 const {pair}=useContext(Context)!
 if(!pair?.members)return null
 const active=pair.members.filter(m=>m.independent!=='approved')
 return <div className={s.groupMembers}>{pair.members.map(m=>{
  const rank=active.findIndex(a=>a.slot===m.slot),role=rank>=0?foundationRole(rank,active.length,index):null
  return <article key={m.slot} className={`${s.memberCard} ${m.isYou?s.you:''}`}>
   <MangaAvatar traits={m.avatar.traits} equipped={m.avatar.equipped} items={pair.items??[]} size={72} crop="portrait"/>
   <div><strong>{m.name}{m.isYou?' · You':''}</strong>{role&&<><span className={s.roleTag}>{role.primary?'Primary role':'Secondary duty'} · {role.title}</span><small>{role.description}</small>{role.secondary&&<small>Secondary duty: {role.secondary}</small>}</>}{m.independent&&<small>{m.independent==='pending'?'Requested independent work · awaiting approval':'Approved to work independently'}</small>}</div>
  </article>
 })}</div>
}
export function FoundationGroupLobby(){
 const context=useContext(Context),[code,setCode]=useState(''),[size,setSize]=useState('4')
 if(!context)return null
 const {pair,preview,readOnly,busy,loaded,error,act,load}=context
 const index=Math.max(0,pair?.checkpoints.findIndex(c=>!c.complete)??0)
 return <section className={s.exchange} aria-label="Your lesson group">
  <p className={s.status}>In-class discussion · Your own answers stay in your account</p><h2>{pair?.makeup?'Independent-work request':pair?.started?'Working together':'Work with your group'}</h2>
  {preview&&<p className={s.status}>Teacher preview · classmates are fictional and nothing is saved.</p>}
  {error&&<p role="alert" className={s.error}>{error}</p>}
  {!loaded&&!error&&<p role="status">Loading your saved group…</p>}
  {!pair&&loaded&&!readOnly&&<><p>Work with the classmates at your table. One person creates a code; the others join from their own accounts. Groups can have two, three, or four students.</p><div className={s.groupSetup}><div>{preview&&<label>Preview group size<select value={size} onChange={e=>setSize(e.target.value)}><option value="2">2 students</option><option value="3">3 students</option><option value="4">4 students</option></select></label>}<button disabled={busy} onClick={()=>void act('create',preview?size:'')}>Create a group code</button></div><div><label>Join your classmates<input value={code} maxLength={10} autoComplete="off" autoCapitalize="characters" placeholder="Enter their group code" onChange={e=>setCode(e.target.value.toUpperCase())}/></label><button disabled={busy||!code.trim()} onClick={()=>void act('join',preview?size:code)}>Join group</button></div></div></>}
  {pair&&!pair.makeup&&<>
   <div className={s.groupHeading}><p><strong>{pair.members?.length??2} {(pair.members?.length??2)===1?'student':'students'}</strong> · {pair.started?'Group started':'Share this code'} <span className={s.code}>{pair.code}</span></p>{!pair.started&&<button disabled={busy||readOnly||(pair.members?.length??0)<2} onClick={()=>void act('start')}>Start with {pair.members?.length??1} {(pair.members?.length??1)===1?'student':'students'}</button>}</div>
   {!pair.started&&<p className={s.status}>Wait until everyone at your table appears below. Starting closes joining for this lesson.</p>}
   {pair.protocolVersion===2&&<p className={s.status}>Your existing pair and saved writing are preserved. Continue from where you left off.</p>}
   <GroupMembers index={index}/><p className={s.status}>Roles rotate at each discussion. The scribe works at the whiteboard; everyone writes and submits their own answers.</p>
  </>}
  {pair?.makeup&&<><p role="status">{pair.approved?'Your teacher approved independent alternatives.':'Your request is saved and waiting for teacher approval.'}</p><p>Continue with the slides and your individual questions. Any earlier group writing is preserved.</p>{preview&&!pair.approved&&<button onClick={()=>void act('preview-approve')}>Preview teacher approval</button>}</>}
  {!pair?.makeup&&!readOnly&&<details className={s.makeup}><summary>Need to work on your own?</summary><p>Request your teacher’s approval for independent alternatives. Your individual questions remain available while you wait, and your saved work is kept.</p><button disabled={busy} onClick={()=>void act('makeup')}>Request to work on my own</button></details>}
  {!preview&&<button disabled={busy} onClick={()=>void load()}>Check {pair?.makeup?'request status':'group updates'}</button>}
 </section>
}
export default function FoundationExchange({index}:{index:number}){
 const context=useContext(Context)
 if(!context)return null
 const {pair}=context,definition=context.definitions[index],stop=pair?.checkpoints[index]
 if(!definition)return null
 const active=pair?.members?.filter(m=>m.independent!=='approved')??[]
 const rank=active.findIndex(m=>m.isYou),role=foundationRole(Math.max(0,rank),Math.max(2,active.length),index)
 const caseIndex=((pair?.slot??1)-1)%2
 const target=pair?.members?.find(m=>m.slot===stop?.replyToSlot)
 const count=active.length||2
 return <section className={s.exchange} aria-label={`${pair?.makeup?'Independent':'Group'} stop ${index+1}: ${definition.title}`}>
  <p className={s.status}>{pair?.makeup?'Independent':'Group'} stop {index+1} of 3 · After your own responses</p><h2>{definition.title}</h2>
  {context.error&&stop?.available&&<p role="alert" className={s.error}>{context.error}</p>}
  {!pair&&<p>Create or join your group at the top of the lesson. Your individual answers save separately.</p>}
  {pair?.makeup&&stop?<>
   {!pair.approved?<p>Your request is waiting for teacher approval. Continue with the slides and individual questions.</p>:!stop.available?<p>Finish the earlier independent stop first.</p>:<>
    <p>{definition.solo.idea}</p>
    {stop.own.contribution?<SavedWriting title="Your original idea" text={stop.own.contribution}/>:<ResponseField checkpoint={definition.id} action="share" label="Your own idea" button="Save my idea"/>}
    {stop.own.contribution&&<><SavedWriting title="Example to critique · not a classmate’s work" text={definition.solo.example}/>{stop.own.reply?<SavedWriting title="Your critique" text={stop.own.reply}/>:<ResponseField checkpoint={definition.id} action="reply" label="Your critique of the example" prompt={definition.solo.critique} button="Save my critique"/>}</>}
    {stop.own.reply&&(stop.own.reflection?<SavedWriting title="Your private reflection · saved for your teacher" text={stop.own.reflection}/>:<ResponseField checkpoint={definition.id} action="reflect" label="Your own reflection" prompt={definition.solo.reflection} button="Save my reflection"/>)}
   </>}
  </>:pair&&stop&&<>
   {!pair.started?<p>Start the group at the top of the lesson once everyone has joined.</p>:!stop.available?<p>Finish the earlier discussion and your own reflection first. The slides and individual questions remain available.</p>:<>
    <div className={s.duty}><strong>Your {role.primary?'primary role':'secondary duty'}: {role.title}</strong><p>{role.description}{role.secondary?` Also help as ${role.secondary.toLowerCase()}.`:''}</p></div>
    <p><strong>Your starting question · {definition.roles[caseIndex]}</strong></p><p>{definition.prompts[caseIndex]}</p>
    {stop.own.contribution?<SavedWriting title="Your shared idea" text={stop.own.contribution}/>:<ResponseField checkpoint={definition.id} action="share" label="Your idea before comparing" prompt="Explain your own reasoning. Classmates’ ideas appear after everyone shares." button="Share my idea"/>}
    {stop.own.contribution&&((stop.peers?.length??0)>0?<>
     {stop.peers!.map(p=><SavedWriting key={p.slot} title={`${p.name} · shared idea`} text={p.contribution??''}/>)}
     <h3>Talk it through at the whiteboard</h3><p>{definition.discuss}</p><p>Let everyone explain. The scribe shows the group’s reasoning at the board; then each person writes their own response.</p>
     {stop.own.reply?<SavedWriting title="Your response" text={stop.own.reply}/>:<ResponseField checkpoint={definition.id} action="reply" label={`Respond to ${target?.name??'your classmate'}`} prompt={definition.reply} button="Save my response"/>}
     {stop.peers!.filter(p=>p.reply).map(p=><SavedWriting key={p.slot} title={`${p.name} · response${p.replyToSlot?` to ${pair.members?.find(m=>m.slot===p.replyToSlot)?.name??'a classmate'}`:''}`} text={p.reply!}/>)}
     {stop.own.reply&&(stop.repliedCount??0)===count&&(stop.own.reflection?<SavedWriting title="Your private reflection · saved for your teacher" text={stop.own.reflection}/>:<ResponseField checkpoint={definition.id} action="reflect" label="Your own reflection" prompt={definition.reflection+' This stays private to you and your teacher.'} button="Save my reflection"/>)}
    </>:<p>Your idea is saved. Waiting for everyone to share before comparing.</p>)}
    <p role="status">{stop.complete?'Discussion and your private reflection saved. Continue with your own work.':`${stop.sharedCount??0} of ${count} ideas shared · ${stop.repliedCount??0} of ${count} responses saved`}</p>
    {pair.peerIndependent&&<p className={s.status}>{pair.protocolVersion===2?'Your partner has requested independent work. If you are also working alone, request approval at the top of the lesson.':'A classmate has requested independent work. Approved students keep their earlier writing but no longer hold up new group responses. If only one student remains, request approval to work on your own.'}</p>}
   </>}
  </>}
 </section>
}
export function FoundationCollaborationStatus(){
 const context=useContext(Context)
 if(!context)return null
 if(context.pair?.makeup&&!context.pair.approved)return <p role="status">Independent-work request waiting for teacher approval. Your individual answers remain saved separately.</p>
 return <p role="status">{context.pair?.complete?'All three discussions and your own reflections are saved.':`${context.pair?.checkpoints.filter(c=>c.complete).length??0} of 3 discussion stops complete. Save your own reasoning and reflection at each stop before submitting.`}</p>
}
export function FoundationExchangeEvidence({value,foundation='day-one'}:{value:unknown;foundation?:FoundationKey}){
 const exchange=foundationExchangeEvidence(value,foundation)
 if(!exchange)return null
 return <section className={s.exchange} aria-label="Submitted collaboration evidence"><h2>{exchange.mode==='independent'?'Independent make-up work':'Submitted collaboration'}</h2><p>Each response belongs to this student. Classmates’ shared writing is context; private reflections belong only to this student. Participation alone does not establish mastery.</p>{exchange.checkpoints.map(c=><section key={c.id} className={s.evidenceStop}><h3>{c.title}</h3><SavedWriting title="Student’s original idea" text={c.own.contribution}/>{c.peer&&<SavedWriting title="Partner’s shared idea · context" text={c.peer.contribution}/>} {c.peers?.map(p=><SavedWriting key={p.slot} title={`Classmate ${p.slot} · shared idea · context`} text={p.contribution}/>)}{c.example&&<SavedWriting title="Provided example · context" text={c.example}/>}<SavedWriting title={exchange.mode==='independent'?'Student’s example critique':`Student’s response${c.replyToSlot?` to classmate ${c.replyToSlot}`:''}`} text={c.own.reply}/>{c.peer&&<SavedWriting title="Partner’s response · context" text={c.peer.reply}/>} {c.peers?.map(p=><SavedWriting key={p.slot} title={`Classmate ${p.slot} · response · context`} text={p.reply}/>)}{c.own.reflection&&<SavedWriting title="Student’s private reflection" text={c.own.reflection}/>}</section>)}</section>
}
