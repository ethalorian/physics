/**
 * Regression tests for the item template engine and its grid validator.
 * Run: npm run test:item-template   (tsx --test, Node's built-in runner — no framework dep)
 *
 * The contract under test (2026-09-04 audit):
 *  - validateTemplate proves ONE seed; validateTemplateGrid proves the whole
 *    variable grid, because a template that passes on one roll can still hand a
 *    student an unanswerable item on another.
 *  - The walk is deterministic — same template in, same result out, cap or no cap.
 *  - Issues are aggregated: a count per kind and ONE example, never 20,000 rows.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  instantiateTemplate,
  validateTemplate,
  validateTemplateGrid,
  type GridValidationResult,
  type ItemTemplate,
  type TemplateIssueKind,
} from './math-item-template'

const kinds = (r: GridValidationResult): TemplateIssueKind[] => r.issues.map((i) => i.kind)
const countOf = (r: GridValidationResult, k: TemplateIssueKind): number =>
  r.issues.find((i) => i.kind === k)?.count ?? 0

// --- a template that is genuinely fine -------------------------------------

const CLEAN_PROMPT = 'A cart travels {d} m in {t} s at constant speed. What is its speed?'
const CLEAN: ItemTemplate = {
  vars: { d: { min: 100, max: 200, step: 10 }, t: { min: 4, max: 8, step: 1 } },
  answer: 'd / t',
  answerUnit: 'm/s',
  sigFigs: 3,
}

test('clean template: whole grid walked, no issues', () => {
  const r = validateTemplateGrid(CLEAN_PROMPT, CLEAN)
  assert.equal(r.error, undefined)
  assert.equal(r.total, 11 * 5)
  assert.equal(r.sampled, 55)
  assert.equal(r.truncated, false)
  assert.deepEqual(r.issues, [])
  assert.equal(r.ok, true)
})

test('the one-seed validator still behaves exactly as before', () => {
  assert.equal(validateTemplate(CLEAN_PROMPT, CLEAN), null)
  assert.equal(validateTemplate(CLEAN_PROMPT, { vars: {}, answer: 'd' }), 'Add at least one variable.')
  assert.equal(
    validateTemplate('no slots here', CLEAN),
    'The prompt never uses {d}.',
  )
  // and it still instantiates deterministically
  const a = instantiateTemplate(CLEAN_PROMPT, CLEAN, 'seed-1')
  const b = instantiateTemplate(CLEAN_PROMPT, CLEAN, 'seed-1')
  assert.deepEqual(a, b)
  assert.match(a.answerKey, /m\/s$/)
})

// --- one test per issue kind ------------------------------------------------

test('key-zero: percent error with estimate == true value', () => {
  // The live QE4 shape: "estimated 100, true 100" → key 0, unanswerable as posed.
  const r = validateTemplateGrid(
    'You estimated {est} and the true value is {tru}. What is the percent error?',
    {
      vars: { est: { min: 98, max: 102, step: 1 }, tru: { min: 98, max: 102, step: 1 } },
      answer: 'abs(est - tru) / tru * 100',
      answerUnit: '%',
    },
  )
  assert.equal(r.ok, false)
  assert.equal(r.total, 25)
  assert.deepEqual(kinds(r), ['key-zero'])
  assert.equal(countOf(r, 'key-zero'), 5) // the five est == tru rolls
  assert.equal(r.issues[0].example.values.est, r.issues[0].example.values.tru)
  assert.equal(r.issues[0].example.answerKey, '0 %')
})

test('key-equals-given: component that reduces to a printed value', () => {
  // The live GV3 shape: at 0°, f·cos(θ) is just f — typing the given earns ✓.
  const r = validateTemplateGrid(
    'A force of {f} N acts at {ang} degrees above the horizontal. Find the horizontal component.',
    {
      vars: { f: { min: 10, max: 20, step: 5 }, ang: { min: 0, max: 30, step: 10 } },
      answer: 'f * cos(ang)',
      answerUnit: 'N',
    },
  )
  assert.equal(r.ok, false)
  assert.deepEqual(kinds(r), ['key-equals-given'])
  assert.equal(countOf(r, 'key-equals-given'), 3) // one per f at ang = 0
  assert.equal(r.issues[0].example.values.ang, 0)
  assert.match(r.issues[0].example.detail, /\{f\}/)
})

test('rounding-outside-tolerance: a key coarser than the checker accepts', () => {
  // The live QE1 shape: sigFigs 2 is COARSER than the 1% tolerance, so the
  // exact answer is judged wrong against the published key.
  const r = validateTemplateGrid('Report {n} to two significant figures.', {
    vars: { n: { min: 104, max: 108, step: 1 } },
    answer: 'n',
    sigFigs: 2,
  })
  assert.equal(r.ok, false)
  assert.deepEqual(kinds(r), ['rounding-outside-tolerance'])
  assert.equal(countOf(r, 'rounding-outside-tolerance'), 5) // every roll
  assert.match(r.issues[0].example.detail, /not accepted against the key/)
  // …and the same shape at 3 sig figs is inside tolerance
  const ok3 = validateTemplateGrid('Report {n} to three significant figures.', {
    vars: { n: { min: 104, max: 108, step: 1 } },
    answer: 'n',
    sigFigs: 3,
  })
  assert.equal(countOf(ok3, 'rounding-outside-tolerance'), 0)
})

test('non-finite: division by zero somewhere in the grid', () => {
  const r = validateTemplateGrid('Divide {a} by {b}.', {
    vars: { a: { min: 1, max: 3, step: 1 }, b: { min: 0, max: 2, step: 1 } },
    answer: 'a / b',
  })
  assert.equal(r.ok, false)
  assert.ok(kinds(r).includes('non-finite'))
  assert.equal(countOf(r, 'non-finite'), 3) // b = 0 for each of the three a values
  assert.equal(r.issues[0].example.values.b, 0)
  assert.equal(r.issues[0].example.exact, null)
})

test('unfilled-slot: the prompt names a slot the template never defines', () => {
  const r = validateTemplateGrid('What is {a} times {c}?', {
    vars: { a: { min: 2, max: 4, step: 1 } },
    answer: 'a * 2',
  })
  assert.equal(r.ok, false)
  assert.ok(kinds(r).includes('unfilled-slot'))
  assert.equal(countOf(r, 'unfilled-slot'), 3)
  assert.match(r.issues.find((i) => i.kind === 'unfilled-slot')!.example.detail, /\{c\}/)
})

test('studentSigFigs: opt-in check that a coarser correct answer survives', () => {
  // A 3-sig-fig key is inside tolerance of the exact value, so the default walk
  // is clean — but a student who rounds to 2 sig figs can land ~5% away, which
  // the 1% tolerance cannot absorb. Off by default; on when asked.
  const prompt = 'A pallet holds {d} boxes of ten. How many items?'
  const tpl: ItemTemplate = {
    vars: { d: { min: 101, max: 105, step: 1 } },
    answer: 'd * 10',
    sigFigs: 3,
  }
  const off = validateTemplateGrid(prompt, tpl)
  assert.equal(countOf(off, 'rounding-outside-tolerance'), 0)
  const on = validateTemplateGrid(prompt, tpl, { studentSigFigs: 2 })
  assert.ok(countOf(on, 'rounding-outside-tolerance') > 0)
  assert.match(on.issues[0].example.detail, /rounded to 2 sig figs/)
})

// --- the blow-up guard ------------------------------------------------------

const BIG_PROMPT = 'Combine {a} and {b}.'
const BIG: ItemTemplate = {
  vars: { a: { min: 0, max: 99, step: 1 }, b: { min: 0, max: 99, step: 1 } },
  answer: 'a + b + 1000',
}

test('sampling cap: the full product is walked when it fits', () => {
  const r = validateTemplateGrid(BIG_PROMPT, BIG)
  assert.equal(r.total, 10000)
  assert.equal(r.sampled, 10000)
  assert.equal(r.truncated, false)
  assert.equal(r.cap, 20000)
})

test('sampling cap: an oversized grid is sampled evenly and reproducibly', () => {
  const r = validateTemplateGrid(BIG_PROMPT, BIG, { maxCombinations: 100 })
  assert.equal(r.total, 10000)
  assert.equal(r.truncated, true)
  assert.ok(r.sampled <= 100, `sampled ${r.sampled} should be <= 100`)
  assert.ok(r.sampled >= 81, `sampled ${r.sampled} should still fill the budget`)
  // deterministic: no Math.random anywhere in the walk
  const again = validateTemplateGrid(BIG_PROMPT, BIG, { maxCombinations: 100 })
  assert.deepEqual(again, r)
})

test('sampling cap: the sample keeps the endpoints, so edge rolls are still caught', () => {
  // b = 0 only appears if the sample includes the low end of b's range.
  const r = validateTemplateGrid('Divide {a} by {b}.', {
    vars: { a: { min: 1, max: 100, step: 1 }, b: { min: 0, max: 99, step: 1 } },
    answer: 'a / b',
  }, { maxCombinations: 50 })
  assert.equal(r.total, 10000)
  assert.equal(r.truncated, true)
  assert.ok(countOf(r, 'non-finite') > 0, 'the b = 0 edge must survive sampling')
})

// --- structural problems come back as an error, not a crash -----------------

test('structural problems are reported, never thrown', () => {
  const noVars = validateTemplateGrid('nothing here', { vars: {}, answer: '1' })
  assert.equal(noVars.ok, false)
  assert.equal(noVars.error, 'Add at least one variable.')
  assert.deepEqual(noVars.issues, [])

  const badRange = validateTemplateGrid('{a}', { vars: { a: { min: 5, max: 1 } }, answer: 'a' })
  assert.equal(badRange.ok, false)
  assert.match(badRange.error ?? '', /min/)

  const badExpr = validateTemplateGrid('{a}', { vars: { a: { min: 1, max: 3 } }, answer: 'a +' })
  assert.equal(badExpr.ok, false)
  assert.ok(badExpr.error)
})

test('the result is serializable — the whole point of reporting it', () => {
  const r = validateTemplateGrid('Divide {a} by {b}.', {
    vars: { a: { min: 1, max: 3, step: 1 }, b: { min: 0, max: 2, step: 1 } },
    answer: 'a / b',
  })
  const round = JSON.parse(JSON.stringify(r)) as GridValidationResult
  assert.deepEqual(round.issues.map((i) => i.kind), kinds(r))
  assert.ok(r.issues.every((i) => i.count >= 1 && typeof i.example === 'object'))
})
