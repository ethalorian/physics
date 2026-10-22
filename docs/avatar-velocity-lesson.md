# Avatar-led Day 3: Velocity

The existing `AssignmentWorkspace` Watch / Work / Side by side experience now contains three manga motion labs in Parts 1, 2 and 4. The lesson retains all 17 existing question IDs, responses, objective checks, independent questions, and Create/Evaluate DOK 3 design-and-defend tasks. There is no new assessment model, automatic rating, XP reward or migration.

- Part 1: choose one-meter steps within −5 to +5 m; compare traveled distance with signed displacement, inspect the ordered path, and solve the 7 m / +1 m challenge.
- Part 2: replay the same saved walk, change seconds per step, scrub time, or try a 3 m out-and-back example. Position interpolates between steps; distance accumulates through reversals. Averages are undefined at time zero. The example replaces the shared walk, which remains visible in Part 1.
- Part 4: adjust the existing starting position and signed velocity, match the four original targets, and run or scrub the avatar together with a graph cursor. The ruler and graph both cover −20 to +30 m, the complete reachable range for the allowed controls over ten seconds. Position is never visually clamped to the old 0–10 m graph range.

A saved manga character sits at a wooden desk until entering an experiment. One experiment is active at a time. Returning to the desk reveals the teacher's explanation. The teacher portrait uses the shared authored coach snapshot, matching other classroom scenes. Customization opens a separate tab through the shared link. Missing portraits use the shared setup fallback; teacher previews use the canonical sample student.

New scene text and controls have English, Spanish, French, and Brazilian Portuguese copies; English is primary. Text stays in HTML/SVG, with dynamic numerical values isolated for browser translation. Existing question prose remains English and browser-translatable.

Persistence continues through the existing assignment POST/version flow: the route uses `walker`; graph controls and successful targets use `graph`/`matches`; optional practice predictions and seconds per step use numeric `explorers` entries. Playback time, running state, language and desk position are per-visit UI state. Playback causes no per-frame API writes and pauses when leaving Work/Side by side, hiding the browser tab, returning to the desk, or entering read-only mode. Reduced-motion preferences remove decorative stride/position transitions; playback can also be inspected by scrubbing.

Readable lesson slugs remain staff previews in production; student work uses assigned UUID URLs. Verification uses the fictional local fixture, never real student answers. The fixture supports a 390px `/phone-preview?path=/interactive-assignments/day-3-velocity` route.
