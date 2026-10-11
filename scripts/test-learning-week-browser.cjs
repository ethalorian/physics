const fs = require('node:fs'), http = require('node:http'), path = require('node:path'), assert = require('node:assert/strict');
const root = process.env.STUDENT_HOME_ROOT || path.resolve(__dirname, '..'), pkg = n => require(path.join(root, 'node_modules', n));
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = process.env.STUDENT_HOME_OUTPUT || '/private/tmp/learning-week-browser'; fs.mkdirSync(out, {recursive:true});
let browser, server, mode = 'dashboard';
let pendingGrowth=[];
const requests = []; const writes=[]; let plans={};
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dayNum=Math.floor(Date.parse(today+'T12:00:00Z')/86400000),monday=dayNum-((new Date(dayNum*86400000).getUTCDay()+6)%7),dates=Array.from({length:5},(_,i)=>new Date((monday+i)*86400000).toISOString().slice(0,10));
const growth={competencies:[{id:'pr1',code:'PR1',statement:'Scale a quantity using ratios',strand:'proportional-reasoning',sequenceOrder:4},{id:'qe2',code:'QE2',statement:'Track and convert units',strand:'quantities-estimation',sequenceOrder:6},{id:'gv1',code:'GV1',statement:'Read slope and area on a graph',strand:'graphs-vectors',sequenceOrder:11}],focus:[{competencyId:'gv1',unitId:'u1',role:'introduce',physicsHook:'Slope connects position and time to velocity.'},{competencyId:'gv1',unitId:'unit-4',role:'revisit',physicsHook:'Area under a force-distance graph is work.'}],records:[{competencyId:'gv1',level:1,observedAt:'2026-09-20T16:00:00Z'},{competencyId:'gv1',level:2,observedAt:'2026-10-06T16:00:00Z'}]};
const xp = { track:'standard',unitTarget:700,lessonTarget:500,mathTarget:200,currentUnitId:'u1',units:[{id:'u1',name:'Motion & Forces',lesson_earned:160,math_earned:80,evidence_count:4,lesson_available:500,math_target:200}],term:{label:'Term 1',starts_at:'2026-09-01T00:00:00Z',ends_at:'2026-11-01T00:00:00Z',earned:240,minimum_xp:1400,grade_points:5} };
const home = {student:{name:'Alex'}, points:{xp:240,balance:180}, streak:{current:3}, continue:{unitId:'u1',unitName:'Motion & Forces',lesson:{slug:'motion-investigation',title:'Investigating motion',lessonNumber:3,progress:40},sequence:[],completed:2,total:12},retry:[{targetId:'motion',statement:'Explain motion using a position graph',domain:'reasoning',level:2}],climb:[{observedAt:'2026-09-01',level:1,domain:'reasoning'},{observedAt:'2026-09-08',level:2,domain:'reasoning'}]};
const dashboardHomework = Array.from({length:14},(_,i)=>({id:'video'+(i+1),slug:'video-'+(i+1),sequence:i+1,title:'Physics video '+(i+1),due_at:i===1?new Date(Date.now()+86400000).toISOString():null,complete:i>=10}));
const readingData = {staff:false,courses:[],assignments:[{id:'r1',title:'Read about motion',status:'published',due_at:new Date(Date.now()-86400000).toISOString()},{id:'r2',title:'Read about force',created_at:new Date().toISOString(),status:'published',due_at:null},{id:'r3',title:'Submitted reading',status:'published',due_at:null}],work:[{assignment_id:'r2',state:'returned'},{assignment_id:'r3',state:'submitted'}]};
const quizData = {locked:[{id:'q4',course_id:'c1',title:'Reading check: force',due_at:null,created_at:new Date().toISOString(),reading_id:'r2',reading_title:'Read about force'}],staff:false,courses:[],reviews:[],quizzes:[{id:'q1',title:'Reading check: motion',status:'published',due_at:new Date(Date.now()+2*86400000).toISOString()},{id:'q2',title:'Later quiz',status:'published',due_at:null},{id:'q3',title:'Graded quiz',status:'published',due_at:null}],work:[{quiz_id:'q3',state:'graded'}]};
(async()=>{
 await pkg('esbuild').build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Home from './src/app/home/page';import Navbar from './src/components/navbar';import GalleryPage from './src/app/avatar/gallery/page';import XpPage from './src/app/xp/page';createRoot(document.getElementById('root')).render(<><Navbar/><main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{location.pathname==='/avatar/gallery'?<GalleryPage/>:location.pathname==='/xp'?<XpPage/>:<Home/>}</main></>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:out+'/app.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fixture',setup(b){
 const mocks={
 'next/link':`import React from 'react';export default function Link({prefetch,...p}){return React.createElement('a',p)}`,
 'next/image':`import React from 'react';export default function Image({fill,priority,unoptimized,...p}){return React.createElement('img',p)}`,
 'next/navigation':`export const usePathname=()=>'/home';export const useRouter=()=>({push:p=>location.assign(p)});`,
 'next-auth/react':`export const useSession=()=>({data:{user:{name:'Alex',role:'student'}},status:'authenticated'});export const signIn=()=>{};`,
 '@/lib/use-view-as':`export const useViewAs=()=>({role:'student'});`,
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
 if(['/app.js','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname))}
 res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1366,height:900}});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.stack)});

 const url='http://127.0.0.1:'+server.address().port;

 await page.goto(url);await page.getByRole('heading',{name:'Your Learning Week',exact:true}).waitFor();
 const views=page.getByRole('navigation',{name:'Learning dashboard views'});
 const week=page.getByRole('region',{name:'Weekly learning plan'});
 const details=()=>page.getByRole('region',{name:page.getByRole('heading',{name:'activity-detail-heading'})});
 await week.getByText('Slope as a rate of change',{exact:true}).waitFor();
 await page.getByText('Target being calibrated',{exact:true}).waitFor();
 await page.getByText('5% term-grade credit at risk',{exact:true}).waitFor();
 await page.getByText('If your engagement stays below 80%, you will not earn the 5% engagement credit on your term grade.',{exact:false}).waitFor();
 const historicalEngagement=page.getByRole('group',{name:'Historical engagement rate',exact:true}),historicalXp=page.getByRole('group',{name:'Historical learning XP rate',exact:true});
 await historicalEngagement.getByText('90%',{exact:false}).waitFor();await historicalEngagement.getByText('18 of 20 school days with learning activity',{exact:true}).waitFor();await historicalXp.getByText('900 learning XP ÷ 20 school days',{exact:true}).waitFor();await historicalXp.getByText('45',{exact:false}).waitFor();
 await page.getByRole('group',{name:'Recent engagement rate',exact:true}).getByText('60%',{exact:false}).waitFor();
 const historicalBoxes=await Promise.all([historicalXp,historicalEngagement].map(l=>l.boundingBox()));assert(Math.abs(historicalBoxes[0].y-historicalBoxes[1].y)<1,'historical metrics align');
 await page.getByRole('region',{name:'Your learning pace',exact:true}).screenshot({path:out+'/historical-rates-desktop.png'});
 const hero=page.locator('[aria-labelledby="check-in-heading"]');
 const avatar=hero.getByRole('link',{name:'Change your look',exact:true}),start=hero.getByRole('link',{name:'Start math warm-up',exact:true}),growthButton=hero.getByRole('button',{name:'My growth',exact:true});
 const boxes=await Promise.all([avatar,start,growthButton].map(l=>l.boundingBox()));assert(boxes.every(b=>b.height===44));assert(Math.max(...boxes.map(b=>b.y))-Math.min(...boxes.map(b=>b.y))<1);
 const card=week.getByRole('button',{name:/Math spine.*Slope as a rate of change/});assert.equal(await card.evaluate(el=>getComputedStyle(el).borderLeftColor),'rgba(0, 0, 0, 0)');
 for(const href of ['/home','/lessons','/quizzes','/reference','/textbook','/lobby','/arcade','/leaderboard','/store'])assert(await page.locator('nav a[href="'+href+'"]').count()>0,'top nav keeps '+href);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/learning-week-desktop.png',fullPage:true});
 const unscheduled=page.getByRole('region',{name:'Unscheduled assignments',exact:true});
 await unscheduled.getByRole('button',{name:/Reading check: force.*Complete reading first/}).waitFor();
 assert.equal(await unscheduled.locator('button[aria-pressed]').count(),3,'only three unscheduled cards');
 await unscheduled.getByRole('button',{name:/Reading check: force.*Complete reading first/}).click();
 const lockedDetail=page.locator('[aria-labelledby="activity-detail-heading"]');
 assert.equal(await lockedDetail.getByRole('link',{name:'Open required reading'}).getAttribute('href'),'/readings/r2');
 await lockedDetail.getByLabel('My work date',{exact:true}).fill(dates[4]);await lockedDetail.getByRole('button',{name:'Save my plan',exact:true}).click();await lockedDetail.getByRole('status').filter({hasText:'Plan saved'}).waitFor();
 assert.equal(plans['quiz:q4'],dates[4]);await week.locator('tr').filter({has:page.getByRole('rowheader',{name:/My plan/})}).getByText('Reading check: force',{exact:true}).waitFor();
 await week.getByRole('button',{name:'View all unscheduled',exact:true}).click();
 await page.getByLabel('Status',{exact:true}).waitFor();assert.equal(await page.getByLabel('Status',{exact:true}).inputValue(),'unscheduled');
 await views.getByRole('button',{name:'All assignments',exact:true}).click();
 const manager=page.getByRole('region',{name:'Assignment manager'});
 await manager.getByText('1–5 of 25',{exact:true}).waitFor();assert.equal(await manager.locator('article').count(),5);
 await manager.getByRole('button',{name:'Next',exact:true}).click();await manager.getByText('6–10 of 25',{exact:true}).waitFor();
 await manager.getByLabel('Assignment type',{exact:true}).selectOption('reading');
 await manager.getByRole('button',{name:/Reading.*Read about motion/}).click();
 const detail=page.locator('[aria-labelledby="activity-detail-heading"]');await detail.getByRole('heading',{name:'Read about motion',exact:true}).waitFor();
 const deadline=await detail.locator('p').filter({hasText:/^Due /}).textContent();
 await detail.getByLabel('My work date',{exact:true}).fill(today);await detail.getByRole('button',{name:'Save my plan',exact:true}).click();await detail.getByRole('status').filter({hasText:'Plan saved'}).waitFor();assert.equal(writes.at(-1).assignment_key,'reading:r1');assert.equal(plans['reading:r1'],today);assert.equal(await detail.locator('p').filter({hasText:/^Due /}).textContent(),deadline);
 await page.reload();await views.getByRole('button',{name:'My week',exact:true}).waitFor();await week.locator('tr').filter({has:page.getByRole('rowheader',{name:/My plan/})}).getByText('Read about motion',{exact:true}).waitFor();
 await week.getByRole('button',{name:/Reading.*Read about motion/}).first().click();
 mode='plan-error';await detail.getByLabel('My work date',{exact:true}).fill(dates[4]);await detail.getByRole('button',{name:'Save my plan',exact:true}).click();await detail.getByRole('alert').filter({hasText:'could not be saved'}).waitFor();assert.equal(plans['reading:r1'],today);mode='dashboard';
 await views.getByRole('button',{name:'My growth',exact:true}).click();await page.getByRole('heading',{name:'Your math connects the journey',exact:true}).waitFor();assert(await hero.isVisible(),'avatar remains in growth');
 const map=page.getByLabel('Math foundations and physics applications',{exact:true});assert.equal(await map.getByRole('button').count(),4);
 await map.getByRole('button',{name:/Area under a force-distance graph/}).click();await page.getByRole('heading',{name:'Area under a force-distance graph is work.',exact:true}).waitFor();
 assert.equal(await page.getByText('Developing with mathematical support',{exact:true}).count(),1);assert.equal(await page.getByText('Independent on a familiar problem',{exact:true}).count(),3);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/growth-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Open today’s learning →',exact:true}).click();await page.getByRole('heading',{name:'Today’s learning',exact:true}).waitFor();assert(await hero.isVisible());
 mode='submitted';await page.getByRole('button',{name:'Refresh dashboard',exact:true}).click();await page.getByRole('region',{name:'Today’s activities'}).getByRole('button',{name:/Slope as a rate of change.*Submitted/}).waitFor();
 mode='on-track';await page.getByRole('button',{name:'Refresh dashboard',exact:true}).click();await page.getByText('On track',{exact:true}).waitFor();assert.equal(await page.getByText('5% term-grade credit at risk',{exact:true}).count(),0);
 mode='new-student';await page.getByRole('button',{name:'Refresh dashboard',exact:true}).click();await page.getByText('Building history',{exact:true}).waitFor();assert.equal(await historicalEngagement.getByText('90%',{exact:false}).count(),0);assert.equal(await historicalXp.getByText('900 learning XP ÷ 20 school days',{exact:true}).count(),0);assert.equal(await page.getByText('5% term-grade credit at risk',{exact:true}).count(),0);
 mode='pace-error';await page.getByRole('button',{name:'Refresh dashboard',exact:true}).click();await page.getByRole('button',{name:'Retry learning pace',exact:true}).waitFor();assert.equal(await page.getByText('5% term-grade credit at risk',{exact:true}).count(),0);
 mode='dashboard';await page.getByRole('button',{name:'Refresh dashboard',exact:true}).click();await page.getByText('5% term-grade credit at risk',{exact:true}).waitFor();
 for(const width of [1024,768,390,320]) {
  await page.setViewportSize({width,height:900});await views.getByRole('button',{name:'My week',exact:true}).click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'week fits '+width);
  if(width<820){const days=page.getByRole('group',{name:'Choose a day'});await days.getByRole('button').nth(4).click();assert.equal(await week.locator('td:visible').count(),3);}
  await views.getByRole('button',{name:'All assignments',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'manager fits '+width);
  await views.getByRole('button',{name:'My growth',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'growth fits '+width);
  if(width===390) {await page.getByRole('region',{name:'Your learning pace',exact:true}).screenshot({path:out+'/historical-rates-mobile.png'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/growth-mobile.png',fullPage:true});await views.getByRole('button',{name:'My week',exact:true}).click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/learning-week-mobile.png',fullPage:true});}
 }
 await page.setViewportSize({width:1366,height:900});await page.evaluate(()=>document.documentElement.classList.add('dark'));await views.getByRole('button',{name:'My week',exact:true}).click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/learning-week-dark.png',fullPage:true});
 mode='readings-error';await page.getByRole('button',{name:'Refresh dashboard',exact:true}).click();await page.getByText('Some assignments couldn’t load. The list and counts may be incomplete.',{exact:true}).waitFor();mode='dashboard';await page.getByRole('button',{name:'Retry readings',exact:true}).click();await page.getByText('Some assignments couldn’t load. The list and counts may be incomplete.',{exact:true}).waitFor({state:'hidden'});
 // An unresolved growth request must not make the hero shortcut look unresponsive.
 mode='slow-growth';await page.setViewportSize({width:1366,height:900});await page.goto(url);await growthButton.waitFor();
 assert.equal(await growthButton.isEnabled(),true);await growthButton.click();
 const journeyHeading=page.getByRole('heading',{name:'Your math connects the journey',exact:true});await journeyHeading.waitFor();
 await page.getByRole('status').filter({hasText:'Loading your learning connections…'}).waitFor();assert(pendingGrowth.length>0,'growth response is still pending');
 const visibleHeading=await journeyHeading.boundingBox();assert(visibleHeading.y>=0&&visibleHeading.y+visibleHeading.height<900,'hero shortcut must immediately bring growth into the viewport while its request is pending');
 assert.equal(await views.getByRole('button',{name:'My growth',exact:true}).getAttribute('aria-current'),'page');
 assert.equal(await page.locator('#learning-dashboard-content').evaluate(el=>el===document.activeElement),true,'keyboard focus follows the shortcut');
 pendingGrowth.splice(0).forEach(resolve=>resolve());await page.getByLabel('Math foundations and physics applications',{exact:true}).waitFor();
 await growthButton.click();assert((await journeyHeading.boundingBox()).y<900,'repeated shortcut returns to the selected panel');
 await page.getByRole('button',{name:'Back to my Learning Week',exact:true}).click();await page.getByRole('heading',{name:'Your Learning Week',exact:true}).waitFor();assert((await page.getByRole('heading',{name:'Your Learning Week',exact:true}).boundingBox()).y<900);
 // The same immediate navigation must work on a phone and when the API fails.
 mode='growth-error';await page.setViewportSize({width:390,height:844});await page.goto(url);await growthButton.waitFor();await growthButton.focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Retry growth',exact:true}).waitFor();
 const mobileHeading=await journeyHeading.boundingBox();assert(mobileHeading.y>=0&&mobileHeading.y+mobileHeading.height<844,'phone keyboard shortcut reveals growth even on API failure');
 await page.screenshot({path:out+'/growth-shortcut-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: preserved nav/avatar/embossing/aligned controls; week/today/growth/manager; real API-shaped assignments, filters and pagination; persisted plans without deadline changes; failed saves; explicit grade warning only below 80% with complete history; no warning on error; branching connections and teacher evidence; responsive 1366/1024/768/390/320 and dark mode.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
