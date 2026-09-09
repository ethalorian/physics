const fs = require('node:fs'), http = require('node:http'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), pkg = n => require(path.join(root, 'node_modules', n));
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = '/private/tmp/student-home-browser'; fs.mkdirSync(out, {recursive:true});
let browser, server, mode = 'normal';
const home = {student:{name:'Alex'}, points:{xp:240,balance:180}, streak:{current:3}, continue:{unitName:'Motion & Forces',lesson:{slug:'motion-investigation',title:'Investigating motion',lessonNumber:3,progress:40},sequence:[],completed:2,total:12},retry:[{targetId:'motion',statement:'Explain motion using a position graph',domain:'reasoning',level:2}],climb:[{observedAt:'2026-09-01',level:1,domain:'reasoning'},{observedAt:'2026-09-08',level:2,domain:'reasoning'}]};
(async()=>{
 await pkg('esbuild').build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Home from './src/app/home/page';import Navbar from './src/components/navbar';createRoot(document.getElementById('root')).render(<><Navbar/><main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"><Home/></main></>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:out+'/app.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fixture',setup(b){
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
 server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');const json=(d,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(d))};
 if(u.pathname==='/api/home')return mode==='error'?json({error:'unavailable'},503):json(mode==='empty'?{...home,continue:null,retry:[],climb:[]}:home);
 if(u.pathname==='/api/me/enrollment')return json({enrolled:true,isStudent:true});
 if(u.pathname==='/api/math-spine/daily')return json({item:mode==='empty'?null:{competencyCode:'M1',competencyStatement:'Read a graph',prompt:'What does the slope tell you?'},alreadySubmitted:mode==='submitted'});
 if(u.pathname==='/api/vocab/tasks')return json({tasks:mode==='empty'?[]:[{id:'v1',title:'Motion words',term_ids:['a','b'],progress:[{ready:1,total:2,covered:1}]}]});
 if(u.pathname==='/api/xp-goal')return json({configured:true,kind:'school',label:'Daily',goal:100,earned:40});
 if(u.pathname==='/api/xp-challenges')return json({challenges:[]});
 if(u.pathname.startsWith('/api/'))return json({});
 if(['/app.js','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname))}
 res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1366,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:'+server.address().port;await page.goto(url);await page.getByRole('link',{name:'Resume lesson',exact:true}).waitFor();
 assert.equal(await page.getByRole('link',{name:'Resume lesson',exact:true}).getAttribute('href'),'/lessons/motion-investigation');
 assert((await page.getByRole('link',{name:'Resume lesson',exact:true}).boundingBox()).y<600);
 for(const link of await page.locator('a[href^="/"]').all()){const href=await link.getAttribute('href');assert(href!=='/dashboard','progress must not redirect home');}
 assert.equal(await page.locator('.nav-label').count(),0,'no hidden hover labels');
 await page.getByText('View progress over time',{exact:true}).click();await page.getByRole('button',{name:'Knowledge',exact:true}).click();await page.getByText('Your progress will appear after your teacher reviews your work.').waitFor();
 await page.getByText('View progress over time',{exact:true}).click();await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:out+'/desktop.png',fullPage:true});
 for(const width of [1024,768,390]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('dialog').getByRole('link',{name:'Lobby',exact:true}).waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});}
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:out+'/mobile.png',fullPage:true});
 mode='empty';await page.reload();await page.getByRole('heading',{name:'No next lesson to show'}).waitFor();assert.equal(await page.getByText('All current skills at “Got it”').count(),0);await page.getByText('No warm-up available yet',{exact:false}).waitFor();
 mode='error';await page.reload();await page.getByRole('button',{name:'Try again',exact:true}).waitFor();assert(await page.getByRole('navigation',{name:'Practice & help'}).isVisible());mode='normal';await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByRole('link',{name:'Resume lesson',exact:true}).waitFor();
 mode='submitted';await page.reload();await page.getByText('Submitted — waiting for your teacher to review.').waitFor();assert.equal(await page.getByRole('link',{name:'Start warm-up'}).count(),0);
 await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.evaluate(()=>document.documentElement.classList.add('dark'));await page.screenshot({path:out+'/dark-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: next lesson priority, links, progress disclosure, visible navigation, 1366/1024/768/390 layouts, mobile menu, empty state, retry, submitted warm-up, dark/reduced-motion rendering; no browser errors.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
