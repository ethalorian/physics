const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const M=require('../public/games/tape-workshop/measure.js');
(async()=>{
 let browser;const root=path.resolve(__dirname,'../public/games/tape-workshop');
 const server=http.createServer((req,res)=>{const p=path.join(root,req.url==='/'?'index.html':req.url);if(!p.startsWith(root)||!fs.existsSync(p)){res.statusCode=404;return res.end();}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));});
 try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1200,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.locator('#answer').fill('3 2/4');await page.locator('#check').click();assert.match(await page.locator('#feedback').innerText(),/Extend/);
 await page.locator('#extend').click();await page.locator('#check').click();await page.getByRole('button',{name:'1/2',exact:true}).click();assert.match(await page.locator('#explanation').innerText(),/2\/4 = 1\/2 = 0.5/);
 assert.equal(await page.locator('#score').innerText(),'15 pts');await page.waitForTimeout(600);await page.screenshot({path:'/private/tmp/tape-workshop-desktop.png',fullPage:true});
 for(const d of [2,4,8,16,10]){
 await page.locator('#precision').selectOption(String(d));await page.locator('#restart').click();
 for(let r=0;r<8;r++){
 await page.locator('#extend').click();
 const edge=await page.locator('#edge').getAttribute('d');const value=(Number(edge.match(/M([\d.]+)/)[1])-70)/110;const ticks=Math.round(value*d),n=ticks%d;
 if(r===0){await page.locator('#answer').fill('1/0');await page.locator('#check').click();assert.match(await page.locator('#feedback').innerText(),/nonzero/);}
 await page.locator('#answer').fill(r%2?String(ticks/d):`${Math.floor(ticks/d)} ${n}/${d}`);await page.locator('#check').click();
 const target=r%2?String(n/d):M.fraction(n,d);await page.locator('#choices').getByRole('button',{name:target,exact:true}).click();await page.locator('#next').click();
 }
 assert.equal(await page.locator('#score').innerText(),'120 pts');assert.match(await page.locator('#answerHint').innerText(),/8\/8 readings and 8\/8 matches/);
 }
 await page.locator('#precision').selectOption('16');await page.locator('#format').selectOption('fraction');await page.locator('#extend').click();await page.locator('#answer').fill('1/4');await page.locator('#check').click();await page.locator('#check').click();assert.match(await page.locator('#feedback').innerText(),/count 8 spaces/);
 await page.locator('#answer').fill('3 8/16');await page.locator('#check').click();await page.locator('#choices button').filter({hasText:'9/16'}).click();await page.getByRole('button',{name:'1/2',exact:true}).click();assert.equal(await page.locator('#score').innerText(),'0 pts');
 await page.locator('#restart').click();await page.setViewportSize({width:390,height:844});await page.locator('#extend').click();assert.equal(await page.locator('#zoom').isVisible(),true);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.waitForTimeout(600);await page.screenshot({path:'/private/tmp/tape-workshop-mobile.png',fullPage:true});
 await page.locator('#retract').click();assert.equal(await page.locator('#zoom').isVisible(),false);
 await page.locator('#extension').focus();await page.keyboard.press('End');assert.equal(await page.locator('#extension').inputValue(),'7');
 await page.waitForTimeout(600);const box=await page.locator('#case').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x-100,box.y+box.height/2,{steps:10});await page.mouse.up();assert(Number(await page.locator('#extension').inputValue())<7);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#case').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 assert.deepEqual(errors,[]);console.log('PASS five precisions × eight rounds; equivalent input; extension gate; errors/retries; scoring; reset; mobile fit; keyboard; reduced motion; no browser errors');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
