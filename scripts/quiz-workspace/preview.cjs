// Real React components and API handlers with disposable synthetic data.
// Browser checks use Codex computer use, not a separate automation runtime.
const fs=require('node:fs'),http=require('node:http'),{createFixture,root,id}=require('../quiz-inventory/fixture.cjs');
(async()=>{
 const out='/private/tmp/quiz-workspace-preview',f=await createFixture(out),pkg=n=>require(root+'/node_modules/'+n),{fx,seed}=f;
 f.role('teacher');
 const names=['Alex Rivera','Casey Morgan','Drew Brooks','Emery Chen','Jordan Lee','Morgan Patel','Riley Taylor','Sam Parker','Avery Ellis','Blake Santos','Cameron Reid','Dakota Woods','Finley Ross','Harper Nguyen','Jamie Cole','Jules Gray','Kai Bell','Logan Shaw','Noah Lane','Peyton Cruz','Quinn Adams','Reese Kim','Skyler Reed','Taylor Fox'];
 const students=names.map((name,i)=>({id:id(600+i),name,is_active:true}));fx.rows.students.push(...students);
 fx.rows.course_students=students.map((st,i)=>({id:id(700+i),student_id:st.id,course_id:id(1),students:st,enrollment_state:'ACTIVE'}));
 const titles=['Motion · after reteaching','Motion · first look','Vectors · draft for next week','Motion · retired question set','Scalars & vectors','Reading position graphs','Velocity check','Motion applications'];
 fx.rows.quiz_assignments=titles.map((title,i)=>({...structuredClone(seed),id:id(800+i),title,status:i===2?'draft':i===3?'archived':'published',created_at:`2026-10-0${i===0?6:i===1?1:i===2?7:i>3?5:2}T12:00:00Z`,due_at:i===0?'2026-10-09T19:00:00Z':null,deleted_at:null}));
 fx.rows.quiz_work=[];fx.rows.quiz_submissions=[];fx.rows.quiz_reviews=[];
 for(const [j,q]of fx.rows.quiz_assignments.entries()){
  if(q.status==='draft')continue;
  for(const [i,st]of students.entries()){
   const state=j===0?(i===5?'submitted':i===6?'returned':i===7?'not_started':'graded'):'graded';if(state==='not_started')continue;
   const sid=id(900+j*100+i),earned=j===1?4+i%3:j===3?5+i%4:6+i%5;
   fx.rows.quiz_work.push({quiz_id:q.id,user_id:st.id,answers:{},state,version:2,submission_id:sid});
   fx.rows.quiz_submissions.push({id:sid,quiz_id:q.id,user_id:st.id,answers:{[id(20)]:'1',[id(21)]:'Distance is 6 m. The student returns to the start, so displacement is zero.',[id(22)]:{model:'Right is positive.',plan:'Final minus initial position.',work:'−2 − 6 = −8 m',answer:'8 m left; distance 8 m.'}},snapshot:structuredClone(q),submitted_at:`2026-10-0${j===0?7:3}T12:00:00Z`});
   if(state==='graded'||state==='returned')fx.rows.quiz_reviews.push({id:id(10000+j*100+i),submission_id:sid,decision:state,scores:state==='graded'?{[id(21)]:Math.min(4,earned-2),[id(22)]:Math.max(0,earned-6)}:{},ratings:state==='graded'?{[id(3)]:j===1?(i%2?2:1):i<4?3:2,[id(5)]:j===1?1:i<3?3:2}:{},earned:state==='graded'?earned:null,possible:10,grade_mode:'numeric',grade_value:null,note:state==='returned'?'Add your reasoning about direction.':'Your explanation separates path length from change in position.',question_notes:{},reviewed_at:`2026-10-0${j===0?7:3}T13:00:00Z`});
  }
 }
 const mocks={
  'next/link':`import React from'react';export default function Link({href,onClick,prefetch,...p}){return <a {...p} href={href} onClick={e=>{onClick?.(e);if(!e.defaultPrevented){e.preventDefault();history.pushState(null,'',href);window.dispatchEvent(new Event('route'))}}}/>}`,
  'next/navigation':`export const useRouter=()=>({push:p=>{history.pushState(null,'',p);window.dispatchEvent(new Event('route'))},replace:p=>{history.replaceState(null,'',p);window.dispatchEvent(new Event('route'))}});export const useSearchParams=()=>new URLSearchParams(location.search);`,
  'next/dynamic':`import React,{lazy,Suspense}from'react';export default function dynamic(loader){const C=lazy(loader);return p=><Suspense fallback={null}><C {...p}/></Suspense>}`
 };
 await pkg('esbuild').build({stdin:{resolveDir:root,loader:'tsx',contents:`import React,{useEffect,useState}from'react';import{createRoot}from'react-dom/client';import Teacher from'./src/components/quizzes/QuizTeacher';function App(){const[route,setRoute]=useState(location.search);useEffect(()=>{const update=()=>setRoute(location.search);window.addEventListener('route',update);window.addEventListener('popstate',update);return()=>{window.removeEventListener('route',update);window.removeEventListener('popstate',update)}},[]);return <><div style={{padding:10,fontSize:12,background:'#eceef4',color:'#343650',textAlign:'center'}}>LOCAL PREVIEW · Synthetic students and grades · <button onClick={()=>document.documentElement.classList.toggle('dark')}>Toggle dark theme</button></div><Teacher embedded classId={new URLSearchParams(route).get('class')||''} onClassChange={id=>{const p=new URLSearchParams(location.search);if(id)p.set('class',id);else p.delete('class');history.pushState(null,'','/admin/control-room?'+p);window.dispatchEvent(new Event('route'))}}/></>};createRoot(document.getElementById('root')).render(<App/>);`},outfile:out+'/app.js',bundle:true,format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}))}}]});
 const css=await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({base:root})]).process(fs.readFileSync(root+'/src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});fs.writeFileSync(out+'/style.css',css.css+'\n'+fs.readFileSync(out+'/app.css','utf8'));
 if(process.env.QUIZ_BUILD_ONLY==='1')return;
 http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://local');res.setHeader('Cache-Control','no-store');
  if(u.pathname.startsWith('/api/quizzes')){let raw='';for await(const c of req)raw+=c;const parts=u.pathname.split('/'),name=parts.length===3?'list':parts[3]==='results'?'results':['manage','due-date','draft'].includes(parts[4])?parts[4]:parts[3]==='catalog'?'catalog':'detail';const response=await f.call(name,req.method,raw?JSON.parse(raw):{},parts[3]||id(800),u.search);res.statusCode=response.status;res.setHeader('Content-Type','application/json');return res.end(await response.text())}
  if(['/app.js','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname))}
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quiz workspace preview</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>')
 }catch(e){res.statusCode=500;res.end(JSON.stringify({error:e.message}));console.error(e)}}).listen(Number(process.env.QUIZ_PREVIEW_PORT||4398),'127.0.0.1',()=>console.log('Quiz workspace preview: http://127.0.0.1:'+(process.env.QUIZ_PREVIEW_PORT||4398)+'/admin/control-room?view=quizzes&class='+id(1)));
})().catch(e=>{console.error(e);process.exitCode=1});
