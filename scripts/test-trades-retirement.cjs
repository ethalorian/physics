const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'trades-retirement-test-'));
const retired=Array.from({length:6},(_,i)=>`trades-${i+1}`).concat(Array.from({length:6},(_,i)=>`trades-reset-${i+1}`));
const units=[...retired.map(id=>({id,name:'Archive '+id,program:'trades',order_index:90,allotted_days:1})),{id:'trades-etf-1',name:'Current ETF',program:'trades',order_index:1,allotted_days:6},{id:'trades-future',name:'Future draft unit',program:'trades',order_index:5,allotted_days:1},{id:'unit-1',name:'Physics',program:'physics',order_index:1,allotted_days:1}];
const lesson=(id,unit_id,published=true)=>({id,unit_id,title:id,slug:id,published,unit:units.find(u=>u.id===unit_id)?.name??'Unassigned',lesson_number:1,planned_days:1,block_summary:[],block_count:1,content_blocks:{schemaVersion:1,presentation:"physics-path",learningPath:{version:1,kind:"lesson",focus:id,targetSlugs:[]},blocks:[]}});
const lessons=[...retired.map(id=>lesson('old-'+id,id,false)),lesson('current','trades-etf-1'),lesson('future-draft','trades-future',false),lesson('physics','unit-1'),lesson('orphan',null,false)];
global.retirementFixture={tables:{units,lessons,lesson_catalog_summary:lessons,students:[],courses:[{id:'class',program:'trades',track:'cpa'}],lesson_progress:[{lesson_id:'old-trades-reset-1',progress_percentage:60,status:'in_progress'}]}};
const mocks={
 'next/server':`export const NextResponse={json:(d,o)=>Response.json(d,o)};`,
 'next/navigation':`export const redirect=()=>{throw Error('Unexpected redirect')};`,
 '@/lib/auth':`export const auth=async()=>({user:{email:'teacher@test'}});`,
 '@/lib/effective-context':`export const getEffectiveContext=async()=>({realRole:'admin'});`,
 '@/lib/content-access':`export const canEditArea=async()=>true;`,
 '@/lib/api-auth':`export const withAuth=h=>h;export const withRole=(_roles,h)=>h;`,
 '@/lib/student-enrollment':`export const getEnrollment=async()=>({enrolled:true});export const getStudentTrack=async()=>null;`,
 '@/lib/teacher-scope':`export const getTeacherStudentGids=async()=>[];`,
 '@/lib/lesson-windows':`export const getStudentLessonWindowStatuses=async()=>({});`,
 '@/lib/track-visibility':`export const effectiveTrack=t=>t;export const isLessonVisible=()=>true;export const filterDocumentForViewer=d=>d;`,
 '@/components/admin/ManageUnits':`export default function ManageUnits(){};`,
 '@/components/admin/LibraryNav':`export default function LibraryNav(){};`,
 '@/lib/supabase':`export const supabaseAdmin={from(table){let rows=[...(global.retirementFixture.tables[table]??[])];const q={select(){return q},order(){return q},limit(n){rows=rows.slice(0,n);return q},eq(k,v){rows=rows.filter(r=>r[k]===v);return q},in(k,vs){rows=rows.filter(r=>vs.includes(r[k]));return q},or(){return q},maybeSingle:async()=>({data:rows[0]??null,error:null}),then(ok,bad){return Promise.resolve({data:rows,error:null}).then(ok,bad)}};return q}};`,
};
async function load(file){const outfile=path.join(out,file.replaceAll('/','_')+'.cjs');await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/'+file],outfile,bundle:true,platform:'node',format:'cjs',jsx:'automatic',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});return require(outfile)}
function nodes(el){return el&&typeof el==='object'?[el,...[el.props?.children].flat(Infinity).flatMap(nodes)]:[]}
(async()=>{
 const before=JSON.stringify(global.retirementFixture);
 const catalog=await load('src/lib/retired-curriculum.ts');assert.equal(catalog.RETIRED_CURRICULUM_UNIT_IDS.length,12);
 const page=await load('src/app/admin/dashboard/page.tsx'),tree=await page.default();
 const library=nodes(tree).find(n=>n.props?.orphans);
 assert.deepEqual(library.props.units.map(u=>u.id),['trades-etf-1','trades-future','unit-1']);
 assert.deepEqual(library.props.orphans.map(l=>l.id),['orphan'],'retired lessons must not reappear as orphans');
 assert.equal(library.props.units[1].lessons[0].published,false,'active unpublished drafts remain available');
 const published=await load('src/app/api/lessons/published/route.ts');const ctx={role:'admin',realRole:'admin',email:'teacher@test',scopeEmail:'teacher@test',userId:'teacher'};
 const all=await (await published.GET(new Request('https://test/api/lessons/published'),ctx)).json();
 assert.deepEqual(all.lessons.map(l=>l.id),['current','future-draft','physics','orphan']);
 const scoped=await (await published.GET(new Request('https://test/api/lessons/published?course_id=class'),ctx)).json();
 assert.deepEqual(scoped.lessons.map(l=>l.id),['current','future-draft']);
 const search=await load('src/app/api/admin/search/route.ts');const found=await (await search.GET(new Request('https://test'),ctx)).json();assert.deepEqual(found.lessons.map(l=>l.id),all.lessons.map(l=>l.id));
 const program=await load('src/lib/program.ts');assert.deepEqual(await program.getProgramUnitIds('trades'),['trades-etf-1','trades-future']);assert.equal((await program.getUnitProgramMap()).get('trades-1'),'trades','history retains program identity');
 const pacing=await load('src/lib/pacing-server.ts');assert.deepEqual((await pacing.loadUnits('trades')).map(u=>u.id),['trades-etf-1','trades-future']);assert.deepEqual((await pacing.loadPlanItems('trades')).map(l=>l.lessonId),['current','future-draft']);
 const release=await load('src/lib/lesson-release-server.ts');assert.deepEqual((await release.releaseLessons()).map(l=>l.id).sort(),['current','physics']);
 assert.equal(JSON.stringify(global.retirementFixture),before,'catalog reads preserve old lessons and work');
 console.log('PASS: library, orphan handling, search, scoped/unscoped lesson API, pacing, release picker; drafts, future units, physics, historical identity and student work preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
