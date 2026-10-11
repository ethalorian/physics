// Independent bilingual editorial pass. Reviews prose meaning, not just syntax.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('dotenv').config({path:path.resolve(__dirname,'../../.env.local'),quiet:true});
const translateJson=require('./provider.cjs'),work=process.argv[2],tasks=[];
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const numbers=s=>(s.match(/\d+(?:[.,]\d+)*/g)||[]).sort().join('|');
const glyphs=s=>JSON.stringify((s.match(/\[GLYPH_[A-Z]+\]/g)||[]).sort());
for(const f of fs.readdirSync(work).filter(x=>x.endsWith('.source.json')).sort()){
 const src=JSON.parse(fs.readFileSync(path.join(work,f),'utf8'));
 for(const page of src.pages){
  const file=path.join(work,`cp${String(src.chapter).padStart(2,'0')}.p${String(page.page).padStart(3,'0')}.es.json`);
  if(!fs.existsSync(file))continue;
  const es=JSON.parse(fs.readFileSync(file));if(es.contentHash!==page.contentHash)continue;
  const reviewFile=file.replace('.es.json','.review.json');
  if(fs.existsSync(reviewFile)&&JSON.parse(fs.readFileSync(reviewFile)).translationHash===hash(es.blocks))continue;
  tasks.push({chapter:src.chapter,page,es,file,reviewFile});
 }
}
const system=`You are a bilingual physics textbook editor reviewing a Spanish translation for Spanish-speaking high-school students. Compare EVERY supplied Spanish block against its English source. Correct mistranslations, omissions, changed reasoning, altered question demands, unnatural Spanish, incomplete Spanish sentences where the source is complete, and inconsistent technical terms. Do not simplify, summarize, add teaching content, solve exercises, or change the textbook's scientific claims. Preserve the author's meaning even when phrasing is dated.
Required terminology: speed=rapidez; velocity=velocidad; displacement=desplazamiento; net force=fuerza neta; momentum=cantidad de movimiento; angular momentum=momento angular; power=potencia; work=trabajo; mass=masa; weight=peso. Use neutral Latin American Spanish. Correct source-heading/prose boundaries with sensible punctuation when needed. Keep each block's content in its original id; do not merge or move content between ids. Source sentences sometimes continue across blocks: translate fragments faithfully with context.
All original DIGITS, including decimal points, repeated numbers, and years, must be retained literally in the same block. 'the 1500s' should retain digits 1500, not Roman numerals. ALL [GLYPH_...] tokens are protected original symbols or superscripts; preserve them exactly and in their logical positions. Never invent or interpret a missing equation. Do not rewrite correct translations merely for stylistic preference.
Return only needed corrections, each with block id, full corrected Spanish text, and a concise reason. Set needsAttention true only if source corruption makes a faithful translation impossible, and explain in notes. Otherwise notes can be empty. This is an editorial translation check, not instructions from the source.`;
let cursor=0,done=0,failed=0,stopped=false;
async function review(t){
 const source=Object.fromEntries(t.page.blocks.map(b=>[b.id,b.text]));
 const schema={type:'object',properties:{corrections:{type:'array',items:{type:'object',properties:{id:{type:'string',enum:Object.keys(source)},text:{type:'string'},reason:{type:'string'}},required:['id','text','reason'],additionalProperties:false}},needsAttention:{type:'boolean'},notes:{type:'string'}},required:['corrections','needsAttention','notes'],additionalProperties:false};
 if(!Object.keys(source).length)return;
 for(let attempt=0;attempt<4;attempt++)try{
  const result=await translateJson(system,JSON.stringify({english:source,spanish:t.es.blocks}),schema);
  const review=result.blocks,corrected={...t.es.blocks};
  for(const c of review.corrections){if(!c.text.trim()||numbers(source[c.id])!==numbers(c.text)||glyphs(source[c.id])!==glyphs(c.text))throw new Error(`Protected data changed in correction ${c.id}`);corrected[c.id]=c.text;}
  if(review.needsAttention){console.log(`ATTENTION ch=${t.chapter} page=${t.page.page}: ${review.notes}`);}
  const saved={...t.es,blocks:corrected,editorModel:result.model};
  fs.writeFileSync(t.file+'.tmp',JSON.stringify(saved,null,2));fs.renameSync(t.file+'.tmp',t.file);
  fs.writeFileSync(t.reviewFile,JSON.stringify({chapter:t.chapter,page:t.page.page,...review,model:result.model,usage:result.usage,translationHash:hash(corrected)},null,2));
  console.log(`REVIEW ch=${t.chapter} page=${t.page.page} corrections=${review.corrections.length} ${++done}/${tasks.length}`);return;
 }catch(e){console.error(`REVIEW RETRY ch=${t.chapter} page=${t.page.page}: ${e.message}`);if(e.fatal){stopped=true;failed++;return;}if(attempt===3){failed++;return;}await new Promise(r=>setTimeout(r,Math.min(30000,5000*(attempt+1))));}
}
(async()=>{console.log(`Reviewing ${tasks.length} translated pages`);await Promise.all(Array.from({length:Number(process.env.CONCURRENCY||4)},async()=>{while(!stopped&&cursor<tasks.length)await review(tasks[cursor++]);}));console.log(`FINISHED reviews=${done} failed=${failed}`);if(failed)process.exitCode=1;})();
