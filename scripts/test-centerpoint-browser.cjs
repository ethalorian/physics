const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createServer}=require('./preview-centerpoint.cjs');
const M=require('../public/games/centerpoint/math.js');
const out='/private/tmp/centerpoint-verification';
let browser,server;
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.goto(base);
 const place=async(x,y)=>{await page.locator('#xInput').fill(x);if(y!==undefined)await page.locator('#yInput').fill(y);await page.locator('#placeButton').click();};
 const answer=async j=>{const t=M.target(j);await place(M.format(t.x),t.y===null?undefined:M.format(t.y));await page.locator('#checkButton').click();};
 assert.equal(await page.locator('#orderCount').innerText(),'JOB 1 / 12');assert(await page.locator('#checkButton').isDisabled());
 await page.locator('#howButton').click();assert(await page.locator('#howDialog').isVisible());await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'howButton');
 for(const s of ['1/0','1/64','4.1','19']){await place(s);assert(await page.locator('#feedback').isVisible());assert(await page.locator('#checkButton').isDisabled());}
 await place('9');await page.locator('#xInput').fill('8');assert(await page.locator('#checkButton').isDisabled(),'editing invalidates the old mark');await page.locator('#placeButton').click();await page.locator('#checkButton').click();
 assert.match(await page.locator('#feedback').innerText(),/Move right by 1 in/);assert.match(await page.locator('#inspection').innerText(),/8 in/);assert.match(await page.locator('#inspection').innerText(),/10 in/);
 await page.screenshot({path:out+'/incorrect-mark.png',fullPage:true});
 await place('9');await page.locator('#markingArea').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#xInput').inputValue(),'9 1/32');assert.equal(await page.evaluate(()=>document.activeElement.id),'markingArea');await page.keyboard.press('ArrowLeft');await page.locator('#checkButton').click();assert.match(await page.locator('#feedback').innerText(),/Right on center/);assert.equal(await page.locator('#score').innerText(),'5 points');
 await page.locator('#checkButton').evaluate(el=>el.click());assert.equal(await page.locator('#score').innerText(),'5 points','duplicate check cannot award points');assert(await page.locator('#xInput').isDisabled());
 await page.locator('[data-bench="length"]').click();const material=await page.locator('[data-material]').boundingBox();await page.mouse.click(material.x+material.width/4,material.y+material.height/2);assert(Math.abs(M.parse(await page.locator('#xInput').inputValue()).ticks-144)<=1,'tap position is within one ruler division after browser pixel rounding');
 await page.locator('[data-bench="face"]').click();await place('6');assert.match(await page.locator('#feedback').innerText(),/Y:/);await place('6','3');await page.locator('#checkButton').click();assert.match(await page.locator('#feedback').innerText(),/Move down by 1 in/);assert.equal(await page.locator('.balance-row').count(),2);assert(await page.locator('#nextButton').isHidden());
 await page.locator('#expandDrawing').click();assert(await page.locator('#drawingDialog').isVisible());const ids=await page.locator('[id]').evaluateAll(els=>els.map(e=>e.id));assert.equal(new Set(ids).size,ids.length);await page.screenshot({path:out+'/expanded-face.png',fullPage:true});await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'expandDrawing');
 await page.locator('[data-bench="marks"]').click();await place('8');await page.locator('#checkButton').click();assert.match(await page.locator('#feedback').innerText(),/Move right by 3 in/);await page.locator('#hintButton').click();await page.locator('#hintButton').click();assert.match(await page.locator('#hintText').innerText(),/3 \+ \(19 − 3\) ÷ 2 = 11/);assert(await page.locator('#hintButton').isDisabled());
 await page.locator('[data-bench="all"]').click();
 for(const [i,j]of M.jobs.entries()){
  assert.equal(await page.locator('#jobTitle').innerText(),j.title);
  const overflow=await page.locator('#drawing svg').evaluate(svg=>[...svg.querySelectorAll('text')].filter(t=>{const b=t.getBBox(),m=svg.getCTM().inverse().multiply(t.getCTM());return [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].some(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(m);return p.x<0||p.x>svg.viewBox.baseVal.width||p.y<0||p.y>svg.viewBox.baseVal.height;});}).map(t=>t.textContent));
  assert.deepEqual(overflow,[],j.id+' labels stay in drawing');
  await answer(j);assert.match(await page.locator('#feedback').innerText(),/Right on center/);assert.equal(await page.locator('#score').innerText(),(i+1)*10+' points');
  if(['l1','f1','f4','m4'].includes(j.id))await page.screenshot({path:out+'/'+j.id+'.png',fullPage:true});
  await page.locator('#nextButton').click();
 }
 assert(await page.locator('#report').isVisible());assert.match(await page.locator('#reportSummary').innerText(),/120 \/ 120/);assert.equal(await page.locator('#reportJobs article').count(),12);assert(await page.locator('#retry').isHidden());await page.screenshot({path:out+'/report.png',fullPage:true});
 await page.locator('#again').click();assert.match(await page.locator('#dimensions').innerText(),/18 1\/4/);
 await page.locator('[data-bench="face"]').click();
 for(const [i,j]of M.makeSet('face').entries()){if(i===0)await page.locator('#hintButton').click();await answer(j);await page.locator('#nextButton').click();}
 assert.match(await page.locator('#reportSummary').innerText(),/35 \/ 40/);await page.locator('#retry').click();assert.equal(await page.locator('#orderCount').innerText(),'JOB 1 / 1');assert.equal(await page.locator('#score').innerText(),'0 points');await answer(M.jobs[4]);await page.locator('#nextButton').click();assert.match(await page.locator('#reportSummary').innerText(),/10 \/ 10/);
 for(const width of [1440,1366,1024,768,390,320]){
  await page.setViewportSize({width,height:width===1366?768:950});await page.locator('[data-bench="face"]').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow at '+width);
  if(width===390){await page.locator('#expandDrawing').click();assert(await page.locator('#expandedDrawing').evaluate(el=>el.scrollWidth>el.clientWidth));await page.locator('#closeDrawing').click();}
  await answer(M.jobs[4]);assert.match(await page.locator('#feedback').innerText(),/Right on center/);await page.screenshot({path:out+'/width-'+width+'.png',fullPage:true});
 }
 assert.deepEqual(errors,[]);assert(!requests.some(u=>new URL(u).pathname.startsWith('/api/')),'game makes no API requests');
 console.log('PASS: all 12 jobs, exact one/two-axis marking, reference offsets, pointer and keyboard, correction feedback, hints, no stale/duplicate checks, reports and targeted retry, new dimensions, readable SVGs/dialogs, 320–1440px layouts. No browser errors or API calls.');console.log('Screenshots:',out);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close();});
