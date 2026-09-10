// Capture real standalone practice games. This server cannot read or write student data.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public/arcade/previews');
const raw = '/private/tmp/arcade-preview-captures';
const files = fs.readdirSync(path.join(root, 'public/games')).filter(f => f.endsWith('.html') && !f.includes('highnoon')).map(f => '/games/' + f);
files.push('/games/tape-workshop/index.html');
let server, browser;
(async () => {
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(raw, { recursive: true });
  server = http.createServer((req, res) => {
    const file = path.resolve(root, 'public', '.' + new URL(req.url, 'http://local').pathname);
    if (!file.startsWith(path.join(root, 'public/games/'))) { res.writeHead(404); return res.end(); }
    try { res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const manifest = {};
  for (const srcPath of files) {
    const name = srcPath.includes('tape-workshop') ? 'tape-workshop' : path.basename(srcPath, '.html');
    if (process.env.PREVIEW_ONLY && !process.env.PREVIEW_ONLY.split(',').includes(name)) continue;
    const page = await browser.newPage({ viewport: { width: 1000, height: 650 }, deviceScaleFactor: 1 });
    // No API requests, external fonts, or trackers: only local game assets.
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}${srcPath}`);
    let capture = page.locator('canvas').first();
    if (await page.locator('#startOv').count()) {
      await page.locator('#startOv .bigbtn').first().click();
      await page.locator('#startOv').waitFor({ state: 'hidden' });
      await page.waitForTimeout(1100);
      if (await page.locator('#card').count()) await page.waitForFunction(() => parseFloat(document.getElementById('card').style.top) > 40, null, {timeout:10000});
      if (name === 'equivalence-fusion') for (const key of ['ArrowLeft','ArrowDown','ArrowRight','ArrowDown','ArrowLeft','ArrowUp']) { await page.keyboard.press(key); await page.waitForTimeout(180); }
      if (name === 'daily-mathle') { await page.keyboard.type('12+34=46'); await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
      capture = page.locator(await page.locator('#card').count() ? '#wrap' : name === 'daily-mathle' ? '#gridWrap' : '#board');
    } else if (await page.locator('[onclick="select_()"]:visible').count()) {
      await page.locator('[onclick="select_()"]:visible').first().click();
      await page.locator('.actcard:not(.locked)').first().click();
      await page.locator('[onclick="launch()"]:visible').click();
      await page.waitForTimeout(350);
    } else if (srcPath.includes('rotation-')) {
      await page.locator('#start').click();
      await page.locator(name === 'rotation-tether' ? '#ready' : '#launch').click();
      await page.locator('#overlay').waitFor({state:'hidden'});
      if (name === 'rotation-tether') { await page.keyboard.down('Space'); await page.waitForTimeout(450); }
      else { await page.keyboard.down('ArrowRight'); await page.waitForTimeout(450); }
    } else if (name === 'tape-workshop') {
      await page.locator('#exploreTab').click();
      capture = page.locator('#exploreScale');
    } else {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      if (name === 'kinematics-redline') {
        await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
        await page.keyboard.down('ArrowRight'); await page.waitForTimeout(900);
      }
      if (name === 'midway-stack') {
        for(let i=0;i<7;i++) {
          await page.waitForFunction(() => state.screen !== 'play' || Math.abs(state.mover.pos-state.base[state.mover.axis])<0.2, null, {timeout:12000}).catch(()=>{});
          await page.keyboard.press('Space');await page.waitForTimeout(100);
        }
      }
    }
    await page.waitForTimeout(100);
    const png = await capture.screenshot({ animations: 'disabled' });
    fs.writeFileSync(path.join(raw, name + '.png'), png);
    await sharp(png).resize(720, 450, { fit: 'contain', background: '#0b1420' }).webp({ quality: 85 }).toFile(path.join(output, name + '.webp'));
    manifest[srcPath] = '/arcade/previews/' + name + '.webp';
    fs.writeFileSync(path.join(root, 'src/components/arcade/game-previews.json'), JSON.stringify({ ...(fs.existsSync(path.join(root, 'src/components/arcade/game-previews.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'src/components/arcade/game-previews.json'))) : {}), ...manifest }, null, 2) + '\n');
    console.log('Captured', name);
    await page.close();
  }
  const manifestPath = path.join(root, 'src/components/arcade/game-previews.json');
  const existing = process.env.PREVIEW_ONLY && fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath)) : {};
  fs.writeFileSync(manifestPath, JSON.stringify({ ...existing, ...manifest }, null, 2) + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); server?.close(); });
