const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('../public/games/unit-lab/physics.js');
const factor = (id, flip = false, power = 1) => ({ id, flip, power });
const solutions = [
  [1, [factor('cm')]],
  [2, [factor('km'), factor('hour', true)]],
  [3, [factor('cm', true, 2)]],
  [4, [factor('time')]],
  [5, [factor('acceleration'), factor('newton')]],
  [6, [factor('volume', true)]],
];
for (const [index, chain] of solutions) {
  const m = P.missions[index];
  test(m.title, () => {
    const result = P.evaluate(m.start, chain);
    assert.ok(P.same(result.u, m.target.u));
    assert.ok(Math.abs(result.value - m.target.value) < 1e-8);
    assert.ok(chain.every(item => m.allowed.includes(item.id)));
  });
}
test('all conversion factors represent equal physical quantities', () => {
  const si = q => q.value * Object.entries(q.u).reduce((scale, [u, p]) => scale * P.units[u].s ** p, 1);
  for (const f of P.factors.filter(f => f.conversion)) {
    assert.deepEqual(P.dimension(f.top.u), P.dimension(f.bottom.u));
    assert.ok(Math.abs(si(f.top) - si(f.bottom)) < 1e-10, f.id);
  }
});
test('reversing a factor does not cancel matching units on the same side', () => {
  assert.deepEqual(P.evaluate(P.missions[1].start, [factor('cm', true)]).u, { cm: 2, m: -1 });
});
test('a rate requires reversing the time conversion', () => {
  assert.deepEqual(P.evaluate(P.missions[2].start, [factor('km'), factor('hour')]).u, { m: 1, h: -2, s: 1 });
});
test('area conversion once leaves mixed units; twice matches a squared factor', () => {
  const start = P.missions[3].start;
  assert.deepEqual(P.evaluate(start, [factor('cm', true)]).u, { m: 1, cm: 1 });
  assert.deepEqual(P.evaluate(start, [factor('cm', true), factor('cm', true)]), P.evaluate(start, [factor('cm', true, 2)]));
});
test('scale and dimension checks are distinct', () => {
  assert.deepEqual(P.dimension({ cm: 1 }), P.dimension({ m: 1 }));
  assert.equal(P.same({ cm: 1 }, { m: 1 }), false);
  assert.deepEqual(P.dimension({ N: 1 }), P.dimension({ kg: 1, m: 1, s: -2 }));
  assert.notDeepEqual(P.dimension({ m: 1, s: -1 }), P.dimension({ m: 1, s: -2 }));
});
test('redundant inverse conversion factors preserve quantity', () => {
  assert.deepEqual(P.evaluate(P.missions[1].start, [factor('cm'), factor('cm', true)]), P.missions[1].start);
});
