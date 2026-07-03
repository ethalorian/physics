# Unit 1 Lesson Decks — App Integration Handoff

For: physics-classroom app (content-block architecture, `UnifiedLessonViewer`, Supabase).
Source of truth for the decks lives in the design project; this folder's `export/Unit 1 Lesson Decks/` contains the deployable artifacts.

## 1. The artifacts

21 self-contained HTML files (one per lesson day, plus `Unit 1 - All Lesson Decks` hub). Each file:

- Works offline in any modern browser — sims, animations, keyboard nav, print-to-PDF all inlined (~370 KB each).
- Built-in **classroom timer**: chip top-right (visible to students, large type), teacher panel with 1/2/5/10-min presets + custom minutes, pause/clear, `T` key toggle, amber warning at 10 s, red pulse + chime at zero. Lives in the deck shell, so it works identically in every deck and in fullscreen/presenter mode.
- 1920×1080 slides in a `<deck-stage>` web component that auto-scales to its container.
- Speaker notes embedded per slide (`data-speaker-notes` on each `<section>`).
- Hub file's links work if all files stay in one folder with their current names.

Deploy: copy into app static assets, e.g. `public/decks/unit-1/`, optionally slug-renamed (`day-05-predicting-position.html`). Renaming breaks only the hub's links, not the decks.

## 2. Launch integration (lesson page)

- Add a `deck` content block (or extend `sim_embed`): `{ type: 'deck', src: '/decks/unit-1/day-05-….html', title: 'Day 5 — Predicting Position' }` — first block of each lesson's `BlockDocument`.
- `BlockRenderer` maps it to a "Present" launch card. Gate visibility with the existing `teacher_emails` role pattern (students see lesson blocks, not the presenter card).

## 3. Presenter mode / second screen

- **Preferred: second window, not iframe.** `const w = window.open(deckUrl)` on the Present click; teacher drags to projector + F11. Dashboard keeps the `w` handle for postMessage.
- **Auto-placement (Chrome/Edge):** Window Management API (`getScreenDetails()`, one-time permission) can open the deck window directly on the external display, fullscreen. Firefox/Safari: fall back to drag + F11.
- **Iframe fullscreen** also works (`allow="fullscreen"` + `requestFullscreen()` on the button's user gesture) but fullscreen lands on whichever screen the browser window occupies — fine for single-screen use.
- **Slide position is in the URL hash.** `…day-05.html#4` deep-links to slide 4 (0-indexed hash); resume-where-left-off is a plain bookmark. No API needed.
- **Speaker notes via postMessage.** `deck-stage` broadcasts the current slide's notes; dashboard/presenter window listens and renders notes + slide number in a side panel. This enables PowerPoint-style presenter view: clean slides on projector, notes on laptop.
- Teacher onboarding note: OS display mode must be **Extend**, not Mirror.

## 4. Deck content conventions (for anything consuming the files)

- Every slide: `<section data-label="…" data-speaker-notes="…">`. Footer carries a packet cross-reference (`→ PACKET · DAY N — …`) and slide counter (`U1 · 04/09`).
- Slide types per deck: Title → Do Now (warm-up, 5 min) → Today's Target → activity/sim slides → honors slide (where the day carries one) → Exit Ticket · Rate Yourself with a **TONIGHT** homework strip.
- **Homework is two-tier** on the strip: Hewitt reading (all students) + honors beat in lavender (justify paragraphs / displaced practice, Days 1, 3, 4–10, 12, 14 per the lesson plans).
- **MATH MOVE cards** (math-literacy spine, `Math-Literacy-Spine-Panel.md` codes): QE1 on Day 5, SM1 on Day 8, GV2+QE4 on Day 11–12, SM2/QE2 on Day 13. Each shows the 3-step move, a worked example with that day's numbers, and the Marzano 1-2-3 anchor line — these are the slide-side hooks for `math_competency_records` evidence (`evidence_source='warmup'`-style scoring moments).
- **Interactive sims** (all inlined): TwoStringSim, InertiaPushSim, WalkSim, GraphMatchSim, SlopeExplorerSim, AreaSim, VectorDecompSim, TipToTailSim, WindowSim, AccelSim, EquationPicker, RearrangeSim, TableclothSim, FBDBuilderSim, FmaLabSim, LinearizeSim, DeflectionSim, NetForceSim, TugOfWarSim, InclineSim, FrictionSim, RopeSim, SelfAssessSim, TrajectorySim. Sims are display-only (no data capture); capture stays in the app's `block_responses` layer.

## 5. Update loop & extending to other units/courses

Decks are authored as `.dc.html` sources in the design project against a shared shell (`deck-stage.js`) and shared sim libraries; the export files are compiled bundles. To change content: edit the source deck, re-export the bundle, replace the file in `public/decks/`. Do not hand-edit the bundled files.

The system is unit-agnostic: any future unit or course deck authored to the same conventions (documented in the design project's `CLAUDE.md`) produces the same artifact shape — one self-contained HTML file per lesson, same `deck` content-block, same launch/presenter/notes/timer behavior. App-side, adding a new unit is only: drop files in `public/decks/<unit>/` + add the deck blocks to those lessons' `BlockDocument`s. Nothing else changes.
