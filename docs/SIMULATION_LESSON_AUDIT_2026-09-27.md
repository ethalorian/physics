# Simulation and lesson assignment audit

Read-only audit requested September 27, 2026. No application code, publication settings, class releases, assignments, or student work changed.

Reviewed the source used for production deployment `dpl_AqY2n67JtrVNWydYKiBVQ2hjwjV2` in `/private/tmp/role-experience-release`, compared the principal files with the working repository, and queried aggregate production data. The supplied screenshot identifies a UI state, not a particular student or class. No authenticated student session was used to reproduce it, and no assignment was created or submitted during this audit.

**Recommendation**

Keep video instruction as the main concept sequence, with target browsing available. Use selected simulations as guided activities inside those lessons. Keep the wider collection as explicitly optional exploration. Consolidate assignment, progress, XP, and feedback into the existing lesson workflow rather than reviving the disconnected simulation assignment systems.

**What the screenshot actually represents**

The Simulations statistic counts lesson rows whose legacy `lesson_type` equals `simulation`. It does not count simulations in the library, simulation blocks inside lessons, or assigned simulation activities. Production currently has zero lessons with that legacy type, 27 simulation records, and 26 published simulation records. It also has 26 published lesson documents containing actual `sim_embed` blocks. Those documents belong to the earlier day/week lesson sequences; their publication does not establish that they are open to a particular class.

The new physics learning library is rendered only when the fetched lesson list contains recognized learning-path content. With no lessons, the component falls back to the older four-stat layout in the screenshot. The heading and subtitle continue to advertise videos and simulations. This gives an empty assignment list the appearance of an empty content catalog.

Student lesson visibility depends on publication, program, track, and class release windows. A never-released or future-scheduled lesson is omitted from the list. Production has 13 unarchived ACTIVE physics course records, of which four have at least one currently open published lesson release. Some course records may be administrative/test courses; this aggregate is not a diagnosis of the photographed account. The screenshot alone does not establish why this student has no visible lessons.

Evidence: `src/components/lessons/LessonBrowser.tsx:142`, `src/app/lessons/page.tsx`, `src/app/api/lessons/published/route.ts`, `src/lib/lesson-windows.ts`.

**Why assigning simulations is confusing**

There are three separate paths:

| Path | What exists | Gap |
| --- | --- | --- |
| Lesson builder | A Simulation embed block that selects a simulation; lesson response blocks and class release controls already exist. | The embed itself selects only a simulation slug. It has no activity-specific trial, preset, evidence requirement, or completion contract. Authors must assemble the surrounding task manually. |
| Simulation Assignments editor | `/admin/simulations/assignments` creates question sets associated with a simulation. | No class/student audience, learning-target picker, or ordinary class-release flow. The main simulation management page offers publishing, preview, and analytics, without linking this editor. Its picker hardcodes eight simulations. No current student UI consumer of its assignment/submission API was found in deployed source. |
| Class simulation assignment API | `/api/assignments/simulations` has a separate course/student assignment model. | No caller was found in deployed application source. It is not the API used by the editor above. Course relationship compatibility and an end-to-end save/load flow would need verification before reuse. |

Production contains zero `simulation_assignments`, zero `student_simulation_assignments`, zero `simulation_embedded_assignments`, and zero `simulation_assignment_submissions`. This does not mean there are no simulation activities inside released lessons; those use lesson records and lesson responses.

Evidence: `src/data/block-registry.ts:54`, `src/components/admin/LessonBlockBuilder.tsx:466`, `src/app/admin/simulations/page.tsx:203`, `src/app/admin/simulations/assignments/page.tsx:45`, `src/app/api/simulations/assignments/route.ts`, `src/app/api/assignments/simulations/route.ts`.

**Why the present simulations are not yet a coherent assignment experience**

- The shared simulation shell provides controls, readouts, data, graphs, and optional “Try this” guidance. Several completion configurations count elapsed time, interactions, or named actions. Some engines mark exploration complete from their own conditions. For example, constant velocity can report completion after collecting ten points. These events do not establish that a learner understands a target.
- Completion conventions are inconsistent: the shell emits `play`, while several configurations require `start`; engine completion can independently override the generic criteria. This needs normalization before any required simulation-completion gate is introduced.
- The lesson iframe carries a simulation slug, not the lesson/block/activity identity. Its message handler exchanges frame height, not trial evidence or assignment completion. Simulation activity records therefore do not provide a reliable bridge to this specific lesson task.
- Simulation completion and the separate simulation question submission endpoint do not themselves call the lesson XP flow. Normal lesson answers already use validated, target-linked response capture, database XP awards, and lesson progress recomputation. Reuse that path. Some existing lessons already contain questions alongside their simulations; preserve that work.
- The signed-in simulation launcher searches a static published catalog, while the simulation management page reads database publication settings. A future student visibility rule must apply consistently to both entry points.

Evidence: `src/components/simulations/lab/SimLab.tsx:83`, `src/config/simulationCompletionCriteria.ts:35`, `src/hooks/useSimulationCompletion.ts:58`, `src/app/simulations/constant-velocity/engine.ts:117`, `src/components/blocks/BlockRenderer.tsx:262`, `src/app/embed/sim/[slug]/page.tsx`, `src/app/api/simulations/activity/complete/route.ts`, `src/app/api/simulations/assignments/submit/route.ts`, `src/app/api/lessons/blocks/route.ts:19`, `src/components/simulations/SimulationLauncher.tsx:11`.

**Recommended work, in order**

1. Fix student orientation. Always use the current lesson layout, including when empty. Remove the legacy Simulations statistic and content-type filter. Show assigned/available lesson work, a clear next step, and an explanation when no lessons have been released. In the teacher role walkthrough, expose the reason a lesson is absent: no class release, future release, unpublished, program, or track. Do not show zero progress if loading failed.
2. Clarify optional exploration. Label the general simulation library as optional and separate from assigned work. Let teachers control whether it is available to a class. Audit the library and launcher together; changing one entry point must not imply that all access has changed. Preserve existing saved work and published lesson content during migration.
3. Add a guided activity option to the lesson builder. Teacher flow: choose target/video lesson → add a guided simulation activity → choose a reviewed template → edit instructions, controls/preset, trials and response prompts → preview → assign through existing class access. Make whole-class demonstration, required independent activity, and optional extension explicit teacher choices.
4. Keep the student task visible. Flow: watch → predict → run a focused trial → record evidence → explain/check understanding. Use the existing notebook style and touch-friendly controls. Keep the prompt, units, required evidence, save state, and next action readable beside/below the simulation; keep advanced controls optional. Each activity should work independently of owning a projector.
5. Use one record of work. Save predictions, measurements, graphs/sketches, and explanations against the lesson and target. Resume after reload. Show submissions and feedback in the normal teacher work queue. Show XP for defined saved responses/verified activity milestones, award once, and never award simply for opening a sim or leaving a timer running. Keep engagement XP distinct from mastery judgments; walkthroughs must remain read-only.
6. Pilot a small set before migrating the catalog. Start with distance versus displacement and velocity versus speed, aligned to the published video sequence. A later graph-scale activity can use a focused graphing tool once reviewed; do not imply a suitable assignable graph-scale simulation already exists. Validate each pilot on student desktop/iPad, teacher preview, projector presentation, save/resume, XP deduplication, and teacher review before broader release.

**Concrete first activity**

After the distance/displacement video: ask the learner to predict displacement for an out-and-back trip; run that trip; record total distance and final minus initial position with units; explain why distance can be positive while displacement is zero; answer a short transfer question. The lesson tells the student exactly what to do and gives the teacher the resulting evidence. Optional free exploration remains available separately if enabled.

The initial implementation should cover the misleading lesson fallback and one complete guided activity from assignment through student response and teacher review. Expanding the separate legacy editor alone would leave the central navigation, class access, evidence, and XP problems unresolved.
