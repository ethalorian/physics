# Reviewed Trades Units 1-2 continuation

The canonical 30 lesson documents used by `gen-trades-lessons.py` are in `../trades-opening/lessons.json`. This directory contains the 25 continuation lesson documents, their teacher authoring notes, the two completed cases, vocabulary publication metadata, and portable regression fixtures. `opening-correction.json` preserves an existing response ID while correcting the relationship between measurement spread and job tolerance.

Published to PhysicsAPP on September 7, 2026 (September 8 UTC): 25 full lesson revisions, one opening prompt correction, two existing mastery task prompts/rubrics, two target statements, and 30 new lesson-specific vocabulary sets (148 entries). Existing lesson/task IDs and capture anchors were retained. No student grades/responses were changed.

Run `npx tsx scripts/test-trades-course.ts` and `npx tsx scripts/test-trades-opening.ts` from the repository root. The browser fixture is `scripts/test-trades-course-browser.mjs`; it uses the locally bundled browser tooling and curriculum assets. It tests the block renderer and synthetic local response persistence, not production authorization.

`publish-metadata.json` records the reviewed vocabulary, target and task payloads; it is not automatically replayed by the lesson generator. Executed guarded SQL, pre-change snapshots, builders, PDF output and the current teaching handoff are in the MVP ETF Planning workspace under `Course Ready/`. Before any republish, compare current rows and preserve subsequent teacher changes. Do not blindly rerun the old timestamp-guarded publication.

Teacher-plan JSON is updated locally but has not been deployed. Use the PDF teacher guides until a scoped application release includes it. A Trades course assignment remains pending the exact class name. Four-dimension rubric descriptors are available; a separate digital four-dimension scoring workflow and letter-grade conversion were not added.
