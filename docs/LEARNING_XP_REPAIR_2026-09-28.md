# Math Spine and vocabulary XP repair — September 28, 2026

The vocabulary game completion screen on production showed raw game scores as XP, before confirming that the score saved. Its existing September 16 repair was still only local. This release deploys that repair: authoritative totals, distinct game points, immediate saves, retryable failures and one save ID per completed game.

The existing game policy is unchanged: score converts to XP, capped at 5 vocabulary game XP per UTC day. Math problems and math arcade payouts share a 10 XP daily allowance (standard) or 15 XP (Honors). Math milestones are separate one-time awards. Math now displays the allowance and zero-point results instead of advertising an unconditional reward. Reloading a submitted warm-up retrieves its original receipt. Zero-point grants no longer create an “earned” notification.

## Assigned vocabulary

The teacher approved 5 XP once per student/assignment, separate from game caps. The first submitted full check or quiz earns the award. Incorrect answers or explanations awaiting teacher grading still earn completion XP; grades and mastery remain independent. Additional checks, retakes and retries do not pay the same assignment again.

Database triggers award both ordinary checks and checkpoints in the submission transaction. Failure rolls back both; the existing unique grant key prevents double credit. A server-only receipt endpoint verifies assignment access and ownership. Practice, quiz and checkpoint pages display the receipt and the one-time earning rule.

The migration restored 150 XP across 30 completed student/assignment pairs for 25 students, using the first completion timestamp so term credit follows the work. No prior grades, mastery ratings, game caps or existing positive awards were changed.

## Audit evidence

- All 369 warm-up submissions in the recent 14-day window have award records: 364 XP-paying submissions and five limited to zero by the shared daily allowance.
- The 56 older issued submissions lacking completion awards were on September 8, before the September 9 per-submission reward migration.
- Saved vocabulary game totals matched the database policy; the misleading UI and daily cap explain reported differences. Saved data cannot establish whether an unrecorded game was played.
- Assigned checks had 53 completed checks, representing 30 distinct student/assignment pairs, with no award path before this repair.
- No real student work was submitted or rated for testing.

## Validation

- `node scripts/test-vocab-xp.cjs`: authoritative conversion/cap, zero-valued metrics, save retry, response loss, ownership, immutable event IDs, concurrent duplicate requests.
- `node scripts/test-math-problem-xp-api.cjs`: server-issued problems, answer checks, ownership, preview isolation, capped receipts and failed award retry.
- `node scripts/test-learning-xp-api.cjs`: student-scoped receipts, missing/invalid assignment, unearned/earned and unavailable states.
- `TEST_DATABASE_URL=... node scripts/test-learning-xp-db.cjs`: isolated local PostgreSQL; historical one-time backfill, original dates, both assignment formats, draft exclusion, retries/retakes, submission/award atomicity, standard/Honors caps and function privileges.
- Full TypeScript, targeted ESLint, style and brand checks.
- Browser verification uses the actual completion component and actual game-score API against a synthetic database. Production student UI remains behind login; production records and function permissions are checked directly.
