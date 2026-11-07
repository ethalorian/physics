import {foundationTakeaways} from './takeaways'
import {getFoundationCheckpoints,type FoundationKey} from './checkpoints'
/** Share only attributable writing and authored demands, never account IDs or peer reflections. */
export function foundationExchangeEvidence(state: unknown, foundation:FoundationKey='day-one') {
 if (!state || typeof state !== 'object' || !('partner_exchange' in state)) return null
 const exchange = state.partner_exchange
 if (!exchange || typeof exchange !== 'object') return null
 const recovery='mode' in exchange&&exchange.mode==='recovery'&&'version' in exchange&&exchange.version===5
 const independent='mode' in exchange&&exchange.mode==='independent'
 const group='mode' in exchange&&exchange.mode==='group'
 const paced=group&&'version' in exchange&&exchange.version===4
 const writing = (side: unknown) => {
  if(recovery&&side&&typeof side==='object')return {contribution:'contribution' in side&&typeof side.contribution==='string'?side.contribution.slice(0,4000):'',reply:'reply' in side&&typeof side.reply==='string'?side.reply.slice(0,4000):''}
  if (!side || typeof side !== 'object' || !('contribution' in side) || !('reply' in side)) return null
  return typeof side.contribution === 'string' && typeof side.reply === 'string'
   ? {contribution:side.contribution.slice(0,4000),reply:side.reply.slice(0,4000)} : null
 }
 const entries='checkpoints' in exchange&&Array.isArray(exchange.checkpoints)?exchange.checkpoints:[{id:'model',...exchange}]
 const takeaways=foundationTakeaways(state,foundation)
 const checkpoints=getFoundationCheckpoints(foundation).flatMap(definition=>{
  const item=entries.find(c=>c&&typeof c==='object'&&c.id===definition.id)
  if(!item)return []
  const own=writing(item.own),peer=writing(item.peer)
  const peers:{slot:number;contribution:string;reply:string;replyToSlot:number|null}[]=group&&Array.isArray(item.peers)?item.peers.slice(0,3).flatMap((p:Record<string,unknown>)=>{
   const text=paced&&typeof p.contribution==='string'?{contribution:p.contribution.slice(0,4000),reply:typeof p.reply==='string'?p.reply.slice(0,4000):''}:writing(p)
   if(!text||typeof p.slot!=='number'||p.slot<1||p.slot>4)return []
   const replyToSlot=p.reply_to_user_id===('own_user_id' in exchange?exchange.own_user_id:null)?(typeof item.source_slot==='number'?item.source_slot:'own_slot' in exchange&&typeof exchange.own_slot==='number'?exchange.own_slot:null):item.peers.find((m:Record<string,unknown>)=>m.user_id===p.reply_to_user_id)?.slot??null
   return [{slot:p.slot,...text,replyToSlot}]
  }):[]
  const example=independent||(paced&&item.own?.example_selected===true)
  if(!own||(!recovery&&!independent&&!group&&!peer)||(group&&!example&&!peers.length))return []
  const replyToSlot=group&&Array.isArray(item.peers)?item.peers.find((p:Record<string,unknown>)=>p.user_id===item.own.reply_to_user_id)?.slot??null:null
  return [{previousTable:paced&&typeof item.source_pair_id==='string'&&'pair_id' in exchange&&item.source_pair_id!==exchange.pair_id,id:definition.id,title:definition.title,demand:example?{...definition.demand,evidence:definition.solo.critique+' '+(independent?definition.solo.reflection:'Explain what changed or stayed the same using evidence from the example.')}:definition.demand,...(example?{example:definition.solo.example}:{}),own:{...own,reflection:typeof item.own.reflection==='string'?item.own.reflection.slice(0,4000):null},peer:independent||group?null:peer,peers:group?peers:undefined,replyToSlot}]
 })
 return checkpoints.length||takeaways.length?{takeaways,recovery,mode:recovery?'recovery':independent?'independent':group?'group':'pair',checkpoints}:null
}
