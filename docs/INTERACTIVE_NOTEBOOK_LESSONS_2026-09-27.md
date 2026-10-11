# Assignable original notebooks — September 27, 2026

Implemented after the lesson-workspace navigation changes and deployed September 27, 2026. The first assignable template is **Units and Dimensions**. See `LESSON_NOileTEBOOK_RELEASE_2026-09-27.md` for release verification. No production lesson creation, class assignment, or student-data mutation was performed.

## Teacher journey

1. Open **Lessons**, then **Create lesson**.
2. Choose a physics curriculum unit and **Use this notebook template**.
3. Choose the learning target for the five checks and reflection. Create the draft.
4. Review content and the student preview from the lesson workspace. Individual question targets and language supports remain editable.
5. Publish and open access for the intended class using the existing workspace controls.
6. Review submitted answers and the reflection through the usual lesson review tools. Returning feedback unlocks revision and resubmission.

The original notebook is the student presentation for classes using the enhanced (`stepped`) reader. Classes set to `classic` retain the standard reader, the same question blocks, and the same saved responses. The existing class setting remains reversible without migrating student work.

**Use standard layout and editable questions** removes the notebook presentation metadata while retaining every block ID, prompt, target, and answer. Use it when changing the original question wording or choices. Validation prevents the original display and collected question data from silently diverging.

## Fidelity and student behavior

- Uses the unchanged original HTML and runtime: Newsreader typography, graph paper, color palette, dimensional cards, unit builder, examples, and five interactive questions.
- A small outer lesson toolbar adds saved-answer counts, draft status, and **Save answers**. Choices use the existing draft recovery system. Saving commits them to ordinary lesson responses; submission also saves pending answers.
- Students finish with a short reflection and **Submit lesson for review**. Submitted work is locked until reviewed.
- The standard **Question list & learning supports** remains available for accessibility, live questions, and original-runtime loading failures.
- Disposable preview keeps its work temporary. Student-account inspection is read-only. Neither changes the inspected student's responses.
- Unit-builder settings and worked-example selections are practice state; they are not saved as evidence. The five questions and reflection are saved.
- Original self-check feedback is formative. It does not award mastery or replace teacher review.

## Teaching and data integration

The template is one `BlockDocument`: a source prose/teaching-tool block, five canonical question blocks, and an exit ticket. Optional `interactiveNotebook` metadata identifies the pinned source hash and linked question IDs. No new response table, grading service, or database migration was added.

The original teacher/projector renderer and its classroom controls remain in place. Student notebook answers are independent of the classroom demonstration. A live poll uses the existing question-list response path and evidence source. The new adapter has no projector commands or direct persistence calls.

Server-side access and track filtering, authoritative answer checking, response drafts, immutable submission snapshots, teacher review, and submission locks continue through the existing APIs and hooks. The student adapter only accepts valid choice indices for the five mapped questions. A missing, filtered, or altered mapping falls back to ordinary blocks.

Relevant rules: A-1 through A-6, E-2/E-3, M-1, and S-5 in `LESSON_SYSTEM_RULES.md`. The supplied original design is preserved inside the notebook; surrounding application controls use existing semantic styles.

## Verification

- Production build passed, including type checking and static page generation.
- Changed-source ESLint passed.
- Nine unit/source-integrity checks passed: unchanged original assets, exact question mapping, server-owned correctness, valid response restoration, filtering boundaries, authoring validation, metadata preservation, and synchronous capture/revision behavior.
- Thirty-four access/review API checks passed, including the notebook save → submit → review → revise flow, immutable snapshots, closed-access rejection, unsaved-draft rejection, and no mastery writes.
- Browser checks used actual components and the original iframe with synthetic local API fixtures: teacher template creation, unit-builder interaction, incorrect/correct answers, save/reload, immediate draft recovery, submission locking, returned feedback, revision, simulated save failure and retry, and read-only inspection.
- Preview and snapshot isolation verified: the fixture's write count stayed at 28 and persisted responses were identical before and after those checks.
- Visual inspection at 1024 × 768 confirmed the original design. No unexpected browser application errors were recorded; a deliberate HTTP 503 exercised the retry path.

Browser fixtures never connected to production student data. Physical iPad, Apple Pencil, AirPlay, and projector hardware were not tested in this step. Existing original runtime/CDN scripts and web fonts still need an online cold load; the standard question list is available if the notebook cannot load. Only Units and Dimensions has the new assigned-answer integration so far.

Reproducible checks:

```sh
./node_modules/.bin/tsx --test src/lib/interactive-notebook.test.ts src/lib/claude-explainer.test.ts
node scripts/test-lesson-access-review.cjs
NODE_OPTIONS=--max-old-space-size=8192 npm run build
```

`node scripts/build-interactive-notebook.mjs` regenerates the canonical question data from the hash-verified local original export.
