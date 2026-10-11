const fs=require('node:fs'),assert=require('node:assert/strict');
const root=process.cwd(),out=fs.mkdtempSync('/private/tmp/etf-workshop-test-');
(async()=>{
 await require('esbuild').build({stdin:{contents:"export {withLessonPresentationDeck} from './src/data/lesson-decks';export {applyTeachingToolCommand,supportsTeachingTool} from './src/lib/teaching-tool-spec';",resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:out+'/tools.cjs'});
 const {withLessonPresentationDeck,applyTeachingToolCommand,supportsTeachingTool}=require(out+'/tools.cjs');
 const lessons=require(root+'/scripts/trades-etf/lessons.json');let boards=0,frames=0;
 for(const lesson of lessons){
  const original=lesson.content_blocks,encoded=JSON.stringify(original),doc=withLessonPresentationDeck(original,lesson);
  assert.equal(JSON.stringify(original),encoded,'Do not mutate the stored document');
  for(const block of original.blocks.filter(b=>b.capture))assert.equal(doc.blocks.find(b=>b.id===block.id),block,'Saved evidence identity and content must remain intact');
  for(const b of doc.blocks.filter(b=>b.teachingTool)){
   boards++;assert.ok(supportsTeachingTool(b));assert.ok(b.teachingTool.frames.length<=6);
   assert.deepEqual(b.workshop.steps,original.blocks.find(old=>old.id===b.id).workshop.steps,'Keep every bench direction');
   assert.equal(applyTeachingToolCommand(b,undefined,{block_id:b.id,state:{frame:b.teachingTool.frames.length-1,show:true}}).state.show,true);
   assert.equal(applyTeachingToolCommand(b,undefined,{block_id:b.id,state:{frame:b.teachingTool.frames.length}}),null,'Reject out-of-range shared state');
   for(const f of b.teachingTool.frames){frames++;assert.ok(f.image.startsWith('/trades-etf/workshop/'));assert.ok(fs.existsSync(root+'/public'+f.image));assert.ok(f.prompt&&f.alt&&f.check);}
  }
  assert.deepEqual(withLessonPresentationDeck(doc,lesson),doc,'Repeated hydration must not duplicate frames');
  const html=fs.readFileSync(root+'/public/trades-etf/'+lesson.slug+'.html','utf8');assert.equal((html.match(/<!-- workshop-start -->/g)||[]).length,1);assert.ok(html.includes('Numbered bench directions'));
 }
 assert.equal(boards,216);
 console.log(`PASS ${lessons.length} lessons, ${boards} stage boards, ${frames} illustrated views; full directions, saved evidence and bounded live controls preserved.`);
})().catch(e=>{console.error(e);process.exitCode=1});
