# MVP Engineering curriculum reset

The previous Trades sequence has been replaced by a complete project sequence centered on vocational mathematics. The course starts with each student's tape measure and pocket graph-paper notebook and uses ordinary school supplies and approved school spaces.

## Authored scope

- 6 phases, 36 core meetings at 110 minutes: 66 instructional hours. This is an adaptable sequence, not a verified school-year calendar.
- 36 student lessons, each with Brief, Measure, Plan, Make, Test, and Explain stages.
- Three selected digital responses per meeting. Drawings, full calculations, field notes, prototypes, and inspection records remain in the physical notebook/on the workbench.
- 36 matching teacher plans with preparation, timed sequence, worked vocational math, individual exit and answer key, acceptance criteria, support, and extension.
- 24 practical learning targets, 6 phase Knowledge targets for job vocabulary, and 6 performance tasks. Teachers observe tool use and drawings directly; digital completion is not a mastery rating.
- Printable directions for every job; the existing verified Day 1 teacher/student PDFs are included.

## Sequence

1. Measure and make (jobs 01–06): fitted tray, school survey, full-size layout, covering estimate, change order, replacement template.
2. Lay out and estimate (07–12): equal centers, scale plan, cutting allowances, competing quotes, discrepancy inspection, buildable job package.
3. Support and strengthen (13–17): folded beam, span investigation, braced frame, support layout, bearing area.
4. Route and move (18–22): level reference, slope, dry service bay, elevation change, flow rate.
5. Heat and electrical systems (23–30): envelope takeoff, heat comparison, thermal revision, low-voltage light, series/parallel paths, fault diagnosis, power/energy, coordinated system model.
6. School improvement (31–36): brief, survey, design/calculation, estimate/schedule, prototype/inspection, individual defense and handover.

The first two jobs are baseline observations: independent, with cue, or not observed. Later projects retain individual measurement, math, product, and reasoning evidence. Existing grading policies are not automatically replaced.

## Materials and pacing

For the 15 enrolled students, start with 8 pair stations (one student can join a rotating pair): approximately 45 sheets of paper, 8 scissors, 8 straightedges/folder edges, shared tape and pencils, plus personal tapes/notebooks. Prepare one sample tray and print one double-sided instruction sheet per pair if desired.

Jobs 01–17 need only ordinary school supplies, book supports, light identical classroom objects, and school access. Reserve flexible meetings for skill clinics, longer build/retest cycles, notebook conferences, and absences rather than rushing the acceptance check.

Plan levels before jobs 18–19; a contained water setup before 22; thermometers, matching containers, safe warm water and trays before 24–25; approved low-voltage kits and meters if taught before 26–28. One teacher station can support rotations if complete pair kits are unavailable. Counts/purchases depend on checked inventory. Every equipment-dependent job includes a paper/supplied-data alternative, labeled honestly; it does not claim a performed practical test.

## Implementation

Source authoring: `scripts/trades-reset/course.py`; generator: `build.py`. Output includes database JSON, teacher plan JSON, SVG teaching diagrams, and printable student HTML.

New unit IDs use `trades-reset-1` through `trades-reset-6`; lesson slugs `mvp-job-01` through `mvp-job-36`; target slugs begin `tr26.`. Old lesson identities are retained and unpublished; old units are labeled Archive and moved after the new sequence. Existing records are not reused for new activities.

The reader now accepts explicit practical-stage boundaries without requiring a digital response. Empty practical stages do not display a false completion checkmark. Legacy lessons retain their original capture-based pagination. The teacher-plan menu and Word/PDF exports read the same new plan bundle.

Release scope: publish the whole new catalog for teacher use and open Job 01 only for MVP Engineering. Future jobs remain closed to students until released through existing class controls. No changes to Physics/Project Physics curricula or class membership.

## Verification

`scripts/test-trades-reset.ts` checks all documents, six-stage/three-capture structure, 110-minute totals, learning targets, SEI visuals/frames, response completion, teacher matching, assets, representative math, and legacy pagination.

`scripts/test-trades-reset-browser.cjs` uses actual React reader/teacher-plan components and synthetic APIs. It checks save/reload/submit locking, all 216 stages, image decoding, small-screen overflow, and teacher-plan rendering. Synthetic data never writes production student work.

Deployment is assembled from the exact current production source manifest, preserving unrelated work. Final release and database results are recorded separately after publication.
