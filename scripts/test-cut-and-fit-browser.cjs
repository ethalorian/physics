const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { createServer } = require('./preview-cut-and-fit.cjs');
const M = require('../public/games/cut-and-fit/math.js');
const out = '/private/tmp/cut-and-fit-verification';
let browser, server;
(async () => {
  fs.mkdirSync(out, { recursive:true });
  server = createServer();
  await new Promise((resolve, reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel:'chrome', headless:true });
  const page = await browser.newPage({ viewport:{ width:1440,height:1150 }, reducedMotion:'reduce' });
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', req => requests.push(req.url()));
  await page.goto(base);
  const mark = async text => { await page.locator('#length').fill(text); await page.locator('#markButton').click(); };
  const cut = async text => { await mark(text); await page.locator('#cutButton').click(); };
  await page.locator('#jobTitle').waitFor();
  assert.equal(await page.locator('#orderCount').innerText(),'ORDER 1 / 12');
  assert(await page.locator('#cutButton').isDisabled());
  await page.locator('#expandDrawing').click();
  assert(await page.getByRole('dialog').isVisible());
  assert.equal(await page.locator('#expandedDrawing .bp-detail').count(),2);
  const allIds = await page.locator('[id]').evaluateAll(nodes => nodes.map(n=>n.id));
  assert.equal(new Set(allIds).size,allIds.length,'inline and expanded drawing IDs are unique');
  await page.screenshot({ path:out+'/blueprint-expanded.png',fullPage:true });
  await page.keyboard.press('Escape');
  assert(await page.getByRole('dialog').isHidden());
  assert.equal(await page.evaluate(()=>document.activeElement.id),'expandDrawing','closing restores keyboard focus');
  await page.screenshot({ path:out+'/desktop.png',fullPage:true });
  for (const invalid of ['1/0','18.1','0']) {
    await mark(invalid); assert(await page.locator('#feedback').isVisible()); assert(await page.locator('#cutButton').isDisabled());
  }
  await mark('25'); assert.match(await page.locator('#feedback').innerText(),/off the stock/);
  await mark('20'); await page.locator('#length').fill('21');
  assert(await page.locator('#cutButton').isDisabled(),'editing plan invalidates old mark');
  await mark('20'); await page.locator('#pointer').focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#markValue').innerText(),'20 1/16 in');
  await page.keyboard.press('ArrowLeft'); assert.equal(await page.locator('#length').inputValue(),'20');
  // A long cut can be trimmed without taking material from the remaining stock again.
  const originalDrawing = await page.locator('#blueprintSheet').innerHTML();
  await cut('20 1/2'); assert.match(await page.locator('#feedback').innerText(),/Too long by 1\/2 in/);
  assert.equal(await page.locator('#blueprintSheet').innerHTML(),originalDrawing,'failed cuts do not alter the job specification');
  assert.match(await page.locator('#fitInspection').innerText(),/Too long by 1\/2 in/);
  const remainder = await page.locator('#remaining').innerText();
  await page.screenshot({path:out+'/long-piece.png',fullPage:true});
  await page.locator('#trim').click(); await mark('21');
  assert.match(await page.locator('#feedback').innerText(),/cannot make this piece longer/);
  await cut('20'); assert.match(await page.locator('#feedback').innerText(),/A clean fit/);
  assert.equal(await page.locator('#remaining').innerText(),remainder);
  assert.equal(await page.locator('#score').innerText(),'5 points');
  await page.locator('#cutButton').evaluate(el => el.click());
  assert.equal(await page.locator('#score').innerText(),'5 points','duplicate cut cannot score');
  // A short piece requires replacement; insufficient remainder is clearly handled.
  await page.locator('[data-trade="carpentry"]').click(); await cut('19');
  assert.match(await page.locator('#feedback').innerText(),/Too short by 1 in/);
  assert(await page.locator('#trim').isHidden());
  await page.screenshot({path:out+'/short-piece.png',fullPage:true});
  await page.locator('#replace').click(); await mark('20');
  assert.match(await page.locator('#feedback').innerText(),/off the stock/);
  await page.locator('#newStock').click(); assert.equal(await page.locator('#stockUsed').innerText(),'2');
  await cut('20'); assert.equal(await page.locator('#score').innerText(),'5 points');
  // Hints give the correct addition for insertion, and count as coached work.
  await page.locator('[data-trade="plumbing"]').click();
  await page.locator('#hint').click(); assert.match(await page.locator('#hintText').innerText(),/Add the left/);
  await page.locator('#hint').click(); assert.match(await page.locator('#hintText').innerText(),/12 1\/2 \+ 1\/2 \+ 1\/2 = 13 1\/2/);
  await cut('13.5'); assert.equal(await page.locator('#score').innerText(),'5 points');
  await page.screenshot({path:out+'/plumbing-fit.png',fullPage:true});
  // Complete all twelve jobs and all fifteen parts through real UI actions.
  await page.locator('[data-trade="all"]').click();
  for (let i = 0; i < M.jobs.length; i++) {
    const j = M.jobs[i];
    assert.equal(await page.locator('#jobTitle').innerText(),j.title);
    assert.equal(await page.locator('#blueprintSheet .bp-detail').count(),2);
    assert.match(await page.locator('#blueprintSheet .bp-main-svg').getAttribute('aria-label'),new RegExp(M.format(j.span).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    const overflowing = await page.locator('#blueprintSheet svg').evaluateAll(svgs => svgs.flatMap(svg => [...svg.querySelectorAll('text')].filter(text => { const b=text.getBBox();return b.x < -1 || b.y < -1 || b.x+b.width > svg.viewBox.baseVal.width+1 || b.y+b.height > svg.viewBox.baseVal.height+1; }).map(text=>text.textContent)));
    assert.deepEqual(overflowing,[],`${j.id}: drawing labels remain inside their views`);
    await page.locator('#blueprintSheet').screenshot({path:out+`/blueprint-${j.id}.png`});
    let stock = j.stock;
    for (let p = 0; p < j.quantity; p++) {
      await cut(M.format(M.target(j)));
      stock = M.cut(stock,M.target(j),j.kerf).remainder;
      assert.equal(await page.locator('#remaining').innerText(),M.format(stock)+' in',`${j.id} preserves stock`);
      if (p < j.quantity-1) { assert(await page.locator('#next').isHidden()); await page.locator('#nextPiece').click(); }
    }
    assert.equal(await page.locator('#score').innerText(),`${(i+1)*10} points`);
    if (j.id === 'e4') await page.screenshot({path:out+'/electrical-fit.png',fullPage:true});
    await page.locator('#next').click();
  }
  assert(await page.locator('#report').isVisible());
  assert.match(await page.locator('#reportIntro').innerText(),/15 pieces across 12 work orders/);
  assert.equal(await page.locator('#reportJobs article').count(),12);
  assert(await page.locator('#retryHelped').isHidden());
  assert.match(await page.locator('#reportStats').innerText(),/120 \/ 120/);
  await page.screenshot({path:out+'/report.png',fullPage:true});
  await page.locator('#another').click(); assert.match(await page.locator('#dimensions').innerText(),/20 3\/4/);
  // Report can select only coached jobs for another attempt.
  await page.locator('[data-trade="electrical"]').click();
  for (const [i,j] of M.makeSet('electrical').entries()) {
    if (i === 0) await page.locator('#hint').click();
    for (let p=0;p<j.quantity;p++) { await cut(M.format(M.target(j))); if(p<j.quantity-1)await page.locator('#nextPiece').click(); }
    await page.locator('#next').click();
  }
  await page.locator('#retryHelped').click();
  assert.equal(await page.locator('#orderCount').innerText(),'ORDER 1 / 1');
  assert.equal(await page.locator('#jobTitle').innerText(),'Connect the boxes');
  assert.equal(await page.locator('#score').innerText(),'0 points');
  // Mobile bench switching, marking, cutting, and recovery remain reachable.
  for (const width of [1366,1024,768,390,320]) {
    await page.setViewportSize({width,height:width === 1366 ? 768 : 900});
    await page.locator('[data-trade="carpentry"]').click();
    await page.locator('#restart').click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No overflow at ${width}`);
    if(width===390) {
      await page.locator('#expandDrawing').click();
      assert(await page.getByRole('dialog').isVisible());
      assert(await page.locator('#expandedDrawing .bp-main-scroll').evaluate(el=>el.scrollWidth>el.clientWidth),'mobile assembly is readable and horizontally scrollable');
      await page.locator('#closeDrawing').click();
    }
    await mark('21');
    await page.screenshot({path:out+`/width-${width}.png`,fullPage:true});
    await page.locator('#cutButton').click();
    assert(await page.locator('#feedback').isVisible());
  }
  assert.deepEqual(errors,[]);
  assert(!requests.some(url => new URL(url).pathname.startsWith('/api/')),'no student/XP requests');
  console.log('PASS: 12 jobs / 15 parts; correct and incorrect cuts; trim, replace, fresh stock, kerf, duplicate-cut guard, stale-mark guard, hints, all trade tabs, new variants, coached-job review, keyboard ruler, and 320–1440px layouts. No browser errors or API calls.');
  console.log('Screenshots:',out);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
