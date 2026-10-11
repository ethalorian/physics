const assert=require('node:assert/strict');
const M=require('../public/games/centerpoint/math.js');
const expected=[[288,null],[240,null],[152,null],[220,null],[192,128],[152,88],[116,76],[82,54],[352,null],[296,null],[348,null],[225,null]];
assert.equal(M.jobs.length,12);
for(let i=0;i<M.jobs.length;i++){
  const j=M.jobs[i],t=M.target(j);assert.deepEqual(t,{x:expected[i][0],y:expected[i][1]},j.id);
  const exact=M.inspect(j,t);assert.equal(exact.centered,true);assert.equal(exact.left,exact.right);
  if(j.bench==='face')assert.equal(exact.top,exact.bottom);
  const wrong=M.inspect(j,{...t,x:t.x+1});assert.equal(wrong.centered,false);assert.equal(wrong.dx,1);assert.equal(wrong.left-wrong.right,2);
  if(j.bench==='face'){assert.equal(M.inspect(j,{...t,y:t.y-1}).dy,-1);assert(M.inspect(j,{...t,y:null}).error);}
  assert(M.inspect(j,{...t,x:j.b+1}).error);assert(M.inspect(j,{...t,x:NaN}).error);
}
for(let i=0;i<=3072;i++)assert.equal(M.parse(M.format(i)).ticks,i,'round trip '+i);
assert.equal(M.parse('7.03125').ticks,225);assert.equal(M.parse('2 6/16').ticks,76);assert.equal(M.parse('15/2').ticks,240);
for(const s of ['','-1','1/0','1/64','4.1','1e2','Infinity','2 apples','97'])assert(M.parse(s).error,s);
for(const bench of Object.keys(M.benches))assert.equal(M.makeSet(bench).length,4);
for(let v=0;v<5;v++)for(const j of M.makeSet('all',v)){
  const t=M.target(j);assert(Number.isInteger(t.x));assert(t.x>j.a&&t.x<j.b);assert.equal(M.inspect(j,t).centered,true);
  if(j.bench==='face'){assert(Number.isInteger(t.y));assert(t.y>0&&t.y<j.h);}
}
assert.deepEqual(M.makeSet('all',5),M.makeSet('all',0));
console.log('PASS: 12 independent midpoint answers; two-axis centers; wrong-mark direction; exact fractions/decimals; no silent rounding; all five dimension sets.');
