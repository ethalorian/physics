const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..'),out='/private/tmp/physics-performance-browser'
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
fs.mkdirSync(out,{recursive:true})
let server,browser,page,delay=0,failCatalog=false
const counts={}
async function main(){
 const mocks={
  'next/navigation':`import{useState,useEffect}from'react';export function usePathname(){const[p,set]=useState(location.pathname);useEffect(()=>{const f=()=>set(location.pathname);addEventListener('popstate',f);return()=>removeEventListener('popstate',f)},[]);return p}`,
  'next-auth/react':`export const useSession=()=>({status:'authenticated',data:{user:{id:'fixture-student',role:'student'}}})`,
 }
 await require('esbuild').build({stdin:{resolveDir:root,loader:'tsx',contents:`import React from'react';import{createRoot}from'react-dom/client';import{useLearningResource}from'./src/app/home/useLearningWeek';import Launcher from'./src/components/simulations/SimulationLauncher';function App(){const a=useLearningResource('/api/fixture/a'),b=useLearningResource('/api/fixture/b');return <><p>{a.loading||b.loading?'Loading':'Ready'}</p><button onClick={()=>{a.refresh();b.refresh()}}>Refresh</button><Launcher/></>};createRoot(document.getElementById('root')).render(<App/>);`},outfile:out+'/app.js',bundle:true,format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}))}}],logLevel:'silent'})
 server=http.createServer((req,res)=>{const u=new URL(req.url,'http://fixture');counts[u.pathname]=(counts[u.pathname]??0)+1
  const json=(value,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))}
  if(u.pathname==='/api/simulations/access')return json({allowed:true})
  if(u.pathname==='/api/simulations')return failCatalog?json({},503):json({simulations:[{slug:'motion',title:'Motion model',unit:'unit-1',key_concepts:[],tags:[],description:'Motion',topic:'Motion',sort_order:1}]})
  if(u.pathname.startsWith('/api/fixture/'))return setTimeout(()=>json({ok:true}),delay)
  if(u.pathname==='/app.js'){res.setHeader('Content-Type','text/javascript');return res.end(fs.readFileSync(out+'/app.js'))}
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><title>Performance verification</title><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/app.js"></script></html>')
 });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)})
 browser=await chromium.launch({headless:true,channel:'chrome'});page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto('http://127.0.0.1:'+server.address().port);await page.getByText('Ready',{exact:true}).waitFor();await page.getByRole('button',{name:/Simulations/}).waitFor()
 assert.equal(counts['/api/fixture/a'],1);assert.equal(counts['/api/fixture/b'],1);assert.equal(counts['/api/simulations']??0,0,'catalog stays unloaded until requested')
 const access=counts['/api/simulations/access'];await page.evaluate(()=>{history.pushState({},'','/another-page');dispatchEvent(new PopStateEvent('popstate'))});await page.waitForTimeout(250);assert.equal(counts['/api/simulations/access'],access,'route navigation does not re-fetch launcher permission')
 await page.evaluate(()=>{dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});await page.waitForTimeout(350)
 assert.equal(counts['/api/fixture/a'],2);assert.equal(counts['/api/fixture/b'],2,'three return events cause one refresh per resource')
 delay=500;await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByText('Loading',{exact:true}).waitFor();await page.evaluate(()=>dispatchEvent(new Event('focus')));await page.waitForTimeout(650);assert.equal(counts['/api/fixture/a'],3,'focus does not abort/restart an in-flight read');delay=0
 await page.getByRole('button',{name:/Simulations/}).click();await page.getByRole('link',{name:/Motion model/}).waitFor();assert.equal(counts['/api/simulations'],1)
 await page.keyboard.press('Escape');failCatalog=true;await page.getByRole('button',{name:/Simulations/}).click();await page.getByRole('button',{name:'Retry loading simulations'}).waitFor();failCatalog=false;await page.getByRole('button',{name:'Retry loading simulations'}).click();await page.getByRole('link',{name:/Motion model/}).waitFor()
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/launcher.png'})
 assert.deepEqual(errors,[]);console.log('PASS browser: initial requests, coalesced focus, in-flight protection, route navigation, lazy launcher, failure/retry and narrow viewport; no browser errors')
}
main().catch(async error=>{console.error(error);if(page)await page.screenshot({path:out+'/failure.png'});process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()})
