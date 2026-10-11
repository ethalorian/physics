import test from 'node:test'
import assert from 'node:assert/strict'
import {workMatches, workDueTime, validateWorkDue, type ClassWorkItem} from './class-work'
import {lessonWorkSchedule,sameLessonSchedule} from './lesson-work-schedule'
const now='2026-10-07T16:00:00.000Z',due='2026-10-08T20:00:00.000Z'
const base:ClassWorkItem={id:'a',sourceId:'a',title:'Homework',kind:'homework',context:'',audience:'Whole class',access:'open',dueAt:due,href:'/',canEditDue:true,canToggle:true}
test('attention counts consider active assignments only, never closed or draft work',()=>{
 assert(workMatches(base,'due',Date.parse(now)))
 for(const access of ['draft','closed','unassigned'] as const){assert(!workMatches({...base,access},'due',Date.parse(now)));assert(!workMatches({...base,access,dueAt:'2026-10-01T00:00:00Z'},'past',Date.parse(now)))}
 assert(workMatches({...base,dueAt:'2026-10-01T00:00:00Z'},'past',Date.parse(now)))
 assert(!workMatches({...base,dueAt:null},'due',Date.parse(now)))
})
test('date-only assignments remain due through the local end of their calendar day',()=>{
 const timestamp=workDueTime({...base,dueAt:'2026-10-07',dateOnly:true})
 assert.equal(new Date(timestamp).getDate(),7);assert.equal(new Date(timestamp).getHours(),23)
})
test('closing and reopening preserve the original due date, including late homework',()=>{
 const old={open_at:'2026-10-01T00:00:00Z',close_at:null,due_at:due}
 const closed=lessonWorkSchedule({open_at:null,close_at:null},old,now)
 assert.equal(closed.due_at,due);assert.equal(closed.close_at,now)
 assert.equal(lessonWorkSchedule({access:'open',open_at:now,close_at:null},{...closed,due_at:'2026-10-06T20:00:00.000Z'},now).due_at,'2026-10-06T20:00:00.000Z')
})
test('schedule rejects deadlines before a future opening or after automatic closing',()=>{
 assert.throws(()=>lessonWorkSchedule({open_at:'2026-10-10T00:00:00.000Z',due_at:due},null,now),/opening/)
 assert.throws(()=>lessonWorkSchedule({open_at:now,close_at:'2026-10-08T15:00:00.000Z',due_at:due},null,now),/Close access/)
 assert.equal(lessonWorkSchedule({open_at:now,close_at:null,due_at:due},null,now).close_at,null)
})
test('schedule snapshots compare timestamps as instants and reject stale or newly inserted windows',()=>{
 assert(sameLessonSchedule({open_at:now,close_at:null},{open_at:'2026-10-07T12:00:00-04:00',close_at:null,due_at:null}))
 assert(!sameLessonSchedule(null,{open_at:now,close_at:null}))
 assert(!sameLessonSchedule({open_at:now,close_at:null,due_at:due},{open_at:now,close_at:null,due_at:null}))
})
test('strict date validation rejects impossible dates and preserves date-only values',()=>{
 assert.equal(validateWorkDue(due),due);assert.equal(validateWorkDue(null),null);assert.equal(validateWorkDue('2026-10-07',true),'2026-10-07')
 for(const v of ['2026-02-30', '2026-10-07T16:00',1,undefined])assert.throws(()=>validateWorkDue(v))
 assert.throws(()=>validateWorkDue('2026-02-30',true))
})

test('assignment detail links carry the current list filters for the return journey',async()=>{
 const {assignedWorkDetailHref}=await import('./class-work')
 const href=assignedWorkDetailHref('/admin/control-room?view=quizzes&class=c&id=q','view=assignments&workKind=quiz&workStatus=past&workSearch=motion')
 const p=new URL(href,'https://test').searchParams
 assert.equal(p.get('id'),'q');assert.equal(p.get('class'),'c');assert.equal(p.get('workSearch'),'motion');assert.equal(p.get('fromWork'),'1')
})
