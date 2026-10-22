const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=process.env.READING_ROOT||path.resolve(__dirname,'..'),out=process.env.READING_OUTPUT||path.resolve(root,'../unassign-ui');fs.mkdirSync(out,{recursive:true});
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const course={id:id(1),name:'Physics',section:'Period 2',program:'physics'};
const assignment={id:id(10),course_id:course.id,title:'Motion and speed',chapter:4,reading:'Chapter 4',questions:[{id:id(20),reference:'Question 1',prompt:'Explain speed.',target_id:id(3)}],section_ids:[],instructions:'',status:'published',version:1,due_at:null,created_at:new Date().toISOString()};
const students=[{id:id(2),name:'Alex Rivera'},{id:id(4),name:'Jordan Lee'}],work=[{assignment_id:assignment.id,user_id:id(2),state:'in_progress',version:1,answers:{[id(20)]:'Distance over time.'},updated_at:new Date().toISOString()}];
const excused=new Set();let fail=false,requests=0,server,browser;
(async()=>{
const mocks={
 'next/link':`import React from 'react';export default function Link({prefetch,href,onClick,...p}){return <a {...p} href={href} onClick={e=>{onClick?.(e);if(!e.defaultPrevented&&!p.target){e.preventDefault();history.pushState(null,'',href);window.dispatchEvent(new Event('route'))}}}/>}`,
 'next/navigation':`export const useRouter=()=>({push:p=>{history.pushState(null,'',p);window.dispatchEvent(new Event('route'))},replace:p=>{history.replaceState(null,'',p);window.dispatchEvent(new Event('route'))}});export const useSearchParams=()=>new URLSearchParams(location.search);`,
 'next/dynamic':`import React,{lazy,Suspense}from'react';export default function dynamic(loader,options){const C=lazy(loader);return function Dynamic(p){return <Suspense fallback={null}><C {...p}/></Suspense>}}`,
 './ReadingAssignmentResources':`export default function Resources(){return null};export function ReadingQuestionText(){return null}`,
 './interactive/registry':`export const interactiveChapterForAssignment=()=>null;`,
 './ReadingMindMap':`export default function Map(){return null}`,
 './ReadingSyllabus':`export default function Syllabus(){return null}`,
 './ReadingComposer':`export default function Composer(){return null}`,
 '@/components/quizzes/QuizTeacher':`export default function Quiz(){return null}`,
 '@/components/vocabulary/VocabLearningBoard':`export default function Vocab(){return null}`,
};
await require(root+'/node_modules/esbuild').build({absWorkingDir:root,stdin:{resolveDir:root,loader:'tsx',contents:`import React,{useState,useEffect}from'react';import{createRoot}from'react-dom/client';import Dashboard from './src/components/readings/ReadingDashboard';import Student from './src/components/readings/StudentReadings';function App(){const[url,setUrl]=useState(location.href);useEffect(()=>{const f=()=>setUrl(location.href);window.addEventListener('route',f);return()=>window.removeEventListener('route',f)},[]);return location.pathname.startsWith('/admin')?<Dashboard initialView="assignments"/>:<Student/>}createRoot(document.getElementById('root')).render(<App/>);`},bundle:true,platform:'browser',format:'esm',outfile:out+'/app.js',jsx:'automatic',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'jsx',resolveDir:root}))}}]});
server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://local');const staff=req.headers['x-fixture-role']==='teacher'||req.headers.cookie?.includes('fixture-role=teacher');const reply=(data,status=200)=>{res.statusCode=status;res.setHeader('content-type','application/json');res.end(JSON.stringify(data))};
if(url.pathname.startsWith('/api/')){
 if(req.method==='POST'){let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw);requests++;if(fail){fail=false;return reply({error:'Assignment changed. Refresh before saving.'},409)}
 if(body.version!==assignment.version)return reply({error:'Stale version'},409);
 if(body.action==='archive')assignment.status='archived';else if(body.action==='reopen')assignment.status='published';else if(body.action==='excuse')excused.add(body.student_id);else if(body.action==='restore-student')excused.delete(body.student_id);else return reply({error:'Unexpected action'},400);assignment.version++;return reply({ok:true});}
 if(url.pathname==='/api/readings')return reply({staff,courses:[course],assignments:staff||!excused.has(id(2))?[assignment]:[],work:staff?[]:work,review_counts:{}});
 if(url.pathname==='/api/readings/catalog')return reply({courses:[course],units:[],targets:[],readOnly:false});
 if(url.pathname==='/api/reading-syllabus')return reply({staff,courses:[course],steps:[],bundles:[],readOnly:false});
 if(url.pathname==='/api/quizzes')return reply({staff,quizzes:[],pending:{}});
 return reply({staff,assignment,students,work,submissions:[],reviews:[],targets:[],excused_student_ids:[...excused]});}
if(['/app.js','/app.css'].includes(url.pathname)){res.setHeader('content-type',url.pathname.endsWith('js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+url.pathname));}
res.setHeader('set-cookie','fixture-role='+(url.pathname.startsWith('/admin')?'teacher':'student')+'; Path=/');res.setHeader('content-type','text/html');res.end('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>:root{--background:#fff;--foreground:#142332;--card:#fff;--muted-foreground:#586575;--primary:#17644a;--border:#ccd6d1;--radius:8px}body{font-family:system-ui;margin:24px}button,select,input{font:inherit;padding:10px}a{color:inherit}button{cursor:pointer}h1,h2,h3,p{margin:0} .self-start{align-self:flex-start} .text-muted-foreground{color:#586575}</style></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
if(process.env.READING_PREVIEW==='1'){console.log(url);await new Promise(()=>{});}
browser=await chromium.launch({headless:true,channel:'chrome'});const context=await browser.newContext({viewport:{width:1280,height:1000},extraHTTPHeaders:{'x-fixture-role':'teacher'}}),page=await context.newPage(),student=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));student.on('pageerror',e=>errors.push(e.message));
await page.goto(url+'/admin/readings?view=assignments');await page.getByRole('button',{name:'Unassign reading: Motion and speed',exact:true}).waitFor();
await page.getByRole('button',{name:'Unassign reading: Motion and speed',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(requests,0,'cancel does not mutate');
await page.getByRole('button',{name:'Unassign reading: Motion and speed',exact:true}).click();await page.getByRole('button',{name:'Unassign from class',exact:true}).click();await page.getByRole('heading',{name:'No work assigned here'}).waitFor();
await student.goto(url+'/readings');await student.getByRole('heading',{name:'No readings assigned yet'}).waitFor();assert.equal(await student.getByRole('link',{name:'Start reading'}).count(),0);
await student.getByLabel('Show my work from removed readings').check();await student.getByRole('link',{name:'View saved work'}).waitFor();
await page.getByRole('button',{name:/^Unassigned 1$/}).click();await page.getByRole('button',{name:'Reassign reading: Motion and speed',exact:true}).click();await page.getByRole('button',{name:'Reassign',exact:true}).click();await page.getByRole('heading',{name:'No unassigned work here'}).waitFor();
await page.getByRole('button',{name:/^Assigned 1$/}).click();await page.getByRole('link',{name:'Students & work',exact:true}).click();await page.getByRole('button',{name:'Unassign from student'}).waitFor();
fail=true;page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Unassign from student'}).click();await page.getByRole('alert').filter({hasText:'Assignment changed'}).waitFor();assert.equal(excused.size,0,'failed request does not unassign');
page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Unassign from student'}).click();await page.getByRole('button',{name:'Reassign to student'}).waitFor();assert(excused.has(id(2)));assert.equal(work[0].answers[id(20)],'Distance over time.');
await student.reload();await student.getByRole('heading',{name:'No readings assigned yet'}).waitFor();
await page.screenshot({path:out+'/unassigned-student.png',fullPage:true});
await page.getByRole('combobox',{name:'Show students'}).selectOption('unassigned');await page.getByRole('button',{name:/Alex Rivera Unassigned/}).waitFor();assert.equal(await page.getByRole('button',{name:/Jordan Lee/}).count(),0);
page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Reassign to student'}).click();await page.getByRole('button',{name:'Unassign from student'}).waitFor();assert.equal(excused.size,0);
await student.reload();await student.getByRole('heading',{name:'Motion and speed'}).waitFor();await student.getByRole('link',{name:'Continue reading'}).waitFor();
await page.getByRole('combobox',{name:'Show students'}).selectOption('all');
for(const width of [390,768,1280]){await page.setViewportSize({width,height:950});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow at '+width)}
assert.deepEqual(errors,[]);console.log('PASS: class and student unassign/reassign, cancellation, failed-save recovery, active-list removal, retained work, status filter, and responsive layouts.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
