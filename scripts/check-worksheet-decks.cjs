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
 assert.ok(html.includes('data-walk-kind='));assert.ok(html.includes('Choose worksheet problem'));
 assert.ok(fs.existsSync(`public/worksheets/unit-${deck.unit}/${deck.track}/day-${String(deck.day).padStart(2,'0')}.pdf`));
 for(const [i,q] of questions.entries()){
  const entry=deck.questions[i];assert.equal(entry.prompt,q.prompt);assert.equal(entry.answer,q.answer);
  const range=slides.slice(entry.start,entry.end+1);const prompts=range.filter(s=>s.includes('data-solution="false"'));const answers=range.filter(s=>s.includes('data-solution="true"'));
  assert.ok(answers.length,deck.file+' Q'+q.number+' answer missing');
  const body=s=>(s.match(/<div class="content">([\s\S]*)<\/div><footer>/)||[])[1]||'';
  for(const part of q.prompt.split(/<br\s*\/?>|(?<=[.!?;])\s+/).filter(Boolean))assert.ok(norm(prompts.map(body).join('')).includes(norm(part)),deck.file+' prompt '+q.number+': '+part);
  for(const part of (entry.projectedAnswer||q.answer).split(/<br\s*\/?>|;\s+|(?<=[.!?])\s+(?=[A-Z“(])/).filter(Boolean))assert.ok(answers.some(s=>norm(body(s)).includes(norm(part))),deck.file+' answer '+q.number+': '+part);
  checked++;
 }
}
assert.equal(checked,2124);assert.deepEqual(fs.readdirSync('public/decks/worksheet-guided').sort(),['motion.js','runtime.js','solutions.css','style.css']);
// Exercise the real authorization wrapper, mocking only identity providers.
(async()=>{
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
