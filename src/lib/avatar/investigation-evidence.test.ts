import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {compareEvidence} from './investigation-evidence'
import {ALL_ASSIGNMENTS} from '../interactive-assignments/catalog'
import {INVESTIGATIONS,initialLabParameters} from '../interactive-assignments/investigation-definitions'
import {investigationFrame,encodeLabTrials,decodeLabTrials,labTrialKey} from '../interactive-assignments/investigation-model'
import {emptyVelocityState,validateVelocityState} from '../interactive-assignments/velocity'
import {CONNECTED_CHAPTERS} from '../../components/readings/interactive/connected-chapter-catalog'
import {assignmentMission,EXPLORER_MISSIONS,readerMission,SIMULATION_ROLES,simulationMission} from './investigation-missions'

test('comparisons retain reference evidence and identify changed conditions',()=>{
 const before={settings:[{name:'Mass',value:'2 kg'},{name:'Net force',value:'12 N'}],observations:['Acceleration: 6 m/s²']}
 const after={settings:[{name:'Mass',value:'4 kg'},{name:'Net force',value:'12 N'}],observations:['Acceleration: 3 m/s²']}
 assert.deepEqual(compareEvidence(before,after),[{name:'Mass',before:'2 kg',after:'4 kg'}])
 assert.equal(before.observations[0],'Acceleration: 6 m/s²')
 assert.deepEqual(compareEvidence(before,before),[])
})
test('every catalog assignment has an authored role and a reachable investigation',()=>{
 for(const lesson of ALL_ASSIGNMENTS){
  assert.ok(assignmentMission(lesson).role,lesson.slug)
  if(lesson.simulation){assert.ok(SIMULATION_ROLES[lesson.simulation],lesson.slug);assert.ok(simulationMission(lesson.simulation,lesson.title).test)}
  else assert.ok(lesson.slug==='day-3-velocity'||[14,19].includes(lesson.day)||lesson.sections.some(section=>section.explorer||section.questions.some(q=>q.diagram)),lesson.slug)
  for(const section of lesson.sections)if(section.explorer)assert.ok(EXPLORER_MISSIONS[section.explorer],lesson.slug)
 }
})
test('every connected reading selects a reviewed physics role',()=>{
 for(const chapter of CONNECTED_CHAPTERS)for(const section of chapter.lessons){
  const role=readerMission(section.visual)
  assert.ok(role?.role&&role.predict&&role.test&&role.explain,`${chapter.definition.book} ${chapter.definition.chapter} ${section.visual}`)
 }
})
test('additional interaction and revision labs survive canonical assignment validation',()=>{
 for(const [day,id]of [[14,'carts-third-law'],[19,'free-body-diagram']] as const){
  const lesson=ALL_ASSIGNMENTS.find(a=>!a.simulation&&a.day===day)!,lab=INVESTIGATIONS.find(l=>l.id===id)!
  const trial={id:1,parameters:initialLabParameters(lab)},key=labTrialKey(id)
  const state={...emptyVelocityState(),explorers:{[key]:encodeLabTrials(id,[trial])}}
  const restored=validateVelocityState(state,lesson.questions)
  assert.deepEqual(decodeLabTrials(id,restored.explorers?.[key]),[trial])
  assert.deepEqual(restored.answers,validateVelocityState(emptyVelocityState(),lesson.questions).answers)
 }
})
test('the avatar scene reads exact model time and endpoints, including reversals',()=>{
 const lab=INVESTIGATIONS.find(l=>l.id==='constant-velocity')!,p=initialLabParameters(lab)
 for(const velocity of [-2,0,2]){
  const start=investigationFrame(lab.id,{...p,velocity},0),end=investigationFrame(lab.id,{...p,velocity},1)
  assert.equal(end.scene.bodies[0].x-start.scene.bodies[0].x,velocity*end.time)
 }
})
