const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../public/games/conversion-workshop/math.js');
for (let i = 0; i < M.templates.length; i++) {
  test(`Practice ${i + 1}: all numeric variants have valid chains`, () => {
    M.templates[i].values.forEach((value, j) => {
      const job = M.make(i, () => j / M.templates[i].values.length);
      assert.equal(job.value, value);
      const result = M.evaluate(value, job.from, job.solution);
      assert.ok(M.same(result.units, job.to));
      assert.ok(Math.abs(result.value - job.answer) < 1e-8);
      assert.equal(M.check(job, job.solution, String(job.answer)), 'correct');
      assert.equal(M.check(job, job.solution, String(job.answer * 10)), 'number');
    });
  });
}
test('correct numbers with missing or reversed factors do not pass', () => {
  const job = M.make(0);
  assert.equal(M.check(job, [], job.answer), 'units');
  assert.equal(M.check(job, [['cm', false]], job.answer), 'units');
});
test('area needs two factors even if the entered number is correct', () => {
  const job = M.make(10);
  assert.equal(M.check(job, job.solution.slice(0, 1), job.answer), 'units');
});
test('blank, nonfinite and malformed answers do not pass', () => {
  const job = M.make(2);
  for (const value of ['', ' ', 'Infinity', 'NaN', '12abc']) assert.equal(M.check(job, job.solution, value), 'empty');
});
test('either rate factor order works', () => {
  for (const i of [8, 9]) {
    const job = M.make(i);
    assert.equal(M.check(job, [...job.solution].reverse(), job.answer), 'correct');
  }
});
test('reference factors each preserve physical quantity', () => {
  const scales = { m: 1, cm: .01, km: 1000, kg: 1, g: .001, s: 1, min: 60, h: 3600 };
  M.factors.forEach(q => assert.equal(q.a * scales[q.au], q.b * scales[q.bu]));
});
