import {test} from 'node:test'
import assert from 'node:assert/strict'
import {modelNumber,sameReportedPrecision,scientificIncoming,substitutesVelocity} from './model-math'
import {makeTask,gradeTask} from './tasks'

test('board values preserve exact fractions, signed expressions and safe fallbacks',()=>{
 assert.equal(modelNumber('3/4'),.75)
 assert.equal(modelNumber('-1/8'),-.125)
 assert.equal(modelNumber('2*(3+4)'),14)
 for(const value of ['', '1/0','NaN','Infinity','globalThis.x=1'])assert.equal(modelNumber(value,9),9)
})
test('scientific notation can report equivalent values and precision',()=>{
 for(const [a,b,addition] of [['1.20e1','12.0',true],['1.2e1','12',false],['0.0120','1.20e-2',false],['120e-1','12.0',true]] as const) assert(sameReportedPrecision(a,b,addition),a)
 for(const [a,b,addition] of [['12','12.0',true],['12.00','12.0',true],['1.20e1','12',false],['12.001','12.0',true],['12+0','12',false],['1e999','1e999',false]] as const) assert(!sameReportedPrecision(a,b,addition),a)
})
test('substitution retains supplied signed values, grouping and multiplication',()=>{
 for(const u of [-8,0,8])for(const a of [-5,-1,1,5])for(const t of [2,4,6]){
  for(const raw of [`(${u})+(${a})*(${t})`,`(${t})*(${a})+(${u})`,`(${u})+((${t})*(${a}))`]) assert(substitutesVelocity(raw,u,a,t),raw)
  if(a<0)assert(substitutesVelocity(`(${u})-${-a}*${t}`,u,a,t))
  for(const raw of [`${u+a*t}+0`,`${u+a*t}`,`(${u}+${a})*${t}`])assert(!substitutesVelocity(raw,u,a,t),raw)
 }
})
test('advanced incoming quantity includes both factors and matches the prompt',()=>{
 for(let seed=1;seed<=100;seed++){
  const task=makeTask('QE1',seed,3,2)
  const incoming=scientificIncoming(task.data)
  assert(incoming.includes(`${task.data.a} × 10^${task.data.e}`))
  if(task.data.b!==1||task.data.f!==0)assert(incoming.includes(`${task.data.b} × 10^${task.data.f}`))
  const sub=makeTask('SM2',seed,3,2)
  assert(!gradeTask(sub,{...sub.expected,expression:sub.expected.result+'+0'}).correct)
 }
})

test('estimation inputs use the same fraction parser as the floor model',()=>{
 const task=makeTask('QE3',1,0),area=Number(task.data.length)*Number(task.data.width)*.8,estimate=area/.75
 const answer={area:`${Number(task.data.length)*Number(task.data.width)*4}/5`,space:'3/4',estimate:String(estimate),low:String(estimate*.8),high:String(estimate*1.2),reason:'I leave twenty percent of the floor for aisles and allow three quarters of a square metre per person.'}
 assert(gradeTask(task,answer).correct)
 assert(!gradeTask(task,{...answer,space:'1/0'}).correct)
})
