import test from 'node:test'
import assert from 'node:assert/strict'
import { journeyMetrics, positionAt, MOTION_BOUNDS } from './velocity-lab'
import { emptyVelocityState, validateVelocityState, GRAPH_TARGETS } from './velocity'
import { assignmentBySlug } from './catalog'

test('an out-and-back walk has nonzero speed and zero average velocity',()=>{
 const m=journeyMetrics([0,1,2,3,2,1,0],.5)
 assert.equal(m.distance,6); assert.equal(m.displacement,0); assert.equal(m.duration,3)
 assert.equal(m.speed,2); assert.equal(m.velocity,0)
})
test('partial replay interpolates position and counts the path after reversal',()=>{
 const m=journeyMetrics([0,1,2,1,0],2,5)
 assert.equal(m.position,1.5); assert.equal(m.distance,2.5); assert.equal(m.displacement,1.5)
 assert.equal(m.speed,.5); assert.equal(m.velocity,.3)
})
test('time zero has undefined averages and displacement uses the starting point',()=>{
 assert.equal(journeyMetrics([0],1).speed,null)
 const m=journeyMetrics([4,3,2],1)
 assert.equal(m.displacement,-2); assert.equal(m.speed,1); assert.equal(m.velocity,-1)
})
test('entire allowed graph model stays visible and does not clamp negative positions',()=>{
 assert.equal(positionAt(0,-2,10),-20); assert.equal(positionAt(10,2,10),30)
 for(const start of [0,5,10])for(const velocity of [-2,0,2])for(const t of [0,5,10]){
  assert(positionAt(start,velocity,t)>=MOTION_BOUNDS[0]);assert(positionAt(start,velocity,t)<=MOTION_BOUNDS[1])
 }
 for(const target of GRAPH_TARGETS)assert.equal(positionAt(target.start,target.velocity,10),target.start+10*target.velocity)
})
test('existing validator preserves lab predictions, timing, walk, graph and question answers',()=>{
 const lesson=assignmentBySlug('day-3-velocity')!,s=emptyVelocityState()
 s.walker=[0,1,2,3,4,3,2,1];s.explorers={'velocity-step-time':[.5],'velocity-walk-prediction':[0],'velocity-graph-prediction':[2]}
 s.graph={target:1,start:10,velocity:-1};s.answers['r2-1a']='15';s.answers['r2-7a']='Two journeys, with ordered positions and times.'
 const saved=validateVelocityState(s,lesson.questions)
 assert.deepEqual(saved.explorers,s.explorers);assert.deepEqual(saved.walker,s.walker);assert.deepEqual(saved.graph,s.graph)
 assert.equal(saved.answers['r2-7a'],s.answers['r2-7a']);assert.equal(lesson.questions.length,17)
 assert.equal(lesson.questions.find(q=>q.id==='r2-7a')?.demand?.dok,3)
 assert.equal(lesson.questions.find(q=>q.id==='r2-7b')?.demand?.blooms,'Evaluate')
})
