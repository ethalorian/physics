// Real React views, API authorization, Results readers and grading-term SQL.
// Existing work uses fictional rows; settings use a disposable local database.
// Start local Postgres first. No app credentials or real student data are used.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), os = require('node:os');
const assert = require('node:assert/strict'), { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), pkg = name => require(root + '/node_modules/' + name);
const out = fs.mkdtempSync('/private/tmp/student-progress-');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const database = 'grading_browser_' + process.pid, pgArgs = ['-h', '/private/tmp', '-p', process.env.TEST_PG_PORT || '55439', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'];
const sql = (text, db = database) => execFileSync('/opt/homebrew/bin/psql', [...pgArgs, '-d', db], { input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
const course = '11111111-1111-4111-8111-111111111111', foreign = '22222222-2222-4222-8222-222222222222';
const state = global.progressFixture = { role: 'student', user: 'student', experience: false, rows: {}, reads: [], fail: false, failSave: false };
global.progressDB = {
  from(table) {
    const filters = [], orders = []; let start = 0, end = Infinity, single = false;
    const query = {
      select() { return query; }, or() { assert.equal((state.rows[table] || []).length, 0, 'OR is only supported for empty fixture tables'); return query; }, eq(k, v) { filters.push(r => r[k] === v); return query; }, neq(k, v) { filters.push(r => r[k] !== v); return query; },
      is(k, v) { filters.push(r => (r[k] ?? null) === v); return query; }, in(k, v) { filters.push(r => v.includes(r[k])); return query; },
      contains(k, v) { filters.push(r => v.every(item => r[k]?.includes(item))); return query; },
      order(k, opts) { orders.push([k, opts?.ascending !== false]); return query; }, range(a, b) { start = a; end = b; return query; },
      limit(n) { end = n - 1; return query; }, maybeSingle() { single = true; return query; },
      then(resolve, reject) {
        if (table === 'course_grading_settings' && state.failSettings) return Promise.resolve({ data: null, error: new Error('Injected settings read failure') }).then(resolve, reject);
        let rows = table === 'course_grading_settings' ? JSON.parse(sql('select coalesce(json_agg(t),\'[]\') from public.course_grading_settings t;')) : state.rows[table] || [];
        rows = rows.filter(r => filters.every(f => f(r))).sort((a, b) => { for (const [k, asc] of orders) if (a[k] !== b[k]) return (a[k] < b[k] ? -1 : 1) * (asc ? 1 : -1); return 0; }).slice(start, end + 1);
        state.reads.push({ table, ids: rows.map(r => r.user_id || r.student_id || r.id) });
        return Promise.resolve({ data: single ? rows[0] || null : rows, error: null }).then(resolve, reject);
      },
    }; return query;
  },
  async rpc(name, p) {
    assert.equal(name, 'save_course_grading_settings');
    if (state.failSave) return { data: null, error: { code: 'offline', message: 'Injected test failure' } };
    try {
      return { data: JSON.parse(sql(`select public.save_course_grading_settings(${quote(p.p_course)},${quote(JSON.stringify(p.p_terms))},${quote(JSON.stringify(p.p_placements))},${Number(p.p_revision)},${quote(p.p_owner)},${quote(p.p_actor)});`)), error: null };
    } catch (error) { return { data: null, error: { code: String(error.stderr).includes('changed') ? '40001' : 'P0001', message: String(error.stderr) } }; }
  },
};
function plugin(mocks) { return { name: 'fixture', setup(build) {
  build.onResolve({ filter: /.*/ }, args => {
    const key = /(?:^|\/)supabase$/.test(args.path) && mocks['@/lib/supabase'] ? '@/lib/supabase' : args.path;
    return Object.hasOwn(mocks, key) ? { path: key, namespace: 'fixture' } : undefined;
  });
  build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: mocks[args.path], loader: 'tsx', resolveDir: root }));
} }; }
let browser, server, created = false;
(async () => {
  sql('create database ' + database, 'postgres'); created = true;
  sql(`create table public.courses(id uuid primary key, teacher_email text, archived_at timestamptz);
    do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
    if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists(select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if; end $$;
    insert into public.courses values(${quote(course)},'teacher@example.test',null);
    ${fs.readFileSync(root + '/supabase/migrations/20261024160706_course_grading_terms.sql', 'utf8')}
    ${fs.readFileSync(root + '/supabase/migrations/20261024160739_restrict_grading_term_service_grants.sql', 'utf8')}`);
  await pkg('esbuild').build({ stdin: { contents: `export {GET as progress} from './src/app/api/student-progress/route'; export {GET as settings,PUT as save} from './src/app/api/grading-terms/route'; export {GET as results} from './src/app/api/assessment-results/route';`, resolveDir: root }, bundle: true, platform: 'node', format: 'cjs', outfile: out + '/api.cjs', plugins: [plugin({
    'server-only': '', '@/lib/supabase': 'export const supabaseAdmin=global.progressDB;',
    '@/lib/auth': `export async function auth(){const s=global.progressFixture;return s.role==='anonymous'?null:{user:{id:s.user,email:s.role==='teacher'?'teacher@example.test':'student@example.test'},experience:s.experience||undefined}}`,
    '@/lib/effective-context': `export async function getEffectiveContext(){const role=global.progressFixture.role;return {role,realRole:role,scopeEmail:role==='teacher'?'teacher@example.test':'student@example.test',viewingAsTeacher:false}}`,
    '@/lib/student-enrollment': 'export const requireEnrolledStudent=async()=>null;', '@/lib/content-access': 'export const canEditArea=async()=>false;',
    'next/server': 'export const NextResponse={json:(data,options)=>Response.json(data,options)};',
  })] });
  const api = require(out + '/api.cjs');
  state.rows = {
    courses: [{ id: course, name: 'Physics', section: 'Example class', program: 'physics', teacher_email: 'teacher@example.test', archived_at: null }, { id: foreign, name: 'Other class', teacher_email: 'other@example.test' }],
    course_students: ['student', 'other'].map(id => ({ id, course_id: course, student_id: id, enrollment_state: 'ACTIVE', students: { name: id === 'student' ? 'Alex Example' : 'Private Other Student', is_active: true } })),
    units: [{ id: 'unit-1', name: 'Motion and forces', program: 'physics' }, { id: 'unit-2', name: 'Energy', program: 'physics' }],
    learning_targets: [{ id: 'target1', slug: 'motion', unit_id: 'unit-1', statement: 'Explain motion using evidence.', program: 'physics' }, { id: 'target2', slug: 'energy', unit_id: 'unit-2', statement: 'Describe energy transfers.', program: 'physics' }],
    mastery_records: [{ id: 'm1', user_id: 'student', target_id: 'target1', level: 2, observed_at: '2026-10-15T12:00:00Z' }, { id: 'm2', user_id: 'other', target_id: 'target1', level: 3, observed_at: '2026-10-16T12:00:00Z' }],
    teacher_feedback: [{ id: 'f1', user_id: 'student', target_id: 'target1', message: 'Connect your graph to the direction of motion.', created_at: '2026-10-15T12:00:00Z' }, { id: 'f2', user_id: 'other', target_id: 'target1', message: 'PRIVATE OTHER FEEDBACK', created_at: '2026-10-16T12:00:00Z' }],
    quiz_assignments: [], quiz_work: [], quiz_submissions: [], quiz_reviews: [], quiz_ai_reviews: [],
    worksheet_assignments: [], worksheet_receipts: [],
  };
  function quiz(id, earned, possible, due = '2026-10-20T23:00:00Z', target = 'target1', status = 'published') {
    const q = { id, course_id: course, title: id === 'quiz1' ? 'Motion and forces quiz' : id === 'quiz2' ? 'Energy evidence quiz' : id, kind: 'mixed', instructions: '', questions: [{ id: 'question', kind: 'written', prompt: 'Use evidence.', points: possible, target_id: target, guide: 'PRIVATE ANSWER KEY' }], grade_mode: 'numeric', status, due_at: due, student_ids: null, version: 1 };
    state.rows.quiz_assignments.push(q);
    if (earned != null) {
      state.rows.quiz_work.push({ quiz_id: id, user_id: 'student', answers: {}, state: 'graded', version: 1, submission_id: id + '-sub' });
      state.rows.quiz_submissions.push({ id: id + '-sub', quiz_id: id, user_id: 'student', snapshot: q, answers: {}, submitted_at: '2026-10-21T12:00:00Z' });
      state.rows.quiz_reviews.push({ id: id + '-review', submission_id: id + '-sub', decision: 'graded', scores: { question: earned }, ratings: {}, note: 'Your explanation uses evidence well.', reviewed_at: '2026-10-22T12:00:00Z' });
      state.rows.quiz_ai_reviews.push({ submission_id: id + '-sub', status: 'ready', private: 'PRIVATE AI DRAFT' });
    }
    return q;
  }
  quiz('quiz1', 14, 16); quiz('quiz2', 8, 10, '2026-10-21T23:00:00Z', 'target2');
  quiz('later', 9, 10, '2026-12-05T23:00:00Z');
  for (let i = 1; i <= 8; i++) quiz('Missing quiz ' + i, null, 5, '2026-10-' + String(i + 1).padStart(2, '0') + 'T23:00:00Z');
  const pending = quiz('Pending quiz', null, 5); state.rows.quiz_work.push({ quiz_id: pending.id, user_id: 'student', state: 'submitted', answers: {}, version: 1, submission_id: 'pending-sub' }); state.rows.quiz_submissions.push({ id: 'pending-sub', quiz_id: pending.id, user_id: 'student', snapshot: pending, answers: {}, submitted_at: '2026-10-21T12:00:00Z' });
  state.rows.worksheet_assignments.push({ id: 'paper', course_id: course, title: 'Motion paper worksheet', unit_id: 'unit-1', due_at: '2026-10-20T23:00:00Z', status: 'published', quiz_id: 'quiz1', student_ids: null });
  state.rows.worksheet_receipts.push({ assignment_id: 'paper', user_id: 'student', state: 'received', recorded_at: '2026-10-20T12:00:00Z', version: 1 });
  const request = async (route, query = '', body) => api[route](new Request('http://fixture/api/' + route + query, body ? { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined), { params: Promise.resolve({}) });
  const get = async (route, query) => { const response = await request(route, query); assert.equal(response.status, 200); return response.json(); };
  const terms = [{ id: 't1', name: 'Term 1', start: '2026-09-01', end: '2026-11-06' }, { id: 't2', name: 'Term 2', start: '2026-11-07', end: '2027-01-22' }];
  state.role = 'anonymous'; assert.equal((await request('progress')).status, 401);
  state.role = 'student'; assert.equal((await request('save', '', { courseId: course, settings: { terms, placements: {}, revision: 0 } })).status, 403);
  assert.equal((await request('progress', '?class=' + foreign)).status, 403);
  state.role = 'teacher'; assert.equal((await request('settings', '?class=' + foreign)).status, 403);
  assert.equal((await request('progress', '?class=' + course + '&student=foreign-student')).status, 403);
  state.experience = true; assert.equal((await request('save', '', { courseId: course, settings: { terms, placements: {}, revision: 0 } })).status, 403); state.experience = false;
  let saved = await (await request('save', '', { courseId: course, settings: { terms, placements: {}, revision: 0 } })).json(); assert.equal(saved.settings.revision, 1);
  assert.equal((await request('save', '', { courseId: course, settings: { ...saved.settings, placements: { 'quiz:foreign': 't2' } } })).status, 409);
  state.role = 'student'; let progress = await get('progress', '?class=' + course + '&student=other');
  assert.equal(progress.student.id, 'student'); assert.equal(progress.roster.length, 0); assert.deepEqual(progress.warnings, []);
  assert.equal(progress.rows.filter(r => r.status === 'missing').length, 8); assert.equal(progress.targets[0].observations.length, 1);
  assert.doesNotMatch(JSON.stringify(progress), /PRIVATE|Private Other|correct_index|submissionId|question_notes|assessmentVersion/);
  state.role = 'teacher'; const teacher = await get('results', '?class=' + course + '&unit=unit-1&term=t1');
  assert.equal(teacher.termQuizTotals.student.earned, 22); assert.equal(teacher.termQuizTotals.student.possible, 26); assert.equal(teacher.activities.some(a => a.sourceId === 'quiz2'), false, 'term total crosses the unit filter');
  state.failSettings = true;
  const unavailable = await get('results', '?class=' + course + '&unit=all&term=t1');
  assert.equal(unavailable.gradingTermId, 't1'); assert.equal(unavailable.activities.length, 0); assert.equal(unavailable.warnings[0].source, 'Grading terms');
  state.failSettings = false;
  const unchanged = JSON.stringify(state.rows);
  await pkg('esbuild').build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import StudentProgress from './src/components/student/StudentProgress';import GradingTermSettings from './src/components/admin/GradingTermSettings';import ResultsGradebook from './src/components/admin/results/ResultsGradebook';const q=new URLSearchParams(location.search);const mode=location.pathname;createRoot(document.getElementById('root')).render(mode==='/settings'?<GradingTermSettings classId=${JSON.stringify(course)}/>:mode==='/results'?<ResultsGradebook classId=${JSON.stringify(course)} unitId="unit-1" targets={[]} onReviewLesson={()=>{}} onSaved={()=>{}}/>:<StudentProgress mode={mode==='/home/gradebook'?'gradebook':'summary'} classId=${JSON.stringify(course)} studentId={q.get('student')||undefined} initialTerm={q.get('term')||undefined} initialKind={q.get('kind')||undefined} initialStatus={q.get('status')||undefined} initialTab={q.get('tab')||undefined}/>);`, resolveDir: root, loader: 'tsx' }, bundle: true, format: 'esm', jsx: 'automatic', outfile: out + '/app.js', define: { 'process.env.NODE_ENV': '"development"' }, plugins: [plugin({
    'next/link': `import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>}`,
    'next-auth/react': `export const useSession=()=>({data:{user:{email:'teacher@example.test'}}});`,
    'next/navigation': `export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({replace:url=>location.assign(url),push:url=>location.assign(url)});`,
    './ResultEvidencePanel': 'export default function Panel(){return null}',
  })] });
  const css = await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({ base: root })]).process(fs.readFileSync(root + '/src/app/globals.css', 'utf8'), { from: root + '/src/app/globals.css' });
  fs.writeFileSync(out + '/style.css', css.css + '\n' + fs.readFileSync(out + '/app.css', 'utf8'));
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://fixture');
      if (url.pathname.startsWith('/api/')) {
        if (state.fail) { res.writeHead(503); return res.end('{}'); }
        const chunks = []; for await (const chunk of req) chunks.push(chunk);
        const route = url.pathname === '/api/student-progress' ? 'progress' : url.pathname === '/api/assessment-results' ? 'results' : req.method === 'PUT' ? 'save' : 'settings';
        const response = await request(route, url.search, chunks.length ? JSON.parse(Buffer.concat(chunks)) : undefined);
        if (route === 'save') console.log('Term save response:', response.status);
        res.writeHead(response.status, Object.fromEntries(response.headers)); return res.end(await response.text());
      }
      if (['/app.js', '/style.css'].includes(url.pathname)) { res.setHeader('Content-Type', url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css'); return res.end(fs.readFileSync(out + url.pathname)); }
      res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html lang="en" class="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body style="background:var(--background);padding:24px"><main style="max-width:1200px;margin:auto" id="root"></main><script type="module" src="/app.js"></script></body></html>');
    } catch (error) { console.error(error); res.writeHead(500); res.end('{}'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--disk-cache-size=1', '--media-cache-size=1'] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 950 }, timezoneId: 'America/New_York' }), errors = [];
  await page.clock.setFixedTime(new Date('2026-10-24T14:00:00Z'));
  page.on('pageerror', error => errors.push(error.message)); page.on('dialog', dialog => dialog.dismiss());
  const url = 'http://127.0.0.1:' + server.address().port;
  state.role = 'student'; await page.goto(url + '/home');
  await page.getByRole('region', { name: 'Grade breakdown', exact: true }).getByText('84.6%').waitFor();
  const missing = page.getByRole('region', { name: 'Missing work' }); assert.equal(await missing.locator('article').count(), 3);
  await missing.getByText('Showing 3 of 8 missing items').waitFor();
  await page.screenshot({ path: out + '/student-home-desktop.png', fullPage: true });
  await page.getByText('How the average is calculated', { exact: true }).click(); await page.getByText('Missing and unreleased quizzes are not zeros.').waitFor();
  await missing.getByRole('link', { name: 'View all 8 missing items' }).click();
  await page.getByText('8 assignments shown').waitFor(); assert.equal(await page.locator('details').filter({ has: page.locator('[data-status="missing"]') }).count(), 8);
  await page.getByLabel('Status').selectOption('pending'); await page.getByText('1 assignments shown').waitFor();
  await page.getByLabel('Status').selectOption('all'); await page.getByLabel('Grading term').selectOption('t1');
  await page.getByRole('button', { name: 'Points', exact: true }).click(); await page.getByText('14 / 16', { exact: true }).waitFor();
  await page.getByText('Motion and forces quiz', { exact: true }).click(); await page.locator('details[open]').getByText('Your explanation uses evidence well.').waitFor();
  await page.getByRole('link', { name: 'View paper worksheet' }).waitFor();
  await page.getByLabel('Unit').selectOption('unit-2'); await page.getByRole('button', { name: 'Learning history' }).click();
  await page.getByText('Explain motion using evidence.').waitFor(); await page.getByText('Describe energy transfers.').waitFor();
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(url + '/home'); await missing.getByText('Showing 3 of 8 missing items').waitFor();
  await page.screenshot({ path: out + '/student-home-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 320, height: 800 }); await page.goto(url + '/home/gradebook'); await page.getByText('13 assignments shown').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '320px gradebook fits');
  state.role = 'teacher'; await page.setViewportSize({ width: 1366, height: 950 }); await page.goto(url + '/settings');
  await page.getByLabel('Start date').first().waitFor();
  await page.getByLabel('Start date').nth(1).fill('2026-11-06'); await page.getByRole('button', { name: 'Save grading terms' }).click(); await page.getByRole('alert').filter({ hasText: 'overlap' }).waitFor();
  await page.getByLabel('Start date').nth(1).fill('2026-11-07');
  await page.getByLabel('Term name').first().fill('Fall term');
  state.failSave = true; await page.getByRole('button', { name: 'Save grading terms' }).click(); await page.getByRole('alert').filter({ hasText: 'Could not save' }).waitFor(); assert.equal(await page.getByLabel('Term name').first().inputValue(), 'Fall term');
  state.failSave = false; await page.getByRole('button', { name: 'Save grading terms' }).click(); await page.getByText('Grading terms saved.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Assignment placement' }).click();
  await page.getByLabel('Grading term for Motion and forces quiz').selectOption('t2');
  await page.screenshot({ path: out + '/placement-before-save.png', fullPage: true });
  await page.getByRole('button', { name: 'Save grading terms' }).click(); await page.getByText('Grading terms saved.', { exact: false }).waitFor();
  await page.screenshot({ path: out + '/term-placement-desktop.png', fullPage: true });
  await page.reload(); await page.getByRole('button', { name: 'Assignment placement' }).click(); assert.equal(await page.getByLabel('Grading term for Motion and forces quiz').inputValue(), 't2');
  state.role = 'student'; await page.goto(url + '/home'); await page.getByRole('region', { name: 'Grade breakdown', exact: true }).getByText('80.0%').waitFor();
  assert.equal(JSON.stringify(state.rows), unchanged, 'saving terms never changes assignment deadlines or student work');
  state.role = 'teacher'; await page.goto(url + '/results?resultView=gradebook&resultTerm=t1'); await page.getByRole('heading', { name: 'Gradebook', exact: true }).waitFor();
  const alex = page.getByRole('row').filter({ hasText: 'Alex Example' }); await alex.getByText('80.0%').waitFor(); await page.getByRole('link', { name: 'Manage grading terms' }).waitFor();
  await page.getByLabel('Grading term').selectOption('t2'); await alex.getByText('88.5%').waitFor();
  await page.goto(url + '/settings'); await page.getByLabel('Term name').first().fill('Unsaved draft');
  saved = await get('settings', '?class=' + course); await request('save', '', { courseId: course, settings: { ...saved.settings, terms: saved.settings.terms.map((t, i) => i ? { ...t, name: 'Winter term' } : t) } });
  await page.getByRole('button', { name: 'Save grading terms' }).click(); await page.getByRole('alert').filter({ hasText: 'another window' }).waitFor();
  assert.equal(await page.getByLabel('Term name').first().inputValue(), 'Unsaved draft');
  await page.getByRole('link', { name: 'Back to gradebook' }).click(); assert.match(page.url(), /settings/, 'unsaved-navigation dismissal stays on page');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 800 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '320px dates fit');
  await page.screenshot({ path: out + '/term-dates-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Assignment placement' }).click(); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '320px placement fits');
  await page.evaluate(() => document.documentElement.classList.remove('dark')); await page.screenshot({ path: out + '/term-placement-mobile-light.png', fullPage: true });
  state.role = 'student'; await page.goto(url + '/home'); await missing.getByText('Showing 3 of 8 missing items').waitFor();
  state.fail = true; await page.getByRole('button', { name: 'Refresh progress' }).click(); await page.getByRole('alert').filter({ hasText: 'could not refresh' }).waitFor(); await missing.getByText('Showing 3 of 8 missing items').waitFor();
  state.fail = false; await page.getByRole('button', { name: 'Try again' }).click(); await page.getByRole('alert').waitFor({ state: 'detached' });
  assert.deepEqual(errors, []); console.log('PASS: API scope/privacy, real SQL saves, term totals, missing work, feedback, history, conflict/retry/draft retention, mobile layouts. Screenshots: ' + out);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); if (created) sql('drop database ' + database, 'postgres'); });
