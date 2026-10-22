import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateDemand} from '@/lib/assessment-demand'
import {ALL_ASSIGNMENTS,assignmentBySlug} from './catalog'
import {canvasSchema,canvasObservationKey,encodeCanvasObservations,decodeCanvasObservations,type CanvasObservation} from './canvas-observations'
import {emptyVelocityState,validateVelocityState} from './velocity'
import {validateSimulationEvidence,recordedSimulationEvidence} from './simulation-trials'
import {createCartCollisionsEngine} from '@/app/simulations/cart-collisions/engine'
import {createImpulseMomentumEngine} from '@/app/simulations/impulse-momentum/engine'
import {createPicketFenceEngine} from '@/app/simulations/picket-fence-g/engine'
import {createDartDeflectionEngine} from '@/app/simulations/dart-deflection/engine'
import type {SimEngineFactory,ParamValues} from '@/components/simulations/lab/contract'

const ids=['cart-collisions','impulse-momentum','dart-deflection','riverboat-crossing-3d','picket-fence-g']
const near=(actual:number,expected:number,tolerance=1e-7)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`)
function trial(factory:SimEngineFactory,conditions:ParamValues){
 const previous=Object.getOwnPropertyDescriptor(globalThis,'window')
 Object.defineProperty(globalThis,'window',{value:{devicePixelRatio:1},configurable:true})
 try{
  const engine=factory({width:760,height:470} as HTMLCanvasElement,{} as CanvasRenderingContext2D,conditions)
  engine.start?.(conditions)
  for(let i=0;i<120*30&&!engine.isComplete?.();i++)engine.step?.(1/120)
  assert.equal(engine.isComplete?.(),true,'Every outcome must finish, including a failed deflection')
  const readings=engine.getReadouts();engine.destroy();return readings
 }finally{if(previous)Object.defineProperty(globalThis,'window',previous);else Reflect.deleteProperty(globalThis,'window')}
}
test('all five replacements have the canonical question mix and independently specified demand',()=>{
 assert.equal(ALL_ASSIGNMENTS.filter(a=>a.simulation).length,30)
 for(const id of ids){
  const lesson=assignmentBySlug('simulation-'+id)!
  assert.ok(lesson.questions.some(q=>q.options))
  assert.ok(lesson.questions.some(q=>q.answer!==undefined))
  assert.ok(lesson.questions.some(q=>q.independent&&q.answer===undefined&&!q.options))
  for(const q of lesson.questions)assert.deepEqual(validateDemand(q.demand),q.demand,q.id)
  assert.ok(lesson.questions.some(q=>q.demand?.blooms==='Create'&&q.demand.dok===3))
  assert.ok(lesson.questions.some(q=>q.demand?.dok===4&&q.prompt.includes('revise')))
 }
})
test('observations survive assignment validation with their original conditions and phase',()=>{
 for(const id of ids){
  const schema=canvasSchema(id),conditions=Object.fromEntries(schema.params.map(p=>[p.key,p.initial])),readings=Object.fromEntries(schema.readings.map(r=>[r.key,1.25]))
  const observations:CanvasObservation[]=[{id:1,complete:false,conditions,readings},{id:2,complete:true,conditions:{...conditions},readings:{...readings}}]
  const key=canvasObservationKey(id),state=validateVelocityState({...emptyVelocityState(),explorers:{[key]:encodeCanvasObservations(id,observations)}},assignmentBySlug('simulation-'+id)!.questions)
  assert.deepEqual(decodeCanvasObservations(id,state.explorers?.[key]),observations)
  assert.doesNotThrow(()=>validateSimulationEvidence(id,state))
  assert.equal(recordedSimulationEvidence(id,state).length,2)
  observations[1].conditions[schema.params[0].key]=schema.params[0].max
  assert.equal(decodeCanvasObservations(id,state.explorers?.[key])[0].conditions[schema.params[0].key],schema.params[0].initial)
 }
})
test('malformed, duplicate and out-of-range observations cannot silently enter the snapshot',()=>{
 const id=ids[0],schema=canvasSchema(id),observation={id:1,complete:true,conditions:Object.fromEntries(schema.params.map(p=>[p.key,p.initial])),readings:Object.fromEntries(schema.readings.map(r=>[r.key,0]))}
 const valid=encodeCanvasObservations(id,[observation])
 for(const broken of [valid.slice(1),[...valid,...valid],valid.map((v,i)=>i===2?100:v),valid.map((v,i)=>i===1?2:v)]){
  assert.equal(decodeCanvasObservations(id,broken).length,0)
  assert.throws(()=>validateSimulationEvidence(id,{...emptyVelocityState(),explorers:{[canvasObservationKey(id)]:broken}}))
 }
})
test('guided cart collisions conserve signed momentum and have the authored energy results',()=>{
 for(const [elasticity,energy] of [[1,2],[.5,1.25],[0,1]]){
  const r=trial(createCartCollisionsEngine,{mass1:1,mass2:1,v1:2,v2:0,elasticity})
  near(Number(r.pAfter),2);near(Number(r.keAfter),energy)
 }
 const transfer=trial(createCartCollisionsEngine,{mass1:2,mass2:1,v1:3,v2:-2,elasticity:0})
 near(Number(transfer.pAfter),4);near(Number(transfer.keAfter),8/3)
})
test('impulse magnitude stays fixed while peak force falls with longer contact',()=>{
 for(const contactTime of [50,100,200]){const r=trial(createImpulseMomentumEngine,{cartMass:1,impactSpeed:3,contactTime,bounce:.5});near(Number(r.impulse),4.5);near(Number(r.peakForce),Math.PI*4.5/(2*contactTime/1000))}
})
test('photogate slopes retain g when mass and release height change',()=>{
 for(const mass of [50,100,150])for(const releaseHeight of [10,30]){const r=trial(createPicketFenceEngine,{mass,releaseHeight,bandSpacing:5});near(Number(r.measuredG),9.8,1e-5)}
})
test('deflection supports both successful and unsuccessful trials and lead-time comparison',()=>{
 const conditions={asteroidSize:300,impactorMass:20000,impactorSpeed:10,beta:3.6,leadTime:10}
 const a=trial(createDartDeflectionEngine,conditions),b=trial(createDartDeflectionEngine,{...conditions,leadTime:20})
 near(Number(b.deltaV),Number(a.deltaV));near(Number(b.miss),Number(a.miss)*2)
 const miss=trial(createDartDeflectionEngine,{...conditions,leadTime:1,impactorMass:500})
 assert.ok(Number(miss.miss)<6371)
})
