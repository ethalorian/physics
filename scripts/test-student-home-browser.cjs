const fs = require('node:fs'), http = require('node:http'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), pkg = n => require(path.join(root, 'node_modules', n));
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = '/private/tmp/student-home-browser'; fs.mkdirSync(out, {recursive:true});
let browser, server, mode = 'normal';
const requests = [];
const xp = { track:'standard',unitTarget:700,lessonTarget:500,mathTarget:200,currentUnitId:'u1',units:[{id:'u1',name:'Motion & Forces',lesson_earned:160,math_earned:80,evidence_count:4,lesson_available:500,math_target:200}],term:{label:'Term 1',starts_at:'2026-09-01T00:00:00Z',ends_at:'2026-11-01T00:00:00Z',earned:240,minimum_xp:1400,grade_points:5} };
const home = {student:{name:'Alex'}, points:{xp:240,balance:180}, streak:{current:3}, continue:{unitName:'Motion & Forces',lesson:{slug:'motion-investigation',title:'Investigating motion',lessonNumber:3,progress:40},sequence:[],completed:2,total:12},retry:[{targetId:'motion',statement:'Explain motion using a position graph',domain:'reasoning',level:2}],climb:[{observedAt:'2026-09-01',level:1,domain:'reasoning'},{observedAt:'2026-09-08',level:2,domain:'reasoning'}]};
(async()=>{
 await pkg('esbuild').build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Home from './src/app/home/page';import Navbar from './src/components/navbar';import GalleryPage from './src/app/avatar/gallery/page';import XpPage from './src/app/xp/page';createRoot(document.getElementById('root')).render(<><Navbar/><main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{location.pathname==='/avatar/gallery'?<GalleryPage/>:location.pathname==='/xp'?<XpPage/>:<Home/>}</main></>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:out+'/app.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fixture',setup(b){
 const mocks={
 'next/link':`import React from 'react';export default function Link({prefetch,...p}){return React.createElement('a',p)}`,
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
 if(u.pathname==='/api/feedback')return mode==='feedback-error'?json({},503):json({feedback:mode==='empty'?[]:[{id:'f1',teacher_email:'teacher@example.test',message:'You identified the constant slope. Next, explain what that slope tells you about velocity.',created_at:'2026-09-09T12:00:00Z',target:{slug:'R1',statement:'Explain motion from a graph'},competency:null},{id:'f2',teacher_email:'teacher@example.test',message:'Your earlier graph labels are clear.',created_at:'2026-09-08T12:00:00Z',target:null,competency:null}]});
 if(u.pathname==='/api/avatar/gallery')return json({avatars:[],items:[],next_offset:null});
 if(u.pathname==='/api/avatar/spotlight')return mode==='spotlight-error'?json({},503):json({game:{slug:'orbit-run',name:'Orbit Run'},rankedPlayers:20,items:[],cards:mode==='empty'?[]:[{id:'a',name:'Orbit Owl',rank:2,score:840,traits:{shirt_color:'teal'},equipped:{}},...(mode==='single-card'?[]:[{id:'b',name:'Nova Fox',rank:8,score:620,traits:{hair_style:'afro',shirt_color:'purple'},equipped:{}},{id:'c',name:'Comet Cat',rank:14,score:400,traits:{hair_style:'long',shirt_color:'orange'},equipped:{}}])]});
 if(u.pathname==='/api/avatar/me')return mode==='avatar-error'?json({},503):json({alias:'Orbit Explorer',setup_completed:mode!=='empty',traits:mode==='empty'?null:{skin:'tan',hair_style:'curls',hair_color:'dark_brown',shirt_color:'teal',mouth:'grin'},equipped:{},equipped_items:[]});
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
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1366,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));

 const url='http://127.0.0.1:'+server.address().port;
 const resume=page.getByRole('link',{name:'Resume lesson',exact:true});
 const practice=page.getByRole('status',{name:'Daily practice completion'});
 const extras=page.locator('summary').filter({hasText:'Goals & classroom extras'});
 const feedback=page.locator('#teacher-feedback');
 await page.goto(url);await resume.waitFor();
 assert.equal(await resume.getAttribute('href'),'/lessons/motion-investigation');
 await practice.getByText('0 of 2 done',{exact:true}).waitFor();
 await page.getByText('You identified the constant slope.',{exact:false}).waitFor();
 assert.equal(await page.getByRole('heading',{level:1}).count(),1);
 assert.equal(await page.getByRole('navigation',{name:'Home sections'}).count(),0,'no redundant jump navigation');
 assert.equal(await page.locator('#classroom-directory').count(),0,'main navigation is not repeated as a directory');
 assert.equal(await page.getByText('View progress over time',{exact:true}).count(),0,'detailed charts belong on the progress page');
 assert.equal(await page.getByText('Your earlier graph labels are clear.',{exact:true}).count(),0,'home surfaces only the latest note');
 assert.equal(await feedback.getByRole('link',{name:'All feedback & progress'}).getAttribute('href'),'/dashboard/growth');
 assert.equal(await feedback.getByRole('link',{name:'Practice: Explain motion using a position graph'}).getAttribute('href'),'/review/motion');
 assert((await page.locator('#daily-work').boundingBox()).y<(await feedback.boundingBox()).y,'work precedes feedback');
 assert((await feedback.boundingBox()).y<(await page.getByRole('region',{name:'Term XP',exact:true}).boundingBox()).y,'feedback precedes XP');
 assert(!requests.includes('/api/avatar/spotlight')&&!requests.includes('/api/xp-goal'),'optional extras do not fetch until opened');
 assert.equal(await page.getByRole('link',{name:'Customize your avatar',exact:true}).count(),1);
 await page.getByText('240 / 1,400 XP',{exact:true}).waitFor();
 const classes=page.getByRole('region',{name:'Your enrolled classes'});
 await classes.locator('summary').getByText('Physics Section B · Period 2 · CPA',{exact:true}).waitFor();
 await classes.locator('summary').click();await page.getByText('Teacher Example',{exact:false}).waitFor();await classes.locator('summary').click();
 for(const link of await page.locator('a[href^="/"]').all()){assert((await link.getAttribute('href'))!=='/dashboard','progress must not redirect home');}
 await page.screenshot({path:out+'/desktop.png',fullPage:true});
 for(const width of [1366,1024,768,390,320]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+width);
   const button=await resume.boundingBox();assert(button.y+button.height<844,'resume lesson is visible without scrolling at '+width);
   if(width<1280){await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('dialog').getByRole('link',{name:'Lobby',exact:true}).waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});}
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/mobile.png',fullPage:true});
 await extras.focus();await page.keyboard.press('Enter');
 const carousel=page.getByRole('group',{name:'Game ranking avatar sample'});await carousel.getByRole('button').first().waitFor();assert.equal(await carousel.getByRole('button').count(),3);
 await page.getByRole('button',{name:'Next avatar',exact:true}).click();assert.equal(await carousel.getByRole('button',{name:/Nova Fox/}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'Previous avatar',exact:true}).click();await carousel.getByRole('button',{name:/Orbit Owl/}).focus();await page.keyboard.press('ArrowRight');assert.equal(await carousel.getByRole('button',{name:/Nova Fox/}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'New sample',exact:true}).click();await page.getByText('Card 1 of 3',{exact:true}).waitFor();
 assert.equal(await page.getByRole('link',{name:'Avatar gallery',exact:true}).getAttribute('href'),'/avatar/gallery');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'expanded extras fit mobile');
 await page.locator('section[aria-labelledby="spotlight-heading"]').screenshot({path:out+'/avatar-deck.png'});
 await extras.click();assert.equal(await carousel.count(),0,'closing extras unmounts background requests');
 mode='feedback-error';await page.reload();await page.getByRole('button',{name:'Retry feedback'}).waitFor();await resume.waitFor();mode='normal';await page.getByRole('button',{name:'Retry feedback'}).click();await page.getByText('You identified the constant slope.',{exact:false}).waitFor();
 mode='single-card';await page.reload();await extras.click();await page.getByText('Card 1 of 1',{exact:true}).waitFor();assert(await page.getByRole('button',{name:'Next avatar',exact:true}).isDisabled());
 mode='spotlight-error';await page.reload();await extras.click();await page.getByRole('button',{name:'Retry avatar deck'}).waitFor();mode='normal';await page.getByRole('button',{name:'Retry avatar deck'}).click();await page.getByText('Card 1 of 3',{exact:true}).waitFor();
 mode='empty';await page.reload();await page.getByRole('heading',{name:'No next lesson to show'}).waitFor();await page.getByText('No warm-up assigned yet.',{exact:true}).waitFor();await page.getByText('No vocabulary assigned.',{exact:true}).waitFor();await page.getByRole('link',{name:'Build your avatar',exact:true}).waitFor();await practice.getByText('Nothing assigned',{exact:true}).waitFor();await page.getByText('Your teacher hasn’t published a term minimum yet.',{exact:false}).waitFor();assert.equal(await page.getByText('A skill to revisit',{exact:false}).count(),0);
 mode='honors';await page.reload();await classes.locator('summary').getByText('Honors',{exact:false}).waitFor();await classes.locator('summary').click();assert.equal(await classes.locator('li').count(),2);await classes.screenshot({path:out+'/class-labels.png'});
 mode='class-error';await page.reload();await page.getByRole('button',{name:'Retry class details'}).waitFor();mode='normal';await page.getByRole('button',{name:'Retry class details'}).click();await classes.locator('summary').waitFor();
 mode='avatar-error';await page.reload();await page.getByRole('link',{name:'Open your avatar',exact:true}).waitFor();await resume.waitFor();
 mode='error';await page.reload();await page.getByRole('button',{name:'Try again',exact:true}).waitFor();await page.locator('#daily-work').getByRole('link',{name:'All lessons',exact:true}).waitFor();await page.getByRole('link',{name:'Start warm-up'}).waitFor();mode='normal';await page.getByRole('button',{name:'Try again',exact:true}).click();await resume.waitFor();
 mode='math-error';await page.reload();await page.getByRole('button',{name:'Retry warm-up'}).waitFor();await practice.getByText('Status unavailable',{exact:true}).waitFor();mode='normal';await page.getByRole('button',{name:'Retry warm-up'}).click();await practice.getByText('0 of 2 done',{exact:true}).waitFor();
 mode='submitted';await page.reload();await page.getByText('Submitted — waiting for your teacher to review.').waitFor();assert.equal(await page.getByRole('link',{name:'Start warm-up'}).count(),0);await practice.getByText('1 of 2 done',{exact:true}).waitFor();
 mode='all-done';await page.reload();await practice.getByText('Practice complete',{exact:true}).waitFor();assert.equal(await page.getByText('Done',{exact:true}).count(),2);await resume.waitFor();await page.locator('section[aria-labelledby="practice-heading"]').screenshot({path:out+'/practice-complete.png'});
 mode='review-due';await page.reload();await page.getByText('Review due',{exact:true}).waitFor();await practice.getByText('1 of 2 done',{exact:true}).waitFor();
 mode='vocab-error';await page.reload();await practice.getByText('Status unavailable',{exact:true}).waitFor();assert.equal(await page.getByText('Practice complete',{exact:true}).count(),0);await page.getByRole('link',{name:'Open vocabulary',exact:true}).waitFor();
 mode='quiz';await page.reload();await page.getByRole('link',{name:/Motion vocabulary quiz/}).waitFor();await page.getByText('Open quiz',{exact:true}).waitFor();await practice.getByText('0 of 2 done',{exact:true}).waitFor();assert.equal(await page.getByRole('link',{name:/Motion vocabulary quiz/}).getAttribute('href'),'/vocabulary/work?task_id=quiz1');
 mode='quiz-done';await page.reload();await page.getByText('View quiz results',{exact:true}).waitFor();await page.getByText('Awaiting teacher review',{exact:false}).waitFor();await practice.getByText('1 of 2 done',{exact:true}).waitFor();
 mode='xp-error';await page.reload();await page.getByRole('button',{name:'Retry XP progress'}).waitFor();mode='normal';await page.getByRole('button',{name:'Retry XP progress'}).click();await page.getByText('240 / 1,400 XP',{exact:true}).waitFor();
 mode='xp-met';await page.reload();await page.getByText('Minimum met · eligible for +5 term-average points.',{exact:true}).waitFor();
 mode='long';await page.reload();await resume.waitFor();await page.setViewportSize({width:320,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'long names and lesson titles wrap');
 mode='normal';await page.reload();await practice.getByText('0 of 2 done',{exact:true}).waitFor();await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.evaluate(()=>document.documentElement.classList.add('dark'));await page.screenshot({path:out+'/dark-mobile.png',fullPage:true});
 await page.getByRole('link',{name:'XP details',exact:true}).click();await page.getByRole('heading',{name:'Your XP: what counts and what you need'}).waitFor();await page.getByText('1,160',{exact:true}).waitFor();await page.getByRole('heading',{name:'How to earn it'}).waitFor();
 await page.goto(url);await extras.click();await page.getByRole('link',{name:'Avatar gallery',exact:true}).click();await page.getByRole('heading',{name:'Avatar gallery',exact:true}).waitFor();await page.getByRole('region',{name:'Class avatar gallery'}).waitFor();assert.equal(new URL(page.url()).pathname,'/avatar/gallery');
 assert.deepEqual(errors,[]);
 console.log('PASS: work-first hierarchy; above-the-fold lesson at 1366/1024/768/390/320; no duplicated directory or chart; lazy extras and keyboard controls; feedback, class, lesson, math and XP retries; practice completion/review/error states; empty and long content; XP details and gallery navigation; dark/reduced-motion rendering; no browser errors.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
