# LESSON SYSTEM RULES — Antocci Physics Classroom

Drop this file at `physics-classroom/docs/LESSON_SYSTEM_RULES.md` and reference it from the repo's `CLAUDE.md`
(`See docs/LESSON_SYSTEM_RULES.md before touching lessons, blocks, present, lobby, mastery, or SEI.`).
Every rule is written as a MUST / MUST NOT / SHOULD so Claude Code can check work against it. Rule IDs are
stable — cite them in PR descriptions (`Implements L-3, E-2; respects M-1`).

> Source: Claude Design project *Teacher role experience rework* → `design_handoff_lesson_system/LESSON_SYSTEM_RULES.md` (2026-09-03). Copied verbatim into the repo per the handoff README. Implementation status is tracked in the Claude project doc `claude/Physics-Classroom-App-Decisions.md`.

---

## 0. North star

**One BlockDocument, three faces, one evidence pipeline.**
A lesson is a `BlockDocument` (`content_blocks`). The student reader, the projector (Present), and the group
lobby are *presentation layers* over the same blocks. Every capture — checkpoint, lobby artifact, live poll,
self-rating — writes the same `block_responses` row, tagged with a target and an evidence source, and the
teacher alone turns evidence into `mastery_records`. Language support is data on the block, not teacher habit.

---

## A. Architecture (A-*)

- **A-1** The `BlockDocument` schema in `src/data/content-blocks.ts` is the single source of truth. New faces
  MUST NOT introduce a parallel content model (no "slide JSON", no "lobby task JSON"). If a face needs data,
  add an optional field to the block.
- **A-2** Schema changes are **additive only**: new optional fields, new tables, new views. Never rename or
  remove an existing block field or `block_responses` column. Existing lessons must load unchanged.
- **A-3** `paginateBlocks` remains the sectioning algorithm. The stepped reader, Present's auto-slides, and the
  lobby's "moments" all derive from its pages. A page = a section = a candidate slide.
- **A-4** Server-side filtering stays server-side: `filterDocumentForViewer` (honors/CPA), deck-block stripping
  for students, lesson windows (`lesson-windows.ts`). A face MUST NOT re-implement gating on the client.
- **A-5** Feature flags, per class (`courses.lesson_experience: 'classic' | 'stepped'`,
  `courses.present_live_layer`, `courses.lobby_launcher`). Both readers must render the same document; a class
  can flip back mid-unit with zero data migration.
- **A-6** Keep the existing hooks as the only I/O path: `useBlockResponses` (evidence), `useSectionProgress`
  (progress), `SubmitLessonButton` / `/api/lessons/submit` (lock), `LessonActivityTracker` (activity). New UI
  wraps them; it does not fetch around them.
- **A-7** Styling follows `docs/DESIGN_SYSTEM.md`: semantic tokens only (no hex outside canvas art), gold =
  reward only, sage = success, rose/`--viz-down` = act, no idle animation, `prefers-reduced-motion` honored.
  Serif display (`Source Serif 4`) is permitted for lesson headlines only; UI stays Inter.

## B. Blocks (B-*)

- **B-1** Every block MAY carry (optional, additive on `BaseBlock`):
  `targetId?: string` · `xp?: number` · `gate?: boolean` · `lobbyReady?: boolean` · `sei?: SeiScaffold`.
- **B-2** A capture block (`capture: true`) SHOULD carry `targetId`. The builder warns when it doesn't; the
  Control Room shows "untargeted" evidence in its own bucket rather than dropping it.
- **B-3** `gate: true` means the section cannot be advanced until the block is complete (`isBlockComplete`) and,
  for auto-checkable blocks, correct. Gating is a **class setting** (`gateCheckpoints`) that the block flag
  opts into; when the class setting is off, gates degrade to the existing soft nudge.
- **B-4** `xp` is awarded once per student per block via the existing XP award path on first *complete*
  save; never on re-save, never on lobby re-submit.
- **B-5** Checkpoint feedback is authored per wrong option (`options[].feedback`) and names the misconception.
  Generic "try again" is not acceptable for `question` blocks used as gates.
- **B-6** `lobbyReady: true` marks a block that renders well at group scale (one artifact per group). Default
  true for `gewa`, `sketch`, `sentence_frame`, `data_table`, `observation`, `question`, `transfer_prompt`,
  `concept_exercise`; false for `marzano`, `self_assessment`, `exit_ticket` (individual by design).

## C. Student reader — stepped sections (S-*)

- **S-1** Hybrid navigation: scroll within a section, step between sections. Position persists via the existing
  `lesson-page:{id}` key + `/api/lessons/sections`; follow-mode may override position, never the persisted value.
- **S-2** The rail shows: done / current / locked. Locked = a gated block earlier is incomplete. Locked sections
  are still readable if `gateCheckpoints` is off.
- **S-3** Section header = eyebrow (kind) + serif headline + one context line. No duplicated prompt (a block's
  prompt renders once).
- **S-4** Help/mini-lesson content (`worked_example`, `callout`, `procedure`) renders as a **drawer** whose
  default open state follows the student's mastery on the section's target: open for Not yet / refresh,
  collapsed for Almost / Got it. Never removed, always re-openable.
- **S-5** Pinned bottom bar: Back · gate note (names the missing thing) · Next/Submit. Submit wraps
  `SubmitLessonButton` and keeps the 409 lock-until-reviewed behavior.
- **S-6** The Done screen shows: what was auto-checked, what awaits rating, XP earned + pending, and the
  **calibration read-back** (MC-3) once a teacher rating exists.
- **S-7** Vocabulary popovers (`GlossaryTerm`) match Tier 2 and Tier 3 terms from the lesson's vocab set
  (`/api/lessons/{id}/vocab`) — one source, no duplicate term lists.

## D. Present — projector face (P-*)

- **P-1** Slides come from the day's `deck` block (`/public/decks/...`) when one exists, otherwise auto-generated
  from sections (one page → one slide). Teachers may curate: `deck.slideMap?: { slide: number; section: number }[]`
  is the only override; it never changes the deck file.
- **P-2** The deck opens in a second window (`openPresenterWindow`); the live layer talks to it via the
  postMessage channel in `docs/Deck-Integration-Handoff.md §3`. Present MUST NOT iframe-embed decks inside the
  student reader.
- **P-3** Live layer components: response bars (per `question` block), reveal, lock responses, activity timer,
  "N of M saved" counters, blackout (B), laser (L), speaker notes (from `data-speaker-notes`).
- **P-4** Student devices in **follow mode** move to the section matching the current slide; a student can
  break away by tapping the rail. Follow state is a presence ping, not persisted progress.
- **P-5** A live poll answer is evidence: it saves a `block_responses` row with `evidence_source: 'live_poll'`.
  It is low-stakes and appears in the Control Room as "quick rate".
- **P-6** Slide typography scales with the slide container (container queries or a fixed 1920×1080 stage scaled
  by transform), never with the viewport.

## E. Evidence pipeline (E-*)

- **E-1** `block_responses` gains additive columns: `target_id`, `evidence_source`, `confidence`
  (`'sure'|'unsure'|null`), `role` (lobby discourse role), `response_mode` (`'text'|'sketch'|'audio'|'label'`),
  `scaffolds_used text[]`.
- **E-2** `evidence_source` vocabulary (closed set): `lesson_checkpoint` · `exit_ticket` · `lobby` · `live_poll`
  · `warmup` · `practice` · `transfer`. Add to the enum in one place (`src/lib/evidence.ts`); never free text.
- **E-3** Self-checks (`autoCheck`, poll correctness) are feedback and sort keys. They MUST NOT write
  `mastery_records`.
- **E-4** Group artifacts (lobby) write one row **per member** with the shared `session_id` and each member's
  `role`. The Control Room shows the artifact once with all names and rates per student.
- **E-5** GEWA blocks with a MATH MOVE code also call `math-spine-server.recordEvidence` with
  `evidenceSource: 'lesson'`.
- **E-6** Every write is optimistic in the UI and append-only on the server (existing pattern). No client
  ever updates a `block_responses` row except lobby submit's own one-per-session upsert.

## F. Mastery (M-*)

- **M-1** `mastery_records` is teacher-rated only, append-only, on the 1-2-3 scale, roster-scoped by
  `teacherCanAccessStudent`. Unchanged. No face, flag, or AI path may write it.
- **M-2** `/api/mastery/suggest-rating` is a suggestion. Its system prompt MUST include: judge the physics, ignore
  grammar/spelling/brevity, consider `scaffolds_used` and `response_mode`.
- **M-3** The Control Room queue gains an `evidence_source` filter and a "quick rate" affordance (one tap per
  student) for `live_poll` items. Group items show role + the algebra trail for GEWA.
- **M-4** Everything that reads mastery today (grid, ladder, Day Board "needs you", Observatory heat, growth
  chart) reads the same table. New surfaces read, never duplicate.

## G. Metacognition (MC-*)

- **MC-1** Student self-ratings (`marzano`, `self_assessment`) stay in `block_responses`. Never in
  `mastery_records`.
- **MC-2** New view `mastery_calibration` joins latest self-rating vs latest teacher rating per (student,
  target): `delta` ∈ {-2..2}. Computed, not stored twice.
- **MC-3** The calibration read-back appears on the Done screen and the student dashboard only **after** a
  teacher rating exists. Copy is coaching, not judgment: names the gap, names one concrete check
  ("could I explain the step that tripped my group?"), offers re-rate.
- **MC-4** Class calibration row in the Class Cockpit mastery card: % calibrated / over / under, with the
  target where over-rating clusters and one suggested sequencing move.
- **MC-5** Additional metacognition captures (all `block_responses`): predict-before-observe on hook checkpoints;
  one-tap confidence on every checkpoint; one-line role reflection at lobby debrief (+5 XP). Wrong + sure is the
  misconception flag surfaced to the Observatory.
- **MC-6** Self-rating opens **after** the individual exit ticket is submitted when a lobby ran that day (prevents
  the "group got it right so I got it" inflation).

## H. Lobby (L-*)

- **L-1** Launch from anywhere staff-facing with **L**; the drawer pre-fills class, day, current section, and the
  section's `lobbyReady` blocks. Existing `/api/lobby/sessions` creates the session; `lobby_sessions` gains
  `lesson_id`, `block_id`, `target_id`.
- **L-2** Grouping uses `grouping.ts` unchanged (near_peer / random / matched, median banding, remainder
  absorption). Add one option: balance by `language_profile` for language-heavy tasks.
- **L-3** Roles and talk moves come from `discourse.ts`. Roles rotate per session; the student's role card and
  stems render on device during Working and Debrief.
- **L-4** Submit keeps the passphrase gate (`phrase_completed_at`). The artifact carries `role` and lands per
  E-4.
- **L-5** Three phases only: Forming → Working → Debrief. Debrief always offers "call on Reporter" and ends with
  Collect (writes evidence, logs roles, awards role XP) before returning to slides.
- **L-6** Pre-authored lobby moments live in lesson plan data (`src/data/*lesson-plans.json` →
  `lobbyMoments[]: { section, blockId, minutes, debriefQ, then }`), not hard-coded in UI.

## I. SEI — language support (SEI-*)

- **SEI-1** `BaseBlock.sei?: { visual?, prompt_l1?, frames?[level], wordBank?, labelBank?, talkFirst?, modes?,
  tier2Terms? }`. Scaffolds are **data on the block**; renderers read them, teachers don't improvise them.
- **SEI-2** A capture block MUST have a visual (own figure/diagram/sim, or `sei.visual`). The builder blocks
  publish without one.
- **SEI-3** Tier 2 academic words (flat, steady, claim, prove, increase) get the glossary popover, not just Tier
  3. The lesson vocab set is the single term source (`LessonVocabView` data).
- **SEI-4** Home language is primary-language *support*: English stays primary; L1 rendering is one tap; cognates
  inline. Governed by `courses.translation_enabled` (existing) and `language_profile.l1_default`.
- **SEI-5** Every explain/justify moment offers a frame and word bank. Frames are tiered by level
  (forced-choice → open + because → starter only). Optional to the student, never required.
- **SEI-6** Oral before written: `talkFirst` adds a 60 s partner rehearsal before the box opens. Lobby roles are
  the oral-language engine.
- **SEI-7** Multiple response modes (`text | sketch | audio | label`) are first-class and rate on the same
  rubric. The Control Room drawer renders all four.
- **SEI-8** Scaffolds render by `language_profile.wida` (1–6) with per-block teacher override. Students can
  always turn a scaffold **on**; the system never forces one off.
- **SEI-9** Prompt and rubric are identical across levels. Only language load varies. Mastery never penalizes
  language errors (see M-2).
- **SEI-10** `scaffolds_used` and `response_mode` log with every response so the Observatory can disaggregate
  by language profile as a curriculum signal, never as a student label.
- **SEI-11** Claude may **draft** frames, banks, cognates, and L1 renderings from a prompt; the teacher
  approves. Same assist-never-decide pattern as `suggest-rating`.

## J. Content authoring (C-*)

- **C-1** Builder validation before publish: capture blocks have `targetId`; gated blocks have per-option
  feedback; SEI-2 visual present; Tier 3 terms exist in the vocab set; every lesson has an `exit_ticket` or
  `transfer_prompt`.
- **C-2** Lesson plans (`*lesson-plans.json`) are the source for lobby moments and Present speaker notes when a
  deck lacks them. Do not fork plan text into block copy — reference by day.
- **C-3** Decks are compiled bundles; never hand-edit. Change the source deck, re-export, replace in
  `/public/decks/<unit>/`, update `lesson-decks.ts`.

## K. Observability (O-*)

- **O-1** New Observatory signals read only existing tables + the additive columns: misconception (wrong+sure
  clusters by target), calibration drift, scaffold dependence (mastery by `scaffolds_used`), lobby efficacy
  (target delta after lobby vs. without).
- **O-2** Observer role sees every Observatory screen read-only; no action controls render.

## L. Definition of done (per feature)

A lesson-system PR is done when:
1. Classic reader still renders the same `BlockDocument` with no visual change (flag off).
2. `npm run typecheck` passes with the additive types; no existing block fixture changed.
3. Evidence written by the feature appears in the Control Room queue with the correct `evidence_source`.
4. No path other than `/api/mastery/records` writes `mastery_records` (grep-verified).
5. Design tokens only; `prefers-reduced-motion` verified; 44 px minimum targets on Chromebook width (1366).
6. Rule IDs cited in the PR description.

---

## Implementation order (suggested)

1. **Schema + flags** (A-2, A-5, E-1, E-2, MC-2, SEI-1) — additive migrations, enum module, views.
2. **Stepped reader** behind `lesson_experience` (S-*) — reuse hooks; add gate + drawer + Done screen.
3. **Evidence tagging** (B-2, E-3–E-6) — targetId on existing blocks for Unit 1–2; Control Room filter (M-3).
4. **Lobby launcher** (L-*) — drawer, pre-authored moments for Days 1–5, per-member artifacts.
5. **Present live layer** (P-*) — postMessage bridge, polls → live_poll evidence, follow mode.
6. **Metacognition** (MC-3–MC-6) — calibration read-back, Cockpit row, confidence tap, role reflection.
7. **SEI** (SEI-2–SEI-11) — sei{} on Unit 1 blocks, language_profile, level dial, response modes.
8. **Observatory signals** (O-1).

## Prototype references (in `prototypes/`)

- `Lesson Experience.dc.html` — stepped reader + Present (gate/teacher tweaks)
- `Interactive Lesson - Day 3.dc.html` — Compose (deck ↔ sections) · Student · Present on the real Day 3 deck
- `Lobby Launcher.dc.html` — drawer · projector board (forming/working/debrief) · student device with GEWA
- `Lesson System Blueprint.dc.html` — system map, evidence flow, metacognition loop, parity checklist
- `SEI in Blocks.dc.html` — eight principles, block anatomy, level dial, per-block map + schema

Open any prototype in a browser (they load the sibling `support.js`). They are design references, not code
to copy; implement in the codebase's Next.js/Tailwind/shadcn stack per `docs/DESIGN_SYSTEM.md`.
