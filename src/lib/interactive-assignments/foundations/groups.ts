import {emptyCheckpointWriting,type Checkpoint,type CheckpointWriting,type FoundationMember,type FoundationPair} from './checkpoints'

/** Duties rotate independently of the authored A/B physics prompts. */
export function foundationRole(memberIndex:number,size:number,checkpoint:number){
 const seat=(memberIndex-checkpoint%size+size)%size
 if(seat===0)return {title:'Slideshow lead',primary:true,description:'Lead the slides, move the lesson forward, and invite everyone to explain.',secondary:size===2?'Timekeeper':null}
 if(seat===1)return {title:'Whiteboard scribe',primary:true,description:'Hold the dry erase marker and work out the problems at the whiteboard.',secondary:size===2?'Checker':null}
 return {title:size===3?'Timekeeper + checker':seat===2?'Timekeeper':'Checker',primary:false,description:size===3?'Watch the time and check signs, units, and reasoning with the group.':seat===2?'Watch the slide timers and help the group stay on pace.':'Check signs, units, calculations, and reasoning with the group.',secondary:null}
}
export type GroupResponse=CheckpointWriting&{user_id:string;checkpoint:string;reply_to_user_id?:string|null}
type Member=FoundationMember&{user_id:string}
/** This is the only live-response projection. Never return another student's reflection. */
export function foundationGroupView(definitions:readonly Checkpoint[],user:string,group:{code:string;protocol_version:number;started_at:string|null},members:Member[],responses:GroupResponse[]):FoundationPair{
 const mine=members.find(m=>m.user_id===user)!
 const active=group.protocol_version===3?members.filter(m=>m.independent!=='approved'):members
 const started=group.protocol_version===2||!!group.started_at
 const next=active[(active.findIndex(m=>m.user_id===user)+1)%active.length]
 let available=started
 const checkpoints=definitions.map(({id})=>{
  const row=responses.find(r=>r.user_id===user&&r.checkpoint===id)
  const own=row?{contribution:row.contribution,reply:row.reply,reflection:row.reflection,contributed_at:row.contributed_at,replied_at:row.replied_at,reflected_at:row.reflected_at}:emptyCheckpointWriting()
  const rows=responses.filter(r=>r.checkpoint===id)
  const sharedCount=active.filter(m=>rows.some(r=>r.user_id===m.user_id&&r.contribution)).length
  const repliedCount=active.filter(m=>rows.some(r=>r.user_id===m.user_id&&r.reply)).length
  const reveal=active.length>=2&&sharedCount===active.length
  const peers=reveal?members.filter(m=>m.user_id!==user).flatMap(m=>{
   const r=rows.find(r=>r.user_id===m.user_id)
   return r?.contribution?[{slot:m.slot,name:m.name,contribution:r.contribution,reply:r.reply,replyToSlot:members.find(m=>m.user_id===r.reply_to_user_id)?.slot??null}]:[]
  }):[]
  const peer=peers[0]?{contribution:peers[0].contribution,reply:peers[0].reply}:null
  const complete=active.length>=2&&repliedCount===active.length&&!!own.reflection
  const result={id,own,peer,peers,peerShared:sharedCount>Number(!!own.contribution),complete,available,sharedCount,repliedCount,replyToSlot:members.find(m=>m.user_id===row?.reply_to_user_id)?.slot??next?.slot??null}
  available=available&&complete
  return result
 })
 return {code:group.code,slot:mine.slot,protocolVersion:group.protocol_version,started,members:members.map(m=>({slot:m.slot,name:m.name,isYou:m.isYou,independent:m.independent,avatar:m.avatar})),peerJoined:members.length>1,peerName:members.find(m=>!m.isYou)?.name??null,peerIndependent:members.some(m=>!m.isYou&&!!m.independent),checkpoints,complete:checkpoints.every(c=>c.complete)}
}
