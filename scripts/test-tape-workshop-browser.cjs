const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const M = require('../public/games/tape-workshop/measure.js');
(async () => {
  let browser;
  const root = path.resolve(__dirname, '../public/games/tape-workshop');
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const p = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!p.startsWith(root + path.sep) || !fs.existsSync(p)) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(fs.readFileSync(p));
  });
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { Math.random = () => .375; });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    async function range(id, value) {
      await page.locator(id).evaluate((element, value) => { element.value = value; element.dispatchEvent(new Event('input', { bubbles: true })); }, String(value));
    }
    async function solve(job, notation = 'mixed') {
      if (job.type === 'setup' && await page.locator('#lockAlignment').isEnabled()) { await range('#alignment', 0); await page.locator('#lockAlignment').click(); }
      if (!['scale', 'locate', 'equivalent'].includes(job.type) && job.family === 'fraction' && job.toolKey !== 'inch-32') await page.locator('#extend').click();
      if (['locate', 'mark'].includes(job.type)) {
        await range('#pointer', job.n); await page.locator('#checkPointer').click();
      } else {
        if (job.type === 'offset') {
          await page.locator('#startReading').fill(String(job.startTicks / job.d));
          await page.locator('#endReading').fill(String(job.endTicks / job.d));
        }
        if (job.type === 'equivalent' && job.unit !== 'cm') await page.locator('#startReading').fill('1/2');
        const needsFraction = job.family === 'fraction' && !['scale', 'equivalent'].includes(job.type) && (notation === 'fraction' || notation === 'mixed' && job.index % 2 === 0);
        await page.locator('#answer').fill(needsFraction ? M.mixed(job.lengthTicks, job.d) : String(M.expected(job)));
        await page.locator('#check').click();
      }
      assert(await page.locator('#next').isVisible(), `${job.toolKey} ${job.type}: ${await page.locator('#feedback').innerText()}`);
    }
    // Actual answer for first seeded scale is 1/8; counting nine lines is the misconception.
    await page.locator('#answer').fill('1/9'); await page.locator('#check').click();
    assert.match(await page.locator('#feedback').innerText(), /counted the lines/);
    await page.locator('#answer').fill('1/0'); await page.locator('#check').click();
    assert.match(await page.locator('#feedback').innerText(), /nonzero denominator/);
    await page.locator('#answer').fill('1/8'); await page.locator('#check').click();
    assert.equal(await page.locator('#score').innerText(), '5 pts');
    await page.locator('#answerForm').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(await page.locator('#score').innerText(), '5 pts', 'duplicate submission cannot score twice');
    for (const tool of Object.keys(M.tools)) {
      await page.locator('#tool').selectOption(tool); await page.locator('#restart').click();
      for (let index = 0; index < M.sequence.length; index++) {
        const job = M.makeJob(tool, M.sequence[index], index, () => .375);
        if (tool === 'inch-2' && index === 2) {
          const hook = await page.locator('#hook').boundingBox(), scene = await page.locator('#scene').boundingBox();
          await page.mouse.move(hook.x + hook.width / 2, hook.y + hook.height / 2); await page.mouse.down();
          await page.mouse.move(hook.x + hook.width / 2 - scene.width * 50 / 1040, hook.y + hook.height / 2, { steps: 8 }); await page.mouse.up();
          assert.equal(await page.locator('#alignment').inputValue(), '0', 'dragging the hook aligns zero with the material');
        }
        if (tool === 'inch-8' && index === 2) {
          await page.locator('#answer').fill('2 3/8'); await page.locator('#check').click();
          assert.match(await page.locator('#feedback').innerText(), /Lock zero first/);
          await range('#alignment', 0); await page.locator('#lockAlignment').click();
          await page.locator('#check').click(); assert.match(await page.locator('#feedback').innerText(), /Extend/);
        }
        await solve(job);
        if (tool === 'inch-8' && index === 3) assert.match(await page.locator('#explanation').innerText(), /4\/8 = 1\/2 = 0.5/);
        if (tool === 'inch-16' && index === 6) {
          await page.waitForTimeout(500); await page.screenshot({ path: '/private/tmp/tape-workshop-offset.png', fullPage: true });
        }
        await page.locator('#next').click();
      }
      assert.equal(await page.locator('#score').innerText(), '100 pts');
      assert.match(await page.locator('#summaryText').innerText(), /10 independent · 0 completed with help/);
      assert.equal(await page.locator('#skillReport .skill-result').count(), 6);
      assert(await page.locator('#practiceWeak').isHidden());
      console.log(`PASS ${tool}: ten work orders, all six skills, exact score and report`);
    }
    // Explicit notation preferences both work across a full set.
    for (const notation of ['fraction', 'decimal']) {
      await page.locator('#tool').selectOption('inch-4'); await page.locator('#format').selectOption(notation); await page.locator('#restart').click();
      for (let index = 0; index < M.sequence.length; index++) { await solve(M.makeJob('inch-4', M.sequence[index], index, () => .375), notation); await page.locator('#next').click(); }
      assert.equal(await page.locator('#score').innerText(), '100 pts');
    }
    // Hints, alignment mistakes, and the nonzero-start misconception are coached, not independent.
    await page.locator('#tool').selectOption('inch-8'); await page.locator('#format').selectOption('mixed'); await page.locator('#restart').click();
    for (let index = 0; index < M.sequence.length; index++) {
      const job = M.makeJob('inch-8', M.sequence[index], index, () => .375);
      if (index === 0) { await page.locator('#hint').click(); assert.match(await page.locator('#feedback').innerText(), /Count spaces/); }
      if (index === 2) { await page.locator('#lockAlignment').click(); assert.match(await page.locator('#feedback').innerText(), /not aligned/); }
      if (index === 6) {
        await page.locator('#extend').click(); await page.locator('#startReading').fill('1'); await page.locator('#endReading').fill('3.375');
        await page.locator('#answer').fill('3 3/8'); await page.locator('#check').click(); assert.match(await page.locator('#feedback').innerText(), /end reading, not the length/);
      }
      await solve(job); await page.locator('#next').click();
    }
    assert.equal(await page.locator('#score').innerText(), '85 pts');
    await page.locator('#practiceWeak').click(); assert.equal(await page.locator('#round').innerText(), 'ORDER 1 / 6');
    assert.equal(await page.locator('#score').innerText(), '0 pts');
    // Explorer: tick families, equivalent bars, keyboard and a direct tap.
    await page.locator('#exploreTab').click(); await page.locator('#tool').selectOption('inch-4');
    await range('#explorePointer', 2); assert.match(await page.locator('#exploreExplanation').innerText(), /2\/4 = 1\/2 = 0.5/);
    await page.getByRole('button', { name: '1/4 marks', exact: true }).click();
    assert.match(await page.locator('#spacesLesson').innerText(), /5 boundary lines enclose 4 spaces/);
    await page.locator('#explorePointer').focus(); await page.keyboard.press('ArrowRight'); assert.equal(await page.locator('#exploreValue').innerText(), '3/4 in');
    const svgBox = await page.locator('#explorerSvg').boundingBox();
    await page.mouse.click(svgBox.x + svgBox.width * (40 + 680 / 4) / 760, svgBox.y + svgBox.height / 2);
    assert.equal(await page.locator('#exploreValue').innerText(), '1/4 in');
    await page.screenshot({ path: '/private/tmp/tape-workshop-explorer.png', fullPage: true });
    // Small phones can reach every control; independent native ranges work without dragging.
    await page.locator('#tool').selectOption('inch-16'); await page.locator('#practiceFromExplorer').click(); await page.locator('#restart').click();
    for (let index = 0; index < 6; index++) {
      const job = M.makeJob('inch-16', M.sequence[index], index, () => .375);
      if (index === 5) {
        await page.locator('#extend').click(); await page.setViewportSize({ width: 390, height: 844 });
        await page.locator('#pointer').focus(); await page.keyboard.press('Home'); for (let k = 0; k < job.n; k++) await page.keyboard.press('ArrowRight');
        assert.equal(await page.locator('#pointer').inputValue(), String(job.n));
        await page.waitForTimeout(500); await page.screenshot({ path: '/private/tmp/tape-workshop-mobile.png', fullPage: true });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.equal(await page.locator('#mobileBrief').innerText(), await page.locator('#prompt').innerText());
        assert(await page.locator('#mobileBrief').isVisible());
        await page.setViewportSize({ width: 320, height: 700 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      await solve(job); await page.locator('#next').click();
    }
    await page.setViewportSize({ width: 1360, height: 1000 });
    // Check drag of case, then reduced motion.
    await page.locator('#extend').click(); await page.waitForTimeout(500);
    const box = await page.locator('#case').boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x - 80, box.y + box.height / 2, { steps: 8 }); await page.mouse.up();
    assert(Number(await page.locator('#extension').inputValue()) < 8);
    await page.emulateMedia({ reducedMotion: 'reduce' }); assert.equal(await page.locator('#case').evaluate(e => getComputedStyle(e).transitionDuration), '0s');
    assert.deepEqual(errors, []);
    console.log('PASS notation modes, misconception feedback, duplicate guard, coached scoring, targeted replay, explorer, direct tap, keyboard, 390/320px layouts, drag and reduced motion; no browser errors');
  } finally {
    await browser?.close(); if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
