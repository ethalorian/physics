import { test } from 'node:test'
import assert from 'node:assert/strict'
import { completedSchoolDates, deadlineDay, recentSchoolDates, summarizeLearningPace, validPlanDate, weekDates } from './learning-week'

test('school history excludes today, weekends, holidays, and pre-enrollment days', () => {
 assert.deepEqual(recentSchoolDates('2026-10-13', '2026-09-01', ['2026-10-12']), ['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09'])
 assert.deepEqual(recentSchoolDates('2026-10-07', '2026-10-05', []), ['2026-10-05','2026-10-06'])
 assert.deepEqual(recentSchoolDates('2026-10-07', '2026-10-08', []), [])
})
test('school dates and planning deadlines stay Eastern across midnight and DST', () => {
 assert.equal(deadlineDay('2026-10-08T01:00:00Z'), '2026-10-07')
 assert.equal(deadlineDay('2026-10-08'), '2026-10-08')
 assert.deepEqual(weekDates('2026-11-01'), ['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30'])
 assert.deepEqual(weekDates('2026-11-01',1), ['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06'])
 assert.equal(validPlanDate('2026-02-30'),false)
 assert.equal(validPlanDate('2028-02-29'),true)
})
test('engagement deduplicates active days; learning XP excludes spins, bonuses, games, and today', () => {
 const days=['2026-10-01','2026-10-02','2026-10-05','2026-10-06','2026-10-07']
 const at=(day:string)=>day+'T16:00:00Z'
 const xp=[{source:'math-spine',points:15,earned_at:at(days[0])},{source:'lesson-block',points:10,earned_at:at(days[1])},{source:'daily-spin',points:99,earned_at:at(days[1])},{source:'arcade-payout',points:99,earned_at:at(days[2])},{source:'teacher-bonus',points:99,earned_at:at(days[2])},{source:'vocabulary',points:5,earned_at:'2026-10-08T01:00:00Z'},{source:'math-spine',points:10,earned_at:'2026-10-08T16:00:00Z'}]
 const pace=summarizeLearningPace(days,[at(days[0]),at(days[0]),at(days[1]),'2026-10-08T01:00:00Z','2026-10-08T16:00:00Z'],xp)
 assert.deepEqual(pace,{activeDays:3,engagement:60,learningXp:30,xpRate:6,ready:true})
 assert.equal(summarizeLearningPace(days,days.slice(0,4).map(at),[]).engagement,80)
})
test('no history is not zero engagement, and new students do not trigger a five-day warning',()=>{
 assert.deepEqual(summarizeLearningPace([],[],[]),{activeDays:0,engagement:null,learningXp:0,xpRate:null,ready:false})
 assert.equal(summarizeLearningPace(['2026-10-06'],[],[]).ready,false)
})
test('historical rates use every eligible day and full totals, independent of the recent window', () => {
 const dates = completedSchoolDates('2026-10-14', '2026-10-01', ['2026-10-12'])
 assert.deepEqual(dates, ['2026-10-01','2026-10-02','2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-13'])
 const activity = ['2026-09-30','2026-10-01','2026-10-02','2026-10-06','2026-10-12','2026-10-14'].map(day => day+'T16:00:00Z')
 const xp = activity.map(earned_at => ({ source: 'math-spine', points: 40, earned_at }))
 const recent = summarizeLearningPace(dates.slice(-5), activity, xp)
 const historical = summarizeLearningPace(dates, activity, xp)
 assert.equal(recent.engagement,20)
 assert.equal(recent.xpRate,8)
 assert.equal(historical.activeDays,3)
 assert.equal(historical.engagement,38)
 assert.equal(historical.learningXp,120)
 assert.equal(historical.xpRate,15)
 assert.deepEqual(completedSchoolDates('2026-10-07','2026-10-07',[]),[])
 assert.deepEqual(completedSchoolDates('2026-10-07','2026-10-08',[]),[])
 assert.deepEqual(completedSchoolDates('2026-10-07','2026-10-05',[]),['2026-10-05','2026-10-06'])
})
