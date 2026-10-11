import test from 'node:test'
import assert from 'node:assert/strict'
import { lessonReadingDraft } from './lesson-reading'
import { lessonReadingKey, parseLessonReadingKey } from './lesson-reading-key'
import { validateReading } from './textbook-assignments'
import seed from '../../scripts/physics-learning/seed.json'
import type { ReadingBlock } from '@/data/content-blocks'
const id='00000000-0000-4000-8000-000000000001'
const lesson=seed.lessons.find(l=>l.slug==='position-and-displacement')!
const block=lesson.content_blocks.blocks.find(b=>b.type==='reading') as ReadingBlock
const target={id,slug:'u1.vocab-position-distance-displacement',statement:'Position, distance and displacement.',unit_id:'unit-1',domain:'knowledge',program:'physics'}
let i=10;const newId=()=>`00000000-0000-4000-8000-${String(i++).padStart(12,'0')}`
test('authored reading creates three collected checks on the original target, with no due date or auto-publish',()=>{
 const draft=lessonReadingDraft(lesson,block,id,[target],'physics',newId)
 assert.equal(draft.questions.length,3);assert(draft.questions.every(q=>q.target_id===id));assert.equal(draft.status,'draft');assert.equal(draft.due_at,null)
 assert.equal(validateReading(draft).origin_key,lessonReadingKey(lesson.id,block.id));assert.equal(draft.reading,'Sections 5.1 · printed p. 69')
})
test('cross-curriculum or missing targets stay unresolved and cannot publish',()=>{
 for(const targets of [[],[{...target,program:'trades'}]]){
 const draft=lessonReadingDraft(lesson,block,id,targets,'physics',newId)
 assert(draft.questions.every(q=>q.target_id===''));assert.throws(()=>validateReading({...draft,status:'published'}))
 }
})
test('lesson reading links validate full UUID structure and reject malformed keys',()=>{
 const draft=lessonReadingDraft(lesson,block,id,[target],'physics',newId)
 assert.deepEqual(parseLessonReadingKey(draft.origin_key!),{lessonId:lesson.id,blockId:block.id})
 for(const key of ['lesson:------------------------------------:reading','lesson:'+id+':bad block','https://example.com']){
 assert.equal(parseLessonReadingKey(key),null);assert.throws(()=>validateReading({...draft,origin_key:key}))
 }
})
