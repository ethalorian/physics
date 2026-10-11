# Current lesson choices — 2026-09-28

Only current lessons are selectable in instruction, catalogs, search, pacing, and the assessment center. Physics requires the physics-path presentation and learningPath metadata; current Trades lessons remain available. Retired curriculum remains excluded.

The review APIs no longer reintroduce older lessons because they have submissions or own learning targets. Unknown/historical work cannot manufacture inbox lesson choices. Old lesson query links clear the selection; explicit requests for that lesson in the rating work API return 404.

Mastery records, aggregated ratings, saved review history, original submissions, and lesson database rows are retained. No database writes or schema changes are required. Class release windows remain unchanged.

Removed the Previous versions collection, Earlier format selector, and Legacy curriculum disclosure. Current choices also apply to vocabulary lesson attribution, teaching plan lesson links, resumable presentation lists, home recommendations, workshop tools, and lesson counts. Existing reading/vocabulary assignments and their ratings are preserved.

Validation: full TypeScript check; ESLint on changed TypeScript files; style/brand audits; 42 lesson-access/review scenarios including old target ownership and retained historical rating aggregation; 20 teacher-workflow scenarios; evidence-review API checks; 9 focused unit tests. Read-only live catalog check found 140 physics rows, 9 with current learning-path metadata. Browser fixture verified stale lesson selection clearing, current lesson inbox, review drawer, retained mastery display, and no console errors.
