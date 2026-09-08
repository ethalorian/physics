# Trades opening-cycle content

Published on 2026-09-08: five authored opening lessons and seven corrections to later Unit 1/2 lessons. Lesson IDs, slugs and existing captured-response block IDs were preserved. No student grades, enrollment or course-program assignments were changed.

`lessons.json` contains reviewed content overrides. `gen-trades-lessons.py` loads these instead of reconstructing those twelve lessons from the original Word packets. The generator also reapplies the three target statement corrections and slope math correction in `metadata.json`. Metadata records the published ten-term vocabulary set; the generator does not recreate that set.

The `previousUpdatedAt` values record the pre-update snapshot used for the initial guarded publication. They are provenance, not current timestamps for replaying updates. Re-read live content and compare before subsequent writes.

Validation: `npx tsx scripts/test-trades-opening.ts` checks document structure, required scaffolds, target links and student answer-key filtering. `node scripts/test-trades-opening-browser.mjs` renders all five opening lessons using the real renderer, checks embedded images, saves/reloads a synthetic exit answer locally, and tests offline slide navigation. This does not validate authenticated production access or production response persistence.

Teacher-plan JSON files were updated locally but not deployed. For teaching now, use the PDFs in `MVP ETF Planning/Tomorrow Ready/output`. Full original live content is backed up in `Tomorrow Ready/build/live-before.json`. The original Word/PDF packets are not corrected editions.

The teacher still needs to identify the Trades class before program assignment and student-access verification. Units 3–6 remain a content-build backlog.
