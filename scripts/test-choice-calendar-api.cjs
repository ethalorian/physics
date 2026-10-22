// Exercise the actual route handler with scoped authentication/catalog fixtures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out='/private/tmp/choice-calendar-api.cjs';
const course='11111111-1111-4111-8111-111111111111',student='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333',reading='44444444-4444-4444-8444-444444444444',quiz='55555555-5555-4555-8555-555555555555';
const steps=[{id:reading,sourceId:reading,kind:'reading',title:'Read motion',href:'/readings/'+reading,followUp:false},{id:quiz,sourceId:quiz,kind:'quiz',title:'Check motion',href:'/quizzes/'+quiz,followUp:false}];
const fixture=global.choiceApiFixture={ctx:{role:'teacher',realRole:'teacher',viewingAsTeacher:false,userId:student,email:'teacher@example.test',session:{}},courses:[{id:course,teacher_email:'owner@example.test',program:'physics'}],sections:[],catalog:{steps,links:[{reading:'reading:'+reading,quiz:'quiz:'+quiz}],targets:[]},writes:[],dbError:null};
(async()=>{
 const mocks={
 '@/lib/api-auth':`export const withAuth=fn=>req=>fn(req,global.choiceApiFixture.ctx);`,
 '@/lib/supabase':`export const supabaseAdmin={rpc:async(name,args)=>{const f=global.choiceApiFixture;f.writes.push({name,args});return {data:{id:args.p_section,ok:true},error:f.dbError}}};`,
 '@/lib/textbook-assignments-server':`export const readingStaff=ctx=>['teacher','admin'].includes(ctx.role);export const readingJson=(data,status=200)=>Response.json(data,{status});`,
 '@/lib/choice-calendar-server':`export const choiceCourses=async()=>global.choiceApiFixture.courses;export const choiceSections=async()=>global.choiceApiFixture.sections;export const choiceCatalog=async()=>global.choiceApiFixture.catalog;export const choiceGroupSuggestions=async()=>({groups:[],unscored:[]});export const choiceSnapshot=async()=>({sections:global.choiceApiFixture.sections});`
 };
 await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/src/app/api/choice-calendar/route.ts'],bundle:true,platform:'node',format:'cjs',outfile:out,plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 const route=require(out),post=body=>route.POST(new Request('http://localhost/api/choice-calendar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
 const create={action:'create',course_id:course,title:'Motion choices',opens_at:'2026-11-02T12:00:00Z',due_at:'2026-11-06T22:00:00Z',required_count:1,points_per_choice:10,category_minimums:{},options:[{title:'Reading choice',category:'Independent',lab:false,steps:['reading:'+reading],targetIds:[]}]};
 assert.equal((await post(null)).status,400);
 assert.equal((await post({...create,opens_at:{}})).status,400);
 assert.equal((await post({...create,required_count:3})).status,400);
 assert.equal((await post({...create,course_id:student})).status,403);
 assert.equal((await post({...create,options:[{...create.options[0],steps:['reading:unknown']}]})).status,400);
 const created=await post(create);assert.equal(created.status,201);const saved=fixture.writes.at(-1).args.p_payload;
 assert.equal(saved.options[0].steps.length,2);assert.equal(saved.options[0].steps[1].followUp,true);assert.equal(saved.options[0].steps[1].prerequisite,'reading:'+reading);assert.equal(saved.options[0].steps[0].href,'/readings/'+reading);assert.equal(fixture.writes.at(-1).args.p_actor,'owner@example.test');
 fixture.sections=[{...saved,id,published:true,published_at:'2026-11-01T12:00:00Z'}];const option=saved.options[0].id;
 assert.equal((await post(create)).status,400,'same assignment cannot count in two sections');
 fixture.ctx.role=fixture.ctx.realRole='student';
 assert.equal((await post(create)).status,403);assert.equal((await post({action:'grade',section_id:id,option_id:option,score:10})).status,403);
 const selection=await post({action:'select',section_id:id,option_id:option,user_id:quiz,planned_on:'2026-11-03'});assert.equal(selection.status,200);assert.equal(fixture.writes.at(-1).args.p_user,student,'student cannot spoof another identity');assert.equal(fixture.writes.at(-1).args.p_teacher,false);
 assert.equal((await post({action:'select',section_id:id,option_id:option,planned_on:'2026-02-30'})).status,400);
 assert.equal((await post({action:'select',section_id:id,option_id:'unknown'})).status,400);
 assert.equal((await post({action:'plan-step',section_id:id,option_id:option,step_id:reading,planned_on:'2026-11-04',user_id:quiz})).status,200);assert.equal(fixture.writes.at(-1).args.p_user,student);assert.equal(fixture.writes.at(-1).args.p_payload.step_id,reading);
 assert.equal((await post({action:'plan-step',section_id:id,option_id:option,step_id:quiz,planned_on:'2026-11-04'})).status,400,'attached quizzes keep native scheduling');
 assert.equal((await post({action:'plan-step',section_id:id,option_id:option,step_id:'unknown',planned_on:'2026-11-04'})).status,400);
 fixture.dbError={code:'P0001',message:'This group is full.'};assert.equal((await post({action:'select',section_id:id,option_id:option})).status,409);fixture.dbError=null;
 fixture.ctx.role=fixture.ctx.realRole='teacher';fixture.ctx.viewingAsTeacher=true;assert.equal((await post(create)).status,403);fixture.ctx.viewingAsTeacher=false;
 assert.equal((await post({...create,action:'update',section_id:id,version:0})).status,409);
 assert.equal((await post({...create,action:'update',section_id:id,version:1,title:'Updated choices'})).status,201);assert.deepEqual(fixture.writes.at(-1).args.p_payload.options,saved.options,'published option identities remain stable');
 assert.equal((await route.GET(new Request('http://localhost/api/choice-calendar?class='+student))).status,403);
 fixture.sections=[{...saved,id,published:false,published_at:null}];
 assert.equal((await post({action:'publish',section_id:id,published:true})).status,200);assert.equal(fixture.writes.at(-1).name,'publish_choice_sequence');assert.equal(fixture.writes.at(-1).args.p_version,1);
 const lab={id:'lab',title:'Reasoning lab',category:'Lab',lab:true,labType:'problem-solving',problem:'Plan a safe stop.',artifactInstructions:'Your worked solution.',steps:[],targetIds:[]};
 fixture.sections=[];
 assert.equal((await post({...create,options:[{...lab,problem:''}]})).status,400);
 assert.equal((await post({...create,options:[{...lab,labType:'unknown'}]})).status,400);
 assert.equal((await post({...create,options:[lab]})).status,201);const labSaved=fixture.writes.at(-1).args.p_payload;
 assert.equal(labSaved.options[0].problem,lab.problem);assert.equal(labSaved.options[0].artifactInstructions,lab.artifactInstructions);
 fixture.sections=[{...labSaved,id}];assert.equal((await post({action:'publish',section_id:id,published:true})).status,400,'lab must link a target before release');
 fixture.ctx.role=fixture.ctx.realRole='student';
 assert.equal((await post({action:'save-lab-artifact',section_id:id,option_id:labSaved.options[0].id,user_id:quiz,version:0,text:'My solution',submit:true})).status,200);
 assert.equal(fixture.writes.at(-1).args.p_user,student,'lab submission cannot spoof student');
 assert.equal((await post({action:'rate-lab-artifact',section_id:id,user_id:student,target_id:quiz,option_id:labSaved.options[0].id,version:1,level:3,note:'Good reasoning'})).status,403);
 fixture.ctx.role=fixture.ctx.realRole='teacher';
 assert.equal((await post({action:'save-lab-artifact',section_id:id,option_id:labSaved.options[0].id,version:0,text:'Spoof',submit:true})).status,403);
 fixture.sections=[{...saved,id,published:false,published_at:null}];
 const before=fixture.writes.length;fixture.catalog.steps=[];assert.equal((await post({action:'publish',section_id:id,published:true})).status,400);assert.equal(fixture.writes.length,before,'unavailable sources cannot reach publication');
 console.log('PASS: atomic publish routing and source revalidation, route scoping, teacher/student permissions, spoofed identity, malformed inputs, canonical activity links, automatic attached quizzes, duplicate ownership, conflict responses and published editing.');
})().catch(e=>{console.error(e);process.exitCode=1});
