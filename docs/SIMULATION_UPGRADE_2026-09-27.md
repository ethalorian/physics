# Simulation investigations and mastery evidence

Entry: `/admin/simulations/activities` (also Resources and the simulation manager). Create a lesson draft, inspect it in the existing builder/student preview, then publish and open class access. Existing lessons have an Add a guided investigation panel filtered to their unit. Modes: required work, optional extension, whole-class demonstration.

Eight authored activities cover distance/displacement, constant velocity, acceleration, projectiles, force diagrams, collisions, measurement precision and graph slope. They use seven existing verified mastery target slugs. Vernier-related activities explicitly support graph interpretation and do not claim to assess physical instrument use.

Each assigned investigation stores a prediction, complete trial notebook, explanation and transfer answer through canonical lesson block responses. Each capture is tagged to its target and uses the existing 5 XP participation reward; retries use the existing reward deduplication. Matching published videos are included where available. Completion of a timed simulation does not generate a mastery rating. The teacher reviews actual evidence in the existing mastery drawer, with private look-fors, and saves a target rating or individual evidence scores. The existing atomic review RPC writes mastery history and student feedback. Submission snapshots remain authoritative; current private teaching guidance is read separately when the snapshot omits notes.

The shared simulation interface now gives the experiment scene, direct controls, large measurements, graph, data export, and investigation guide a consistent hierarchy. The route, constant velocity and acceleration scenes were redrawn around a survey rover, with further force-workbench and collision-cart improvements. This release does not redraw all 27 individual simulation engines. The force workbench has keyboard-accessible numeric force and angle controls. Motion sampling is exact at whole seconds; negative acceleration can reverse motion; collision readings no longer lose momentum when a cart reaches the viewport edge.

Optional simulation browsing defaults off for students. Teachers can enable it for their active classes. Assigned simulations continue through lesson publication, enrollment, track and class-window checks. Direct browsing, embedded lesson identity and activity creation are checked. The launcher uses published database inventory. Legacy simulation assignments remain available with a link to the canonical lesson workflow. The student lesson fallback no longer advertises an empty simulation catalog or confuses a failed request with an empty lesson list. The role experience selector explains why lessons are available, unpublished, track-filtered, scheduled, closed or unreleased.

Validation:
- TypeScript and style audit passed.
- 11 physics, authored-evidence and related regression tests passed.
- Simulation evidence/API fixture: all four captures in saved and submitted work; private criteria; no implicit rating; class owner and opt-in rules; assigned access; scoped history; failure handling.
- 89 role/session/availability assertions passed.
- Existing lesson submission/mastery flow: 11 scenarios passed.
- Existing evidence review API tests passed.
- Local isolated PostgreSQL tests passed for atomic feedback and ratings, idempotency, failed-write rollback, and service-only permissions. Fixtures rolled back.
- Browser: route presets return 7 m distance and 5 m displacement; force inputs produce balanced zero force; moving rover updates sensors; tablet layout and touch controls inspected; four responses and private criteria appear in mastery review and enable rating. Browser checks use synthetic data, not live student submissions.

Database migration: `20260928013246_simulation_exploration_access.sql`; verified all 16 existing classes remain opted out until a teacher chooses otherwise. No class assignments or student ratings were created by this release.

Release assembled from exact production source deployment `dpl_AqY2n67JtrVNWydYKiBVQ2hjwjV2`, preserving unrelated workspace work. Build/source and live smoke verification records are in `/private/tmp/simulation-upgrade-work`. Rolling back the app can leave the additive course preference column in place.

Deployed and promoted: `dpl_5YzmN4ov6LMxJNkeaJEDuPrAcf73` at `https://www.antocciphysics.com`. Verified READY, all 2,293 uploaded source files against the release manifest, 2,250 unchanged baseline files, four unchanged public assets, and all 19 staged and live route smoke checks. Live smoke checks are anonymous access-boundary checks; authenticated evidence and rating behavior was verified with the synthetic browser, API, and isolated database tests above.
