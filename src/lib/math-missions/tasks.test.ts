import {test} from 'node:test'
import assert from 'node:assert/strict'
import {COMPETENCIES,MISSIONS,type CompetencyCode} from './catalog'
import {arithmetic,gradeTask,makeTask} from './tasks'
import {currentTask,initialState,transition,viewSession} from './session'
import type {Session} from './types'
const session=(code:CompetencyCode='SM1',mode:Session['mode']='practice'):Session=>({id:'session',user_id:'student',mission:MISSIONS.find(m=>(m.codes as readonly string[]).includes(code))!.slug,code,mode,seed:19741,version:1,revision:0,state:initialState(),status:'active',created_at:new Date().toISOString(),completed_at:null,assignment_id:null,ranked:mode==='challenge',xp:0,score:0,staff:false})
test('all 13 competencies have a game; 2600 generated answer keys pass semantic graders',()=>{
 assert.deepEqual(new Set(MISSIONS.flatMap(m=>[...m.codes])),new Set(Object.keys(COMPETENCIES)));
 for(const code of Object.keys(COMPETENCIES) as CompetencyCode[])for(let seed=1;seed<=100;seed++)for(const level of [1,2]){const t=makeTask(code,seed,seed%6,level);let answer=t.expected;if(code==='QE3'){const area=Number(t.data.length)*Number(t.data.width)*.8;answer={area:String(area),space:'1',estimate:String(area),low:String(area*.8),high:String(area*1.2),reason:'I allow twenty percent of the floor for furniture and one square metre per person.'}}
 assert.equal(gradeTask(t,answer).correct,true,`${code}/${seed}/${level} ${JSON.stringify(t.expected)}: ${gradeTask(t,answer).message}`);
 const bad={...answer,[t.fields[0].id]:'not a mathematical response'};assert.equal(gradeTask(t,bad).correct,false,code);
 }
})
test('specific mathematical errors get correct feedback and equivalent algebra routes are accepted',()=>{
 const cube=Array.from({length:30},(_,i)=>makeTask('PR2',i+1,1,2)).find(t=>t.data.power===3)!;
 assert(!cube.hint.toLowerCase().includes('square'));assert.equal(Number(cube.expected.output),Number(cube.data.factor)**3);
 const a=makeTask('SM1',2,0),{a:coef,b,c}=a.data;
 assert(gradeTask(a,{formula:`${c}/${coef}-${b}/${coef}`}).correct);
 assert(!gradeTask(a,{formula:`${c}-${b}/${coef}`}).correct);
 const units=makeTask('QE2',1,1);assert(!gradeTask(units,{bridge1:'100 cm / 1 m',result:String(Number(units.data.value)*100)}).correct);
 const eq=makeTask('QE4',1,0);assert(!gradeTask(eq,{...eq.expected,result:eq.expected.result+'0'}).correct);
})
test('parser accepts only arithmetic, rejects code and nonfinite values',()=>{
 assert.equal(arithmetic('2+3*4'),14);assert.equal(arithmetic('-2^2'),-4);assert.equal(arithmetic('2^-2'),.25);assert.equal(arithmetic('(-3) * (2) + 8'),2);assert.equal(arithmetic('1/0'),null);assert.equal(arithmetic('process.exit()'),null);assert.equal(arithmetic('2;console.log(1)'),null);assert.equal(arithmetic('1e3'),1000);
})
test('public tasks never expose keys or hidden worked examples',()=>{const v=viewSession(session());assert(v.task);assert(!('expected' in v.task));assert(!('hint' in v.task));assert(!('worked' in v.task));assert.deepEqual(v.worked,[]);assert.equal(v.hint,null)})
test('help persists drafts and disqualifies challenge ranking; assistance remains attached to evidence',()=>{
 let s=session('SM1','challenge');let task=currentTask(s);const next=transition(s,'hint',task.expected);s={...s,state:next.state,ranked:next.ranked};assert(!s.ranked);assert.deepEqual(s.state.draft,task.expected);
 task=currentTask(s);s={...s,state:transition(s,'answer',task.expected).state};s={...s,state:transition(s,'next',{}).state};assert(s.state.evidence[0].assisted);assert.equal(s.state.evidence[0].hints,1);
})
test('six completed tasks retain first attempts, assistance and transfer; no client XP or score accepted',()=>{
 let s=session('NS2');for(let i=0;i<6;i++){const t=currentTask(s);s={...s,state:transition(s,'answer',t.expected).state};const next=transition(s,'next',{});assert.equal(next.complete,i===5);s={...s,state:next.state};}
 assert.equal(s.state.evidence.length,6);assert.equal(s.state.evidence.filter(e=>e.assisted).length,2);assert.equal(s.state.evidence.filter(e=>e.phase==='Try independently').length,2);
})
test('pause prevents answering and retains the draft; next requires evidence',()=>{
 let s=session();assert.throws(()=>transition(s,'next',{}));s={...s,state:transition(s,'pause',{formula:'(v-u)/a'}).state};assert.throws(()=>transition(s,'answer',{}));assert.equal(s.state.draft.formula,'(v-u)/a');assert(!transition(s,'resume',{}).state.paused);
})
test('wrong answers can be corrected, but are not relabeled as first-attempt success',()=>{let s=session('NS2');const t=currentTask(s);s={...s,state:transition(s,'answer',{...t.expected,percent:'999'}).state};assert.throws(()=>transition(s,'next',{}));s={...s,state:transition(s,'answer',t.expected).state};s={...s,state:transition(s,'next',{}).state};assert(!s.state.evidence[0].firstCorrect);assert(s.state.evidence[0].correct);assert(s.state.evidence[0].assisted)})
test('independent misses remain in first-attempt evidence after a supported repair',()=>{let s=session('NS2');const t=currentTask(s);s={...s,state:transition(s,'answer',{...t.expected,percent:'999'}).state};s={...s,state:transition(s,'hint',t.expected).state};s={...s,state:transition(s,'answer',t.expected).state};s={...s,state:transition(s,'next',{}).state};assert(!s.state.evidence[0].firstAssisted);assert(!s.state.evidence[0].firstCorrect);assert(s.state.evidence[0].assisted)})
test('challenge task distribution covers both graph families and excludes subjective estimation from score maximum',()=>{const s=session('GV1','challenge');const tasks=Array.from({length:6},(_,i)=>currentTask({...s,state:{...s.state,index:i}}));assert(tasks.some(t=>t.data.slopeTask));assert(tasks.some(t=>t.code==='GV2'&&t.data.power===2));assert(tasks.some(t=>t.code==='GV2'&&t.data.power===-1));assert.equal(viewSession(session('QE3','challenge')).maxScore,300)})
test('graph fitting and signed areas agree with independent numerical calculations',()=>{for(let seed=1;seed<40;seed++){const t=makeTask('GV2',seed,seed%6,2),xs=(t.data.xs as number[]).map(x=>x**Number(t.data.power)),ys=t.data.ys as number[],xm=xs.reduce((a,b)=>a+b)/4,ym=ys.reduce((a,b)=>a+b)/4,m=xs.reduce((s,x,i)=>s+(x-xm)*(ys[i]-ym),0)/xs.reduce((s,x)=>s+(x-xm)**2,0);assert(Math.abs(m-Number(t.expected.slope))<.0001);assert(Math.abs(ym-m*xm-Number(t.expected.intercept))<.0001);const area=makeTask('GV1',seed,0,2);assert(Math.abs(Number(area.data.v)*Number(area.data.duration)+Number(area.expected.returnVelocity)*Number(area.data.returnTime))<.00001)}})
