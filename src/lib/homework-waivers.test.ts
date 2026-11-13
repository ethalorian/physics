import assert from 'node:assert/strict'
import test from 'node:test'
import { calendarHomeworkRequired, waivedHomeworkRow } from './homework-waivers'
import { isStudentHomework, studentHomeworkTotal, type StudentGradebookRow } from './student-gradebook'
import { nextStudentHomeTask, studentBannerAssignments } from './student-home-banner'

const keys = new Set(['lesson:chapter', 'reading:motion'])
const row: StudentGradebookRow = { key:'reflection:chapter', title:'Chapter response', kind:'reflection', dueAt:'2026-10-22',
  archived:false, unitIds:[], termId:null, manualTerm:false, href:'/lessons/chapter', status:'missing', statusLabel:'Missing',
  grade:null, feedback:null, releasedAt:null, submittedAt:null }
const now = new Date('2026-11-13T16:00:00Z')
test('unfinished waived work leaves missing homework and its denominator; completed work still counts', () => {
  const excused = waivedHomeworkRow(row,keys)
  assert.equal(excused.status,'excused')
  assert.equal(isStudentHomework(excused,now),false)
  for (const status of ['pending','completed','graded'] as const) {
    const submitted = { ...row,status,submittedAt:'2026-10-20',feedback:'Good work' }
    assert.equal(waivedHomeworkRow(submitted,keys),submitted)
    assert.equal(studentHomeworkTotal([excused,submitted],'all',now).percent,100)
  }
  for (const key of ['quiz:chapter','interactive:lab','worksheet:nov10']) assert.equal(waivedHomeworkRow({...row,key},keys).status,'missing')
})
test('returned feedback and grade history survive, with no catch-up action or late revision requirement', () => {
  const revision = waivedHomeworkRow({...row,key:'reading:motion',status:'revise',feedback:'Review graph',submittedAt:'2026-10-21'},keys)
  assert.equal(revision.status,'revise'); assert.equal(revision.feedback,'Review graph')
  assert.equal(isStudentHomework(revision,now),false)
  const items = studentBannerAssignments([{ id:revision.key, kind:'reading', title:'Motion', due:row.dueAt,
    href:revision.href,complete:false,status:'Revise',action:'Open' }],[revision],'2026-11-13')
  assert.match(nextStudentHomeTask({items,today:'2026-11-13',loading:false,incomplete:false})!.title,/Congratulations/)
})
test('a shared lesson is still required in any other course; the worksheet never waives its quiz', () => {
  const scoped = {'lesson:chapter':['A'],'worksheet:paper':['A']}
  assert.equal(calendarHomeworkRequired({id:'video:chapter',courseId:'A'},scoped),false)
  assert.equal(calendarHomeworkRequired({id:'lesson:chapter',courseId:'B'},scoped),true)
  assert.equal(calendarHomeworkRequired({id:'worksheet:paper'},scoped),false)
  assert.equal(calendarHomeworkRequired({id:'quiz:paired'},scoped),true)
})
