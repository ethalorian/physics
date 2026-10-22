const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');

// Keep the real daily route, auth wrapper, XP helper, Supabase client, and
// walkthrough database guard together. Mock only identity and network data.
const repo = path.resolve(__dirname, '..');
const output = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'warmup-experience-')), 'routes.cjs');
const studentId = '00000000-0000-4000-8000-000000000001';
const xp = { dailyEarned: 12, dailyCap: 50, remaining: 38 };
let preview = true;
let issued = null;
let xpFailure = false;
let submission = null;
let requests = [];
const RealDate = Date;
let now = '2026-10-13T16:00:00Z';
class SchoolClock extends RealDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return new RealDate(now).getTime(); }
}
const mocks = {
  'server-only':'export {};',
  '@/lib/auth': 'export const auth = async () => global.__warmupExperience.session();',
  '@/lib/effective-context': "export const getEffectiveContext = async () => ({role:'student',realRole:'student',scopeEmail:'student@example.invalid',viewingAsTeacher:false});",
};

async function main() {
  await esbuild.build({
    stdin: { contents: `export { GET } from './src/app/api/math-spine/daily/route';
      export { POST } from './src/app/api/math-spine/warmup-submit/route';
      export { experienceDatabaseFetch, registerExperienceDatabaseGuard } from './src/lib/experience-db-fetch';`, resolveDir: repo },
    outfile: output, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent',
    plugins: [{ name: 'synthetic-identity', setup(build) {
      build.onResolve({ filter: /.*/ }, args => mocks[args.path] ? { path: args.path, namespace: 'mock' } : undefined);
      build.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: mocks[args.path], loader: 'js' }));
    } }],
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://database.example.invalid';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'synthetic-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-service-key';
  global.__warmupExperience = { session: () => ({
    user: { id: studentId, email: 'student@example.invalid' },
    ...(preview ? { experience: { id: 'walkthrough', readOnly: true } } : {}),
  }) };
  const routes = require(output);
  const originalFetch = global.fetch;
  global.Date = SchoolClock;
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  routes.registerExperienceDatabaseGuard(async () => preview);
  global.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    assert.equal(url.origin, 'https://database.example.invalid');
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    requests.push({ path: url.pathname, method });
    const table = url.pathname.split('/').at(-1);
    if (table === 'math_daily_xp_status') {
      assert.deepEqual(JSON.parse(init.body), { p_user: studentId });
      return xpFailure ? Response.json({ code: 'DATABASE_UNAVAILABLE', message: 'offline' }, { status: 400 }) : Response.json(xp);
    }
    if (table === 'submit_math_warmup') return Response.json({ self_check: 'match', xpEarned: 1, xpAwarded: 1 });
    if (table === 'course_students') return Response.json([{course_id:'course'}]);
    if (table === 'courses') return Response.json([{id:'course'}]);
    if (table === 'calendar_warmups') return Response.json([{day:'2026-10-13'},{day:'2026-10-15'}]);
    if (table === 'math_competencies') return Response.json([{ id: 'skill', code: 'NS1', statement: 'Compare numbers', strand: 'number', sequence_order: 1, order_index: 1 }]);
    if (table === 'math_warmup_submissions') return Response.json(submission ? [submission] : []);
    if (table === 'math_spiral_items') return Response.json([{ id: 'problem', prompt: 'Travel 12 m in 4 s. What is the speed?', answer_key: '3 m/s', check_mode: 'numeric' }]);
    if (table === 'math_warmup_instances') {
      if (method === 'POST') {
        assert.equal(preview, false, 'Walkthrough must never issue a task');
        issued = { ...JSON.parse(init.body), id: 'issued-task' };
        return new Response(null, { status: 201 });
      }
      if (issued?.school_day && url.searchParams.get('school_day')!== 'eq.'+issued.school_day) return Response.json(null);
      return Response.json(issued ? { id: issued.id, item: issued.item, checking: { key: '3 m/s', mode: 'numeric' } } : null);
    }
    return Response.json([]);
  };
  async function daily() {
    requests = [];
    const response = await routes.GET(new Request('https://app.example.invalid/api/math-spine/daily'), { params: Promise.resolve({}) });
    return { status: response.status, body: await response.json() };
  }
  function assertReadOnly() {
    assert(requests.every(r => r.method === 'GET' || r.path.endsWith('/rpc/math_daily_xp_status')), 'Preview sent a database write');
  }
  try {
    let result = await daily();
    assert.equal(result.status, 200, JSON.stringify({ body: result.body, errors }));
    assert.match(result.body.item.prompt, /12 m/);
    assert.deepEqual(result.body.xpStatus, xp);
    assert.equal(result.body.item.instanceId, undefined);
    assert.equal(issued, null);
    assertReadOnly();
    console.log('PASS walkthrough loads a new daily warm-up and real XP helper without issuing a task');

    issued = { id: 'saved-task', item: { competencyId: 'skill', spiralItemId: 'saved-problem', prompt: 'Previously issued prompt' } };
    result = await daily();
    assert.equal(result.status, 200);
    assert.equal(result.body.item.instanceId, 'saved-task');
    assert.equal(result.body.item.prompt, 'Previously issued prompt');
    assert.deepEqual(result.body.xpStatus, xp);
    assert(!JSON.stringify(result.body).includes('3 m/s'));
    assertReadOnly();
    console.log('PASS walkthrough preserves an existing task and hides the answer key');

    submission = { id: 'submission', competency_id: 'skill', self_check: 'mismatch', status: 'pending', resulting_level: null, submitted_at: new Date().toISOString() };
    result = await daily();
    assert.equal(result.status, 200);
    assert.equal(result.body.alreadySubmitted, true);
    assert.equal(result.body.remediation.code, 'NS1');
    assert.match(result.body.remediation.href, /numberline-navigator/);
    assertReadOnly();
    console.log('PASS a saved incorrect warm-up restores its same-skill game recommendation');
    submission = { ...submission, status: 'reviewed', resulting_level: 3 };
    result = await daily();
    assert.equal(result.body.remediation, null);
    submission = null;
    console.log('PASS teacher confirmation supersedes an automatic mismatch');

    const before = requests.length;
    for (const endpoint of ['math_warmup_instances', 'rpc/submit_math_warmup', 'rpc/grant_math_practice_rep', 'rpc/unknown_future_write']) {
      const response = await routes.experienceDatabaseFetch('https://database.example.invalid/rest/v1/' + endpoint, { method: 'POST', body: '{}' });
      assert.equal(response.status, 403);
    }
    assert.equal(requests.length, before);
    console.log('PASS submissions, XP grants, and unknown writes remain blocked before reaching the database');

    preview = false;
    issued = null;
    result = await daily();
    assert.equal(result.status, 200);
    assert.equal(result.body.item.instanceId, 'issued-task');
    assert.deepEqual(result.body.xpStatus, xp);
    assert(requests.some(r => r.path.endsWith('/math_warmup_instances') && r.method === 'POST'));
    console.log('PASS regular student sessions still issue and load a daily task');

    const submit = () => routes.POST(new Request('https://app.example.invalid/api/math-spine/warmup-submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instance_id: 'issued-task', response_json: { answer: '3 m/s', work: '12 divided by 4 is 3.', workStrokes: [], workTexts: [], sandbox: { lines: [] } } }),
    }), { params: Promise.resolve({}) });
    for (let day = 11; day <= 17; day++) {
      now = `2026-10-${day}T16:00:00Z`;
      result = await daily();
      const scheduled = day === 13 || day === 15;
      assert.equal(result.status, 200);
      assert.equal(result.body.warmupScheduled, scheduled);
      if (scheduled) assert(result.body.item?.instanceId);
      else {
        assert.equal(result.body.item, null);
        assert.equal(result.body.alreadySubmitted, false);
        assert(requests.every(r=>['course_students','courses','calendar_warmups'].includes(r.path.split('/').at(-1))&&r.method==='GET'),'An unassigned day must only check the calendar');
      }
      requests = [];
      const response = await submit();
      assert.equal(response.status, scheduled ? 200 : 409, now + ': ' + await response.text());
      if (!scheduled) assert(requests.every(r=>r.method==='GET'), 'An unassigned-day submission must not write evidence or XP');
    }
    now = '2026-10-14T16:00:00Z';
    preview = true;
    result = await daily();
    assert.equal(result.body.item, null);
    assert(requests.every(r=>r.method==='GET'));
    console.log('PASS all seven days: only explicitly assigned calendar dates issue tasks or accept submissions; walkthrough respects off days');
    now = '2026-10-13T16:00:00Z';

    preview = true;
    xpFailure = true;
    result = await daily();
    assert.equal(result.status, 500);
    assert.equal(result.body.error, 'Internal server error');
    assert.equal(errors.length, 1);
    console.log('PASS genuine XP lookup failures stay visible instead of returning invented totals');
  } finally {
    global.fetch = originalFetch;
    global.Date = RealDate;
    console.error = originalError;
    routes.registerExperienceDatabaseGuard(async () => false);
    delete global.__warmupExperience;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
