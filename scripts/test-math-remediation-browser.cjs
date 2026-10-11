// Local synthetic student flow. No production credentials or student records are used.
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), out = '/private/tmp/math-remediation-preview';
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
let server, browser;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const f = await require('./math-missions-fixture.cjs')(root);
  let submitted = false, verdict = 'mismatch', practice = 0;
  const practiceSkills = [];
  const recommendation = { code: 'SM1', skill: f.catalog.COMPETENCIES.SM1, game: 'Balance Bay', reason: 'answer', href: f.catalog.missionHref('SM1', '/dashboard/math-spine/warmup?practice_skill=SM1#practice') + '&mode=practice&from=math-feedback' };
  const item = { instanceId: 'demo-warmup', spiralItemId: 'demo-item', competencyId: 'demo-skill', competencyCode: 'SM1', competencyStatement: f.catalog.COMPETENCIES.SM1, prompt: 'Rearrange v = u + a × t to make t the subject.', checkMode: 'short-answer', competencyValue: 3 };
  const build = await require('esbuild').build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import Warmup from './src/app/dashboard/math-spine/warmup/page';import Player from './src/components/math-missions/MissionPlayer';import Daily from './src/components/math-spine/DailyMathTask';createRoot(document.getElementById('root')).render(location.pathname.startsWith('/arcade/missions/')?<Player slug={location.pathname.split('/').pop()}/>:location.pathname==='/home'?<div style={{maxWidth:600,margin:'40px auto',padding:16}}><Daily compact/></div>:<Warmup/>);`, loader: 'jsx', resolveDir: root }, bundle: true, jsx: 'automatic', format: 'iife', platform: 'browser', outfile: out + '/app.js', write: false, define: { 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'local-next', setup(b) { b.onResolve({ filter: /^next\/(navigation|link|image)$/ }, a => ({ path: a.path, namespace: 'fixture' })); b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ loader: 'jsx', resolveDir: root, contents: a.path.endsWith('navigation') ? 'const params=new URLSearchParams(location.search);export const useSearchParams=()=>params;' : a.path.endsWith('image') ? 'export default function Image({fill,sizes,...p}){return <img {...p}/>}' : 'export default function Link(p){return <a {...p}/>}' })); } }] });
  for (const file of build.outputFiles) fs.writeFileSync(file.path, file.contents);
  const css = await require('postcss')([require('@tailwindcss/postcss')({ base: root })]).process(fs.readFileSync(root + '/src/app/globals.css', 'utf8'), { from: root + '/src/app/globals.css' });
  fs.writeFileSync(out + '/style.css', css.css);
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1'), p = url.pathname;
      let body = ''; for await (const chunk of req) body += chunk;
      const json = d => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)); };
      if (p === '/__demo/reset') { submitted = false; verdict = JSON.parse(body).verdict; return json({ ok: true }); }
      if (p === '/api/math-spine/daily') return json({ item, alreadySubmitted: submitted, remediation: submitted && verdict === 'mismatch' ? recommendation : null, submissionXp: submitted ? 1 : null, pickKind: 'climb' });
      if (p === '/api/math-spine/student-warmups') return json({ submissions: [], feedback: [], revisions: [] });
      if (p === '/api/math-spine/warmup-submit') { submitted = true; return json({ selfCheck: verdict, xpEarned: 1, xpAwarded: 1, feedback: { tag: null, label: null, message: 'Check which operation undoes adding u.', source: 'fallback' } }); }
      if (p === '/api/math-spine/practice') {
        if (req.method === 'POST') return json({ result: JSON.parse(body).answer === '(d-r)/s' ? 'match' : 'mismatch', xpEarned: 0, xpAwarded: 0 });
        practiceSkills.push(url.searchParams.get('skill'));
        return json({ item: { ...item, instanceId: 'demo-practice-' + (++practice), prompt: 'Fresh problem: rearrange d = r + s × t to make t the subject.' }, xpAvailable: 1 });
      }
      if (p.startsWith('/api/math-missions')) {
        const r = await f.route[req.method](new Request(url, { method: req.method, headers: req.headers, ...(req.method === 'POST' ? { body } : {}) }));
        res.statusCode = r.status; res.setHeader('Content-Type', 'application/json'); return res.end(await r.text());
      }
      if (p.startsWith('/api/')) return json({});
      if (['/app.js', '/app.css', '/style.css'].includes(p)) { res.setHeader('Content-Type', p.endsWith('.js') ? 'text/javascript' : 'text/css'); return res.end(fs.readFileSync(out + p)); }
      if (p.startsWith('/arcade/previews/')) { res.setHeader('Content-Type', 'image/webp'); return res.end(fs.readFileSync(path.join(root, 'public', p))); }
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html><head><meta charset="utf-8"><title>Math remediation · local demo</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script>window.process={env:{}};</script><script src="/app.js"></script></body></html>');
    } catch (e) { res.statusCode = 500; res.end(String(e)); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log('Local synthetic preview:', base);
  fs.writeFileSync(out + '/url.txt', base);
  if (process.argv.includes('--serve')) return;
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } }), errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.error('Browser error:', e.stack); });
  const rec = page.getByRole('complementary', { name: 'Recommended game practice', exact: true });
  async function answerWarmup(result) {
    await page.request.post(base + '/__demo/reset', { data: { verdict: result } });
    await page.goto(base + '/dashboard/math-spine/warmup');
    await page.getByLabel('Show your reasoning', { exact: true }).fill('I divided first and then subtracted u.');
    await page.locator('#final-answer').fill('v/a-u');
    assert.equal(await rec.count(), 0, 'No recommendation before a checked answer');
    await page.getByRole('button', { name: 'Submit warm-up', exact: true }).click();
    await page.getByText("Submitted · in your teacher's queue", { exact: true }).waitFor();
  }
  for (const result of ['match', 'unknown']) { await answerWarmup(result); assert.equal(await rec.count(), 0, result + ' must not trigger remediation'); }
  await answerWarmup('mismatch'); await rec.waitFor();
  await page.screenshot({ path: out + '/wrong-answer-desktop.png', fullPage: true });
  await page.reload(); await rec.waitFor();
  await page.goto(base + '/home'); await rec.waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Home card fits mobile');
  await page.screenshot({ path: out + '/home-mobile.png', fullPage: true });
  await rec.getByRole('link', { name: 'Practice in Balance Bay' }).click();
  await page.getByRole('heading', { name: 'Practice the skill from your math check' }).waitFor();
  assert.equal(await page.getByLabel('Skill', { exact: true }).inputValue(), 'SM1');
  await page.getByRole('button', { name: 'Launch mission', exact: true }).click();
  await page.getByRole('region', { name: 'A separate worked example' }).waitFor();
  const current = () => f.tables.math_mission_sessions.at(-1);
  assert.equal(current().state.hintCount, 1, 'Recommended session starts with recorded teaching support');
  await page.screenshot({ path: out + '/teaching-mobile.png', fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Teaching fits mobile');
  await page.setViewportSize({ width: 1366, height: 1000 });
  await page.screenshot({ path: out + '/teaching-desktop.png', fullPage: true });
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: 'Check my work', exact: true }).waitFor();
    const task = f.logic.currentTask(current());
    if (i === 1) {
      assert.equal(await page.getByRole('region', { name: 'A separate worked example' }).count(), 0, 'Support fades for the next task');
      await page.locator('form').getByLabel(task.fields[0].label, { exact: true }).fill('incorrect');
      await page.getByRole('button', { name: 'Check my work', exact: true }).click();
      await page.getByRole('region', { name: 'A separate worked example' }).waitFor();
    }
    for (const field of task.fields) {
      const input = page.locator('form').getByLabel(field.label, { exact: true });
      if (field.kind === 'select') await input.selectOption(task.expected[field.id]); else await input.fill(task.expected[field.id]);
    }
    await page.getByRole('button', { name: i === 1 ? 'Check again' : 'Check my work', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Finish & bank XP' : 'Continue', exact: true }).click();
  }
  await page.getByRole('heading', { name: 'Good thinking travels.' }).waitFor();
  assert.equal(current().state.evidence[0].firstAssisted, true);
  assert.equal(current().state.evidence[1].firstCorrect, false);
  assert.equal(current().state.evidence[1].assisted, true);
  await page.getByRole('link', { name: 'Try a fresh SM1 problem' }).click();
  assert.equal(new URL(page.url()).searchParams.get('practice_skill'), 'SM1');
  await page.getByText('Fresh problem: rearrange d = r + s × t to make t the subject.', { exact: true }).waitFor();
  assert.equal(practiceSkills.at(-1), 'SM1');
  const practiceSection = page.locator('#practice');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'practice', 'Return focuses the fresh check after async loading');
  await practiceSection.getByLabel('Final answer', { exact: true }).fill('wrong');
  await practiceSection.getByRole('button', { name: 'Check', exact: true }).click();
  await practiceSection.getByRole('complementary', { name: 'Recommended game practice' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Fresh check fits mobile');
  await page.screenshot({ path: out + '/fresh-check-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: wrong-only recommendation, reload/home persistence, guided game, fading support, teaching after a miss, six tasks, honest evidence, same-skill fresh check, mobile fit, no runtime exceptions');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); if (!process.argv.includes('--serve') || process.exitCode) server?.close(); });
