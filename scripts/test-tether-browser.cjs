// Real cabinet React page + real Tether game. API transport is simulated;
// never reads credentials or creates production plays. Real keyboard input
// exercises all nine physics trajectories with the browser animation clock.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const P=require('../public/games/tether/physics.js'),levels=require('../public/games/tether/levels.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/tether-verification');fs.mkdirSync(out,{recursive:true});
const clientPlugin={name:'cabinet-test',setup(b){b.onResolve({filter:/^next\/(navigation|link)$/},a=>({path:a.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path.endsWith('navigation')?'export const useParams=()=>({slug:"tether"});':'export default function Link(p){return <a {...p}/>}',loader:'jsx',resolveDir:root}));}};
let server,browser;
(async()=>{try{
 const js=await esbuild.build({stdin:{contents:"import React from 'react';import{createRoot}from'react-dom/client';import Page from './src/app/arcade/[slug]/page';createRoot(document.getElementById('root')).render(<Page/>);",loader:'jsx',resolveDir:root},bundle:true,platform:'browser',format:'iife',jsx:'automatic',plugins:[clientPlugin],write:false,define:{'process.env.NODE_ENV':'"development"'}});
 let play=0,scoreRequests=[],payouts=0,failPayout=false,delay=1200;
 server=http.createServer(async(req,res)=>{try{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(pathname==='/bundle.js'){res.setHeader('Content-Type','text/javascript');return res.end(js.outputFiles[0].text)}
   if(pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');let body='';for await(const c of req)body+=c;const data=body?JSON.parse(body):{};
     if(pathname.endsWith('/cabinet'))return res.end(JSON.stringify({games:[{slug:'tether',name:'TETHER',costXp:0,srcPath:'/games/rotation-tether.html',accent:'#78ffcf',unit:'Rotational Motion'}],balance:{balance:100}}));
     if(pathname.endsWith('/leaderboard'))return res.end('{"weekly":[],"hallOfFame":[],"myWeeklyRank":null}');
     if(pathname.endsWith('/coin')){await new Promise(r=>setTimeout(r,delay));return res.end(JSON.stringify({playId:'test-'+(++play),balance:100,staff:false}))}
     if(pathname.endsWith('/score')){scoreRequests.push(data);return res.end(JSON.stringify({ok:true,score:data.score,finished:data.final}))}
     if(pathname.endsWith('/payout')){payouts++;if(failPayout){failPayout=false;res.statusCode=503;return res.end('{"error":"Test connection interrupted"}')}return res.end('{"xp":18,"balance":118}')}
   }
   if(pathname.startsWith('/games/')){res.setHeader('Content-Type',pathname.endsWith('.js')?'text/javascript':'text/html');return res.end(fs.readFileSync(path.join(root,'public',pathname)))}
   res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>body{margin:0;background:#071421;color:white;font-family:system-ui}iframe{width:100%;height:850px!important;border:0}a{color:#78ffcf}</style><div id="root"></div><script src="/bundle.js"></script>');
 }catch(e){console.error(e);res.statusCode=500;res.end('test failure')}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1366,height:1100}});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.message)});

 if(process.argv.includes('--layout-only')){
  await page.goto(base+'/games/rotation-tether.html');await page.getByRole('button',{name:'Start practice rescue'}).click();await page.getByRole('button',{name:'Ready at the anchor'}).click();
  await page.keyboard.down('Space');await page.waitForTimeout(850);await page.screenshot({path:path.join(out,'gameplay.png'),fullPage:true});await page.keyboard.up('Space');
  await page.setViewportSize({width:390,height:844});await page.reload();await page.getByRole('button',{name:'Start practice rescue'}).click();await page.getByRole('button',{name:'Ready at the anchor'}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});const box=await page.locator('#hold').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(1300);await page.mouse.up();await page.waitForTimeout(3000);assert(await page.locator('#overlay').isVisible());
  assert.deepEqual(errors,[]);console.log('PASS final desktop/mobile layout and pointer hold/release');return;
 }
 await page.goto(base+'/arcade/tether');const frame=page.frameLocator('iframe');await frame.getByRole('button',{name:'Start ranked rescue'}).click();await frame.getByRole('button',{name:'Ready at the anchor'}).waitFor();assert.equal(play,1);console.log('PASS delayed ranked approval stays ranked');
 const game=page.frames().find(f=>f.url().includes('rotation-tether'));
 const step=n=>page.waitForTimeout(n*1000/120);
 await frame.getByRole('button',{name:'Ready at the anchor'}).click();await page.keyboard.down('Space');await step(60);await page.keyboard.up('Space');await step(500);await frame.getByRole('button',{name:'Retry rescue'}).waitFor();await frame.getByRole('button',{name:'Retry rescue'}).click();console.log('PASS miss, feedback and retry');
 await page.keyboard.down('Space');await step(25);await page.keyboard.press('KeyP');await page.keyboard.up('Space');await step(250);assert(await frame.getByRole('heading',{name:'Take a breath.'}).isVisible());await frame.getByRole('button',{name:'Resume',exact:true}).click();await step(500);await frame.getByRole('button',{name:'Retry rescue'}).click();console.log('PASS paused clock and release while paused');
 function solution(L){let best=null;for(const pulse of L.motor?[.25,.5,.75,1,1.25,1.5,1.75,2]:[0]){const s={ax:8,ay:12,r:L.r,mass:L.mass,theta:L.angle*Math.PI/180,omega:0,work:0};for(let n=1;n<350;n++){const t=n*P.DT;P.advance(s,P.DT,L.motor&&t<=pulse?L.force*L.r:0);if(P.tension(s)<0)break;const hit=P.landing(P.release(s),L.padY);const distance=hit?Math.abs(hit.x-(L.target+(L.moving||0)*Math.sin((t+hit.time)*.75))):Infinity;if(distance<L.width*.2&&(!best||n<best.n))best={n,pulseFrames:Math.round(pulse/P.DT)};}}assert(best,'No early solution '+L.name);return best;}
 for(const L of levels){if(L.index>0)await frame.getByRole('button',{name:'Ready at the anchor'}).click();const sol=solution(L);await page.keyboard.down('Space');if(L.motor)await page.keyboard.down('ArrowRight');const first=Math.min(sol.n,sol.pulseFrames);if(first)await step(first);if(L.motor)await page.keyboard.up('ArrowRight');await step(sol.n-first);await page.keyboard.up('Space');await step(350);await frame.getByRole('heading',{name:'Rescue complete.'}).waitFor({timeout:3000});await frame.getByRole('button',{name:L.answers[L.correct],exact:true}).click();if(L.index===0){await game.locator('#canvas').screenshot({path:path.join(out,'first-rescue.png')});}
  if(L.index===8){failPayout=true;await frame.getByRole('button',{name:'Finish campaign & bank'}).click();}else await frame.getByRole('button',{name:'Next rescue'}).click();console.log('PASS rescue and rotation check',L.name);
 }
 await frame.getByRole('button',{name:'Retry save'}).waitFor();assert(await frame.getByRole('button',{name:'New rescue campaign'}).isDisabled());await frame.getByRole('button',{name:'Retry save'}).click();await frame.getByRole('button',{name:'New rescue campaign'}).waitFor();await game.waitForFunction(()=>!document.getElementById('again').disabled);assert.equal(payouts,2);const final=scoreRequests.filter(r=>r.final).at(-1);assert.equal(final.stats.solved,9);assert.equal(final.stats.right,9);assert.equal(final.stats.wrong,0);assert(final.score<=25000);console.log('PASS failed payout retains result and retry succeeds');
 await game.locator('body').screenshot({path:path.join(out,'campaign-complete.png')});await frame.getByRole('button',{name:'New rescue campaign'}).click();delay=0;await frame.getByRole('button',{name:'Start ranked rescue'}).click();await frame.getByRole('button',{name:'Ready at the anchor'}).waitFor();await frame.locator('#bankBrief').click();await game.waitForFunction(()=>!document.getElementById('again').disabled);const fresh=scoreRequests.filter(r=>r.final).at(-1);assert.equal(fresh.stats.solved,0);assert.equal(fresh.score,0);console.log('PASS fresh campaign resets score and learning totals');
 await page.goto(base+'/games/rotation-tether.html');await page.getByRole('button',{name:'Start practice rescue'}).click();await page.getByRole('button',{name:'Ready at the anchor'}).click();await page.keyboard.down('Space');await page.waitForTimeout(1125);await page.keyboard.press('KeyP');await page.keyboard.up('Space');await page.locator('body').screenshot({path:path.join(out,'desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.reload();await page.getByRole('button',{name:'Start practice rescue'}).click();await page.getByRole('button',{name:'Ready at the anchor'}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:'How to play'}).click();await page.getByRole('button',{name:'Back to rescue'}).click();await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});assert.equal(await page.getByText('Practice · no XP',{exact:true}).count(),1);assert.deepEqual(errors,[]);console.log('PASS mobile fit, help, practice isolation; no browser runtime errors');
 console.log('All Tether browser checks passed');
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
