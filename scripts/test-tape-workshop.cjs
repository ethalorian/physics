const assert=require('node:assert/strict');
const M=require('../public/games/tape-workshop/measure.js');
for(const d of [2,4,8,16,10])for(let ticks=0;ticks<=7*d;ticks++){
 assert.equal(M.parse(M.mixed(ticks,d)),ticks/d);
 assert.equal(M.parse(String(ticks/d)),ticks/d);
}
assert.equal(M.parse('3 2/4'),3.5);assert.equal(M.parse('14/4'),3.5);
for(const s of ['1/0','3 2/0','3abc','1/2/3','', '-2'])assert(Number.isNaN(M.parse(s)));
for(const d of [2,4,8,16,10])for(let r=0;r<8;r++)for(const random of [()=>0,()=>.999999]){
 const q=M.question(d,r,random);assert(q.value>0&&q.value<7);assert.equal(q.ticks/d,q.value);assert.equal(q.ticks,Math.round(q.ticks));
}
console.log('PASS exact fraction/decimal equivalence, parsing, and representable tape lengths');
