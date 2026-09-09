const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict'),path=require('node:path');
const repo=process.cwd(),out=fs.mkdtempSync('/private/tmp/projected-block-');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const blocks=[{id:'graph',type:'graph',title:'Position versus time',xLabel:'Time (s)',yLabel:'Position (m)',series:[{label:'Cart A',points:[[0,0],[1,3],[2,6],[3,9]]},{label:'Cart B',points:[[0,1],[1,2],[2,3],[3,4]]}]},{id:'text',type:'prose',markdown:Array.from({length:12},(_,i)=>`Paragraph ${i+1}. `+'Compare the motion of both carts and explain the evidence. '.repeat(5)).join('\n\n')}];
blocks.splice(1,0,{id:'question',type:'question',capture:true,sei:{frames:[{level:1,text:'Cart ___ is faster because ___.'}],wordBank:['slope','speed'],prompt_l1:{es:'¿Qué carro tiene mayor rapidez?'}},question:{prompt:'Which cart has the greater speed?',options:[{id:'a',text:'Cart A'},{id:'b',text:'Cart B'}],explain:'Explain using the graph.'}});
blocks.push({id:'observation',type:'observation',capture:true,patternPrompt:'What pattern do you see?',interpretPrompt:'What does it mean?'});
const lesson={id:'lesson',title:'Motion and evidence',content_blocks:{schemaVersion:1,blocks}};
await require('esbuild').build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Page from './src/app/embed/present-block/[sessionId]/page';import Auto from './src/app/embed/present/[lessonId]/page';createRoot(document.getElementById('root')).render(location.pathname==='/auto'?<Auto/>:<Page/>);`,loader:'tsx',resolveDir:repo},bundle:true,format:'esm',outfile:out+'/app.js',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fixture',setup(b){const mocks={'next/navigation':`export const useParams=()=>({sessionId:'s',lessonId:'lesson'});export const useSearchParams=()=>new URLSearchParams(location.search);export const usePathname=()=>location.pathname;export const useRouter=()=>({});`,'next-auth/react':`export const useSession=()=>({data:{user:{id:'teacher'}},status:'authenticated'});`,'next/link':`import React from 'react';export default function Link(p){return React.createElement('a',p)}`};b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js',resolveDir:repo}));}}]});
const css=await require('postcss')([require(path.join(repo,'node_modules/@tailwindcss/postcss/dist/index.js'))({base:repo})]).process(fs.readFileSync('src/app/globals.css','utf8'),{from:path.join(repo,'src/app/globals.css')});
const requests=[];let seiEnabled=false;
const server=http.createServer((r,s)=>{requests.push(r.url);if(r.url.startsWith('/api/present/sessions/s/tools')){s.setHeader('Content-Type','application/json');s.end(JSON.stringify({tools:{sei_enabled:seiEnabled},pulse:null,roster:[],marks:[],needs:[]}));return}if(r.url.endsWith('/realtime')){s.setHeader('Content-Type','application/json');s.end('{"realtime":null}');return}if(r.url.startsWith('/api/present/document')){s.setHeader('Content-Type','application/json');s.end(JSON.stringify({lesson}));return}if(r.url==='/app.js'){s.setHeader('Content-Type','application/javascript');s.end(fs.readFileSync(out+'/app.js'));return}if(r.url==='/style.css'){s.setHeader('Content-Type','text/css');s.end(css.css);return}s.setHeader('Content-Type','text/html');s.end('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log(e.message)});const base='http://127.0.0.1:'+server.address().port;
for(const [w,h] of [[1920,1080],[1280,720],[1024,768]]){await page.setViewportSize({width:w,height:h});await page.goto(base+'/?lesson=lesson&block=graph');await page.locator('.recharts-surface[role=application]').waitFor();await page.getByText('Time (s)',{exact:true}).waitFor();await page.getByText('Position (m)',{exact:true}).waitFor();await page.waitForTimeout(300);const bounds=await page.locator('.projected-content').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=w+1&&bounds.y+bounds.height<=h+1,JSON.stringify(bounds));assert.equal(await page.getByText(/Screen 1 of/).count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:out+`/graph-${w}x${h}.png`});}
await page.goto(base+'/?lesson=lesson&block=text&part=1');await page.getByText(/Screen 2 of/).waitFor();await page.getByText('Step 02 of 2',{exact:true}).waitFor();await page.screenshot({path:out+'/chapter-ipad.png'});
for(const [w,h] of [[1920,1080],[1024,768]]) {
 await page.setViewportSize({width:w,height:h});await page.goto(base+'/?lesson=lesson&block=question');
 await page.getByText('Step 01 of 2 · Response 01',{exact:true}).waitFor();
 await page.getByRole('heading',{name:'Which cart has the greater speed?',exact:true}).waitFor();
 await page.getByText('Explain using the graph.',{exact:true}).waitFor();
 assert.equal(await page.getByText('YOUR SAVED WORK',{exact:false}).count(),0);
 assert.equal(await page.locator('input,textarea,button').count(),0,'Projected questions have no student form controls');
 assert.equal(await page.getByText(/How sure are you|Need a starter|Rated on the physics/).count(),0);
 assert.equal(await page.getByRole('list',{name:'Answer choices'}).getByRole('listitem').count(),2);
 const cue=await page.getByRole('region',{name:'Classroom question'}).boundingBox();
 assert.ok(cue.x>=0&&cue.y>=0&&cue.x+cue.width<=w+1&&cue.y+cue.height<=h+1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:out+`/response-${w}x${h}.png`});
}
const support=page.getByRole('complementary',{name:'SEI supports'});
assert.equal(await support.count(),0);
seiEnabled=true;await support.waitFor();await support.getByText('Cart ___ is faster because ___.',{exact:true}).waitFor();await support.getByText('¿Qué carro tiene mayor rapidez?',{exact:true}).waitFor();
assert.match(await support.textContent(),/slope · speed/);
assert.equal(await page.locator('input,textarea,button').count(),0);
await page.screenshot({path:out+'/sei-on-ipad.png'});
seiEnabled=false;await support.waitFor({state:'detached'});
assert.match(page.url(),/block=question/,'Toggling keeps the projected question');
console.log('PASS projected SEI on/off updates in place, authored frame, word bank, translation, read-only display.');
await page.goto(base+'/?lesson=lesson&block=observation');await page.getByText('Step 02 of 2 · Response 02',{exact:true}).waitFor();await page.getByText('Describe the pattern',{exact:true}).waitFor();
await page.goto(base+'/auto?session_id=s');await page.waitForFunction(()=>document.querySelector('deck-stage')?.length>1);
await page.evaluate(()=>{const stage=document.querySelector('deck-stage');const index=[...stage.children].findIndex(section=>section.textContent.includes('Which cart has the greater speed?'));stage.goTo(index)});
const autoQuestion=page.getByRole('region',{name:'Classroom question'});await autoQuestion.waitFor();const autoIndex=await page.locator('deck-stage').evaluate(e=>e.index);
seiEnabled=true;await autoQuestion.getByRole('complementary',{name:'SEI supports'}).waitFor();assert.equal(await page.locator('deck-stage').evaluate(e=>e.index),autoIndex);
seiEnabled=false;await autoQuestion.getByRole('complementary',{name:'SEI supports'}).waitFor({state:'detached'});assert.equal(await page.locator('deck-stage').evaluate(e=>e.index),autoIndex);
console.log('PASS generated lesson deck updates SEI without changing the current slide.');
assert.equal(requests.some(r=>/block-responses|mastery|feedback/.test(r)),false,'Projection never loads or writes student evidence');assert.deepEqual(errors,[]);console.log('PASS intact graph, axes and legend at 1920x1080, 1280x720, 1024x768; no page overflow; text continuations; read-only projection. Screenshots:',out);
}finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
