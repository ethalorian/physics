// Deterministic independent math oracles for regressions that visual tests cannot judge.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(name){let seed=81024;const math=Object.create(Math);math.random=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/2**32);const s=fs.readFileSync('public/games/'+name+'.html','utf8');const a=s.indexOf('*/',s.indexOf('PURE-LOGIC-START'))+2,b=s.lastIndexOf('/*',s.indexOf('PURE-LOGIC-END'));const ctx=vm.createContext({Math:math});vm.runInContext(s.slice(a,b),ctx);return expression=>vm.runInContext(expression,ctx);}
const supers={'⁻':'-','⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8,'⁹':9};
function value(label){let x=label.replaceAll(',','').replaceAll('−','-').replace(/^× /,'');if(x.endsWith('%'))return value(x.slice(0,-1))/100;if(x.includes('×10')){const [m,e]=x.split('×10');return Number(m)*10**Number([...e].map(c=>supers[c]).join(''));}if(x.includes('/')){const [n,d]=x.split('/').map(Number);return n/d;}return Number(x);}
let count=0;
for(const name of ['numbersense-magnitude','proportion-scale-storm','quantities-powers-of-ten','graphs-slope-sniper','algebra-inverse-blitz']){
 const run=load(name);
 for(let lv=1;lv<=8;lv++)for(let i=0;i<300;i++){
  const g=run(`${name==='algebra-inverse-blitz'?'genForLevel':'genGame'}(${lv})`);
  for(let j=0;j<g.steps.length;j++){
   const explanation=run(`explainGame(${JSON.stringify(g)},${j})`);assert(explanation.length>30&&!explanation.includes('undefined'),name+' explanation');
   const choices=run(`buildChips(${JSON.stringify(g.steps[j])})`);assert.equal(choices.filter(x=>x.ok).length,1);
   if(name!=='algebra-inverse-blitz'&&!g.steps[j].normalized)for(const c of choices.filter(c=>!c.ok))assert(!run(`sameChoice(${JSON.stringify(c.l)},${JSON.stringify(g.steps[j].c)})`),name+' rejects equivalent distractor '+c.l);
   if(g._items)assert.equal(value(g.steps[0].c),Math.max(...g._items.map(x=>value(x.l))));
   if(g._target!==undefined)assert(Math.abs(value(g.steps[0].c)-g._target)<1e-8);
   if(g._ans!==undefined)assert.equal(value(g.steps[0].c),g._ans);
   if(g._pow!==undefined)assert(Math.abs(value(g.steps[0].c)-g._k**g._pow)<1e-8);
   if(g._val!==undefined)assert(Math.abs(value(g.steps[0].c)-g._val)<Math.abs(g._val)*1e-10);
  }
  count++;
 }
}
const graphs=load('graphs-slope-sniper');for(let i=0;i<1000;i++){const g=graphs('genVector()'),v=g._vector;const correct=+(v.mag*Math[v.wantX?'cos':'sin'](v.theta*Math.PI/180)).toFixed(1);assert.equal(Number(g.steps[0].c),correct);assert(g.explanation.includes(String(correct)));}
assert(graphs('LINZ').find(x=>x[0].includes('y² vs x'))[0].includes('y ≥ 0'));
const algebra=load('algebra-inverse-blitz');for(const g of algebra('PHYS_BANK')){assert.equal(g.steps.length,g.states.length-1);for(let i=0;i<g.steps.length;i++)assert(algebra(`explainGame(${JSON.stringify(g)},${i})`).includes('BOTH sides'));}
const mathle=load('daily-mathle');assert.equal(mathle("evalExpr('8÷2×2')"),8);assert.equal(mathle("evalExpr('2+3×4')"),14);assert(!mathle("validate('01+23=24').ok"));assert(!mathle("validate('12÷0=123').ok"));
for(let i=0;i<500;i++){const d=new Date(Date.UTC(2025,0,i+1)).toISOString().slice(0,10);const q=mathle(`dailyEquation('${d}')`);assert(mathle(`validate('${q}').ok`));}
console.log('PASS',count,'seeded problems + worked explanations; 1000 independently computed vectors; formula path coverage; 500 daily equations and arithmetic edge cases');
