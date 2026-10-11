const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'physics-path-tests-'));
const seed=require('./seed.json'),catalog=require('../../src/data/physics-learning-catalog.json'),roadmap=require('../../src/data/physics-learning-roadmap.json');
async function load(file){const dest=path.join(out,path.basename(file)+'.cjs');await require('esbuild').build({entryPoints:[path.join(root,file)],outfile:dest,bundle:true,platform:'node',format:'cjs',logLevel:'silent'});return require(dest)}
(async()=>{
 const blocks=await load('src/data/content-blocks.ts'),registry=await load('src/data/block-registry.ts'),visibility=await load('src/lib/track-visibility.ts'),validation=await load('src/lib/lesson-response-validation.ts'),stepped=await load('src/components/lessons/stepped.ts'),meta=await load('src/lib/physics-learning.ts');
 const format=await load('src/lib/physics-problem-format.ts');
 const sourceTarget='u1.vocab-position-distance-displacement';
 for(const lesson of seed.lessons){
  assert.deepEqual(registry.validateBlockDocument(lesson.content_blocks,true),[],lesson.slug);
  const captures=lesson.content_blocks.blocks.filter(blocks.isRequiredCaptureBlock);assert(captures.length>=2);
  assert(captures.every(b=>lesson.objectives.includes(b.targetId)),'Every response is explicitly target linked');
  const pages=blocks.paginateBlocks(lesson.content_blocks.blocks);assert.equal(pages.length,lesson.content_blocks.blocks.filter(b=>b.workshop?.pageBreakBefore).length);
  assert(pages.every(p=>p.blocks.some(b=>b.workshop?.stage)),'Every page has a meaningful named stage');
  const doc=visibility.filterDocumentForViewer(lesson.content_blocks,{role:'student',track:'cpa'});
  for(const b of doc.blocks.filter(b=>b.type==='question'))assert.equal(b.question.correctOptionId,undefined,'No answer key in student document');
  const q=lesson.content_blocks.blocks.find(b=>b.type==='question'),wrong=q.question.options.find(o=>o.id!==q.question.correctOptionId);
  const checked=validation.checkedLessonResponse(q,{optionId:wrong.id,autoCheck:'match'});assert.equal(checked.ok,true);assert.equal(checked.response.autoCheck,'mismatch');
  const responses={[q.id]:{response:checked.response,created_at:'2026-09-26'}};
  assert.equal(blocks.isBlockComplete(q,checked.response),true,'An honest incorrect attempt is saved evidence');
  assert.equal(stepped.firstLockedIndex(pages,responses,true),pages.length,'Practice mistakes never lock later instruction');
  assert(q.question.options.every(o=>o.feedback));
  for(const b of doc.blocks.filter(b=>b.type==='gewa')){assert.equal(b.responseFormat,'problem-workspace');assert(b.requireCompleteWork);assert(['model','plan','work','answer'].every(stage=>b.stageHints[stage]));}

  for(const b of lesson.content_blocks.blocks){const src=b.type==='figure'?b.src:b.sei?.visual?.src;if(src?.startsWith('/learning/'))assert(fs.existsSync(path.join(root,'public',src)),src);}
  assert.equal(meta.physicsLearningEntry({...lesson,content_blocks:doc}).videoIds.length,1);
  console.log('PASS '+lesson.slug+': valid content, target-linked evidence, feedback, pagination, and student key protection');
 }
 assert(seed.lessons.find(l=>l.slug==='position-and-displacement').objectives.includes(sourceTarget));
 assert.equal(new Set(roadmap.map(r=>r.slug)).size,151);assert(roadmap.every(r=>r.lessons.length));
 assert.equal(catalog.filter(e=>e.source==='new').length,3);
 const invalid=structuredClone(seed.lessons[0].content_blocks);invalid.blocks[0].youtubeId='bad';assert(registry.validateBlockDocument(invalid,true).some(i=>i.message.includes('YouTube')));
 const legacy={schemaVersion:1,blocks:[{id:'old-problem',type:'gewa',prompt:'Keep this exact problem.',targetId:'existing-target'}]};
 const transformed=format.physicsProblemFormat(seed.lessons[0].id,legacy);assert.equal(transformed.blocks[0].responseFormat,'problem-workspace');assert.equal(transformed.blocks[0].id,'old-problem');assert.equal(transformed.blocks[0].targetId,'existing-target');assert.equal(legacy.blocks[0].responseFormat,undefined);assert.equal(format.physicsProblemFormat('trades-lesson',legacy),legacy);
 console.log('PASS reusable problem format preserves original documents, block IDs, targets and other curricula');
 console.log('PASS all 151 targets mapped; existing position target reused; malformed video rejected');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(out,{recursive:true,force:true}));
