const fs = require('node:fs'), http = require('node:http'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), pkg = name => require(path.join(root, 'node_modules', name));
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = '/private/tmp/student-banner-browser'; fs.mkdirSync(out, { recursive: true });
let browser, server, mode = 'vocabulary';
const requests = [];

(async () => {
  await pkg('esbuild').build({
    stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Home from './src/app/home/page';createRoot(document.getElementById('root')).render(<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"><Home/></main>);`, resolveDir: root, loader: 'tsx' },
    bundle: true, format: 'esm', jsx: 'automatic', outfile: out + '/app.js', define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'fixture', setup(build) {
      const mocks = {
        'next/link': `import React from 'react';export default function Link({prefetch,...props}){return React.createElement('a',props)}`,
        'next-auth/react': `export const useSession=()=>({data:{user:{name:'Alex',role:'student'}},status:'authenticated'});`,
      };
      build.onResolve({ filter: /.*/ }, args => mocks[args.path] ? { path: args.path, namespace: 'fixture' } : undefined);
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: mocks[args.path], loader: 'tsx', resolveDir: root }));
    } }],
  });
  const css = await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({ base: root })]).process(fs.readFileSync(root + '/src/app/globals.css', 'utf8'), { from: root + '/src/app/globals.css' });
  fs.writeFileSync(out + '/style.css', css.css + '\n' + fs.readFileSync(out + '/app.css', 'utf8'));
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://local'); requests.push(url.pathname);
    const json = (data, status = 200) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
    if (url.pathname === '/api/me/enrollment') return json({ enrolled: true, isStudent: true });
    if (url.pathname === '/api/home') return json({ student: { name: mode === 'long' ? 'Alexanderthelongeststudentname' : 'Alex' }, points: { xp: mode === 'long' ? 1234567 : 240, balance: mode === 'long' ? 987654 : 180 }, streak: { current: 3 }, continue: null, homework: [], retry: [] });
    if (url.pathname === '/api/avatar/me') return json({ setup_completed: true, traits: { skin: 'tan', hair_style: 'curls', hair_color: 'dark_brown', shirt_color: 'teal', mouth: 'grin' }, equipped: {}, equipped_items: [] });
    if (url.pathname === '/api/me/classes') return json({ classes: [{ id: 'class1', name: 'Physics Section B', section: 'Period 2', track: 'cpa', program: 'physics', teacher: 'Teacher Example' }] });
    if (url.pathname === '/api/readings') return mode === 'error' ? json({}, 503) : json({ staff: false, courses: [], assignments: ['assignment', 'long'].includes(mode) ? [{ id: 'r1', title: mode === 'long' ? 'A very long assignment about interpreting motion and comparing position, velocity, and acceleration graphs' : 'Investigating motion', status: 'published', due_at: '2026-10-24T03:59:00Z' }] : [], work: [] });
    if (url.pathname === '/api/quizzes') return json({ staff: false, courses: [], quizzes: ['quiz', 'vocabulary'].includes(mode) ? [{ id: 'q1', title: mode === 'quiz' ? 'Position–time graphs' : 'Motion vocabulary', kind: mode === 'quiz' ? 'understanding' : 'vocabulary', status: 'published', due_at: mode === 'quiz' ? '2026-10-22T03:59:00Z' : '2026-10-23T03:59:00Z' }] : [], locked: [], work: [], reviews: [] });
    if (url.pathname === '/api/vocab/tasks') return json({ tasks: [] });
    if (url.pathname === '/api/math-spine/daily') return json({ item: { competencyId: 'gv1', competencyCode: 'GV1', competencyStatement: 'Slope as a rate of change' }, alreadySubmitted: ['done', 'error', 'assignment', 'long'].includes(mode) });
    if (url.pathname === '/api/math-spine/dashboard') return json({ competencies: [], records: [], focus: [] });
    if (url.pathname === '/api/home/pace') return json({ today: '2026-10-22', dates: [], activeDays: 0, engagement: null, learningXp: 0, xpRate: null, ready: false, calendarReady: true, noSchoolDates: [], warmups: [], historical: { dates: [], activeDays: 0, engagement: null, learningXp: 0, xpRate: null } });
    if (url.pathname === '/api/feedback') return json({ feedback: [{ id: 'f1', teacher_email: 'teacher@example.test', message: 'Your graph labels are clear. Next, explain what the slope tells you.', created_at: '2026-10-21T16:00:00Z', target: null, competency: null }] });
    if (url.pathname.startsWith('/api/')) return json({});
    if (['/app.js', '/style.css'].includes(url.pathname)) { res.setHeader('Content-Type', url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css'); return res.end(fs.readFileSync(out + url.pathname)); }
    res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 }, timezoneId: 'Pacific/Honolulu' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-22T16:00:00Z') });
  const hero = page.locator('[aria-labelledby="check-in-heading"]');
  const task = hero.getByLabel('Your next learning step', { exact: true });
  await page.goto(url);
  await task.getByRole('heading', { name: 'Motion vocabulary', exact: true }).waitFor();
  assert.equal(await hero.getAttribute('data-season'), 'Halloween season');
  await hero.getByRole('heading', { name: 'Hey, Alex!', exact: true }).waitFor();
  await hero.getByText('Due today · 11:59 pm', { exact: true }).waitFor();
  assert.equal(await task.getByRole('link', { name: 'Start quiz', exact: true }).getAttribute('href'), '/quizzes/q1');
  assert.equal(await hero.getByRole('link', { name: 'Visit store', exact: true }).getAttribute('href'), '/store');
  assert.equal(await hero.getByRole('link', { name: 'Customize your avatar', exact: true }).getAttribute('href'), '/avatar');
  const reflectionId = await hero.locator('figure').getAttribute('data-reflection-id');
  await page.reload(); await task.getByRole('heading', { name: 'Motion vocabulary', exact: true }).waitFor();
  assert.equal(await hero.locator('figure').getAttribute('data-reflection-id'), reflectionId);
  await hero.getByRole('button', { name: 'Feedback', exact: true }).click();
  await page.getByText('Your graph labels are clear. Next, explain what the slope tells you.', { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'teacher-feedback');
  assert.ok(requests.includes('/api/feedback'));

  for (const [scenario, title, label, href] of [
    ['quiz', 'Position–time graphs', 'Start quiz', '/quizzes/q1'],
    ['assignment', 'Investigating motion', 'Start reading', '/readings/r1'],
    ['warmup', 'Slope as a rate of change', 'Start math warm-up', '/dashboard/math-spine/warmup'],
    ['done', 'Practice your unit vocabulary', 'Explore vocabulary games', '/vocabulary/work'],
    ['error', 'Explore your lessons', 'Open lessons', '/lessons'],
  ]) {
    mode = scenario; await page.goto(url); await task.getByRole('heading', { name: title, exact: true }).waitFor();
    assert.equal(await task.getByRole('link', { name: label, exact: true }).getAttribute('href'), href);
    if (mode === 'error') assert.equal(await hero.getByText('You’re caught up on assigned work', { exact: true }).count(), 0);
  }

  mode = 'assignment'; await page.goto(url); await task.getByRole('heading', { name: 'Investigating motion', exact: true }).waitFor();
  const scenes = new Set();
  for (let month = 1; month <= 12; month++) {
    await page.clock.setSystemTime(new Date(`2026-${String(month).padStart(2, '0')}-17T16:00:00Z`));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(expected => document.querySelector('[aria-labelledby="check-in-heading"]').dataset.season === expected, ['New Year', 'Valentine’s season', 'St. Patrick’s season', 'Easter & spring', 'Spring in bloom', 'Summer solstice', 'Independence Day', 'Golden summer', 'Back to school', 'Halloween season', 'Thanksgiving season', 'Christmas & holidays'][month - 1]);
    scenes.add(await hero.locator('canvas').evaluate(canvas => canvas.toDataURL()));
    if ([4, 10, 12].includes(month)) await hero.screenshot({ path: out + `/month-${month}.png` });
  }
  assert.equal(scenes.size, 12);
  await page.clock.setSystemTime(new Date('2026-11-01T03:59:30Z'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(() => document.querySelector('[data-season]').dataset.season === 'Halloween season');
  const lastOctoberQuote = await hero.locator('figure').getAttribute('data-reflection-id');
  await page.clock.runFor(61000);
  await page.waitForFunction(() => document.querySelector('[data-season]').dataset.season === 'Thanksgiving season');
  assert.notEqual(await hero.locator('figure').getAttribute('data-reflection-id'), lastOctoberQuote);

  await page.clock.setSystemTime(new Date('2026-10-22T16:00:00Z'));
  for (const scenario of ['assignment', 'long']) {
    mode = scenario; await page.goto(url); await hero.getByRole('link', { name: 'Start reading', exact: true }).waitFor();
    for (const width of [1366, 1024, 820, 740, 540, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const result = await hero.evaluate(el => {
        const box = el.getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth > innerWidth, outside: [...el.querySelectorAll('a,button,h1,h2,blockquote,figcaption')].filter(node => { const r = node.getBoundingClientRect(); return r.width && r.height && (r.left < box.left || r.right > box.right); }).map(node => node.textContent) };
      });
      assert.equal(result.overflow, false, `${scenario} fits ${width}`); assert.deepEqual(result.outside, [], `${scenario} controls fit ${width}`);
      if ([1366, 390, 320].includes(width)) await hero.screenshot({ path: out + `/${scenario}-${width}.png` });
    }
  }
  mode = 'assignment'; await page.goto(url); await hero.getByRole('link', { name: 'Start reading', exact: true }).waitFor();
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' }); await page.evaluate(() => document.documentElement.classList.add('dark'));
  await hero.screenshot({ path: out + '/dark-mobile.png' });
  assert.ok(await hero.getByRole('link', { name: 'Start reading', exact: true }).evaluate(el => parseFloat(getComputedStyle(el).transitionDuration) <= .001), 'reduced motion disables the transition');
  assert.deepEqual(errors, []);
  console.log('PASS: 12 monthly scenes; daily stability and Eastern midnight/month rollover in a non-Eastern browser; real task types and hrefs; feedback fetch and keyboard focus; loading/error truthfulness; responsive normal/long content at 1366–320px; dark/reduced-motion rendering; no browser errors.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); server?.close(); });
