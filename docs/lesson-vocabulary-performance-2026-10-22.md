# Lesson and vocabulary performance

The baseline was production deployment `dpl_BXD64R1aBjJgAYhgLjCiGivsJftV` at www.antocciphysics.com. Measurements used successful authenticated GETs with the existing staff session, sequentially, without changing student work or grades.

## Findings and changes

- Vocabulary loaded independent check, checkpoint, review, practice, student and rating data serially. These now run concurrently after resolving the authorized tasks and active roster. Each paginated stream retains its ordering, limits and filters. Request-local indexes replace repeated scans of whole-class evidence.
- Home used the full vocabulary report although it only consumes assignment dates and completion. It now requests `?view=summary`, returning exactly those completion/quiz values while skipping unused practice, rating, review and student-name reads. The full vocabulary reporting response remains available and unchanged.
- Lesson access fetched all 186 published bodies before keeping 68 current lessons. It now identifies current IDs using metadata and fetches only their bodies. SQL aggregate measurements show body data falling from 2,072,790 to 764,200 bytes (63.1%). The additional metadata request is not included in that body-byte reduction. Historical rows are retained.

The full vocabulary staff response contained 147 tasks, 459 progress entries and approximately 3.3 MB of decoded JSON. Paginating the full staff reporting interface remains a possible later improvement; this release preserves that interface's contract.

## Verification

`scripts/test-lesson-vocab-performance.cjs` verifies fictional student, teacher and admin scope, archived courses, removed roster members, quiz answer privacy, choice exemptions, latest evidence selection, more than 1,000 checks and 500 practice events, error propagation and empty results. When `PERFORMANCE_BASELINE_ROOT` points to the saved pre-change source, it also checks full-response and lesson-catalog equality. Summary responses must match the corresponding fields of the full response. The fixture observed six independent staff reads in flight instead of one; artificial delays are not live performance measurements.

TypeScript, targeted ESLint, vocabulary mastery API regression and notification regression checks passed. Production build and post-publish measurements are recorded separately with the release evidence.

## Measurement limits

Vercel samples are filtered by deployment ID, production, GET and HTTP 200. They include warm/cold starts and incidental traffic; they are not a controlled classroom load test. Browser reload measurements include automation, rendering and network overhead, especially when rendering a multi-megabyte JSON response; they are not Core Web Vitals. The signed-in account is staff. Student privacy and behavior are covered by fictional fixtures, not writes through real student accounts.

A temporary direct REST profiler could not authenticate with the local service credential; no timings from it are used. The production application uses its existing Vercel configuration. Supabase aggregate queries and deployed request metrics supplied the database-size and live timing evidence.

Existing Supabase advisors include duplicate indexes, mutable function search paths and permissive RPC grants. They were not treated as proof of these request bottlenecks or changed speculatively. References: [duplicate indexes](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index), [function search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [RPC grants](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). No schema, access-policy, student-record or XP changes were made.

The release source is now a separate Git checkout based on the original repository's latest local commit. This incorporates previously published releases and cleanup that had not reached Git, while preserving the original Desktop checkout's unrelated uncommitted work.
