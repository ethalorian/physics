# Present as the classroom teaching tool

Audit date: September 7, 2026. Evidence: supplied screenshot, local implementation, read-only PhysicsAPP database queries, TypeScript, targeted lint, and the Present/Lobby regression script. This is not a completed two-device classroom rehearsal.

**Assessment: useful foundations, but not ready to be the primary tool for a whole class period.** The main missing capability is continuity: the teacher should be able to frame a lesson, ask questions, run a group activity, discuss the evidence, and resume teaching without rebuilding context in separate tools.

## Confirmed launch blockers

The screenshot’s lesson is `75c396af-e4cf-4d6d-8fcf-213feabe1cf9`, “Week 1 · Read the track · Describing motion / Leer la trayectoria · Describir el movimiento.” At audit time:

- It is **unpublished**.
- Its unit is `proj-1`, belonging to **Project Physics** (`projects`).
- The selected **CPA Physics · E** class belongs to **Physics** (`physics`), track `cpa`.
- Present and Lobby feature flags are enabled for that class.
- The lesson contains 45 stored blocks, one question block, and no authored deck block.

Either publication or curriculum mismatch is sufficient to reject launch. Publishing alone will not solve this pairing. Choose the intended curriculum before changing lesson publication or class assignment.

The screenshot also shows 20 sections, an approximately 108-minute remaining estimate, several day headings, repeated target cards, and generic “Your task” labels. This is a weekly lesson container being presented as a linear sequence. It needs a clear **today’s lesson** boundary for classroom use.

## Findings and teaching impact

| Priority | Finding | Why it matters in class | Required outcome |
| --- | --- | --- | --- |
| P1 | Launch returned one generic error for several access/content failures. | A teacher cannot recover quickly while students wait. | Name each blocker and offer a specific route to resolve it. Local diagnostics improved in this audit. |
| P1 | Present has no activity launcher; LobbyLauncher is mounted in AdminShell, with no current-section input. | The teacher must select the class, lesson, and activity again. | Launch the current block directly from Present with the class, target, and section already bound. |
| P1 | Student follow refuses to move past unsatisfied checkpoint gates. | Students who need the next explanation can remain on an earlier task as teaching moves on. | Explicit teacher-led mode permits viewing the current teaching section while preserving incomplete work and independent-work gates. |
| P1 | Class presentation eligibility does not check the student lesson-window gate used by the reader. | A teacher can start a published, matching lesson that students still cannot open. | Preflight class availability with the same window rules; provide an explicit open-for-class action. |
| P1 | Lobby creation navigates away to the lobby monitor. The live presentation has no lobby ID, phase, or return anchor. | Students and the teacher lose a continuous lesson flow. | Persist the presentation/activity association and resume the precise section after collection. |
| P1 | The lobby projector page displays only join instructions and a code. | The shared screen does not frame group work or support debrief. | Project forming, working, and debrief views with task, timer, talk moves, and next action. Keep teacher answers private. |
| P1 | Session replacement ends the old session before inserting its replacement. | An insert failure can end the working session without creating a new one. | Make replacement atomic/idempotent and test retries and multiple tabs. Not fixed by the local click guard. |
| P2 | Poll controls only offer choice questions in the current section. | Predictions, observations, sketches, and explanations are not represented as live teaching actions. | Show each current block’s valid action: ask individually, discuss, run simulation, launch group task, or collect exit evidence. |
| P2 | Auto slides render individual blocks with a read-only reader renderer in a scrollable container; notes are generic. | A block can be technically present but poorly framed or too dense for projection. | Projector-specific layout and a visible target, prompt, representation, and student action; preserve full content and language supports. Visually test dense blocks. |
| P2 | Authored decks without a slide map cannot provide exact follow anchors. | “Live” does not guarantee students follow the correct section. | Preflight mapping coverage and offer the generated lesson slides when mapping is unavailable. |
| P2 | L is used both for Present poll locking and for the global lobby launcher. | On a staff page mounting both, one key can trigger two actions. | A single shortcut owner, scoped to the active surface, with distinct shortcuts. |
| P2 | Live state is polled, but the teacher has no reliable joined/following/offline roster indicator. | “Students can follow” describes a capability, not whether the class is actually connected. | Show joined, following, working independently, saved, and disconnected counts with stale-state recovery. |
| P2 | Lobby lesson choices can include staff-visible drafts; plan moments can have a null block ID. | A launch can fail late or produce work detached from the exact lesson block. | Resolve launch choices server-side to published, accessible, concrete block IDs. |

Key source locations: `src/lib/present-server.ts`, `src/components/present/PresentLiveLayer.tsx`, `src/components/lessons/BlockLessonViewer.tsx`, `src/components/admin/LobbyLauncher.tsx`, `src/app/embed/present/[lessonId]/page.tsx`, `src/app/admin/lobby/[id]/present/page.tsx`, and the Present/Lobby API routes. Source comments describe intended behavior; findings above follow executable code.

## Proposed classroom experience

Keep one BlockDocument as the content source. The teacher console, projector, and student device show different views of the same lesson blocks and use the existing evidence pipeline.

| Lesson moment | Teacher console | Projector | Student device |
| --- | --- | --- | --- |
| Prepare | Select class and today's section range; check publication, availability, mapping, and activity readiness. | Preview the opening frame. | Existing lesson access. |
| Frame | Target, success criteria, agenda, launch control. | One target, driving question, and short agenda. | “Today we are learning…” and Follow class. |
| Model | Current/next preview, notes, representation, timer. | Large graph, demonstration, or worked example. | Matching section and optional language scaffolds. |
| Ask | Open question; see responses; lock; reveal; discuss. | Prompt first; answers only when deliberately revealed. | Answer and confidence through the existing response hook. |
| Collaborate | Launch this block; confirm grouping; monitor submissions. | Join → task and timer → discussion prompt. | Join, role, talk moves, shared task, and artifact. |
| Debrief | Choose a reporter/artifact, compare reasoning, collect. | Selected work and an authored debrief question. | Group reasoning, then brief individual reflection. |
| Close | Return to lesson; open individual exit check; view saved work. | Target revisited and exit prompt. | Individual evidence, then self-rating. |

Present should become a full teacher workspace with an agenda, current/next lesson moment, student readiness, and one main action for the current moment. A compact controller can remain useful when projecting, but the current 380px floating panel cannot carry preparation and a whole period's orchestration well.

Suggested first pilot: one 45–55 minute class, one target, one graph-based prediction, one demonstration, one linked group activity, one debrief, and one individual exit check. Timing is a proposal, not a change to the curriculum. The Physics versus Project Physics choice remains with the teacher.

## Local fixes completed

- Added typed launch results with specific unpublished, curriculum, track, access, and empty-content errors.
- Used the existing identity-alias helper and effective scope email for class eligibility.
- Displayed server launch errors in Present and guarded repeated clicks while a launch is pending.
- Reported failed live-control requests; End no longer clears the local session after a failed server request.
- Checked the error when ending a previous presentation before attempting replacement.
- Replaced the nonfunctional “No class (preview)” option with “Choose a class.” A genuine rehearsal mode remains future work.

These changes improve recovery; they do not complete integrated lobby launching, alter curriculum assignments, publish lessons, or deploy the application. Other lobby ownership checks still need alignment with the shared identity/scope rules.

## Build order and acceptance criteria

1. **Launch and recovery:** preflight uses the same access rules as students; no invalid pairing can start; retries cannot duplicate sessions; replacement is atomic; offline/error state is visible; a teacher-only rehearsal is separate from going live.
2. **Teacher-led lesson workspace:** select today's sections, show now/next and explicit student action, synchronize by block anchors, and preserve independent progress when following or breaking away.
3. **Integrated activity:** launch a concrete block in the current class, persist the association, send an in-lesson join action to students, project all activity phases, collect once per member, and resume the saved teaching anchor.
4. **Instructional polish:** curate the pilot lesson, improve projection typography and representation sizing, add useful authored notes and debrief prompts, and show participation at each moment.

Before calling this classroom-ready, rehearse with one teacher and at least two student accounts on the intended class: go live → follow → answer/confidence → lock/reveal → launch activity → group/role/passphrase → submit → debrief/collect → return → individual exit. Include a student behind a gate, an independent student, a reconnect, a blocked popup, and a teacher reload during an activity. Confirm correct evidence tags and no automatic mastery writes.

Preserve the lesson-system contract: A-1–A-4 (shared content and server filtering), A-6 (existing evidence paths), P-2/P-4/P-5 (projection/follow/polls), L-1/L-4/L-5 (linked activities and collection), E-4 (per-member evidence), and M-1 (teacher-only mastery). The local changes respect additive content and the existing evidence path.

## Validation completed

- `node scripts/test-present-lobby.cjs`: passed existing anchor, safe-key, progress, and poll rejection checks plus new launch publication/curriculum/alias/effective-scope/track/empty-content checks.
- `npm run type-check`: passed.
- ESLint on the three changed production files: passed.
- Read-only database checks confirmed the two screenshot launch blockers and enabled class flags.
- No production writes or live student sessions were created. Browser and two-device rehearsal remain outstanding; automated checks do not establish classroom usability.
