import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ALL_ASSIGNMENTS,UNIT1_ASSIGNMENTS,assignmentByDay,assignmentBySlug} from './catalog'
import {decodeRaceTrials,encodeRaceTrials} from './simulation-trials'
import {emptyVelocityState,validateVelocityState,missingVelocityAnswers} from './velocity'
import {raceMeasurement} from '@/components/simulations/race-track/model'

test('simulation identity does not replace the existing Day 3 assignment',()=>{
 const lesson=assignmentBySlug('simulation-race-track')!
 assert.equal(lesson.simulation,'race-track')
 assert.equal(assignmentByDay(3)?.slug,'day-3-velocity')
 assert.equal(UNIT1_ASSIGNMENTS.length,20)
 assert.equal(new Set(ALL_ASSIGNMENTS.map(a=>a.slug)).size,ALL_ASSIGNMENTS.length)
 assert.equal(lesson.questions.length,14)
 assert(lesson.questions.find(q=>q.id==='r2-1a')?.reflection)
 assert.equal(lesson.questions.filter(q=>q.independent).length,6)
})
test('saved trials survive server validation and reproduce submission evidence',()=>{
 const lesson=assignmentBySlug('simulation-race-track')!,state=emptyVelocityState()
 state.explorers={'race-trials':encodeRaceTrials([{id:1,conditions:{radius:100,speed:20,laps:0.5,direction:'clockwise'}},{id:2,conditions:{radius:100,speed:40,laps:1,direction:'counterclockwise'}}])}
 state.answers['r2-2a']='314.16';state.attempts['r2-2a']=[{answer:'200',correct:true}]
 const saved=validateVelocityState(state,lesson.questions),trials=decodeRaceTrials(saved.explorers?.['race-trials'])
 assert.equal(trials.length,2);assert.equal(raceMeasurement(trials[0].conditions,1).displacement,200)
 assert.equal(raceMeasurement(trials[1].conditions,1).displacement,0)
 assert.equal(saved.attempts['r2-2a'][0].correct,false)
 assert(missingVelocityAnswers(saved,lesson.questions).includes('r2-5c'))
 assert.deepEqual(decodeRaceTrials([1,100,20,0.5,9]),[])
 assert.deepEqual(decodeRaceTrials([1,100,20]),[])
})
