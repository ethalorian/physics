import {getFoundationCheckpoints,type FoundationKey} from './checkpoints'
/** Share only attributable writing and authored demands, never account IDs or peer reflections. */
export function foundationExchangeEvidence(state: unknown, foundation:FoundationKey='day-one') {
 if (!state || typeof state !== 'object' || !('partner_exchange' in state)) return null
 const exchange = state.partner_exchange
 if (!exchange || typeof exchange !== 'object') return null
 const independent='mode' in exchange&&exchange.mode==='independent'
 const group='mode' in exchange&&exchange.mode==='group'
 const writing = (side: unknown) => {
  if (!side || typeof side !== 'object' || !('contribution' in side) || !('reply' in side)) return null
  return typeof side.contribution === 'string' && typeof side.reply === 'string'
   ? {contribution:side.contribution.slice(0,4000),reply:side.reply.slice(0,4000)} : null
 }
 const entries='checkpoints' in exchange&&Array.isArray(exchange.checkpoints)?exchange.checkpoints:[{id:'model',...exchange}]
 const checkpoints=getFoundationCheckpoints(foundation).flatMap(definition=>{
  const item=entries.find(c=>c&&typeof c==='object'&&c.id===definition.id)
  if(!item)return []
  const own=writing(item.own),peer=writing(item.peer)
  const peers:{slot:number;contribution:string;reply:string;replyToSlot:number|null}[]=group&&Array.isArray(item.peers)?item.peers.slice(0,3).flatMap((p:Record<string,unknown>)=>{
   const text=writing(p)
   if(!text||typeof p.slot!=='number'||p.slot<1||p.slot>4)return []
   const replyToSlot=p.reply_to_user_id===('own_user_id' in exchange?exchange.own_user_id:null)?('own_slot' in exchange&&typeof exchange.own_slot==='number'?exchange.own_slot:null):item.peers.find((m:Record<string,unknown>)=>m.user_id===p.reply_to_user_id)?.slot??null
   return [{slot:p.slot,...text,replyToSlot}]
  }):[]
  if(!own||(!independent&&!group&&!peer)||(group&&!peers.length))return []
  const replyToSlot=group?item.peers.find((p:Record<string,unknown>)=>p.user_id===item.own.reply_to_user_id)?.slot??null:null
  return [{id:definition.id,title:definition.title,demand:independent?{...definition.demand,evidence:definition.solo.critique+' '+definition.solo.reflection}:definition.demand,...(independent?{example:definition.solo.example}:{}),own:{...own,reflection:typeof item.own.reflection==='string'?item.own.reflection.slice(0,4000):null},peer:independent||group?null:peer,peers:group?peers:undefined,replyToSlot}]
 })
 return checkpoints.length?{mode:independent?'independent':group?'group':'pair',checkpoints}:null
}
