// Local-only browser → actual route → disposable PostgreSQL verification.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{randomUUID}=require('node:crypto');
module.exports=async f=>{
 const {api,rows,request,call,student,teacher,course,alice,bob,foundationLesson,reviewLesson,answers,root,out}=f,pkg=n=>require(root+'/node_modules/'+n);
 const mocks={
  'next/dynamic':`import React,{lazy,Suspense}from'react';export default function dynamic(loader){const C=lazy(loader);return p=><Suspense fallback={<p>Loading…</p>}><C {...p}/></Suspense>}`,
  'next/link':`import React from 'react';export default function Link({prefetch,...p}){return <a {...p}/>}`,
  'next/image':`import React from 'react';export default function Image({fill,priority,unoptimized,...p}){return <img {...p}/>}`,
  'next/navigation':`export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({replace:u=>location.assign(u),push:u=>location.assign(u)});export const usePathname=()=>location.pathname;`,
  'next-auth/react':`export const useSession=()=>({data:{user:{role:'teacher',email:'teacher@example.test'}}});`,
 };
 await pkg('esbuild').build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Calendar from './src/components/interactive-assignments/AssignmentCalendar';import Lesson from './src/components/interactive-assignments/VelocityAssignment';import Quiz from './src/components/quizzes/QuizStudentWork';const p=location.pathname;createRoot(document.getElementById('root')).render(p.startsWith('/interactive-assignments/')?<Lesson id={p.split('/').at(-1)}/>:p.startsWith('/quizzes/')?<Quiz id={p.split('/').at(-1)}/>:<Calendar/>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:out+'/app.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'browser-boundaries',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}))}}]});
 const css=await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({base:root})]).process(fs.readFileSync(root+'/src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});fs.writeFileSync(out+'/style.css',css.css+'\n'+fs.readFileSync(out+'/app.css','utf8'));
 if(process.env.SPACED_PREVIEW_BUILD_ONLY==='1')return;
 let queue=Promise.resolve();const requests=[];
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1:4327');
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/fixture/')){queue=queue.catch(()=>{}).then(async()=>{
   const who=(req.headers.cookie??'').match(/fixtureUser=(teacher|alex|blair)/)?.[1]??'teacher';who==='teacher'?teacher():student(who==='alex'?alice:bob);
   const bundle=rows('daily_lesson_sequences')[0];let response;
   if(url.pathname==='/fixture/complete-foundation'){
    const user=who==='blair'?bob:alice;student(user);
    const actions=[await call('partnerPost',bundle.foundation_id,{action:'makeup',text:''})];teacher();actions.push(await call('partnerPost',bundle.foundation_id,{action:'approveMakeup',userId:user}));student(user);
    for(const checkpoint of ['evidence','model','questions'])for(const action of ['share','reply','reflect'])actions.push(await call('partnerPost',bundle.foundation_id,{action,checkpoint,text:'Fictional verification: I used the motion evidence, considered an alternative and checked the force assumption.'}));
    actions.push(await call('lessonSave',bundle.foundation_id,{version:0,state:answers(foundationLesson),submitId:randomUUID()}));
    if(actions.some(r=>!r.ok))throw Error('Fictional foundation setup failed: '+await actions.find(r=>!r.ok).text());response=Response.json({ok:true});
   }else if(url.pathname==='/fixture/open-review'){res.writeHead(302,{Location:'/interactive-assignments/'+bundle.review_id});res.end();return;
   }else if(url.pathname==='/fixture/open-quiz'){res.writeHead(302,{Location:'/quizzes/'+bundle.quiz_id});res.end();return;
   }else if(url.pathname==='/fixture/records'){response=Response.json({requests,assignments:rows('interactive_assignments'),sequences:rows('daily_lesson_sequences'),work:rows('interactive_assignment_work'),submissions:rows('interactive_assignment_submissions'),quizzes:rows('quiz_assignments').map(({id,due_at,status})=>({id,due_at,status}))});
   }else{
    let raw='';for await(const data of req)raw+=data;const r=new Request(url,{method:req.method,...(raw?{headers:{'content-type':'application/json'},body:raw}:{})});
    const match=url.pathname.match(/^\/api\/interactive-assignments\/([^/]+)(?:\/(partner|sequence))?$/),quiz=url.pathname.match(/^\/api\/quizzes\/([^/]+)$/);
    requests.push({path:url.pathname,method:req.method,user:who});
    if(url.pathname==='/api/interactive-assignments')response=await (req.method==='POST'?api.schedule:api.assignmentList)(r);
    else if(match)response=await api[match[2]==='partner'?req.method==='POST'?'partnerPost':'partnerGet':match[2]==='sequence'?'sequence':req.method==='POST'?'lessonSave':'lessonGet'](r,{params:{id:match[1]}});
    else if(quiz)response=await api[req.method==='POST'?'quizPost':'quizGet'](r,{params:{id:quiz[1]}});
    else if(url.pathname==='/api/student-progress')response=await api.progress(r);
    else response=Response.json({});
   }
   res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(await response.text());
  }).catch(e=>{console.error(e);res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}))});return;}
  if(url.searchParams.has('user'))res.setHeader('Set-Cookie','fixtureUser='+url.searchParams.get('user')+'; Path=/; SameSite=Strict');
  if(['/app.js','/style.css'].includes(url.pathname)){res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+url.pathname))}
  const file=path.resolve(root+'/public','.'+url.pathname);if(file.startsWith(root+'/public/')&&fs.existsSync(file)&&fs.statSync(file).isFile()){res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'application/octet-stream');return res.end(fs.readFileSync(file))}
  res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html lang="en" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Spaced practice · fictional local verification</title><link rel="stylesheet" href="/style.css"></head><body style="background:var(--background);color:var(--foreground);margin:0"><aside style="padding:16px;border-bottom:1px solid;text-align:center">Local verification · fictional students only. <a href="/calendar?user=teacher&class=${course}&activity=${foundationLesson.slug}&plan=1">Teacher calendar</a> · <a href="/fixture/open-review" onclick="document.cookie='fixtureUser=alex; Path=/; SameSite=Strict'">Alex review</a> · <a href="/fixture/open-review" onclick="document.cookie='fixtureUser=blair; Path=/; SameSite=Strict'">Blair review</a> · <a href="/fixture/open-quiz">Quiz</a> · <button onclick="fetch('/fixture/complete-foundation',{method:'POST'}).then(r=>r.json()).then(r=>this.textContent=r.ok?'Fictional foundation submitted':'Setup failed')">Load completed foundation example</button></aside><div id="root"></div><script type="module" src="/app.js"></script></body></html>`);
 });
 server.listen(4327,'127.0.0.1',()=>console.log('Spaced practice preview http://127.0.0.1:4327/calendar?user=teacher&class='+course+'&activity='+foundationLesson.slug+'&plan=1'));
 await new Promise(resolve=>{process.once('SIGINT',()=>{server.close();resolve()})});
};
