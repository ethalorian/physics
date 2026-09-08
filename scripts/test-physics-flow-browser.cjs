// Real cabinet and Descent HTML with mock API transport; no production data.
// Real first-mission integration, keyboard/pointer flow, and contact fixtures for Acts II/III.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const slug=process.argv[2]||'push';assert(['push','cascade'].includes(slug));
const gameFile=slug==='push'?'dynamics-push':'energy-cascade';
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/physics-verification',slug);fs.mkdirSync(out,{recursive:true});
const clientPlugin={name:'cabinet-test',setup(b){b.onResolve({filter:/^next\/(navigation|link)$/},a=>({path:a.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path.endsWith('navigation')?`export const useParams=()=>({slug:${JSON.stringify(slug)}});`:'export default function Link(p){return <a {...p}/>}',loader:'jsx',resolveDir:root}));}};
let server,browser;
(async()=>{try{
 const js=await esbuild.build({stdin:{contents:"import React from 'react';import{createRoot}from'react-dom/client';import Page from './src/app/arcade/[slug]/page';createRoot(document.getElementById('root')).render(<Page/>);",loader:'jsx',resolveDir:root},bundle:true,platform:'browser',format:'iife',jsx:'automatic',plugins:[clientPlugin],write:false,define:{'process.env.NODE_ENV':'"development"'}});
 let play=0,scoreRequests=[],payouts=0,failPayout=false,delay=1200;
 server=http.createServer(async(req,res)=>{try{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(pathname==='/bundle.js'){res.setHeader('Content-Type','text/javascript');return res.end(js.outputFiles[0].text)}
   if(pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');let body='';for await(const c of req)body+=c;const data=body?JSON.parse(body):{};
     if(pathname.endsWith('/cabinet'))return res.end(JSON.stringify({games:[{slug,name:slug.toUpperCase(),costXp:0,srcPath:'/games/'+gameFile+'.html',accent:'#78ffcf',unit:'Rotational Motion'}],balance:{balance:100}}));
     if(pathname.endsWith('/leaderboard'))return res.end('{"weekly":[],"hallOfFame":[],"myWeeklyRank":null}');
     if(pathname.endsWith('/coin')){await new Promise(r=>setTimeout(r,delay));return res.end(JSON.stringify({playId:'test-'+(++play),balance:100,staff:false}))}
     if(pathname.endsWith('/score')){scoreRequests.push(data);return res.end(JSON.stringify({ok:true,score:data.score,finished:data.final}))}
     if(pathname.endsWith('/payout')){payouts++;if(failPayout){failPayout=false;res.statusCode=503;return res.end('{"error":"Test connection interrupted"}')}return res.end('{"xp":12,"balance":112}')}
   }
   if(pathname.startsWith('/games/')){res.setHeader('Content-Type',pathname.endsWith('.js')?'text/javascript':'text/html');return res.end(fs.readFileSync(path.join(root,'public',pathname)))}
   res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>body{margin:0;background:#071421;color:white;font-family:system-ui}iframe{width:100%;height:850px!important;border:0}a{color:#78ffcf}</style><div id="root"></div><script src="/bundle.js"></script>');
 }catch(e){console.error(e);res.statusCode=500;res.end('test failure')}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1366,height:1100}});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.message)});



 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto(base+'/arcade/'+slug);const frame=page.frameLocator('iframe');
 await frame.getByRole('button',{name:'CHOOSE AN ACT'}).click();await frame.getByRole('button',{name:/ACT I —/}).click();
 await frame.locator('button[onclick="launch()"]').waitFor();assert.equal(play,1);
 const game=page.frames().find(f=>f.url().includes(gameFile));
 await frame.locator('button[onclick="launch()"]').click();await page.keyboard.press('KeyP');
 const paused=await game.evaluate(()=>t);await page.waitForTimeout(150);assert.equal(await game.evaluate(()=>t),paused);
 await frame.getByRole('button',{name:'RESUME',exact:true}).click();
 const result=await game.evaluate(slug=>{
  if(slug==='push'){
   const mu=lv.segs[0].muk,accel=(lv.F-mu*lv.m*G)/lv.m,d=(lv.zone[0]+lv.zone[1])/2-1.2;
   aim={F:lv.F,dt:Math.sqrt(2*d/(accel+accel*accel/(mu*G)))};fire1();
  }else{spring=4000;launchGo();}
  let n=0;while(state==='play'&&n++<20000){
   if(slug==='cascade')braking=cart.v>0&&cart.x+cart.v*cart.v/(2*BRK)>=(lv.dock[0]+lv.dock[1])/2;
   step(1/120);
  }
  return {state,landedOK,result:lastResult,energy:typeof E0==='number'?E0:undefined};
 },slug);assert(result.landedOK,JSON.stringify(result));if(slug==='cascade')assert.equal(result.energy,4000);
 await frame.getByRole('button',{name:'CHECK THIS MISSION'}).click();assert.equal(await frame.getByRole('button',{name:/SKIP/}).count(),0);
 const correct=await game.evaluate(()=>curQ.choices.findIndex(c=>c.ok));await frame.locator('#ch'+correct).click();
 await game.evaluate(()=>answer(curQ.choices.findIndex(c=>c.ok)));assert.equal(await game.evaluate(()=>STATS.solved),1);
 await page.waitForTimeout(300);await game.locator('#overlay').screenshot({path:path.join(out,'mission-check.png')});
 failPayout=true;await frame.getByRole('button',{name:'FINISH & BANK'}).click();
 await frame.getByRole('button',{name:'RETRY SAVE'}).waitFor();assert(await frame.getByRole('button',{name:'BACK TO ACTS'}).isDisabled());
 const id=await game.evaluate(()=>ARCADE.playId);await frame.getByRole('button',{name:'RETRY SAVE'}).click();await game.waitForFunction(()=>ARCADE.playId===null);
 assert.equal(payouts,2);assert(scoreRequests.filter(r=>r.final).every(r=>r.playId===id&&r.stats.solved===1));
 await frame.getByRole('button',{name:'BACK TO ACTS'}).click();await frame.getByRole('button',{name:/ACT I —/}).click();await frame.locator('button[onclick="launch()"]').waitFor();
 assert.deepEqual(await game.evaluate(()=>({...STATS})),{solved:0,right:0,wrong:0});
 await frame.getByRole('button',{name:'FINISH & BANK'}).click();await game.waitForFunction(()=>ARCADE.playId===null);
 assert.equal(scoreRequests.at(-1).stats.solved,0);
 console.log('PASS',slug,'real first mission, pause, flight check, failed-save retry, empty bank and fresh counters');
 await page.goto(base+'/games/'+gameFile+'.html');
 for(const a of [2,3]){
  await page.evaluate(a=>startAct(a),a);await page.locator('button[onclick="launch()"]').click();
  // Contact fixtures use the real success condition after parking inside the dock.
  await page.evaluate(slug=>{
   if(slug==='push'){crate.s=(lv.zone[0]+lv.zone[1])/2;crate.v=0;pushL=pushR=false;parkT=0;for(let i=0;i<200&&state==='play';i++)step(1/120);}
   else{cart.x=(lv.dock[0]+lv.dock[1])/2;cart.v=0;spring=0;state='play';braking=boosting=false;settleT=0;for(let i=0;i<200&&state==='play';i++)step(1/120);}
  },slug);
  assert(await page.evaluate(()=>landedOK));await page.getByRole('button',{name:'CHECK THIS MISSION'}).click();
  const idx=await page.evaluate(()=>curQ.choices.findIndex(c=>c.ok));await page.locator('#ch'+(a===2?(idx+1)%4:idx)).click();
  assert.equal(await page.evaluate(()=>STATS.solved),1);assert.equal(await page.evaluate(()=>STATS.wrong),a===2?1:0);
  await page.getByRole('button',{name:'FINISH & BANK'}).click();assert.match(await page.locator('#saveStatus').innerText(),/Practice complete/);
 }
 console.log('PASS',slug,'Acts II/III contact fixtures, contextual checks and wrong-answer continuation');
 await page.reload();await page.evaluate(()=>startAct(1));
 await page.evaluate(()=>{levelIdx=ACT_LEVELS[1].length-1;nextLevel()});
 assert(await page.evaluate(()=>PROG.a2));await page.getByRole('button',{name:'BANK THIS ACT'}).click();await page.getByRole('button',{name:'BACK TO ACTS'}).click();
 await page.getByRole('button',{name:/ACT II —/}).click();assert.equal(await page.evaluate(()=>act),2);
 await page.getByRole('button',{name:'FINISH & BANK'}).click();
 await page.setViewportSize({width:390,height:844});await page.reload();await page.getByRole('button',{name:'CHOOSE AN ACT'}).click();await page.getByRole('button',{name:/ACT I —/}).click();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('button[onclick="launch()"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'mobile-briefing.png')});
 await page.locator('button[onclick="launch()"]').click();await page.locator('#pauseRun').click();await page.getByRole('button',{name:'RESUME',exact:true}).click();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>state),'paused');
 await page.getByRole('button',{name:'FINISH & BANK'}).click();assert.deepEqual(errors,[]);
 console.log('PASS',slug,'act unlock/bank, mobile layout, pointer pause and focus-loss pause; no browser errors');
 if(slug==='cascade'){
  const energy=await page.evaluate(()=>{
   muted=true;ARCADE.runOpen=false;startAct(1);launch();spring=0;launchGo();for(let i=0;i<100;i++)step(1/120);if(E0!==0||ke()!==0||heat!==0)throw new Error('Empty spring created energy');let maxError=0,steps=0;
   for(const a of [1,2,3])for(const level of ACT_LEVELS[a]){
    ARCADE.runOpen=false;startAct(a);showMission(level);launch();
    if(state==='charge'){spring=lv.springMax*.8;launchGo();}
    for(let i=0;i<3000&&state==='play';i++){
     braking=i%240>100&&i%240<160;boosting=a>1&&i%240<100;
     step(1/120);steps++;
     const actual=ke()+pe()+heat+spring+budget+battery;
     maxError=Math.max(maxError,Math.abs(actual-E0)/E0);
     if([heat,budget,battery,ke()].some(v=>!Number.isFinite(v)||v< -1e-7))throw new Error('Invalid energy store');
    }
   }
   return {maxError,steps};
  });
  assert(energy.maxError<1e-7,JSON.stringify(energy));console.log('PASS energy accounting across all Cascade campaign levels',energy);
 }

}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
