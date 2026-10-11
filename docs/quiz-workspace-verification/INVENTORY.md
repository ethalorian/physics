# Quiz inventory and management — 2026-10-07

Deployed to production on 2026-10-07 at the user's request. No live quiz deletion was performed.

## Behavior

- Inventory status views with counts: active, drafts, needs review, archived, removed drafts, all.
- Search title/instructions; intersect status, type, unit, target, activity, grading mode, due-date state, and inclusive creation-date range. Sort by creation/update/due date, title, or review count.
- Each inventory row shows class, unit, question/point totals, actual saved-work count, pending reviews, and dates. Export the current inventory to CSV.
- Select published/archived quizzes for bulk archive/reopen. Confirmation names each eligible quiz; partial failures report which operations failed.
- Manage panel: rename, edit draft questions, open student work, copy/assign, edit published due date, archive/reopen, recover removed drafts, and permanent deletion.
- Permanent deletion previews saved work, immutable attempts, reviews, unfinished review drafts, and retained copies. Exact-title confirmation and a current impact fingerprint are required. A new save/review invalidates the confirmation.
- Database deletion is one transaction. It removes the assignment, student work, attempts, quiz grades/feedback, review drafts, and its generation job. Copies retain their contents with the source reference detached. Teacher-recorded mastery history remains append-only (M-1); the confirmation explicitly explains that it remains.
- The new RPC is security invoker, granted only to the existing server service role. API routes enforce teacher ownership and block mutations while viewing another teacher. No browser role receives RPC access.

## Validation

- TypeScript check, targeted ESLint, style audit.
- 13 filtering, evidence, CSV, and cross-section library unit tests.
- New inventory API integration checks: role/teacher scope, read-only mode, strict input, rename, stale confirmation, removed drafts, scoped deletion.
- Existing workspace, draft deletion/Undo, and due-date API regression suites.
- Real PostgreSQL 14 database with the project's quiz tables/FKs and RPCs: owner checks, preview counts, stale work/review protection, immutable snapshots during rename, service-role deletion, preservation of copies and mastery, removed-draft purge, public execution denied, and rollback of every deletion if an unexpected foreign-key dependency blocks the final delete. Fixtures were rolled back.
- Browser: unused-work filter, rename, bulk archive/reopen, exact-title deletion button validation, desktop/mobile layout. Browser used synthetic data; permanent removal was tested through the isolated database and API tests.

## Production release

- Applied `supabase/migrations/20261007124800_quiz_inventory_management.sql` to the existing PhysicsAPP project (`ymszffulqmkqgvhioege`). Supabase recorded migration `20261007130648_quiz_inventory_management`.
- Confirmed the function uses invoker security, only the server service role can execute it, and all 8 existing quiz assignments remain. A read-only preview against an existing quiz returned valid dependency counts.
- Built an isolated release from the exact current production source (`dpl_GQRpCZdcbn92x9MZSs8iZL4uUDqG`) plus 22 quiz-related files. Verified the other 3,591 production source files remain byte-for-byte unchanged. No unrelated working-tree edits were included.
- TypeScript and style/brand audits passed against the isolated release.
- Production deployment: `dpl_FzV9tanUMv7H6EAGF9DTAEkU5ug6`, using Vercel CLI 59.15.1. The staged production build reached READY and was promoted after smoke checks.
- Vercel confirms `www.antocciphysics.com` resolves to this deployment. The live sign-in page returned HTTP 200 with matching deployment assets and build ID `2zFac9jzIG2HP_OF7gZNT`.
- Staged inventory and management API routes returned the application's JSON HTTP 401 response without a teacher session. The new management route also returned the expected JSON HTTP 401 on the custom domain after promotion.
- The live quiz-center URL loads and redirects to the normal school-account sign-in screen in the agent browser. Authenticated teacher interactions were validated with synthetic local fixtures; no authenticated live classroom mutation was attempted.
- Rechecked the production database after promotion: all 8 quiz assignments remain.
- Live entry point: https://www.antocciphysics.com/admin/control-room?class=990c215f-6dfd-47c1-97be-85d286e8574c&view=quizzes
