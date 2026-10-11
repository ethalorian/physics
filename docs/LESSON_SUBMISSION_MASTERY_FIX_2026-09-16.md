# Lesson submission and mastery review — September 16, 2026

Students' saved block responses were present in the database, but Control Room's mastery `pending` flags only considered formal lesson submissions. Separately, the reader disabled Submit whenever any visible activity had an autosaved draft, including unfinished optional practice. That combination made saved work easy to miss during rating.

## Changes

- The mastery grid includes unreviewed explicit saves for lessons without a formal submission. It reads answer metadata in pages, respects the teacher's roster and authored targets, excludes self-ratings and draft-only records, and uses the exact lesson/target/block/version from prior teacher evidence reviews to clear pending flags. Later saves reopen review. Formal submissions continue to use the existing immutable snapshot and review workflow.
- The mastery desk labels saved, not-yet-submitted evidence as available to rate.
- Submit now explicitly saves changed visible answers using the existing response store and save API before turning in the lesson. Optional unfinished practice does not disable the button. A failed save prevents submission, retains recovery data, and offers retry. Existing server authorization, draft checks, submission snapshots, locks, XP completion rules and teacher-only mastery writes remain intact.

Implements A-6, S-5 and M-3; respects A-4, B-4, E-3, E-6 and M-1. No schema or curriculum edits and no production student-record or grade mutations are needed.

## Verification

- New submission/mastery regression scenarios cover saved work before submission, exact-version review clearing, shared-target lesson isolation, revised evidence, self-rating/draft exclusions, query pagination, roster scoping, read failures, the actual grid handler, optional practice saving, failed-save retry, concurrent edits, and account switching.
- Existing 30 access/review and 24 lesson-audit scenarios passed; evidence review API checks passed.
- Existing mastery desk browser verification passed for teacher decisions, aggregate ratings, keyboard controls, drafts, explicit confirmation, retry idempotency and mobile layout.
- Workspace and isolated-release TypeScript checks passed. Targeted ESLint had no errors (one pre-existing unused-import warning in the reader).
- Read-only production metadata was evaluated through the new pending-work helper: at the time of checking, Day 3 had saved work from 47 students, including 42 newly surfaced for mastery review. No response bodies or names were needed for this check. The local REST diagnostic was unavailable due to an invalid local API key; production metadata was read through the connected Supabase tool instead.

## Release isolation

The release at `/private/tmp/lesson-submit-fix/release` starts from production deployment `dpl_E7LK7tpcyTmxL2Zwjt728B4Vx2vW`. All 1,805 baseline source file hashes matched its saved deployment manifest. Only the fix was applied to the deployed versions of the reader and submit button; unrelated workspace styling and lesson changes were excluded.

The new real-reader browser test (`scripts/test-lesson-submit-browser.cjs`) passed against both the workspace and isolated release. Agent-browser confirmed the reader renders its controls; the interaction test verified an enabled Submit with changed work, failed-save retention without a submission request, successful retry in save-before-submit order, and the resulting submission lock. No browser runtime errors occurred. Screenshots are in `/private/tmp/lesson-submit-browser/`.

Candidate deployment: `dpl_HQifem6ufpd976HyM3gLyTizorBA` (`physics-fidsav7jt-ethalorians-projects.vercel.app`). All seven changed application files in its uploaded source match the tested release by SHA-1.

Promoted successfully to `https://www.antocciphysics.com` on September 16, 2026. Vercel confirms the domain resolves to READY deployment `dpl_HQifem6ufpd976HyM3gLyTizorBA`. Production build passed. Post-promotion sign-in returned HTTP 200; the unauthenticated mastery-grid request correctly returned HTTP 401. The new deployment's error/fatal log scan returned no matching entries at the time checked. Authenticated interaction was verified with synthetic browser fixtures, not by writing to real student work or ratings.

Follow-up: optional activities can be skipped entirely. The live Day 3 textbook block `bce04` is `requiredForCompletion: false` and has no gate. The production Git deployment `dpl_ETV3bPYEcDT6Pgu5gPwqvVixjzuQ` at commit `43cb7193738c62a6b980f7094c8c1384bdc89e6b` includes the submission fix. `node scripts/test-lesson-submit-browser.cjs --optional-textbook` exercises the actual textbook component, leaves every question blank, continues past it, and submits without creating any textbook response or draft. The fixture additionally sets `gate: true` to confirm optional status overrides gating. No application or live-data change was necessary for this follow-up; a regression scenario was added.

## Follow-up: production review queue failure

The authenticated Control Room showed `Internal server error` and `0 pending submissions`, even while the mastery grid showed pending target cells. Production logs confirmed repeated HTTP 500 responses from `/api/mastery/queue` with database message `Bad Request`. Read-only SQL confirmed saved Day 3 work from 52 students on the teacher's roster and 15 submitted snapshots containing 5–7 answers each. None had mastery evidence reviews yet.

The teacher's roster had over 1,300 saved response rows. The queue loads up to 1,000 responses, then requested all their UUIDs in one URL to fetch evidence attribution links and review status. A read-only transport reproduction confirmed that a 1,000-UUID filter receives HTTP 400 `Bad Request` at the Supabase gateway; the 100-UUID request reaches database authorization normally. This failure in supplementary evidence loading prevented the entire submitted-lesson queue from returning.

`readIdBatches` now caps unique-ID lookups at 100 IDs per request, including attribution overlays, evidence reviews, and submission reviews in the queue and mastery grid. It preserves every result and propagates lookup failures. The queue summary now displays its loading/error state instead of claiming zero pending submissions when loading fails. Auth, roster scope, immutable submissions, optional-activity rules, and teacher-only mastery ratings remain unchanged (A-4, E-6, M-1, M-3).

Verification: 32 access/review behavioral tests pass, including a 1,000-response/1,000-submission queue with attribution and review records across batch boundaries. Ten submission/mastery flow tests, TypeScript, focused ESLint, mastery-rating browser checks, and the optional-textbook submission browser check also pass. No real student responses or ratings were changed.

Release candidate `dpl_2YS16CPGFnEqqfqEuqD6vwrbgqUQ` is built from current production commit `43cb7193738c62a6b980f7094c8c1384bdc89e6b` plus only the five application fix files, staged at `/private/tmp/lesson-queue-fix-release`.

Promoted successfully after the production build passed; all five uploaded fix-file hashes match the tested release. Authenticated verification in the teacher's actual Brave session on the production domain now shows **15 pending Lesson 3 submissions**, **205 saved evidence entries**, and **52 students with pending Lesson 3 mastery work**. Opening `Grade 52 pending` displays actual saved, not-yet-submitted answers and the 1–2–3 rating controls. No ratings were selected or submitted. Production runtime logs confirm `/api/mastery/queue` and `/api/mastery/grid` returned HTTP 200 after refresh, replacing the prior queue failures.
