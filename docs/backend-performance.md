# Backend performance — October 28, 2026

These backend optimizations preserve frontend source, API response bodies, database schema, grading writers, immutable submissions and release/idempotency logic. No production student work, grades or review drafts were written during verification.

## Request timing

`withAuth` and its role/enrollment wrappers now report `Server-Timing` for total handler time, authentication, effective-context resolution and the authorized handler. Individual reviews add `review_source`. `db_observed` measures completed reads at the instrumented pagination, role, membership and live-poll sites, including decoding. It is **partial database coverage**, and parallel database durations are additive; they are not the request's wall-clock database time. Total timing ends when the route produces its response, excluding streaming/body delivery and `after()` work. Immutable response headers are left intact.

Structured `[backend-timing]` logs sample 1% of ordinary responses and include every response taking at least 1,000 ms and every 5xx/uncaught failure. `BACKEND_TIMING_SAMPLE_RATE` accepts 0–1 and controls only the ordinary-response sample. Logs contain duration, operation counts, method, status and an allowlisted route label. They contain no student identity, email, query string, source key, answer or grade. Other routes use `/api/other`; extend the allowlist when investigating another route. Existing application error logs remain separate.

Use the same routes, roles, class sizes and warm/cold conditions when comparing p50/p95 before and after rollout. Watch 401/403/409/5xx rates alongside timings, and distinguish instrumentation coverage from a total database query count.

## Repeated lookups

Explicitly selected reads share an in-flight promise inside a single GET/HEAD invocation using Node `AsyncLocalStorage`. There is no process-wide user-data cache. Requests, concurrent users and nested native route invocations have separate contexts. POST/PUT/PATCH/DELETE do not memoize. Failed reads can retry; the memo is cleared before response completion and is disabled for deferred work.

The reusable reads are role grants, reading/class ownership scope and student memberships. Memberships are paginated and include course program/track, allowing enrollment, track, homepage program and lesson-window checks to share one query in wrapped requests. Memberships remain fresh on the next request. Owner keys include user ID, effective/real role and scoped teacher email. Server-rendered callers outside the API wrapper use fresh reads.

Existing enrollment semantics are deliberately retained: general enrollment, track and program checks include inactive links; lesson windows and live sessions require ACTIVE links. Honors and program precedence are unchanged. Membership rows have deterministic ID ordering. The production aggregate check found 298 membership rows, all ACTIVE, no missing course joins and no track values outside CPA/honors. This was a read-only transaction.

## Individual reviews and live polling

Individual reviews reuse the existing result providers with the requested student and source filters. Quiz, reading, interactive/simulation, vocabulary, daily review, lesson/video/reflection and live-response reviews skip unrelated providers. Math reviews now read one student's history while retaining multi-competency warm-ups, corrections and mission review items. Course ownership, active roster, publication/visibility and current-attempt checks remain in place. Ordinary Results and student-progress composition retain their existing behavior.

Choice menus still use cross-provider composition because their evidence, target mappings, optional work and missing-choice grades depend on it. This conservative fallback is intentional. Worksheet completion continues through its original controls. There are no changes to native grade/release writers or review-version signatures.

Live polling loads the pulse and its private salt in one query, strips the salt before responding, and runs lesson/pulse/help reads concurrently. Staff polls skip the unused student-membership lookup. Invitation polls share their enrollment read with the authorization gate.

## Verification

The comparison fixtures run the actual current and saved pre-change loaders against identical fictional, read-only database rows. Authentication and selected external dependencies are mocked. Counts below are fixture database operations, **not measured production latency**:

| Operation | Before | After |
| --- | ---: | ---: |
| Individual quiz review | 28 | 17 |
| Individual reading review | 25 | 14 |
| Individual math review | 28 | 15 |
| Student live poll | 6 | 5 |
| Student invitation poll, including enrollment gate | 7 | 6 |

Passed 18 backend checks covering concurrency/isolation, next-request freshness, failed reads, pagination, preview restrictions, auth failures, ownership/roster/attempt rejection, all review-provider families, exact quiz/reading/math review documents, ordinary Results equivalence, salt privacy and unchanged fixture data. The existing 16 source-adapter/action-plan checks, 16 review-model checks, actual review API release/resume/idempotency/revision fixture, homepage/invitation regression and lesson/vocabulary regression also passed. Full TypeScript, scoped source ESLint and diff whitespace checks passed. A runtime import graph of 548 client entry points and 973 reachable files found no imports of the changed server context/authorization modules.

Run the primary suite with `node scripts/backend-performance/test.cjs`. To repeat before/after comparisons, set `BACKEND_PERFORMANCE_BASELINE` to the saved `before` directory under Physics Curriculum Planning `outputs/backend-performance-implementation`. Existing review adapters need `NODE_PATH=./node_modules node scripts/review-desk/test-sources.cjs`; use `node --import tsx --test scripts/review-desk/test-model.ts` to avoid the sandbox's tsx CLI pipe restriction.

Release records, build logs and complete uploaded-source comparisons are kept under Physics Curriculum Planning `outputs/backend-performance-release/`. Each release uses the current live source baseline plus only the reviewed backend/test/document paths, preserving preexisting frontend edits. No migration or data reset is needed. Use the timing logs after rollout to quantify production latency and decide the next optimization; the separate XP aggregation, timeout, index, release-RPC and cron recommendations remain outside this phase.

## Results and student progress follow-up

The Results composer now owns a lazy lesson-input object for exactly one composition. Videos and lesson/reflection providers share published lesson documents, class windows, submission receipts, explicit review receipts, saved-response metadata and mastery-review metadata. Each provider still applies its original catalog/track rules and computes its own target carriers and pending queue. Shared lesson objects are not mutated. Reads remain paginated and bounded to 100 lesson IDs per request. Saved answers are still metadata-only; exact immutable submissions and evidence-version matches remain authoritative. The same object works for server callers outside the API request wrapper and never survives into another composition.

Quiz overview work reads omit mutable draft answers: with no choice-exemption inputs, the shared comparison's draft-answer presence flag cannot change the output. Immutable submission answers/snapshots remain loaded for all existing scoring and content-version checks. Native review loading still obtains the actual work and answers separately. Paper-receipt reads are limited to the requested roster/student. No grade calculations, response fields, write endpoints or frontend files change.

Results loads grading settings concurrently with providers. Student progress overlaps learning-history reads with link and prerequisite resolution, keeps existing warning order on failure, and deduplicates lesson-link IDs. Fixed `results_<provider>` timing spans identify slow providers without recording student or source identifiers. `/api/student-progress` now has its own allowlisted log label. Shared mastery reads use the existing instrumented pagination helper, expanding `db_observed` coverage; do not interpret a change in that partial count as an exact total-query comparison across releases.

The actual old and new loaders/routes produced identical JSON (excluding the generated timestamp) in fictional read-only comparisons covering numeric/letter/credit grades, half-points and zeroes, obsolete snapshots, current and returned work, archived assignments, exact-submission mastery, visibility, student/teacher access, terms/manual placement, prerequisite links, partial failures, more than 100 lessons and more than 1,000 saved responses. No mutation methods are supplied by the fixture. Existing review-release/idempotency/revision and source-provider regressions remain required.

Fixture operation counts: Results **41 → 34**, student progress **39 → 32**, and staff student-preview progress **39 → 32**. These are database calls in the fixture, not production latency claims. The intentionally large-draft fixture also verifies that draft-answer payloads are excluded; its byte reduction is not a forecast of normal production payload size.

Reproduce with `NODE_PATH=./node_modules RESULTS_PERFORMANCE_BASELINE="/absolute/path/to/results-performance/before" node scripts/results-performance/test.cjs`. Saved baseline source, fixture results, build logs and exact release comparisons are in Physics Curriculum Planning `outputs/results-performance/`. This phase requires no migration or student-record update. After promotion, compare normal warm/cold production traffic separately and use the new provider spans to identify the next bottleneck.

## Live polling lookups and stall diagnostics

Live-session reads now use nested inner joins to check the current student's ACTIVE course membership in the same query. Both relationship levels are inner joins; a matching active row for another student cannot grant access. Staff still see only their own sessions, including classless sessions. The existing student behavior for archived courses, result limit, ordering, help state, pulse answers and reveal visibility is retained. Joined membership data is never included in the API response.

Invitation polling reuses class name/section/archive metadata from its request-scoped enrollment read, removing the separate courses query. Inactive memberships still count for the original enrollment gate but do not create invitations. Archived and missing classes remain excluded. All membership pages are retained and class IDs are deduplicated. No permission or membership result is cached between requests.

A server-only database client preserves the existing service-role configuration and read-only preview fetch guard while timing three allowlisted read categories: roles, memberships and poll_sessions. `db_<category>` measures the full query through decoding. The optional `lookups` log field aggregates time to response headers, maximum time, errors, slow counts and the numeric Envoy upstream-service header. That header includes upstream processing and its network hop, not just SQL execution. Missing/invalid headers remain absent from upstream counts. No URL, filters, identities, response bodies, arbitrary headers or keys are logged. Every instrumented transport taking at least 500 ms or returning an error is logged, in addition to the existing request sampling rules. Late/background work cannot add timings to an already-finished response.

The scoped comparison fixture proves identical responses and one fewer handler database read for each idle poll: live 2→1, invitations 3→2. The fresh role read is outside those fixture counts and remains unchanged in production. Tests cover staff/student isolation, immediate role/enrollment changes, inactive and archived classes, pagination, pulse completions, failures, transport stalls, logging privacy and preview write protection. Run `POLLING_BASELINE="/absolute/path/to/polling-performance/before" node scripts/backend-performance/test-polling.cjs`. A production read-only SQL comparison also matched all 10 sampled session selections. These are query/contract checks, not measured production latency improvements.

This release changes no frontend, schema, student records, grading calculations or write endpoints. Evidence is in Physics Curriculum Planning `outputs/polling-performance/`.
