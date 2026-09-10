// Real cabinet and Descent HTML with mock API transport; no production data.
// Real first-mission integration, keyboard/pointer flow, and contact fixtures for Acts II/III.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/descent-verification');fs.mkdirSync(out,{recursive:true});
const clientPlugin={name:'cabinet-test',setup(b){b.onResolve({filter:/^next\/(navigation|link)$/},a=>({path:a.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path.endsWith('navigation')?'export const useParams=()=>({slug:"descent"});':'export default function Link(p){return <a {...p}/>}',loader:'jsx',resolveDir:root}));}};
let server,browser;
(async()=>{try{
 const js=await esbuild.build({stdin:{contents:"import React from 'react';import{createRoot}from'react-dom/client';import Page from './src/app/arcade/[slug]/page';createRoot(document.getElementById('root')).render(<Page/>);",loader:'jsx',resolveDir:root},bundle:true,platform:'browser',format:'iife',jsx:'automatic',plugins:[clientPlugin],write:false,outfile:'arcade-fixture.js',define:{'process.env.NODE_ENV':'"development"'}});
 let play=0,scoreRequests=[],payouts=0,failPayout=false,delay=1200;
 server=http.createServer(async(req,res)=>{try{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(pathname==='/bundle.js'){res.setHeader('Content-Type','text/javascript');return res.end(js.outputFiles[0].text)}
   if(pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');let body='';for await(const c of req)body+=c;const data=body?JSON.parse(body):{};
     if(pathname.endsWith('/cabinet'))return res.end(JSON.stringify({games:[{slug:'descent',name:'TETHER',costXp:0,srcPath:'/games/kinematics-descent.html',accent:'#78ffcf',unit:'Rotational Motion'}],balance:{balance:100}}));
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
 await page.goto(base+'/arcade/descent');const frame=page.frameLocator('iframe');
 await frame.getByRole('button',{name:'OPEN HANGAR'}).click();await frame.getByRole('button',{name:/ACT I — FREEFALL/}).click();
 await frame.getByRole('button',{name:'BEGIN DESCENT'}).waitFor();assert.equal(play,1);
 const game=page.frames().find(f=>f.url().includes('kinematics-descent'));
 assert.equal(await game.evaluate(()=>ARCADE.playId),'test-1');console.log('PASS delayed approval stays ranked');
 await frame.getByRole('button',{name:'BEGIN DESCENT'}).click();await page.keyboard.press('KeyP');
 const paused=await game.evaluate(()=>t);await page.waitForTimeout(150);assert.equal(await game.evaluate(()=>t),paused);
 await frame.getByRole('button',{name:'RESUME',exact:true}).click();
 // Integrate the real first mission with a braking-distance pilot, using the real step function.
 const result=await game.evaluate(()=>{
  let steps=0;
  while(state==='play'&&steps++<20000){
   const stopping=ship.vy<0?ship.vy*ship.vy/(2*(lv.thrust-lv.g)):0;
   ship.up=ship.vy<0&&ship.y<stopping+1.5;
   step(1/120);
  }
  return {state,landedOK,impact:lastResult?.impact};
 });assert(result.landedOK,JSON.stringify(result));
 await frame.getByRole('button',{name:'CHECK YOUR FLIGHT'}).click();
 assert.equal(await frame.getByRole('button',{name:/SKIP/}).count(),0);
 await frame.getByRole('button',{name:/Net acceleration pointed upward/}).click();
 assert.equal(await game.evaluate(()=>STATS.solved),1);
 // Repeated answer events must not count twice.
 await game.evaluate(()=>answer(curQ.choices.findIndex(c=>c.ok)));assert.equal(await game.evaluate(()=>STATS.right),1);
 await game.locator('#overlay').screenshot({path:path.join(out,'flight-check.png')});
 failPayout=true;await frame.getByRole('button',{name:'FINISH & BANK'}).click();
 await frame.getByRole('button',{name:'RETRY SAVE'}).waitFor();assert(await frame.getByRole('button',{name:'BACK TO HANGAR'}).isDisabled());
 const id=await game.evaluate(()=>ARCADE.playId);await frame.getByRole('button',{name:'RETRY SAVE'}).click();
 await game.waitForFunction(()=>ARCADE.playId===null);assert.equal(payouts,2);
 assert(scoreRequests.filter(r=>r.final).every(r=>r.playId===id&&r.stats.solved===1));
 await frame.getByRole('button',{name:'BACK TO HANGAR'}).click();await frame.getByRole('button',{name:/ACT I — FREEFALL/}).click();
 await frame.getByRole('button',{name:'BEGIN DESCENT'}).waitFor();assert.deepEqual(await game.evaluate(()=>({...STATS})),{solved:0,right:0,wrong:0});
 console.log('PASS real landing, required check, one answer, save retry and fresh counters');
 await frame.getByRole('button',{name:'BEGIN DESCENT'}).click();
 await game.evaluate(()=>{ship.up=false;while(state==='play')step(1/120)});
 await frame.getByRole('button',{name:'RETRY DESCENT'}).waitFor();assert.match(await frame.locator('#overlay').innerText(),/Start braking earlier/);
 await frame.getByRole('button',{name:'FINISH & BANK'}).click();await game.waitForFunction(()=>ARCADE.playId===null);
 console.log('PASS missed landing explains the actual impact and can bank');
 await page.goto(base+'/games/kinematics-descent.html');
 // Boundary fixtures exercise real contact checks in Acts II and III and their check UI.
 for(const a of [2,3]){
  await page.evaluate(a=>startAct(a),a);await page.getByRole('button',{name:a===2?'BEGIN DESCENT':'TO THE CANNON'}).click();
  await page.evaluate(a=>{
   if(a===2){ship.x=padX;ship.y=.001;ship.vx=lv.padV||0;ship.vy=-.1;step(1/120);}
   else{fire();ship.x=lv.target.x;ship.y=lv.target.y+.001;ship.vy=-.1;step3(1/120);}
  },a);
  await page.getByRole('button',{name:'CHECK YOUR FLIGHT'}).click();
  const correct=await page.evaluate(()=>curQ.choices.findIndex(c=>c.ok));await page.locator('#ch'+correct).click();
  await page.getByRole('button',{name:'FINISH & BANK'}).click();assert.match(await page.locator('#saveStatus').innerText(),/Practice complete/);
 }
 console.log('PASS Acts II and III contact/check fixtures and standalone practice');
 await page.setViewportSize({width:390,height:844});await page.reload();await page.getByRole('button',{name:'OPEN HANGAR'}).click();await page.getByRole('button',{name:/ACT I — FREEFALL/}).click();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:'BEGIN DESCENT'}).scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(out,'mobile-briefing.png')});
 await page.getByRole('button',{name:'BEGIN DESCENT'}).click();await page.locator('#pauseFlight').click();await page.getByRole('button',{name:'FINISH & BANK'}).click();
 console.log('PASS mobile briefing, pause and bank');
 await page.goto(base+'/games/momentum-impact.html');await page.evaluate(()=>{startAct(1);launch();step(1/120)});assert.equal(await page.evaluate(()=>state),'play');
 await page.evaluate(()=>{t=75;step(1/120)});assert.notEqual(await page.evaluate(()=>state),'play');
 assert.deepEqual(errors,[]);console.log('PASS Impact Act I advances and course timeout resolves; no browser errors');
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
