const assert = require('node:assert/strict');
const M = require('../public/games/tape-workshop/measure.js');
for (const d of [2, 4, 8, 16, 32, 10]) {
  for (let ticks = 0; ticks <= 8 * d; ticks++) {
    assert.equal(M.parse(M.mixed(ticks, d)), ticks / d);
    assert.equal(M.parse(String(ticks / d)), ticks / d);
  }
  assert.equal(M.tickLevel(0, d), 1);
  assert.equal(M.tickLevel(d / 2, d), 2);
  assert(M.tickHeight(d / 2, d) > M.tickHeight(1, d) || d === 2);
}
assert.equal(M.parse('3 2/4'), 3.5);
assert.equal(M.parse('14/4'), 3.5);
assert.equal(M.parse(' 3  2 / 4 '), 3.5);
for (const value of ['1/0', '3 2/0', '3abc', '1/2/3', '', '-2', 'Infinity']) assert(Number.isNaN(M.parse(value)));
for (const tool of Object.keys(M.tools)) {
  for (let index = 0; index < M.sequence.length; index++) {
    for (const random of [() => 0, () => .375, () => .999999]) {
      const job = M.makeJob(tool, M.sequence[index], index, random);
      assert(Number.isInteger(job.lengthTicks));
      assert(Number.isInteger(job.startTicks));
      assert.equal(job.endTicks - job.startTicks, job.lengthTicks);
      assert(job.value > 0 && job.endTicks / job.d < 8);
      assert(job.n > 0 && job.n < job.d);
      assert(M.expected(job) > 0);
      if (job.type === 'offset') assert(job.startTicks > 0);
      if (job.type === 'scale') assert.equal(M.expected(job), 1 / job.d);
      if (job.unit === 'cm' && job.type === 'equivalent') assert.equal(M.expected(job), 5);
    }
  }
}
const offset = M.makeJob('inch-8', 'offset', 9, () => .375);
assert.equal(offset.startTicks / 8, 1.5);
assert.equal(offset.value, 2.375);
assert.equal(offset.endTicks / 8, 3.875);
assert.equal(M.expected(offset), 2.375);
assert.equal(M.expected(M.makeJob('metric', 'read', 1, () => .375)), 24);
assert.equal(M.tickLevel(3, 16), 16);
assert.equal(M.tickLevel(6, 16), 8);
assert.equal(M.tickLevel(4, 16), 4);
assert.equal(M.tickLevel(8, 16), 2);
console.log('PASS exact parsing, tick hierarchy, all seven instrument families, metric conversion, and nonzero-start subtraction');
