import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PLANS, buildLessonPlanHtml, findDay } from './lesson-plan-export'
import { coursePlanAssessment } from './course-plan-assessment'
import { deckForDay } from '@/data/lesson-decks'
import { planVideoSupport } from '@/data/asteroid-video-support'

const counts = [22, 17, 15, 23, 13, 19, 19, 9]
test('all 137 plans keep contiguous identities and the same reader/Word/print content', () => {
  assert.equal(Object.values(PLANS.cpa).flat().length, 137)
  for (const [i, count] of counts.entries()) {
    const unit = `unit-${i + 1}`, days = PLANS.cpa[unit]
    assert.deepEqual(days.map(d => d.day), Array.from({length: count}, (_, n) => n + 1))
    for (const day of days) {
      assert.equal(findDay(unit, day.day, ['honors']), day)
      assert.ok(buildLessonPlanHtml(unit, day).includes(day.bodyHtml))
      assert.ok(buildLessonPlanHtml(unit, day, {forPdf: true}).includes(day.bodyHtml))
      assert.equal(day.bodyHtml.match(/data-video-spine=/g)?.length, 1)
      assert.ok(!day.bodyHtml.includes('data-classroom-alignment='))
    }
  }
})

test('Units 2–8 expose Unit 1 sections, daily checks, track support, and complete 50-minute flows', () => {
  const labels = ["TODAY'S LEARNING TARGETS", 'THE ASTEROID THREAD TODAY', 'Lesson Flow', 'FORMATIVE CHECKS', 'MATERIALS &amp; READING', 'TEACHER NOTES']
  for (let u = 2; u <= 8; u++) for (const day of PLANS.cpa[`unit-${u}`]) {
    let last = -1
    for (const label of labels) {
      const at = day.bodyHtml.indexOf(label)
      assert.ok(at > last, `unit ${u} day ${day.day}: ${label}`)
      last = at
    }
    assert.match(day.bodyHtml, /What students know about 2026-XJ as today opens:/)
    assert.match(day.bodyHtml, /How today connects:/)
    assert.match(day.bodyHtml, /Hewitt reading:/)
    assert.match(day.bodyHtml, /CPA:/)
    assert.match(day.bodyHtml, /Honors:/)
    assert.ok(!day.bodyHtml.includes('Identify / Calculate / Construct / Transfer'))
    const section = day.bodyHtml.match(/<table data-plan-section="flow">([\s\S]*?)<\/table>/)?.[1]
    assert.ok(section)
    const times = [...section.matchAll(/<strong>(\d+)–(\d+) min<\/strong>/g)].map(m => [Number(m[1]), Number(m[2])])
    assert.equal(times[0][0], 0)
    assert.equal(times.at(-1)![1], 50)
    for (let j = 0; j < times.length; j++) {
      assert.ok(times[j][1] > times[j][0])
      if (j) assert.equal(times[j - 1][1], times[j][0])
    }
  }
})

test('two assessment meetings preserve instruction and use the Unit 1 rubric without video coaching', () => {
  for (let u = 2; u <= 7; u++) {
    const unit = `unit-${u}`, days = PLANS.cpa[unit]
    assert.ok(!days.at(-3)!.assessmentStage, 'Synthesis or final instruction remains a teaching day')
    assert.equal(days.at(-2)!.assessmentStage, 'start')
    assert.equal(days.at(-1)!.assessmentStage, 'finish')
    assert.match(days.at(-2)!.bodyHtml, /stays in class/)
    assert.match(days.at(-1)!.bodyHtml, /Peer defense/)
    for (const day of days.slice(-2)) {
      assert.match(day.bodyHtml, /Science \/ Reasoning \/ Communication \/ Transfer-to-Asteroid/)
      assert.match(day.bodyHtml, /independently from 0–4/)
      assert.match(day.bodyHtml, /without averaging/)
      assert.match(day.bodyHtml, /two-week/)
      assert.deepEqual(planVideoSupport(unit, day.day)!.videos, [])
    }
  }
})

test('every formal assessment launches directions with no worked-solution slides for either track', () => {
  let count = 0
  for (const [unit, days] of Object.entries(PLANS.cpa)) for (const day of days) {
    if (!day.assessmentStage) continue
    count++
    const assessment = coursePlanAssessment(unit, day.day)
    assert.ok(assessment)
    for (const track of ['cpa', 'honors']) {
      const deck = deckForDay(unit, day.day, track)
      assert.equal(deck?.src, assessment.src)
      const html = fs.readFileSync(`public${deck!.src}`, 'utf8')
      assert.ok(html.includes('Transfer-to-Asteroid'))
      assert.ok(!html.includes('data-solution="true"'))
      assert.ok(!html.includes('worksheet-guided/solutions'))
      assert.equal((html.match(/class="slide(?: cover)?"/g) ?? []).length, assessment.slides)
    }
  }
  assert.equal(count, 13)
  assert.equal(coursePlanAssessment('unit-1', 21), null, 'Unit 1 reference remains unchanged')
  assert.match(deckForDay('unit-2', 15, 'cpa')!.src, /worksheets/, 'Preparation still has its practice deck')
})
