# Unified assignment review

Results → an **awaiting review** button opens the shared review desk. The left rail shows names only. The assignment selector also exposes native activities contained inside a choice menu.

Each submitted evidence item shows an advisory **Antocci suggests** rating and feedback. A click adds feedback without replacing teacher writing. Evidence uses 1 Not yet (red), 2 Almost (yellow), 3 Got it (green), and an explicit insufficient-evidence option. Teacher target mastery is a separate decision; evidence ratings are never averaged into it.

Authored quiz points, daily review scores, four-dimension lab/transfer grades, vocabulary formats and math mastery retain their original rules and release endpoints. Math has no percentage grade. Supported math corrections are acknowledged and lead to a fresh independent check. Paper work records completion through its existing controls. Vocabulary checkpoints and missions use fresh reassessment rather than reopening immutable attempts. Choice attachments remain inspectable through the existing authorized file endpoint.

Save draft keeps decisions private. Mark ready adds the saved version to the release queue. Individual and selected batch releases show the exact saved grade, mastery and feedback first. Stale submissions, concurrent draft changes and native review changes reject the release. Interrupted releases retain their frozen plan and support retry; original source ledgers remain authoritative.

Request revision sends the overall next step plus response-specific feedback without a new grade or mastery score. Students read the feedback, edit their existing assignment, check the feedback items, save a change summary, then use the assignment's Submit button. Returning revisions have a purple label, change summary, previous/current responses and a changed-response filter. Released feedback appears on the student's assignment.

The additive migration creates three server-only, RLS-enabled tables for drafts, revision receipts and suggestions. Existing attempts, ratings, grades, student answers and released feedback are preserved. AI suggestions and private drafts are not exposed by the student endpoint.

Verification uses fictional fixtures for the actual review components and API handlers, source adapters/action plans, scoring rules, stale-state rejection, interrupted-release recovery and privacy. PostgreSQL checks exercise the actual migration, grants, row-level security, compare-and-swap updates and release leases. No real student grades are released as part of testing.
