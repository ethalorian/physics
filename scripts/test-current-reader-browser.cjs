const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..'), out = '/private/tmp/current-reader-cleanup'
fs.mkdirSync(out, { recursive: true })
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
let browser, server, page, saved = {}, drafts = {}, submission = null, calls = [], failSave = false
const blocks = [{ id: 'answer', type: 'exit_ticket', capture: true, prompt: 'Explain your evidence.' }]
async function main() {
 const mocks = {
  'next/link': 'export default function Link(p){return <a {...p}/>} ',
  'next/navigation': 'export const usePathname=()=>location.pathname;export const useRouter=()=>({push:p=>location.assign(p),refresh(){}})',
  'next-auth/react': "const session={data:{user:{id:'fixture-student',email:'fixture@example.test',role:'student'}},status:'authenticated'};export const useSession=()=>session",
 }
 await require('esbuild').build({ stdin: { resolveDir: root, loader: 'tsx', contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Viewer from './src/components/lessons/BlockLessonViewer';const kind=location.pathname.slice(1);const lessonDocument={schemaVersion:1,blocks:${JSON.stringify(blocks)},...(kind==='physics'?{presentation:'physics-path',learningPath:{version:1,kind:'lesson',focus:'Use evidence'}}:kind==='trades'?{presentation:'trades-workshop'}:{})};createRoot(document.getElementById('root')).render(<Viewer lesson={{id:'lesson',title:'Current reader check',content_blocks:lessonDocument}} {...(location.search.includes('snapshot')?{snapshot:{responses:{answer:{response:{text:'Historical saved evidence'},created_at:'2026-10-20'}},locked:true,submitted:true}}:{})}/>);` }, outfile: out+'/app.js', external:['/fonts/*'],bundle:true,jsx:'automatic',format:'esm',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'mocks',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}))}}],logLevel:'silent'})
 const css=await require('postcss')([require('@tailwindcss/postcss')({base:root})]).process(fs.readFileSync(root+'/src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});fs.writeFileSync(out+'/style.css',css.css+'\n'+fs.readFileSync(out+'/app.css','utf8'))
 server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://fixture');let body='';for await(const part of req)body+=part;const json=(value,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))};
  if(url.pathname==='/api/lessons/blocks'){if(req.method==='GET')return json({responses:saved,xpEarned:0});calls.push('save');if(failSave)return json({error:'Save unavailable'},503);const d=JSON.parse(body);saved[d.block_id]={response:d.response,created_at:new Date().toISOString()};delete drafts[d.block_id];return json({...saved[d.block_id],xp_awarded:0},201)}
  if(url.pathname==='/api/lessons/drafts'){if(req.method==='GET')return json({drafts,valid_block_ids:['answer']});for(const r of JSON.parse(body).drafts)drafts[r.block_id]={response:r.response,updated_at:new Date().toISOString()};return json({saved:1})}
  if(url.pathname==='/api/lessons/submit'){if(req.method==='GET')return json(submission||{submittedAt:null,locked:false});calls.push('submit');if(Object.keys(drafts).length)return json({error:'Unsaved work'},422);submission={submittedAt:new Date().toISOString(),locked:true};return json(submission,201)}
  if(url.pathname==='/api/lessons/experience')return json({flags:{experience:'stepped',gateCheckpoints:true},calibration:[],mastery:{}})
  if(url.pathname.endsWith('/vocab'))return json({terms:[]})
  if(url.pathname.startsWith('/api/'))return json({sections:[],session:null})
  if(['/app.js','/style.css'].includes(url.pathname)){res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+url.pathname))}
  res.setHeader('Content-Type','text/html');res.end('<html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script type="module" src="/app.js"></script></html>')
 })
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port
 browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1280,height:1000}});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)})
 for(const kind of ['physics','trades']){
  saved={};drafts={};submission=null;calls=[];await page.goto(base+'/'+kind)
  if(kind==='physics')await page.getByRole('button',{name:'Work',exact:true}).click()
  await page.getByRole('textbox',{name:kind==='physics'?'Your reasoning text':'Explain your evidence.',exact:true}).fill('The measured motion supports my explanation.')
  const submit=page.getByRole('button',{name:'Submit lesson for review'});await submit.waitFor();assert(await submit.isEnabled())
  failSave=true;await submit.click();await page.getByRole('alert').filter({hasText:'Some answers could not be saved'}).waitFor();assert(!calls.includes('submit'));failSave=false
  await submit.click();await page.getByText('Submitted — locked until your teacher reviews it.').waitFor();assert.equal(saved.answer.response.text,'The measured motion supports my explanation.');assert.equal(calls.at(-1),'submit')
  await page.reload();if(kind==='physics')await page.getByRole('button',{name:'Work',exact:true}).click();assert(await page.getByRole('textbox',{name:kind==='physics'?'Your reasoning text':'Explain your evidence.',exact:true}).isDisabled())
  await page.screenshot({path:out+'/'+kind+'.png',fullPage:true});console.log('PASS '+kind+': current workspace, failed-save retry, submission, locked reload')
 }
 await page.goto(base+'/retired');await page.getByRole('heading',{name:'This lesson format has been retired'}).waitFor();assert.equal(await page.getByRole('textbox').count(),0)
 const prior=calls.length;await page.goto(base+'/retired?snapshot');await page.getByText('Read-only submitted work',{exact:true}).waitFor();const answer=page.getByRole('textbox',{name:'Explain your evidence.',exact:true});assert.equal(await answer.inputValue(),'Historical saved evidence');assert(await answer.isDisabled());assert.equal(calls.length,prior);assert.deepEqual(errors,[])
 console.log('PASS retired interactive UI removed; historical submitted evidence remains read-only; no browser errors')
}
main().catch(async e=>{console.error(e);if(page)await page.screenshot({path:out+'/failure.png',fullPage:true});process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()})
