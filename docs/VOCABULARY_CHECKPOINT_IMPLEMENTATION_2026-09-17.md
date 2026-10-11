# Vocabulary checkpoint implementation

Control Room → Vocabulary → Quiz checkpoints.

The approved five-screen flow now uses real vocabulary catalog, own-class rosters, assignments, saved student attempts, teacher reviews, and student results. The original local preview remains available through `node scripts/preview-vocab-checkpoint.cjs` and contains synthetic records only.

## Assessment and authoring

- Ten questions, 20 points: 4 recognize × 1, 4 interpret × 2, 2 explain × 4.
- Select 4–12 published words, a class/audience and the unit's Knowledge target.
- Reviewed motion starter content is available for the six matching motion terms. Other sets get a definition/explanation draft; the teacher writes four fresh interpretation contexts and reviews all choices and answer guides before assignment.
- Untimed, resumable, with an ungraded format example and sentence starters.
- Explain rubric: meaning 0–2 plus application 0–2. Minor grammar/spelling does not reduce conceptual scores.
- Scores remain pending until both explanations are scored; explicit release makes points, answer explanations and feedback visible to the student.
- Teacher-authorized reassessments require fresh interpretation/explanation situations, preserve all attempts and retain the higher released quiz score. Home returns a new reassessment to To do.
- Quiz percentages never generate 1–3 Knowledge ratings. The existing canonical mastery review remains an explicit teacher action, preserves append-only mastery history and the existing 0.60 decay.

## Data integrity

Questions are saved privately in a separate immutable blueprint. Student drafts have server storage, attempt identity and version checks. Submission locks answers. Grading and release serialize in a transaction; retried submit/release requests do not duplicate work. A question can link evidence to multiple words.

Blueprints and audit events are append-only for the application service role. All checkpoint tables have RLS with no direct anonymous/authenticated access. Routes enforce own-class scope, assigned audience and active enrollment; teacher-view impersonation is read-only for checkpoint mutations. Student responses never include keys, scoring guides, draft grades or notes before release. Only the best released attempt updates the canonical vocabulary evidence record.

## Verification

- 14 scoring, mastery, and class overview tests passed.
- Real API handlers against disposable local PostgreSQL passed assignment validation, all six legacy quiz formats, new checkpoint drafts/submission/scoring/release, permissions, stale tab/attempt rejection, weighted grade calculation, higher-score retention, history, student Home state, all-word coverage and canonical Knowledge ratings.
- Browser walkthrough completed actual authoring → assignment → student autosave → refresh/resume → submit → teacher queue → score → release → separate Knowledge rating → student Home/results.
- Mobile width 390px: no page overflow; five large scoring buttons remain usable. Diagram and optional feedback fold away during grading.
- TypeScript, scoped ESLint and style audit passed. Production build retains existing unrelated lint warnings.
- No real student checkpoint attempts or grades were created during testing.

## Release

Production database migrations:
- `20260917035533_vocabulary_checkpoints.sql`
- `20260917041108_checkpoint_server_write_grants.sql` (explicitly overrides Supabase default service-role grants)

Isolated release: `/private/tmp/vocab-checkpoint-release`.
Baseline: `dpl_BJLy4dD3Y3SkVPtNwcoDUit5LkPJ`.
Candidate: `dpl_5QrfamC9DkQisTCNFp9Y3yCbcmSh`.
Source manifests: `/private/tmp/vocab-overview-uploaded.json` and `/private/tmp/vocab-checkpoint-uploaded.json`.
Every candidate source file is SHA-1 verified against the isolated build; unrelated live files are preserved.

Upload verification: 1,834 files matched the tested release: 25 checkpoint files, 1,808 preserved files, and the generated TypeScript build cache. Production permission checks confirmed that browser roles cannot read checkpoint tables or execute checkpoint mutations; the service role cannot update/delete blueprints or audit events. Initial production checkpoint assignment and attempt counts were both zero.

Final hardening candidate: `dpl_CqgEdE5MhhzauFEvACuVuxZfYWQM` (`https://physics-6ukcn73pa-ethalorians-projects.vercel.app`). Starter questions now come from a teacher-only PUT request; the bank is marked `server-only` and is absent from client imports. Student draft-generation requests are rejected. Browser verification confirmed the server-generated draft appears correctly. The final 1,834-file manifest is `/private/tmp/vocab-checkpoint-final-uploaded.json`; exactly four implementation/test files changed from the first checkpoint candidate. Unauthenticated production checkpoint GET returns 401. The Codex browser requires normal sign-in to view production; signed-in end-to-end grading was verified with synthetic local accounts.

Final status: promoted `dpl_CqgEdE5MhhzauFEvACuVuxZfYWQM`; `www.antocciphysics.com` resolves to that READY deployment. Final runtime error/fatal scan returned no entries. Local verification servers and their four disposable PostgreSQL databases were stopped/removed after testing. The original standalone approved UI preview is unaffected.
