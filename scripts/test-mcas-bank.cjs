const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.mcas-tests');fs.mkdirSync(out,{recursive:true});
(async()=>{
 await require('esbuild').build({stdin:{contents:`export * from './src/lib/mcas/bank';export * from './src/lib/mcas/authoring';export * from './src/lib/mcas/presets';export * from './src/lib/quizzes/validation';export {studentQuiz} from './src/lib/quizzes/types';export {filterDocumentForViewer} from './src/lib/track-visibility';export {validateBlockDocument} from './src/data/block-registry';`,resolveDir:root,loader:'ts'},outfile:out+'/logic.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'server-marker',setup(b){b.onResolve({filter:/^server-only$/},()=>({path:'marker',namespace:'marker'}));b.onLoad({filter:/.*/,namespace:'marker'},()=>({contents:''}))}}]});
 const m=require(out+'/logic.cjs'),id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
 assert.equal(m.searchMcas(new URLSearchParams()).total,886);
 assert.equal(m.searchMcas(new URLSearchParams({type:'open_response'})).total,99);
 const q=m.mcasItem('mcas-physics-2026-16'),presentation=m.publicMcasItem(q.id);
 assert(presentation.html.includes('Shared investigation'));assert(presentation.html.includes('2026-q16-2.png'));
 assert.equal(presentation.answer,undefined);assert.equal(presentation.guide,undefined);assert.equal(presentation.searchText,undefined);
 assert.equal(m.publicMcasItem('../../secret'),null);assert.equal(m.publicMcasItem('mcas-physics-2026-99'),null);
 const keyed=m.mcasQuizQuestion(m.mcasItem('mcas-physics-2026-01'),id(3),id(4));assert.equal(keyed.correct_index,2);
 const old=m.mcasQuizQuestion(m.mcasItem('mcas-physics-2016-24'),id(3),id(5));assert.equal(old.correct_index,-1);assert.equal(old.guide,'');
 const quiz={id:id(1),course_id:id(2),title:'MCAS test',kind:'understanding',instructions:'Test',grade_mode:'numeric',questions:[old],due_at:null,status:'draft',version:0,student_ids:null,source_quiz_id:null};
 assert.equal(m.validateQuiz(quiz).questions[0].mcas_id,old.mcas_id);
 assert.throws(()=>m.validateQuiz({...quiz,status:'published'}),/guide|answer/);
 assert.throws(()=>m.validateQuiz({...quiz,status:'published',questions:[{...old,guide:'Teacher verified answer.'}]}),/correct answer/);
 assert.throws(()=>m.validateQuiz({...quiz,questions:[{...old,mcas_id:'../secret'}]}),/MCAS/);
 const safe=m.studentQuiz({...quiz,questions:[keyed]});assert.equal(safe.questions[0].mcas_id,keyed.mcas_id);assert.equal(safe.questions[0].correct_index,undefined);assert.equal(safe.questions[0].guide,undefined);
 const checkpoint=m.mcasLessonBlock(m.mcasItem('mcas-physics-2026-01'),'u1.kinematics-language','mcas-check'),open=m.mcasLessonBlock(q,'u3.momentum','mcas-open');
 assert.equal(checkpoint.requiredForCompletion,false);assert.equal(open.type,'lab_notebook');assert.equal(open.capture,true);
 const before={id:'original',type:'prose',markdown:'Keep original content'};const inserted=m.insertMcasBlocks([before],[checkpoint],'original');assert.equal(inserted[0],before);assert.equal(inserted[1],checkpoint);assert.equal(m.insertMcasBlocks(inserted,[checkpoint],'original').length,2);assert.throws(()=>m.insertMcasBlocks(inserted,[open],'missing'),/insertion point/);
 const student=m.filterDocumentForViewer({schemaVersion:1,blocks:[checkpoint,open]},{role:'student',track:'cpa'});assert.equal(student.blocks[0].question.correctOptionId,undefined);assert.equal(student.blocks[0].note,undefined);assert.equal(student.blocks[0].mcasId,checkpoint.mcasId);
 assert.deepEqual(m.validateBlockDocument({schemaVersion:1,blocks:[checkpoint,open]}),[]);
 for(const p of m.mcasPresets()){
  const questions=p.questions.map((q,i)=>({...q.question,id:id(20+i),target_id:id(3)}));
  assert.equal(m.validateQuiz({...quiz,title:p.title,status:'published',questions}).questions.length,4);
  assert.equal(new Set(questions.map(q=>q.mcas_id)).size,4);
 }
 const bank=JSON.parse(fs.readFileSync(root+'/src/data/mcas-bank.json'));
 for(const item of bank.questions){
  assert(!/<(?:script|iframe|input|form)\b|\son[a-z]+\s*=|javascript:/i.test(item.html),item.id);
  for(const match of item.html.matchAll(/src="([^"]+)"/g)){assert(match[1].startsWith('/mcas/assets/'));assert(fs.existsSync(root+'/public'+match[1]),`${item.id} missing image`)}
 }
 fs.writeFileSync(out+'/result.json',JSON.stringify({questions:886,openResponse:99,presets:3,checks:['search and filters','source contexts and images','student key redaction','unverified key publication gate','source ID validation','lossless checkpoint insertion','duplicate prevention','lesson response compatibility','all presets validate','886 question HTML and image dependencies']},null,2));
 console.log('PASS: MCAS source coverage, image dependencies, key privacy, publish validation, lesson insertion, existing response preservation, and all 3 quiz drafts.');
})().catch(e=>{console.error(e);process.exitCode=1});
