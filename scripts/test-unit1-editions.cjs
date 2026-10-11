// Exercise the real class presentation resolver with a read-only database fixture.
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
(async()=>{
 const mocks={
 '@/lib/supabase':`export const supabaseAdmin={from(table){let filters={};const q={select(){return q},eq(k,v){filters[k]=v;return q},async maybeSingle(){const records=globalThis.unit1Fixture[table]||[];return {data:records.find(r=>Object.entries(filters).every(([k,v])=>r[k]===v))||null,error:null}}};return q}}`,
 '@/lib/lesson-access':`export const hydrateLessonDocument=async d=>d`,
 '@/lib/program':`export const asProgram=p=>p||'physics';export const getProgramUnitIds=async()=>['unit-1'];export const PROGRAM_LABEL={physics:'Physics'}`
 };
 const result=await require('esbuild').build({stdin:{contents:`export {resolveClassLesson} from './src/lib/present-server'`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'read-only-fixture',setup(b){b.onResolve({filter:/^@\/lib\/(supabase|lesson-access|program)$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'ts'}));}}]});
 const mod=new Module(path.join(process.cwd(),'unit1-test-bundle.cjs'));mod.filename=mod.id;mod._compile(result.outputFiles[0].text,mod.filename);const {resolveClassLesson}=mod.exports;
 for(const day of [1,11,12,21,22])for(const track of ['cpa','honors',null]){
  const slug='u1-d'+String(day).padStart(2,'0'),evidence={type:'prose',id:'b1',markdown:'Existing assigned work'},doc={schemaVersion:1,blocks:[{type:'deck',id:'deck-'+slug,title:'Stored',src:'/decks/legacy.html',teacherOnly:true},evidence]};
  globalThis.unit1Fixture={courses:[{id:'class',teacher_email:'teacher@example.test',program:'physics',track}],lessons:[{id:'lesson',slug,lesson_number:day,unit_id:'unit-1',published:true,visibility_track:null,content_blocks:doc}]};
  const result=await resolveClassLesson('lesson','class',{role:'admin',email:'admin@example.test'},{hydrate:false});assert.equal(result.ok,true);assert.equal(result.lesson.deck.src,`/decks/${track==='honors'?'unit-1-teaching':'unit-1-cpa'}/day-${String(day).padStart(2,'0')}.html`);assert.equal(result.lesson.original.blocks[1],evidence);assert.equal(doc.blocks[0].src,'/decks/legacy.html');
 }
 globalThis.unit1Fixture.lessons[0].published=false;assert.equal((await resolveClassLesson('lesson','class',undefined,{hydrate:false})).ok,false);
 globalThis.unit1Fixture.lessons[0].published=true;globalThis.unit1Fixture.lessons[0].visibility_track='honors';assert.equal((await resolveClassLesson('lesson','class',undefined,{hydrate:false})).ok,false);
 delete globalThis.unit1Fixture;console.log('PASS: real class resolver chooses both editions, defaults untyped classes to CPA, preserves evidence, and retains publication/track gates.');
})().catch(e=>{console.error(e);process.exit(1)});
