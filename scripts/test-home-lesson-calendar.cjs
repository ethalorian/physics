// Real home API, class-window and submission readers, hook, page and calendar.
// Only storage/auth and unrelated panels are fixtures; no live student writes.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), pkg = name => require(root + '/node_modules/' + name);
const out = '/private/tmp/home-lesson-calendar'; fs.mkdirSync(out, { recursive: true });
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fixture = global.homeLessonCalendar = { user: 'student', rows: {}, reads: [], fail: false };
global.homeLessonCalendarDB = { from(table) {
  const filters = [], orders = []; let start = 0, end = Infinity;
  const query = {
    select() { return query; }, or() { return query; },
    eq(key, value) { filters.push(row => row[key] === value); return query; },
    in(key, values) { filters.push(row => values.includes(row[key])); return query; },
    order(key, options) { orders.push([key, options?.ascending !== false]); return query; },
    range(from, to) { start = from; end = to; return query; },
    limit(count) { end = count - 1; return query; },
    then(resolve, reject) {
      const rows = (fixture.rows[table] ?? []).filter(row => filters.every(filter => filter(row))).sort((a, b) => {
        for (const [key, asc] of orders) if (a[key] !== b[key]) return (a[key] < b[key] ? -1 : 1) * (asc ? 1 : -1);
        return 0;
      }).slice(start, end + 1);
      fixture.reads.push({ table, ids: rows.map(row => row.id ?? row.lesson_id) });
      return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
    },
  }; return query;
} };
function plugin(mocks) { return { name: 'fixture', setup(build) {
  build.onResolve({ filter: /.*/ }, args => Object.hasOwn(mocks, args.path) ? { path: args.path, namespace: 'fixture' } : undefined);
  build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: mocks[args.path], loader: 'tsx', resolveDir: root }));
} }; }
let server, browser;
(async () => {
  await pkg('esbuild').build({ stdin: { contents: `export {GET} from './src/app/api/home/route';export {createReflectionAssignment} from './src/lib/reflection-assignments';export {createGraphicNovelAssignment} from './src/lib/graphic-novel-assignments';export {PHYSICS_VIDEOS} from './src/data/physics-videos';`, resolveDir: root }, bundle: true, platform: 'node', format: 'cjs', outfile: out + '/api.cjs', plugins: [plugin({
    'server-only': '',
    '@/lib/api-auth': `export const withAuth=fn=>req=>fn(req,{userId:global.homeLessonCalendar.user,session:{user:{name:'Example'}}});`,
    '@/lib/supabase': `export const supabaseAdmin=global.homeLessonCalendarDB;`,
    '@/lib/program': `export const getStudentProgram=async()=> 'physics';`,
    '@/lib/student-enrollment': `export const getStudentTrack=async()=> 'cpa';`,
    '@/lib/points': `export const getBalance=async()=>({lifetimeEarned:0,balance:0});`,
    'next/server': `export const NextResponse={json:data=>Response.json(data)};`,
  })] });
  const api = require(out + '/api.cjs');
  const due = '2026-10-23T03:59:00.000Z', tomorrow = '2026-10-24T03:59:00.000Z';
  const lesson = (id, title, document, extra = {}) => ({ id, slug: id, title, unit: 'Motion', unit_id: 'unit-1', published: true, lesson_number: 1, content_blocks: document, ...extra });
  const window = (id, extra = {}) => ({ course_id: 'e-block', lesson_id: id, open_at: null, close_at: null, due_at: due, ...extra });
  const graphic = lesson('chapter-7', 'Graphic novel · Chapter 7: What Changes', api.createGraphicNovelAssignment(7));
  const manga = lesson('manga', 'My week in physics · Manga', api.createReflectionAssignment('manga'));
  const story = lesson('written-reflection', 'Written Reflection', api.createReflectionAssignment('story'));
  const video = lesson('video-1', 'Video 1 · Units and precision', { schemaVersion: 1, presentation: 'physics-path', learningPath: { version: 1, kind: 'lesson' }, blocks: [{ id: 'video', type: 'instruction_video', youtubeId: api.PHYSICS_VIDEOS[0].youtubeId }] });
  fixture.rows = {
    units: [{ id: 'unit-1', name: 'Motion', program: 'physics', order_index: 1 }],
    course_students: [{ student_id: 'student', course_id: 'e-block', enrollment_state: 'ACTIVE' }, { student_id: 'other', course_id: 'a-block', enrollment_state: 'ACTIVE' }, { student_id: 'withdrawn', course_id: 'e-block', enrollment_state: 'WITHDRAWN' }],
    lessons: [graphic, manga, story, video, ...['draft', 'foreign-class', 'closed', 'undated', 'unassigned', 'future', 'honors-only', 'retired'].map(id => lesson(id, id, api.createReflectionAssignment('story'), { published: id !== 'draft', visibility_track: id === 'honors-only' ? 'honors' : null, ...(id === 'retired' ? { content_blocks: { schemaVersion: 1, blocks: [] } } : {}) }))],
    lesson_class_windows: [window(graphic.id), window(manga.id), window(story.id), window(video.id, { due_at: tomorrow }), window('draft'), window('foreign-class', { course_id: 'a-block' }), window('closed', { close_at: '2000-01-01T00:00:00Z' }), window('undated', { due_at: null }), window('future', { open_at: '2099-01-01T00:00:00Z' }), window('honors-only'), window('retired')],
    // An old 100% progress row is not a native submission.
    lesson_progress: [{ user_id: 'student', lesson_id: story.id, status: 'completed', progress_percentage: 100 }],
    block_responses: [{ id: 'answer', user_id: 'student', lesson_id: story.id, block_id: 'reflection-product', response: { text: 'A fictional story about changing motion.' }, created_at: '2026-10-21T12:00:00Z' }],
    lesson_submissions: [{ id: 'manga-submission', user_id: 'student', lesson_id: manga.id, submitted_at: '2026-10-21T12:05:00Z' }, { id: 'other-submission', user_id: 'other', lesson_id: graphic.id, submitted_at: '2026-10-21T12:05:00Z' }],
    lesson_reviews: [], block_drafts: [], learning_targets: [], student_activity: [],
  };
  const getHome = async () => (await api.GET(new Request('http://fixture/api/home'))).json();
  let home = await getHome();
  assert.deepEqual(home.lessonAssignments.map(item => item.id), ['lesson:chapter-7', 'lesson:manga', 'lesson:written-reflection', 'video:video-1']);
  assert.equal(home.homework.length, 1, 'legacy videos remain available');
  assert.equal(home.lessonAssignments[0].due, due, 'Eastern October 22 deadline survives unchanged');
  assert.equal(home.lessonAssignments[0].complete, false, 'another student submission cannot complete this work');
  assert.equal(home.lessonAssignments[1].complete, true, 'native Manga submission counts');
  assert.equal(home.lessonAssignments[2].complete, false, 'saved reflection is not submitted despite legacy progress');
  assert.equal(home.lessonAssignments[2].status, 'Ready to submit');
  fixture.user = 'withdrawn'; assert.deepEqual((await getHome()).lessonAssignments, [], 'withdrawn enrollment grants no work');
  fixture.user = 'other'; assert.deepEqual((await getHome()).lessonAssignments.map(item => item.id), ['lesson:foreign-class'], 'windows are scoped to student classes');
  fixture.user = 'student';
  const before = JSON.stringify(fixture.rows);
  await pkg('esbuild').build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Home from './src/app/home/StudentDashboard';createRoot(document.getElementById('root')).render(<Home/>);`, resolveDir: root, loader: 'tsx' }, bundle: true, format: 'esm', jsx: 'automatic', outfile: out + '/app.js', define: { 'process.env.NODE_ENV': '"development"' }, plugins: [plugin({
    'next/link': `import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>}`,
    'next/navigation': `export const useRouter=()=>({push:url=>location.assign(url)});`,
    'next-auth/react': `export const useSession=()=>({data:{user:{name:'Example',role:'student'}}});`,
    '@/components/EnrollmentGate': `export default function Gate({children}){return children}`,
    './StudentCheckIn': `export default function CheckIn(){return null}`,
    './LearningPace': `export default function Pace(){return null}`,
    './LearningJourney': `export default function Journey(){return null}`,
  })] });
  const css = await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({ base: root })]).process(fs.readFileSync(root + '/src/app/globals.css', 'utf8'), { from: root + '/src/app/globals.css' });
  fs.writeFileSync(out + '/style.css', css.css + '\n' + fs.readFileSync(out + '/app.css', 'utf8'));
  const choices = { staff: false, readOnly: false, courses: [], courseId: null, sections: [], selections: [], bookings: [], slots: [], roster: [{ id: 'student' }], evidence: {}, progress: {} };
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://fixture'), json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    if (req.method !== 'GET') return json({ error: 'Fixture is read only' }, 405);
    if (url.pathname === '/api/home') return fixture.fail ? json({}, 503) : json(await getHome());
    if (url.pathname === '/api/choice-calendar') return json(choices);
    if (url.pathname === '/api/readings') return json({ staff: false, assignments: [], work: [], courses: [] });
    if (url.pathname === '/api/quizzes') return json({ staff: false, quizzes: [], locked: [], work: [], courses: [] });
    if (url.pathname === '/api/review-modules') return json({ staff: false, assignments: [] });
    if (url.pathname === '/api/interactive-assignments') return json({ staff: false, assignments: [], work: [], submissions: [], reviews: [] });
    if (url.pathname === '/api/vocab/tasks') return json({ tasks: [] });
    if (url.pathname === '/api/calendar/warmups') return json({ days: [] });
    if (url.pathname === '/api/math-spine/daily') return json({ item: null });
    if (url.pathname === '/api/math-spine/dashboard') return json({ competencies: [], focus: [], records: [] });
    if (url.pathname === '/api/home/pace') return json({ warmups: [], noSchoolDates: [] });
    if (['/app.js', '/style.css'].includes(url.pathname)) { res.setHeader('Content-Type', url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css'); return res.end(fs.readFileSync(out + url.pathname)); }
    res.setHeader('Content-Type', 'text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script type="module" src="/app.js"></script></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, timezoneId: 'America/New_York' }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-10-22T14:00:00Z'));
  await page.goto('http://127.0.0.1:' + server.address().port + '/?view=week');
  const cell = day => page.locator(`td[data-calendar-date="${day}"][data-lane="assignments"]`);
  const card = (title, day = '2026-10-22') => cell(day).getByRole('button', { name: new RegExp(title) });
  for (const item of [graphic, manga]) await card(item.title.replace('·', '.')).waitFor();
  await cell('2026-10-22').getByRole('button', { name: 'View all 3' }).click();
  const manager = page.getByRole('region', { name: 'Assignment manager' });
  for (const item of [graphic, manga, story]) await manager.getByRole('button', { name: new RegExp(item.title.replace('·', '.')) }).waitFor();
  assert.equal(await manager.locator('article').count(), 3, 'all three reflections appear in the due-day list');
  await page.getByRole('button', { name: 'My week', exact: true }).click();
  assert.equal(await cell('2026-10-23').locator('button[data-kind="video"]').count(), 1, 'video appears exactly once');
  await card('Chapter 7').click();
  const detail = page.locator('[aria-labelledby="activity-detail-heading"]');
  assert.equal(await detail.getByRole('link', { name: 'Open assignment' }).getAttribute('href'), '/lessons/chapter-7');
  assert.match(await detail.textContent(), /Oct 22/);
  await page.screenshot({ path: out + '/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Thu, Oct 22', exact: true }).click();
  const mobileCard = page.locator('button[data-kind="lesson"]').filter({ hasText: 'Chapter 7' }).filter({ visible: true });
  await mobileCard.click(); await detail.getByRole('link', { name: 'Open assignment' }).waitFor();
  await page.screenshot({ path: out + '/mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'phone has no horizontal overflow');
  await page.setViewportSize({ width: 1366, height: 900 });
  assert.equal(JSON.stringify(fixture.rows), before, 'reading calendar never mutates student records');
  fixture.rows.lesson_submissions.push({ id: 'graphic-submission', user_id: 'student', lesson_id: graphic.id, submitted_at: '2026-10-22T13:00:00Z' });
  await page.getByRole('button', { name: 'Refresh dashboard' }).click();
  await card('Chapter 7.*Submitted').waitFor();
  assert.equal(await card('Chapter 7').getAttribute('data-complete'), 'true');
  fixture.rows.lesson_reviews.push({ submission_id: 'graphic-submission' });
  fixture.rows.block_drafts.push({ user_id: 'student', lesson_id: graphic.id, block_id: graphic.content_blocks.blocks.find(block => block.capture).id, updated_at: '2026-10-22T13:10:00Z' });
  await page.getByRole('button', { name: 'Refresh dashboard' }).click();
  await card('Chapter 7.*Changes not submitted').waitFor();
  assert.equal(await card('Chapter 7').getAttribute('data-complete'), 'false');
  fixture.rows.lesson_class_windows.find(row => row.lesson_id === graphic.id).due_at = tomorrow;
  await page.getByRole('button', { name: 'Refresh dashboard' }).click();
  await card('Chapter 7', '2026-10-23').waitFor();
  assert.equal(await card('Chapter 7').count(), 0, 'changed deadline removes old date');
  fixture.rows.lesson_class_windows.find(row => row.lesson_id === graphic.id).due_at = null;
  await page.getByRole('button', { name: 'Refresh dashboard' }).click();
  await card('Chapter 7', '2026-10-23').waitFor({ state: 'detached' });
  fixture.fail = true;
  await page.getByRole('button', { name: 'Refresh dashboard' }).click();
  await page.getByRole('button', { name: 'Retry lessons' }).waitFor();
  fixture.fail = false; await page.getByRole('button', { name: 'Retry lessons' }).click();
  await card('Written Reflection').waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: real home API → class windows/native submissions → hook → desktop/mobile calendar; Graphic novel, Manga, Written Reflection and video; class/track/publish/release isolation; submission/revision; changed/cleared deadline; error recovery; no student writes.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); });
