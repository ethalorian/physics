const {createFixture:base,root,id}=require('../quiz-draft-delete/fixture.cjs'),crypto=require('node:crypto');
async function createFixture(out){
 const f=await base(out),db=global.quizFakeDB,previousRpc=db.rpc;
 db.rpc=async(name,p)=>{
  if(name!=='manage_quiz_inventory')return previousRpc(name,p);
  try{
   const rows=f.fx.rows,q=rows.quiz_assignments.find(q=>q.id===p.p_quiz),course=rows.courses.find(c=>c.id===q?.course_id&&c.teacher_email===p.p_owner);if(!q||!course)throw Error('Quiz unavailable');
   const work=rows.quiz_work.filter(w=>w.quiz_id===q.id),sub=rows.quiz_submissions.filter(s=>s.quiz_id===q.id),ids=new Set(sub.map(s=>s.id)),reviews=rows.quiz_reviews.filter(r=>ids.has(r.submission_id)),drafts=rows.quiz_review_drafts.filter(d=>ids.has(d.submission_id)),copies=rows.quiz_assignments.filter(c=>c.source_quiz_id===q.id);
   const fingerprint=crypto.createHash('md5').update(JSON.stringify([q,work,sub,reviews,drafts,copies])).digest('hex'),impact={work:work.length,submissions:sub.length,reviews:reviews.length,reviewDrafts:drafts.length,copies:copies.length,generations:0};
   if(p.p_action==='preview')return {data:{id:q.id,title:q.title,version:q.version,status:q.status,deleted_at:q.deleted_at??null,impact,fingerprint},error:null};
   if(q.version!==p.p_version)throw Error('Quiz changed. Refresh before saving.');
   if(p.p_action==='rename'){q.title=p.p_title;q.version++;return {data:{id:q.id,title:q.title,version:q.version},error:null}}
   if(fingerprint!==p.p_fingerprint||q.title!==p.p_title)throw Error('Quiz or student work changed. Reload the deletion preview and confirm again.');
   rows.quiz_review_drafts=rows.quiz_review_drafts.filter(d=>!ids.has(d.submission_id));rows.quiz_reviews=rows.quiz_reviews.filter(r=>!ids.has(r.submission_id));rows.quiz_submissions=rows.quiz_submissions.filter(s=>s.quiz_id!==q.id);rows.quiz_work=rows.quiz_work.filter(w=>w.quiz_id!==q.id);copies.forEach(c=>{c.source_quiz_id=null;c.version++});rows.quiz_assignments=rows.quiz_assignments.filter(c=>c.id!==q.id);return {data:{id:q.id,deleted:true,impact},error:null};
  }catch(e){return {data:null,error:{code:'P0001',message:e.message}}}
 };
 const mocks={'server-only':'','next/server':`export const NextResponse={json:(d,o)=>Response.json(d,o)};`,'@/lib/auth':`export const auth=async()=>global.quizFixture.session;`,'@/lib/effective-context':`export const getEffectiveContext=async()=>global.quizFixture.context;`,'@/lib/student-enrollment':`export const requireEnrolledStudent=async()=>null;`,'@/lib/content-access':`export const canEditArea=async()=>false;`,'@/lib/supabase':`export const supabaseAdmin=global.quizFakeDB;`};
 for(const name of ['manage','due-date']){await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/src/app/api/quizzes/[id]/'+name+'/route.ts'],outfile:out+'/'+name+'.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});f.handlers[name]=require(out+'/'+name+'.cjs')}
 const previous=f.call;f.call=(name,method,body={},quiz=id(10),query='')=>['list','manage','due-date'].includes(name)?f.handlers[name][method]({url:'http://local/api/quizzes'+(name==='list'?'':`/${quiz}/${name}`)+query,method,json:async()=>body},{params:Promise.resolve({id:quiz})}):previous(name,method,body,quiz,query);
 return f;
}
module.exports={createFixture,root,id};
