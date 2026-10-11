// Real routes and React; synthetic class data and Claude response only.
const fs=require('fs'),path=require('path');const {createFixture:baseFixture,root,id}=require('../quiz-grading/fixture.cjs');
async function createFixture(out){
 const base=await baseFixture(out),{fx}=base;fx.rows.quiz_generations=[];fx.aiCalls=0;fx.aiFailure=null;fx.failFinish=false;
 const target=fx.rows.learning_targets[0];target.slug='motion';target.lesson_id=id(200);
 fx.rows.lessons=[{id:id(200),title:'Position & displacement · Video 3',unit_id:'unit-1',lesson_number:3,content_blocks:{presentation:'physics-path',learningPath:{targetSlugs:['motion'],focus:'Describe position and displacement.'},blocks:[{type:'instruction_video',summary:'Choose a reference point. Displacement is final position minus initial position.',youtubeId:'fixture'},{type:'target',targetId:'motion',statement:target.statement}]}},{id:id(201),title:'Old day lesson',unit_id:'unit-1',lesson_number:1,content_blocks:{blocks:[]}}];
 const db=global.quizFakeDB,previousRpc=db.rpc;
 db.rpc=async(name,p)=>{
  if(name==='reserve_quiz_generation'){
   const old=fx.rows.quiz_generations.find(g=>g.id===p.p_request.id);
   if(old)return old.created_by===p.p_actor&&JSON.stringify(old.request)===JSON.stringify(p.p_request)?{data:{generation:structuredClone(old),created:false},error:null}:{data:null,error:{code:'P0001',message:'Request changed'}};
   const g={id:p.p_request.id,course_id:p.p_request.course_id,created_by:p.p_actor,request:structuredClone(p.p_request),status:'pending',quiz_payload:null,created_at:new Date().toISOString()};fx.rows.quiz_generations.push(g);return {data:{generation:structuredClone(g),created:true},error:null};
  }
  if(name==='finish_quiz_generation'){
   if(fx.failFinish){fx.failFinish=false;return {data:null,error:{code:'P0001',message:'Temporary save failure. Resume draft.'}}}
   const g=fx.rows.quiz_generations.find(g=>g.id===p.p_id);if(g.status==='ready')return {data:structuredClone(fx.rows.quiz_assignments.find(q=>q.id===g.id)),error:null};
   const result=await previousRpc('save_quiz_assignment',{p_quiz:g.quiz_payload,p_actor:p.p_actor,p_owner:p.p_owner});if(!result.error)g.status='ready';return result;
  }
  return previousRpc(name,p);
 };
 const originalFetch=global.fetch;process.env.ANTHROPIC_API_KEY='synthetic-key';
 global.fetch=async(url,options)=>{
  if(String(url)!=='https://api.anthropic.com/v1/messages')return originalFetch(url,options);
  fx.aiCalls++;const input=JSON.parse(JSON.parse(options.body).messages[0].content);fx.aiInput=input;fx.aiSystem=JSON.parse(options.body).system;
  if(fx.aiDelay)await new Promise(resolve=>setTimeout(resolve,fx.aiDelay));
  if(fx.aiFailure==='http')return Response.json({}, {status:429});
  if(fx.aiFailure==='transient'){fx.aiFailure=null;return Response.json({}, {status:503});}
  const qs=Array.from({length:input.question_count},(_,i)=>{
   const q=structuredClone(base.questions[i%base.questions.length]);delete q.id;
   q.prompt=`${q.prompt}${i>=3?' Use a new reference point and justify your choice. '+i:''}`;
   q.target_id=input.targets[i%input.targets.length].id;
   if(input.format==='choice'){q.kind='choice';q.options=['Displacement','Distance','Speed','Time'];q.correct_index=0}
   if(input.format==='written'){q.kind='written';delete q.options;delete q.correct_index}
   return q;
  });if(fx.aiFailure==='target')qs[0].target_id=id(999);
  return Response.json({model:'claude-sonnet-4-6',stop_reason:'end_turn',usage:{input_tokens:1000,output_tokens:1000},content:[{type:'text',text:JSON.stringify({title:'Position & displacement · Lesson check',instructions:'Work independently. Explain signs and directions.',questions:qs})}]});
 };
 const mocks={'server-only':'','next/server':`export const NextResponse={json:(d,o)=>Response.json(d,o)};`,'@/lib/auth':`export const auth=async()=>global.quizFixture.session;`,'@/lib/effective-context':`export const getEffectiveContext=async()=>global.quizFixture.context;`,'@/lib/student-enrollment':`export const requireEnrolledStudent=async()=>null;`,'@/lib/content-access':`export const canEditArea=async()=>false;`,'@/lib/supabase':`export const supabaseAdmin=global.quizFakeDB;`};
 const file=out+'/generate.cjs';await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/src/app/api/quizzes/generate/route.ts'],outfile:file,bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});base.handlers.generate=require(file);
 const baseCall=base.call;base.call=(name,method,body={},quizId=id(10),query='')=>name==='generate'?base.handlers.generate[method]({method,nextUrl:new URL('http://fixture/api/quizzes/generate'+query),json:async()=>body},{params:Promise.resolve({})}):baseCall(name,method,body,quizId);
 return base;
}
module.exports={createFixture,root,id};
