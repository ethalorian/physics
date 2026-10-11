import test from 'node:test'
import assert from 'node:assert/strict'
import { lessonCompletion, missingLessonAnswers } from './lesson-completion'
import type { ContentBlock } from '@/data/content-blocks'
const blocks:ContentBlock[]=[{id:'q',type:'question',capture:true,question:{prompt:'Which way?',options:[{id:'a',text:'Right'},{id:'b',text:'Left'}]}},{id:'exit',type:'exit_ticket',capture:true,prompt:'Explain.'},{id:'optional',type:'exit_ticket',capture:true,prompt:'More practice',requiredForCompletion:false}]
const answers=[{block_id:'q',response:{optionId:'b'},created_at:'2026-09-28T12:00:00Z'},{block_id:'exit',response:{text:'Displacement includes direction.'},created_at:'2026-09-28T12:01:00Z'}]
const submitted={submitted_at:'2026-09-28T12:02:00Z',reviewed:false}
test('watching/visiting alone cannot count as submitting',()=>{const s=lessonCompletion(blocks,[]);assert.equal(s.state,'not_started');assert.equal(s.progress,0)})
test('all required answers are ready, never complete without a submission',()=>{const s=lessonCompletion(blocks,answers);assert.equal(s.state,'ready');assert.equal(s.progress,67);assert.equal(s.required,2);assert.deepEqual(missingLessonAnswers(blocks,answers),[])})
test('wrong but complete attempts are evidence; optional work does not block',()=>{assert.deepEqual(missingLessonAnswers(blocks,[...answers,{block_id:'optional',response:{text:''},created_at:'2026-09-28T12:00:00Z'}]),[])})
test('an incomplete latest answer overrides an earlier full answer',()=>{assert.deepEqual(missingLessonAnswers(blocks,[...answers,{block_id:'exit',response:{text:''},created_at:'2026-09-28T12:03:00Z'}]).map(b=>b.id),['exit'])})
test('only a confirmed submission gives 100 percent',()=>{assert.equal(lessonCompletion(blocks,answers,submitted).state,'submitted');assert.equal(lessonCompletion(blocks,answers,submitted).progress,100)})
test('teacher review alone does not require another submission',()=>{assert.equal(lessonCompletion(blocks,answers,{...submitted,reviewed:true}).state,'reviewed')})
test('saved revisions and pending drafts require resubmission',()=>{for(const [a,d] of [[[{...answers[1],created_at:'2026-09-28T12:03:00Z'}],[]],[[],[{block_id:'exit',updated_at:'2026-09-28T12:03:00Z'}]]] as const){const s=lessonCompletion(blocks,[...answers,...a],{...submitted,reviewed:true},[...d]);assert.equal(s.state,'revision');assert(s.progress<100)}})
test('drafts for removed/invisible blocks do not change submission state',()=>{assert.equal(lessonCompletion(blocks,answers,{...submitted,reviewed:true},[{block_id:'honors-only',updated_at:'2026-09-28T12:03:00Z'}]).state,'reviewed')})
test('unreviewed snapshot stays submitted even when new live-poll work exists',()=>{assert.equal(lessonCompletion(blocks,[...answers,{...answers[1],created_at:'2026-09-28T12:03:00Z'}],submitted).state,'submitted')})
