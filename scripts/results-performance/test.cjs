const assert = require('node:assert/strict');
const { fx, uuid, bundle, reset, context } = require('../backend-performance/fixture.cjs');
process.env.BACKEND_TIMING_SAMPLE_RATE = '0';
delete process.env.ANTHROPIC_API_KEY;
const baseline = process.env.RESULTS_PERFORMANCE_BASELINE;
assert(baseline, 'Set RESULTS_PERFORMANCE_BASELINE to the saved source from the live release.');
const course = { id: uuid(1), name: 'Physics', section: 'A', program: 'physics', track: 'cpa', teacher_email: 'teacher@example.test' };
const user = uuid(2), other = uuid(3), target = uuid(4), t2 = uuid(5), timestamp = '2026-10-20T12:00:00Z';
const member = id => ({ course_id: course.id, student_id: id, enrollment_state: 'ACTIVE', students: { name: 'Fictional ' + id, first_name: 'Fictional', last_name: id, is_active: true } });
function fixture() {
  const rows = {
    courses: [course], course_students: [member(user), member(other)],
    learning_targets: [target, t2].map((id, i) => ({ id, slug: 'target' + i, unit_id: 'unit-' + (i + 1), statement: 'Explain motion.', lesson_id: null, program: 'physics' })),
    units: [1, 2].map(i => ({ id: 'unit-' + i, name: 'Unit ' + i, program: 'physics' })),
    course_grading_settings: [{ course_id: course.id, terms: [{ id: 't1', name: 'Fall', start: '2026-09-01', end: '2026-11-06' }, { id: 't2', name: 'Winter', start: '2026-11-07', end: '2027-01-22' }], placements: { ['quiz:' + uuid(101)]: 't2', 'quiz:foreign': 't1' }, revision: 3 }],
    quiz_assignments: [], quiz_work: [], quiz_submissions: [], quiz_reviews: [], quiz_ai_reviews: [],
    lessons: [], lesson_class_windows: [], lesson_submissions: [], lesson_reviews: [], block_responses: [], mastery_evidence_reviews: [],
    mastery_records: [user, other].map((id, i) => ({ id: uuid(900 + i), user_id: id, target_id: target, level: i + 2, observed_at: timestamp })),
    teacher_feedback: [user, other].map((id, i) => ({ id: uuid(910 + i), user_id: id, target_id: target, message: i ? 'OTHER PRIVATE FEEDBACK' : 'Connect the graph.', created_at: timestamp })),
  };
  for (let i = 0; i < 7; i++) {
    const quiz = { id: uuid(100 + i), course_id: course.id, title: 'Quiz ' + i, kind: 'mixed', instructions: 'Use evidence.', questions: [{ id: 'choice', kind: 'choice', prompt: 'Choose.', points: 2, correct_index: 1, options: ['A', 'B'], target_id: target }, { id: 'written', kind: 'written', prompt: 'Explain.', points: 4, guide: 'PRIVATE KEY', target_id: i % 2 ? t2 : target }], grade_mode: ['numeric', 'letter', 'credit'][i % 3], status: i === 5 ? 'archived' : 'published', due_at: i === 6 ? null : timestamp, version: 2, student_ids: i === 6 ? [user] : null };
    rows.quiz_assignments.push(quiz);
    for (const [j, id] of [user, other].entries()) {
      const sub = uuid(200 + i * 2 + j), state = ['graded', 'graded', 'graded', 'returned', 'in_progress', 'submitted', 'graded'][i];
      rows.quiz_work.push({ quiz_id: quiz.id, user_id: id, submission_id: sub, state, version: 2, answers: { written: 'PRIVATE DRAFT ' + 'x'.repeat(80000) } });
      rows.quiz_submissions.push({ id: sub, quiz_id: quiz.id, user_id: id, snapshot: { ...quiz, ...(i === 6 ? { instructions: 'An obsolete version.' } : {}) }, answers: { choice: '1', written: 'Submitted explanation.' }, submitted_at: timestamp });
      rows.quiz_reviews.push({ id: uuid(300 + i * 2 + j), submission_id: sub, decision: i === 3 ? 'returned' : 'graded', scores: { written: j ? 0 : 3.5 }, ratings: { [target]: 2 }, grade_value: i % 3 === 1 ? 'B+' : i % 3 === 2 ? 'credit' : null, note: 'Released feedback.', question_notes: { written: 'Detail.' }, reviewed_at: timestamp });
    }
  }
  for (let i = 0; i < 6; i++) {
    const id = uuid(400 + i), video = i === 0 || i === 2 || i === 3;
    const blocks = [{ id: 'q', type: 'question', targetId: 'target0', question: { prompt: 'Explain.' } }, ...(video ? [{ id: 'v', type: 'instruction_video', youtubeId: 'video', durationSeconds: 60 }] : [])];
    rows.lessons.push({ id, slug: 'lesson-' + i, title: 'Lesson ' + i, unit_id: 'unit-1', published: true, visibility_track: i === 3 ? 'honors' : 'all', content_blocks: { blocks, ...(i !== 5 ? { presentation: 'physics-path', learningPath: {} } : {}), ...(i === 1 || i === 2 ? { reflection: { version: 1, kind: 'story' } } : {}) } });
    rows.lesson_class_windows.push({ lesson_id: id, course_id: course.id, due_at: timestamp });
    for (const [j, student] of [user, other].entries()) {
      const sub = uuid(500 + 2 * i + j);
      if (i !== 4) rows.lesson_submissions.push({ id: sub, lesson_id: id, user_id: student, submitted_at: timestamp });
      rows.block_responses.push({ id: uuid(600 + 2 * i + j), lesson_id: id, user_id: student, block_id: 'q', block_type: 'question', target_id: target, response: { draft: i === 4 && j === 1, answer: 'Saved explanation.' }, created_at: timestamp });
      if (i === 0) rows.mastery_evidence_reviews.push({ id: uuid(700 + j), lesson_id: id, user_id: student, target_id: target, evidence: [{ submissionId: sub }] });
      if (i === 1) rows.lesson_reviews.push({ id: uuid(710 + j), submission_id: sub });
      if (i === 2) rows.mastery_evidence_reviews.push({ id: uuid(720 + j), lesson_id: id, user_id: student, target_id: target, evidence: [{ submissionId: 'old-attempt' }] });
    }
  }
  rows.worksheet_assignments = [{ id: uuid(800), course_id: course.id, title: 'Paper', unit_id: 'unit-1', status: 'published', due_at: timestamp, quiz_id: uuid(100) }];
  rows.worksheet_receipts = [user, other].map(id => ({ assignment_id: uuid(800), user_id: id, state: 'received', recorded_at: timestamp, version: 1 }));
  rows.daily_lesson_missing = [{ quiz_id: uuid(104), id: uuid(850), title: 'Foundation', role: 'foundation' }];
  return rows;
}
const checks = [], reductions = [];
const check = async (name, fn) => { await fn(); checks.push(name); };
const entry = `export {loadAssessmentResults,loadReviewResults} from './src/lib/assessment-results/server';export {GET as progress} from './src/app/api/student-progress/route';export {GET as results} from './src/app/api/assessment-results/route';`;
const comparable = data => { delete data.generatedAt; return data; };
(async () => {
  const api = await bundle('results-current', entry), old = await bundle('results-baseline', entry, baseline);
  const ctx = context(uuid(90), 'teacher');
  const call = (impl, route, query, actor = ctx) => fx.context.run(actor, () => impl[route](new Request('http://fixture/api/' + (route === 'progress' ? 'student-progress' : 'assessment-results') + query), { params: Promise.resolve({}) }));
  async function compare(route, query, actor = ctx, failures = []) {
    reset(fixture()); failures.forEach(f => fx.fail.add(f)); const before = structuredClone(fx.rows);
    const a = await call(api, route, query, actor), value = comparable(await a.json()), calls = structuredClone(fx.calls);
    fx.calls = [];
    const b = await call(old, route, query, actor), previous = comparable(await b.json());
    assert.equal(a.status, b.status); assert.deepEqual(value, previous); assert.deepEqual(fx.rows, before);
    return { value, status: a.status, calls, oldCalls: structuredClone(fx.calls) };
  }
  await check('Results and student progress preserve every response field with fewer reads and bytes', async () => {
    for (const [route, query, actor] of [['results', '?class=' + course.id, ctx], ['progress', '?class=' + course.id, context(user)], ['progress', '?class=' + course.id + '&student=' + user, ctx]]) {
      const { value, status, calls, oldCalls } = await compare(route, query, actor);
      assert.equal(status, 200); assert.deepEqual(value.warnings, []);
      assert(calls.length < oldCalls.length); const bytes = rows => rows.reduce((sum, r) => sum + (r.bytes ?? 0), 0);
      assert(bytes(calls) < bytes(oldCalls));
      reductions.push({ route, actor: actor.role, before: oldCalls.length, after: calls.length, bytesBefore: bytes(oldCalls), bytesAfter: bytes(calls) });
      assert(!calls.find(c => c.table === 'quiz_work').fields.includes('answers'));
      if (route === 'progress') {
        assert(!JSON.stringify(value).includes('PRIVATE')); assert(!Object.keys(value.settings.placements).includes('quiz:foreign'));
        const receipts = calls.find(c => c.table === 'worksheet_receipts'); assert(receipts.conditions.some(([op, key, ids]) => op === 'in' && key === 'user_id' && ids.length === 1 && ids[0] === user));
        assert(value.rows.some(r => r.statusLabel.startsWith('Locked')));
        assert(calls.findIndex(c => c.table === 'mastery_records') < calls.findIndex(c => c.table === 'daily_lesson_missing'));
      } else {
        assert.equal(value.activities.find(a => a.key === 'quiz:' + uuid(100)).cells[user].grade.earned, 5.5);
        assert.equal(value.activities.find(a => a.key === 'quiz:' + uuid(106)).cells[user].needsReview, true, 'old snapshot cannot inherit a released grade');
        assert.equal(value.activities.find(a => a.key === 'video:' + uuid(400)).cells[user].state, 'reviewed');
        assert.equal(value.activities.find(a => a.key === 'reflection:' + uuid(402)).cells[user].needsReview, true);
      }
    }
  });
  await check('unit filters retain class-wide term totals and manual placements', async () => {
    for (const term of ['all', 't1', 't2', 'unassigned', 'invalid']) for (const unit of ['all', 'unit-1', 'unit-2', 'unmapped']) await compare('results', '?class=' + course.id + '&term=' + term + '&unit=' + unit);
    const all = await compare('results', '?class=' + course.id + '&term=t1'), one = await compare('results', '?class=' + course.id + '&term=t1&unit=unit-1');
    assert.deepEqual(all.value.termQuizTotals, one.value.termQuizTotals);
  });
  await check('authentication, class scope, staff previews and student identity stay enforced', async () => {
    for (const [route, query, actor, status] of [['progress', '', null, 401], ['results', '?class=' + course.id, context(user), 403], ['progress', '?class=' + uuid(999), context(user), 403], ['progress', '?class=' + course.id + '&student=' + uuid(999), ctx, 403], ['progress', '?class=' + course.id, ctx, 200]]) assert.equal((await compare(route, query, actor)).status, status);
    const a = await compare('progress', '?class=' + course.id + '&student=' + other, context(user)); assert.equal(a.value.student.id, user);
    const preview = { ...ctx, viewingAsTeacher: true }; await compare('progress', '?class=' + course.id + '&student=' + user, preview);
  });
  await check('provider and independent-read failures keep warning order and partial data', async () => {
    const log = console.error; console.error = () => {};
    try {
      for (const table of ['lessons', 'lesson_class_windows', 'lesson_submissions', 'lesson_reviews', 'block_responses', 'mastery_evidence_reviews', 'quiz_submissions', 'course_grading_settings', 'teacher_feedback', 'daily_lesson_missing']) {
        await compare('progress', '?class=' + course.id, context(user), [table]);
        if (!['teacher_feedback', 'daily_lesson_missing'].includes(table)) await compare('results', '?class=' + course.id + '&term=t1', ctx, [table]);
      }
      await compare('progress', '?class=' + course.id, context(user), ['course_grading_settings', 'teacher_feedback', 'daily_lesson_missing']);
    } finally { console.error = log; }
  });
  await check('pagination, archived lessons, visible blocks and exact-submission reviews retain parity', async () => {
    const rows = fixture();
    for (let i = 0; i < 1005; i++) rows.block_responses.push({ id: uuid(10000 + i), user_id: user, lesson_id: uuid(404), block_id: 'q', block_type: 'question', target_id: target, created_at: timestamp, response: { draft: i % 2 === 0 } });
    for (let i = 0; i < 505; i++) rows.mastery_evidence_reviews.push({ id: uuid(20000 + i), user_id: user, lesson_id: uuid(400), target_id: target, evidence: [] });
    reset(rows); const before = structuredClone(fx.rows);
    const now = await api.loadAssessmentResults(ctx, course, 'all'); const calls = structuredClone(fx.calls);
    assert.deepEqual(now, await old.loadAssessmentResults(ctx, course, 'all')); assert.deepEqual(now.warnings, []); assert.deepEqual(fx.rows, before);
    assert(calls.filter(c => c.table === 'block_responses').some(c => c.start >= 1000));
    assert(calls.filter(c => c.table === 'mastery_evidence_reviews').some(c => c.start >= 500));
    for (const key of ['video:' + uuid(400), 'reflection:' + uuid(402), 'lesson:' + uuid(405)]) assert.deepEqual(await api.loadReviewResults(ctx, course, key, user), await old.loadReviewResults(ctx, course, key, user));
  });
  await check('fresh compositions observe membership and grade changes with no cross-student cache', async () => {
    reset(fixture()); const first = await api.loadAssessmentResults(ctx, course, 'all', { studentId: user });
    fx.rows.quiz_reviews[0].scores.written = 0; fx.rows.lesson_class_windows = [];
    const next = await api.loadAssessmentResults(ctx, course, 'all', { studentId: user });
    assert.notDeepEqual(first, next); assert.deepEqual(next, await old.loadAssessmentResults(ctx, course, 'all', { studentId: user }));
    const otherResults = await api.loadAssessmentResults(ctx, course, 'all', { studentId: other }); assert(otherResults.activities.every(a => !a.cells[user]));
    fx.rows.course_students = [member(other)]; assert.equal((await call(api, 'progress', '?class=' + course.id, context(user))).status, 403);
  });
  await check('more than 100 lessons preserve batching, track visibility and provider ordering', async () => {
    const rows = fixture();
    for (let i = 0; i < 125; i++) {
      const lesson = structuredClone(rows.lessons[i % 3]); lesson.id = uuid(30000 + i); lesson.slug = 'batch-' + i;
      rows.lessons.push(lesson); rows.lesson_class_windows.push({ course_id: course.id, lesson_id: lesson.id, due_at: timestamp });
      rows.lesson_submissions.push({ id: uuid(31000 + i), user_id: user, lesson_id: lesson.id, submitted_at: timestamp });
    }
    for (const track of ['cpa', 'honors', null]) {
      reset(rows); const scoped = { ...course, track };
      const current = await api.loadAssessmentResults(ctx, scoped, 'all', { studentId: user });
      assert.deepEqual(current, await old.loadAssessmentResults(ctx, scoped, 'all', { studentId: user })); assert.deepEqual(current.warnings, []);
    }
  });
  await check('Results settings start before provider reads finish', async () => {
    reset(fixture()); let release; const gate = new Promise(resolve => { release = resolve; }); let settingsStarted = false, providersStarted = false;
    fx.onRead = async call => { if (call.table === 'course_grading_settings') { settingsStarted = true; await gate; } if (call.table === 'quiz_work') { assert(settingsStarted, 'settings must already be loading'); providersStarted = true; release(); } };
    try { const response = await call(api, 'results', '?class=' + course.id); assert.equal(response.status, 200); assert(settingsStarted && providersStarted); }
    finally { release(); fx.onRead = undefined; }
  });
  console.log(JSON.stringify({ passed: checks.length, checks, reductions, productionWrites: 0, fullResponseParity: true }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
