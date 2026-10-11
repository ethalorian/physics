# Student work: video evidence and assessment center

Student work (`/admin/control-room`) remains the central teacher gradebook. Its mastery grid, rating drawer, vocabulary tools, and math tools are retained. Quiz and reading assessment now open as tabs in that same center. The standalone authoring pages remain available.

## Video lesson evidence

- Explicitly saved answers and explanations enter the existing target review pipeline. Submitted lessons retain their immutable question and response snapshots.
- Choose **Lesson evidence** to inspect one lesson. The grading count and grading navigation use the same student–lesson–target–submission identities, including when lessons share a target. An empty lesson cannot fall through to work from another lesson.
- The selected lesson shows its linked targets. Grid ratings remain the existing rollup of all assessed evidence for each target, rather than a completion score.
- Opening a target shows the original questions, selected answers, explanations, and available support context. The teacher makes the mastery decision; video watching earns engagement XP and does not automatically rate mastery.
- Returned submissions remain accessible under **Returned for revision**, with feedback and an explicit **Unrated** or target-rating count. Returning work is separate from rating it. A new submission supersedes the returned attempt in the current queue; history is retained.
- Rating counts apply only to the same student, lesson, and submission. They count distinct assessed targets, not repeated rating events.
- Historical lesson work is retained for review, clearly labeled in the lesson picker. This does not reintroduce those lessons into the assignment catalog.

## Data repair

Videos 4–8 had null `unit_id` values because their unit display name did not match the canonical unit name and the existing database trigger overwrote the ID. `scripts/physics-learning/repair-video-unit-links.sql` repairs only those five lessons' unit metadata. The video seed now reads the canonical name. The mastery drawer also uses stable unit IDs rather than matching display names.

Verified in the database after repair:
- All eight video lessons link to `unit-1`.
- Every captured video question has a resolvable mastery target.
- Only videos 2 and 3 are open in MVP Physics and 26-27 MVP Physics.
- Release windows, responses, submission snapshots, and ratings were not rewritten.

## Validation

- 41 access/review behavioral tests, including lesson-scoped counts, returned-but-unrated evidence, exact submission rating identity, stable unit lookups, and center navigation.
- 20 teacher workflow regression scenarios and 8 video XP boundary checks.
- Existing evidence-review and quiz API suites: authorization, roster scope, immutable evidence, stale/duplicate requests, grading policy, explicit mastery, and retry behavior.
- TypeScript, targeted ESLint, style and brand checks passed.
- Actual UI components checked in a local synthetic-data fixture: lesson filtering, video answer drawer, explicit rating save and refreshed grid, returned evidence, quiz grading, reading assessment, and empty-lesson navigation. At 1024×768, no page-width overflow; no browser console warnings/errors observed.
- The browser fixture does not replace authenticated production testing. No real student grades were created during verification. Production route/authentication and deployment-source checks are recorded separately in the release work directory.

Existing rating scales, recency rollup, quiz grading modes, roster authorization, and XP rules remain authoritative. No new grading weights or automatic ratings were introduced.
