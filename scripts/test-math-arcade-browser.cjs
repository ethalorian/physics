// Real cabinet page/game scripts, mocked API. Test-only closure access is injected
// into served HTML to observe state and exercise timeout boundaries; never shipped.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=process.env.MATH_TEST_OUT||path.join(root,'docs/math-arcade-verification');fs.mkdirSync(out,{recursive:true});
const games={'inverse-blitz':'algebra-inverse-blitz','magnitude':'numbersense-magnitude','scale-storm':'proportion-scale-storm','powers-of-ten':'quantities-powers-of-ten','slope-sniper':'graphs-slope-sniper'};
const remaining={'fusion':'equivalence-fusion','expression-crush':'logic-expression-crush','mathle':'daily-mathle'};
let browser,server;
(async()=>{try{
 const js=await esbuild.build({stdin:{contents:"import React from 'react';import{createRoot}from'react-dom/client';import Page from './src/app/arcade/[slug]/page';createRoot(document.getElementById('root')).render(<Page/>);",loader:'jsx',resolveDir:root},bundle:true,platform:'browser',format:'iife',jsx:'automatic',write:false,outfile:'arcade-fixture.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fixture',setup(b){b.onResolve({filter:/^next\/(navigation|link)$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path.endsWith('navigation')?'export const useParams=()=>({slug:location.pathname.split("/").at(-1)});':'export default function Link(p){return <a {...p}/>}',loader:'jsx',resolveDir:root}))}}]});
 let plays=0,payouts=0,failPayout=false,deny=false;const scores=[];
 server=http.createServer(async(req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/bundle.js'){res.setHeader('Content-Type','text/javascript');return res.end(js.outputFiles[0].text)}
 if(pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');let body='';for await(const c of req)body+=c;const data=body?JSON.parse(body):{};
 if(pathname.endsWith('/cabinet'))return res.end(JSON.stringify({games:Object.entries({...games,...remaining}).map(([slug,file])=>({slug,name:slug,costXp:0,srcPath:'/games/'+file+'.html',accent:'#78ffcf',unit:'Math'})),balance:{balance:100}}));
 if(pathname.endsWith('/leaderboard'))return res.end('{"weekly":[],"hallOfFame":[],"myWeeklyRank":null}');
 if(pathname.endsWith('/coin')){await new Promise(r=>setTimeout(r,1200));if(deny){deny=false;res.statusCode=503;return res.end('{"error":"Try again"}')}return res.end(JSON.stringify({playId:'math-'+(++plays),balance:100}))}
 if(pathname.endsWith('/score')){scores.push(data);return res.end(JSON.stringify({score:data.score}))}
 if(pathname.endsWith('/payout')){payouts++;if(failPayout){failPayout=false;res.statusCode=503;return res.end('{"error":"Retry fixture"}')}return res.end('{"xp":4,"balance":104}')}
 }
 if(pathname.startsWith('/games/')){let content=fs.readFileSync(path.join(root,'public',pathname),'utf8');if(Object.values(games).some(f=>pathname.endsWith(f+'.html')))content=content.replace('  hsLine();\n})();','  window.__mathTest={state:()=>S,bridge:ARCADE,land};\n  hsLine();\n})();');if(Object.values(remaining).some(f=>pathname.endsWith(f+'.html'))){
 const hook=pathname.includes('fusion')?'render:()=>{for(const n of nodes.values())n.remove();nodes.clear();S.board.forEach((t,i)=>{if(t)posNode(t,i,true)});},':pathname.includes('crush')?'render:()=>{clearNodes();placeAll(true);hud();},click:ids=>ids.forEach(id=>nodes.get(id).dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))),':'press,';
 content=content.replace(/(  (?:sizeBoard\(\); |buildGrid\(\); buildPad\(\); )hsLine\(\);)/,'  window.__mathTest={state:()=>S,bridge:ARCADE,busy:()=>busy,'+hook+'};\n$1');
 content=content.replace('const a=genAudit(S.mode);','const a=genAudit(S.mode);window.__audit=a;');
 }
 res.setHeader('Content-Type',pathname.endsWith('.js')?'text/javascript':'text/html');return res.end(content)}
 res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>body{margin:0;background:#071421;color:white}iframe{width:100%;height:900px!important;border:0}</style><div id="root"></div><script src="/bundle.js"></script>');
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1366,height:1050}});await page.route('https://fonts.googleapis.com/**',r=>r.abort());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(!process.env.MATH_REMAINING_ONLY) for(const [slug,file] of Object.entries(games)){
  await page.goto(base+'/arcade/'+slug);const frame=page.frameLocator('iframe');await frame.locator('#startOv .bigbtn').first().click();
  const game=page.frames().find(f=>f.url().endsWith(file+'.html'));await game.waitForFunction(()=>window.__mathTest?.state()?.running);
  assert(await game.evaluate(()=>!!window.__mathTest.bridge.playId));
  const correct=await game.evaluate(()=>window.__mathTest.state().cur.chips.findIndex(c=>c.ok));await page.keyboard.press(String(correct+1));await page.keyboard.press('p');
  await page.waitForTimeout(450);await frame.locator('#resumeBtn').click();
  assert.equal(await game.evaluate(()=>window.__mathTest.state().cur.i),0);assert.equal(await game.evaluate(()=>window.__mathTest.state().solved),1);
  const wrong=await game.evaluate(()=>window.__mathTest.state().cur.chips.findIndex(c=>!c.ok));await page.keyboard.press(String(wrong+1));await page.keyboard.press(String(wrong+1));assert.equal(await game.evaluate(()=>window.__mathTest.state().wrong),1);
  await page.waitForTimeout(950);await game.evaluate(()=>window.__mathTest.land());assert.equal(await game.evaluate(()=>window.__mathTest.state().wrong),2);
  failPayout=true;await frame.locator('#pauseBtn').click();await frame.locator('#quitBtn').click();
  await frame.getByRole('button',{name:'Retry save',exact:true}).waitFor();assert(await frame.locator('#againBtn').isDisabled());
  const playId=await game.evaluate(()=>window.__mathTest.bridge.playId);await frame.getByRole('button',{name:'Retry save',exact:true}).click();await game.waitForFunction(()=>window.__mathTest.bridge.playId===null);
  assert.match(await frame.locator('#xpLine').innerText(),/4 XP banked/);assert.equal(scores.filter(s=>s.final&&s.playId===playId).length,2);
  const timedRecords=await game.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('hs_')||k.startsWith('ib_hs_'))));
  await frame.locator('#menuBtn').click();const before=plays;await frame.locator('#untimedPractice').check();await frame.locator('#startOv .bigbtn').first().click();
  await game.waitForFunction(()=>window.__mathTest.state().running);const y=await game.evaluate(()=>window.__mathTest.state().y);await page.waitForTimeout(250);assert.equal(await game.evaluate(()=>window.__mathTest.state().y),y);assert.equal(plays,before);
  assert.equal(await game.evaluate(()=>window.__mathTest.state().wrong),0);for(let i=0;i<2;i++){const k=await game.evaluate(()=>window.__mathTest.state().cur.chips.findIndex(c=>c.ok));await page.keyboard.press(String(k+1));await page.waitForTimeout(400);await frame.getByRole('button',{name:'Next problem',exact:true}).click();assert(await game.evaluate(()=>{const b=document.querySelector('#board').getBoundingClientRect(),q=document.querySelector('#card .eq').getBoundingClientRect();return q.top>=b.top&&q.bottom<=b.bottom}),slug+' next practice question visible');}
  await frame.locator('#pauseBtn').click();await frame.locator('#quitBtn').click();assert.match(await frame.locator('#xpLine').innerText(),/Untimed practice complete/);
  assert.deepEqual(await game.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('hs_')||k.startsWith('ib_hs_')))),timedRecords);
  // Practice must not alter the timed local record.
  await page.waitForTimeout(850);await game.locator('body').screenshot({path:path.join(out,slug+'-complete.png')});
  await page.goto(base+'/games/'+file+'.html');await page.setViewportSize({width:390,height:844});await page.locator('#untimedPractice').check();await page.locator('#startOv .bigbtn').first().click();await page.waitForTimeout(100);
  const chips=page.locator('.chip');for(let i=0;i<4;i++){const box=await chips.nth(i).boundingBox();assert(box&&box.x>=0&&box.x+box.width<=391&&box.y+box.height<=845,slug+' mobile answer fit')}
  await page.screenshot({path:path.join(out,slug+'-mobile.png')});await page.locator('#pauseBtn').click();await page.locator('#quitBtn').click();
  await page.setViewportSize({width:1366,height:1050});console.log('PASS',slug,'ranked delay, solve/pause/resume, wrong-answer guard, missed problem, final retry, fresh untimed run, mobile controls');
 }
 deny=true;await page.goto(base+'/arcade/magnitude');const deniedFrame=page.frameLocator('iframe');await deniedFrame.locator('#startOv .bigbtn').first().click();await deniedFrame.locator('#mathConnection').filter({hasText:'Try again'}).waitFor();
 const deniedGame=page.frames().find(f=>f.url().endsWith('numbersense-magnitude.html'));assert.equal(await deniedGame.evaluate(()=>window.__mathTest.state().running),false);assert.equal(await deniedGame.evaluate(()=>window.__mathTest.bridge.playId),null);
 await deniedFrame.locator('#untimedPractice').check();await deniedFrame.locator('#startOv .bigbtn').first().click();await deniedGame.waitForFunction(()=>window.__mathTest.state().running);console.log('PASS denied ranked start does not silently start practice; deliberate practice remains available');
 await require('./test-math-remaining-browser.cjs')({page,base,out,remaining,scores,fail:()=>{failPayout=true},deny:()=>{deny=true},plays:()=>plays});
 assert.deepEqual(errors,[]);console.log('All math browser checks passed; API transport mocked', {plays,payouts});
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
