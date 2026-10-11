const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const repo=process.cwd(),out=process.env.OUTPUT_DIR||'/private/tmp/trades-etf-browser';fs.mkdirSync(out,{recursive:true});
const lessons=require(path.join(repo,'scripts/trades-etf/lessons.json'));
const plans=require(path.join(repo,'src/data/trades-etf-plans.json'));
const state={},drafts={},submitted={},requests=[];
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const source=`import React from 'react';import{createRoot}from'react-dom/client';import Viewer from './src/components/lessons/BlockLessonViewer';import Plans from './src/app/admin/teacher/plans/page';import lessons from './scripts/trades-etf/lessons.json';import{filterDocumentForViewer}from'./src/lib/track-visibility';import{withEtfWorkshopVisuals}from'./src/data/etf-workshop';const l=lessons[Number(new URLSearchParams(location.search).get('job')||0)];createRoot(document.getElementById('root')).render(location.pathname==='/teacher'?<Plans/>:<Viewer lesson={{...l,content_blocks:filterDocumentForViewer(withEtfWorkshopVisuals(l.content_blocks,l.slug),{role:'student',track:'cpa'})}}/>);`;
 await require('esbuild').build({absWorkingDir:repo,stdin:{contents:source,loader:'tsx',resolveDir:repo},bundle:true,format:'esm',outfile:out+'/app.js',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},loader:{'.woff2':'dataurl'},plugins:[{name:'fixture',setup(b){const mocks={'next-auth/react':`export const useSession=()=>({data:{user:{id:'synthetic-trades-student',email:'synthetic@example.test'}},status:'authenticated'});`,'next/navigation':`export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({push:url=>location.assign(url),replace:()=>{},refresh:()=>{}});`,'next/link':`import React from'react';export default function Link({prefetch,...p}){return <a {...p}/>}`};b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:repo}));}}]});
 const css=await require('postcss')([require(path.join(repo,'node_modules/@tailwindcss/postcss/dist/index.js'))({base:repo})]).process(fs.readFileSync(repo+'/src/app/globals.css','utf8'),{from:repo+'/src/app/globals.css'});
 fs.writeFileSync(out+'/globals.css',css.css);
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'),p=url.pathname;requests.push(p);
  const json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))};
  if(p.startsWith('/api/')){
   let body={};if(req.method==='POST'){let raw='';for await(const c of req)raw+=c;body=JSON.parse(raw||'{}')}
   const id=body.lesson_id||url.searchParams.get('lesson_id'),l=lessons.find(l=>l.id===id)||lessons[0];
   if(p==='/api/lessons/blocks'){
    if(req.method==='POST'){const v={response:body.response,created_at:new Date().toISOString()};(state[id]??={})[body.block_id]=v;delete(drafts[id]??={})[body.block_id];return json({...v,xpEarned:0})}
    return json({responses:state[id]||{},xpEarned:0})
   }
   if(p==='/api/lessons/drafts'){
    if(req.method==='POST'){for(const d of body.drafts||[])(drafts[id]??={})[d.block_id]={...d,updated_at:new Date().toISOString()};return json({ok:true})}
    return json({drafts:drafts[id]||{},blockIds:l.content_blocks.blocks.filter(b=>b.capture).map(b=>b.id)})
   }
   if(p==='/api/lessons/submit'){
    if(req.method==='POST'){assert.equal(Object.keys(state[id]||{}).length,1);submitted[id]=new Date().toISOString()}
    return json({submittedAt:submitted[id]||null,locked:Boolean(submitted[id])})
   }
   if(p==='/api/lessons/experience')return json({flags:{experience:'stepped',gateCheckpoints:true,presentLive:false},mastery:{},calibration:[],xpEarned:0});
   if(p==='/api/language-profile')return json({profile:null});
   if(p==='/api/teacher/lesson-plans'){const unit=url.searchParams.get('unit_id');return json({canConfirm:false,tracks:['trades'],track:'trades',unitId:unit,availableUnits:Object.keys(plans),honorsDays:[],days:(plans[unit]||[]).map(d=>({...d,plan_fingerprint:'fixture',lesson:{id:d.lessonId,published:true},alignment:{status:'aligned',message:'Synthetic alignment fixture'}}))})}
   return json({session:null,terms:[],realtime:null});
  }
  const f=p.startsWith('/trades-etf/')?repo+'/public'+p:p==='/app.js'||p==='/app.css'||p==='/globals.css'?out+p:null;
  if(f&&fs.existsSync(f)){res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.pdf')?'application/pdf':'text/html');return res.end(fs.readFileSync(f))}
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/globals.css"><link rel="stylesheet" href="/app.css"><div id="root"></div><script type="module" src="/app.js"></script></html>');
 });
 const port=0;
 await new Promise(r=>server.listen(port,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;console.log('Fixture ready '+base);
 if(process.argv.includes('--serve'))return;
 let browser;try{
  browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1366,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/');await page.getByRole('navigation',{name:'Workshop moments'}).waitFor();
  const nav=page.getByRole('navigation',{name:'Workshop moments'}).getByRole('button');assert.equal(await nav.count(),6);assert.equal(await page.locator('textarea').count(),0);
  for(const i of [1,2,3,4]){await nav.nth(i).click();assert.equal(await page.locator('textarea').count(),0);}
  await nav.nth(5).click();await page.locator('textarea').first().fill('SYNTHETIC: 3 1/4 + 3 1/4 + 4 + 1/2 = 11 in. Second fold is 6 1/2 in from A. Notebook page 2; revised lip passed three tests.');await page.getByRole('button',{name:/^(Save|Save answer)$/i}).click();await page.getByText('1 of 1 useful responses saved',{exact:true}).waitFor();
  await page.reload();await nav.first().waitFor();await nav.nth(5).click();assert.match(await page.locator('textarea').first().inputValue(),/Second fold is 6 1\/2 in/);await page.getByRole('button',{name:'Submit lesson for review',exact:true}).click();await page.getByText(/Submitted — locked until/).waitFor();assert.equal(Object.keys(state[lessons[0].id]).length,1);
  await page.screenshot({path:out+'/day1-submitted.png',fullPage:true});
  for(let n=0;n<36;n++){
   await page.goto(base+'/?job='+n);await nav.first().waitFor();
   for(let i=0;i<6;i++){await nav.nth(i).click();await page.locator('img').first().evaluate(e=>e.decode());assert.equal(await page.locator('#workshop-title').count(),1);const steps=page.getByRole('region',{name:/Build it · follow these steps|What to do · step by step/});assert.equal(await steps.locator('li').count(),lessons[n].content_blocks.blocks.filter(b=>b.workshop?.pageBreakBefore)[i].workshop.steps.length);assert.equal(await page.getByText('At the bench',{exact:true}).count(),0)}
  }
  for(const width of [1366,1024,390,320]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/?job=1');await nav.first().waitFor();await nav.nth(2).click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width);await page.screenshot({path:out+'/plan-'+width+'.png',fullPage:true});
  }
  await page.setViewportSize({width:1366,height:900});await page.goto(base+'/?job=0');await nav.first().waitFor();await nav.nth(3).click();const board=page.getByRole('region',{name:'Teaching board'});await board.getByRole('button',{name:'Next view →',exact:true}).click();await board.getByRole('heading',{name:'2. Close the triangle',exact:true}).waitFor();await board.getByRole('button',{name:'Show check',exact:true}).click();await board.getByRole('status').waitFor();await board.getByRole('button',{name:'Previous view',exact:false}).click();assert.equal(await board.getByRole('status').count(),0);await board.screenshot({path:out+'/day1-workshop-board.png'});const bench=page.getByRole('region',{name:'Build it · follow these steps'});assert.ok((await bench.boundingBox()).width>900);assert.equal(await bench.locator('ol').evaluate(e=>getComputedStyle(e).listStyleType),'decimal');await page.screenshot({path:out+'/day1-build.png',fullPage:true});await bench.screenshot({path:out+'/day1-steps.png'});
  await page.goto(base+'/teacher?unit=trades-etf-1');await page.getByText('Teacher answer key and interpretation',{exact:true}).waitFor();await page.screenshot({path:out+'/teacher-plan.png',fullPage:true});
  for(const l of lessons){const r=await page.request.get(base+'/trades-etf/'+l.slug+'.html');assert.equal(r.status(),200);assert.ok(!(await r.text()).includes('Teacher answer key'));}
  await page.goto(base+'/trades-etf/drawings.html');for(const img of await page.locator('img').all())await img.evaluate(e=>e.decode());await page.screenshot({path:out+'/drawings.png',fullPage:true});
  await page.setViewportSize({width:1100,height:820});
  for(const drawing of ['stand','organizer','building','frame','fluid','sled','detector','circuit']){await page.goto(base+'/trades-etf/'+drawing+'.svg');await page.screenshot({path:out+'/'+drawing+'.png'});}
  assert.deepEqual(errors,[]);console.log('PASS: ETF viewer; six stages; one save persists on reload; submit locks; 216 stage renders; drawings; 320–1366px; teacher plan. Synthetic API only. Screenshots '+out);
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
