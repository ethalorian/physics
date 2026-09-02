/**
 * Regression tests for the instant self-check.
 * Run: npm run test:answer-check   (tsx --test, Node's built-in runner — no framework dep)
 *
 * The contract under test (warmup_remediation_redesign, decisions 1–3):
 *  - the machine judges the ANSWER, ~1% tolerance, unit-aware
 *  - NEVER a false ✗ — anything unparseable or ambiguous is 'unknown'
 * Every case here started life as a real student answer or a real bank key.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkAnswer, checkAnswerWithMode, parseQuantity, writtenDigits } from './math-answer-check'

const is = (student: string, key: string, want: 'match' | 'mismatch' | 'unknown') =>
  assert.equal(checkAnswer(student, key), want, `${JSON.stringify(student)} vs ${JSON.stringify(key)}`)

test('plain numbers, tolerance, commas', () => {
  is('42', '42', 'match')
  is('41.8', '42', 'match')          // within ~1%
  is('40', '42', 'mismatch')         // outside tolerance
  is('1,200', '1200', 'match')
  is('-0.20', '-0.2', 'match')
})

test('units and synonyms', () => {
  is('3.5 m/s', '3.5 m/s', 'match')
  is('3.5 meters per second', '3.5 m/s', 'match')
  is('3.5 mps', '3.5 m/s', 'match')
  is('9.8 m/s/s', '9.8 m/s^2', 'match')
  is('5 km', '5000 m', 'unknown')    // unconverted units = teacher call, never ✗
  is('3.5', '3.5 m/s', 'match')      // unit omitted on one side → number decides
})

test('scientific notation in every spelling', () => {
  for (const s of ['4.5 × 10^6', '4.5 x 10^6', '4.5*10^6', '4.5x10^6', '4.5e6', '4500000']) {
    is(s, '4.5 × 10^6', 'match')
  }
  is('4.5 × 10^5', '4.5 × 10^6', 'mismatch')
  is('10^-3', '0.001', 'match')
})

test('fractions and percentages are the same number', () => {
  is('7/2', '3.5', 'match')
  is('60%', '3/5 (6/10 reduced)', 'match')
  is('0.6', '60%', 'match')
})

test('word multipliers — "7 thousand" means 7000', () => {
  const key = '7,000 | 7000 | 7 thousand | seven thousand | thousands | the thousands place | thousands place'
  for (const s of ['7000', '7,000', '7 thousand', 'seven thousand', 'thousands', 'the thousands place']) is(s, key, 'match')
  is('7', key, 'mismatch')
  is('80', key, 'mismatch')
  is('3 million', '3000000', 'match')
})

test('currency prefixes and dash-tail keys', () => {
  const key = '$0.10 | 0.10 | 10 cents (a third OF the value, not minus 3)'
  for (const s of ['$.10', '$0.10', '0.10', '.1', '10 cents', '0.1']) is(s, key, 'match')
  is('$0.27', key, 'mismatch')
  is('0.27', key, 'mismatch')
  // dash-tail alone (pre-rewrite key shape) still parses
  is('$.10', '$0.10 — a third OF the value, not minus 3.', 'match')
})

test('student lead-ins and author noise', () => {
  is('v = 3.5 m/s', '3.5 m/s', 'match')
  is('answer: 42', '42', 'match')
  is('about 40 m/s', '40 m/s', 'match')
  is('≈ 5440', '5440', 'match')
  is('24', '24 m (area = 6 x 4).', 'match')
})

test('multipart keys need every part', () => {
  const mp = 'horizontal = 6000·cos25° ≈ 5440 m/s; vertical ≈ 2540 m/s'
  is('5440 and 2540', mp, 'match')
  is('horizontal 5440 m/s, vertical 2540 m/s', mp, 'match')
  is('5440', mp, 'unknown')          // partial → teacher call
  is('100 and 200', mp, 'mismatch')
})

test('form lists with different numbers do NOT trip the multipart guard', () => {
  // regression: "$0.10 | 10 cents" once demanded BOTH 0.10 and 10
  is('$0.10', '$0.10 | 10 cents', 'match')
  is('10 cents', '$0.10 | 10 cents', 'match')
})

test('short-answer word keys with forms', () => {
  is('It doubles', 'doubles | it doubles | doubles too | y doubles | x2', 'match')
  is('zero', '0 | zero | slope is zero', 'match')
  is('0', '0 | zero | slope is zero', 'match')
  is('t = d/v', 't = d/v | d/v', 'match')
  is('d/v', 't = d/v | d/v', 'match')
  is('x = (y-b)/m', 'x = (y - b)/m | (y - b)/m', 'match')
})

test('NEVER a false ✗ — unparseable or free-text goes unknown', () => {
  is('banana', 'meters | m | metres', 'unknown')
  is('They are the same.', 'They are equal — 0.333… repeating IS 1/3.', 'unknown')
  is('', '42', 'unknown')
  is('42', '', 'unknown')
  is('idk', '3.5 m/s', 'unknown')
})

test('parseQuantity unit handling', () => {
  assert.deepEqual(parseQuantity('$.10'), { value: 0.1, unit: '$' })
  assert.deepEqual(parseQuantity('7 thousand'), { value: 7000, unit: '' })
  assert.deepEqual(parseQuantity('3.5 m/s'), { value: 3.5, unit: 'm/s' })
  assert.equal(parseQuantity('quite a lot'), null)
})

test('exact-form: sig figs as written', () => {
  const ex = (s: string, k: string, want: 'match' | 'mismatch' | 'unknown') =>
    assert.equal(checkAnswerWithMode(s, k, 'exact-form'), want, `${JSON.stringify(s)} vs ${JSON.stringify(k)}`)
  ex('12.0 cm', '12.0 cm (3 sig figs)', 'match')
  ex('12 cm', '12.0 cm (3 sig figs)', 'mismatch')   // value equal, precision claimed differs
  ex('12.00 cm', '12.0 cm', 'mismatch')
  ex('3.14', '3.14', 'match')
  ex('3.142', '3.14', 'mismatch')                    // 1% checker would say match
  ex('0.082', '0.082', 'match')
  ex('0.0816', '0.082', 'mismatch')
  ex('1.50 x 10^3', '1.50 × 10^3', 'match')
  ex('1500', '1.50 × 10^3', 'mismatch')
  ex('1.5e3', '1.50 × 10^3', 'mismatch')
  ex('8.6', '8.6 (2 sig figs)', 'match')
  ex('8.55', '8.6 (2 sig figs)', 'mismatch')
  ex('3', '3', 'match')                              // "how many sig figs" count
  ex('12 km', '12.0 cm', 'unknown')                  // unit clash stays a teacher call
  ex('12.0 centimeters', '12.0 cm', 'match')
  assert.equal(writtenDigits('0.00450'), '450')
  assert.equal(writtenDigits('1,500'), '1500')
  assert.equal(writtenDigits('2.39 kg (3 significant figures).'), '239')
})

test('estimate: order-of-magnitude tolerance', () => {
  const es = (s: string, k: string, want: 'match' | 'mismatch' | 'unknown') =>
    assert.equal(checkAnswerWithMode(s, k, 'estimate'), want, `${JSON.stringify(s)} vs ${JSON.stringify(k)}`)
  es('730', '~2 per day × 365 ≈ 700 (10^3-ish). Any reasoned 300–1500 is fine.', 'match')
  es('2190', '≈$2,000 (6 × 365 = 2,190)', 'match')
  es('525600', '≈5 × 10^5 — closest to 10^6 side of 10^5 (525,600).', 'match')
  es('10^6', '10^6', 'match')
  es('10^7', '10^6', 'mismatch')
  es('8000', 'about 8,000', 'match')
  es('80000', 'about 8,000', 'mismatch')
  es('500', 'Backpack ~30 L; ball ~40 mL with packing → ~500. Accept 200–1000.', 'match')
  es('50', 'Backpack ~30 L; ball ~40 mL with packing → ~500. Accept 200–1000.', 'mismatch')
  es('about a thousand', 'about 8,000', 'unknown')   // no number → not the machine's call
})
