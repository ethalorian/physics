const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createServer}=require('./preview-pulse.cjs');const root=path.resolve(__dirname,'..'),out='/private/tmp/pulse-encore-verification';let browser,server;
(async()=>{
 const mocks={'next/navigation':'export const useParams=()=>({slug:"pulse"})','next/link':'import React from "react";export default function Link(p){return React.createElement("a",p,p.children)}'};
 const bundle=await require('esbuild').build({stdin:{contents:'import React from "react";import {createRoot} from "react-dom/client";import Page from "./src/app/arcade/[slug]/page";createRoot(document.getElementById("root")).render(<Page/>);',resolveDir:root,loader:'tsx'},bundle:true,write:false,outfile:'/private/tmp/pulse-parent.js',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js',resolveDir:root}));}}]});
 server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let coin,score,failed=false;const queries=[];
 await page.route('**/parent-test',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>body{background:#101722;color:white;font:16px Arial;margin:24px}iframe{width:100%}'+bundle.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('')+'</style><div id="root"></div><script>'+bundle.outputFiles.find(f=>f.path.endsWith('.js')).text+'</script>'}));
 await page.route('**/api/arcade/cabinet',r=>r.fulfill({json:{games:[{slug:'pulse',name:'Pulse',costXp:10,srcPath:'/games/midway-pulse.html'}],balance:{balance:50}}}));
 await page.route('**/api/arcade/leaderboard?*',async r=>{const chart=new URL(r.request().url()).searchParams.get('chart');queries.push(chart);await new Promise(done=>setTimeout(done,chart.endsWith('master')?450:50));await r.fulfill({status:failed?503:200,json:failed?{error:'Unavailable'}:{chartId:chart,weekly:[{rank:1,name:chart,score:900000,isMe:false}],hallOfFame:[],myWeeklyRank:null}});});
 await page.route('**/api/arcade/coin',r=>{coin=r.request().postDataJSON();return r.fulfill({json:{playId:'fixture-pulse',chartId:coin.chartId,balance:40}})});
 await page.route('**/api/arcade/score',r=>{score=r.request().postDataJSON();return r.fulfill({json:{score:score.score,finished:true}})});
 await page.goto(base+'/parent-test');const f=page.frameLocator('iframe');await f.locator('#song').waitFor();
 await f.locator('#song').selectOption('solar-flare');await f.locator('[data-difficulty="master"]').click();await f.locator('[data-difficulty="overdrive"]').click();
 await page.getByText('solar-flare-overdrive',{exact:false}).waitFor();await page.waitForTimeout(550);
 assert.equal(await page.getByText('solar-flare-master',{exact:false}).count(),0,'stale board response ignored');
 assert(await page.getByText('Rankings: Solar Flare · Overdrive · 6 keys',{exact:true}).isVisible());
 await f.locator('#ranked').click();await f.locator('#livePanel').waitFor();assert.equal(coin.chartId,'solar-flare-overdrive');
 await f.locator('#pause').click();await f.locator('#endRun').click();await f.locator('#saveStatus').filter({hasText:'Score saved'}).waitFor();
 assert.equal(score.playId,'fixture-pulse');assert.equal(score.final,true);assert.equal(queries.at(-1),'solar-flare-overdrive');
 failed=true;await f.locator('#back').click();await f.locator('#song').selectOption('chrome-circuit');await page.getByRole('button',{name:'Reload rankings'}).waitFor();await page.waitForTimeout(600);failed=false;await page.getByRole('button',{name:'Reload rankings'}).click();await page.getByText('chrome-circuit-overdrive',{exact:false}).waitFor();
 // Verify every arrangement creates distinct, non-silent audio using real Web Audio offline rendering.
 await page.goto(base+'/games/midway-pulse.html');await page.locator('#practice').click();await page.locator('#pause').click();
 const audio=await page.evaluate(async()=>{
  const results=[];const seedSound=new PulseSound();await seedSound.ensure();
  for(const song of PulseEngine.songs){
   const s=new PulseSound();s.songId=song.id;s.ctx=new OfflineAudioContext(1,44100*8,44100);s.master=s.ctx.createGain();s.master.gain.value=.65;s.master.connect(s.ctx.destination);s.noise=seedSound.noise;
   const beat=60/song.bpm,startBar=Math.floor(song.bars*4/6);
   for(let step=0;step<Math.floor(8/(beat/4));step++)s.schedule(16+startBar*16+step,step*beat/4);
   const buffer=await s.ctx.startRendering(),data=buffer.getChannelData(0);let sum=0,peak=0,signature=0;for(let i=0;i<data.length;i++){sum+=data[i]*data[i];peak=Math.max(peak,Math.abs(data[i]));if(i%101===0)signature+=data[i]*(i%37);}
   results.push({song:song.id,rms:Math.sqrt(sum/data.length),peak,signature});
  }await seedSound.ctx.close();return results;
 });
 assert(audio.every(a=>a.rms>.015&&a.peak<1));assert.equal(new Set(audio.map(a=>a.signature.toFixed(3))).size,5);
 // Six-key touch targets and releases on narrow screens, plus all song labels.
 await page.locator('#endRun').click();await page.locator('#back').click();
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});await page.locator('[data-difficulty="overdrive"]').click();assert.equal(await page.locator('[data-lane]').count(),6);
  for(const s of ['neon-current','chrome-circuit','midnight-drive','solar-flare','terminal-velocity']){await page.locator('#song').selectOption(s);assert(await page.locator('[data-difficulty="overdrive"]').getAttribute('aria-pressed')==='true');}
  await page.locator('#practice').click();await page.waitForFunction(()=>document.body.dataset.screen==='playing');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.keyboard.down('s');await page.keyboard.down('l');assert.equal(await page.locator('.pads .active').count(),2);await page.keyboard.up('s');await page.keyboard.up('l');assert.equal(await page.locator('.pads .active').count(),0);
  await page.screenshot({path:out+'/six-key-mobile-'+width+'.png'});await page.locator('#pause').click();await page.locator('#endRun').click();await page.locator('#back').click();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/cabinet-audio.json',JSON.stringify({audio,coin,score,queries,errors},null,2));console.log('PASS real React cabinet, chart selection, board race protection, credit/chart binding, save across board rerenders, failed-board retry, five distinct audible soundtracks, six-key mobile layouts and outer key input');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
