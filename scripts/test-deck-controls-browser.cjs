const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const repo = process.cwd();
(async () => {
  const { outputFiles } = await require('esbuild').build({
    stdin: { contents: `import * as bridge from './src/lib/present-bridge'; import {deckSlidesFromHtml} from './src/lib/classroom-command'; Object.assign(window,{bridge,deckSlidesFromHtml});`, resolveDir: repo, loader: 'ts' },
    bundle: true, write: false, format: 'iife',
  });
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/bridge.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(outputFiles[0].text); return; }
    if (pathname === '/') { res.end('<!doctype html><html><body>Deck verification</body></html>'); return; }
    const file = path.resolve(repo, 'public', '.' + pathname);
    if (!file.startsWith(path.join(repo, 'public') + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', /\.(js|jsx)$/.test(file) ? 'application/javascript' : 'text/html'); res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
    const page = await browser.newPage();
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base); await page.addScriptTag({url: base + '/bridge.js'});
    const files = ['unit-1','classroom'].flatMap(dir => fs.readdirSync(path.join(repo, 'public/decks',dir)).filter(f=>f.endsWith('.html')&&!f.startsWith('Unit ')).map(f=>dir+'/'+f));
    const metadata = new Map();
    for (const file of files) {
      const html = fs.readFileSync(path.join(repo, 'public/decks', file), 'utf8');
      const slides = await page.evaluate(html => window.deckSlidesFromHtml(html), html);
      assert.ok(slides.length > 1, file + ': slide metadata available'); metadata.set(file, slides);
    }
    for (const file of ['unit-1/Day 2 - Motion Vocabulary.dc.html', 'unit-1/Day 3 - Graphs as Claims.dc.html', 'classroom/U1 Day 2 - Talking About Motion.dc.html', 'classroom/U1 Day 5 - The First Prediction.dc.html', 'classroom/U2 Day 4 - Universal Gravitation.dc.html']) {
      await page.goto(base + '/decks/' + file.split('/').map(encodeURIComponent).join('/'));
      await page.locator('deck-stage').waitFor({timeout: 30000});
      await page.addScriptTag({url: base + '/bridge.js'});
      await page.waitForFunction(() => window.bridge.readDeck(window)?.total > 1);
      const snapshot = await page.evaluate(() => window.bridge.readDeck(window));
      assert.equal(snapshot.total, metadata.get(file).length, file + ': runtime and iPad slide counts match');
      assert.deepEqual(snapshot.slides.map(s => s.label), metadata.get(file).map(s => s.label));
      await page.evaluate(() => window.bridge.deckGo(window, 1));
      await page.waitForFunction(() => window.bridge.readDeck(window)?.index === 1);
      await page.evaluate(() => window.bridge.deckNext(window));
      await page.waitForFunction(() => window.bridge.readDeck(window)?.index === 2);
      await page.evaluate(() => window.bridge.deckPrev(window));
      await page.waitForFunction(() => window.bridge.readDeck(window)?.index === 1);
      console.log('PASS real deck:', file, snapshot.total, 'slides; titles, notes, jump/next/previous');
    }
    console.log('PASS metadata for', files.length, 'actual exported and imported decks; no exported bundles modified.');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
