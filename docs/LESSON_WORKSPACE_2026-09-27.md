# Lesson workspace and teaching journey

Implemented September 27, 2026, following the September 26 teacher-journey audit.

## Teacher workflow

Start in **Classes** or **Lessons**. A lesson opens a shared workspace at `/admin/lessons/[id]` with **Prepare**, **Student preview**, **Teach**, and **Student work**. The workspace shows the selected class, publication status, class access, and whether a presentation is running.

- **Prepare:** teacher plans, activity/material inventory, presentation setup, class access, and permission-gated editing. Previous versions retain their original saved work.
- **Student preview:** disposable answers and simulated submission using the selected class's reader settings. CPA and Honors resolve targets from the filtered document in the same order as the real reader. Preview links cannot silently enter another student activity.
- **Teach:** searchable lesson selection grouped by unit, current open lessons, recent lessons, and a classroom-screen preview before launch. Publication, class access, and live presentation remain separate states.
- **Student work:** existing scoped review tools retain the lesson and class. Calendar pacing is explicitly separate from the selected lesson.

Primary navigation uses Classes, Lessons, Student work, and Resources. Teaching staff can browse the catalog without curriculum-edit rights. Search opens the lesson workspace. Class and lesson preferences are account-scoped and validated by destination APIs; preferences never grant access. Running sessions have a Resume teaching action.

## Teaching modes and displays

**Rehearse** uses local state and the existing projector and student reader renderers. Teachers can advance slides, try a simulated poll, inspect student-follow behavior, and switch projected content. It creates no presentation session, saves no student work, and changes no ratings.

**Present slides only** opens a presentation surface on the current device without a student session. Cross-device control uses live teaching.

**Teach with student participation** uses the existing class-associated presentation service. Starting a session does not change student release windows.

The remembered display choice distinguishes:

1. **Control a classroom computer:** existing second-window projector connection and iPad controller. Connection guidance and projector confirmation remain available.
2. **Mirror this iPad:** presentation-only content, touch slide navigation, blackout, timer, polls, and projected lesson activities. Teacher notes, rosters, and private tabs are not rendered. Refresh preserves this surface. Ended or disconnected sessions stay on a safe screen. Returning to private controls requires the teacher to indicate that mirroring has stopped.

Supplementary slides are identified when they have no matching student section. Both display setups use the same lesson document and existing presentation renderers.

## Student-account inspection

**View student account** replaces the misleading staff-home shortcut and the account-menu entry that previously only changed navigation chrome.

The teacher selects an authorized class and an enrolled student. A GET-only API verifies class scope and membership before reading work. It applies the real student's lesson authorization and content filtering, then returns saved responses, newer drafts, submission state, returned feedback, target ratings, reader settings, language support profile, and assigned trade. The reader uses snapshot props; saving, drafts, submissions, and live presence are disabled.

This is a read-only view of the student's lesson experience. It does not impersonate their login, simulate other account areas, or access unsynced work on their device. Closed lessons display the student's actual access restriction rather than bypassing it.

## Teacher-plan relationships

The optional `BlockDocument.teachingPlans` field stores `{ unitId, day }` references to the existing plan collection. A lesson can reference several days; a day can reference several lessons. Editors manage these references in Content and save them through the existing optimistic-concurrency lesson save.

Historical daily lessons retain a default only when a matching plan exists. Concept lessons do not infer a teaching day from catalog numbers such as 102. Unlinked lessons display “No teacher plan is linked” and a unit-plan link inside Prepare. Old invalid lesson/day deep links return to the workspace. Plan pages expose their associated lessons, including references across units.

This is additive JSON metadata. No database migration, content duplication, release-window change, or historical response rewrite is required.

## Verification

- Production build passed, including style and brand audits, type checking, and generation of 327 static pages. Existing warnings elsewhere in the repository remain; the changed sources pass ESLint without warnings.
- 9 focused tests in `src/lib/lesson-workspace.test.ts`: target order and track filtering, explicit plan relationships, historical fallback, reference preservation/validation, and isolated rehearsal state.
- 11 API checks in `scripts/test-lesson-journey.cjs`: role and roster boundaries, actual access restrictions, filtered content and saved work, drafts, feedback, reader/support profiles, fail-closed database errors, and read-only presentation preflight.
- 32 existing behavioral regressions in `scripts/test-lesson-access-review.cjs` passed.
- Browser checks used actual client components with synthetic local API fixtures. They covered catalog-to-workspace class context; CPA/Honors preview targets; temporary submission; rehearsal polls, results, and student follow; disabled snapshot answers; multiple plan links; computer connection guidance; iPad-sized layout; projected activities; refresh in mirrored mode; and safe finish/exit.
- The fixture request log confirmed no writes for disposable preview, rehearsal, or student-account inspection. Live-mode tests affected only the in-memory fixture session.

## Release status and device acceptance

Deployed September 27, 2026 alongside the assignable Units and Dimensions notebook. See `LESSON_NOTEBOOK_RELEASE_2026-09-27.md`. Existing unrelated working-tree changes were excluded from the isolated release.

Physical iPad Safari, AirPlay/HDMI behavior, classroom-computer placement, actual projector acknowledgement, loss of network, popup permissions, and device handoff still require hardware acceptance. A browser viewport check does not establish physical-device compatibility. The application cannot detect whether AirPlay mirroring has actually stopped, so the exit screen relies on the teacher's explicit action.
