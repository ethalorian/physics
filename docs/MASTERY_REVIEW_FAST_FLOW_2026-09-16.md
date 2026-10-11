# Faster mastery review — September 16, 2026

The mastery drawer now puts student work beside compact rating controls, with one target judgment as the default. The teacher chooses 1, 2, or 3 and uses **Save & next** or **Save & stay**. Detailed per-response scoring remains available and preserves its equal-weight average, exclusions, and rounded overall level.

## Behavior

- Student, lesson, and full target remain at the top. The response appears in the initial laptop viewport; phone layouts keep rating and save controls in the footer.
- Save & next commits the review before advancing. A failed or uncertain request retains its draft and retry ID. Uncertain requests lock editing until the result is confirmed so a retry cannot silently submit a changed decision under an already-used ID.
- The successful response supplies the committed review directly. Saved-state refresh no longer depends on the success-message text, fixing consecutive equal ratings and stale notices across students.
- Pending queue entries identify student, target, lesson, and submission. The selected lesson/target batch is kept together; students without pending work are omitted. Submitted-lesson assessment links preserve the exact submission.
- Skip makes no rating and keeps the draft for a later pass. Browser-session drafts from the previous drawer are retained and reopened in detailed scoring mode.
- Written feedback is optional and collapsed, with editable quick comments. Current target mastery and assessment history are available beside the new assessment.
- A teacher can record a new assessment from a saved review. This appends an assessment; it does not rewrite or delete the prior longitudinal rating.
- Returning a lesson is explicit. The new save function does not create a lesson-return record. The drawer shows submitted/returned state and offers Return lesson for revision.
- Keyboard controls: 1/2/3 chooses a rating, left/right browses evidence, Ctrl/Cmd+Enter saves and advances, F opens feedback. Typing into fields does not trigger rating shortcuts. Detailed mode also offers Rate & next response.

## Persistence and validation

`submit_mastery_review` stores the mastery record, feedback, and evidence snapshot atomically. Target judgments use `rating_mode=target` with a null evidence mean and no fabricated individual response scores. Detailed scoring uses `rating_mode=evidence` and validates every response. Both preserve exact evidence identity and the selected submission snapshot.

The existing review table remains protected by RLS; direct anonymous/authenticated access and execution of the privileged save function remain denied. The new function is SECURITY INVOKER and executable only by the service role. Teacher role and own-roster authorization remain in the route. Existing records and the legacy save function remain compatible.

## Verification

- TypeScript and focused ESLint passed; style audit and `git diff --check` passed.
- Four rating-validation tests passed, including stale, duplicate, missing, and invalid direct-judgment evidence keys.
- API fixture passed role/roster enforcement, exact evidence validation, server-side detailed calculation, direct target judgment, and exact submission forwarding.
- Eleven submission/mastery scenarios passed, including shared-target lesson isolation and removing only assessed targets from an unreturned submission.
- Existing access/review behavioral checks passed against the isolated release.
- PostgreSQL transaction tests passed for both scoring modes, failure rollback, retry deduplication, unchanged detailed averaging, explicit lesson return, and service-only permissions. Tests used an isolated local database and rolled back their fixture rows.
- Browser regression passed at 1366×768 and 390×844: answer visibility, target judgment, typing guards, failed-save retry, Skip draft recovery, student/lesson/submission queue order, consecutive equal ratings, detailed auto-advance, explicit return, and visible mobile rating controls. The browser used synthetic students and responses.
- The Supabase migration was applied and catalog queries confirmed the new columns and restricted function permissions. Security advisors reported no change from the existing baseline.

## Release

An isolated release was assembled from 1,798 SHA-verified files of production deployment `dpl_2YS16CPGFnEqqfqEuqD6vwrbgqUQ`, with 15 mastery-specific files overlaid. Unrelated local changes were not included. Staged deployment: `dpl_F7QV3CDtZDp8xRJWzRwVftuokWyB` (`physics-iypxijd6w-ethalorians-projects.vercel.app`).

Promoted successfully to https://www.antocciphysics.com. Production inspection confirmed deployment `dpl_F7QV3CDtZDp8xRJWzRwVftuokWyB` is Ready. All 15 overlaid source files matched the tested release; all remaining baseline files were preserved. The production build passed.

Post-promotion checks: public sign-in returned HTTP 200; the mastery grid correctly returned HTTP 401 without authentication; the deployment error-log query returned no error entries. A signed-in, read-only check opened a pending review on production and confirmed the full target and lesson, question and response, default One target rating, 1/2/3 controls, pending next-review context, and disabled save actions before a rating is chosen. The answer and rating controls were visible together. No real student ratings or lesson returns were written.

Supabase recorded the migration as `20260917012344_mastery_review_fast_flow`. The local migration filename and database fixture now use that recorded version to avoid applying the migration twice on a future push. The deployed source archive retains the original staging filename; its SQL content is unchanged.
