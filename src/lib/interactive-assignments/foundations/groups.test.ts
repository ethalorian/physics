import test from 'node:test'
import assert from 'node:assert/strict'
import {foundationGroupView,foundationRole,type GroupResponse} from './groups'
import {FOUNDATION_CHECKPOINTS,emptyCheckpointWriting} from './checkpoints'
import {foundationExchangeEvidence} from './evidence'
const members=Array.from({length:4},(_,i)=>({slot:i+1,user_id:'student-'+i,name:'Student '+i,isYou:i===0,independent:null,avatar:{traits:{},equipped:{}}}))
const group={code:'CODE',protocol_version:3,started_at:'2026-10-27'}
test('Two primary duties and supporting duties work for 2, 3 and 4 students and rotate',()=>{
 for(const count of [2,3,4])for(let stop=0;stop<3;stop++){
  const roles=members.slice(0,count).map((_,i)=>foundationRole(i,count,stop))
  assert.equal(roles.filter(r=>r.primary).length,2)
  assert.equal(roles.filter(r=>r.title==='Slideshow lead').length,1)
  assert.equal(roles.filter(r=>r.title==='Whiteboard scribe').length,1)
  assert.match(roles.find(r=>r.title==='Whiteboard scribe')!.description,/dry erase marker/)
  if(count===2)assert.deepEqual(roles.map(r=>r.secondary).sort(),['Checker','Timekeeper'])
  if(count===3)assert.equal(roles.filter(r=>r.title==='Timekeeper + checker').length,1)
 }
})
test('Group projection hides every peer idea until all share, and never exposes private reflections or IDs',()=>{
 const responses:GroupResponse[]=members.map(m=>({...emptyCheckpointWriting(),user_id:m.user_id,checkpoint:'evidence',contribution:'Own contribution '+m.slot,reply:'Own response',reflection:'PRIVATE '+m.slot,reply_to_user_id:members[m.slot%4].user_id}))
 let view=foundationGroupView(FOUNDATION_CHECKPOINTS,'student-0',group,members,responses.slice(0,3))
 assert.deepEqual(view.checkpoints[0].peers,[]);assert.equal(view.checkpoints[0].complete,false)
 view=foundationGroupView(FOUNDATION_CHECKPOINTS,'student-0',group,members,responses)
 assert.equal(view.checkpoints[0].peers?.length,3);assert.equal(view.checkpoints[0].replyToSlot,2)
 assert.equal(view.checkpoints[0].complete,true);assert.equal(view.checkpoints[1].available,true)
 assert(!JSON.stringify(view).includes('PRIVATE 2'));assert(!JSON.stringify(view).includes('student-'))
})
test('Group membership must be started and two active members must remain',()=>{
 const unstarted=foundationGroupView(FOUNDATION_CHECKPOINTS,'student-0',{...group,started_at:null},members,[])
 assert(unstarted.checkpoints.every(c=>!c.available));assert.equal(unstarted.started,false)
 const withdrawn=members.map(m=>({...m,independent:m.isYou?null:'approved' as const}))
 const view=foundationGroupView(FOUNDATION_CHECKPOINTS,'student-0',group,withdrawn,[])
 assert.equal(view.complete,false)
})
test('Legacy and group evidence keep attribution without peer reflections or account identifiers',()=>{
 const legacy={partner_exchange:{own:{contribution:'Original own idea',reply:'Own reply'},peer:{contribution:'Peer idea',reply:'Peer reply',reflection:'PRIVATE PEER'}}}
 const v1=foundationExchangeEvidence(legacy);assert.equal(v1?.mode,'pair');assert.equal(v1?.checkpoints.length,1);assert(!JSON.stringify(v1).includes('PRIVATE PEER'))
 const v3={partner_exchange:{version:3,mode:'group',own_user_id:'s1',own_slot:1,checkpoints:[{id:'evidence',own:{contribution:'Own idea',reply:'Own reply',reflection:'Own private reflection',reply_to_user_id:'s2'},peers:[{user_id:'s2',slot:2,contribution:'Peer idea',reply:'Peer reply',reflection:'PRIVATE PEER',reply_to_user_id:'s1'}]}]}}
 const evidence=foundationExchangeEvidence(v3);assert.equal(evidence?.mode,'group');assert.equal(evidence?.checkpoints[0].replyToSlot,2);assert.equal(evidence?.checkpoints[0].peers?.[0].replyToSlot,1);assert(!JSON.stringify(evidence).includes('PRIVATE PEER'));assert(!JSON.stringify(evidence).includes('s2'))
})
