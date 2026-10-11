# Textbook reading release verification

Release source: `/private/tmp/textbook-readings-release`.

Live deployment: `dpl_3BpWgnQW5jWK5j8FnjGEC1upuqKR` (`physics-2v0m3yesp-ethalorians-projects.vercel.app`), promoted successfully to `www.antocciphysics.com`. The remote production build completed with style audit, lint, and TypeScript checks. Live textbook navigation includes the reading entry point. All three reading GET endpoints return 401 when signed out. The initial production error/fatal log query returned no entries.

The production source manifest contains 1,859 SHA-1-verified files: 1,834 preserved baseline files, four updated integration files, and 21 new reading feature/test/documentation files. The baseline is the deployed double-size avatar release `dpl_EbU6AbuNCWgmWPgWfLfkz2miynXc`, not the unrelated edits in the shared checkout.

The live Supabase migration completed. All four new tables have RLS enabled and no anon/authenticated table access. All three RPCs are security invoker; only service_role has execution permission. Security advisors show no new warning for this feature. The intentional [RLS without browser policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) informational notices reflect the NextAuth/server-only access design. [Unused-index informational notices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) are expected on the empty tables before the first assignment.

Validation passed: four pure validation tests; disposable PostgreSQL lifecycle tests; API/auth/privacy checks; Chrome teacher and student workflow tests at 320/390/768/1366 widths; light/dark screenshots; type checking; targeted ESLint; style audit. The student home regression suite also passed at 1366/1024/768/390/320, including the exact doubled avatar dimensions. No test assignment was published to a real class.

Synthetic screenshot fixtures:

- `readings-verification/teacher-composer.png`
- `readings-verification/teacher-review.png`
- `readings-verification/student-mobile.png`
- `readings-verification/student-feedback.png`

Authenticated teacher/student workflow testing used synthetic fixtures. Live verification checks the deployment, public routes/assets, and signed-out access controls; it does not claim a real student submitted work on production.
