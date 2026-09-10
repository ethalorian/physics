import test from 'node:test'
import assert from 'node:assert/strict'
import { engagementForStudent, weightedEngagement, validDate, type EngagementEvent } from './student-engagement'
import type { RotationCalendar, MeetingPattern } from './rotation'
const calendar: RotationCalendar = { anchor_date: '2026-08-25', anchor_p1_block: 'A', cycle_offset: 0, no_school_dates: ['2026-09-07'] }
const pattern: MeetingPattern = { blocks: ['G'], weekPattern: 'every' }
function report(overrides: Partial<Parameters<typeof engagementForStudent>[0]> = {}) {
 return engagementForStudent({ id: 'one', name: 'Student', enrolledAt: null, start: '2026-08-25', from: '2026-09-04', to: '2026-09-08', calendar, pattern, scheduleReady: true, events: [], ...overrides })
}
function event(at: string): EngagementEvent { return { userId: 'one', at, source: 'Practice' } }
test('class days skip weekends and school holidays; repeated events count once', () => {
 const student = report({ events: [event('2026-09-04T15:00:00Z'), event('2026-09-04T16:00:00Z'), event('2026-09-05T15:00:00Z')] })
 assert.equal(student.classDays, 2); assert.equal(student.activeClassDays, 1); assert.equal(student.classPercent, 50); assert.equal(student.activeOffDays, 1)
 assert.equal(weightedEngagement(student, 1.5), 125); assert.equal(weightedEngagement(student, 2), 150)
})
test('uses Eastern dates for late evening engagement', () => {
 const student = report({ events: [event('2026-09-05T02:30:00Z')] })
 assert.equal(student.activeClassDays, 1); assert.equal(student.activeOffDays, 0)
})
test('enrollment excludes earlier days and events; other students never count', () => {
 const student = report({ enrolledAt: '2026-09-08T12:00:00Z', events: [event('2026-09-04T15:00:00Z'), { userId: 'other', at: '2026-09-08T15:00:00Z', source: 'Practice' }] })
 assert.equal(student.classDays, 1); assert.equal(student.classPercent, 0); assert.equal(student.days[0].kind, 'excluded'); assert.equal(student.lastActive, null)
})
test('missing calendar is unavailable, never zero engagement or off-day credit', () => {
 const student = report({ scheduleReady: false, events: [event('2026-09-04T15:00:00Z')] })
 assert.equal(student.classPercent, null); assert.equal(student.activeOffDays, 0); assert.equal(student.days[0].active, true); assert.equal(weightedEngagement(student, 2), null)
})
test('no eligible days produces no percentage', () => {
 const student = report({ enrolledAt: '2026-09-10T12:00:00Z' }); assert.equal(student.classDays, 0); assert.equal(student.classPercent, null)
})
test('double-block section counts once per date; alternating off week stays off', () => {
 const student = report({ from: '2026-08-31', to: '2026-09-11', pattern: { blocks: ['B','C'], weekPattern: 'alternate', onWeekAnchor: '2026-08-31' } })
 assert.equal(student.classDays, 5); assert.equal(student.days.find(day => day.date === '2026-09-08')?.kind, 'off')
})
test('rotation drop day is off even on a school weekday', () => {
 const student = report({ from: '2026-08-25', to: '2026-08-26', pattern: { blocks: ['A'], weekPattern: 'every' } })
 assert.equal(student.classDays, 1); assert.equal(student.days[1].kind, 'off')
})
test('day range and local grouping are stable through daylight saving time', () => {
 const student = report({ from: '2026-10-31', to: '2026-11-02', events: [event('2026-11-01T03:30:00Z'), event('2026-11-01T05:30:00Z'), event('2026-11-01T06:30:00Z')] })
 assert.equal(student.days.length, 3); assert.equal(student.activeOffDays, 2)
})
test('invalid calendar dates are rejected', () => { assert(!validDate('2026-02-30')); assert(!validDate('not-a-date')); assert(validDate('2028-02-29')) })

test('recent signal compares equal five-class-day windows and ignores off days', async () => {
 const { recentEngagement } = await import('./student-engagement')
 const days = Array.from({ length: 10 }, (_, index) => ({ date: `2026-09-${String(index+1).padStart(2,'0')}`, kind: 'class' as const, active: index < 2 || index >= 5, sources: [] }))
 const signal = recentEngagement({ days: [...days, { date: '2026-09-11', kind: 'off', active: false, sources: [] }] })
 assert.equal(signal.active, 5); assert.equal(signal.total, 5); assert.equal(signal.change, 60); assert.equal(signal.consecutiveInactive, 0)
})
test('recent inactivity is class-specific; no trend is claimed with fewer than ten dates', async () => {
 const { recentEngagement } = await import('./student-engagement')
 const signal = recentEngagement({ days: [{ date: '2026-09-01', kind: 'class', active: false, sources: [] }, { date: '2026-09-02', kind: 'off', active: true, sources: [] }, { date: '2026-09-03', kind: 'class', active: false, sources: [] }] })
 assert.equal(signal.change, null); assert.equal(signal.consecutiveInactive, 2); assert.equal(signal.total, 2)
})
test('practice follow-up counts each student once and excludes finished or not-yet-due work', async () => {
 const { practiceFollowUp } = await import('./student-engagement')
 const student = { studentId:'one',name:'One',started:0,checks:0,activeDays:0,lastAt:null,ready:0,total:2,complete:false }
 const task = { id:'one',title:'Practice',createdAt:'2026-09-01T12:00:00Z',dueOn:'2026-09-08',students:[student] }
 const result = practiceFollowUp([task,{...task,id:'two'},{...task,id:'future',dueOn:'2026-09-10',students:[{...student,studentId:'future'}]},{...task,id:'done',students:[{...student,studentId:'done',started:2,complete:true}]}], '2026-09-09')
 assert.deepEqual(result.notStarted,['one','future']); assert.deepEqual(result.overdue,['one'])
})

test('average XP includes zero-XP days and off days, excluding before enrollment and outside range', () => {
 const student = report({ enrolledAt:'2026-09-05T12:00:00Z', xpEvents:[
  {userId:'one',at:'2026-09-04T15:00:00Z',points:100},
  {userId:'one',at:'2026-09-05T15:00:00Z',points:12},
  {userId:'one',at:'2026-09-09T02:00:00Z',points:6},
  {userId:'other',at:'2026-09-06T15:00:00Z',points:99},
  {userId:'one',at:'2026-09-09T15:00:00Z',points:88},
 ] })
 assert.deepEqual(student.xp,{earned:18,days:4,averagePerDay:4.5})
 assert.equal(report().xp.averagePerDay,0)
 assert.equal(report({enrolledAt:'2026-09-10T12:00:00Z'}).xp.averagePerDay,null)
})
