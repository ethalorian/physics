import assert from 'node:assert/strict'
import test from 'node:test'
import { numericMathEntry } from './student-math-entry'

test('visual fractions and scientific notation produce a numeric answer', () => {
  for (const [entry, expected] of [
    ['(1)/(2)', '0.5'], ['−(3)/(2)', '-1.5'], ['2.50', '2.50'],
    ['3.5 × 10^(-2)', '0.035'], ['10^3', '1000'], ['-5e-3', '-5e-3'],
  ]) assert.equal(numericMathEntry(entry), expected)
})
test('incomplete work, unsupported expressions, invalid units and nonfinite results cannot replace a number', () => {
  for (const entry of ['', '1/0', '10^900', '1(2)', '2(3)/(4)', 'x=4', '4 m/s', '3 + 1'])
    assert.equal(numericMathEntry(entry), null)
})
