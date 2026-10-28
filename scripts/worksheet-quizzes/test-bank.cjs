// Exercise every edition through the actual staff preview and quiz validator.
const assert=require('node:assert/strict'),path=require('node:path'),{createFixture}=require('./fixture.cjs');
(async()=>{const f=await createFixture();await require('esbuild').build({entryPoints:[path.join(f.root,'src/lib/quizzes/validation.ts')],outfile:f.out+'/validation.cjs',bundle:true,platform:'node',format:'cjs',logLevel:'error'});const {validateQuiz}=require(f.out+'/validation.cjs');let count=0;
for(const w of require('../../resources/worksheet-decks/source.json'))for(const edition of ['cpa','cpa-sei','honors','honors-sei']){
 const r=await f.call('preview','GET',{},'',`?unit=unit-${w.unit}&day=${w.day}&edition=${edition}`),p=await r.json();assert.equal(r.status,200,`${w.unit}.${w.day}/${edition}: ${JSON.stringify(p)}`);
 validateQuiz({id:f.id(501),course_id:f.id(1),title:`Day ${w.day} · ${p.title} · Paired quiz`,kind:'understanding',instructions:'Complete the paper worksheet, then choose one answer per question.',grade_mode:'numeric',questions:p.questions,due_at:'2026-10-28T16:00:00.000Z',status:'published',version:0,student_ids:null,source_quiz_id:null,language_level:edition.startsWith('honors')?'honors':'cpa',sei_supports:edition.endsWith('-sei')});count++;
}
assert.equal(count,524);assert.equal(f.jobs.length,0);assert.equal(f.modelCalls.length,0);console.log('PASS: all 524 worksheet editions preview through the real staff API and pass the native quiz publication validator. No assignments created; no AI jobs.');
})().catch(e=>{console.error(e);process.exitCode=1});
