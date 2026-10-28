import {test} from 'node:test'
import assert from 'node:assert/strict'
import {assessmentValidationIssues, validAssessment} from './analytics'
import {normalizeAssessmentEnums} from './assessment-response'
import {ALL_ASSIGNMENTS, assignmentByDay, objectiveQuestion} from './catalog'

const lesson = assignmentByDay(7)!
function fixture() {
  const rating = {level: 2, confidence: 'medium', rationale: 'Velocity changes by the stated amount each second.', feedback: 'Check the acceleration sign.'}
  const evidence = {status: 'partial', reason: 'The direction needs an explanation.'}
  return {...rating, explanation: {...evidence},
    items: lesson.questions.filter(q => !objectiveQuestion(q) && !q.reflection).map(q => ({id: q.id, ...evidence})),
    ratings: lesson.targets.map(target_slug => ({target_slug, ...rating})),
    weakpoints: [{concept: 'Design & defend', question_ids: ['r2-6a'], reason: 'Support the design with a calculation.', next_step: 'Calculate the final velocity.'}],
  }
}

test('Day 7 capitalization differences no longer discard otherwise valid suggestions', () => {
  const expected = fixture(), raw = fixture()
  raw.weakpoints[0].concept = 'Design & Defend'
  assert.equal(validAssessment(raw, lesson), false)
  assert.deepEqual(assessmentValidationIssues(raw, lesson), ['weakpoints.0.concept'])
  assert.deepEqual(normalizeAssessmentEnums(raw, lesson), expected)
  assert.equal(validAssessment(normalizeAssessmentEnums(raw, lesson), lesson), true)
  assert.equal(raw.weakpoints[0].concept, 'Design & Defend', 'Do not mutate the provider response')
})

test('only case is restored for known enum fields; assessment text and scores are retained', () => {
  const expected = fixture(), raw = fixture()
  raw.confidence = 'MEDIUM'; raw.explanation.status = 'Partial'
  raw.items.forEach(item => {item.id = item.id.toUpperCase(); item.status = 'PARTIAL'})
  raw.ratings.forEach(rating => {rating.target_slug = rating.target_slug.toUpperCase(); rating.confidence = 'Medium'})
  raw.weakpoints[0].question_ids = ['R2-6A']
  assert.deepEqual(normalizeAssessmentEnums(raw, lesson), expected)
})

test('missing, duplicate, unrelated, oversized, and malformed evidence still fails', () => {
  const base = fixture()
  const invalid: unknown[] = [null, [], {...base, level: '2'}, {...base, level: 4}, {...base, confidence: 'likely'},
    {...base, items: base.items.slice(1)}, {...base, items: [...base.items.slice(1), base.items[1]]},
    {...base, items: [null, ...base.items.slice(1)]}, {...base, ratings: [null]},
    {...base, ratings: [{...base.ratings[0], target_slug: 'unrelated'}]},
    {...base, feedback: 'x'.repeat(1601)}, {...base, explanation: {...base.explanation, reason: 'x'.repeat(801)}},
    {...base, weakpoints: [{...base.weakpoints[0], concept: 'Design and defend'}]},
    {...base, weakpoints: [{...base.weakpoints[0], question_ids: ['r2-6a', 'R2-6A']}]},
    {...base, weakpoints: [{...base.weakpoints[0], question_ids: []}]},
    {...base, weakpoints: [{...base.weakpoints[0], question_ids: ['unknown']}]},
  ]
  for (const raw of invalid) assert.equal(validAssessment(normalizeAssessmentEnums(raw, lesson), lesson), false)
})

test('validation diagnostics contain field paths, never response contents', () => {
  const raw = fixture(); raw.confidence = 'PRIVATE_RESPONSE_MARKER'; raw.weakpoints[0].concept = 'PRIVATE_RESPONSE_MARKER'
  assert.deepEqual(assessmentValidationIssues(raw, lesson), ['assessment.confidence', 'weakpoints.0.concept'])
})

test('catalog enums are unambiguous under case folding', () => {
  for (const assignment of ALL_ASSIGNMENTS) {
    for (const options of [assignment.questions.map(q => q.id), assignment.targets, assignment.sections.map(s => s.title)]) {
      assert.equal(new Set(options.map(value => value.toLowerCase())).size, new Set(options).size, assignment.slug)
    }
  }
})
