const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build } = require('esbuild');
const { fx, uuid, bundle, reset, context, root } = require('./fixture.cjs');
process.env.BACKEND_TIMING_SAMPLE_RATE = '0';
const baseline = process.env.POLLING_BASELINE;
assert(baseline, 'Set POLLING_BASELINE to the saved pre-change source.');
const checks = [], reductions = [];
const check = async (name, fn) => { await fn(); checks.push(name); };
const user = uuid(2), other = uuid(3), courseId = uuid(10), archived = uuid(11), inactive = uuid(12), foreign = uuid(13), teacher = uuid(90);
const course = (id, archived_at = null) => ({ id, name: 'Fictional Physics', section: id.slice(-2), archived_at, track: 'cpa', program: 'physics' });
const member = (id, student_id, course_id, enrollment_state = 'ACTIVE') => ({ id: uuid(id), student_id, course_id, enrollment_state });
const session = (n, course_id = courseId, teacher_id = teacher) => ({ id: uuid(n), course_id, teacher_id, lesson_id: 'lesson', status: 'live', updated_at: `2026-10-28T12:00:${String(n % 60).padStart(2, '0')}Z`, created_at: '2026-10-28T12:00:00Z', command_revision: n, current_slide: 2, current_section: 1, current_anchor: 'q', poll_run_id: 'run', poll_block_id: 'q', poll_locked: false, poll_revealed: false, blackout: false, timer_ends_at: null });
const base = () => ({ courses: [course(courseId), course(archived, '2026-10-01T00:00:00Z'), course(inactive), course(foreign)], course_students: [member(100, user, courseId), member(101, user, archived), member(102, user, inactive, 'INACTIVE'), member(103, other, inactive), member(104, other, foreign)] });
const request = (route, query = '') => new Request('http://localhost/api/present/' + route + query);
const invoke = (api, route, ctx = context(), query = route === 'live' ? '?lesson_id=lesson' : '') => fx.context.run(ctx, () => api[route](request(route, query), { params: Promise.resolve({}) }));
const entry = `export {GET as live} from './src/app/api/present/live/route'; export {GET as invitations} from './src/app/api/present/invitations/route'; export * from './src/lib/request-runtime'; export {getGrantedRole} from './src/lib/roles'; export * from './src/lib/student-context';`;
(async () => {
  const current = await bundle('poll-current', entry), before = await bundle('poll-before', entry, baseline);
  fx.lesson = { slug: 'fictional', original: { blocks: [] }, content_blocks: { blocks: [] } };
  async function compare(route, rows, ctx = context(), query) {
    reset(rows); const protectedRows = structuredClone(fx.rows);
    const old = await invoke(before, route, ctx, query), oldJson = await old.json(), oldCalls = structuredClone(fx.calls);
    fx.calls = []; const next = await invoke(current, route, ctx, query), nextJson = await next.json(), nextCalls = structuredClone(fx.calls);
    assert.equal(next.status, old.status); assert.deepEqual(nextJson, oldJson); assert.deepEqual(fx.rows, protectedRows, 'Read paths must not mutate any fixture records.');
    assert(!JSON.stringify(nextJson).includes('student_id')); assert(!JSON.stringify(nextJson).includes('salt'));
    return { data: nextJson, status: next.status, oldCalls, nextCalls };
  }
  await check('idle polling removes one database round trip per route', async () => {
    for (const route of ['live', 'invitations']) {
      const r = await compare(route, base());
      assert.equal(r.nextCalls.length, r.oldCalls.length - 1);
      reductions.push({ route, handlerReadsBefore: r.oldCalls.length, handlerReadsAfter: r.nextCalls.length, note: 'Auth role read is mocked in this API fixture and remains fresh in production.' });
    }
  });
  await check('active live payload, newest session, classless and other-class isolation', async () => {
    const rows = { ...base(), present_sessions: [session(20), session(21, null), session(22, inactive), session(23, foreign), session(19, archived)] };
    const pulse = { id: uuid(50), session_id: uuid(20), salt: 'private-salt', kind: 'poll', anonymous: true, status: 'open', created_at: '2026-10-28T12:00:00Z', prompt: 'Ready?', options: ['Yes'], locked: false, revealed: false, required: false, target_id: null };
    rows.present_pulses = [pulse];
    rows.present_pulse_responses = [{ pulse_id: pulse.id, respondent_key: require('node:crypto').createHash('md5').update(pulse.salt + user).digest('hex'), choice: 'Yes' }];
    rows.present_help_requests = [{ session_id: uuid(20), user_id: user, resolved_at: null }];
    const r = await compare('live', rows); assert.equal(r.data.session.id, uuid(20)); assert.equal(r.data.session.pulseChoice, 'Yes'); assert.equal(r.data.session.helpRequested, true);
    assert.equal(r.nextCalls.length, r.oldCalls.length - 1);
    const query = r.nextCalls.find(c => c.table === 'present_sessions');
    assert(query.fields.includes('courses!inner(course_students!inner(student_id))'));
    assert.deepEqual(query.conditions.filter(([, k]) => k.startsWith('courses.')), [['eq', 'courses.course_students.student_id', user], ['eq', 'courses.course_students.enrollment_state', 'ACTIVE']]);
    assert.equal(query.end, 5);
    rows.present_sessions = [session(19, archived)]; assert.equal((await compare('live', rows)).data.session.id, uuid(19), 'Live keeps existing access to active membership in archived courses.');
  });
  await check('teacher, observer and admin view-as retain own-session scope', async () => {
    for (const role of ['teacher', 'observer', 'admin']) {
      const ctx = context(teacher, role); if (role === 'admin') { ctx.role = 'teacher'; ctx.viewingAsTeacher = true; ctx.scopeEmail = 'colleague@example.test'; }
      const r = await compare('live', { ...base(), present_sessions: [session(20, null), session(25, courseId, other)] }, ctx);
      assert.equal(r.data.session.id, uuid(20)); assert(!r.nextCalls.some(c => c.table === 'course_students'));
      assert(!r.nextCalls.find(c => c.table === 'present_sessions').fields.includes('!inner'));
    }
  });
  await check('invitations retain active/unarchived scope, completions and payload', async () => {
    const rows = { ...base(), present_sessions: [session(20), session(21, archived), session(22, inactive), session(23, foreign)] };
    rows.present_pulses = [20, 21, 22, 23].map(n => ({ id: uuid(n + 50), session_id: uuid(n), salt: 'private-salt', kind: 'poll', anonymous: true, status: 'open', created_at: '2026-10-28T12:00:00Z', prompt: 'Ready?', locked: false, required: false }));
    rows.lobby_sessions = [{ id: uuid(80), present_session_id: uuid(20), code: 'fictional', task_prompt: 'Discuss', status: 'lobby', created_at: '2026-10-28T12:00:00Z' }];
    const r = await compare('invitations', rows); assert.equal(r.data.invitations.length, 2); assert(r.data.invitations.every(x => x.sessionId === uuid(20)));
    assert.equal(r.nextCalls.length, r.oldCalls.length - 1); assert(!r.nextCalls.some(c => c.table === 'courses'));
    rows.lobby_members = [{ session_id: uuid(80), user_id: user }]; rows.present_pulse_responses = [{ pulse_id: uuid(70), respondent_key: require('node:crypto').createHash('md5').update('private-salt' + user).digest('hex') }];
    assert.deepEqual((await compare('invitations', rows)).data, { invitations: [] });
  });
  await check('fresh enrollment and permission changes, pagination and request isolation', async () => {
    reset({ ...base(), user_roles: [{ email: 'grant@example.test', role: 'teacher' }], present_sessions: [session(20)] });
    await current.runApiRequest(request('live'), async () => {
      assert.equal(await current.getGrantedRole('grant@example.test'), 'teacher'); assert.equal(await current.getGrantedRole('grant@example.test'), 'teacher'); return Response.json({});
    });
    assert.equal(fx.calls.filter(c => c.table === 'user_roles').length, 1);
    fx.rows.user_roles = [];
    await current.runApiRequest(request('live'), async () => { assert.equal(await current.getGrantedRole('grant@example.test'), null); return Response.json({}); });
    const replies = await Promise.all([invoke(current, 'live', context(user)), invoke(current, 'live', context(other))]);
    assert((await replies[0].json()).session); assert.equal((await replies[1].json()).session, null);
    fx.rows.course_students = []; assert.deepEqual(await (await invoke(current, 'live')).json(), { session: null }); assert.equal((await invoke(current, 'invitations')).status, 403);
    const rows = base(); rows.course_students = Array.from({ length: 1005 }, (_, i) => member(1000 + i, user, courseId));
    reset(rows); assert.equal((await current.studentInvitationCourses(user)).length, 1); assert.equal(fx.calls.length, 3);
  });
  await check('inactive-only, unrostered, invalid input and joined failures stay closed', async () => {
    for (const route of ['live', 'invitations']) {
      for (const members of [[], [member(1, user, inactive, 'INACTIVE')]]) await compare(route, { ...base(), course_students: members, present_sessions: [session(20, inactive)] });
      assert.equal((await invoke(current, route, null)).status, 401);
    }
    assert.equal((await invoke(current, 'live', context(), '')).status, 400);
    for (const table of ['course_students', 'courses', 'present_sessions']) {
      reset({ ...base(), present_sessions: [session(20)] }); fx.fail.add(table);
      assert.equal((await invoke(current, 'live')).status, 503);
    }
    reset(base()); fx.fail.add('course_students'); assert.equal((await invoke(current, 'invitations')).status, 403);
  });
  // Exercise the real fetch wrapper and preview guard, with all network replaced.
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'polling-transport-')), file = path.join(temp, 'transport.cjs');
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'fictional-service-key';
  await build({ stdin: { contents: `export * from './src/lib/request-runtime'; export {lookupDatabaseFetch} from './src/lib/lookup-database'; export {registerExperienceDatabaseGuard} from './src/lib/experience-db-fetch';`, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', outfile: file, plugins: [{ name: 'no-network-client', setup(b) {
    b.onResolve({ filter: /^(server-only|@supabase\/supabase-js)$/ }, a => ({ path: a.path, namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, a => ({ contents: a.path === 'server-only' ? '' : 'export const createClient=()=>({});', loader: 'js' }));
  } }] });
  const transport = require(file), originalFetch = global.fetch, originalInfo = console.info, logs = [];
  console.info = (...args) => logs.push(JSON.parse(args[1]));
  try {
    await check('slow transports log safe category, headers and upstream timing below one second', async () => {
      global.fetch = async () => { await new Promise(r => setTimeout(r, 510)); return Response.json({ privateAnswer: 'do not log' }, { headers: { 'x-envoy-upstream-service-time': '1', 'x-private': 'secret' } }); };
      const response = await transport.runApiRequest(request('invitations', '?student=private-id'), async () => {
        const data = await transport.observedLookup('roles', async () => (await transport.lookupDatabaseFetch('https://fixture.supabase.co/rest/v1/user_roles?email=eq.private@example.test', { headers: { Authorization: 'Bearer secret' } })).json());
        assert.equal(data.privateAnswer, 'do not log'); return Response.json({ ok: true });
      });
      assert.match(response.headers.get('server-timing'), /db_roles;dur=/); assert.equal(logs.length, 1);
      assert.equal(logs[0].lookups.roles.slowCount, 1); assert.equal(logs[0].lookups.roles.upstreamMs, 1); assert.equal(logs[0].lookups.roles.errors, 0);
      assert(!/private-id|privateAnswer|private@example|secret|do not log/.test(JSON.stringify(logs)));
    });
    await check('transport errors and malformed timing headers cannot disappear or change results', async () => {
      global.fetch = async () => Response.json({ message: 'private' }, { status: 503, headers: { 'x-envoy-upstream-service-time': 'NaN-private' } });
      await transport.runApiRequest(request('live'), async () => { const r = await transport.lookupDatabaseFetch('https://fixture.supabase.co/rest/v1/present_sessions'); assert.equal(r.status, 503); return Response.json({}); });
      assert.equal(logs.at(-1).lookups.poll_sessions.errors, 1); assert.equal(logs.at(-1).lookups.poll_sessions.upstreamCount, 0);
      global.fetch = async () => { throw Error('private network error'); };
      await transport.runApiRequest(request('live'), async () => { await assert.rejects(transport.lookupDatabaseFetch('https://fixture.supabase.co/rest/v1/course_students')); return Response.json({}); });
      assert.equal(logs.at(-1).lookups.memberships.errors, 1); assert(!JSON.stringify(logs).includes('private network error'));
    });
    await check('write-preview guard, unrelated queries and concurrent telemetry remain isolated', async () => {
      let sends = 0; global.fetch = async () => { sends++; return Response.json({}); };
      transport.registerExperienceDatabaseGuard(async () => true);
      const blocked = await transport.lookupDatabaseFetch('https://fixture.supabase.co/rest/v1/mastery_records', { method: 'POST', body: '{}' });
      assert.equal(blocked.status, 403); assert.equal(sends, 0);
      transport.registerExperienceDatabaseGuard(async () => false);
      const count = logs.length;
      await transport.runApiRequest(request('live'), async () => { await transport.lookupDatabaseFetch('https://fixture.supabase.co/rest/v1/untracked?email=private'); return Response.json({}); });
      assert.equal(logs.length, count);
      process.env.BACKEND_TIMING_SAMPLE_RATE = '1';
      await Promise.all(['user_roles', 'course_students'].map(table => transport.runApiRequest(request('live'), async () => { await transport.lookupDatabaseFetch('https://fixture.supabase.co/rest/v1/' + table); return Response.json({}); })));
      assert.deepEqual(logs.slice(-2).map(x => Object.keys(x.lookups)[0]).sort(), ['memberships', 'roles']);
    });
  } finally { global.fetch = originalFetch; console.info = originalInfo; process.env.BACKEND_TIMING_SAMPLE_RATE = '0'; }
  console.log(JSON.stringify({ passed: checks.length, checks, reductions, recordsUnchanged: true }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
