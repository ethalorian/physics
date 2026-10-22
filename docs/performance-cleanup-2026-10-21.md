# Performance and legacy lesson cleanup — October 21, 2026

The cleanup removes the retired lesson interface and unnecessary work from frequently used screens. Current Physics lessons, interactive notebooks, creative reflections, Trades workshops, authorization, and saved student evidence remain supported.

## Source and recovery

Work was performed in `work/student-choice-release/app`, the latest deployed source, rather than the older Desktop checkout. Before editing, 2,785 deployed application, script, and migration files were verified against the backup; 3,796 other release files also matched the live manifest. Backup and detailed evidence are in the adjacent `performance-cleanup-2026-10-21` directory. No database migrations or student-record changes were made.

## Changes

- Removed 174 unused files (2,035,805 bytes; 36,837 lines): retired unit 1–8 block libraries, their obsolete seeds, the rejected PhysicsPathView interface, and unused administration, lesson, assessment, and vocabulary components.
- Removed the generic legacy lesson reader and its navigation queries. Current readers retain their existing saving/submission components. Historical snapshots have a compact read-only fallback so earlier submissions remain reviewable.
- Removed the unused global StudentActivityProvider. It fetched activity summaries, activity history, submission information, and roster data without a consumer. Lesson-view telemetry remains local to lesson pages.
- Coalesced overlapping focus, visibility, and restored-page refresh events; pending home requests are no longer repeatedly cancelled and restarted by those events.
- Deferred the simulation catalog until the launcher opens. Ordinary route navigation no longer repeats the launcher permission request. Loading, retry, identity changes, and access revocation are handled.
- Limited home lesson-body queries to open assignments; removed duplicate access/window reads and an unused simulation side-quest query; started independent requests together.
- Filtered retired Physics lesson bodies in Supabase before transferring the catalog to the server. The existing current-lesson predicate still performs the final check.
- Grouped saved answers and drafts once by lesson when calculating completion, avoiding a full rescan for each lesson.
- Batched live-class response and lobby-membership checks. The controlled 12-pulse/12-lobby fixture uses 9 database reads instead of 30 and returns identical invitations, without exposing salts or confusing another student's responses.
- Updated the unused-source audit to recognize browser fixture imports and framework entry points, avoiding false orphan reports.

## Measurements and verification

A read-only production query found 167 Physics lesson bodies totaling 1,637,193 serialized bytes, of which 36 current lessons total 219,768 bytes. Filtering these queries avoids roughly 86.6% of that body transfer. This is a payload measurement, not a claim that the whole application is 86.6% faster. Per-student home requests narrow the set further to open assignments.

Checks passed:

- TypeScript and lint for changed TypeScript files.
- 25 focused catalog, lesson completion/workspace, and reflection tests.
- 14 lesson-library regression checks, including creation and current metadata.
- Before/after home and invitation API comparison with fictional data, plus empty assignments, another student's responses, and query-failure cases.
- Browser checks for initial loading, tab return, route navigation, pending requests, and simulation search/error/retry behavior.
- Actual Physics and Trades reader saving, failed-save retry, submission locking and reload; retired reader removal and historical read-only snapshots.
- Creative reflection upload/writing, draft recovery, failed-save retry, submission locking, teacher snapshot and PDF download, including mobile layout.
- Supabase accepted the exact PostgREST filter in a read-only request. Anonymous access returned no lesson rows, as expected under access controls.
- Unused-source audit: 1,841 source/script files checked, zero unreachable candidates.

The reflection browser fixture was updated to select the visible “Side by side” view before checking review text; the earlier assertion targeted a hidden panel.

## Remaining findings

- The latest release workspace is separate from the older Git checkout on the Desktop. Consolidating the active source and release history is worthwhile, but copying this release over that dirty checkout would risk unrelated work.
- Local disk space fell to approximately 173 MB during a failed local build. That can slow local development and prevent compilation; it does not establish the cause of hosted-site latency. This run's failed build cache was removed. The full build was moved to Vercel.
- Supabase advisors reported indexing and RLS optimization opportunities, including duplicate indexes. These were not dropped or rewritten blindly: advisor counts do not establish which indexes are needed by real traffic, and permission changes deserve separate targeted verification.
- Retired database lesson rows and shared response tables remain intact for historical work and referential integrity. The active readers and catalog no longer offer the retired lesson experience. Shared response primitives are still used by current lessons, reflections, live questions, and Trades.
- No production request-latency percentile benchmark was available. The improvements are supported by reduced requests, query counts, payload volume, and preserved behavior; classroom-scale latency should be measured after publication.

## Release

A production-configured deployment was staged with domain promotion disabled: `dpl_9dtdCYdTMB23Rm1rN1NCxBDVzX6U` (`physics-ppsew0ozo-ethalorians-projects.vercel.app`). The full production build is READY. Protected staging checks returned 200 for sign-in, 401 for all three changed APIs without an application session, and 404 for development login. No error/fatal log groups were returned in the initial 15-minute project query. All deployed application files match the reviewed source; only two local test fixtures were updated after upload. Published after Craig’s explicit approval. The live domain now points to the exact tested deployment. Nine live HTTP checks passed, including the release identity in the sign-in HTML, protected APIs returning 401, disabled development login returning 404, and the unchanged brand asset. Signed-in browser checks passed for the 15-video lesson library, simulation search, current lesson preview, side-by-side layout, and temporary preview response saving; no browser errors were captured. No real student answers were created or changed. The deployment-specific error/fatal log scan returned no groups after publication. Detailed results are in the adjacent evidence directory. The prior live release is `dpl_FTXoUvJsPAQ4dS8fHpbeEaMrNo99`; it remains the rollback reference.
