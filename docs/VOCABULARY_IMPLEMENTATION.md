# Vocabulary assignments and SEI evidence

Implemented September 6–7, 2026. Respects additive schema changes (A-2), teacher-only physics mastery (M-1/M-4), and language access without changing the physics rubric (SEI-9).

## Teacher workflow

Open **Teach & grade → Vocabulary tasks** (`/admin/vocabulary/tasks`). The default view is a class tracker with students as rows and tasks as columns. Choose **Assign vocabulary** to create a task; selecting a published word set selects its words and title automatically. Saving returns to the tracker with the new report selected. The word library also has prominent assignment and progress buttons. Direct assignment links remain at `/admin/vocabulary/assign`. Published sets and the teacher mastery-entry target list also have assignment links.

1. Choose a target or set. Search/select everyday, academic, and physics words.
2. Preview and edit tier, icon, example/frame, and authored translations. Existing Spanish fields are preserved; additional languages have a keyed translation map. Missing translations are not replaced with Spanish.
3. Optionally save the selected words as that target's defaults. Individual assignments can use different selections.
4. Choose multiple classes, or specific students within them, a due date, recognition or recall/spelling, required accuracy, and checks per word. No selected students means all active students in the selected classes.
5. Read words checked, words ready, recent accuracy, earlier accuracy when available, retention, last check, supports used, and the existing teacher physics rating. Assign student-specific review from the report.

Students see task cards on Home and the arcade. `/vocabulary/work?task_id=…` opens their exact word list, game-practice links, and an untimed check. Pictures, translated clues, and spoken English clues are optional and recorded per check item. Recall checks measure word recall/spelling. Use in physics explanations remains classroom evidence assessed by the teacher.

## Evidence and history

- Term edits preserve IDs and omitted support fields atomically. Removed terms/sets are archived. Failed vocabulary writes no longer appear to succeed through a local-only fallback.
- Assignments are separate instances with recipient and word/support snapshots. Source edits do not rewrite old assignments.
- Checks are server-scored, require complete submission, resume pending sessions, and retain the original result on retries.
- Every required word must meet the configured minimum and accuracy threshold, using up to five recent checks. Missing words remain missing evidence. Retention requires successful checks separated by at least 24 hours; ready words become review-due after seven days without a check. These indicators never update physics mastery.
- Game events use a user-scoped persistent outbox, owner validation, per-event support-setting snapshots, and database deduplication. Actual support selections are captured in formal checks; historical game settings are labeled as settings.
- Crossword submits deliberately and attributes answers to canonical word IDs. Concentration card flips no longer count as word accuracy; its game-score engagement path remains. Hangman recording is outside React state updaters. Duel/Balderdash use stable round event keys.
- Exact set/assignment game links work without lesson membership. Assignment launches cannot silently narrow required words through a tier filter.

## Database

`supabase/migrations/20260907012349_vocabulary_learning.sql` was applied to PhysicsAPP as `vocabulary_learning`. It adds archived/translation fields, target-word defaults, assignment instances, checks, and event deduplication. Vocabulary attempts, assignments, and the competency view now allow server-role access only; NextAuth routes enforce student-self and teacher-class boundaries. No production student assignments or scores were seeded for testing.

Historical game practice stays in the legacy grid and is not retroactively treated as formal checks. Previously deleted attempts cannot be recovered by this migration. Multiplayer games retain legacy Spanish-only metadata; new checks and shared solo-game labels use authored language maps.

## Verification

- TypeScript: `npm run type-check` (source-only fallback: `./node_modules/.bin/tsc --noEmit -p tsconfig.vocab-check.json`).
- Logic regressions: `./node_modules/.bin/tsx --test src/lib/vocab-learning.test.ts`.
- Isolated actual-route tests: `node scripts/test-vocab-flows.cjs`. The database and authorization adapters are in-memory fixtures, never a live connection. Coverage includes scoping, unauthorized access, content snapshots, resumed checks, incomplete submissions, server scoring, immutable retries, coverage/completion, and archived tasks.
- Visual fixture harness: `node scripts/test-vocab-flows.cjs --serve` serves the actual teacher/student components on port 3107. It uses generated app CSS when available.
- Browser walkthrough: teacher assigned target-linked words; student used a translated clue and saved 3/3 correct; teacher saw 3/3 checked, 0/3 ready under a two-check requirement, the word-specific translation usage, and unchanged physics rating. No console errors in this walkthrough.
- Direct database verification used rollback-only fixtures to test stable IDs, history/support preservation, archiving, and retry deduplication. Grants/RLS were inspected. Server-only tables intentionally have no client policies.

## Release status

Application changes are in the local checkout; no production web deployment was performed. The database migration is applied. A live local walkthrough was blocked by this checkout's invalid Supabase API key. Disk exhaustion also interrupted the Next.js development build; temporary tool downloads and generated build output were removed. A production build and live end-to-end verification still need valid application credentials and adequate free disk space.

Other concurrent lesson-system edits in the shared checkout were preserved and are outside this vocabulary change. Deploy the vocabulary application changes together with the applied migration.

## Assignment usability follow-up

The class tracker labels each assigned student/task as Not started, In progress, Goal met, or Review due, with words ready and accuracy. Unassigned cells remain separate from missing evidence. Teachers can filter by class, include archived tasks, and open the existing word-level report. Individual review preserves the original check requirements and directions. Respects M-1/M-4 and SEI-9; no new database changes.

Verified with TypeScript, the 14 existing route checks, and a browser fixture walkthrough: choose a set (all three words selected), attach a target without losing the selection, assign a class, and automatically return to the new task report and progress grid. These follow-up website changes remain local and are not deployed.
