const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const source=read('resources/worksheet-decks/source.json'),manifest=read('src/data/worksheet-decks.json'),ledger=read('resources/worksheet-decks/coverage.json');
assert.equal(source.length,131);assert.equal(manifest.length,262);assert.equal(new Set(manifest.map(m=>m.src)).size,262);
assert.equal(ledger.sourceSha256,crypto.createHash('sha256').update(fs.readFileSync('resources/worksheet-decks/source.json')).digest('hex'));
// Semantic subscripts/superscripts and their source Unicode forms are the same
// quantity. Normalize presentation forms before checking complete source text.
const norm=s=>s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/ᵧ/g,'y').replace(/ɢ/g,'g').normalize('NFKC').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
let checked=0;
for(const deck of ledger.decks){
 const day=source.find(d=>d.unit===deck.unit&&d.day===deck.day),m=manifest.find(m=>m.file===deck.file),questions=day[deck.track];
 assert.deepEqual(deck.questions.map(q=>q.number),questions.map(q=>q.number));
 const html=fs.readFileSync(path.join('resources/worksheet-decks/generated',deck.file),'utf8');
 const slides=[...html.matchAll(/<section class="slide[\s\S]*?<\/section>/g)].map(s=>s[0]);assert.equal(slides.length,m.slides);
 assert.ok(html.includes('data-phase="connect"'));assert.ok(html.includes('Words to get started'));assert.ok(html.includes('Choose worksheet problem'));
 assert.ok(fs.existsSync(`public/worksheets/unit-${deck.unit}/${deck.track}/day-${String(deck.day).padStart(2,'0')}.pdf`));
 for(const [i,q] of questions.entries()){
  const entry=deck.questions[i];assert.equal(entry.prompt,q.prompt);assert.equal(entry.answer,q.answer);assert.equal(entry.projectedAnswer,q.answer);assert.deepEqual(entry.visual,q.visual||null);
  const range=slides.slice(entry.start,entry.end+1);const prompts=range.filter(s=>s.includes('data-solution="false"'));const answers=range.filter(s=>s.includes('data-solution="true"'));
  assert.ok(answers.length,deck.file+' Q'+q.number+' answer missing');
  const body=s=>(s.match(/<div class="content">([\s\S]*)<footer>/)||[])[1]||'';
  if(q.worked)for(const part of q.worked.split(/<br\s*\/?>|;\s+|(?<=[.!?])\s+(?=[A-Z“(])/).filter(Boolean))assert.ok(norm(prompts.map(body).join('')).includes(norm(part)),deck.file+' worked example '+q.number);
  for(const part of q.prompt.split(/<br\s*\/?>|(?<=[.!?;])\s+/).filter(Boolean))assert.ok(norm(prompts.map(body).join('')).includes(norm(part)),deck.file+' prompt '+q.number+': '+part);
  for(const part of (entry.projectedAnswer||q.answer).split(/<br\s*\/?>|;\s+|(?<=[.!?])\s+(?=[A-Z“(])/).filter(Boolean))assert.ok(answers.some(s=>norm(body(s)).includes(norm(part))),deck.file+' answer '+q.number+': '+part);
  checked++;
 }
}
assert.equal(checked,2124);const presets=read('src/data/worksheet-deck-activities.json');assert.equal(presets.length,1862);for(const a of presets){const d=ledger.decks.find(d=>'unit-'+d.unit===a.unitId&&d.day===a.day&&d.track===a.track);assert.ok(d.questions.some(q=>q.promptSlide+1===a.slide));assert.ok(a.prompt.length<=1000);assert.ok(a.id.startsWith('worksheet-v2-'));}assert.deepEqual(fs.readdirSync('public/decks/worksheet-guided').sort(),['motion.js','runtime.js','solutions.css','style.css']);
// Exercise the real authorization wrapper, mocking only identity providers.
(async()=>{
 const {diagram}=await import('../src/data/deck-sources/worksheet-guided/diagrams.mjs');
 const {guidance}=await import('../src/data/deck-sources/worksheet-guided/guidance.mjs');
 const thermalReview=source.find(d=>d.unit===5&&d.day===2);assert.equal(guidance(thermalReview,thermalReview.honors[0]).family,'energy');
 const electricReview=source.find(d=>d.unit===7&&d.day===10);assert.equal(guidance(electricReview,electricReview.honors[6]).family,'graph');
 for(const day of source)for(const track of ['cpa','honors'])for(const q of day[track]){
  if(q.visual?.kind!=='graph')continue;
  const svg=diagram(q.visual);assert.ok(!/NaN|Infinity/.test(svg));
  for(const axis of ['x','y']){
   const ticks=[...svg.matchAll(new RegExp('<text data-axis="'+axis+'"[^>]*>([^<]+)</text>','g'))].map(m=>Number(m[1]));
   assert.ok(ticks.length>=2);assert.ok(ticks.every((v,i)=>i===0||v>ticks[i-1]),'Rounded duplicate axis values '+day.unit+'/'+day.day+'/'+track+'/'+q.number);
   assert.ok(Math.abs(ticks[0]-(q.visual[axis+'min']||0))<1e-8);
  }
 }

 const out=fs.mkdtempSync('/private/tmp/worksheet-deck-route-');
 const mocks={
  '@/lib/auth':'export const auth=async()=>globalThis.testSession',
  '@/lib/effective-context':'export const getEffectiveContext=async()=>({role:globalThis.testRole,realRole:globalThis.testRole,scopeEmail:"teacher@example.com",viewingAsTeacher:false})',
  '@/lib/experience':'export const EXPERIENCE_READ_ONLY="Read only"',
  '@/lib/student-enrollment':'export const requireEnrolledStudent=async()=>null',
  '@/lib/content-access':'export const canEditArea=async()=>false',
  'next/server':'export const NextResponse={json:(data,init)=>Response.json(data,init)}',
 };
 await require('esbuild').build({entryPoints:['src/app/api/teacher/worksheets/[unit]/[day]/presentation/route.ts'],outfile:out+'/route.cjs',bundle:true,platform:'node',format:'cjs',packages:'external',plugins:[{name:'identity-fixtures',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 const {GET}=require(out+'/route.cjs');
 const get=(unit='unit-1',day='6',track='cpa')=>{const url=new URL('http://test/api/teacher/worksheets/'+unit+'/'+day+'/presentation?track='+track);return GET({method:'GET',nextUrl:url},{params:Promise.resolve({unit,day})})};
 global.testSession=null;assert.equal((await get()).status,401);
 global.testSession={user:{id:'fixture',email:'teacher@example.com'}};
 for(const role of ['student','parent']){global.testRole=role;assert.equal((await get()).status,403)}
 for(const role of ['teacher','admin','observer']){global.testRole=role;const r=await get();assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.ok((await r.text()).includes('Vector addition'))}
 for(const args of [['unit-9','1','cpa'],['unit-1','23','cpa'],['../source','1','cpa'],['unit-1','1','student']])assert.equal((await get(...args)).status,404);
 for(const track of ['cpa','honors']){const r=await get('unit-8','9',track);assert.equal(r.status,200);assert.ok((await r.text()).includes(track==='cpa'?'CPA':'Honors'))}
 console.log(`PASS ${manifest.length} decks, ${checked} worksheet prompts and answer keys, private assets, real authorization wrapper, edition selection and invalid-path rejection.`);
})().catch(e=>{console.error(e);process.exitCode=1});
