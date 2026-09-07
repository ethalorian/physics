const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'present-lobby-tests-'));
async function bundle(entry, name, plugins = []) {
 const file = path.join(temp, name + '.cjs');
 await esbuild.build({absWorkingDir:root,entryPoints:[entry],outfile:file,bundle:true,platform:'node',format:'cjs',plugins});
 return require(file);
}
(async () => {
 const anchors = await bundle('src/lib/lesson-anchors.ts','anchors');
 const stepped = await bundle('src/components/lessons/stepped.ts','stepped');
 const blocks = await bundle('src/data/content-blocks.ts','blocks');
 const visibility = await bundle('src/lib/track-visibility.ts','visibility');
 const doc = {schemaVersion:1,blocks:[{id:'start',type:'prose',content:'Intro'},{id:'honors',type:'exit_ticket',capture:true,prompt:'Honors task',visibilityTrack:'honors'},{id:'common',type:'exit_ticket',capture:true,prompt:'Common task'},{id:'deck',type:'deck',src:'/deck'}]};
 const staffPages=blocks.paginateBlocks(doc.blocks);
 const cpaPages=blocks.paginateBlocks(visibility.filterDocumentForViewer(doc,{role:'student',track:'cpa'}).blocks);
 assert.equal(anchors.sectionIndexForAnchor(cpaPages,'honors'),-1);
 assert.ok(anchors.sectionIndexForAnchor(cpaPages,'common')>=0);
 const page={blocks:[{id:'one',type:'prose',content:'A'}],captureBlocks:[],hasCapture:false};
 assert.equal(anchors.sectionAnchor(page),'one');
 assert.notEqual(anchors.documentRevision([page]),anchors.documentRevision([{...page,blocks:[{...page.blocks[0],content:'B'}]}]));
 assert.notEqual(anchors.documentRevision(staffPages),anchors.documentRevision(cpaPages));
 assert.deepEqual(stepped.splitHelpRuns([{id:'safety',type:'procedure',steps:['Wear goggles']},{id:'worked',type:'worked_example'},{id:'warning',type:'callout',variant:'warning',text:'Hot surface'}]).map(r=>r.help),[false,true,false]);
 const question={id:'q',type:'question',capture:true,question:{prompt:'Which?',autoCheckable:true,options:[{id:'a',text:'A'}]}};
 assert.equal(stepped.gateSatisfied(question,{q:{response:{optionId:'a'}}}),false);
 assert.equal(stepped.gateSatisfied(question,{q:{response:{optionId:'a',autoCheck:'match'}}}),true);
 assert.equal(stepped.gateSatisfied(question,{q:{draft:true,response:{optionId:'a',autoCheck:'match'}}}),false);
 assert.equal(stepped.doneTallies([question],{q:{response:{optionId:'a',autoCheck:'match'}}}).autoRight,1);
 console.log('PASS class anchors, edit invalidation, essential instructions, safe-key gates and Done tallies');
 // Mock database responses to exercise rejection of another class/session/run before evidence is written.
 global.__poll = {id:'s',lesson_id:'l',course_id:'c',status:'live',poll_block_id:'q',poll_run_id:'r',poll_locked:false,poll_revealed:false};
 global.__member = true;
 const plugin={name:'db',setup(build){
  build.onResolve({filter:/lib\/(supabase|lesson-access)$/},a=>({path:a.path.endsWith('supabase')?'db':'hydrate',namespace:'test'}));
  build.onLoad({filter:/.*/,namespace:'test'},a=>({loader:'js',contents:a.path==='hydrate'?'export async function hydrateLessonDocument(d){return d}':`export const supabaseAdmin={from(table){const q={select(){return q},eq(){return q},maybeSingle(){return Promise.resolve({data:table==='present_sessions'?global.__poll:table==='course_students'?(global.__member?{student_id:'u'}:null):null})}};return q}}` }));
 }};
 const server=await bundle('src/lib/present-server.ts','server',[plugin]);
 const args={userId:'u',lessonId:'l',blockId:'q',presentSessionId:'s',pollRunId:'r'};
 assert.equal((await server.validateLivePoll({...args,pollRunId:undefined})).status,400);
 assert.equal((await server.validateLivePoll({...args,pollRunId:'old-round'})).ok,false);
 assert.equal((await server.validateLivePoll({...args,lessonId:'other-lesson'})).ok,false);
 global.__poll.poll_locked=true; assert.equal((await server.validateLivePoll(args)).ok,false);
 global.__poll.poll_locked=false;global.__poll.poll_revealed=true;assert.equal((await server.validateLivePoll(args)).ok,false);
 global.__poll.poll_revealed=false;global.__member=false;assert.equal((await server.validateLivePoll(args)).status,403);
 global.__poll.course_id=null;assert.equal((await server.validateLivePoll(args)).ok,false);
 console.log('PASS poll session, round, membership, reveal and lock enforcement');
 // Launch diagnostics must explain content blockers without bypassing class access.
 global.__launchCourse={id:'c',teacher_email:'antoccic@fitchburg.k12.ma.us',program:'physics',track:'cpa'};
 global.__launchLesson={id:'l',title:'Motion',unit_id:'proj-1',published:false,visibility_track:null,content_blocks:{schemaVersion:1,blocks:[{id:'intro',type:'prose',content:'Observe motion.'}]}};
 const launchPlugin={name:'launch-db',setup(build){
  build.onResolve({filter:/lib\/(supabase|lesson-access)$/},a=>({path:a.path.endsWith('supabase')?'db':'hydrate',namespace:'launch-test'}));
  build.onLoad({filter:/.*/,namespace:'launch-test'},a=>({loader:'js',contents:a.path==='hydrate'?'export async function hydrateLessonDocument(d){return d}':`export const supabaseAdmin={from(table){const result=()=>({data:table==='courses'?global.__launchCourse:table==='lessons'?global.__launchLesson:table==='units'?[{id:'unit-1'}]:null});const q={select(){return q},eq(){return q},maybeSingle(){return Promise.resolve(result())},then(resolve,reject){return Promise.resolve(result()).then(resolve,reject)}};return q}}` }));
 }};
 const launch=await bundle('src/lib/present-server.ts','launch-server',[launchPlugin]);
 const actor={role:'teacher',email:'craigantocci@gmail.com'};
 let result=await launch.resolveClassLesson('l','c',actor);
 assert.equal(result.ok,false);
 assert.match(result.error,/unpublished/);
 assert.match(result.error,/Physics curriculum/);
 global.__launchLesson.published=true;
 assert.match((await launch.resolveClassLesson('l','c',actor)).error,/curriculum/);
 global.__launchLesson.unit_id='unit-1';
 assert.equal((await launch.resolveClassLesson('l','c',actor)).ok,true);
 assert.equal((await launch.resolveClassLesson('l','c',{role:'teacher',email:'other@example.org'})).ok,false);
 assert.equal((await launch.resolveClassLesson('l','c',{...actor,scopeEmail:'other@example.org'})).ok,false);
 global.__launchLesson.visibility_track='honors';
 assert.match((await launch.resolveClassLesson('l','c',actor)).error,/track/);
 global.__launchLesson.visibility_track=null;
 global.__launchLesson.content_blocks.blocks=[];
 assert.equal((await launch.resolveClassLesson('l','c',actor)).status,422);
 console.log('PASS launch publication, curriculum, aliases, effective ownership, track and empty-content checks');
})().catch(e=>{console.error(e);process.exitCode=1});
