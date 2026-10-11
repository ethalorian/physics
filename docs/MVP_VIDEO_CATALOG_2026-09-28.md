# MVP Physics uses the shared video catalog

Both active classes, MVP Physics and 26-27 MVP Physics, now use program `physics` and retain their CPA track, rosters and names. The switch covers 38 students; none is concurrently enrolled in a Trades class.

Only these individual video lessons are open in either MVP class:

- Video 2: Kinematics: the language of motion (`eaa95227-1bc7-41e8-af7c-192bdedc8303`).
- Video 3: Position & displacement (`fc67d63d-a011-426b-b9f3-fd8f1ea7f501`).

Video 1 and videos 4–8 are not open. Other classes' release windows are unchanged. Students use the existing concept map, individual lesson reader, XP and mastery-evidence workflow. Class pacing starts at video 2 in Unit 1. MVP Engineering remains in Trades.

All 34 lessons in `proj-1` through `proj-4` are unpublished and excluded from active catalogs and release controls. Their records, 25 saved responses and one submission are preserved. Project Physics is removed from new-class/program selectors and rejected by class assignment and roster-import APIs. Historical identifiers remain readable. The teaching-plan picker omits the retired project units. Old library links with `program=projects` now resolve to Physics; the selected class's current program takes precedence.

The atomic data update is recorded in `scripts/mvp-video/switch-catalog.sql`; it was applied on 2026-09-28. It checks class, lesson and catalog counts before mutation. Re-running resets the selected windows' opening times and pacing start date, so it is not a startup migration.

Verification:

- Production queries confirm both class programs, exactly videos 2 and 3 open, zero published project lessons, and preserved response/submission counts.
- 20 teacher workflow scenarios, including retired-catalog rejection and independent video releases.
- 37 lesson access/review scenarios and 8 video XP boundary checks.
- TypeScript and style/brand audits pass; changed-file ESLint has zero errors (one existing unused-variable warning in roster import).
- Actual components in a local browser fixture: an old MVP Project Physics URL opens the Physics video library, program choices omit Project Physics, and the student concept map shows exactly two open lessons with the other six unavailable. This fixture does not replace production data/access checks.
