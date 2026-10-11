# Trades course retirement — September 23, 2026

The original fieldhouse course (`trades-1` through `trades-6`) and the first project reset (`trades-reset-1` through `trades-reset-6`) are retired. Their 66 lessons were already unpublished, but remained in the teacher library under “Archive” unit names.

The catalog now omits those 12 units and their lessons from the library, search, lesson browser, authoring unit selectors, coverage studio, pacing, release picker, mastery unit picker, question-bank units, reading assignment units, and vocabulary assignment catalog. Both units and lessons are filtered before the library computes unassigned lessons, so retired lessons cannot resurface as orphans. Explicit unit IDs keep unrelated drafts, future Trades units, Physics, and Project Physics available.

All 36 current ETF lessons and 36 current vocabulary sets remain available. This change does not delete lesson, unit, target, vocabulary-term, assignment, progress, response, or assessment rows. Historical direct staff links and program tagging remain usable. A direct historical editor retains its own unit in the settings picker.

The 31 vocabulary sets in the original two authored units are archived and unpublished using the existing set lifecycle fields. They have no active vocabulary assignments. One has saved practice, competency, and game scores; those records and terms are retained. The first reset's vocabulary was already archived.

## Recovery

The retirement list is in `src/lib/retired-curriculum.ts`. Restoring a unit to catalogs is a deliberate removal of its ID from that list, followed by deployment. Publication and class release remain separate controls. Vocabulary-set availability can be restored by reversing only the set's `archived` and `published` fields. No student work needs reconstruction.

The pre-change lesson hashes, set metadata, and aggregate work counts are in the local operational backup `/private/tmp/trades-retirement/database-before.json`; the database remains the durable source of all original content. The deployment manifest is `/private/tmp/trades-retirement/release-manifest.json`. The release starts from the verified production deployment, not the shared working tree.

## Verification

`node scripts/test-trades-retirement.cjs` exercises the rendered library props, scoped and unscoped lesson API, command search, pacing loaders, and release picker against mixed current, retired, draft, orphan, and Physics fixtures. It checks historical program identity and that catalog reads leave the fixture records unchanged. Live verification checks the current ETF count and preserved database lesson hashes and work counts.
