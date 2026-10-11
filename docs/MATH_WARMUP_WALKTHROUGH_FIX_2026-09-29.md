# Math warm-up walkthrough fix — September 29, 2026

The home page's math warm-up returned HTTP 500 in the student walkthrough. Production logs for `/api/math-spine/daily` showed `EXPERIENCE_READ_ONLY`: the new `math_daily_xp_status` RPC was missing from the walkthrough's reviewed read allowlist.

The production SQL definition of `math_daily_xp_status(uuid)` and its `student_xp_track(uuid)` dependency were inspected. Both are stable SQL functions containing only reads. The fix adds just `math_daily_xp_status` to the allowlist. Existing database permissions, student scoping, and write restrictions are preserved.

`node scripts/test-math-warmup-experience.cjs` exercises the real daily route, auth wrapper, XP helper, Supabase client, and database guard with synthetic identity and network fixtures. It reproduced the production 500 before the fix, then passed these five cases:

- Walkthrough loads an unissued daily task and XP totals without creating an instance.
- Walkthrough loads the immutable saved task without exposing its answer key.
- Task creation, submission, XP-grant, and unknown RPC writes stay blocked.
- A regular student session can still issue its daily task.
- A genuine database failure remains an error rather than reporting invented XP totals.

Additional checks: seven walkthrough security tests, eighteen math route tests, full TypeScript with a 6 GB heap, and scoped ESLint passed. The broader `test-role-experience.cjs` script has an existing failure in its lesson-availability fixture (`undefined` versus `Available`); it also fails on the unchanged production baseline.

Release is assembled from production deployment `dpl_AkeHX8YBwmS3rVyQ7RuTyexfhZ8N`, changing one line in `src/lib/experience-db-policy.ts` and adding the regression test. All 2,598 other baseline files are preserved. No migration or student-data change is needed. Release manifests and verification results are in `/private/tmp/math-warmup-fix-work`.

Live deployment: `dpl_CYBRfuBbnJVgSoyNnDHTpsdwk9n7`. The production build and source-manifest comparison passed, and the production alias points to this release. No error/fatal logs were returned for the new deployment during verification. The existing browser walkthrough was confirmed to show the original error before release. After the user reported an active class quiz, remaining verification used server-side checks; no quiz was opened, refreshed, or submitted. Quiz source files match the previous production deployment exactly.
