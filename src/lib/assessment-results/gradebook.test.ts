import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assignmentStats, completion, entryChanged, entrySnapshot, entryValue, letterGrade, quizTotal, releasedGrade, sortRoster } from './gradebook'
import { validSuggestion } from './suggestions'
import type { ResultActivity,ResultCell } from './types'
const cell=(earned:number,possible:number):ResultCell=>({state:'reviewed',label:'Released',needsReview:false,grade:{earned,possible,version:'v1'}})
const activity=(cells:Record<string,ResultCell>,extra:Partial<ResultActivity>={}):ResultActivity=>({key:'quiz:a',sourceId:'a',kind:'quiz',title:'Quiz',unitIds:['u1'],dueAt:null,archived:false,cells,...extra})
test('overall is point weighted, counts a true zero, and excludes unreleased work',()=>{
  const rows=[activity({s:cell(9,10)}),activity({s:cell(0,30)}),activity({s:{state:'submitted',label:'100% suggested',needsReview:true}})]
  assert.deepEqual(quizTotal(rows,'s'),{earned:9,possible:40,percent:22.5,count:2})
  assert.equal(quizTotal([rows[2]],'s').percent,null)
  assert.equal(releasedGrade(rows[2].cells.s),null)
})
test('completion includes pending submissions and excludes excused, archived, optional and year-long competencies',()=>{
  const rows=[activity({s:{state:'submitted',label:'Pending',needsReview:true},t:{state:'not_started',label:'Not started',needsReview:false},ex:{state:'excused',label:'EX',needsReview:false},optional:{state:'not_started',label:'Not chosen',needsReview:false}}),activity({s:cell(1,1)},{crossUnit:true,kind:'math'}),activity({s:cell(1,1)},{archived:true})]
  assert.deepEqual(completion(rows),{completed:1,assigned:2})
  assert.deepEqual(completion(rows,'s'),{completed:1,assigned:1})
})
test('class average and released count exclude drafts and retain zero',()=>{
  const stats=assignmentStats(activity({a:cell(10,10),b:cell(0,10),c:{state:'submitted',label:'Pending',needsReview:true}}))
  assert.deepEqual(stats,{assigned:3,completed:3,released:2,pending:1,average:50})
})
test('plus/minus letters match rounded display and numeric copies exclude percent symbols',()=>{
  assert.equal(letterGrade(89.96),'A-');assert.equal(letterGrade(89.94),'B+');assert.equal(letterGrade(0),'F');assert.equal(letterGrade(97),'A+')
  const grade=releasedGrade(cell(23,24))!;assert.equal(entryValue(grade,'percent'),'95.8');assert.equal(entryValue(grade,'letter'),'A')
})
test('entry markers detect new releases, changed values and changed formats',()=>{
  const grade=releasedGrade(cell(0,10))!,mark=entrySnapshot(grade,'percent')
  assert.equal(entryChanged(mark,grade,'percent'),false)
  assert.equal(entryChanged(mark,grade,'letter'),true)
  assert.equal(entryChanged(mark,{...grade,version:'v2'}),true)
  assert.equal(entryChanged(mark,null),true)
})
test('private suggestions require exact target coverage and authored point bounds',()=>{
  const result={summary:'Evidence',next_time:'Use a labeled diagram.',ratings:[{target_id:'t',level:null,rationale:'Drawing requires teacher inspection.'}],scores:[]}
  assert.equal(validSuggestion(result,['t'],[]),true)
  assert.equal(validSuggestion({...result,ratings:[...result.ratings,...result.ratings]},['t','u'],[]),false)
  assert.equal(validSuggestion({...result,scores:[{id:'q',earned:5,possible:4,feedback:'Reason'}]},['t'],[{id:'q',possible:4}]),false)
})

test('Aspen roster sorting uses the stored surname, preserving compound family names',()=>{
 const sorted=sortRoster([{id:'1',name:'Barbara Gonzalez Lopez',firstName:'Barbara',lastName:'Gonzalez Lopez'},{id:'2',name:'Kai Hall',firstName:'Kai',lastName:'Hall'}],'last')
 assert.equal(sorted[0].id,'1')
})
