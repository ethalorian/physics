const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
function load(name){const html=fs.readFileSync(path.join(__dirname,'../public/games',name+'.html'),'utf8');const begin=html.indexOf('*/',html.indexOf('PURE-LOGIC-START'))+2,end=html.lastIndexOf('/*',html.indexOf('PURE-LOGIC-END'));const ctx=vm.createContext({});vm.runInContext(html.slice(begin,end),ctx);return expr=>vm.runInContext(expr,ctx,{timeout:10000})}
const sup={'⁻':'-','⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};
function value(label){const units={' mm':.001,' cm':.01,' km':1000,' m':1,' kg':1,' g':.001,' t':1000,' mL':.001,' L':1,' m³':1000};for(const [suffix,mul] of Object.entries(units))if(label.endsWith(suffix))return value(label.slice(0,-suffix.length))*mul;let s=label.replaceAll(',','').replaceAll('−','-').trim();if(s.endsWith('%'))return value(s.slice(0,-1))/100;if(s.includes('×10')){const [m,e]=s.split('×10');return Number(m)*10**Number([...e].map(c=>sup[c]??c).join(''))}if(s.includes('/')){const [a,b]=s.split('/');return Number(a)/Number(b)}return Number(s)}
const eq=(a,b)=>Math.abs(a-b)<1e-10*Math.max(1,Math.abs(a),Math.abs(b));
let failures=[];
for(const name of ['numbersense-magnitude','proportion-scale-storm','graphs-slope-sniper','quantities-powers-of-ten','algebra-inverse-blitz']){
 const run=load(name);let count=0;
 for(let lv=1;lv<=8;lv++)for(let i=0;i<150;i++){
  const g=run(name==='algebra-inverse-blitz'?`genForLevel(${lv})`:`genGame(${lv})`);count++;
  for(const step of g.steps){const choices=run(`buildChips(${JSON.stringify(step)})`);assert.equal(choices.length,4);assert.equal(choices.filter(c=>c.ok).length,1);assert.equal(new Set(choices.map(c=>c.l)).size,4)}
  if(g._kind==='eq'){
   const target=value(g.states[0].split(' = ')[0]),correct=value(g.steps[0].c);
   if(!eq(target,correct))failures.push({name,problem:g.states[0],answer:g.steps[0].c});
  }
  if(g._items)assert(eq(value(g.steps[0].c),Math.max(...g._items.map(x=>x.v))));
  if(g._pow){const expected=g._pow===1?'x':g.states[0].split('∝')[1].trim()[0];if(g._pow>1&&!g.states[0].includes(',   '+expected+' '))failures.push({name,problem:g.states[0],expected});}
 }
 console.log('CHECK',name,count,'generated questions');
}
const fusion=load('equivalence-fusion');const ladders=fusion('LADDERS');
for(const mode of Object.keys(ladders))for(let i=0;i<ladders[mode].length;i++){const v=value(ladders[mode][i][0]);assert(ladders[mode][i].every(l=>eq(value(l),v)));if(i)assert(eq(v,2*value(ladders[mode][i-1][0])))}
for(const mode of Object.keys(ladders))for(let tier=12;tier<20;tier++)assert(eq(value(fusion(`tierLabel('${mode}',${tier})`)),2*value(fusion(`tierLabel('${mode}',${tier-1})`))));
const merged=fusion("slide([mkTile('fractions',0),mkTile('fractions',0),mkTile('fractions',0),mkTile('fractions',0),...Array(12).fill(null)],'L')");assert.equal(merged.merges.length,2);assert.deepEqual(Array.from(merged.board.slice(0,4),x=>x?.tier??null),[1,1,null,null]);
const mathle=load('daily-mathle');for(let n=0;n<200;n++){const date=new Date(Date.UTC(2026,0,1+n)).toISOString().slice(0,10);const q=mathle(`dailyEquation('${date}')`);assert.equal(q.length,8);assert(mathle(`validate(${JSON.stringify(q)}).ok`));assert.equal(q,mathle(`dailyEquation('${date}')`));assert(mathle(`scoreGuess(${JSON.stringify(q)},${JSON.stringify(q)}).every(x=>x==='green')`));}
assert.deepEqual(Array.from(mathle("scoreGuess('11+22=33','12+21=33')")),['green','gold','green','green','gold','green','green','green']);
assert(!mathle("validate('01+23=24').ok"));assert(!mathle("validate('12÷0=123').ok"));
const algebra=load('algebra-inverse-blitz');
for(let lv=1;lv<=8;lv++)for(let j=0;j<80;j++){
 const g=algebra(`genForLevel(${lv})`),x=value(g.states.at(-1).split('=')[1]);
 for(const state of g.states){const [lhs,rhs]=state.split('=');const expression=part=>part.replaceAll('−','-').replaceAll('×','*').replace(/(\d|x|\))(?=x|\()/g,'$1*').replaceAll('x',`(${x})`);
  assert(eq(vm.runInNewContext(expression(lhs)),vm.runInNewContext(expression(rhs))),state+' at x='+x);
 }
}
const graphs=load('graphs-slope-sniper');assert.match(graphs('genArea().fig'),/>6<\/text>/);assert.match(graphs('genLinz().states[0]'),/origin/);
const crush=load('logic-expression-crush');assert.equal(crush("evalChain([2,3,4],['+','×'],true)"),14);assert.equal(crush("evalChain([8,2,2],['÷','×'],true)"),8);assert.equal(crush("evalChain([2,3,4],['+','×'],false)"),20);
console.log('PASS Fusion equivalence/doubling, 200 deterministic Mathle puzzles, Expression Crush order of operations');
if(failures.length){console.error('INVALID QUESTIONS',failures.length,JSON.stringify(failures.slice(0,8),null,2));process.exitCode=1}else console.log('All sampled math logic checks passed');
