'use client'
import FoundationNoteExample from './FoundationNoteExample'
import {takeawayText,takeawayCopy,stopSteps} from '@/lib/interactive-assignments/foundations/takeaways'
import {FOUNDATION_SUBMISSION_GATES_PAUSED,FOUNDATION_SUBMISSION_PAUSED_NOTICE} from '@/lib/interactive-assignments/foundations/recovery'

import {cpaCheckpoints,cpaDiscussionSupport} from '@/lib/interactive-assignments/foundations/cpa-discussions'
import {foundationRequest} from '@/lib/interactive-assignments/foundations/request'
import {useDiscussionDrafts} from './useDiscussionDrafts'
import type {DraftConflicts} from '@/lib/interactive-assignments/foundations/draft-merge'
import {DAY_SEVEN_RECOVERY_ASSIGNMENT,DAY_SEVEN_RECOVERY_NOTICE} from '@/lib/interactive-assignments/foundations/recovery'
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react'
import {getFoundationCheckpoints,emptyCheckpointWriting,type CheckpointId,type FoundationPair,type FoundationKey,type Checkpoint} from '@/lib/interactive-assignments/foundations/checkpoints'
import {foundationExchangeEvidence} from '@/lib/interactive-assignments/foundations/evidence'
import {DAY_THREE_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-three-checkpoints'
import {DAY_SIXTEEN_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-sixteen-checkpoints'
import {DAY_FIFTEEN_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-fifteen-checkpoints'
import {DAY_FOURTEEN_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-fourteen-checkpoints'
import {DAY_THIRTEEN_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-thirteen-checkpoints'
import {DAY_TWELVE_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-twelve-checkpoints'
import {DAY_ELEVEN_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-eleven-checkpoints'
import {DAY_TEN_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-ten-checkpoints'
import {DAY_NINE_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-nine-checkpoints'
import {DAY_EIGHT_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-eight-checkpoints'
import {DAY_SEVEN_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-seven-checkpoints'
import {DAY_SIX_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-six-checkpoints'
import {DAY_FIVE_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-five-checkpoints'
import {DAY_FOUR_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-four-checkpoints'
import {DAY_TWO_PREVIEW_WRITING} from '@/lib/interactive-assignments/foundations/day-two-checkpoints'
import {useFoundationLanguage} from './FoundationLanguage'
import QuizContent from '@/components/quizzes/QuizContent'
import MangaAvatar from '@/components/avatar/Avatar'
import FoundationAvatarBoundary from './FoundationAvatarBoundary'
import {foundationRole,participatingMembers} from '@/lib/interactive-assignments/foundations/groups'
import {discussionCopy as copy} from '@/lib/interactive-assignments/foundations/discussion-copy'
import {watchFoundation} from '@/lib/interactive-assignments/foundations/notifications'
import s from './Foundation.module.css'

type Action='create'|'join'|'start'|'leave'|'share'|'compare'|'reply'|'reflect'|'makeup'|'preview-approve'|'requestSwitch'|'cancelSwitch'|'preview-switch'
export type FoundationSaveHandle={save:()=>Promise<boolean>;prepare:()=>Promise<{ok:boolean;message?:string}>}
type ExchangeContext={
 archived:boolean;
 draftConflicts:DraftConflicts;resolveDraft:(key:string,choice:'local'|'remote')=>void;draftReady:boolean;draftStatus:string;draftError:string;retryDrafts:()=>void;saveDrafts:()=>Promise<boolean>;earlierGroupWriting:Record<string,Record<string,string>>; recovery:boolean; definitions:readonly Checkpoint[]; pair:FoundationPair|null; preview:boolean; readOnly:boolean; busy:boolean; loaded:boolean; error:string
 drafts:Record<string,string>; draft:(key:string,value:string)=>void; setupIdeas:string[]
 load:()=>Promise<boolean>; act:(action:Action,text?:string,checkpoint?:CheckpointId)=>Promise<void>
}
const Context=createContext<ExchangeContext|null>(null)
export function useFoundationMakeup(){const pair=useContext(Context)?.pair;return !!(pair?.makeup&&pair.approved)}
const previewWriting={
 evidence:{contribution:'Approaching Earth does not establish a collision. We still need the direction and repeated positions to estimate a path.',reply:"Your labeled cart values support the cart prediction. They do not measure the fictional asteroid’s path."},
 model:{contribution:'The cart gains 2 m each second. I predict 6 m only if that same motion continues.',reply:'Your two causes need different checks. An independent position and time measurement could test whether the 5 m reading is reliable.'},
 questions:{contribution:'Where will it be tomorrow? Repeated positions and their times could help estimate velocity, including direction. Choosing a response also involves human priorities.',reply:'Adding a specific time makes your question easier to investigate. State how the position measurements will help estimate the path.'},
}
const CpaContext=createContext<FoundationKey|null>(null)
export const useFoundationCpa=()=>useContext(CpaContext)
function CpaDiscussionHelp({index}:{index:number}){const foundation=useFoundationCpa(),{t}=useFoundationLanguage();if(!foundation)return null;const s=cpaDiscussionSupport(foundation,index);return <aside aria-label="CPA"><QuizContent content={[s.math?t(s.math):'',t(s.idea)].filter(Boolean).join('\n\n')} questionEmphasis/></aside>}
export function FoundationCollaboration({id,enabled,foundation='day-one',preview=false,readOnly=false,saveHandle,cpa=false,archived=false,children}:{id:string;enabled:boolean;foundation?:FoundationKey;preview?:boolean;readOnly?:boolean;saveHandle?:{current:FoundationSaveHandle|null};cpa?:boolean;archived?:boolean;children:ReactNode}){
 const definitions=cpa?cpaCheckpoints(foundation):getFoundationCheckpoints(foundation),peerWriting=foundation==='day-sixteen'?DAY_SIXTEEN_PREVIEW_WRITING:foundation==='day-fifteen'?DAY_FIFTEEN_PREVIEW_WRITING:foundation==='day-fourteen'?DAY_FOURTEEN_PREVIEW_WRITING:foundation==='day-thirteen'?DAY_THIRTEEN_PREVIEW_WRITING:foundation==='day-twelve'?DAY_TWELVE_PREVIEW_WRITING:foundation==='day-eleven'?DAY_ELEVEN_PREVIEW_WRITING:foundation==='day-ten'?DAY_TEN_PREVIEW_WRITING:foundation==='day-nine'?DAY_NINE_PREVIEW_WRITING:foundation==='day-eight'?DAY_EIGHT_PREVIEW_WRITING:foundation==='day-seven'?DAY_SEVEN_PREVIEW_WRITING:foundation==='day-six'?DAY_SIX_PREVIEW_WRITING:foundation==='day-five'?DAY_FIVE_PREVIEW_WRITING:foundation==='day-four'?DAY_FOUR_PREVIEW_WRITING:foundation==='day-three'?DAY_THREE_PREVIEW_WRITING:foundation==='day-two'?DAY_TWO_PREVIEW_WRITING:previewWriting
 const [pair,setPair]=useState<FoundationPair|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(preview)
 const privateDrafts=useDiscussionDrafts(id,enabled,preview,pair?.makeup?'independent':'group')
 const {drafts,draft}=privateDrafts
 const [earlierGroupWriting,setEarlierGroupWriting]=useState<Record<string,Record<string,string>>>({})
 const pairRef=useRef(pair);pairRef.current=pair
 const pending=useRef(false),request=useRef(0)
 const [setupIdeas,setSetupIdeas]=useState<string[]>([])
 const load=useCallback(async()=>{
  if(preview||!enabled)return true
  const revision=++request.current
  try{
   const r=await foundationRequest(`/api/interactive-assignments/${id}/partner`,{cache:'no-store'}),d=await r.json()
   if(!r.ok)throw Error(d.error||'Could not check partner updates. Try again.')
   if(revision===request.current){pairRef.current=d.pair;setPair(d.pair);setSetupIdeas(d.setupIdeas??[]);setEarlierGroupWriting(d.earlierGroupWriting??{});setLoaded(true)}
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
 if(saveHandle)saveHandle.current={save:privateDrafts.flush,prepare:async()=>{
  if(!await privateDrafts.flush())return {ok:false,message:'Your discussion drafts need attention. Keep this page open and retry saving them.'}
  if(pending.current)return {ok:false,message:'Wait for your discussion response to finish saving, then submit again.'}
  if(FOUNDATION_SUBMISSION_GATES_PAUSED)return {ok:true}
  if(!await load())return {ok:false,message:'Could not check discussion progress. Your saved answers are safe; try again.'}
  if(id===DAY_SEVEN_RECOVERY_ASSIGNMENT)return {ok:true}
  const current=pairRef.current
  if(current?.complete)return {ok:true}
  const first=current?.checkpoints.findIndex(c=>!c.complete)??0
  document.getElementById('foundation-stop-'+(first+1))?.closest<HTMLDetailsElement>('details[data-foundation-part]')?.setAttribute('open','')
  return {ok:false,message:current?.makeup&&!current.approved?'Your independent-work request is waiting for teacher approval.':!current?'Create or join your real group, or request approval to work on your own.':!current.makeup&&!current.started?'Join your real classmates and start the group, or request approval to work on your own.':'Finish discussion stop '+(first+1)+': share your idea, save your comparison, and save your reflection. Your private drafts are saved.'}
 }}
 async function act(action:Action,text='',checkpoint?:CheckpointId){
  if(pending.current||readOnly||(action==='preview-approve'&&!preview))return
  pending.current=true;request.current++;setBusy(true);setError('')
  try{
   if(preview){
    if(action==='leave'){
     const idea=pair?.checkpoints[0]?.own.contribution
     if(idea)setSetupIdeas(previous=>[idea,...previous.filter(text=>text!==idea)])
     setPair(null)
     return
    }
    setPair(current=>{
     if(action==='requestSwitch')return current?{...current,tableSwitch:{id:'preview',destination_code:text,status:'pending'}}:current
     if(action==='cancelSwitch')return current?{...current,tableSwitch:null}:current
     if(action==='preview-switch'&&current?.tableSwitch){
      const partial=current.checkpoints.some(c=>c.own.contribution&&!c.complete)
      return {...current,...(!partial?{code:current.tableSwitch.destination_code}:{}),tableSwitch:{...current.tableSwitch,status:partial?'reserved':'moved'},checkpoints:current.checkpoints.map(c=>({...c,previousTable:c.complete&&!partial}))}
     }
     if(action==='makeup')return {code:'',slot:1,peerJoined:false,peerName:null,makeup:true,approved:false,flaggedAt:new Date().toISOString(),complete:false,checkpoints:definitions.map(c=>({id:c.id,own:emptyCheckpointWriting(),peer:null,peerShared:false,complete:false,available:false}))}
     if(action==='preview-approve')return current?{...current,approved:true,checkpoints:current.checkpoints.map((c,i)=>({...c,available:i===0}))}:current
     if(action==='create'||action==='join')return current??{code:'PREVIEW',slot:1,protocolVersion:3,individualPace:true,started:false,peerJoined:Number(text)>1,peerName:Number(text)>1?'Blair (preview)':null,members:['You (preview)','Blair (preview)','Avery (preview)','Sam (preview)'].slice(0,Number(text)||4).map((name,i)=>({slot:i+1,name,isYou:i===0,independent:null,avatar:{traits:{hair_style:['short','curls','ponytail','fade'][i],hair_color:['brown','black','auburn','black'][i],skin:['light','brown','olive','deep'][i]},equipped:{}}})),complete:false,checkpoints:definitions.map((c,i)=>({id:c.id,own:emptyCheckpointWriting(),peer:null,peers:[],peerShared:false,complete:false,available:i===0}))}
     if(action==='start')return current?{...current,started:true,checkpoints:current.checkpoints.map((c,i)=>({...c,available:i===0}))}:current
     if(current?.individualPace&&action==='compare')return {...current,checkpoints:current.checkpoints.map(c=>c.id===checkpoint?{...c,replyToSlot:text==='example'?null:Number(text),exampleSelected:text==='example'}:c)}
     if(!current||!checkpoint)return current
     let available=true
     const checkpoints=current.checkpoints.map(c=>{
      const next=c.id===checkpoint?{...c,own:{...c.own,...(action==='share'?{contribution:text}:action==='reply'?{reply:text}:{reflection:text})},peer:current.makeup?null:{...peerWriting[checkpoint],reply:action==='share'?null:peerWriting[checkpoint].reply},peerShared:!current.makeup,complete:action==='reflect'}:{...c}
      if(!current.makeup&&c.id===checkpoint){
       next.peers=(current.members??[]).filter(m=>!m.isYou).map(m=>({slot:m.slot,name:m.name,contribution:peerWriting[checkpoint].contribution,reply:action==='share'?null:peerWriting[checkpoint].reply,replyToSlot:m.slot===(current.members?.length??2)?1:m.slot+1}))
       next.replyToSlot=current.individualPace?c.replyToSlot:2;next.sharedCount=current.members?.length??2;next.repliedCount=action==='share'?0:current.members?.length??2
      }
      next.available=available;available=available&&next.complete;return next
     })
     if(action==='reflect'&&current.tableSwitch?.status==='reserved')return {...current,code:current.tableSwitch.destination_code,tableSwitch:{...current.tableSwitch,status:'moved'},checkpoints:checkpoints.map(c=>({...c,previousTable:c.complete})),complete:checkpoints.every(c=>c.complete)}
     return {...current,checkpoints,complete:checkpoints.every(c=>c.complete)}
    })
   }else{
    if(!await privateDrafts.flush())throw Error('Save your private discussion drafts before sharing. Your text is still here.')
    const r=await foundationRequest(`/api/interactive-assignments/${id}/partner`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,text,checkpoint,code:pair?.code,mode:pair?.makeup?'independent':'group'})}),d=await r.json()
    if(!r.ok)throw Error(d.error||'Your response could not be saved. Try again.')
    if(!await load()){setError('Your response was saved, but the latest view could not load. Check saved work or partner updates to continue.');return}
   }
   if(checkpoint&&['share','reply','reflect'].includes(action))draft(checkpoint+'-'+action,'')
  }catch(e){
   // A classmate may share while the example button is visible. Refresh the
   // choices without discarding drafts or changing the student's comparison.
   if(!preview)await load()
   setError((e as Error).message)
  }finally{pending.current=false;setBusy(false)}
 }
 return <CpaContext.Provider value={cpa?foundation:null}><Context.Provider value={{archived,recovery:id===DAY_SEVEN_RECOVERY_ASSIGNMENT,definitions,pair,preview,readOnly,busy,loaded,error,draftConflicts:privateDrafts.conflicts,resolveDraft:privateDrafts.resolve,draftReady:privateDrafts.ready,draftStatus:privateDrafts.status,draftError:privateDrafts.error,retryDrafts:privateDrafts.retry,saveDrafts:privateDrafts.flush,earlierGroupWriting,drafts,setupIdeas,draft,load,act}}>{children}</Context.Provider></CpaContext.Provider>
}
function SavedWriting({title,text,authored=false}:{title:string;text:string;authored?:boolean}){
 const {t}=useFoundationLanguage()
 return <div className={s.peer}><strong>{t(title)}</strong>{authored?<QuizContent content={text} questionEmphasis/>:<p translate="no">{text}</p>}</div>
}
function DraftRecovery({field}:{field?:string}){
 const context=useContext(Context)!,{t}=useFoundationLanguage()
 return <>{Object.entries(context.draftConflicts).filter(([key])=>!field||key===(context.pair?.makeup?'independent:':'group:')+field).map(([key,versions])=><aside key={key} role="alert" className={s.error}>
 <strong>{t('Two versions of this answer')}</strong><p>{t(key.startsWith('independent:')?'Independent stop':'Group stop')} {({evidence:1,model:2,questions:3} as Record<string,number>)[key.split(':')[1]?.split('-')[0]]} · {t(key.endsWith('-share')?'Your idea':key.endsWith('-reply')?'Your response':'Your own reflection')}</p>
 <SavedWriting title={t('Your text in this tab')} text={versions.local}/><SavedWriting title={t('Saved text from another tab')} text={versions.remote}/>
 <p>{t('Compare both versions. Copy any wording you want to combine before choosing.')}</p>
 <button disabled={context.busy||context.readOnly} onClick={()=>context.resolveDraft(key,'local')}>{t('Keep my text')}</button>{' '}
 <button disabled={context.busy||context.readOnly} onClick={()=>context.resolveDraft(key,'remote')}>{t('Use the other saved text')}</button>
 </aside>)}</>
}
function ResponseField({checkpoint,action,label,prompt,button}:{checkpoint:CheckpointId;action:'share'|'reply'|'reflect';label:string;prompt?:string;button:string}){
 const context=useContext(Context)!
 const {t}=useFoundationLanguage()
 const key=checkpoint+'-'+action,value=context.drafts[key]??''
 const {locale}=useFoundationLanguage()
 const hint=locale==='es'?'Escribe al menos 10 caracteres para compartir. El borrador se guarda en privado.':locale==='pt-BR'?'Escreva pelo menos 10 caracteres para compartilhar. O rascunho é salvo em privado.':'Write at least 10 characters to share or save this step. Your draft autosaves privately.'
 return <><div className={s.responseField}><label htmlFor={key}>{t(label)}</label>{prompt&&<div id={key+"-prompt"} className={s.status}><QuizContent content={t(prompt)} questionEmphasis/></div>}<textarea translate="no" id={key} aria-describedby={[prompt?key+"-prompt":null,key+"-hint"].filter(Boolean).join(" ")} maxLength={4000} value={value} disabled={context.busy||context.readOnly||!context.draftReady} onChange={e=>context.draft(key,e.target.value)}/><small id={key+"-hint"}>{hint}</small><p role="status">{context.draftStatus}</p>{context.draftError&&<p role="alert" className={s.error}>{t(context.draftError)}</p>}<DraftRecovery field={key}/></div><button disabled={context.busy||context.readOnly||!context.draftReady||value.trim().length<10} onClick={()=>void context.act(action,value,checkpoint)}>{t(context.busy?t("Saving…"):button)}</button><small>{t("Save when ready. Your original writing stays recorded; develop it in the next response.")}</small></>
}
function GroupMembers({index}:{index:number}){
 const {t}=useFoundationLanguage()
 const {pair}=useContext(Context)!
 if(!pair?.members)return null
 const active=participatingMembers(pair.members,pair.individualPace)
 return <div className={s.groupMembers}>{pair.members.map(m=>{
  const rank=active.findIndex(a=>a.slot===m.slot),role=rank>=0?foundationRole(rank,active.length,index):null
  return <article key={m.slot} className={`${s.memberCard} ${m.isYou?s.you:''}`}>
   <FoundationAvatarBoundary><MangaAvatar traits={m.avatar.traits} equipped={m.avatar.equipped} items={pair.items??[]} size={72} crop="portrait"/></FoundationAvatarBoundary>
   <div><strong>{m.name}{m.isYou?t(" · You"):''}</strong>{role&&<><span className={s.roleTag}>{t(role.primary?t("Primary role"):t("Secondary duty"))} · {t(role.title)}</span><small>{t(role.description)}</small>{role.secondary&&<small>{t("Secondary duty:")} {' '} {t(role.secondary)}</small>}</>}{m.independent&&<small>{m.independent==='pending'?t("Requested independent work · awaiting approval"):t("Approved to work independently")}</small>}</div>
  </article>
 })}</div>
}
function TableSwitchControl({pair}:{pair:FoundationPair}){
 const {t}=useFoundationLanguage(),{act,busy,preview,readOnly}=useContext(Context)!
 const [code,setCode]=useState('')
 const request=pair.tableSwitch,open=request?.status==='pending'||request?.status==='reserved'
 const messages={pending:copy.switchPending,reserved:copy.switchReserved,moved:copy.switchMoved,declined:copy.switchDeclined,unavailable:copy.switchUnavailable,canceled:null}
 const message=request&&messages[request.status]
 return <div>
  {message&&<p role="status">{t(message[0])} <strong>{request.destination_code}</strong></p>}
  {open?<><button disabled={busy||readOnly} onClick={()=>void act('cancelSwitch',request.id)}>{t(copy.cancelSwitch[0])}</button>
   {preview&&request.status==='pending'&&<button disabled={busy} onClick={()=>void act('preview-switch')}>{t('Preview teacher approval')}</button>}</>:
   !readOnly&&!pair.complete&&<details><summary>{t(copy.switchTitle[0])}</summary><p>{t(copy.switchHelp[0])}</p>
    <label>{t(copy.switchCode[0])}<input value={code} maxLength={10} autoCapitalize="characters" autoComplete="off" onChange={e=>setCode(e.target.value.toUpperCase().trim())}/></label>
    <button disabled={busy||code===pair.code||!(/^[A-Z0-9]{10}$/).test(code)} onClick={()=>void act('requestSwitch',code)}>{t(copy.switchAsk[0])}</button>
   </details>}
 </div>
}
export function FoundationGroupLobby(){
 const {t}=useFoundationLanguage()
 const context=useContext(Context),[code,setCode]=useState(''),[size,setSize]=useState('4')
 if(!context)return null
 const {pair,preview,readOnly,busy,loaded,error,act,load}=context
 const hasFinishedAtPreviousTable=pair?.checkpoints.some(c=>c.previousTable)??false
 const readyCount=pair?.individualPace?participatingMembers(pair.members??[],true).length:(pair?.members?.length??0)
 const index=Math.max(0,pair?.checkpoints.findIndex(c=>!c.complete)??0)
 return <section id="foundation-group" tabIndex={-1} className={s.exchange} aria-label="Your lesson group">
  <p className={s.status}>{t("In-class discussion · Your own answers stay in your account")}</p><h2>{t(pair?.makeup?t("Independent-work request"):pair?.started?t("Working together"):t("Work with your group"))}</h2>
  {preview&&<p className={s.status}>{t("Teacher preview · classmates are fictional and nothing is saved.")}</p>}
  {error&&<p role="alert" className={s.error}>{error}</p>}
  {!loaded&&!error&&<p role="status">{t("Loading your saved group…")}</p>}
  {!pair&&loaded&&!readOnly&&<><p>{t("Work with the classmates at your table. One person creates a code; the others join from their own accounts. Groups can have two, three, or four students.")}</p><div className={s.groupSetup}><div>{preview&&<label>{t("Preview group size")}<select value={size} onChange={e=>setSize(e.target.value)}><option value="1">{t(copy.alone[0])}</option><option value="2">{t("2 students")}</option><option value="3">{t("3 students")}</option><option value="4">{t("4 students")}</option></select></label>}<button disabled={busy} onClick={()=>void act('create',preview?size:'')}>{t("Create a group code")}</button></div><div><label>{t("Join your classmates")}<input value={code} maxLength={10} autoComplete="off" autoCapitalize="characters" placeholder={t("Enter their group code")} onChange={e=>setCode(e.target.value.toUpperCase())}/></label><button disabled={busy||!code.trim()} onClick={()=>void act('join',preview?size:code)}>{t("Join group")}</button></div></div></>}
  {pair&&!pair.makeup&&<>
   <div className={s.groupHeading}><p><strong>{pair.members?.length??2} {(pair.members?.length??2)===1?t("student"):t("students")}</strong> · {t(pair.started?t("Group started"):t("Share this code"))} <span className={s.code}>{pair.code}</span></p>{!pair.started&&<button disabled={busy||readOnly||readyCount<2} onClick={()=>void act('start')}>{[t("Start with"),readyCount,readyCount===1?t("student"):t("students")].join(' ')}</button>}</div>
   {pair.individualPace?<p className={s.status}>{t(copy.lobby[0])} {t(copy.routine[0])}</p>:!pair.started&&<p className={s.status}>{t("Wait until everyone at your table appears below. Starting closes joining for this lesson.")}</p>}
   {!pair.started&&!hasFinishedAtPreviousTable&&pair.protocolVersion===3&&!readOnly&&<div><button disabled={busy} onClick={()=>{setCode('');void act('leave',pair.code)}}>{t((pair.members?.length===1?copy.cancel:copy.leave)[0])}</button><p className={s.status}>{t(copy.leaveHelp[0])}</p></div>}
   {(pair.started||hasFinishedAtPreviousTable)&&pair.individualPace&&<TableSwitchControl pair={pair}/>}
   {pair.protocolVersion===2&&<p className={s.status}>{t("Your existing pair and saved writing are preserved. Continue from where you left off.")}</p>}
   {pair.started?<details className={s.rosterDetails}><summary>{pair.members?.map(member=>member.name).join(' · ')||t("Working together")}</summary><GroupMembers index={index}/></details>:<GroupMembers index={index}/>}<p className={s.status}>{t("Roles rotate at each discussion. The scribe works at the whiteboard; everyone writes and submits their own answers.")}</p>
  </>}
  {pair?.makeup&&<><p role="status">{t(pair.approved?t("Your teacher approved independent alternatives."):t("Your request is saved and waiting for teacher approval."))}</p><p>{t("Continue with the slides and your individual questions. Any earlier group writing is preserved.")}</p>{preview&&!pair.approved&&<button onClick={()=>void act('preview-approve')}>{t("Preview teacher approval")}</button>}</>}
  {context.setupIdeas.length>0&&<details><summary>{t(copy.oldIdeas[0])}</summary>{context.setupIdeas.map(idea=><p key={idea} translate="no">{idea}</p>)}</details>}
  {!pair?.makeup&&!readOnly&&<details className={s.makeup}><summary>{t("Need to work on your own?")}</summary><p>{t("Request your teacher’s approval for independent alternatives. Your individual questions remain available while you wait, and your saved work is kept.")}</p><button disabled={busy} onClick={()=>void act('makeup')}>{t("Request to work on my own")}</button></details>}
  {!preview&&<button disabled={busy} onClick={()=>void load()}>{t("Check")} {' '} {pair?.makeup?t("request status"):t("group updates")}</button>}
 </section>
}
function PacedStop({pair,index,definition}:{pair:FoundationPair;index:number;definition:Checkpoint}){
 const cpaFoundation=useFoundationCpa()
 const {t}=useFoundationLanguage(),context=useContext(Context)!,stop=pair.checkpoints[index]
 const opensAt=stop.exampleOpensAt?Date.parse(stop.exampleOpensAt):Infinity
 const [now,setNow]=useState(Date.now)
 useEffect(()=>{
  if(!Number.isFinite(opensAt)||stop.exampleSelected||stop.replyToSlot||stop.peers?.length)return
  const timer=window.setTimeout(()=>setNow(Date.now()),Math.max(0,opensAt-Date.now())+50)
  return ()=>window.clearTimeout(timer)
 },[opensAt,stop.exampleSelected,stop.replyToSlot,stop.peers?.length])
 const active=participatingMembers(pair.members??[],true)
 const role=foundationRole(Math.max(0,active.findIndex(m=>m.isYou)),Math.max(2,active.length),index)
 const promptIndex=(pair.slot-1)%2,peers=stop.peers??[],chosen=peers.find(p=>stop.chosenIdeaKey?p.ideaKey===stop.chosenIdeaKey:p.slot===stop.replyToSlot)
 if(stop.previousTable)return <><p role="status">{t(copy.priorTable[0])}</p><SavedWriting title="Your shared idea" text={stop.own.contribution??''}/><SavedWriting title="Your response" text={stop.own.reply??''}/><SavedWriting title="Your private reflection · saved for your teacher" text={stop.own.reflection??''}/></>
 if(!stop.available)return <p>{t(copy.prior[0])}</p>
 return <>
  <div className={s.duty}><strong>{t(role.title)}</strong><p>{t(role.description)} {role.secondary&&t(role.secondary)}</p></div>
  <QuizContent content={definition.prompts[promptIndex]} questionEmphasis/><CpaDiscussionHelp index={index}/>
  {index===0&&!stop.own.contribution&&context.setupIdeas.length>0&&<details><summary>{t(copy.oldIdeas[0])}</summary>{context.setupIdeas.map(idea=><div key={idea}><p translate="no">{idea}</p><button disabled={context.busy||context.readOnly||!!context.drafts[stop.id+'-share']} onClick={()=>context.draft(stop.id+'-share',idea)}>{t(copy.useDraft[0])}</button></div>)}</details>}
  {stop.own.contribution?<SavedWriting title="Your shared idea" text={stop.own.contribution}/>:<ResponseField checkpoint={stop.id} action="share" label="Your idea before comparing" prompt={copy.first[0]} button="Share my idea"/>}
  {!pair.started&&<p>{t(copy.forming[0])}</p>}
  {pair.started&&stop.own.contribution&&!chosen&&!stop.exampleSelected&&<>
   {peers.length?<><p>{t(copy.choose[0])}</p>{peers.map(p=><div key={p.ideaKey??p.slot}><SavedWriting title={p.name} text={p.contribution??''} authored={context.preview}/><button disabled={context.busy||context.readOnly||!context.draftReady} onClick={()=>void context.act('compare',p.ideaKey??String(p.slot),stop.id)}>{t(copy.use[0])} {p.name}</button></div>)}</>:<>
    <p role="status">{t(copy.wait[0])} {t(copy.fallback[0])}</p>
    {now>=opensAt&&<button disabled={context.busy||context.readOnly||!context.draftReady} onClick={()=>void context.act('compare','example',stop.id)}>{t(copy.example[0])}</button>}
   </>}
  </>}
  {(chosen||stop.exampleSelected)&&<>
   {chosen?<><SavedWriting title={chosen.name} text={chosen.contribution??''} authored={context.preview}/><h3>{t('Talk it through at the whiteboard')}</h3><QuizContent content={definition.discuss} questionEmphasis/></>:<SavedWriting title="Example to check · not a classmate’s work" text={definition.solo.example} authored/>}
   {stop.own.reply?<SavedWriting title="Your response" text={stop.own.reply}/>:<ResponseField checkpoint={stop.id} action="reply" label={chosen?`${t('Respond to')} ${chosen.name}`:'Your check of the example'} prompt={chosen?definition.reply:definition.solo.critique} button="Save my response"/>}
   {stop.own.reply&&(stop.own.reflection?<SavedWriting title="Your private reflection · saved for your teacher" text={stop.own.reflection}/>:<ResponseField checkpoint={stop.id} action="reflect" label="Your own reflection" prompt={chosen?definition.reflection:cpaFoundation?definition.solo.reflection:copy.reflect[0]} button="Save my reflection"/>)}
   {peers.some(p=>p!==chosen)&&<details><summary>{t(copy.others[0])}</summary>{peers.filter(p=>p!==chosen).map(p=><SavedWriting key={p.ideaKey??p.slot} title={p.name} text={p.contribution??''} authored={context.preview}/>)}</details>}
  </>}
  {peers.filter(p=>p.reply&&(p.inReplyToYou??(p.replyToSlot===pair.slot))).map(p=><SavedWriting key={p.ideaKey??p.slot} title={`${p.name} · ${t(copy.incoming[0])}`} text={p.reply!} authored={context.preview}/>)}
  {stop.complete&&<p role="status">{t(copy.done[0])}</p>}
 </>
}
function LegacyFoundationExchange({index}:{index:number}){
 const {t}=useFoundationLanguage()
 const context=useContext(Context)
 if(!context)return null
 const {pair}=context,original=context.definitions[index],stop=pair?.checkpoints[index]
 const definition:Checkpoint|null=original?{...original,title:t(original.title),roles:[t(original.roles[0]),t(original.roles[1])],prompts:[t(original.prompts[0]),t(original.prompts[1])],discuss:t(original.discuss),reply:t(original.reply),reflection:t(original.reflection),solo:{idea:t(original.solo.idea),example:t(original.solo.example),critique:t(original.solo.critique),reflection:t(original.solo.reflection)}}:null
 if(!definition)return null
 const active=pair?.members?.filter(m=>m.independent!=='approved')??[]
 const rank=active.findIndex(m=>m.isYou),role=foundationRole(Math.max(0,rank),Math.max(2,active.length),index)
 const caseIndex=((pair?.slot??1)-1)%2
 const target=pair?.members?.find(m=>m.slot===stop?.replyToSlot)
 const count=active.length||2
 return <section id={`foundation-stop-${index+1}`} tabIndex={-1} className={s.exchange} aria-label={`${pair?.makeup?t('Independent stop'):t('Group stop')} ${index+1}: ${definition.title}`}>
  <p className={s.status}>{pair?.makeup?t('Independent stop'):t('Group stop')} {' '} {index+1} {t("of 3 · After your own responses")}</p><h2>{definition.title}</h2>
  {context.error&&<p role="alert" className={s.error}>{context.error}</p>}
  {!pair&&<p><a href="#foundation-group">{t("Create or join your group at the top of the lesson. Your individual answers save separately.")}</a></p>}
  {pair?.makeup&&stop?<>
   {!pair.approved?<p>{t("Your request is waiting for teacher approval. Continue with the slides and individual questions.")}</p>:!stop.available?<p>{t("Finish the earlier independent stop first.")}</p>:<>
    <QuizContent content={definition.solo.idea} questionEmphasis/><CpaDiscussionHelp index={index}/>
    {context.earlierGroupWriting[definition.id]?.contribution&&<details><summary>Earlier group writing · preserved</summary><p>Your earlier work is still saved. Use it as a starting point if it answers this independent question.</p>{['contribution','reply','reflection'].map(field=>context.earlierGroupWriting[definition.id]?.[field]?<SavedWriting key={field} title={field} text={context.earlierGroupWriting[definition.id][field]}/>:null)}{!stop.own.contribution&&!context.drafts[definition.id+'-share']&&<button disabled={context.busy||context.readOnly||!context.draftReady} onClick={()=>context.draft(definition.id+'-share',context.earlierGroupWriting[definition.id].contribution)}>Use my earlier idea as a draft</button>}</details>}
    {stop.own.contribution?<SavedWriting title="Your original idea" text={stop.own.contribution}/>:<ResponseField checkpoint={definition.id} action="share" label="Your own idea" button="Save my idea"/>}
    {stop.own.contribution&&<><SavedWriting title="Example to check · not a classmate’s work" text={definition.solo.example} authored/>{stop.own.reply?<SavedWriting title="Your check of the example" text={stop.own.reply}/>:<ResponseField checkpoint={definition.id} action="reply" label="What is right, wrong, or missing in the example" prompt={definition.solo.critique} button="Save my check"/>}</>}
    {stop.own.reply&&(stop.own.reflection?<SavedWriting title="Your private reflection · saved for your teacher" text={stop.own.reflection}/>:<ResponseField checkpoint={definition.id} action="reflect" label="Your own reflection" prompt={definition.solo.reflection} button="Save my reflection"/>)}
   </>}
  </>:pair?.individualPace&&stop?<PacedStop pair={pair} index={index} definition={definition}/>:pair&&stop&&<>
   {!pair.started?<p>{t("Start the group at the top of the lesson once everyone has joined.")}</p>:!stop.available?<p>{t("Finish the earlier discussion and your own reflection first. The slides and individual questions remain available.")}</p>:<>
    <div className={s.duty}><strong>{role.primary?t('Your primary role'):t('Your secondary duty')}: {t(role.title)}</strong><p>{t(role.description)}{role.secondary?<> {t('Also help as')} {t(role.secondary)}.</>:null}</p></div>
    <p><strong>{t("Your starting question ·")} {' '} {definition.roles[caseIndex]}</strong></p><QuizContent content={definition.prompts[caseIndex]} questionEmphasis/><CpaDiscussionHelp index={index}/>
    {stop.own.contribution?<SavedWriting title="Your shared idea" text={stop.own.contribution}/>:<ResponseField checkpoint={definition.id} action="share" label="Your idea before comparing" prompt="Explain your own reasoning. Classmates’ ideas appear after everyone shares." button="Share my idea"/>}
    {stop.own.contribution&&((stop.peers?.length??0)>0?<>
     {stop.peers!.map(p=><SavedWriting key={p.slot} title={`${p.name} · ${t('shared idea')}`} text={p.contribution??''} authored={context.preview}/>)}
     <h3>{t("Talk it through at the whiteboard")}</h3><QuizContent content={definition.discuss} questionEmphasis/><p>{t("Let everyone explain. The scribe shows the group’s reasoning at the board; then each person writes their own response.")}</p>
     {stop.own.reply?<SavedWriting title="Your response" text={stop.own.reply}/>:<ResponseField checkpoint={definition.id} action="reply" label={`${t('Respond to')} ${target?.name??t('your classmate')}`} prompt={definition.reply} button="Save my response"/>}
     {stop.peers!.filter(p=>p.reply).map(p=><SavedWriting key={p.slot} title={`${p.name} · response${p.replyToSlot?` to ${pair.members?.find(m=>m.slot===p.replyToSlot)?.name??'a classmate'}`:''}`} text={p.reply!} authored={context.preview}/>)}
     {stop.own.reply&&(stop.repliedCount??0)===count&&(stop.own.reflection?<SavedWriting title="Your private reflection · saved for your teacher" text={stop.own.reflection}/>:<ResponseField checkpoint={definition.id} action="reflect" label="Your own reflection" prompt={definition.reflection+' '+t('This stays private to you and your teacher.')} button="Save my reflection"/>)}
    </>:<p>{t("Your idea is saved. Waiting for everyone to share before comparing.")}</p>)}
    <p role="status">{stop.complete?t("Discussion and your private reflection saved. Continue with your own work."):`${stop.sharedCount??0} ${t('of')} ${count} ${t('ideas shared')} · ${stop.repliedCount??0} ${t('of')} ${count} ${t('responses saved')}`}</p>
    {pair.peerIndependent&&<p className={s.status}>{pair.protocolVersion===2?t("Your partner has requested independent work. If you are also working alone, request approval at the top of the lesson."):t("A classmate has requested independent work. Approved students keep their earlier writing but no longer hold up new group responses. If only one student remains, request approval to work on your own.")}</p>}
   </>}
  </>}
 </section>
}
export function useFoundationStopIncomplete(index:number){const context=useContext(Context);return !!context&&index<3&&(context.archived&&!context.drafts[context.definitions[index]?.id+'-reflect']?.trim()?!context.pair?.checkpoints[index]?.complete:!takeawayText(context.pair,context.drafts,index).trim())}
function LegacyFoundationCollaborationStatus({questions=[]}:{questions?:{id:string;label:string;part:number;answered:boolean}[]}){
 const {t}=useFoundationLanguage()
 const context=useContext(Context)
 if(!context)return null
 const {pair}=context
 const jump=(index:number)=>{const el=document.getElementById('foundation-stop-'+(index+1));el?.closest<HTMLDetailsElement>('details[data-foundation-part]')?.setAttribute('open','');el?.scrollIntoView({block:'start',behavior:'smooth'});el?.focus()}
 return <section className={s.exchange} aria-label="Submission checklist"><h2>{t("Before you submit")}</h2>
 <p>{questions.filter(q=>q.answered).length} of {questions.length} individual questions answered.</p><ul>{questions.filter(q=>!q.answered).map(q=><li key={q.id}><button onClick={()=>{document.getElementById('assignment-part-'+q.part)?.querySelector('details[data-foundation-part]')?.setAttribute('open','');document.getElementById('label-'+q.id)?.scrollIntoView({block:'center'});document.getElementById('answer-'+q.id)?.focus()}}>Answer {q.label}</button></li>)}</ul>
 <p>{t("Individual questions save automatically. Discussion drafts also save privately; click Share or Save at each step to finish it.")}</p>
 {FOUNDATION_SUBMISSION_GATES_PAUSED&&<p>{t(FOUNDATION_SUBMISSION_PAUSED_NOTICE)}</p>}{context.recovery&&!FOUNDATION_SUBMISSION_GATES_PAUSED&&<p>{DAY_SEVEN_RECOVERY_NOTICE} You may submit your completed individual questions for this assignment.</p>}
 <p role="status">{t(context.draftStatus)||(!context.draftReady?t("Loading private discussion drafts…"):'')}</p>
 {context.draftError&&<p role="alert" className={s.error}>{t(context.draftError)}</p>}
 <DraftRecovery/>{!context.readOnly&&<button disabled={context.busy} onClick={()=>context.draftReady?void context.saveDrafts():context.retryDrafts()}>{context.draftReady?t("Save discussion drafts now"):t("Retry loading discussion drafts")}</button>}
 <p>{!pair?t("Join your real group, or request approval to work independently."):pair.makeup?(pair.approved?t("Independent work approved."):t("Independent-work approval is still needed.")):(pair.started?t("Your group has started."):t("Join your classmates and start the group."))}</p>
 <ul>{context.definitions.map((definition,i)=>{const stop=pair?.checkpoints[i];return <li key={definition.id}><button onClick={()=>jump(i)}>{stop?.complete?t("✓ Complete"):t("Incomplete")} · Stop {i+1}: {definition.title}</button><p>{stop?.own.contribution?t("✓ Idea shared"):t("Idea not shared")} · {stop?.own.reply?t("✓ Comparison saved"):t("Comparison not saved")} · {stop?.own.reflection?t("✓ Reflection saved"):t("Reflection not saved")}</p></li>})}</ul>
 </section>
}
export function FoundationExchangeEvidence({value,foundation='day-one'}:{value:unknown;foundation?:FoundationKey}){
 const exchange=foundationExchangeEvidence(value,foundation)
 if(!exchange)return null
 return <section className={s.exchange} aria-label="Submitted collaboration evidence"><h2>{exchange.mode==='independent'?'Independent make-up work':'Submitted collaboration'}</h2><p>{exchange.recovery?DAY_SEVEN_RECOVERY_NOTICE:null}</p><p>Each response belongs to this student. Classmates’ shared writing is context; private reflections belong only to this student. Participation alone does not establish mastery.</p>{exchange.takeaways.map(c=><section key={c.mode+c.id} className={s.evidenceStop}><h3>{c.title}</h3><SavedWriting title="Student’s written takeaway" text={c.text}/><p>{c.context}</p></section>)}{exchange.checkpoints.map(c=><section key={c.id} className={s.evidenceStop}><h3>{c.title}</h3>{c.previousTable&&<p>Finished at the student’s previous table.</p>}<SavedWriting title="Student’s original idea" text={c.own.contribution}/>{c.peer&&<SavedWriting title="Partner’s shared idea · context" text={c.peer.contribution}/>} {c.peers?.map(p=><SavedWriting key={p.slot} title={`Classmate ${p.slot} · shared idea · context`} text={p.contribution}/>)}{c.example&&<SavedWriting title="Provided example · context" text={c.example} authored/>}<SavedWriting title={c.example?'Student’s example critique':`Student’s response${c.replyToSlot?` to classmate ${c.replyToSlot}`:''}`} text={c.own.reply}/>{c.peer&&<SavedWriting title="Partner’s response · context" text={c.peer.reply}/>} {c.peers?.filter(p=>p.reply).map(p=><SavedWriting key={p.slot} title={`Classmate ${p.slot} · response · context`} text={p.reply}/>)}{c.own.reflection&&<SavedWriting title="Student’s private reflection" text={c.own.reflection}/>}</section>)}</section>
}

export default function FoundationExchange({index}:{index:number}){
 const context=useContext(Context)
 if(!context)return null
 return context.archived&&!context.drafts[context.definitions[index]?.id+'-reflect']?.trim()?<LegacyFoundationExchange index={index}/>:<TakeawayStop index={index}/>
}
function TakeawayStop({index}:{index:number}){
 const context=useContext(Context)!,{locale,t}=useFoundationLanguage(),words=takeawayCopy[locale]
 const [step,setStep]=useState(0),cpa=useFoundationCpa(),steps=stopSteps[locale]
 const {pair,definitions}=context,definition=definitions[index],stop=pair?.checkpoints[index]
 if(!definition)return null
 const independent=!!pair?.makeup,ready=context.archived||(independent?!!pair?.approved:!!pair?.started)
 const key=definition.id+'-reflect',text=takeawayText(pair,context.drafts,index)
 const earlier=[stop?.own.reflection&&context.drafts[key]!==stop.own.reflection?context.drafts[key]:null,stop?.own.contribution,stop?.own.reply,context.drafts[definition.id+'-share'],context.drafts[definition.id+'-reply'],...Object.values(context.earlierGroupWriting[definition.id]??{})].filter((v):v is string=>typeof v==='string'&&!!v.trim())
 return <section id={'foundation-stop-'+(index+1)} tabIndex={-1} className={s.exchange} aria-label={`${t(independent?'Independent stop':'Group stop')} ${index+1}: ${t(definition.title)}`}>
  <p className={s.status}>{t(independent?'Independent stop':'Group stop')} {index+1} / 3</p><h2>{t(definition.title)}</h2>
  {!ready?<p>{independent?words.approval:words.group}</p>:<>
   <nav className={s.stopSteps} aria-label={words.title}>{steps.steps.map((label,i)=><button key={i} type="button" aria-pressed={step===i} aria-controls={key+'-task'} onClick={()=>setStep(i)}>{i+1}. {label}</button>)}</nav>
   <div id={key+'-task'} className={s.stopTask}>
   {step<2&&<>
    <p className={s.stopDirection}>{independent?(step===0?steps.soloTry:steps.soloCompare):(step===0?steps.try:steps.compare)}</p>
    <QuizContent content={t(independent?(step===0?definition.solo.idea:definition.solo.example):definition.prompts[step])} questionEmphasis/>
    {step===1&&!context.archived&&<FoundationNoteExample at="stop" number={index+1}/>}
    {cpa&&<details><summary>{steps.help}</summary><CpaDiscussionHelp index={index}/></details>}
    {!independent&&<details><summary>{steps.roles}</summary><GroupMembers index={index}/></details>}
    <button type="button" onClick={()=>setStep(step+1)}>{steps.next}: {steps.steps[step+1]} →</button>
   </>}
   <div hidden={step!==2}>
   {stop?.own.reflection?<><p>{words.old}</p><SavedWriting title={words.label} text={stop.own.reflection}/></>:<>
    <div className={s.responseField}><label htmlFor={key}>{words.label}</label><p id={key+'-prompt'}>{words.prompt}</p><details><summary>{steps.starter}</summary><p>{words.starter}</p></details>
     <textarea id={key} translate="no" aria-describedby={key+'-prompt'} maxLength={4000} value={text} disabled={context.busy||context.readOnly||!context.draftReady} onChange={e=>context.draft(key,e.target.value)}/>
     <p role="status">{t(context.draftStatus)}</p>{context.draftError&&<p role="alert" className={s.error}>{t(context.draftError)}</p>}<DraftRecovery field={key}/>
    </div>
    <button disabled={context.busy||context.readOnly||!context.draftReady} onClick={()=>void context.saveDrafts()}>{words.save}</button>
   </>}
   </div></div>
  </>}
  {earlier.length>0&&<details><summary>{words.history}</summary>{[...new Set(earlier)].map((value,i)=><p key={i} translate="no">{value}</p>)}</details>}
 </section>
}
export function FoundationCollaborationStatus({questions=[]}:{questions?:{id:string;label:string;part:number;answered:boolean}[]}){
 const context=useContext(Context),{locale,t}=useFoundationLanguage(),words=takeawayCopy[locale]
 if(!context)return null
 if(context.archived&&!context.definitions.some(c=>context.drafts[c.id+'-reflect']?.trim()))return <LegacyFoundationCollaborationStatus questions={questions}/>
 const go=(i:number)=>{const element=document.getElementById('foundation-stop-'+(i+1));element?.closest<HTMLDetailsElement>('details[data-foundation-part]')?.setAttribute('open','');element?.scrollIntoView({block:'start',behavior:'smooth'});element?.focus()}
 return <section className={s.exchange} aria-label="Submission checklist"><h2>{t('Before you submit')}</h2>
  <p>{words.questions}: {questions.filter(q=>q.answered).length} / {questions.length}</p><ul>{questions.filter(q=>!q.answered).map(q=><li key={q.id}><button onClick={()=>{document.getElementById('assignment-part-'+q.part)?.querySelector('details[data-foundation-part]')?.setAttribute('open','');document.getElementById('label-'+q.id)?.scrollIntoView({block:'center'});document.getElementById('answer-'+q.id)?.focus()}}>{q.label}</button></li>)}</ul><p>{words.note}</p>
  {FOUNDATION_SUBMISSION_GATES_PAUSED&&<p>{t(FOUNDATION_SUBMISSION_PAUSED_NOTICE)}</p>}
  <p role="status">{t(context.draftStatus)}</p>{context.draftError&&<p role="alert" className={s.error}>{t(context.draftError)}</p>}<DraftRecovery/>
  <button disabled={context.busy||context.readOnly} onClick={()=>context.draftReady?void context.saveDrafts():context.retryDrafts()}>{context.draftReady?t('Save discussion drafts now'):t('Retry loading discussion drafts')}</button>
  <ul>{context.definitions.map((c,i)=><li key={c.id}><button onClick={()=>go(i)}>{takeawayText(context.pair,context.drafts,i).trim()?words.saved:words.missing} · {i+1}: {t(c.title)}</button></li>)}</ul>
 </section>
}
