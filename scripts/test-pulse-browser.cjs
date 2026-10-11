const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { createServer } = require('./preview-pulse.cjs');
const root = path.resolve(__dirname,'..'), out = '/private/tmp/pulse-encore-verification';
let browser,server;
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const bundle = await require('esbuild').build({stdin:{contents:"import {createTetherBridge} from './src/lib/tether-bridge';window.createPulseBridge=createTetherBridge;",resolveDir:root},bundle:true,write:false,format:'iife',platform:'browser'});
  server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1366,height:900}}), page=await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{
    let Sound;
    Object.defineProperty(window,'PulseSound',{configurable:true,get:()=>Sound,set:Class=>{
      Sound=Class;const ensure=Class.prototype.ensure;
      Class.prototype.ensure=async function(){await ensure.call(this);window.__testAudio=this;if(!this.analyser){this.analyser=this.ctx.createAnalyser();this.analyser.fftSize=1024;this.master.connect(this.analyser);}};
    }});
  });
  await page.goto(base+'/games/midway-pulse.html');
  assert(await page.locator('#ranked').isHidden(),'standalone is free practice');
  await page.screenshot({path:out+'/desktop-menu.png'});
  await page.locator('#settingsOpen').click();await page.locator('#offset').fill('40');await page.locator('#offset').dispatchEvent('input');
  assert.equal(await page.locator('#offsetValue').innerText(),'+40 ms');await page.keyboard.press('Escape');
  await page.reload();await page.locator('#settingsOpen').click();assert.equal(await page.locator('#offset').inputValue(),'40');
  await page.locator('#offset').fill('0');await page.locator('#offset').dispatchEvent('input');await page.keyboard.press('Escape');
  for(const viewport of [{width:320,height:720},{width:390,height:844},{width:820,height:1180},{width:1366,height:520}]){
    await page.setViewportSize(viewport);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),JSON.stringify(viewport)+' no horizontal overflow');
    assert(await page.locator('#practice').isVisible());
    await page.screenshot({path:`${out}/menu-${viewport.width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});await page.locator('[data-difficulty="easy"]').click();await page.locator('#practice').click();
  await page.waitForFunction(()=>document.body.dataset.screen==='playing');
  await page.keyboard.press('Escape');assert(await page.locator('#pauseOverlay').isVisible());
  const pausedAt=await page.evaluate(()=>__testAudio.time());await page.waitForTimeout(250);assert(Math.abs(await page.evaluate(()=>__testAudio.time())-pausedAt)<.02);
  await page.locator('#resume').click();await page.waitForFunction(()=>document.getElementById('pause').hidden===false);
  // Test touch/multi-pointer chords and release cancellation through the actual pad handlers.
  await page.evaluate(()=>{const pads=document.querySelectorAll('[data-lane]');for(const [i,p]of [...pads].entries()){p.setPointerCapture=()=>{};if(i<2)p.dispatchEvent(new PointerEvent('pointerdown',{pointerId:i+5,bubbles:true}));}});
  assert.equal(await page.locator('.pads button.active').count(),2);
  await page.locator('[data-lane="0"]').dispatchEvent('pointercancel',{pointerId:5});assert.equal(await page.locator('.pads button.active').count(),1);
  await page.locator('[data-lane="1"]').dispatchEvent('pointerup',{pointerId:6});assert.equal(await page.locator('.pads button.active').count(),0);
  await page.screenshot({path:out+'/mobile-play.png'});
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert(await page.locator('#pauseOverlay').isVisible());
  await page.locator('#endRun').click();assert.match(await page.locator('#finishLabel').innerText(),/EARLY/);assert.match(await page.locator('#saveStatus').innerText(),/Free practice/);
  await page.locator('#back').click();await page.setViewportSize({width:1366,height:900});
  console.log('PASS practice, settings persistence, four viewport widths, touch chords, cancellation, pause/resume, and partial results');
  let coins=0,scores=0,payouts=0,failScore=true,deny=true,postedScore=null;
  await page.route('**/pulse-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><style>html,body{margin:0;height:100%;background:#090d16}iframe{width:100%;height:100%;border:0}</style><iframe id="game" src="/games/midway-pulse.html" allow="autoplay"></iframe><script>${bundle.outputFiles[0].text}</script><script>const frame=document.getElementById('game');const bridge=createPulseBridge({slug:'pulse',fetcher:fetch,onBalance:()=>{},onFinished:()=>{window.finished=(window.finished||0)+1},reply:m=>frame.contentWindow.postMessage(m,location.origin)});window.addEventListener('message',e=>{if(e.source===frame.contentWindow&&e.origin===location.origin)bridge.handle(e.data)});</script>`}));
  await page.route('**/api/arcade/coin',async route=>{
    coins++;assert.equal(route.request().postDataJSON().slug,'pulse');assert.equal(route.request().postDataJSON().chartId,deny?'neon-current-arcade':'terminal-velocity-overdrive');await new Promise(r=>setTimeout(r,1100));
    await route.fulfill({status:deny?400:200,contentType:'application/json',body:JSON.stringify(deny?{error:'Not enough XP'}:{playId:'pulse-browser-run',balance:50,costXp:10})});
  });
  await page.route('**/api/arcade/score',route=>{scores++;postedScore=route.request().postDataJSON();return route.fulfill({status:failScore?503:200,contentType:'application/json',body:JSON.stringify(failScore?{error:'Temporary save error'}:{ok:true,score:postedScore.score,finished:true})});});
  await page.route('**/api/arcade/payout',route=>{payouts++;return route.fulfill({json:{xp:0}});});
  await page.goto(base+'/pulse-test');const game=page.frameLocator('#game');await game.locator('#ranked').waitFor();
  await game.locator('#ranked').click();await game.locator('#status').filter({hasText:'Not enough XP'}).waitFor();
  assert(await game.locator('#practice').isEnabled());deny=false;
  await game.locator('#song').selectOption('terminal-velocity');await game.locator('[data-difficulty="overdrive"]').click();await game.locator('#ranked').click();
  assert(await game.locator('#ranked').isDisabled());
  await game.locator('#livePanel').waitFor();assert.equal(await game.locator('#modeBadge').innerText(),'RANKED · OVERDRIVE');
  const frame=page.frames().find(f=>f.url().includes('midway-pulse'));
  // A same-document impostor cannot forge the parent's save/credit replies.
  await frame.evaluate(()=>window.postMessage({protocol:2,type:'arcade:coinAccepted',requestId:'wrong',playId:'forged'},location.origin));
  await frame.evaluate(()=>{
    const actions=PulseEngine.makeChart('overdrive','terminal-velocity').flatMap(n=>[{t:n.time,l:n.lane,down:true},{t:n.time+n.duration+(n.duration ? .005 : .035),l:n.lane,down:false}]).sort((a,b)=>a.t-b.t||Number(a.down)-Number(b.down));
    let index=0;window.__rms=[];window.__inputDelays=[];
    window.__playTimer=setInterval(()=>{
      if(document.body.dataset.screen!=='playing')return;
      const t=__testAudio.time();
      while(index<actions.length&&actions[index].t<=t){const a=actions[index++];if(a.down)__inputDelays.push(t-a.t);document.dispatchEvent(new KeyboardEvent(a.down?'keydown':'keyup',{code:['KeyS','KeyD','KeyF','KeyJ','KeyK','KeyL'][a.l],bubbles:true}));}
      if(Math.floor(t*10)%10===0){const buffer=new Float32Array(1024);__testAudio.analyser.getFloatTimeDomainData(buffer);window.__rms.push(Math.sqrt(buffer.reduce((s,x)=>s+x*x,0)/buffer.length));}
    },5);
  });
  await page.waitForTimeout(6500);await page.screenshot({path:out+'/desktop-play.png'});
  console.log('Playing the full 81-second ranked track against the real bridge; original audio is running.');
  await game.locator('#resultPanel').waitFor({timeout:85000});
  const finalScore=Number((await game.locator('#finalScore').innerText()).replaceAll(',',''));
  const timing=await frame.evaluate(()=>({maxInputDelay:Math.max(...__inputDelays),delayedInputs:__inputDelays.filter(n=>n>.05).length,perfect:document.getElementById('perfectCount').textContent,great:document.getElementById('greatCount').textContent,good:document.getElementById('goodCount').textContent,miss:document.getElementById('missCount').textContent}));
  console.log('Real-time timing evidence',JSON.stringify({finalScore,...timing}));
  await page.screenshot({path:out+'/ranked-before-save.png'});
  assert(finalScore>980000,`real-time timing score ${finalScore}`);assert.match(await game.locator('#saveStatus').innerText(),/Temporary save error/);
  assert(await game.locator('#again').isDisabled());failScore=false;await game.locator('#retrySave').click();
  await game.locator('#saveStatus').filter({hasText:'Score saved to the Midway leaderboard.'}).waitFor();
  assert(await game.locator('#again').isEnabled());assert.equal(coins,2);assert.equal(scores,2);assert.equal(payouts,0);assert.equal(postedScore.playId,'pulse-browser-run');assert.equal(postedScore.final,true);
  assert.equal(await page.evaluate(()=>window.finished),1);
  const audio=await frame.evaluate(()=>({samples:__rms.length,peak:Math.max(...__rms),audible:__rms.filter(n=>n>.005).length}));assert(audio.audible>20,'soundtrack has measurable audio throughout the run');
  await page.screenshot({path:out+'/ranked-results.png'});
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({finalScore,coins,scores,payouts,audio,timing,errors},null,2));
  console.log('PASS full ranked chart, music output, selected six-key difficulty, credit denial, delayed acceptance, acknowledged save/retry, no XP payout, no browser errors',JSON.stringify({finalScore,audio}));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
