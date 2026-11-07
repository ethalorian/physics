const assert = require('node:assert/strict');
const { fx, uuid, bundle, reset, context } = require('./fixture.cjs');
process.env.BACKEND_TIMING_SAMPLE_RATE = '0';
const courseId = uuid(1), user = uuid(2), other = uuid(3), target = uuid(4), assignment = uuid(10), subId = uuid(20);
const timestamp = '2026-10-28T12:00:00Z';
const course = { id: courseId, name: 'Physics', section: 'A', program: 'physics', track: 'cpa', teacher_email: 'teacher@example.test', archived_at: null };
const member = (id, state = 'ACTIVE') => ({ id, student_id: id, course_id: courseId, enrollment_state: state, courses: { track: 'cpa', program: 'physics' }, students: { name: 'Fictional ' + id, is_active: true } });
const base = () => ({ courses: [course], course_students: [member(user), member(other)], learning_targets: [{ id: target, slug: 'target', statement: 'Explain motion.', unit_id: 'unit-1', lesson_id: null, program: 'physics' }], units: [{ id: 'unit-1', name: 'Motion', program: 'physics' }] });
const checks = [], reductions = [];
const check = (name, fn) => Promise.resolve().then(fn).then(() => checks.push(name));
const json = () => Response.json({ ok: true });
(async () => {
  const api = await bundle('current', `
    export * from './src/lib/request-runtime';
    export * from './src/lib/student-context';
    export * from './src/lib/student-enrollment';
    export {readingCourses} from './src/lib/textbook-assignments-server';
    export {getGrantedRole} from './src/lib/roles';
    export {withAuth,withRole,withEnrolledStudent} from './src/lib/api-auth';
    export {loadAssessmentResults,loadReviewResults} from './src/lib/assessment-results/server';
    export {loadReview} from './src/lib/review-desk/sources';
    export {ALL_ASSIGNMENTS} from './src/lib/interactive-assignments/catalog';
    export {GET as live} from './src/app/api/present/live/route';
    export {GET as invitations} from './src/app/api/present/invitations/route';
  `);
  const request = (method = 'GET', path = '/api/review-desk') => new Request('http://localhost' + path, { method });
  await check('concurrent read deduplication, isolation and fresh next request', async () => {
    let reads = 0;
    const run = label => api.runApiRequest(request(), async () => {
      const read = async () => { reads++; await new Promise(resolve => setTimeout(resolve, 5)); return label; };
      assert.deepEqual(await Promise.all([api.requestRead('same', read), api.requestRead('same', read)]), [label, label]);
      return json();
    });
    await Promise.all([run('student A'), run('student B')]);
    assert.equal(reads, 2); await run('fresh'); assert.equal(reads, 3);
  });
  await check('writes, nested requests, failed reads and background work do not reuse stale reads', async () => {
    let reads = 0, later;
    const read = async () => ++reads;
    await api.runApiRequest(request('POST'), async () => { await api.requestRead('k', read); await api.requestRead('k', read); return json(); });
    assert.equal(reads, 2);
    await api.runApiRequest(request(), async () => {
      await api.requestRead('k', read);
      await api.runApiRequest(request(), async () => { await api.requestRead('k', read); return json(); });
      await api.requestRead('k', read); assert.equal(reads, 4);
      await assert.rejects(api.requestRead('failure', async () => { throw Error('retry me'); }));
      assert.equal(await api.requestRead('failure', async () => 'recovered'), 'recovered');
      later = new Promise(resolve => setTimeout(async () => { await api.requestRead('k', read); resolve(); }, 10));
      return json();
    });
    await later; assert.equal(reads, 5);
  });
  await check('timings cover success, authentication failure, authorization failure and exceptions', async () => {
    const auth = api.withAuth(async () => json()), role = api.withRole('teacher', async () => json());
    for (const [ctx, handler, expected] of [[null, auth, 401], [context(), role, 403], [context(user, 'teacher'), role, 200], [{ ...context(), failContext: true }, auth, 500]]) {
      const response = await fx.context.run(ctx, () => handler(request(), { params: Promise.resolve({}) }));
      assert.equal(response.status, expected); assert.match(response.headers.get('server-timing'), /total;dur=/);
    }
    const preview = context(); preview.session.experience = { id: 'preview' };
    assert.equal((await fx.context.run(preview, () => auth(request('POST')))).status, 403);
    assert.equal((await api.runApiRequest(request(), async () => Response.redirect('https://example.test'))).status, 302);
    const logged = [], original = console.info;
    console.info = (...args) => logged.push(args.join(' '));
    try { process.env.BACKEND_TIMING_SAMPLE_RATE = '1'; await api.runApiRequest(request('GET', '/api/private-student-id?email=secret@example.test'), async () => json()); }
    finally { console.info = original; process.env.BACKEND_TIMING_SAMPLE_RATE = '0'; }
    assert.equal(logged.length, 1); assert(!logged[0].includes('private-student-id')); assert(!logged[0].includes('secret'));
  });
  await check('enrollment, track, program, active memberships, roles and class access reuse safe reads', async () => {
    reset({ ...base(), user_roles: [{ email: 'teacher@example.test', role: 'teacher' }] });
    fx.rows.course_students.push({ ...member(uuid(5), 'INACTIVE'), student_id: user, courses: [{ track: 'honors', program: 'trades' }] });
    const before = structuredClone(fx.rows);
    await api.runApiRequest(request(), async () => {
      const results = await Promise.all([api.getEnrollment(user), api.getStudentTrack(user), api.studentProgram(user), api.activeStudentCourseIds(user), api.readingCourses(context(user, 'teacher')), api.readingCourses(context(user, 'teacher')), api.getGrantedRole('teacher@example.test'), api.getGrantedRole('teacher@example.test')]);
      assert.equal(results[0].courseCount, 2); assert.equal(results[1], 'honors'); assert.equal(results[2], 'trades'); assert.deepEqual(results[3], [courseId]);
      assert.equal(fx.calls.filter(c => c.table === 'course_students').length, 1); assert.equal(fx.calls.filter(c => c.table === 'courses').length, 1); assert.equal(fx.calls.filter(c => c.table === 'user_roles').length, 1);
      assert.equal((await api.readingCourses({ ...context(user, 'teacher'), scopeEmail: 'another@example.test' })).length, 0);
      return json();
    });
    assert.deepEqual(fx.rows, before, 'lookup paths must not mutate data');
    fx.rows.user_roles = []; fx.rows.course_students = [];
    await api.runApiRequest(request(), async () => { assert.equal(await api.getGrantedRole('teacher@example.test'), null); assert.equal((await api.getEnrollment(user)).enrolled, false); return json(); });
  });
  await check('membership pagination and fail-closed database failures', async () => {
    reset({ course_students: Array.from({ length: 1005 }, (_, i) => ({ ...member(uuid(i + 30)), student_id: user })) });
    assert.equal((await api.getEnrollment(user)).courseCount, 1005); assert.equal(fx.calls.length, 3);
    fx.fail.add('course_students');
    assert.equal((await api.getEnrollment(user)).enrolled, false);
    await assert.rejects(api.activeStudentCourseIds(user));
  });
  const old = process.env.BACKEND_PERFORMANCE_BASELINE ? await bundle('before', `
    export {loadReview} from './src/lib/review-desk/sources';
    export {loadAssessmentResults} from './src/lib/assessment-results/server';
    export {GET as live} from './src/app/api/present/live/route';
    export {GET as invitations} from './src/app/api/present/invitations/route';
  `, process.env.BACKEND_PERFORMANCE_BASELINE) : null;
  for (const kind of ['quiz', 'reading', 'math']) await check(kind + ' review keeps the exact document and isolates requested work', async () => {
    const rows = base();
    const q = { id: 'q', kind: 'written', target_id: target, prompt: 'Explain.', points: 4 };
    if (kind === 'math') {
      rows.math_competencies = [{ id: assignment, code: 'M1', statement: 'Estimate.', is_active: true }, { id: uuid(11), code: 'M2', statement: 'Calculate.', is_active: true }];
      rows.math_warmup_submissions = [user, other].map(u => ({ id: u === user ? subId : uuid(21), user_id: u, competency_id: uuid(11), tested_competency_ids: [assignment, uuid(11)], status: 'pending', prompt: 'Estimate.', response: '12', submitted_at: timestamp }));
      rows.math_competency_records = [{ id: uuid(50), user_id: user, competency_id: assignment, level: 2, observed_at: timestamp }];
    } else {
      const prefix = kind === 'quiz' ? 'quiz' : 'textbook', field = kind === 'quiz' ? 'quiz_id' : 'assignment_id';
      rows[prefix + '_assignments'] = [assignment, uuid(11)].map(id => ({ id, course_id: courseId, title: 'Fictional work', status: 'active', questions: [q], grade_mode: 'numeric', due_at: timestamp, created_at: timestamp }));
      rows[prefix + '_work'] = [user, other].map(u => ({ [field]: assignment, user_id: u, submission_id: u === user ? subId : uuid(21), state: 'submitted', version: 1, updated_at: timestamp }));
      rows[prefix + '_submissions'] = [user, other].map(u => ({ id: u === user ? subId : uuid(21), [field]: assignment, user_id: u, submitted_at: timestamp, snapshot: { title: 'Fictional work', grade_mode: 'numeric', questions: [q] }, answers: { q: 'The position changes.' } }));
    }
    reset(rows); const before = structuredClone(fx.rows), ctx = context(uuid(90), 'teacher'), key = kind + ':' + assignment;
    const result = await api.loadReview(ctx, courseId, key, user);
    assert(result.doc.evidence.length); assert.equal(result.doc.userId, user); assert.equal(result.doc.canRelease, true);
    const newCalls = structuredClone(fx.calls);
    assert(!newCalls.some(c => kind !== 'quiz' && c.table === 'quiz_assignments'));
    assert(!newCalls.some(c => kind !== 'reading' && c.table === 'textbook_assignments'));
    if (kind === 'math') assert(newCalls.filter(c => c.table.startsWith('math_') && c.table !== 'math_competencies').every(c => c.conditions.some(([op, col, value]) => col === 'user_id' && (op === 'in' ? value.length === 1 && value[0] === user : value === user)) || c.conditions.some(([, col, value]) => (col === 'id' || col === 'submission_id') && value === subId)));
    if (old) {
      fx.calls = []; const previous = await old.loadReview(ctx, courseId, key, user);
      assert.deepEqual(result.doc, previous.doc, 'review document must remain identical');
      reductions.push({ operation: kind + ' review', before: fx.calls.length, after: newCalls.length });
      assert(newCalls.length < fx.calls.length);
      // Ordinary class Results and the existing student-progress behavior are unchanged.
      const full = await api.loadAssessmentResults(ctx, course, 'all');
      assert.deepEqual(full.warnings, []);
      assert.deepEqual(full, await old.loadAssessmentResults(ctx, course, 'all'));
    }
    assert.deepEqual(fx.rows, before, 'work, grades and drafts are unchanged');
    await assert.rejects(api.loadReview(ctx, courseId, key, user, 'obsolete-attempt'));
    await assert.rejects(api.loadReview({ ...ctx, scopeEmail: 'unauthorized@example.test' }, courseId, key, user));
    fx.calls = []; fx.rows.course_students = [member(other)];
    await assert.rejects(api.loadReview(ctx, courseId, key, user));
    assert(!fx.calls.some(c => c.table.includes('_work') || c.table.includes('_submissions')));
  });
  for (const kind of ['interactive', 'review', 'vocabulary', 'video', 'lesson', 'reflection', 'presentation', 'choice']) await check(kind + ' provider retains review state and evidence mapping', async () => {
    const rows = base(); let key = kind + ':' + assignment;
    if (kind === 'interactive') {
      const lesson = api.ALL_ASSIGNMENTS.find(a => !a.simulation && a.targets.length);
      rows.learning_targets[0].slug = lesson.targets[0]; rows.learning_targets[0].unit_id = lesson.unit;
      rows.interactive_assignments = [{ id: assignment, course_id: courseId, slug: lesson.slug, due_on: timestamp }];
      rows.interactive_assignment_work = [{ assignment_id: assignment, user_id: user, status: 'submitted', version: 1 }];
      rows.interactive_assignment_submissions = [{ id: subId, assignment_id: assignment, user_id: user, version: 1, submitted_at: timestamp }];
    } else if (kind === 'review') {
      key = 'review:review-test';
      rows.review_module_assignments = [{ slug: 'review-test', course_ids: [courseId], title: 'Review', due_on: timestamp }];
      rows.review_module_work = [{ module_slug: 'review-test', user_id: user, version: 1, status: 'submitted', submitted_at: timestamp, state: { responses: { q: 'Reason.' } } }];
    } else if (kind === 'vocabulary') {
      rows.vocab_tasks = [{ id: assignment, course_id: courseId, title: 'Vocabulary', student_ids: [user], active: true, target_id: target, term_ids: ['word'], min_checks: 1, threshold: 80, task_kind: 'quiz', quiz_format: 'definition' }];
      rows.vocab_checks = [{ id: subId, task_id: assignment, user_id: user, completed_at: timestamp, result: [{ term_id: 'word', term: 'Speed', response: 'Distance per time', correct: null }] }];
    } else if (['video', 'lesson', 'reflection'].includes(kind)) {
      const blocks = [{ id: 'q', type: 'question', targetId: 'target', question: { prompt: 'Explain.' } }, ...(kind === 'video' ? [{ id: 'v', type: 'instruction_video', youtubeId: 'video', durationSeconds: 60 }] : [])];
      rows.lessons = [assignment, uuid(11)].map(id => ({ id, title: 'Lesson ' + id, slug: 'lesson-' + id, unit_id: 'unit-1', published: true, visibility_track: 'all', content_blocks: { blocks, presentation: 'physics-path', learningPath: {}, ...(kind === 'reflection' ? { reflection: { version: 1, kind: 'story' } } : {}) } }));
      rows.lesson_class_windows = rows.lessons.map(l => ({ course_id: courseId, lesson_id: l.id, due_at: timestamp }));
      rows.lesson_submissions = rows.lessons.map((l, i) => ({ id: i ? uuid(21) : subId, user_id: user, lesson_id: l.id, submitted_at: timestamp }));
      rows.mastery_evidence_reviews = [{ id: uuid(41), user_id: user, lesson_id: uuid(11), target_id: target, evidence: [] }];
    } else if (kind === 'presentation') {
      rows.present_sessions = [{ id: uuid(40), course_id: courseId, plan_unit_id: 'unit-1', plan_day: 1 }];
      rows.present_pulses = [{ id: assignment, session_id: uuid(40), kind: 'warmup', target_id: target, required: true, prompt: 'Explain.', created_at: timestamp }];
      rows.present_ticket_responses = [{ id: subId, pulse_id: assignment, user_id: user, created_at: timestamp }];
    } else {
      key = 'choice:' + uuid(30) + ':' + assignment;
      rows.choice_sections = [{ id: uuid(30), course_id: courseId, title: 'Choices', published: true, published_at: timestamp, due_at: '2099-01-01T00:00:00Z', opens_at: timestamp, required_count: 1, points_per_choice: 10, category_minimums: {}, options: [{ id: assignment, title: 'Read and explain', category: 'reading', lab: false, targetIds: [target], steps: [{ id: 'read', kind: 'reading', sourceId: assignment, title: 'Read', followUp: false }] }] }];
      rows.choice_selections = [{ section_id: uuid(30), option_id: assignment, user_id: user, selected: true, artifact_submitted_at: timestamp, artifact_version: 1, score: 0, updated_at: timestamp }];
      rows.textbook_assignments = [{ id: assignment, course_id: courseId, title: 'Reading', status: 'published', questions: [{ id: 'q', target_id: target }], due_at: timestamp }];
      rows.textbook_work = [{ assignment_id: assignment, user_id: user, state: 'submitted', submission_id: subId, updated_at: timestamp }];
    }
    reset(rows); const ctx = context(uuid(90), 'teacher'), before = structuredClone(fx.rows);
    const result = await api.loadReviewResults(ctx, course, key, user);
    assert.deepEqual(result.warnings, []);
    const flatten = activities => activities.flatMap(a => [a, ...flatten(a.evidenceActivities ?? [])]);
    const selected = flatten(result.activities).find(a => a.key === key);
    assert(selected, key); assert(selected.cells[user]); assert(!selected.cells[other]);
    if (old) {
      const previous = await old.loadAssessmentResults(ctx, course, 'all', { studentId: user });
      assert.deepEqual(previous.warnings, []);
      assert.deepEqual(selected, flatten(previous.activities).find(a => a.key === key));
    }
    assert.deepEqual(fx.rows, before);
  });
  await check('live polling preserves payload, teacher/student scope and salt privacy with fewer reads', async () => {
    const pulse = { id: uuid(30), session_id: uuid(40), kind: 'poll', anonymous: true, status: 'open', created_at: timestamp, prompt: 'Ready?', options: ['Yes'], required: false, locked: false, revealed: false, target_id: null, salt: 'private-salt' };
    const rows = { ...base(), present_sessions: [{ id: uuid(40), course_id: courseId, teacher_id: uuid(90), lesson_id: 'lesson', status: 'live', updated_at: timestamp, command_revision: 2 }], present_pulses: [pulse] };
    reset(rows); fx.lesson = { slug: 'lesson', original: { blocks: [] }, content_blocks: { blocks: [] } };
    const call = impl => fx.context.run(context(), () => impl.live(request('GET', '/api/present/live?lesson_id=lesson')));
    const current = await call(api), data = await current.json(), count = fx.calls.length;
    assert.equal(current.status, 200); assert(data.session); assert(!JSON.stringify(data).includes('salt'));
    if (old) { fx.calls = []; assert.deepEqual(data, await (await call(old)).json()); reductions.push({ operation: 'live poll', before: fx.calls.length, after: count }); assert.equal(count, fx.calls.length - 1); }
    fx.rows.course_students = []; assert.deepEqual(await (await call(api)).json(), { session: null });
    fx.calls = []; assert((await (await fx.context.run(context(uuid(90), 'teacher'), () => api.live(request('GET', '/api/present/live?lesson_id=lesson')))).json()).session);
    assert(!fx.calls.some(c => c.table === 'course_students'));
    fx.fail.add('course_students'); assert.equal((await call(api)).status, 503);
  });
  await check('invitation polling reuses its enrollment gate and retains its payload', async () => {
    reset({ ...base(), present_sessions: [{ id: uuid(40), course_id: courseId, status: 'live', created_at: timestamp }], present_pulses: [{ id: uuid(30), session_id: uuid(40), kind: 'poll', anonymous: true, status: 'open', locked: false, salt: 'private', prompt: 'Ready?', created_at: timestamp }] });
    const call = impl => fx.context.run(context(), () => impl.invitations(request('GET', '/api/present/invitations')));
    const data = await (await call(api)).json(), count = fx.calls.length;
    assert.equal(fx.calls.filter(c => c.table === 'course_students').length, 1);
    if (old) { fx.calls = []; assert.deepEqual(data, await (await call(old)).json()); reductions.push({ operation: 'invitation poll', before: fx.calls.length, after: count }); assert.equal(count, fx.calls.length - 1); }
  });
  console.log(JSON.stringify({ passed: checks.length, checks, reductions, baselineCompared: !!old }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
