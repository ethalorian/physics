/* Validate real authored content against the production checkpoint contract.
 * Optional --catalog PATH checks a read-only export of the live vocabulary catalog.
 * Optional --export PATH writes the teacher's question book with keys and rubrics.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const root = path.resolve(__dirname, '..');
const argument = flag => process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : null;

async function main() {
  const compiled = await build({
    stdin: { contents: `export { AUTHORED_CHECKPOINTS } from './src/lib/vocab-checkpoint-bank'; export { draftCheckpoint } from './src/lib/vocab-checkpoint-content'; export { validateCheckpointQuestions, publicCheckpoint, checkpointScore } from './src/lib/vocab-checkpoint';`, resolveDir: root },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    plugins: [{ name: 'server-only-test', setup(b) {
      b.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: '' }));
    } }],
  });
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-bank-'));
  try {
    const modulePath = path.join(temporary, 'bank.cjs');
    fs.writeFileSync(modulePath, compiled.outputFiles[0].text);
    const { AUTHORED_CHECKPOINTS: packs, draftCheckpoint, validateCheckpointQuestions, publicCheckpoint, checkpointScore } = require(modulePath);
    const catalog = argument('--catalog') ? JSON.parse(fs.readFileSync(argument('--catalog'), 'utf8')) : null;
    assert.equal(packs.length, 9);
    assert.equal(new Set(packs.map(p => [...p.terms].sort().join('|'))).size, packs.length);
    for (const pack of packs) {
      const synthetic = pack.terms.map((term, i) => ({ id: String(i), term, definition: `Meaning of ${term}`, vocabulary_set_id: 'test', tier: 3 }));
      const live = catalog?.find(set => set.name === pack.title);
      if (catalog) {
        assert.ok(live, `Published set exists: ${pack.title}`);
        assert.deepEqual(live.words.map(w => w.term.toLowerCase()).sort(), [...pack.terms].sort(), `Exact term coverage: ${pack.title}`);
      }
      const words = live?.words ?? synthetic;
      const questions = draftCheckpoint([...words].reverse());
      validateCheckpointQuestions(questions, words.map(w => w.term));
      assert.equal(questions.reduce((n, q) => n + q.points, 0), 20);
      assert.equal(new Set(questions.map(q => q.prompt)).size, 10);
      assert.deepEqual([0, 1, 2, 3].map(answer => questions.slice(0, 8).filter(q => q.answer === answer).length), [2, 2, 2, 2]);
      for (const q of questions) {
        assert.ok(q.prompt.trim() && q.explanation.trim());
        if (q.part === 'explain') {
          assert.match(q.explanation, /Meaning \(0–2\):/);
          assert.match(q.explanation, /Application \(0–2\):/);
          assert.ok(q.frame);
        }
      }
      const caseChanged = words.map(w => ({ ...w, term: w.term.toUpperCase() }));
      validateCheckpointQuestions(draftCheckpoint(caseChanged), caseChanged.map(w => w.term));
      questions[0].options[0] = 'Changed in one draft';
      assert.notEqual(draftCheckpoint(words)[0].options[0], 'Changed in one draft', 'Draft edits never mutate the authored bank');
      const fresh = draftCheckpoint(words);
      const answers = Object.fromEntries(fresh.map(q => [q.id, q.part === 'explain' ? 'A student explanation.' : String(q.answer)]));
      const row = { id: 'attempt', task_id: 'task', user_id: 'student', number: 1, version: 1, created_at: '', submitted_at: '', released_at: null, questions: fresh, answers, scores: { q9: 4, q10: 4 }, notes: { q9: 'Teacher feedback' } };
      const safe = publicCheckpoint(row, false);
      assert.ok(safe.questions.every(q => q.answer === undefined && q.explanation === undefined), 'Unreleased student payload hides every key and rubric');
      assert.deepEqual(safe.scores, {});
      assert.deepEqual(safe.notes, {});
      assert.equal(checkpointScore(fresh, { answers, submitted: true, scores: row.scores }).percent, 100);
      console.log(`PASS ${pack.title}: 10 questions, all ${pack.terms.length} words, 20 points, private keys`);
    }
    const custom = ['one', 'two', 'three', 'four'].map((term, i) => ({ id: String(i), term, definition: term, vocabulary_set_id: 'custom', tier: 2 }));
    assert.ok(draftCheckpoint(custom).slice(4, 8).every(q => q.prompt === ''), 'Uncovered custom words must not silently receive unrelated questions');
    const bookPath = argument('--export');
    if (bookPath) {
      const lines = ['# Vocabulary quiz question book', '', 'Nine ready-to-review quizzes matched to the published vocabulary sets. Each has 10 questions worth 20 points: four recognition items (1 point each), four interpretation items (2 points each), and two explanations (4 points each).', '', '## Student directions', '', 'Choose one answer for questions 1–8. For questions 9–10, use the vocabulary to explain your thinking in a few clear sentences. Meaning and application count. Minor spelling or grammar errors do not lower a conceptually correct answer. Sentence starters are optional.', '', '## Teacher use', '', 'In Control Room → Vocabulary → Quiz checkpoints, choose the matching word set with all its words selected, then choose **Load quiz questions**. Review the draft before assigning. These questions do not assign work or create grades by themselves.', '', 'Award each written response 0–2 points for meaning plus 0–2 for application using its specific guide below. In each category, 2 means complete and accurate, 1 means partly correct or incomplete, and 0 means absent or incorrect. The quiz percentage remains separate from the teacher’s 1–3 Knowledge rating.', ''];
      for (const pack of packs) {
        lines.push(`## ${pack.title}`, '', `**Vocabulary:** ${pack.terms.join(', ')}.`, '');
        for (const q of pack.questions) {
          lines.push(`### ${q.id.slice(1)}. ${q.part === 'recognize' ? 'Recognize' : q.part === 'interpret' ? 'Interpret' : 'Explain'} · ${q.points} ${q.points === 1 ? 'point' : 'points'}`, '', q.prompt, '');
          if (q.options) lines.push(...q.options.map((option, i) => `- **${'ABCD'[i]}.** ${option}`), '');
          if (q.frame) lines.push(`*Optional starter:* ${q.frame}`, '');
        }
        lines.push('### Teacher answer key and scoring guides', '');
        for (const q of pack.questions) lines.push(`**${q.id.slice(1)}.${q.options ? ` ${'ABCD'[q.answer]} — ${q.options[q.answer]}` : ' Written response'}**`, '', q.explanation, '');
      }
      fs.mkdirSync(path.dirname(bookPath), { recursive: true });
      fs.writeFileSync(bookPath, lines.join('\n'));
      console.log(`Wrote teacher question book: ${bookPath}`);
    }
    console.log('PASS 90 authored questions; draft isolation, word matching, score totals, and answer-key privacy.');
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
