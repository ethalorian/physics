# Vocabulary questions and assignment editing

## Written quizzes

Authored 90 questions for nine published vocabulary sets: all seven Physics Unit 1 sets, MVP Read the track, and Trades Unit 1 Measurement and evidence. Each complete word set loads a 20-point quiz with four recognition items, four interpretation situations, and two explanations. Every explanation has a specific meaning/application rubric and an optional sentence starter. Questions are editable before assignment.

The private bank is `src/lib/vocab-checkpoint-bank.ts`, accessed only through the existing teacher-only authoring endpoint. Matching is case-insensitive and independent of database term order; each returned draft is an independent deep copy. Uncovered or partial custom selections still show the existing custom template and explicitly identify unfinished interpretation prompts. No student assignments are created just by loading questions.

The teacher question book is `docs/VOCABULARY_QUIZ_QUESTIONS_2026-09-17.md`. It includes all student prompts, choices, keys and rubrics.

## Edit an existing assignment

Control Room → Vocabulary → choose assignment → Edit assignment → select 1–5 checks → Save changes. The same editor is available in the assignment board's Task report. Accuracy, title, due date and student directions are under More settings. Quizzes allow details editing but do not expose practice completion requirements.

Only changed fields are saved. The PATCH route verifies own-class access, disallows teacher impersonation writes, validates all fields and rejects attempts to alter words/audience/quiz format through this editor. Existing checks, answers, assignment word snapshots and Knowledge ratings are preserved. Both student and teacher progress recompute from saved checks using the updated requirements. No production assignment settings or grades were changed during implementation.

## Verification

- All nine packs match the live published word lists and validate as ten questions/20 points with full term coverage, one correct option per choice item, and balanced answer positions.
- Tests cover independent draft copies, scoring totals and answer-key privacy before release.
- Actual API handlers against disposable PostgreSQL verify all nine teacher drafts and deny student authoring.
- Full existing practice/quiz/checkpoint flow passes, plus editing 5 → 2 → 5, recalculation in student and teacher views, exact preservation of saved checks and mastery records, invalid fields, own-class authorization and quiz guards.
- Browser: five-to-two edit saves successfully, progress changes and the saved count survives reload. Compact editor has five 55×44 px controls in one row at 390 px with no horizontal overflow. Graphing Motion loads ten authored questions; question 5's scenario, choices and key display correctly. No browser warnings/errors.
- TypeScript, scoped ESLint and style audit passed. Release source is isolated from unrelated local work.

## Release

Baseline: `dpl_CqgEdE5MhhzauFEvACuVuxZfYWQM`.
Candidate: `dpl_GUuU5twy9Lt5r5NjWgyGqqeL6gzv` (`physics-3mdj3xs6t-ethalorians-projects.vercel.app`).
Isolated source: `/private/tmp/vocab-questions-release`.
Only ten specified question-bank/editor/test/document files are overlaid. Uploaded source manifest: `/private/tmp/vocab-questions-uploaded.json`.

Promoted and verified READY at `www.antocciphysics.com`. All 1,838 uploaded file hashes match the isolated source: 10 intended files, 1,827 preserved files and one generated TypeScript cache. Production PATCH `/api/vocab/tasks` and PUT `/api/vocab/checkpoints` both reject unauthenticated requests with 401. The local verification server was stopped and its disposable database removed.
