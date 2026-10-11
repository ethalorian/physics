const assert = require('node:assert/strict');
const M = require('../public/games/cut-and-fit/math.js');

// Independently calculated lengths, in inches, in mixed-trade order.
const expected = [20, 13.5, 17.5, 22.875, 16.375, 21.375, 18.25, 15.6875, 19.6875, 20.875, 18.25, 21.25];
assert.equal(M.jobs.length, 12);
assert.equal(new Set(M.jobs.map(j => j.id)).size, 12);
M.jobs.forEach((j, i) => {
  assert.equal(M.target(j), expected[i] * 16, j.id);
  assert.equal(M.inspect(j, expected[i] * 16).fit, 'fit');
  assert.deepEqual(M.inspect(j, expected[i] * 16 - 1), { fit: 'short', difference: -1 });
  assert.deepEqual(M.inspect(j, expected[i] * 16 + 1), { fit: 'long', difference: 1 });
});
for (const trade of Object.keys(M.trades)) assert.equal(M.makeSet(trade).length, 4);
for (let variation = 0; variation < 5; variation++) {
  for (const job of M.makeSet('all', variation)) {
    let remaining = job.stock;
    for (let part = 0; part < job.quantity; part++) {
      const result = M.cut(remaining, M.target(job), job.kerf);
      assert(!result.error, `${job.id} set ${variation} part ${part} fits available stock`);
      assert.equal(result.piece + result.remainder + result.loss, remaining, 'stock is conserved');
      remaining = result.remainder;
    }
  }
}
for (const [text, ticks] of [['18 1/4',292],['18.25',292],['1/16',1],['.0625',1],['2/4',8],[' 13 1/2 ',216],['21',336]]) {
  assert.equal(M.parse(text).ticks,ticks,text);
  assert.equal(M.parse(M.format(ticks)).ticks,ticks,'format round trip');
}
for (const invalid of ['', '1/0', '-1','NaN','Infinity','1e2','18 inches','0','1.1','18 1/','1/32','1000000000000000','<script>']) assert(M.parse(invalid).error,invalid);
assert.deepEqual(M.cut(100,80,2),{piece:80,remainder:18,loss:2});
assert.deepEqual(M.cut(100,100,2),{piece:100,remainder:0,loss:0});
assert(M.cut(100,99,2).error,'must leave room for blade');
assert(M.cut(100,101,0).error,'cannot grow stock');
assert(M.cut(100,0,0).error);
const initial = M.cut(384,328,2), trim = M.cut(initial.piece,320,2);
assert.equal(initial.remainder,54);
assert.equal(trim.piece,320);
assert.equal(initial.remainder+initial.loss+trim.piece+trim.remainder+trim.loss,384);
console.log('PASS: 12 independent answer keys, all five practice variants, three trade queues, fractional input validation, exact fit direction, cutting loss, trim conservation, and repeated cuts.');
