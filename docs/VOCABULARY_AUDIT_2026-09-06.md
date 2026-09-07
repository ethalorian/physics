# Vocabulary audit and proposed assignment workflow

Date: September 6, 2026. Scope: source-code review of vocabulary authoring, lesson integration, nine arcade games, assignments, attempts, reporting, and learning-target evidence. No application code or production data was changed. Findings describe the checked-out implementation; deployed schema, data completeness, and authenticated browser behavior were not verified.

## Main conclusion

The application has useful foundations: shared vocabulary sets, lesson vocabulary, nine games with word-attempt instrumentation, class assignments, and a student-by-word accuracy grid with a language-support split. It does not yet provide dependable assignment completion or vocabulary readiness against learning targets. Fix evidence integrity before using these percentages to make instructional decisions.

## Priority findings

### 1. Editing vocabulary can erase learning history — critical

Both vocabulary update endpoints delete all existing terms and insert replacements. Attempts reference term IDs with `ON DELETE CASCADE`, so those deletions remove attached attempts. Even publishing or renaming through the general manager sends the current terms again. An ordinary content update can therefore reset the class grid. Replacement also drops fields not included by each editor: the general endpoint omits the SEI fields; the lesson endpoint omits `definition_es` and `icon`.

Evidence: `src/contexts/VocabularyContext.tsx:201`; `src/app/api/vocabulary/route.ts:188`; `src/app/api/lessons/[id]/vocab/route.ts:77`; `supabase/migrations/20260904_vocab_assignments_attempts.sql:22`.

Required change: preserve term IDs, update in place, archive removed words, retain all support fields, and save changes atomically. Treat substantive meaning changes as new content versions while preserving prior evidence.

### 2. Crossword records typing as assessment — high

The inner game calls `onAnswer` whenever its answers change. The wrapper treats that callback as a completed answer, records every nonempty entry, flushes attempts, and calls `onGameComplete`. Partially typed words become errors; previously completed words can be counted again when other answers change. Completion is triggered without a deliberate submission.

Evidence: `src/components/vocabulary/games/VocabularyCrosswordGame.tsx:281`; `src/components/vocabulary/games/VocabularyCrosswordGameWrapper.tsx:32`.

Required change: distinguish editing from submission; record one scored event per submitted word with a stable event ID. Count the words actually placed, rather than the full source list.

### 3. “Accuracy” pools unlike evidence — high

The competency view combines every game and every historical attempt. Concentration counts card mismatches, including same-type cards, as vocabulary errors. Hangman can succeed through letter guesses and hints. Letter Catch mixes word completion with movement and power-ups. These are useful practice activities, but their results do not mean the same thing as selecting a correct definition.

The grid gives a green label at 80% with no minimum evidence requirement. Its average excludes unattempted words: one correct answer on one of ten words produces a 100% student average. Lifetime averaging also obscures improvement and forgetting.

Evidence: `src/components/vocabulary/games/VocabularyConcentrationGame.tsx:220`; `src/components/vocabulary/games/VocabularyHangmanGame.tsx:164`; `src/components/vocabulary/games/VocabularyLetterCatchGame.tsx:179`; `src/components/vocabulary/VocabAssignBoard.tsx:107`; competency migration.

Required change: separate engagement, recognition, recall, and use in context. Show required-word coverage, recent eligible accuracy, sample size, last practiced date, and change over time. Label missing evidence explicitly.

### 4. Assigned sets do not always open — high

Teachers can assign any published set containing words. Student assignment buttons only act when the set has a lesson ID. The play endpoint accepts lesson or unit IDs, not an exact set or assignment ID. Standalone sets can therefore be assigned but fail to open from the assignment banner; unit-only sets do not work there either.

There are also competing defaults: the source picker favors a recent assignment when there is no deep link, while the arcade focus endpoint chooses recent lesson activity. A lesson/unit deep link overrides the assignment default.

Evidence: `src/app/api/vocab/assignments/route.ts:23`; `src/components/vocabulary/arcade/VocabPlaySource.tsx:100` and its assigned buttons; `src/app/api/vocab/play/route.ts:28`; `src/app/api/arcade/focus/route.ts`.

Required change: make `assignment_id` and exact `set_id` first-class play inputs. Use one priority rule across entry points, with a clear distinction between assigned work and free practice.

### 5. Assignment means “featured words,” not a measurable task — high

Assignments store a class, set, due date, note, and active flag. There is no recipient selection below a class, completion rule, required word subset, learning-target mapping, or student completion record. A unique class/set pair means reassigning updates the same row rather than creating a new practice cycle. Attempts contain no assignment or session ID, so the report cannot reliably distinguish this week's assignment from earlier free practice.

The board requires assigning one set to one class at a time. It lacks search, target filtering, bulk class selection, individual assignment, and a direct due-date editing control. Failed requests generally have no visible error; a failed competency fetch can leave the previous grid visible under a new selection.

Evidence: assignment migration; `src/components/vocabulary/VocabAssignBoard.tsx:57-95`; assignment and competency endpoints.

Required change: model distinct assignment instances and recipients, retain attribution on attempts, and place vocabulary tasks in the normal student work queue with completion progress.

### 6. Attempts can disappear, duplicate, or carry misleading support labels — high

The shared hook removes events before sending, ignores a false `sendBeacon` return and HTTP failures, and has no durable retry or deduplication. It stamps the entire batch with the support settings at flush time, rather than each answer's settings. Duel and Balderdash deduplicate only in component memory, so reloads can record revealed rounds again. Their durable game state should be the source for scored events.

“Without supports” is also too broad: icons and speech remain available, local game hints are not represented, and a global language flag does not establish whether a translation existed or was shown for a particular prompt. The write endpoint accepts the client's correctness Boolean without reconstructing a scored question.

Evidence: `src/components/vocabulary/arcade/useVocabAttempts.ts`; `VocabSei.tsx`; `src/app/api/vocab/attempts/route.ts`; Duel and Balderdash game components.

Required change: per-event support metadata, event/session IDs, acknowledged saves with retry, server deduplication, and server scoring for formal checks. Preserve accommodation access and report actual supports used; do not treat accommodations alone as evidence of weaker physics knowledge.

### 7. Vocabulary is not connected to target evidence — high

The attempt schema and competency view have no learning-target relationship. Target work reads lesson block responses; the vocabulary grid is separate. Lesson membership is not a sufficient mapping: one word may support multiple targets, and targets can span lessons.

The app explicitly reserves target mastery for teacher judgment. Vocabulary performance should inform that judgment without automatically overwriting it.

Evidence: `src/app/api/mastery/student-work/route.ts`; `src/lib/evidence.ts`; `docs/LESSON_SYSTEM_RULES.md` E-1 through M-4; vocabulary migration.

Required change: explicit many-to-many word-to-target links, with required/supporting status and the expected skill. Show vocabulary readiness beside classroom evidence and the teacher's target rating.

### 8. Multiple authoring paths can drift — medium

The database-backed lesson vocabulary view is shared with games. However, the older `vocab` block renders its own inline terms while its “these words” link opens the lesson's database set, which may differ. Assignment-builder vocabulary questions copy term arrays and allow custom string IDs that cannot serve as database UUID term references. These paths do not provide a uniform connection to word evidence.

Evidence: `src/components/blocks/BlockRenderer.tsx:600`; `src/components/blocks/LessonVocabView.tsx`; `src/components/assignment-builder/VocabularyQuestionEditor.tsx:33`.

Required change: one durable term identity with explicit content snapshots where needed. Migrate inline lists and custom questions deliberately; do not silently discard unmapped responses.

### 9. Database access safeguards need deployment verification

The checked-in assignment/attempt migration does not enable row-level security or add policies, and its view does not declare security-invoker behavior. Teacher API endpoints do check class ownership, and student attempts use the authenticated student's ID. Whether direct database API access exposes rows depends on deployed grants and policies, which this audit did not inspect.

Required follow-up: inspect production grants/policies and view permissions using read-only checks, then verify student-self and teacher-roster boundaries before expanding reports.

## Game-by-game interpretation

| Game | Current recorded event | Recommended reporting treatment |
|---|---|---|
| Matching | Correct/incorrect selected term-definition pair | Recognition practice; distinguish first try from retries |
| Quiz Bowl | Answer correctness with elapsed time | Recognition; report timeouts separately |
| Word Shoot | Correct hit, wrong hit, or timeout | Timed recognition practice; offer an untimed check |
| Duel | Answer correctness after round resolution | Recognition; save/deduplicate from server round state |
| Balderdash | Vote for the real definition | Recognition only; does not assess the quality of the student's written definition |
| Crossword | Every changing answer snapshot | Repair before using as evidence; then classify as cued spelling/recall |
| Hangman | Solved or exhausted guesses | Spelling practice; capture hints and guesses |
| Letter Catch | Completed or skipped word | Spelling/motor practice; global timeout currently ends play without an equivalent current-word event |
| Concentration | Every matched/mismatched card pair | Memory practice; do not use exploratory flips as definition errors |

All nine have instrumentation, but instrumentation coverage does not establish reliable measurement. The legacy builder also advertises fill-in-the-blank questions; that authoring option is not a tenth independently verified arcade game.

## Proposed teacher and student experience

1. From a learning target, lesson, or vocabulary set, choose **Assign vocabulary**.
2. Required words are prefilled from the target mapping. Preview and adjust them; choose one or more classes, a group, or individual students.
3. Set a due date and a clear requirement. Default to practice followed by a short check, with optional delayed review. Games remain selectable practice methods.
4. Students see one task card with the target, required words, due date, and progress, such as **6 of 8 words checked**. Opening it always loads that assignment's exact words.
5. A teacher report shows students by target, expandable to required words, recent eligible accuracy, coverage, support used, and missed distinctions. Offer **Assign review of these words** from that report.

Example, illustrative rather than an existing target: a target about distinguishing distance and displacement would link those terms and relevant supporting vocabulary. Definition recognition helps establish readiness; a short motion scenario tests whether the student can apply the distinction. Display that evidence alongside the teacher's physics rating.

## Measurement and implementation plan

**First: protect and repair evidence.** Preserve term IDs and fields, correct Crossword and Concentration counting, provide durable event delivery and deduplication, and make missing/error states visible. Verify that renaming/publishing a set preserves attempts, typing produces no scored events, repeated delivery creates one event, and failed saves recover.

**Second: make assigning easy.** Add exact assignment/set launches, distinct assignment instances, multiple recipients, search and filters, due-date editing, and student queue integration. Verify standalone sets, repeated assignments, multiple classes, partial coverage, and completed work.

**Third: connect targets and learning.** Add explicit target-word mappings and separate practice from checks. Each attempt should carry a durable event ID, student, term/content version, assignment/session where applicable, prompt or item, response outcome, evidence type, timestamps, and actual supports. Derive report summaries from those records rather than maintaining competing mastery scores.

Use a configurable, versioned readiness rule. An illustrative starting policy is at least 80% on recent eligible checks, with evidence for every required word and a later recall check before labeling retention. This is a proposed instructional policy, not a validated threshold or an existing requirement. Keep “not checked,” “needs practice,” “ready,” and “review due” distinct. Never turn missing evidence into a zero or one successful game into target mastery.

Before release, verify the full teacher-assignment → student-play → saved-events → target-report flow with representative student and teacher accounts. Existing historical aggregates should be labeled as legacy game practice; lost attempts and missing historical hint/assignment information cannot be reconstructed from percentages alone.
