import assert from 'node:assert/strict'
import test from 'node:test'
import { dailyZenReflection, ZEN_REFLECTIONS } from './daily-zen'
import { calendarBannerAssignment, studentBannerAssignments, homeDeadlineLabel, nextStudentHomeTask, STUDENT_HOME_THEMES } from './student-home-banner'
import { schoolDayKey } from './school-day'
import type { StudentAssignment } from './student-dashboard'
import type { StudentBannerCourse, StudentBannerRow, StudentGradebookRow } from './student-gradebook'
import type { LearningActivity } from './learning-week'

const today = '2026-10-22'
const now = new Date(today + 'T16:00:00Z')
const row = (patch: Partial<StudentBannerRow> = {}): StudentBannerRow => ({
  key: 'quiz:q', title: 'Motion quiz', dueAt: '2026-10-19', archived: false,
  status: 'missing', statusLabel: 'Missing', href: '/quizzes/q', ...patch,
})
const assignment = (patch: Partial<StudentAssignment> = {}): StudentAssignment => ({ id: 'reading:r1', kind: 'reading', title: 'Investigating motion', href: '/readings/r1', due: '2026-10-25', complete: false, status: 'To do', action: 'Start reading', ...patch })
const math: LearningActivity = { id: 'math:today', kind: 'math', title: 'Slope as a rate of change', href: '/dashboard/math-spine/warmup', due: null, complete: false, status: 'Ready to start', action: 'Start math warm-up' }
const task = (items: LearningActivity[], flags: { loading?: boolean; incomplete?: boolean } = {}) => nextStudentHomeTask({
  items: items.map(item => calendarBannerAssignment(item, today)), today, loading: false, incomplete: false, ...flags,
})

test('the approved collection provides 365 short, distinct days with explicit provenance', () => {
  const days = Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10))
  assert.equal(new Set(days.map(day => dailyZenReflection(day).id)).size, 365)
  assert.equal(new Set(ZEN_REFLECTIONS.map(entry => entry.text)).size, 365)
  assert.equal(ZEN_REFLECTIONS.filter(entry => entry.treatment !== 'original').length, 25)
  for (const entry of ZEN_REFLECTIONS) {
    assert.ok(entry.text.split(/\s+/).length <= 20)
    if (entry.treatment === 'original') { assert.match(entry.credit, /^Original Zen-inspired/); assert.equal(entry.url, null) }
    else { assert.match(entry.url!, /^https:\/\//); assert.ok(entry.source) }
  }
  assert.equal(dailyZenReflection('2027-01-01').id, dailyZenReflection('2026-01-01').id)
})

test('the saying changes at Eastern midnight, not UTC midnight or a DST clock change', () => {
  const at = (stamp: string) => dailyZenReflection(schoolDayKey(new Date(stamp))).id
  assert.equal(at('2026-10-22T23:00:00Z'), at('2026-10-23T03:59:59Z'))
  assert.notEqual(at('2026-10-23T03:59:59Z'), at('2026-10-23T04:00:00Z'))
  assert.equal(at('2026-03-08T06:30:00Z'), at('2026-03-08T07:30:00Z'))
  assert.equal(at('2026-11-01T05:30:00Z'), at('2026-11-01T06:30:00Z'))
  assert.equal(new Set(['2028-02-28', '2028-02-29', '2028-03-01'].map(day => dailyZenReflection(day).id)).size, 3)
  assert.throws(() => dailyZenReflection('2026-02-30'), RangeError)
})

test('today shows every unfinished assignment and its warm-up ahead of older and future work', () => {
  const earlier = assignment({ due: '2026-10-20' })
  const quiz = assignment({ id: 'quiz:q', due: today, title: 'Motion quiz', href: '/quizzes/q', action: 'Start quiz' })
  const later = assignment({ due: '2026-10-23' })
  const result = task([earlier, later, quiz, math])
  assert.equal(result?.title, 'Motion quiz')
  assert.deepEqual(result?.links?.map(link => [link.title, link.href]), [['Start quiz', '/quizzes/q'], [math.title, math.href]])
  assert.equal(task([earlier, { ...quiz, complete: true }, math])?.title, math.title)
})

test('the catch-up suggestion opens the oldest outstanding activity with its real action destination', () => {
  const overdue = row({ key: 'quiz:old', dueAt: '2026-10-18', href: '/readings/prerequisite', prerequisites: [{id:'pre', title:'Required reading'}] })
  const courses = [{courseId:'physics', rows:[row(), overdue]}]
  const items = studentBannerAssignments([{ ...math, complete: true }], courses, today, now)
  const result = nextStudentHomeTask({items, today, loading:false, incomplete:false})
  assert.equal(result?.title, 'Today’s work is complete')
  assert.deepEqual(result?.links?.map(link => [link.title, link.href]), [['Get Caught Up', overdue.href]])
  assert.equal(nextStudentHomeTask({items:items.filter(item => item.day !== today), today, loading:false, incomplete:false})?.title, 'Nothing due today')
})

test('catch-up requires an outstanding gradebook row, even when the calendar says past due', () => {
  const calendar = [assignment({id:'review:optional', due:null, closesAt:'2026-10-01'}),
    assignment({id:'reading:removed', due:'2026-10-02'}), assignment({id:'quiz:q', due:'2026-10-04'})]
  const choose = (courses: StudentBannerCourse[]) => nextStudentHomeTask({
    items:studentBannerAssignments(calendar, courses, today, now), today, loading:false, incomplete:false,
  })
  for (const override of [{homeworkWaived:true}, {status:'revise' as const, homeworkWaived:true}, {status:'pending' as const},
    {status:'graded' as const}, {status:'completed' as const}, {status:'excused' as const}, {archived:true},
    {dueAt:null}, {dueAt:'2026-10-25'}]) {
    assert.match(choose([{courseId:'A',rows:[row(override)]}])!.title, /Congratulations/)
  }
  const required = row({key:'interactive:lab', title:'Acceleration Studio', status:'in_progress', href:'/interactive-assignments/lab'})
  const waived = row({key:'reflection:chapter',homeworkWaived:true})
  const shared = row({key:'lesson:chapter',title:'Chapter response',dueAt:'2026-10-18',href:'/lessons/chapter'})
  for (const courses of [[{courseId:'B',rows:[required,shared]}, {courseId:'A',rows:[waived]}],
    [{courseId:'A',rows:[waived]}, {courseId:'B',rows:[required,shared]}]]) {
    assert.equal(choose(courses)?.links?.[0].href, shared.href)
  }
  assert.equal(choose([{courseId:'A',rows:[waived,required]}])?.links?.[0].href,required.href)
})

test('future work does not prevent congratulations, and partial data never promises completion', () => {
  const done = assignment({ due: today, complete: true })
  assert.match(task([assignment(), done])!.title, /Congratulations/)
  assert.match(task([done])!.meta, /diligent/)
  assert.equal(task([done])?.links, undefined)
  assert.equal(task([], { loading: true }), null)
  assert.match(task([assignment({ due: '2026-10-18' })], { incomplete: true })!.title, /couldn’t load/)
  const known = assignment({ due: today })
  assert.equal(task([known], { incomplete: true })?.title, known.title)
})

test('an Eastern deadline stays in today’s list through the school day and closing windows honor midnight', () => {
  const lateToday = assignment({ due: '2026-10-23T01:00:00Z' })
  assert.equal(task([lateToday])?.title, lateToday.title)
  const closing = assignment({ due: null, closesAt: '2026-10-23T04:00:00Z' })
  assert.equal(task([closing])?.title, closing.title)
})

test('a teacher preview uses the selected learner’s recorded state and prerequisite links', () => {
  const row: StudentGradebookRow = { key: 'quiz:q', title: 'Motion quiz', href: '/readings/pre', kind: 'quiz',
    unitIds: [], termId: null, manualTerm: false, dueAt: today, archived: false, status: 'upcoming', statusLabel: 'Locked · finish reading',
    prerequisites: [{id:'pre',title:'Reading'}], grade: null, feedback: null, releasedAt: null, submittedAt: null }
  const items = studentBannerAssignments([], [{courseId:'A',rows:[row, {...row,key:'done',status:'pending'}, {...row,key:'ex',status:'excused'}, {...row,key:'gone',archived:true}]}],today,now)
  assert.deepEqual(items.map(item => [item.id,item.complete]), [['quiz:q', false], ['done',true]])
  assert.deepEqual(nextStudentHomeTask({items,today,loading:false,incomplete:false})?.links, [{id:'quiz:q',title:'Open prerequisite',href:row.href}])
  const own = studentBannerAssignments([assignment({id:'quiz:q',due:today}), assignment({id:'other-course',due:today})],
    [{courseId:'A',rows:[{...row,status:'pending'}, {...row,key:'presentation:p',title:'Exit ticket',status:'missing'}]}], today, now)
  assert.deepEqual(own.map(item => [item.id,item.complete]), [['quiz:q',true], ['other-course',false], ['presentation:p',false]])
})

test('deadline labels preserve school dates and the correct Eastern time', () => {
  assert.equal(homeDeadlineLabel('2026-10-22', today), 'Due today')
  assert.equal(homeDeadlineLabel('2026-10-24T03:59:00Z', today), 'Due tomorrow · 11:59 pm')
  assert.equal(homeDeadlineLabel('2026-11-02T04:30:00Z', '2026-11-01'), 'Due today · 11:30 pm')
  assert.match(homeDeadlineLabel('2026-10-21', today), /^Past due Oct 21/)
  assert.equal(homeDeadlineLabel(null, today), 'Ready to start')
})

test('each calendar month has a distinct seasonal palette', () => {
  assert.equal(STUDENT_HOME_THEMES.length, 12)
  assert.equal(new Set(STUDENT_HOME_THEMES.map(theme => theme.base)).size, 12)
  assert.equal(STUDENT_HOME_THEMES[9].name, 'Halloween season')
  assert.equal(STUDENT_HOME_THEMES[11].name, 'Christmas & holidays')
})

test('undated and invalid assignments do not enter the daily or catch-up queue', () => {
  for (const due of [null, 'invalid']) assert.match(task([assignment({due})])!.title, /Congratulations/)
})
