# Transfer Briefs — visual workflow live, October 27, 2026
## Published visual workflow

Published as dpl_9Q3eRtcTD7RbVviTg6abhwpg8Um9 at www.antocciphysics.com. Each brief uses one illustrated scenario, comparisons within that scenario, and three native saved responses: evidence, recommendation and a model limitation. Six accessible SVG condition views accompany the three Unit 1 briefs. The layout stacks at narrow widths. Student-facing rubric copy stays concise; grader instructions and teacher evidence criteria remain separate.

The production migration is recorded as 20261027234427_transfer_brief_transfer_grades (source timestamp 20261027165835); do not reapply. It added the three templates, protected Transfer Task release ledger and existing retry integration. No class assignments were created. All 843 checked existing assignment/work/submission/review/mastery records retained identical fingerprints.

Verification passed: hosted production build, full TypeScript/scoped lint, style/brand checks, 15 current unit tests, 9 API boundary checks, 12 disposable PostgreSQL checks, all 6,823 uploaded source hashes, 12 live HTTP/asset/access checks, and all three signed-in teacher previews. Live browser warning/error logs were empty. Fictional real-Claude calibration verified three complete responses and genuinely insufficient reasoning; rubric instructions were tightened to avoid deductions for unasked formats, repeated reference frames or extra assumptions. Teacher review remains necessary. Source and verification evidence are in Physics Curriculum Planning outputs/transfer-briefs. The local isolated build compiled but could not collect pages with fictional OAuth configuration; the hosted production build passed.

The original preparation notes below are historical. Activation is complete. Final Transfer Task content is unchanged; this release adds Transfer Briefs to its grade category.

A Transfer Brief asks students to use the unit's physics to make a justified decision in a meaningful real-world context. It is a short application in the existing Transfer Task grade category, distinct from the final Transfer Task assessment. Contexts can include transport, homes, sport, engineering, health, the environment or space when the physics fits. Asteroids do not define this assignment type.

The initial Unit 1 concepts are:

| Brief | Physics | Decision and evidence |
| --- | --- | --- |
| Will the delivery robot stop in time? | Two-stage motion, braking and assumptions | Compare dry/wet stopping distances with a crossing and recommend a speed-policy change. |
| Where should the rescue boat aim? | Relative velocity and components | Compare two headings and choose one that reaches the landing; explain a stronger current's effect. |
| Will the cargo slide when the van brakes? | Net force and static friction | Compare the needed braking force with two friction limits and judge what the model supports. |

These are realistic classroom planning cases with supplied, illustrative data. They are not reports of measured field studies. Each has three connected responses, explicit assumptions, an answer guide, mapped unit targets and task-specific rubric criteria. Students must interpret the evidence and defend a choice; substituting a setting into a familiar calculation is not sufficient on its own. The first part is Apply/DOK 2; the decision and limitation parts are Evaluate/DOK 3. A brief is designed for about 12–15 minutes.

## Implementation

- `transfer-briefs.ts` defines the content and reusable `transferBrief` metadata on `LessonAssignment`. Unit IDs and learning targets travel with each assignment. New units can add their own authored brief and matching database template.
- `transfer-brief` is a shared presentation type: Transfer Brief / “Apply unit physics. Defend a real-world decision.” Student work, teacher review, library, calendar and sequence use the same identity.
- Native interactive assignments supply scheduling, moving, unassigning, saved work, versioned submissions and the automatic analysis queue. Briefs have independent dates; they are not inserted into foundation/review/quiz spacing groups. No current sequence or class calendar is changed by installation.
- Claude receives the actual question, directions, expected evidence, mapped targets, cognitive demand and task-specific dimension criteria. Instructions prohibit unasked evidence. The common `lab_dimensions` JSON field is reused for compatibility, but briefs are not labs and do not require lab question scores or experiments.
- `transfer_task_grades` is a separate teacher-release ledger. `release_transfer_brief_grade` checks ownership/enrollment, current submission state/version, rubric completeness, every mastery choice, request idempotency and correction revision. RLS is enabled; client roles have no direct grants. Release is a service-only, invoker function.
- Teacher review automatically fills dimension scores while leaving mastery choices explicit. Use, edit or skip mastery; optionally use or edit feedback; explicitly release. AI analysis itself never writes grades, mastery records or teacher feedback.
- The existing retry claim and recovery-candidate functions recognize briefs and exclude released submissions. No new scheduler or retry cadence is introduced.
- Student grade projections include released entries only. Briefs feed Transfer Task (40%) and never Labs (20%). Like existing assigned work, submission also counts toward Homework completion. The empty Transfer Task category is excluded from the running weighted average, not counted as zero.

## Proposed grading behavior

This implementation reuses the application's four-dimension rubric: Science, Reasoning, Communication and Transfer, each 0–4. The lowest dimension determines the percentage: 4 → 96%, 3 → 89%, 2 → 85%, 1 → 75%, 0 → 50%. Mastery remains a separate 1–3 teacher decision.

The Transfer Task category averages the latest released attempt of each brief in the selected term. Earlier releases stay in history; a revision replaces that brief's category contribution. Existing lab revision behavior is unchanged. The existing final Transfer Task content is unchanged; its separate grading workflow has not been migrated into this new brief ledger.

## Review and verification

Run `node scripts/transfer-briefs/preview.cjs` for the local interactive mockup at port 4347. It uses the real assignment identity, response, context and teacher-review components, with clearly labeled fictional suggestions and an in-memory release endpoint. It never connects to a real class database. `TRANSFER_PREVIEW_BUILD_ONLY=1` builds the assets without starting a server; `node scripts/transfer-briefs/export-preview.cjs` creates the self-contained HTML artifact after that build.

The unit suite checks identity, content coverage, dimension validation, category isolation, terms, revisions and private student projection. `verify-api.cjs` executes the real assessor and release API with a stubbed provider/authentication/database boundary; it makes no live Claude request. `verify-db.cjs` runs the real submission, queue, claim and new release functions in a disposable local PostgreSQL database, including scheduling, privacy, ownership, idempotency and revision checks. Browser verification exercises the actual components with fictional state. This is local preparation, not a production deployment or a live grading calibration.

## Activation

The migration `20261027165835_transfer_brief_transfer_grades.sql` has not been applied to production. It creates the protected release ledger, registers three templates and updates only the relevant claim/candidate behavior. It creates no assignments, submissions or grades. The candidate-function update deliberately fails if its expected existing clause has changed, so recheck the live definition before applying.

Before activation, resolve the current deployment and compare it with this prepared source, apply the reviewed migration, run the production build and a synthetic Claude calibration, then publish only the scoped feature changes. The working checkout contains many unrelated edits and must not be deployed wholesale. Assign a brief to a class or add it to a saved sequence only through the teacher's normal controls. No real class work has been assigned, graded or released during preparation.
