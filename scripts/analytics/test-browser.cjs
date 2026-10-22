const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {fixture}=require('./fixture.cjs');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
let browser,server;
(async()=>{
 const f=await fixture(),{root,out}=f;f.role('observer');
 const mocks={
 'next/navigation':`import{useSyncExternalStore}from'react';const sub=fn=>{window.addEventListener('route',fn);window.addEventListener('popstate',fn);return()=>{window.removeEventListener('route',fn);window.removeEventListener('popstate',fn)}};export const useSearchParams=()=>new URLSearchParams(useSyncExternalStore(sub,()=>location.search,()=>''));export const usePathname=()=>useSyncExternalStore(sub,()=>location.pathname,()=>'/admin/analytics');export const useRouter=()=>({push:url=>{history.pushState(null,'',url);window.dispatchEvent(new Event('route'))}});`,
 'next/link':`import React from'react';export default function Link({href,prefetch,...props}){return <a href={href} {...props}/>}`,
 };
 await require(root+'/node_modules/esbuild').build({absWorkingDir:root,stdin:{resolveDir:root,loader:'tsx',contents:`import React from'react';import{createRoot}from'react-dom/client';import Workspace from './src/components/analytics/AnalyticsWorkspace';createRoot(document.getElementById('root')).render(<div className="surface-refined"><Workspace/></div>);`},bundle:true,platform:'browser',format:'esm',outfile:out+'/app.js',jsx:'automatic',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'jsx',resolveDir:root}))}}]});
 const css=await require(root+'/node_modules/postcss')([require(root+'/node_modules/@tailwindcss/postcss/dist/index.js')({base:root})]).process(fs.readFileSync(root+'/src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});fs.writeFileSync(out+'/style.css',css.css+'\n'+fs.readFileSync(out+'/app.css','utf8'));
 if(process.env.ANALYTICS_BUILD_ONLY==='1'){console.log('Analytics preview bundle built.');return}
 let apiCalls=0,writes=0,failNext=false;
 server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://local');res.setHeader('Cache-Control','no-store');
  if(u.pathname.startsWith('/api/')){apiCalls++;if(req.method!=='GET'){writes++;res.statusCode=405;return res.end()}if(failNext){failNext=false;res.statusCode=500;res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({error:'Synthetic load failure'}))}const response=await f.call(u.search);res.statusCode=response.status;res.setHeader('Content-Type','application/json');return res.end(await response.text())}
  if(['/app.js','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname))}
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Analytics preview · synthetic data</title><link rel="stylesheet" href="/style.css"></head><body style="font-family:system-ui"><div style="padding:8px 24px;border-bottom:1px solid var(--border);font-size:12px;color:var(--muted-foreground)">Preview · synthetic student data · observer experience</div><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
 });
 await new Promise(resolve=>server.listen(Number(process.env.ANALYTICS_PORT)||0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 if(process.env.ANALYTICS_PREVIEW==='1'){console.log('PREVIEW_URL='+base+'/admin/analytics');return}
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1366,height:900}});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const nav=name=>page.getByRole('navigation',{name:'Analytics views'}).getByRole('button',{name,exact:true}).click();
 const screenshot=name=>page.screenshot({path:out+'/'+name+'.png',fullPage:true});
 const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow');
 await page.goto(base+'/admin/analytics');await page.getByRole('heading',{name:'Where is learning moving?'}).waitFor();await screenshot('overview');await noOverflow();
 await page.getByRole('button',{name:/^Improving/}).click();await page.getByRole('heading',{name:'Students showing improvement'}).waitFor();assert.ok(new URL(page.url()).searchParams.get('focus')==='improving');
 await page.getByRole('button',{name:/Avery Chen/}).click();await page.getByRole('heading',{name:'Avery Chen',exact:true}).waitFor();await screenshot('student');
 await page.getByRole('navigation',{name:'Student detail views'}).getByRole('button',{name:'Feedback & practice',exact:true}).click();await page.getByRole('heading',{name:'Did the next response improve?'}).waitFor();await page.getByText('Corrected on a later check',{exact:true}).waitFor();await screenshot('feedback');
 await nav('Classes');await page.getByRole('heading',{name:'Compare classes',exact:true}).waitFor();await page.getByRole('button',{name:'Physics · Period 2',exact:true}).click();await page.getByRole('heading',{name:'Class roster & learning'}).waitFor();await screenshot('classes');
 await page.getByRole('navigation',{name:'Class detail views'}).getByRole('button',{name:'Bloom’s task growth'}).click();await page.getByRole('heading',{name:'Growth across Bloom’s tasks'}).waitFor();
 await nav('Bloom’s tasks');await page.getByRole('button',{name:/^Analyze /}).click();await page.getByRole('heading',{name:'Analyze · by student'}).waitFor();await screenshot('blooms');
 await nav('Skills & questions');await page.getByRole('button',{name:'Explain displacement and velocity',exact:true}).click();await page.getByRole('heading',{name:'Students · u1.velocity'}).waitFor();await page.getByRole('button',{name:'Compare the slopes of two position–time graphs.',exact:true}).click();await page.getByRole('heading',{name:'Question & response history'}).waitFor();await screenshot('question');
 await page.goBack();await page.getByRole('heading',{name:'Question-level evidence'}).waitFor();assert.equal(new URL(page.url()).searchParams.has('question'),false);
 await nav('Engagement');await page.getByRole('heading',{name:'Engagement by day & hour'}).waitFor();await screenshot('engagement');await noOverflow();
 await nav('How to read this');await page.getByRole('heading',{name:'Read the evidence with confidence'}).waitFor();
 await page.getByRole('combobox',{name:'Program',exact:true}).selectOption('trades');await nav('Overview');await page.getByRole('heading',{name:'Where is learning moving?'}).waitFor();await page.getByText('No scored submissions in this period.',{exact:true}).waitFor();assert.equal(new URL(page.url()).searchParams.has('class'),false);assert.equal(new URL(page.url()).searchParams.has('skill'),false);
 await page.getByRole('combobox',{name:'Program',exact:true}).selectOption('physics');await page.getByRole('heading',{name:'Where is learning moving?'}).waitFor();
 await page.setViewportSize({width:390,height:844});await noOverflow();await screenshot('mobile');await nav('Classes');await page.getByRole('heading',{name:'Compare classes',exact:true}).waitFor();await noOverflow();
 await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});await page.evaluate(()=>document.documentElement.classList.add('dark'));await page.setViewportSize({width:1366,height:900});await screenshot('dark');
 failNext=true;await page.getByRole('button',{name:'Refresh data'}).click();await page.getByRole('alert').filter({hasText:'Synthetic load failure'}).waitFor();await page.getByRole('button',{name:'Retry analytics'}).click();await page.getByRole('heading',{name:'Compare classes',exact:true}).waitFor();
 assert.equal(writes,0);assert.deepEqual(errors,[]);assert.ok(apiCalls>=5);console.log('PASS: 7 views; overview → student → feedback; class → Bloom → skill → question; history; program reset; empty/loading/error/retry; desktop/mobile/dark; no overflow; no browser errors; zero writes.');
 await browser.close();server.close();
})().catch(async e=>{console.error(e);await browser?.close();server?.close();process.exitCode=1});
