const fs = require('node:fs'), http = require('node:http'), path = require('node:path'), assert = require('node:assert/strict');
const root = process.env.STUDENT_HOME_ROOT || path.resolve(__dirname, '..'), pkg = n => require(path.join(root, 'node_modules', n));
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = process.env.STUDENT_HOME_OUTPUT || '/private/tmp/student-home-calendar-browser'; fs.mkdirSync(out, {recursive:true});
let browser, server, mode = 'dashboard';
let pendingGrowth=[];
const requests = []; const writes=[]; let plans={};
const today='2026-10-22',dates=['2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25'];
const growth={competencies:[{id:'pr1',code:'PR1',statement:'Scale a quantity using ratios',strand:'proportional-reasoning',sequenceOrder:4},{id:'qe2',code:'QE2',statement:'Track and convert units',strand:'quantities-estimation',sequenceOrder:6},{id:'gv1',code:'GV1',statement:'Read slope and area on a graph',strand:'graphs-vectors',sequenceOrder:11}],focus:[{competencyId:'gv1',unitId:'u1',role:'introduce',physicsHook:'Slope connects position and time to velocity.'},{competencyId:'gv1',unitId:'unit-4',role:'revisit',physicsHook:'Area under a force-distance graph is work.'}],records:[{competencyId:'gv1',level:1,observedAt:'2026-09-20T16:00:00Z'},{competencyId:'gv1',level:2,observedAt:'2026-10-06T16:00:00Z'}]};
const xp = { track:'standard',unitTarget:700,lessonTarget:500,mathTarget:200,currentUnitId:'u1',units:[{id:'u1',name:'Motion & Forces',lesson_earned:160,math_earned:80,evidence_count:4,lesson_available:500,math_target:200}],term:{label:'Term 1',starts_at:'2026-09-01T00:00:00Z',ends_at:'2026-11-01T00:00:00Z',earned:240,minimum_xp:1400,grade_points:5} };
const home = {student:{name:'Alex'}, points:{xp:240,balance:180}, streak:{current:3}, continue:{unitId:'u1',unitName:'Motion & Forces',lesson:{slug:'motion-investigation',title:'Investigating motion',lessonNumber:3,progress:40},sequence:[],completed:2,total:12},retry:[{targetId:'motion',statement:'Explain motion using a position graph',domain:'reasoning',level:2}],climb:[{observedAt:'2026-09-01',level:1,domain:'reasoning'},{observedAt:'2026-09-08',level:2,domain:'reasoning'}]};
const dashboardHomework = Array.from({length:14},(_,i)=>({id:'video'+(i+1),slug:'video-'+(i+1),sequence:i+1,title:'Physics video '+(i+1),due_at:i===1?new Date(Date.now()+86400000).toISOString():null,complete:i>=10}));
const readingData = {staff:false,courses:[],assignments:[{id:'r1',title:'Read about motion',status:'published',due_at:new Date(Date.now()-86400000).toISOString()},{id:'r2',title:'Read about force',created_at:new Date().toISOString(),status:'published',due_at:null},{id:'r3',title:'Submitted reading',status:'published',due_at:null}],work:[{assignment_id:'r2',state:'returned'},{assignment_id:'r3',state:'submitted'}]};
const quizData = {locked:[{id:'q4',course_id:'c1',title:'Reading check: force',due_at:null,created_at:new Date().toISOString(),reading_id:'r2',reading_title:'Read about force'}],staff:false,courses:[],reviews:[],quizzes:[{id:'q1',title:'Reading check: motion',status:'published',due_at:new Date(Date.now()+2*86400000).toISOString()},{id:'q2',title:'Later quiz',status:'published',due_at:null},{id:'q3',title:'Graded quiz',status:'published',due_at:null}],work:[{quiz_id:'q3',state:'graded'}]};

const at=i=>dates[i]+'T16:00:00.000Z';
readingData.assignments=[{id:'r1',title:'Read about motion',status:'published',due_at:at(6)},{id:'r2',title:'Unscheduled reading',status:'published',due_at:null}];readingData.work=[];
quizData.quizzes=[{id:'q1',title:'Motion check',kind:'understanding',status:'published',due_at:at(0)},{id:'q2',title:'Motion vocabulary quiz',kind:'vocabulary',status:'published',due_at:at(3)},{id:'old',title:'Existing date to review',kind:'understanding',status:'published',due_at:at(1)}];quizData.work=[];quizData.locked=[];
const classItems=[{id:'quiz:q1',sourceId:'q1',kind:'quiz',quizSchedule:'regular',title:'Motion check',dueAt:at(0),access:'open',version:1,href:'/quizzes/q1',canEditDue:true},{id:'quiz:q2',sourceId:'q2',kind:'quiz',quizSchedule:'vocabulary',title:'Motion vocabulary quiz',dueAt:at(3),access:'open',version:1,href:'/quizzes/q2',canEditDue:true},{id:'reading:r1',sourceId:'r1',kind:'reading',title:'Read about motion',dueAt:at(6),access:'open',version:1,href:'/readings/r1',canEditDue:true}];
(async()=>{
 await pkg('esbuild').build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Home from './src/app/home/page';import Navbar from './src/components/navbar';import GalleryPage from './src/app/avatar/gallery/page';import XpPage from './src/app/xp/page';createRoot(document.getElementById('root')).render(<><Navbar/><main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{location.pathname==='/avatar/gallery'?<GalleryPage/>:location.pathname==='/xp'?<XpPage/>:<Home/>}</main></>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:out+'/app.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fixture',setup(b){
 const mocks={
 'next/link':`import React from 'react';export default function Link({prefetch,...p}){return React.createElement('a',p)}`,
 'next/image':`import React from 'react';export default function Image({fill,priority,unoptimized,...p}){return React.createElement('img',p)}`,
 'next/navigation':`export const usePathname=()=>'/home';export const useRouter=()=>({push:p=>location.assign(p)});`,
 'next-auth/react':`export const useSession=()=>({data:{user:{name:'Alex',role:location.search.includes('teacher')?'teacher':'student'}},status:'authenticated'});export const signIn=()=>{};`,
 '@/lib/use-view-as':`export const useViewAs=()=>({role:location.search.includes('teacher')?'teacher':'student'});`,
 '@/contexts/ViewModeContext':`export const useViewMode=()=>({viewMode:'student'});`,
 '@/hooks/useViewAwarePermissions':`export const useViewAwarePermissions=()=>({isAuthenticated:true,canAccessAdmin:false});`,
 '@/components/AccountMenu':`export default function Account(){return <button aria-label="Account" className="min-h-11">Alex</button>}`,
 '@/components/NotificationBell':`export default function Bell(){return null}`,
 '@/components/physics-level-badge':`export function PhysicsLevelBadge(){return null}`,
 '@/components/ui/theme-toggle':`export function ThemeToggle(){return null}`,
 };
 b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}));
 }}]});
 const css=await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({base:root})]).process(fs.readFileSync(root+'/src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});fs.writeFileSync(out+'/style.css',css.css+'\n'+fs.readFileSync(out+'/app.css','utf8'));
 server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');requests.push(u.pathname);const json=(d,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(d))};
 if(u.pathname==='/api/choice-calendar')return json({staff:['teacher','readonly','save-error'].includes(mode),readOnly:mode==='readonly',courses:[{id:'c1',name:'Physics',section:'A'}],courseId:'c1',sections:[{id:'choice1',course_id:'c1',title:'Optional Physics practice',opens_at:at(0),due_at:at(6),required_count:1,category_minimums:{},points_per_choice:10,published:true,version:1,options:[{id:'read-choice',title:'Choose a Physics activity',category:'Independent',lab:false,targetIds:[],steps:[{id:'step1',kind:'reading',sourceId:'r2',title:'Unscheduled reading',href:'/readings/r2',followUp:false}]}]}],roster:[{id:'u1',name:'Alex'}],selections:[],slots:[],bookings:[],evidence:{u1:{}},progress:{u1:{choice1:{completed:0,required:1,missing:1,complete:false,overdue:false,deficits:[],pendingQuizzes:0,missingEntries:[],options:[{option:{id:'read-choice'},selected:false,attempted:false,completed:false,pendingQuizzes:0,grade:'available'}]}}}});
 if(u.pathname==='/api/class-work')return json({courseId:'c1',items:classItems,warnings:[],readOnly:mode==='readonly'});
 if(req.method==='POST'&&(u.pathname.includes('/due-date')||u.pathname==='/api/readings/r1')){let body='';req.on('data',c=>body+=c);req.on('end',()=>{const patch=JSON.parse(body);writes.push(patch);if(mode==='save-error')return json({error:'Assignment changed. Refresh before saving.'},409);const item=classItems.find(i=>u.pathname.includes('/'+i.sourceId));item.dueAt=patch.due_at;item.version++;json({due_at:item.dueAt,version:item.version});});return;}
 if(mode==='teacher'||mode==='readonly'||mode==='save-error'){if(u.pathname==='/api/readings')return json({...readingData,staff:true,courses:[{id:'c1',name:'Physics',section:'A'}]});}
 if(u.pathname==='/api/vocab/tasks')return json({tasks:[{id:'v1',title:'Unit word practice',task_kind:'practice',due_on:dates[6],progress:[{complete:false}]},{id:'legacy',title:'Legacy vocab quiz',task_kind:'quiz',due_on:dates[3],progress:[{}]}]});
 if(u.pathname==='/api/home/plan') { if(req.method==='POST') { let body='';req.on('data',c=>body+=c);req.on('end',()=>{const p=JSON.parse(body);writes.push(p);if(mode==='plan-error')return json({},503);plans[p.assignment_key]=p.planned_on;json({saved:true});});return;}return json({plans}); }
 if(u.pathname==='/api/home/pace')return mode==='pace-error'?json({},503):json({today,dates:mode==='new-student'?[]:['2026-09-30','2026-10-01','2026-10-02','2026-10-05','2026-10-06'],activeDays:mode==='on-track'?4:3,engagement:mode==='new-student'?null:mode==='on-track'?80:60,learningXp:160,xpRate:mode==='new-student'?null:32,ready:mode!=='new-student',calendarReady:true,noSchoolDates:[],historical:{dates:mode==='new-student'?[]:Array.from({length:28},(_,i)=>new Date(Date.parse('2026-09-09T12:00:00Z')+i*86400000)).filter(d=>![0,6].includes(d.getUTCDay())).map(d=>d.toISOString().slice(0,10)),activeDays:18,engagement:mode==='new-student'?null:90,learningXp:900,xpRate:mode==='new-student'?null:45},warmups:[{id:'m1',competency_id:'pr1',submitted_at:dates[0]+'T16:00:00Z',status:'reviewed'}]});
 if(u.pathname==='/api/math-spine/dashboard'){if(mode==='slow-growth'){pendingGrowth.push(()=>json(growth));return;}return mode==='growth-error'?json({},503):json(growth);}
 if(u.pathname==='/api/math-spine/daily')return mode==='math-error'?json({},503):json({item:{competencyId:'gv1',competencyCode:'GV1',competencyStatement:'Slope as a rate of change'},alreadySubmitted:mode==='submitted'});
 if(u.pathname==='/api/feedback')return mode==='feedback-error'?json({},503):json({feedback:mode==='empty'?[]:[{id:'f1',teacher_email:'teacher@example.test',message:'You identified the constant slope. Next, explain what that slope tells you about velocity.',created_at:'2026-09-09T12:00:00Z',target:{slug:'R1',statement:'Explain motion from a graph'},competency:null},{id:'f2',teacher_email:'teacher@example.test',message:'Your earlier graph labels are clear.',created_at:'2026-09-08T12:00:00Z',target:null,competency:null}]});
 if(u.pathname==='/api/avatar/gallery')return json({avatars:[],items:[],next_offset:null});
 if(u.pathname==='/api/avatar/spotlight')return mode==='spotlight-error'?json({},503):json({game:{slug:'orbit-run',name:'Orbit Run'},rankedPlayers:20,items:[],cards:mode==='empty'?[]:[{id:'a',name:'Orbit Owl',rank:2,score:840,traits:{shirt_color:'teal'},equipped:{}},...(mode==='single-card'?[]:[{id:'b',name:'Nova Fox',rank:8,score:620,traits:{hair_style:'afro',shirt_color:'purple'},equipped:{}},{id:'c',name:'Comet Cat',rank:14,score:400,traits:{hair_style:'long',shirt_color:'orange'},equipped:{}}])]});
 if(u.pathname==='/api/avatar/me')return mode==='avatar-error'?json({},503):json({alias:'Orbit Explorer',setup_completed:mode!=='empty',traits:mode==='empty'?null:{skin:'tan',hair_style:'curls',hair_color:'dark_brown',shirt_color:'teal',mouth:'grin'},equipped:{},equipped_items:[]});
 if(u.pathname==='/api/readings')return mode==='readings-error'?json({error:'Reading assignments unavailable'},503):json(['dashboard','readings-error'].includes(mode)?readingData:{staff:false,courses:[],assignments:[],work:[]});
 if(u.pathname==='/api/quizzes')return json(['dashboard','readings-error'].includes(mode)?quizData:{staff:false,courses:[],quizzes:[],work:[],reviews:[]});
 if(u.pathname==='/api/home' && mode==='dashboard')return json({...home,homework:dashboardHomework});
 if(u.pathname==='/api/vocab/tasks' && mode==='dashboard')return json({tasks:Array.from({length:20},(_,i)=>({id:'v'+i,title:'Word set '+i,term_ids:['a'],progress:[{complete:i>=10,ready:i>=10?1:0,total:1}]}))});
 if(u.pathname==='/api/home' && mode==='long')return json({...home,student:{name:'Alexanderthelongeststudentname'},continue:{...home.continue,lesson:{...home.continue.lesson,title:'A very long lesson about interpreting motion and comparing position, velocity, and acceleration graphs'}}});
 if(u.pathname==='/api/home')return mode==='error'?json({error:'unavailable'},503):json(mode==='empty'?{...home,continue:null,retry:[],climb:[]}:home);
 if(u.pathname==='/api/me/classes')return mode==='class-error'?json({},503):json({classes:mode==='empty'?[]:[{id:'cpa',name:'Physics Section B',section:'Period 2',track:'cpa',program:'physics',teacher:'Teacher Example'},...(mode==='honors'?[{id:'honors',name:'Honors Section A',section:'Period 1',track:'honors',program:'physics',teacher:'Another Teacher'}]:[])]});
 if(u.pathname==='/api/me/enrollment')return json({enrolled:true,isStudent:true});
 if(u.pathname==='/api/math-spine/daily' && mode==='math-error')return json({error:'Could not load the warm-up. Please retry.'},503);
 if(u.pathname==='/api/math-spine/daily')return json({item:mode==='empty'?null:{competencyCode:'M1',competencyStatement:'Read a graph',prompt:'What does the slope tell you?'},alreadySubmitted:['submitted','all-done','review-due','vocab-error'].includes(mode)});
 if(u.pathname==='/api/vocab/tasks' && ['quiz','quiz-done'].includes(mode))return json({tasks:[{id:'quiz1',title:'Motion vocabulary quiz',task_kind:'quiz',term_ids:['a','b'],due_on:'2026-09-18',progress:[{quiz:{submitted:mode==='quiz-done',needsReview:mode==='quiz-done'},ready:0,total:2}]}]});
 if(u.pathname==='/api/vocab/tasks' && mode==='vocab-error')return json({error:'unavailable'},503);
 if(u.pathname==='/api/vocab/tasks')return json({tasks:mode==='empty'?[]:[{id:'v1',title:'Motion words',term_ids:['a','b'],progress:[{ready:1,total:2,covered:1,complete:['all-done','review-due'].includes(mode),reviewDue:mode==='review-due'}]}]});
 if(u.pathname==='/api/xp-policy')return mode==='xp-error'?json({},503):json(mode==='empty'?{...xp,term:null}:mode==='xp-met'?{...xp,term:{...xp.term,earned:1400}}:xp);
 if(u.pathname==='/api/xp-goal')return json({configured:true,kind:'school',label:'Daily',goal:100,earned:40});
 if(u.pathname==='/api/xp-challenges')return json({challenges:[]});
 if(u.pathname.startsWith('/api/'))return json({});
 if(u.pathname==='/brand/antocci-physics.png'){res.setHeader('Content-Type','image/png');return res.end(fs.readFileSync(root+'/public/brand/antocci-physics.png'))}
 if(['/app.js','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname))}
 res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1366,height:900}});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.stack)});

 const url='http://127.0.0.1:'+server.address().port;


 await page.clock.install({time:new Date('2026-10-22T16:00:00Z')});
 await page.goto(url);await page.getByRole('heading',{name:'Your Learning Week',exact:true}).waitFor();
 const week=page.getByRole('region',{name:'Weekly learning calendar'});
 await week.getByText('Motion vocabulary quiz',{exact:true}).waitFor();
 assert.equal(await page.getByText(/My plan|Plan my work|My work date|Make it part of my plan/).count(),0);
 assert(!requests.some(r=>r.includes('/api/home/plan')));
 assert.equal(await week.getByRole('columnheader').count(),8);
 await page.getByRole('region',{name:'Student choice calendar',exact:true}).getByText('Choose a Physics activity',{exact:true}).waitFor();
 assert.equal(await week.getByText('Unscheduled reading',{exact:true}).count(),0,'unchosen work stays out of required calendar');
 assert.equal(await week.getByRole('rowheader').count(),3);
 await week.locator('[data-lane="quizzes"][data-calendar-date="'+dates[3]+'"] strong').filter({hasText:'Motion vocabulary quiz'}).waitFor();
 await week.locator('[data-lane="assignments"][data-calendar-date="'+dates[6]+'"] strong').filter({hasText:'Unit word practice'}).waitFor();
 assert.equal(await page.getByText('Legacy vocab quiz',{exact:true}).count(),0);
 assert.equal(await page.locator('[aria-labelledby="activity-detail-heading"]').count(),0);
 await week.getByRole('button',{name:/Read about motion/}).click();
 assert.equal(await page.getByLabel('Due date',{exact:true}).count(),0,'students cannot edit dates');
 await page.getByRole('button',{name:'Close activity details'}).click();
 await page.locator('summary').filter({hasText:'Your learning pace'}).click();
 await page.getByRole('group',{name:'Historical engagement rate',exact:true}).getByText('90%',{exact:false}).waitFor();
 await page.locator('summary').filter({hasText:'Your learning pace'}).click();
 await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('menuitem',{name:'Quizzes',exact:true}).waitFor();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('menuitem',{name:'Vocabulary games',exact:true}).waitFor();await page.keyboard.press('Escape');
 assert.equal(await page.getByRole('link',{name:'Join lobby',exact:true}).getAttribute('href'),'/lobby');
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);await page.screenshot({path:out+'/desktop.png',fullPage:true});
 for(const width of [1024,820,400,360]){await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow at '+width);await page.screenshot({path:out+'/student-'+width+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('heading',{name:'Learn',exact:true}).waitFor();await page.getByRole('link',{name:'Vocabulary games',exact:true}).waitFor();await page.keyboard.press('Escape');
 await week.getByRole('button',{name:'Thu, Oct 22',exact:true}).click();await week.getByRole('button',{name:/Motion vocabulary quiz/}).click();await page.getByRole('button',{name:'Close activity details'}).click();
 mode='teacher';await page.setViewportSize({width:1366,height:1000});await page.goto(url+'?teacher');await page.getByLabel('Class calendar').waitFor();await week.getByRole('button',{name:/Read about motion/}).waitFor();
 async function drag(title,date,lane){const card=week.getByRole('button',{name:new RegExp(title)});await card.scrollIntoViewIfNeeded();const target=week.locator('[data-calendar-date="'+date+'"][data-lane="'+lane+'"]');const a=await card.boundingBox(),b=await target.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:15});await page.mouse.up();}
 await drag('Read about motion',dates[5],'assignments');await page.getByRole('status').filter({hasText:'Saved for the class'}).waitFor();assert.equal(classItems[2].dueAt,at(5));
 let count=writes.length;await drag('Motion check',dates[1],'quizzes');await page.getByRole('alert').filter({hasText:'Mondays, Wednesdays, and Fridays'}).waitFor();assert.equal(writes.length,count);
 await drag('Motion check',dates[4],'quizzes');await page.getByRole('status').filter({hasText:'Motion check'}).waitFor();assert.equal(classItems[0].dueAt,at(4));
 count=writes.length;await drag('Motion vocabulary quiz',dates[2],'quizzes');await page.getByRole('alert').filter({hasText:'Tuesdays and Thursdays'}).waitFor();assert.equal(writes.length,count);
 await drag('Motion vocabulary quiz',dates[1],'quizzes');await page.getByRole('status').filter({hasText:'Motion vocabulary quiz'}).waitFor();assert.equal(classItems[1].dueAt,at(1));
 await page.waitForTimeout(500);await week.getByRole('button',{name:/Motion vocabulary quiz/}).click();await page.getByLabel('Due date',{exact:true}).fill(dates[2]);count=writes.length;await page.getByRole('button',{name:'Save due date',exact:true}).click();await page.getByRole('alert').filter({hasText:'Tuesdays and Thursdays'}).first().waitFor();assert.equal(writes.length,count);
 await page.getByLabel('Due date',{exact:true}).fill(dates[3]);await page.getByRole('button',{name:'Save due date',exact:true}).click();await page.getByRole('status').filter({hasText:'Motion vocabulary quiz'}).waitFor();
 mode='save-error';await page.getByLabel('Due date',{exact:true}).fill(dates[1]);await page.getByRole('button',{name:'Save due date',exact:true}).click();await page.getByRole('alert').filter({hasText:'Assignment changed'}).waitFor();assert.equal(classItems[1].dueAt,at(3));
 mode='readonly';await page.goto(url+'?teacher');await week.getByRole('button',{name:/Motion check/}).click();assert.equal(await page.getByLabel('Due date',{exact:true}).count(),0);assert.equal(await page.locator('[data-editable="true"]').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: grouped navigation, seven-day calendar, no personal plans, main-system vocabulary quizzes, responsive layouts, compact pace/history, teacher-only dragging and date editing, weekday rejection, failed saves, read-only preview.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
